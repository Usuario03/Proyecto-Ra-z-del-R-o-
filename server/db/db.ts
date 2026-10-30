import pg, { type Pool, type PoolClient, type QueryResult } from 'pg';
import { httpErrors } from '../security/errors';

export interface QueryExecutor {
  query<R = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<QueryResult<R>>;
}

let sharedPool: Pool | null = null;

function resolveConnectionString(): string {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!url) {
    throw httpErrors.serviceUnavailable(
      'Falta configurar DATABASE_URL o DIRECT_URL en el entorno del servidor.',
    );
  }
  return url;
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

export function getDbPool(): Pool {
  if (sharedPool) return sharedPool;

  const connectionString = resolveConnectionString();
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch {
    throw httpErrors.serviceUnavailable('La URL de conexión a PostgreSQL no es válida.');
  }

  const useStrictTls = !isLocalHost(parsedUrl.hostname);
  sharedPool = new pg.Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX ?? 3),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 15_000,
    statement_timeout: 8_000,
    ...(useStrictTls
      ? {
          ssl: {
            rejectUnauthorized: true,
            servername: parsedUrl.hostname,
          },
        }
      : {}),
  });

  sharedPool.on('error', () => {});
  return sharedPool;
}

export interface TransactionOptions {
  isolationLevel?: 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  readOnly?: boolean;
  maxSerializationRetries?: number;
}

function isRetryableSerializationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === '40001' || code === '40P01';
}

export async function withTransaction<T>(
  work: (tx: QueryExecutor) => Promise<T>,
  options: TransactionOptions = {},
): Promise<T> {
  const isolation = options.isolationLevel ?? 'READ COMMITTED';
  const readOnlyClause = options.readOnly ? ' READ ONLY' : '';
  const maxRetries = options.maxSerializationRetries ?? (isolation === 'SERIALIZABLE' ? 3 : 0);

  const pool = getDbPool();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let client: PoolClient | null = null;
    try {
      client = await pool.connect();
      await client.query(`BEGIN ISOLATION LEVEL ${isolation}${readOnlyClause}`);
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      if (client) {
        try {
          await client.query('ROLLBACK');
        } catch {
          // Ignorar fallo secundario durante ROLLBACK
        }
      }
      if (attempt < maxRetries && isRetryableSerializationError(error)) {
        await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
        continue;
      }
      if (isRetryableSerializationError(error)) {
        throw httpErrors.conflict(
          'La operación coincidió con otra actualización concurrente. Por favor intenta de nuevo.',
        );
      }
      throw error;
    } finally {
      client?.release();
    }
  }

  throw httpErrors.serviceUnavailable();
}

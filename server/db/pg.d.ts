declare module 'pg' {
  export type QueryResultRow = Record<string, unknown>;

  export interface QueryResult<R = QueryResultRow> {
    rows: R[];
    rowCount: number | null;
  }

  export interface PoolClient {
    query<R = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
    release(err?: Error | boolean): void;
  }

  export interface PoolConfig {
    connectionString?: string;
    max?: number;
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
    statement_timeout?: number;
    ssl?: {
      rejectUnauthorized?: boolean;
      servername?: string;
      ca?: string;
    };
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<R = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
    on(event: 'error', listener: (err: Error) => void): this;
    end(): Promise<void>;
  }

  const pgDefault: {
    Pool: typeof Pool;
  };

  export default pgDefault;
}

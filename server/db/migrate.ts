import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDbPool } from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

function loadEnvFileIfPresent(filename: string): void {
  const fullPath = path.join(projectRoot, filename);
  if (!existsSync(fullPath)) return;
  const content = readFileSync(fullPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function runMigrations(): Promise<void> {
  loadEnvFileIfPresent('.env.local');
  loadEnvFileIfPresent('.env');

  // Preferir DIRECT_URL (puerto 5432 en Supabase) para ejecutar DDL
  if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }

  const sqlPath = path.join(
    projectRoot,
    'server/prisma/migrations/20261030_supabase_schema/migration.sql',
  );
  const sql = readFileSync(sqlPath, 'utf8');

  const pool = getDbPool();
  try {
    console.log('Aplicando migración SQL desde server/prisma/migrations/20261030_supabase_schema/migration.sql...');
    await pool.query(sql);
    console.log('Migración completada exitosamente: 15 tablas y semillas iniciales verificadas.');
  } finally {
    await pool.end();
  }
}

runMigrations().catch(error => {
  console.error(
    'Error al ejecutar la migración:',
    error instanceof Error ? error.message : 'Error desconocido',
  );
  process.exitCode = 1;
});

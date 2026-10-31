import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDbPool } from './db';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const migrationsRoot = path.join(projectRoot, 'server/prisma/migrations');

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
      (value.startsWith("'") && value.startsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function discoverMigrations(targetFolderArg?: string): Array<{ folder: string; sqlPath: string }> {
  if (!existsSync(migrationsRoot)) {
    throw new Error(`No existe el directorio de migraciones: ${migrationsRoot}`);
  }

  const allFolders = readdirSync(migrationsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const available = allFolders
    .map(folder => ({
      folder,
      sqlPath: path.join(migrationsRoot, folder, 'migration.sql'),
    }))
    .filter(item => existsSync(item.sqlPath));

  if (available.length === 0) {
    throw new Error('No se encontraron archivos migration.sql en server/prisma/migrations/.');
  }

  if (!targetFolderArg) {
    return available;
  }

  const exactOrPartial = available.filter(
    item => item.folder === targetFolderArg || item.folder.includes(targetFolderArg),
  );

  if (exactOrPartial.length === 0) {
    const names = available.map(a => `  - ${a.folder}`).join('\n');
    throw new Error(
      `No se encontró ninguna carpeta de migración que coincida con "${targetFolderArg}".\nMigraciones disponibles:\n${names}`,
    );
  }

  return exactOrPartial;
}

async function runMigrations(): Promise<void> {
  loadEnvFileIfPresent('.env.local');
  loadEnvFileIfPresent('.env');

  // Preferir DIRECT_URL (puerto 5432 en Supabase) para ejecutar DDL
  if (process.env.DIRECT_URL) {
    process.env.DATABASE_URL = process.env.DIRECT_URL;
  }

  const targetArg = process.argv[2]?.trim();
  const migrationsToRun = discoverMigrations(targetArg);

  const pool = getDbPool();
  try {
    console.log(
      targetArg
        ? `Ejecutando migración específica (${migrationsToRun.length}):`
        : `Ejecutando todas las migraciones en orden (${migrationsToRun.length}):`,
    );

    for (const migration of migrationsToRun) {
      console.log(`  -> Aplicando [${migration.folder}]/migration.sql ...`);
      const sql = readFileSync(migration.sqlPath, 'utf8');
      await pool.query(sql);
      console.log(`  ✔ Completada [${migration.folder}]`);
    }

    console.log('Todas las migraciones seleccionadas se ejecutaron exitosamente.');
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

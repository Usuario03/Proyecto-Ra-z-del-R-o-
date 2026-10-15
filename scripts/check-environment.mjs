import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const expected = readFileSync(path.join(root, '.nvmrc'), 'utf8').trim();
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const npmVersion = process.env.npm_config_user_agent?.match(/npm\/([^ ]+)/)?.[1];
const expectedNpm = pkg.packageManager.replace('npm@', '');
const problems = [];
if (process.versions.node !== expected) problems.push(`Node esperado ${expected}; actual ${process.versions.node}`);
if (npmVersion !== expectedNpm) problems.push(`npm esperado ${expectedNpm}; actual ${npmVersion ?? 'desconocido (usar npm run env:check)'}`);
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else console.log(`Entorno de referencia OK: Node ${expected}, npm ${npmVersion}.`);

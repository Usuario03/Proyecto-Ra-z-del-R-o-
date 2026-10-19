import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { checkServerIdentity } from 'node:tls';
import { spawnSync } from 'node:child_process';
import { buildConfig, runCheck, classifyError } from '../scripts/check-database-readonly.mjs';

// Identidades sintéticas, nunca configuración del equipo ni conexiones reales.
const ref = 'abcdefghijklmnopqrst';
const host = 'aws-0-us-east-1.pooler.supabase.com';
const env = {
  DIRECT_URL: `postgresql://postgres.${ref}:synthetic-password@${host}:5432/postgres`,
  DB_READONLY_EXPECTED_PROJECT_REF: ref,
  DB_READONLY_EXPECTED_HOST: host,
  DB_READONLY_TARGET: 'raiz-del-rio-dev',
};

test('configuración exige expectativa independiente y rechaza destinos ambiguos', () => {
  for (const change of [
    { DIRECT_URL: 'invalid' }, { DIRECT_URL: '' },
    { DB_READONLY_EXPECTED_PROJECT_REF: '' },
    { DB_READONLY_EXPECTED_HOST: '' },
    { DB_READONLY_TARGET: 'raiz-del-rio-demo' },
    { DB_READONLY_EXPECTED_PROJECT_REF: 'zyxwvutsrqponmlkjihg' },
    { DB_READONLY_EXPECTED_HOST: 'aws-1-us-east-1.pooler.supabase.com' },
    ...['6543/postgres', '5432/other'].map(suffix => ({ DIRECT_URL: env.DIRECT_URL.replace('5432/postgres', suffix) })),
    ...['?sslmode=disable', '?sslmode=require', '?options=-c%20default_transaction_read_only=off', '#fragment'].map(suffix => ({ DIRECT_URL: env.DIRECT_URL + suffix })),
    { DIRECT_URL: env.DIRECT_URL.replace(host, 'evil.example') },
    { DIRECT_URL: env.DIRECT_URL.replace('postgres.', 'other.') },
  ]) assert.throws(() => buildConfig({ ...env, ...change }));
});

test('TLS no acepta bypass URI y verifica certificado y hostname', () => {
  const config = buildConfig(env);
  assert.equal(config.connectionString, undefined);
  assert.equal(config.ssl.rejectUnauthorized, true);
  assert.equal(config.ssl.servername, host);
  assert.equal(config.ssl.checkServerIdentity, checkServerIdentity);
  assert.equal(config.connectionTimeoutMillis, 5000);
  assert.equal(config.query_timeout, 5000);
  assert.match(config.options, /default_transaction_read_only=on/);
  assert.match(config.options, /statement_timeout=5000/);
});

function fixture(failAt, overrides = {}) {
  const calls = [];
  const logs = [];
  const secretError = new Error(env.DIRECT_URL + ' CERTIFICATE PRIVATE');
  const client = new EventEmitter();
  client.connection = { stream: { encrypted: true, authorized: true, destroy() { calls.push('destroy'); } } };
  client.connect = async () => { calls.push('connect'); if (failAt === 'connect') throw secretError; };
  client.end = async () => { calls.push('end'); if (failAt === 'end') throw secretError; };
  client.query = async sql => {
    calls.push(sql);
    if (failAt === sql) throw secretError;
    if (sql.startsWith('SELECT')) return { rows: [{ health: 1, version: '17.11', read_only: 'on', ...overrides }] };
    return { rows: [] };
  };
  return { calls, logs, client, execute: (options = {}) => runCheck(env, { createClient: () => client, log: line => logs.push(line), ...options }) };
}

test('offline por defecto: no crea cliente ni conecta', async () => {
  const f = fixture();
  assert.equal(await f.execute(), true);
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.logs, ['PASS OFFLINE']);
});

test('lectura fija, rollback y cierre; salida solo estado/versión', async () => {
  const f = fixture();
  assert.equal(await f.execute({ connect: true }), true);
  assert.equal(f.calls[1], 'BEGIN READ ONLY');
  assert.deepEqual(f.calls.slice(-2), ['ROLLBACK', 'end']);
  assert.deepEqual(f.logs, ['PASS READ_ONLY PostgreSQL 17.11']);
});

test('fallos de conexión, BEGIN, SELECT, rollback y cierre nunca filtran errores', async () => {
  const success = fixture();
  await success.execute({ connect: true });
  for (const step of success.calls) {
    const f = fixture(step);
    assert.equal(await f.execute({ connect: true }), false);
    assert.ok(f.calls.includes('end'));
    if (step !== 'connect') assert.ok(f.calls.includes('ROLLBACK'));
    assert.match(f.logs.join(''), /^FAIL [A-Z_]+ UNKNOWN$/);
    assert.ok(!f.logs.join('').includes('synthetic'));
  }
});

test('TLS inválido y estado no read-only abortan sin éxito ni datos arbitrarios', async () => {
  const f = fixture();
  f.client.connection.stream.authorized = false;
  assert.equal(await f.execute({ connect: true }), false);
  assert.ok(!f.calls.includes('BEGIN READ ONLY'));
  for (const override of [{ read_only: 'off' }, { version: env.DIRECT_URL }, { health: 0 }]) {
    const g = fixture(undefined, override);
    assert.equal(await g.execute({ connect: true }), false);
    assert.deepEqual(g.calls.slice(-2), ['ROLLBACK', 'end']);
    assert.equal(g.logs[0], 'FAIL READ_ONLY READ_ONLY_CHECK');
  }
});

test('destino rechazado antes de crear cliente incluso con conexión solicitada', async () => {
  const logs = [];
  assert.equal(await runCheck({ ...env, DB_READONLY_TARGET: 'demo' }, {
    connect: true, createClient: () => assert.fail('no cliente'), log: line => logs.push(line),
  }), false);
  assert.deepEqual(logs, ['FAIL CONFIGURATION']);
});

test('CLI rechaza operaciones no permitidas antes de cargar configuración privada', () => {
  const result = spawnSync(process.execPath, ['scripts/check-database-readonly.mjs', '--seed'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), 'FAIL CONFIGURATION');
  assert.equal(result.stderr, '');
});

test('cierre colgado se acota y destruye transporte sin filtrar secretos', async () => {
  const f = fixture();
  f.client.end = () => { f.calls.push('end'); return new Promise(() => {}); };
  assert.equal(await f.execute({ connect: true }), false);
  assert.ok(f.calls.includes('ROLLBACK'));
  assert.ok(f.calls.includes('destroy'));
  assert.deepEqual(f.logs, ['FAIL CLOSE TIMEOUT LOCAL_DEADLINE']);
});

test('errores asíncronos del driver se capturan sin log crudo', async () => {
  const f = fixture();
  f.client.connect = async () => { f.client.emit('error', new Error(env.DIRECT_URL)); };
  assert.equal(await f.execute({ connect: true }), false);
  assert.deepEqual(f.logs, ['FAIL CONNECTION UNKNOWN']);
});

test('diagnóstico permite solo códigos conocidos, no infiere causa por fase', async () => {
  for (const [code, category] of [
    ['ENOTFOUND', 'DNS'], ['EAI_AGAIN', 'DNS'],
    ['ECONNREFUSED', 'NETWORK'], ['ECONNRESET', 'NETWORK'],
    ['ENETUNREACH', 'NETWORK'], ['EHOSTUNREACH', 'NETWORK'], ['EPIPE', 'NETWORK'],
    ['ETIMEDOUT', 'TIMEOUT'], ['28P01', 'AUTH'], ['28000', 'AUTH'],
    ['08P01', 'PROTOCOL'], ['08006', 'CONNECTION'], ['53300', 'CAPACITY'],
    ['57P03', 'UNAVAILABLE'], ['57014', 'QUERY_CANCELED'], ['42704', 'SETTING'],
    ['SELF_SIGNED_CERT_IN_CHAIN', 'TLS'], ['DEPTH_ZERO_SELF_SIGNED_CERT', 'TLS'],
    ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'TLS'], ['UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'TLS'],
    ['CERT_HAS_EXPIRED', 'TLS'], ['ERR_TLS_CERT_ALTNAME_INVALID', 'TLS'],
  ]) {
    const error = Object.assign(new Error(env.DIRECT_URL + '\nPASS READ_ONLY'), { code, detail: env.DIRECT_URL });
    assert.equal(classifyError(error), `${category} ${code}`);
    const f = fixture();
    f.client.connect = async () => { throw error; };
    assert.equal(await f.execute({ connect: true }), false);
    assert.deepEqual(f.logs, [`FAIL CONNECTION ${category} ${code}`]);
    assert.deepEqual(f.calls, ['end']);
  }
});

test('mensajes exactos conocidos sin código se traducen, nunca se imprimen', () => {
  for (const [message, expected] of [
    ['timeout expired', 'TIMEOUT DRIVER_CONNECT'],
    ['Query read timeout', 'TIMEOUT DRIVER_QUERY'],
    ['The server does not support SSL connections', 'TLS NOT_SUPPORTED'],
    ['There was an error establishing an SSL connection', 'TLS NEGOTIATION'],
    ['Tenant or user not found', 'POOLER TENANT_OR_USER_NOT_FOUND'],
  ]) {
    assert.equal(classifyError(new Error(message)), expected);
    assert.equal(classifyError(new Error(message + ' ' + env.DIRECT_URL)), 'UNKNOWN');
  }
});

test('unknown redacta códigos arbitrarios, mensajes maliciosos y propiedades anidadas', () => {
  for (const error of [
    null, undefined, env.DIRECT_URL,
    { code: env.DIRECT_URL, message: 'ENOTFOUND' },
    { code: 'XX999', message: 'unsupported startup parameter: options' },
    { code: 'toString', message: env.DIRECT_URL },
    { code: 'ENOTFOUND\nPASS READ_ONLY', cause: { code: '28P01' } },
    { code: { toString() { throw new Error('must not coerce'); } } },
    { get code() { throw new Error(env.DIRECT_URL); } },
    { message: 'SELF_SIGNED_CERT_IN_CHAIN ' + env.DIRECT_URL, stack: env.DIRECT_URL },
  ]) assert.equal(classifyError(error), 'UNKNOWN');
});

test('evento asíncrono conserva diagnóstico inicial y cleanup sin datos crudos', async () => {
  const f = fixture('end');
  f.client.connect = async () => {
    f.client.emit('error', Object.assign(new Error(env.DIRECT_URL), { code: 'ECONNRESET' }));
    throw Object.assign(new Error(env.DIRECT_URL), { code: '28P01' });
  };
  assert.equal(await f.execute({ connect: true }), false);
  assert.deepEqual(f.logs, ['FAIL CONNECTION NETWORK ECONNRESET']);
  assert.ok(f.calls.includes('end'));
});

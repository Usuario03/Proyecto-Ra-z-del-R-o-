import { readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { checkServerIdentity } from 'node:tls';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const TIMEOUT = 5000;
const HOST = /^aws-\d+-[a-z]{2}(?:-[a-z]+)+-\d\.pooler\.supabase\.com$/;
const REF = /^[a-z]{20}$/;
const SELECT = "SELECT 1 AS health, current_setting('server_version') AS version, current_setting('transaction_read_only') AS read_only";

// Only literal allowlisted outputs. Never serialize driver messages, causes or codes.
const ERROR_CODES = new Map([
  ['ENOTFOUND', 'DNS ENOTFOUND'], ['EAI_AGAIN', 'DNS EAI_AGAIN'],
  ['ECONNREFUSED', 'NETWORK ECONNREFUSED'], ['ECONNRESET', 'NETWORK ECONNRESET'],
  ['ENETUNREACH', 'NETWORK ENETUNREACH'], ['EHOSTUNREACH', 'NETWORK EHOSTUNREACH'],
  ['EPIPE', 'NETWORK EPIPE'], ['ETIMEDOUT', 'TIMEOUT ETIMEDOUT'],
  ['28P01', 'AUTH 28P01'], ['28000', 'AUTH 28000'],
  ['08P01', 'PROTOCOL 08P01'], ['08006', 'CONNECTION 08006'],
  ['53300', 'CAPACITY 53300'], ['57P03', 'UNAVAILABLE 57P03'],
  ['57014', 'QUERY_CANCELED 57014'], ['42704', 'SETTING 42704'],
  ['SELF_SIGNED_CERT_IN_CHAIN', 'TLS SELF_SIGNED_CERT_IN_CHAIN'],
  ['DEPTH_ZERO_SELF_SIGNED_CERT', 'TLS DEPTH_ZERO_SELF_SIGNED_CERT'],
  ['UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'TLS UNABLE_TO_VERIFY_LEAF_SIGNATURE'],
  ['UNABLE_TO_GET_ISSUER_CERT_LOCALLY', 'TLS UNABLE_TO_GET_ISSUER_CERT_LOCALLY'],
  ['CERT_HAS_EXPIRED', 'TLS CERT_HAS_EXPIRED'],
  ['ERR_TLS_CERT_ALTNAME_INVALID', 'TLS ERR_TLS_CERT_ALTNAME_INVALID'],
]);
// pg 8.23.1 emits these errors without a code; match whole strings, not fragments.
const ERROR_MESSAGES = new Map([
  ['timeout expired', 'TIMEOUT DRIVER_CONNECT'],
  ['Query read timeout', 'TIMEOUT DRIVER_QUERY'],
  ['The server does not support SSL connections', 'TLS NOT_SUPPORTED'],
  ['There was an error establishing an SSL connection', 'TLS NEGOTIATION'],
  // Documented Supabase pooler response; not evidence of a wrong password.
  ['Tenant or user not found', 'POOLER TENANT_OR_USER_NOT_FOUND'],
]);
const deadlineError = new Error('local deadline');
const tlsError = new Error('local TLS check');
const readOnlyError = new Error('local read-only check');

export function classifyError(error) {
  if (error === deadlineError) return 'TIMEOUT LOCAL_DEADLINE';
  if (error === tlsError) return 'TLS LOCAL_CHECK';
  if (error === readOnlyError) return 'READ_ONLY_CHECK';
  try {
    return ERROR_CODES.get(error?.code) ?? ERROR_MESSAGES.get(error?.message) ?? 'UNKNOWN';
  } catch { return 'UNKNOWN'; }
}

export function buildConfig(env) {
  const reject = () => { throw new Error('CONFIGURATION'); };
  if (env.DB_READONLY_TARGET !== 'raiz-del-rio-dev' ||
      !REF.test(env.DB_READONLY_EXPECTED_PROJECT_REF ?? '') ||
      !HOST.test(env.DB_READONLY_EXPECTED_HOST ?? '')) reject();
  let url;
  try { url = new URL(env.DIRECT_URL); } catch { reject(); }
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.search || url.hash ||
      url.hostname !== env.DB_READONLY_EXPECTED_HOST || !HOST.test(url.hostname) ||
      url.port !== '5432' || url.pathname !== '/postgres' ||
      url.username !== `postgres.${env.DB_READONLY_EXPECTED_PROJECT_REF}` || !url.password) reject();
  let password;
  try { password = decodeURIComponent(url.password); } catch { reject(); }
  // No connectionString: pg must never reinterpret URL SSL/options parameters.
  return {
    host: url.hostname, port: 5432, database: 'postgres', user: url.username, password,
    ssl: { rejectUnauthorized: true, servername: url.hostname, checkServerIdentity },
    connectionTimeoutMillis: TIMEOUT, query_timeout: TIMEOUT,
    statement_timeout: TIMEOUT, lock_timeout: TIMEOUT,
    idle_in_transaction_session_timeout: TIMEOUT,
    options: '-c default_transaction_read_only=on -c statement_timeout=5000',
  };
}

async function bounded(action, client) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(action),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          client.connection?.stream?.destroy();
          reject(deadlineError);
        }, TIMEOUT);
      }),
    ]);
  } finally { clearTimeout(timer); }
}

// Imports have no side effects; offline is the default, tests inject a mock client.
export async function runCheck(env, { connect = false, createClient, log = console.log } = {}) {
  let config;
  try { config = buildConfig(env); } catch { log('FAIL CONFIGURATION'); return false; }
  if (!connect) { log('PASS OFFLINE'); return true; }
  let client;
  let transactionAttempted = false;
  let failure;
  let version;
  let phase = 'CONNECTION';
  try {
    const factory = createClient ?? (config => new pg.Client(config));
    // Lazy loading also keeps offline validation independent of driver/network.
    const pg = createClient ? undefined : await import('pg');
    client = factory(config);
    client.on('error', error => { failure ??= `${phase} ${classifyError(error)}`; });
    await bounded(() => client.connect(), client);
    phase = 'TLS';
    const stream = client.connection?.stream;
    if (stream?.encrypted !== true || stream.authorized !== true) throw tlsError;
    phase = 'READ_ONLY';
    transactionAttempted = true;
    await bounded(() => client.query('BEGIN READ ONLY'), client);
    const result = await bounded(() => client.query(SELECT), client);
    const row = result.rows[0];
    if (result.rows.length !== 1 || row.health !== 1 || row.read_only !== 'on' ||
        typeof row.version !== 'string' || !/^\d{1,2}\.\d{1,2}(?:\.\d{1,2})?(?:\s|$)/.test(row.version)) {
      throw readOnlyError;
    }
    version = row.version.match(/^\d{1,2}\.\d{1,2}(?:\.\d{1,2})?/)[0];
  } catch (error) { failure ??= `${phase} ${classifyError(error)}`; }
  finally {
    if (client) {
      if (transactionAttempted) {
        try { await bounded(() => client.query('ROLLBACK'), client); }
        catch (error) { failure ??= `ROLLBACK ${classifyError(error)}`; }
      }
      try { await bounded(() => client.end(), client); }
      catch (error) { client.connection?.stream?.destroy(); failure ??= `CLOSE ${classifyError(error)}`; }
    }
  }
  log(failure ? `FAIL ${failure}` : `PASS READ_ONLY PostgreSQL ${version}`);
  return !failure;
}

async function main() {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length === 1 && args[0] !== '--connect')) throw new Error();
    // Never load a tracked or non-ignored private file. No private values in argv.
    execFileSync('git', ['check-ignore', '-q', '.env.local'], { stdio: 'ignore' });
    const tracked = execFileSync('git', ['ls-files', '--', '.env.local'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (tracked.trim()) throw new Error();
    const env = parseEnv(readFileSync('.env.local', 'utf8'));
    process.exitCode = await runCheck(env, { connect: args[0] === '--connect' }) ? 0 : 1;
  } catch { console.log('FAIL CONFIGURATION'); process.exitCode = 1; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();

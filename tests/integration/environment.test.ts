import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateDatabaseTarget } from '../../scripts/database-target.ts';

// T02.b.1: fixtures sintéticas offline; no integración PostgreSQL ni cobertura T14.
const operations = ['read', 'runtime', 'test', 'test-cleanup', 'author', 'shadow-reset', 'migrate'] as const;
const kinds = ['app', 'test', 'author', 'shadow'] as const;
function target(environment = 'dev', kind = 'app', roleKind = 'runtime') {
  return { environment, host: 'pool.example.invalid', project: `fictional-${environment}`,
    database: 'fictional', schema: kind === 'app' ? 'app' : `isolated_${kind}`,
    kind, role: `${roleKind}_role`, roleKind };
}
function fixture(operation = 'migrate', destination = target('dev', 'app', 'operational-migrator')) {
  const request = { operation, target: destination, sql: 'fictional-reviewed-sql-v1' };
  const policy = { targets: [structuredClone(destination)], grants: [
    { ...structuredClone(request), recovery: 'fictional-recovery-v1' },
  ] };
  return { request, policy };
}

test('matriz operación / entorno / schema / clase de rol, aun con grant exacto', () => {
  const roles = ['reader', 'runtime', 'test', 'author', 'shadow', 'operational-migrator'];
  for (const environment of ['dev', 'demo']) for (const kind of kinds) {
    for (const role of roles) for (const operation of operations) {
      const { request, policy } = fixture(operation, target(environment, kind, role));
      const expected = operation === 'read' ? role === 'reader'
        : operation === 'runtime' ? kind === 'app' && role === 'runtime'
        : operation === 'migrate' ? kind === 'app' && role === 'operational-migrator'
        : environment === 'dev' && (
          ((operation === 'test' || operation === 'test-cleanup') && kind === 'test' && role === 'test') ||
          (operation === 'author' && kind === 'author' && role === 'author') ||
          (operation === 'shadow-reset' && kind === 'shadow' && role === 'shadow'));
      assert.equal(evaluateDatabaseTarget(request, policy).allowed, expected,
        `${environment}/${kind}/${role}/${operation}`);
    }
  }
});

test('cada operación necesita grant específico; entorno o permiso de lectura no autoriza', () => {
  for (const operation of operations) {
    const kind = operation === 'test' || operation === 'test-cleanup' ? 'test'
      : operation === 'author' ? 'author' : operation === 'shadow-reset' ? 'shadow' : 'app';
    const role = operation === 'read' ? 'reader' : operation === 'migrate' ? 'operational-migrator'
      : kind === 'app' ? 'runtime' : kind;
    const { request, policy } = fixture(operation, target('dev', kind, role));
    assert.equal(evaluateDatabaseTarget(request, policy).allowed, true);
    for (const grants of [undefined, [], true, [{ operation: 'read' }]]) {
      assert.equal(evaluateDatabaseTarget(request, { ...policy, grants, APP_ENV: 'test', authorized: true }).allowed, false);
    }
  }
  for (const operation of ['read', 'runtime', 'migrate']) {
    const role = operation === 'read' ? 'reader' : operation === 'runtime' ? 'runtime' : 'operational-migrator';
    const { request, policy } = fixture(operation, target('demo', 'app', role));
    assert.equal(evaluateDatabaseTarget(request, policy).allowed, true);
    assert.equal(evaluateDatabaseTarget(request, { ...policy, grants: [] }).allowed, false);
  }
  const { request, policy } = fixture('migrate', target('demo', 'app', 'operational-migrator'));
  policy.grants[0].target.environment = 'dev';
  assert.equal(evaluateDatabaseTarget(request, policy).allowed, false);
});

test('expectativa independiente: rechaza discrepancia exacta de cada campo', () => {
  for (const field of Object.keys(target())) {
    const { request, policy } = fixture();
    (request.target as Record<string, string>)[field] += '_other';
    assert.equal(evaluateDatabaseTarget(request, policy).allowed, false, field);
  }
  for (const field of ['operation', 'sql']) {
    const { request, policy } = fixture();
    (policy.grants[0] as Record<string, unknown>)[field] = 'different';
    assert.equal(evaluateDatabaseTarget(request, policy).allowed, false, field);
  }
});

test('configuración incompleta/desconocida falla cerrada sin valores en resultados', () => {
  const { request, policy } = fixture();
  for (const invalid of [undefined, null, true, '', [], {}, { targets: [], grants: [] }]) {
    assert.equal(evaluateDatabaseTarget(request, invalid).allowed, false);
    assert.equal(evaluateDatabaseTarget(invalid, policy).allowed, false);
  }
  for (const field of Object.keys(request.target)) {
    for (const value of [undefined, null, '', ' ', 42, true]) {
      const changed = structuredClone(request);
      (changed.target as Record<string, unknown>)[field] = value;
      assert.equal(evaluateDatabaseTarget(changed, policy).allowed, false);
    }
  }
  for (const field of ['sql', 'recovery']) {
    const changed = structuredClone(policy);
    delete (changed.grants[0] as Record<string, unknown>)[field];
    assert.equal(evaluateDatabaseTarget(request, changed).allowed, false);
  }
  const result = evaluateDatabaseTarget({ operation: 'synthetic-private-marker', target: 'synthetic-private-marker' }, policy);
  assert.deepEqual(result, { allowed: false, code: 'INVALID_INPUT' });
  assert.equal(JSON.stringify(result).includes('synthetic-private-marker'), false);
});

test('aislamiento declarado: schemas administrados/app y roles cruzados rechazados', () => {
  for (const schema of ['app', 'public', 'auth', 'storage', 'pg_catalog', 'information_schema']) {
    const destination = { ...target('dev', 'test', 'test'), schema };
    const { request, policy } = fixture('test', destination);
    assert.equal(evaluateDatabaseTarget(request, policy).allowed, false);
  }
  for (const kind of ['test', 'author', 'shadow']) {
    const { request, policy } = fixture();
    policy.targets.push({ ...target('dev', kind, kind), role: request.target.role });
    assert.equal(evaluateDatabaseTarget(request, policy).allowed, false);
  }
  const { request, policy } = fixture('author', target('dev', 'author', 'author'));
  policy.targets.push({ ...target('dev', 'shadow', 'shadow'), schema: request.target.schema });
  assert.equal(evaluateDatabaseTarget(request, policy).allowed, false);
  const app = fixture();
  app.policy.targets.push(target('dev', 'app', 'runtime'));
  assert.equal(evaluateDatabaseTarget(app.request, app.policy).allowed, true);
  app.policy.targets[1].role = app.request.target.role;
  assert.equal(evaluateDatabaseTarget(app.request, app.policy).allowed, false);
});

test('evaluación determinista sin mutar expectativas/request ni devolver identificadores', () => {
  const { request, policy } = fixture();
  const before = structuredClone({ request, policy });
  assert.deepEqual(evaluateDatabaseTarget(request, policy), { allowed: true, code: 'POLICY_MATCH' });
  assert.deepEqual(evaluateDatabaseTarget(request, policy), { allowed: true, code: 'POLICY_MATCH' });
  assert.deepEqual({ request, policy }, before);
});

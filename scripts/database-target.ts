/**
 * T02.b.1 — política pura, sin IO, URLs, credenciales ni ejecución SQL.
 * El llamador debe obtener la política de una fuente privada independiente y
 * confiable, nunca derivarla del request ni aceptar grants del cliente.
 * POLICY_MATCH solo coteja declaraciones: no concede capacidades ni demuestra
 * RBAC, permisos efectivos, aislamiento Prisma, respaldo o autorización humana.
 * Esas comprobaciones y el wrapper ejecutor permanecen pendientes en T02.b/T03.
 */
export type DatabaseOperation = 'read' | 'runtime' | 'test' | 'test-cleanup' | 'author' | 'shadow-reset' | 'migrate';
export interface DatabaseTarget {
  environment: 'dev' | 'demo';
  host: string;
  project: string;
  database: string;
  schema: string;
  kind: 'app' | 'test' | 'author' | 'shadow';
  role: string;
  roleKind: 'reader' | 'runtime' | 'test' | 'author' | 'shadow' | 'operational-migrator';
}
export interface DatabaseRequest {
  operation: DatabaseOperation;
  target: DatabaseTarget;
  /** Identidad exacta del SQL versionado revisado; no SQL a ejecutar. */
  sql?: string;
}
export interface DatabasePolicy {
  targets: DatabaseTarget[];
  grants: (DatabaseRequest & { recovery?: string })[];
}
export type DatabaseDecision = { allowed: true; code: 'POLICY_MATCH' }
  | { allowed: false; code: 'INVALID_INPUT' | 'INVALID_POLICY' | 'UNKNOWN_TARGET' | 'FORBIDDEN_COMBINATION' | 'MISSING_GRANT' };

const operations: readonly string[] = ['read', 'runtime', 'test', 'test-cleanup', 'author', 'shadow-reset', 'migrate'];
const fields = ['environment', 'host', 'project', 'database', 'schema', 'kind', 'role', 'roleKind'] as const;
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;

function isTarget(value: unknown): value is DatabaseTarget {
  return record(value) && fields.every(field => text(value[field]))
    && ['dev', 'demo'].includes(value.environment as string)
    && ['app', 'test', 'author', 'shadow'].includes(value.kind as string)
    && ['reader', 'runtime', 'test', 'author', 'shadow', 'operational-migrator'].includes(value.roleKind as string);
}

function isRequest(value: unknown): value is DatabaseRequest {
  return record(value) && typeof value.operation === 'string' && operations.includes(value.operation)
    && isTarget(value.target) && (value.sql === undefined || text(value.sql));
}

const sameTarget = (left: DatabaseTarget, right: DatabaseTarget) => fields.every(field => left[field] === right[field]);
const sameDatabase = (left: DatabaseTarget, right: DatabaseTarget) =>
  left.project === right.project && left.database === right.database;

function separated(targets: DatabaseTarget[]): boolean {
  return targets.every((target, index) => {
    if (target.kind === 'app' ? target.schema !== 'app'
      : ['app', 'public', 'auth', 'storage', 'information_schema'].includes(target.schema) || target.schema.startsWith('pg_')) return false;
    return targets.slice(index + 1).every(other => {
      // Un mismo proyecto no puede declararse simultáneamente dev y demo.
      if (target.project === other.project && target.environment !== other.environment) return false;
      if (!sameDatabase(target, other)) return true;
      return !(target.schema === other.schema && target.kind !== other.kind)
        && !(target.role === other.role && (target.roleKind !== other.roleKind
          || target.schema !== other.schema));
    });
  });
}

function permittedCombination({ operation, target }: DatabaseRequest): boolean {
  const { environment, kind, roleKind } = target;
  if (operation === 'read') return roleKind === 'reader';
  if (operation === 'runtime') return kind === 'app' && roleKind === 'runtime';
  if (operation === 'migrate') return kind === 'app' && roleKind === 'operational-migrator';
  if (environment !== 'dev') return false;
  if (operation === 'test' || operation === 'test-cleanup') return kind === 'test' && roleKind === 'test';
  if (operation === 'author') return kind === 'author' && roleKind === 'author';
  return operation === 'shadow-reset' && kind === 'shadow' && roleKind === 'shadow';
}

/** Entradas de datos, no objetos ejecutables. Nunca devuelve valores privados. */
export function evaluateDatabaseTarget(request: unknown, policy: unknown): DatabaseDecision {
  if (!isRequest(request)) return { allowed: false, code: 'INVALID_INPUT' };
  if (!record(policy) || !Array.isArray(policy.targets) || policy.targets.length === 0
    || !policy.targets.every(isTarget) || !separated(policy.targets)
    || !Array.isArray(policy.grants) || !policy.grants.every(isRequest)) {
    return { allowed: false, code: 'INVALID_POLICY' };
  }
  if (!policy.targets.some(target => sameTarget(target, request.target))) return { allowed: false, code: 'UNKNOWN_TARGET' };
  if (!permittedCombination(request)) return { allowed: false, code: 'FORBIDDEN_COMBINATION' };
  const granted = policy.grants.some(grant => grant.operation === request.operation
    && sameTarget(grant.target, request.target)
    && (request.operation !== 'migrate' || (text(request.sql) && grant.sql === request.sql
      && record(grant) && text(grant.recovery))));
  return granted ? { allowed: true, code: 'POLICY_MATCH' } : { allowed: false, code: 'MISSING_GRANT' };
}

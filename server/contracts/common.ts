/**
 * Contratos HTTP comunes, sobres de respuesta (DTO), cursores de paginación
 * y validadores runtime seguros sin exponer modelos de persistencia.
 */

export const MAX_JSON_BODY_BYTES = 64 * 1024; // 64 KiB
export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 50;

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'INVALID_JSON'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CROSS_SITE_FORBIDDEN'
  | 'REAUTHENTICATION_REQUIRED'
  | 'INVALID_CURRENT_PASSWORD'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VERSION_CONFLICT'
  | 'CART_VERSION_CONFLICT'
  | 'CART_MERGE_REJECTED'
  | 'MERGE_PAYLOAD_CONFLICT'
  | 'CONFIRMATION_PAYLOAD_CONFLICT'
  | 'ATTEMPT_EXPIRED'
  | 'ATTEMPT_STALE'
  | 'PAYLOAD_TOO_LARGE'
  | 'VALIDATION_ERROR'
  | 'DOMAIN_RULE_VIOLATION'
  | 'RATE_LIMITED'
  | 'SERVICE_UNAVAILABLE';

export interface ApiErrorDetail {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
  details?: Record<string, unknown>;
  requestId: string;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
}

export interface ApiErrorEnvelope {
  error: ApiErrorDetail;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
}

export interface CursorPosition {
  createdAt: string;
  id: string;
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isNonEmptyString(value: unknown, maxLength = 500): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function assertNoUnknownFields(
  payload: Record<string, unknown>,
  allowedFields: readonly string[],
): string[] {
  const allowed = new Set(allowedFields);
  return Object.keys(payload).filter(key => !allowed.has(key));
}

export function encodeCursor(position: CursorPosition): string {
  return Buffer.from(JSON.stringify(position), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string | null | undefined): CursorPosition | null {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      isPlainObject(parsed) &&
      typeof parsed.createdAt === 'string' &&
      Number.isFinite(Date.parse(parsed.createdAt)) &&
      isNonEmptyString(parsed.id, 120)
    ) {
      return { createdAt: parsed.createdAt, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

export function parsePageLimit(rawLimit: string | null | undefined): number {
  if (!rawLimit) return DEFAULT_PAGE_LIMIT;
  const parsed = Number(rawLimit);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_LIMIT) {
    return -1;
  }
  return parsed;
}

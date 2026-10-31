import type { UserRole } from '../../src/domain';
import {
  extractSessionFromRequest,
  REAUTH_MAX_AGE_SECONDS,
  type SessionClaims,
} from './auth';
import { httpErrors } from './errors';

export function requireSession(request: Request): SessionClaims {
  const session = extractSessionFromRequest(request);
  if (!session) {
    throw httpErrors.unauthorized('Debes iniciar sesión para realizar esta operación.');
  }
  return session;
}

export function requireRole(
  request: Request,
  allowedRoles: readonly UserRole[],
): SessionClaims {
  const session = requireSession(request);
  if (!allowedRoles.includes(session.role)) {
    throw httpErrors.forbidden('Tu perfil no tiene permisos para esta operación.');
  }
  return session;
}

export function requireFreshPasswordAuth(
  session: SessionClaims,
  nowSec = Math.floor(Date.now() / 1000),
): void {
  const authAt = session.passwordAuthenticatedAt;
  if (
    typeof authAt !== 'number' ||
    authAt > nowSec ||
    nowSec - authAt >= REAUTH_MAX_AGE_SECONDS
  ) {
    throw httpErrors.forbidden(
      'Por seguridad, vuelve a iniciar sesión con tu contraseña antes de cambiar tus credenciales.',
      'REAUTHENTICATION_REQUIRED',
    );
  }
}

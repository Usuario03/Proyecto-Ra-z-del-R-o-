import crypto from 'node:crypto';
import type { UserRole } from '../../src/domain';

export const SESSION_COOKIE_NAME = 'raiz_session';
export const SESSION_DURATION_SECONDS = 24 * 60 * 60; // 24 horas
export const REAUTH_MAX_AGE_SECONDS = 300; // 5 minutos

export interface SessionClaims {
  sub: string;
  role: UserRole;
  name: string;
  email?: string;
  memberCode?: string;
  iat: number;
  exp: number;
  passwordAuthenticatedAt?: number;
}

function getJwtSecret(): string {
  return process.env.BETTER_AUTH_SECRET || process.env.JWT_SECRET || 'raiz-del-rio-dev-jwt-secret-change-in-prod';
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8');
}

export function signSessionJwt(
  payload: Omit<SessionClaims, 'iat' | 'exp'> & {
    iat?: number;
    exp?: number;
  },
  secret = getJwtSecret(),
): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const claims: SessionClaims = {
    ...payload,
    iat: payload.iat ?? nowSec,
    exp: payload.exp ?? nowSec + SESSION_DURATION_SECONDS,
  };
  const headerSegment = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadSegment = base64UrlEncode(JSON.stringify(claims));
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');
  return `${signingInput}.${signature}`;
}

export function verifySessionJwt(
  token: string,
  secret = getJwtSecret(),
  nowSec = Math.floor(Date.now() / 1000),
): SessionClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [headerSegment, payloadSegment, signatureSegment] = parts;
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest('base64url');

  const sigBuffer = Buffer.from(signatureSegment);
  const expectedBuffer = Buffer.from(expectedSig);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const header = JSON.parse(base64UrlDecode(headerSegment));
    if (header?.alg !== 'HS256') return null;

    const claims = JSON.parse(base64UrlDecode(payloadSegment)) as SessionClaims;
    if (
      typeof claims?.sub !== 'string' ||
      !['client', 'fisher', 'admin'].includes(claims.role) ||
      typeof claims.exp !== 'number' ||
      nowSec >= claims.exp
    ) {
      return null;
    }
    return claims;
  } catch {
    return null;
  }
}

export function extractSessionFromRequest(
  request: Request,
  secret = getJwtSecret(),
  nowSec = Math.floor(Date.now() / 1000),
): SessionClaims | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) {
      return verifySessionJwt(bearerToken, secret, nowSec);
    }
  }

  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rest] = part.trim().split('=');
    if (rawName === SESSION_COOKIE_NAME && rest.length > 0) {
      const cookieToken = decodeURIComponent(rest.join('='));
      return verifySessionJwt(cookieToken, secret, nowSec);
    }
  }
  return null;
}

export function buildSessionCookieHeader(token: string, isSecure = process.env.NODE_ENV === 'production'): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_DURATION_SECONDS}`,
  ];
  if (isSecure) attributes.push('Secure');
  return attributes.join('; ');
}

export function clearSessionCookieHeader(isSecure = process.env.NODE_ENV === 'production'): string {
  const attributes = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ];
  if (isSecure) attributes.push('Secure');
  return attributes.join('; ');
}

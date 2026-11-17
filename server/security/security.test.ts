import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSessionCookieHeader,
  extractSessionFromRequest,
  signSessionJwt,
  verifySessionJwt,
} from './auth.ts';
import { requireFreshPasswordAuth, requireRole } from './authorization.ts';
import { enforceFixedWindowRateLimits, resetRateLimitBuckets } from './limits.ts';
import { verifyRequestOrigin } from './origin.ts';
import { hashPasswordScrypt, verifyPasswordScrypt } from '../services/profiles.ts';

test('scrypt genera hash con sal aleatoria y rechaza contraseñas incorrectas en tiempo constante', () => {
  const { salt, hash } = hashPasswordScrypt('ClaveSegura2026');
  assert.equal(salt.length, 32);
  assert.equal(hash.length, 128);
  assert.equal(verifyPasswordScrypt('ClaveSegura2026', salt, hash), true);
  assert.equal(verifyPasswordScrypt('ClaveIncorrecta', salt, hash), false);
});

test('JWT HS256 valida firma, expiración y cookies HttpOnly SameSite=Lax', () => {
  const secret = 'test-secret-key-min-32-characters-long';
  const nowSec = 1_700_000_000;
  const token = signSessionJwt(
    {
      sub: '00000000-0000-4000-8000-000000000002',
      role: 'client',
      name: 'Cliente Demo',
      email: 'comprador@gmail.com',
      iat: nowSec,
      exp: nowSec + 3600,
    },
    secret,
  );

  const valid = verifySessionJwt(token, secret, nowSec + 60);
  assert.equal(valid?.role, 'client');
  assert.equal(valid?.sub, '00000000-0000-4000-8000-000000000002');

  const tampered = token.slice(0, -4) + 'aaaa';
  assert.equal(verifySessionJwt(tampered, secret, nowSec + 60), null);
  assert.equal(verifySessionJwt(token, secret, nowSec + 3601), null);

  const cookieHeader = buildSessionCookieHeader(token, true);
  assert.match(cookieHeader, /HttpOnly/);
  assert.match(cookieHeader, /SameSite=Lax/);
  assert.match(cookieHeader, /Secure/);
});

test('RBAC autoriza solo el rol permitido y exige reautenticación reciente para credenciales', () => {
  const token = signSessionJwt({
    sub: '00000000-0000-4000-8000-000000000101',
    role: 'fisher',
    name: 'Don José',
    passwordAuthenticatedAt: 1_000,
  });
  const req = new Request('http://localhost:3000/api/environment/rules/bocachico', {
    method: 'PATCH',
    headers: { authorization: `Bearer ${token}` },
  });

  const fisherSession = extractSessionFromRequest(req);
  assert.equal(fisherSession?.role, 'fisher');
  assert.throws(() => requireRole(req, ['admin']), /permisos/);

  assert.doesNotThrow(() => requireFreshPasswordAuth(fisherSession!, 1_100));
  assert.throws(() => requireFreshPasswordAuth(fisherSession!, 2_000), /contraseña/);
});

test('protección CSRF bloquea peticiones cross-site y autoriza orígenes locales y Vercel', () => {
  const crossSiteReq = new Request('http://localhost:3000/api/lots', {
    method: 'POST',
    headers: {
      origin: 'https://malicious.example.com',
      'sec-fetch-site': 'cross-site',
    },
  });
  assert.throws(() => verifyRequestOrigin(crossSiteReq), /cross-site/i);

  const vercelReq = new Request('http://internal/api/auth/login', {
    method: 'POST',
    headers: {
      origin: 'https://proyecto-ra-z-del-r-o-dol2.vercel.app',
      'x-forwarded-host': 'proyecto-ra-z-del-r-o-dol2.vercel.app',
    },
  });
  assert.doesNotThrow(() => verifyRequestOrigin(vercelReq));
});

test('rate limiting de ventana fija bloquea ráfagas excesivas y se restablece al vencer la ventana', () => {
  resetRateLimitBuckets();
  const rule = [{ scope: 'login', key: 'comprador@gmail.com', limit: 3, windowSeconds: 60 }];
  const startMs = 10_000;

  assert.doesNotThrow(() => enforceFixedWindowRateLimits(rule, startMs));
  assert.doesNotThrow(() => enforceFixedWindowRateLimits(rule, startMs + 100));
  assert.doesNotThrow(() => enforceFixedWindowRateLimits(rule, startMs + 200));
  assert.throws(() => enforceFixedWindowRateLimits(rule, startMs + 300));
  assert.doesNotThrow(() => enforceFixedWindowRateLimits(rule, startMs + 60_001));
});

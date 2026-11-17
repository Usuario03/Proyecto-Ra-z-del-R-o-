import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeCartMergeRequestHash,
  parseMergeCartInput,
} from '../../server/contracts/cart';
import {
  computeConfirmationHash,
  parseConfirmCheckoutAttemptInput,
  parseCreateCheckoutAttemptInput,
} from '../../server/contracts/checkout';
import { decodeCursor, encodeCursor } from '../../server/contracts/common';
import {
  extractSessionFromRequest,
  signSessionJwt,
  verifySessionJwt,
} from '../../server/security/auth';
import {
  requireFreshPasswordAuth,
  requireRole,
} from '../../server/security/authorization';
import {
  AppHttpError,
  readValidatedJsonBody,
  toErrorResponse,
} from '../../server/security/errors';
import {
  enforceFixedWindowRateLimits,
  resetRateLimitBuckets,
} from '../../server/security/limits';
import { verifyRequestOrigin } from '../../server/security/origin';

test('readValidatedJsonBody valida Content-Type, JSON malformado, objetos planos y límite 64 KiB', async () => {
  const validReq = new Request('http://localhost:3000/api/lots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ speciesId: 'bocachico', price: 18000 }),
  });
  const parsed = await readValidatedJsonBody(validReq);
  assert.equal(parsed.speciesId, 'bocachico');

  const wrongTypeReq = new Request('http://localhost:3000/api/lots', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: '{}',
  });
  await assert.rejects(() => readValidatedJsonBody(wrongTypeReq), (err: AppHttpError) => {
    assert.equal(err.status, 400);
    assert.equal(err.code, 'BAD_REQUEST');
    return true;
  });

  const invalidJsonReq = new Request('http://localhost:3000/api/lots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });
  await assert.rejects(() => readValidatedJsonBody(invalidJsonReq), (err: AppHttpError) => {
    assert.equal(err.status, 400);
    assert.equal(err.code, 'INVALID_JSON');
    return true;
  });

  const oversizedReq = new Request('http://localhost:3000/api/lots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: 'x'.repeat(70_000) }),
  });
  await assert.rejects(() => readValidatedJsonBody(oversizedReq), (err: AppHttpError) => {
    assert.equal(err.status, 413);
    assert.equal(err.code, 'PAYLOAD_TOO_LARGE');
    return true;
  });
});

test('verifyRequestOrigin bloquea peticiones mutantes cross-site o con Origin no autorizado', () => {
  const safePost = new Request('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: {
      Origin: 'http://localhost:3000',
      'Sec-Fetch-Site': 'same-origin',
    },
  });
  assert.doesNotThrow(() => verifyRequestOrigin(safePost));

  const crossSitePost = new Request('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: {
      Origin: 'http://localhost:3000',
      'Sec-Fetch-Site': 'cross-site',
    },
  });
  assert.throws(() => verifyRequestOrigin(crossSitePost), (err: AppHttpError) => {
    assert.equal(err.status, 403);
    assert.equal(err.code, 'CROSS_SITE_FORBIDDEN');
    return true;
  });

  const evilOriginPost = new Request('http://localhost:3000/api/cart', {
    method: 'POST',
    headers: {
      Origin: 'https://sitio-malicioso.example',
    },
  });
  assert.throws(() => verifyRequestOrigin(evilOriginPost), (err: AppHttpError) => {
    assert.equal(err.status, 403);
    assert.equal(err.code, 'CROSS_SITE_FORBIDDEN');
    return true;
  });
});

test('enforceFixedWindowRateLimits aplica ventanas fijas atómicas y calcula Retry-After exacto', () => {
  resetRateLimitBuckets();
  const baseNow = 1_700_000_000_000;
  const rules = [
    { scope: 'login:ip', key: '203.0.113.10', limit: 2, windowSeconds: 60 },
    { scope: 'login:email', key: 'Comprador@Gmail.com ', limit: 3, windowSeconds: 900 },
  ];

  // Peticiones 1 y 2 pasan
  enforceFixedWindowRateLimits(rules, baseNow);
  enforceFixedWindowRateLimits(rules, baseNow + 10_000);

  // Petición 3 desde la misma IP satura la ventana de 60 s -> 429 con Retry-After = 45
  assert.throws(
    () => enforceFixedWindowRateLimits(rules, baseNow + 15_000),
    (err: AppHttpError) => {
      assert.equal(err.status, 429);
      assert.equal(err.code, 'RATE_LIMITED');
      assert.equal(err.headers?.['Retry-After'], '45');
      return true;
    },
  );

  // Al cumplirse exactamente los 60 s (baseNow + 60_000) se abre nueva ventana para la IP
  assert.doesNotThrow(() => enforceFixedWindowRateLimits(rules, baseNow + 60_000));
});

test('JWT HS256, Bearer header, cookie HttpOnly, RBAC y frescura de contraseña (<300 s)', () => {
  const secret = 'test-secret-hs256-key';
  const nowSec = 1_700_000_000;
  const token = signSessionJwt(
    {
      sub: '11111111-1111-4111-8111-111111111111',
      role: 'fisher',
      name: 'Don José',
      memberCode: 'FP-0018',
      iat: nowSec,
      exp: nowSec + 3600,
      passwordAuthenticatedAt: nowSec - 299,
    },
    secret,
  );

  const verified = verifySessionJwt(token, secret, nowSec);
  assert.ok(verified);
  assert.equal(verified.role, 'fisher');

  // Token manipulado o expirado se rechaza
  assert.equal(verifySessionJwt(`${token}x`, secret, nowSec), null);
  assert.equal(verifySessionJwt(token, secret, nowSec + 3600), null);

  // Extracción desde Authorization: Bearer y Cookie
  const bearerReq = new Request('http://localhost:3000/api/lots', {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(extractSessionFromRequest(bearerReq, secret, nowSec)?.sub, verified.sub);

  const cookieReq = new Request('http://localhost:3000/api/lots', {
    headers: { Cookie: `raiz_session=${encodeURIComponent(token)}` },
  });
  assert.equal(extractSessionFromRequest(cookieReq, secret, nowSec)?.role, 'fisher');

  // Reautenticación fresca: 299 s pasa, 300 s exige REAUTHENTICATION_REQUIRED
  assert.doesNotThrow(() => requireFreshPasswordAuth(verified, nowSec));
  assert.throws(
    () => requireFreshPasswordAuth(verified, nowSec + 1),
    (err: AppHttpError) => {
      assert.equal(err.status, 403);
      assert.equal(err.code, 'REAUTHENTICATION_REQUIRED');
      return true;
    },
  );

  // Sin sesión -> 401
  assert.throws(
    () => requireRole(new Request('http://localhost:3000/api/cart'), ['client']),
    (err: AppHttpError) => {
      assert.equal(err.status, 401);
      return true;
    },
  );
});

test('toErrorResponse sanea excepciones de base de datos sin exponer SQL ni credenciales', async () => {
  const rawDbError = new Error(
    'SELECT * FROM public.users WHERE password = "secret" failed on postgres://user:pass@db.supabase.co',
  );
  const res = toErrorResponse(rawDbError, 'req-123');
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error.code, 'SERVICE_UNAVAILABLE');
  assert.equal(body.error.requestId, 'req-123');
  assert.doesNotMatch(JSON.stringify(body), /postgres:\/\/|password|SELECT/i);
});

test('contratos de fusión de canasta, checkout y cursores son deterministas e independientes del orden', () => {
  const lotA = '11111111-1111-4111-8111-111111111111';
  const lotB = '22222222-2222-4222-8222-222222222222';
  const mergeId = '33333333-3333-4333-8333-333333333333';

  const m1 = parseMergeCartInput({
    mergeId,
    expectedCartVersion: 2,
    lines: [
      { lotId: lotB, quantity: 3 },
      { lotId: lotA, quantity: 1 },
    ],
  });
  const m2 = parseMergeCartInput({
    mergeId,
    expectedCartVersion: 2,
    lines: [
      { lotId: lotA, quantity: 1 },
      { lotId: lotB, quantity: 3 },
    ],
  });
  assert.equal(computeCartMergeRequestHash(m1), computeCartMergeRequestHash(m2));

  const attemptInput = parseCreateCheckoutAttemptInput(
    {
      cartVersion: 4,
      method: 'Nequi',
      bank: '',
      customerType: 'natural',
      delivery: {
        name: 'María Pérez',
        phone: '3101234567',
        address: 'Calle 50 # 12-34 Barrancabermeja',
        slot: 'Mañana (8:00 a. m. - 12:00 m.)',
        date: '2026-10-31',
      },
    },
    'idem-key-001',
  );
  assert.equal(attemptInput.requestKey, 'idem-key-001');

  const confirmSuccess = parseConfirmCheckoutAttemptInput({ outcome: 'success' });
  const confirmRejected = parseConfirmCheckoutAttemptInput({ outcome: 'rejected' });
  assert.equal(confirmSuccess.outcome, 'exitoso');
  assert.equal(confirmRejected.outcome, 'rechazado');
  assert.notEqual(
    computeConfirmationHash(mergeId, 'exitoso'),
    computeConfirmationHash(mergeId, 'rechazado'),
  );

  const cursor = encodeCursor({ createdAt: '2026-10-30T12:00:00.000Z', id: lotA });
  assert.deepEqual(decodeCursor(cursor), {
    createdAt: '2026-10-30T12:00:00.000Z',
    id: lotA,
  });
});

test('contratos de onboarding, login, perfil y hash scrypt rechazan escalada a admin y validan contraseñas', async () => {
  const {
    parseLoginInput,
    parseOnboardingInput,
    parseUpdateProfileInput,
    parseChangeCredentialsInput,
  } = await import('../../server/contracts/profile');
  const {
    hashPasswordScrypt,
    verifyPasswordScrypt,
  } = await import('../../server/services/profiles');

  const login = parseLoginInput({ email: '  Don.Jose@PescaBarranca.co ', password: 'secret-password' });
  assert.equal(login.email, 'don.jose@pescabarranca.co');

  const buyerOnboarding = parseOnboardingInput({
    role: 'client',
    email: 'Comprador@Test.co',
    password: 'password-segura-123',
    name: 'Carlos Gómez',
    phone: '3151234567',
    address: 'Carrera 15 # 45-10 Barrancabermeja',
  });
  assert.equal(buyerOnboarding.role, 'client');
  assert.equal(buyerOnboarding.email, 'comprador@test.co');

  assert.throws(
    () =>
      parseOnboardingInput({
        role: 'admin',
        email: 'admin@test.co',
        password: 'password-segura-123',
        name: 'Intento Admin',
      }),
    (err: AppHttpError) => {
      assert.equal(err.status, 403);
      return true;
    },
  );

  const profilePatch = parseUpdateProfileInput({
    name: 'Carlos Alberto Gómez',
    textSize: 'large',
    readInstructions: true,
  });
  assert.equal(profilePatch.textSize, 'large');

  const creds = parseChangeCredentialsInput({
    currentPassword: 'old-password',
    newEmail: 'Nuevo@Test.co',
  });
  assert.equal(creds.newEmail, 'nuevo@test.co');

  const { salt, hash } = hashPasswordScrypt('mi-clave-secreta-2026');
  assert.equal(verifyPasswordScrypt('mi-clave-secreta-2026', salt, hash), true);
  assert.equal(verifyPasswordScrypt('clave-incorrecta', salt, hash), false);
});


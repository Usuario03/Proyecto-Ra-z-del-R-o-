import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLastSevenBogotaDays,
  toBogotaDateKey,
  validateCaptureTimestamps,
} from './time';

test('toBogotaDateKey convierte instantes UTC al calendario de America/Bogota (UTC-5)', () => {
  // 2026-10-30T03:30:00Z siguen siendo las 22:30 del 2026-10-29 en Bogotá
  assert.equal(toBogotaDateKey('2026-10-30T03:30:00.000Z'), '2026-10-29');
  // 2026-10-30T05:00:00Z es exactamente medianoche del 2026-10-30 en Bogotá
  assert.equal(toBogotaDateKey('2026-10-30T05:00:00.000Z'), '2026-10-30');
});

test('validateCaptureTimestamps valida orden captura <= desembarque y límite de reloj futuro', () => {
  const nowMs = Date.parse('2026-10-30T12:00:00.000Z');
  assert.equal(
    validateCaptureTimestamps('2026-10-30T09:00:00.000Z', '2026-10-30T11:30:00.000Z', nowMs),
    true,
  );
  // Captura posterior al desembarque -> inválido
  assert.equal(
    validateCaptureTimestamps('2026-10-30T11:31:00.000Z', '2026-10-30T11:30:00.000Z', nowMs),
    false,
  );
  // Desembarque más de 60 s en el futuro -> inválido
  assert.equal(
    validateCaptureTimestamps('2026-10-30T11:30:00.000Z', '2026-10-30T12:01:01.000Z', nowMs),
    false,
  );
});

test('buildLastSevenBogotaDays genera ventana exacta de 7 días consecutivos en Bogotá', () => {
  const now = new Date('2026-10-30T03:00:00.000Z'); // 2026-10-29 22:00 en Bogotá
  const days = buildLastSevenBogotaDays(now);
  assert.equal(days.length, 7);
  assert.equal(days[0].dateKey, '2026-10-23');
  assert.equal(days[6].dateKey, '2026-10-29');
});

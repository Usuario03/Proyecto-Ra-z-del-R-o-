/**
 * Reglas puras de tiempo, calendario de negocio (America/Bogota) y ventanas de métricas.
 * Sin dependencias de React, navegador ni base de datos.
 */

export const BUSINESS_TIME_ZONE = 'America/Bogota';
export const MAX_CLOCK_SKEW_MS = 60_000;

const bogotaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isValidIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

/**
 * Devuelve la fecha calendario YYYY-MM-DD en la zona de negocio America/Bogota.
 */
export function toBogotaDateKey(instant: Date | string | number): string {
  const date = instant instanceof Date ? instant : new Date(instant);
  if (!Number.isFinite(date.getTime())) {
    throw new Error('Instante de fecha inválido.');
  }
  return bogotaDateFormatter.format(date);
}

/**
 * Valida que la captura no sea posterior al desembarque y que el desembarque
 * no esté en el futuro (con tolerancia de reloj de 60 s).
 */
export function validateCaptureTimestamps(
  capturedAt: unknown,
  landedAt: unknown,
  nowMs: number = Date.now(),
): boolean {
  if (!isValidIsoTimestamp(capturedAt) || !isValidIsoTimestamp(landedAt)) {
    return false;
  }
  const capturedMs = Date.parse(capturedAt);
  const landedMs = Date.parse(landedAt);
  return capturedMs <= landedMs && landedMs <= nowMs + MAX_CLOCK_SKEW_MS;
}

export interface BogotaDayBucket {
  dateKey: string;
  dayStartUtc: Date;
  amount: number;
  kg: number;
  pieces: number;
}

/**
 * Construye los 7 días calendario consecutivos (incluyendo hoy) en America/Bogota.
 * Como America/Bogota es UTC-5 fijo sin horario de verano, la medianoche local
 * corresponde exactamente a las 05:00:00.000Z de cada fecha calendario.
 */
export function buildLastSevenBogotaDays(now: Date = new Date()): BogotaDayBucket[] {
  const todayKey = toBogotaDateKey(now);
  const [year, month, day] = todayKey.split('-').map(Number);
  const todayMidnightBogotaUtcMs = Date.UTC(year, month - 1, day, 5, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;

  return Array.from({ length: 7 }, (_, index) => {
    const startMs = todayMidnightBogotaUtcMs - (6 - index) * dayMs;
    const dayStartUtc = new Date(startMs);
    return {
      dateKey: toBogotaDateKey(dayStartUtc),
      dayStartUtc,
      amount: 0,
      kg: 0,
      pieces: 0,
    };
  });
}

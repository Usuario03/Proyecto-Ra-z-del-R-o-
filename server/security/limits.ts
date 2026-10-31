import crypto from 'node:crypto';
import { httpErrors } from './errors';

interface FixedWindowCounter {
  count: number;
  windowStartMs: number;
  windowDurationMs: number;
}

export interface RateLimitRule {
  scope: string;
  key: string;
  limit: number;
  windowSeconds: number;
}

const buckets = new Map<string, FixedWindowCounter>();

function hashRateLimitKey(scope: string, rawKey: string): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? 'raiz-rio-rate-limit-key';
  return crypto
    .createHmac('sha256', secret)
    .update(`${scope}:${rawKey.trim().toLowerCase()}`)
    .digest('hex');
}

/**
 * Evalúa e incrementa atómicamente una lista de reglas de ventana fija `[inicio, inicio + duración)`.
 * Si cualquiera está saturada, lanza 429 con Retry-After = ceil(max(fin - now))
 * sin incrementar ningún contador ni extender las ventanas existentes.
 */
export function enforceFixedWindowRateLimits(
  rules: readonly RateLimitRule[],
  nowMs: number = Date.now(),
): void {
  // 1. Purgar vencidos y comprobar si alguna regla ya alcanzó el tope
  let maxRemainingMs = 0;
  let saturated = false;

  const resolvedKeys = rules.map(rule => ({
    rule,
    bucketKey: hashRateLimitKey(rule.scope, rule.key),
    durationMs: rule.windowSeconds * 1000,
  }));

  for (const { rule, bucketKey, durationMs } of resolvedKeys) {
    const existing = buckets.get(bucketKey);
    if (existing && nowMs < existing.windowStartMs + existing.windowDurationMs) {
      if (existing.count >= rule.limit) {
        saturated = true;
        const remainingMs = existing.windowStartMs + existing.windowDurationMs - nowMs;
        if (remainingMs > maxRemainingMs) maxRemainingMs = remainingMs;
      }
    } else if (existing) {
      buckets.delete(bucketKey);
    }
  }

  if (saturated) {
    const retryAfterSeconds = Math.ceil(maxRemainingMs / 1000);
    throw httpErrors.rateLimited(retryAfterSeconds);
  }

  // 2. Ninguna regla saturada -> incrementar todas atómicamente
  for (const { bucketKey, durationMs } of resolvedKeys) {
    const existing = buckets.get(bucketKey);
    if (existing && nowMs < existing.windowStartMs + existing.windowDurationMs) {
      existing.count += 1;
    } else {
      buckets.set(bucketKey, {
        count: 1,
        windowStartMs: nowMs,
        windowDurationMs: durationMs,
      });
    }
  }
}

export function resetRateLimitBuckets(): void {
  buckets.clear();
}

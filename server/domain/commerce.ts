/**
 * Reglas puras de comercio, unidades (kg / peces enteros) y redondeo COP.
 * Sin dependencias de React, navegador ni base de datos.
 */

export const MIN_QUANTITY_UNITS = 1;
export const MAX_QUANTITY_UNITS = 500;
export const MIN_STOCK_UNITS = 0;
export const MAX_STOCK_UNITS = 500;
export const MIN_PRICE_COP_PER_KG = 1_000;
export const MAX_PRICE_COP_PER_KG = 100_000;
export const MIN_PIECE_WEIGHT_GRAMS = 1;
export const MAX_PIECE_WEIGHT_GRAMS = 50_000;
export const MAX_CART_DISTINCT_LINES = 50;
export const GRAMS_PER_KG = 1_000;

export interface PricedUnitInput {
  price?: number;
  priceCopPerKg?: number | bigint;
  pieceWeightGrams?: number | null;
}

export function isBoundedInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

export function effectiveWeightGramsPerUnit(pieceWeightGrams?: number | null): number {
  return pieceWeightGrams !== undefined && pieceWeightGrams !== null
    ? pieceWeightGrams
    : GRAMS_PER_KG;
}

export function totalWeightGrams(
  input: Pick<PricedUnitInput, 'pieceWeightGrams'>,
  quantity: number,
): number {
  return effectiveWeightGramsPerUnit(input.pieceWeightGrams) * quantity;
}

export function weightKg(
  input: Pick<PricedUnitInput, 'pieceWeightGrams'>,
  quantity: number,
): number {
  return totalWeightGrams(input, quantity) / GRAMS_PER_KG;
}

/**
 * Fórmula entera exacta positiva:
 * floor((priceCopPerKg * weightGramsPerUnit * quantity + 500) / 1000)
 * Equivalente a Math.round para enteros no negativos, sin pérdida de precisión float.
 */
export function lineAmountBigInt(
  priceCopPerKg: number | bigint,
  quantity: number | bigint,
  pieceWeightGrams?: number | null,
): bigint {
  const price = BigInt(priceCopPerKg);
  const qty = BigInt(quantity);
  const grams = BigInt(effectiveWeightGramsPerUnit(pieceWeightGrams));
  if (price < 0n || qty <= 0n || grams <= 0n) return 0n;
  return (price * grams * qty + 500n) / 1000n;
}

export function lineAmount(input: PricedUnitInput, quantity: number): number {
  const rawPrice = input.priceCopPerKg ?? input.price ?? 0;
  if (!Number.isFinite(Number(rawPrice)) || !Number.isFinite(quantity) || quantity <= 0) {
    return 0;
  }
  return Number(
    lineAmountBigInt(Math.trunc(Number(rawPrice)), Math.trunc(quantity), input.pieceWeightGrams),
  );
}

export function formatCop(amount: number | bigint): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatKg(kg: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(kg);
}

export function quantityLabel(
  input: Pick<PricedUnitInput, 'pieceWeightGrams'>,
  quantity: number,
): string {
  if (input.pieceWeightGrams !== undefined && input.pieceWeightGrams !== null) {
    return `${quantity} ${quantity === 1 ? 'pez' : 'peces'} · ${formatKg(weightKg(input, quantity))} kg`;
  }
  return `${quantity} kg`;
}

export function unitLabel(input: Pick<PricedUnitInput, 'pieceWeightGrams'>): 'pez' | 'kg' {
  return input.pieceWeightGrams !== undefined && input.pieceWeightGrams !== null ? 'pez' : 'kg';
}

export interface CaptureQuantityCandidate {
  kg?: number;
  quantity?: number;
  pieceWeightGrams?: number;
  sameWeightConfirmed?: boolean;
}

export function validateCaptureQuantity(candidate: CaptureQuantityCandidate): string {
  if (candidate.pieceWeightGrams !== undefined) {
    if (
      !isBoundedInteger(
        candidate.pieceWeightGrams,
        MIN_PIECE_WEIGHT_GRAMS,
        MAX_PIECE_WEIGHT_GRAMS,
      )
    ) {
      return 'Indica el peso de cada pez entre 1 y 50.000 gramos.';
    }
    if (!isBoundedInteger(candidate.quantity, MIN_QUANTITY_UNITS, MAX_QUANTITY_UNITS)) {
      return 'Indica entre 1 y 500 peces completos para este lote.';
    }
    if (candidate.sameWeightConfirmed !== true) {
      return 'Confirma que todos los peces del lote tienen el mismo peso. Si pesan diferente, crea lotes separados.';
    }
  } else if (!isBoundedInteger(candidate.kg, MIN_QUANTITY_UNITS, MAX_QUANTITY_UNITS)) {
    return 'Elige entre 1 y 500 kilos.';
  }
  return '';
}

export type FulfillmentStage = 'pendiente' | 'preparado' | 'enviado';
export type OrderProgressStage = 'preparando' | 'listo' | 'enviado' | 'recibido';

export function computeOrderProgress(
  fulfillmentByFisher: Record<string, FulfillmentStage>,
  receivedAt?: string | Date | null,
): OrderProgressStage {
  if (receivedAt) return 'recibido';
  const states = Object.values(fulfillmentByFisher);
  if (states.length > 0 && states.every(state => state === 'enviado')) return 'enviado';
  if (states.length > 0 && states.every(state => state !== 'pendiente')) return 'listo';
  return 'preparando';
}

export function nextFulfillmentStage(current: FulfillmentStage): FulfillmentStage {
  return current === 'pendiente' ? 'preparado' : 'enviado';
}

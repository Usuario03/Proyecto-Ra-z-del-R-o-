import crypto from 'node:crypto';
import {
  isBoundedInteger,
  MAX_CART_DISTINCT_LINES,
  MAX_QUANTITY_UNITS,
  MIN_QUANTITY_UNITS,
} from '../domain/commerce';
import { httpErrors } from '../security/errors';
import { assertNoUnknownFields, isPlainObject, isUuid } from './common';

export interface CartLineDto {
  lotId: string;
  speciesId: string;
  speciesName: string;
  fisherId: string;
  fisherName: string;
  pricePerKgCop: number;
  pieceWeightGrams: number | null;
  quantity: number;
  weightKg: number;
  lineTotalCop: string;
  availableStock: number;
  blockReason: string;
}

export interface CartDto {
  version: number;
  lines: CartLineDto[];
  totalWeightKg: number;
  totalCop: string;
}

export interface SetCartLineInput {
  quantity: number;
  expectedCartVersion?: number;
}

export interface MergeCartLineInput {
  lotId: string;
  quantity: number;
}

export interface MergeCartInput {
  mergeId: string;
  expectedCartVersion: number;
  lines: MergeCartLineInput[];
}

export function parseSetCartLineInput(raw: Record<string, unknown>): SetCartLineInput {
  const extra = assertNoUnknownFields(raw, ['quantity', 'expectedCartVersion']);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en línea de canasta: ${extra.join(', ')}.`);
  }
  if (!isBoundedInteger(raw.quantity, MIN_QUANTITY_UNITS, MAX_QUANTITY_UNITS)) {
    throw httpErrors.validation('La cantidad debe ser un entero entre 1 y 500 unidades.');
  }
  if (
    raw.expectedCartVersion !== undefined &&
    !isBoundedInteger(raw.expectedCartVersion, 1, 1_000_000_000)
  ) {
    throw httpErrors.validation('expectedCartVersion debe ser un entero positivo.');
  }
  return {
    quantity: raw.quantity,
    ...(raw.expectedCartVersion !== undefined
      ? { expectedCartVersion: raw.expectedCartVersion }
      : {}),
  };
}

export function parseMergeCartInput(raw: Record<string, unknown>): MergeCartInput {
  const extra = assertNoUnknownFields(raw, ['mergeId', 'expectedCartVersion', 'lines']);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en fusión de canasta: ${extra.join(', ')}.`);
  }
  if (!isUuid(raw.mergeId)) {
    throw httpErrors.validation('mergeId debe ser un UUID válido.');
  }
  if (!isBoundedInteger(raw.expectedCartVersion, 1, 1_000_000_000)) {
    throw httpErrors.validation('expectedCartVersion debe ser un entero positivo.');
  }
  if (!Array.isArray(raw.lines) || raw.lines.length === 0 || raw.lines.length > MAX_CART_DISTINCT_LINES) {
    throw httpErrors.validation('La lista de líneas a fusionar debe contener entre 1 y 50 lotes.');
  }

  const seenLots = new Set<string>();
  const lines: MergeCartLineInput[] = [];
  for (const item of raw.lines) {
    if (!isPlainObject(item)) {
      throw httpErrors.validation('Cada línea de fusión debe ser un objeto válido.');
    }
    const lineExtra = assertNoUnknownFields(item, ['lotId', 'quantity']);
    if (lineExtra.length > 0 || !isUuid(item.lotId)) {
      throw httpErrors.validation('Cada línea debe indicar únicamente un lotId UUID válido y quantity.');
    }
    if (!isBoundedInteger(item.quantity, MIN_QUANTITY_UNITS, MAX_QUANTITY_UNITS)) {
      throw httpErrors.validation('Cada cantidad en la fusión debe ser un entero entre 1 y 500.');
    }
    const normalizedLotId = item.lotId.toLowerCase();
    if (seenLots.has(normalizedLotId)) {
      throw httpErrors.validation('No se permiten lotes repetidos dentro de la misma petición de fusión.');
    }
    seenLots.add(normalizedLotId);
    lines.push({ lotId: normalizedLotId, quantity: item.quantity });
  }

  return {
    mergeId: raw.mergeId.toLowerCase(),
    expectedCartVersion: raw.expectedCartVersion,
    lines,
  };
}

/**
 * Calcula un hash canónico SHA-256 independiente del orden de las líneas recibidas.
 */
export function computeCartMergeRequestHash(input: MergeCartInput): string {
  const canonicalLines = [...input.lines].sort((a, b) => a.lotId.localeCompare(b.lotId));
  const canonicalPayload = JSON.stringify({
    v: 1,
    expectedCartVersion: input.expectedCartVersion,
    lines: canonicalLines,
  });
  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}

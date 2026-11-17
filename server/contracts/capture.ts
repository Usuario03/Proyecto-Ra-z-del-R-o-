import { METHODS, ZONES } from '../../src/domain';
import {
  isBoundedInteger,
  MAX_PRICE_COP_PER_KG,
  MAX_STOCK_UNITS,
  MIN_PRICE_COP_PER_KG,
  MIN_STOCK_UNITS,
  validateCaptureQuantity,
} from '../domain/commerce';
import {
  MAX_ALLOWED_LENGTH_CM,
  MAX_TEMPERATURE_C,
  MIN_ALLOWED_LENGTH_CM,
  MIN_TEMPERATURE_C,
} from '../domain/environment';
import { validateCaptureTimestamps } from '../domain/time';
import { httpErrors } from '../security/errors';
import { assertNoUnknownFields, isNonEmptyString } from './common';

export interface CreateCaptureLotInput {
  speciesId: string;
  price: number;
  kg?: number;
  quantity?: number;
  pieceWeightGrams?: number;
  sameWeightConfirmed?: boolean;
  length: number;
  zone: string;
  method: string;
  capturedAt: string;
  landedAt: string;
  temperature: number;
  photoId?: string;
}

export interface UpdateLotInventoryInput {
  stock?: number;
  paused?: boolean;
  expectedVersion: number;
}

const CREATE_ALLOWED_FIELDS = [
  'speciesId',
  'price',
  'kg',
  'quantity',
  'pieceWeightGrams',
  'sameWeightConfirmed',
  'length',
  'zone',
  'method',
  'capturedAt',
  'landedAt',
  'temperature',
  'photoId',
] as const;

const UPDATE_ALLOWED_FIELDS = ['stock', 'paused', 'expectedVersion'] as const;

export function parseCreateCaptureLotInput(raw: Record<string, unknown>): CreateCaptureLotInput {
  const extra = assertNoUnknownFields(raw, CREATE_ALLOWED_FIELDS);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en publicación de captura: ${extra.join(', ')}.`);
  }

  if (!isNonEmptyString(raw.speciesId, 60)) {
    throw httpErrors.validation('Elige una especie de nuestra región.');
  }

  const quantityError = validateCaptureQuantity({
    kg: raw.kg as number | undefined,
    quantity: raw.quantity as number | undefined,
    pieceWeightGrams: raw.pieceWeightGrams as number | undefined,
    sameWeightConfirmed: raw.sameWeightConfirmed as boolean | undefined,
  });
  if (quantityError) {
    throw httpErrors.validation(quantityError);
  }

  if (!isBoundedInteger(raw.price, MIN_PRICE_COP_PER_KG, MAX_PRICE_COP_PER_KG)) {
    throw httpErrors.validation('Elige un precio entre $1.000 y $100.000 por kilo.');
  }

  if (!isBoundedInteger(raw.length, MIN_ALLOWED_LENGTH_CM, MAX_ALLOWED_LENGTH_CM)) {
    throw httpErrors.validation('La talla debe ser un número entero entre 1 y 250 cm.');
  }

  if (
    typeof raw.zone !== 'string' ||
    !ZONES.includes(raw.zone) ||
    typeof raw.method !== 'string' ||
    !METHODS.includes(raw.method)
  ) {
    throw httpErrors.validation('Elige el lugar y la forma de pesca.');
  }

  if (!validateCaptureTimestamps(raw.capturedAt, raw.landedAt)) {
    throw httpErrors.validation(
      'La captura debe ser anterior al desembarque y no puede ser del futuro.',
    );
  }

  if (
    typeof raw.temperature !== 'number' ||
    !Number.isFinite(raw.temperature) ||
    raw.temperature < MIN_TEMPERATURE_C ||
    raw.temperature > MAX_TEMPERATURE_C
  ) {
    throw httpErrors.validation('Conserva el lote entre 0 y 4 °C antes de publicarlo.');
  }

  return {
    speciesId: raw.speciesId.trim(),
    price: raw.price,
    ...(raw.kg !== undefined ? { kg: raw.kg as number } : {}),
    ...(raw.quantity !== undefined ? { quantity: raw.quantity as number } : {}),
    ...(raw.pieceWeightGrams !== undefined
      ? { pieceWeightGrams: raw.pieceWeightGrams as number }
      : {}),
    ...(raw.sameWeightConfirmed !== undefined
      ? { sameWeightConfirmed: raw.sameWeightConfirmed as boolean }
      : {}),
    length: raw.length,
    zone: raw.zone,
    method: raw.method,
    capturedAt: raw.capturedAt as string,
    landedAt: raw.landedAt as string,
    temperature: raw.temperature,
    ...(typeof raw.photoId === 'string' && raw.photoId.trim() ? { photoId: raw.photoId.trim() } : {}),
  };
}

export function parseUpdateLotInventoryInput(raw: Record<string, unknown>): UpdateLotInventoryInput {
  const extra = assertNoUnknownFields(raw, UPDATE_ALLOWED_FIELDS);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en inventario: ${extra.join(', ')}.`);
  }

  if (!isBoundedInteger(raw.expectedVersion, 1, 1_000_000_000)) {
    throw httpErrors.validation('Se requiere expectedVersion entero positivo.');
  }

  if (raw.stock === undefined && raw.paused === undefined) {
    throw httpErrors.validation('Indica un cambio de stock o de pausa.');
  }

  if (raw.stock !== undefined && !isBoundedInteger(raw.stock, MIN_STOCK_UNITS, MAX_STOCK_UNITS)) {
    throw httpErrors.validation('El inventario debe estar entre 0 y 500 unidades.');
  }

  if (raw.paused !== undefined && typeof raw.paused !== 'boolean') {
    throw httpErrors.validation('El estado de pausa debe ser booleano.');
  }

  return {
    ...(raw.stock !== undefined ? { stock: raw.stock } : {}),
    ...(raw.paused !== undefined ? { paused: raw.paused } : {}),
    expectedVersion: raw.expectedVersion,
  };
}

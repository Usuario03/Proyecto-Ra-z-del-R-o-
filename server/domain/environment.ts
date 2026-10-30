/**
 * Reglas puras ambientales (vedas, tallas mínimas y simulación educativa).
 * Sin dependencias de React, navegador ni base de datos.
 */
import { isBoundedInteger, MAX_STOCK_UNITS } from './commerce';

export const MIN_ALLOWED_LENGTH_CM = 1;
export const MAX_ALLOWED_LENGTH_CM = 250;
export const BOCACHICO_SIMULATED_SMALL_CM = 22;
export const MIN_TEMPERATURE_C = 0;
export const MAX_TEMPERATURE_C = 4;

export interface EnvironmentalContext {
  bans: Record<string, boolean>;
  minimumSizes: Record<string, number>;
  smallSizeSimulation?: boolean;
}

export interface EvaluableLot {
  id: string;
  speciesId: string;
  length: number;
  minimum?: number;
  paused: boolean;
  stock?: number;
  withdrawnAt?: string | Date | null;
}

export function effectiveMeasuredLengthCm(
  lot: Pick<EvaluableLot, 'speciesId' | 'length'>,
  smallSizeSimulation = false,
): number {
  return lot.speciesId === 'bocachico' && smallSizeSimulation
    ? BOCACHICO_SIMULATED_SMALL_CM
    : lot.length;
}

export function effectiveMinimumLengthCm(
  lot: Pick<EvaluableLot, 'speciesId' | 'minimum'>,
  minimumSizes: Record<string, number>,
): number {
  return minimumSizes[lot.speciesId] ?? lot.minimum ?? MIN_ALLOWED_LENGTH_CM;
}

export function evaluateLotBlockReason(
  lot: EvaluableLot,
  context: EnvironmentalContext,
  stockOverride?: number,
): string {
  if (lot.withdrawnAt) return 'Ese lote ya no está disponible.';
  if (context.bans[lot.speciesId]) return 'Especie en veda';
  const measured = effectiveMeasuredLengthCm(lot, Boolean(context.smallSizeSimulation));
  const minimum = effectiveMinimumLengthCm(lot, context.minimumSizes);
  if (measured < minimum) return 'Talla no permitida';
  if (lot.paused) return 'Venta pausada';
  const currentStock = stockOverride !== undefined ? stockOverride : lot.stock;
  if (!isBoundedInteger(currentStock, 1, MAX_STOCK_UNITS)) return 'Agotado';
  return '';
}

export function validateEnvironmentalRuleInput(changes: {
  banned?: unknown;
  minimum?: unknown;
}): string {
  if (
    changes.minimum !== undefined &&
    !isBoundedInteger(changes.minimum, MIN_ALLOWED_LENGTH_CM, MAX_ALLOWED_LENGTH_CM)
  ) {
    return 'La talla de prueba debe ser un número entero entre 1 y 250 cm.';
  }
  if (changes.banned !== undefined && typeof changes.banned !== 'boolean') {
    return 'El estado de veda no es válido.';
  }
  return '';
}

import type { Delivery, PaymentMethod } from '../../src/domain';
import {
  type FulfillmentStage,
  isBoundedInteger,
  type OrderProgressStage,
} from '../domain/commerce';
import { httpErrors } from '../security/errors';
import { assertNoUnknownFields } from './common';

export interface OrderLineSnapshotDto {
  id: string;
  lotId: string;
  speciesId: string;
  fisherId: string;
  speciesName: string;
  scientificName: string;
  fisherName: string;
  fisherMember: string;
  zone: string;
  method: string;
  pricePerKgCop: number;
  pieceWeightGrams: number | null;
  quantity: number;
  weightKg: number;
  lineTotalCop: string;
}

export interface OrderDto {
  id: string;
  clientId: string;
  createdAt: string;
  totalCop: string;
  paymentMethod: PaymentMethod;
  bank: string;
  customerType: string;
  delivery: Delivery;
  lines: OrderLineSnapshotDto[];
  fulfillment: Record<string, FulfillmentStage>;
  progress: OrderProgressStage;
  receivedAt: string | null;
}

export interface UpdateOrderFulfillmentInput {
  status: FulfillmentStage;
  expectedVersion?: number;
}

export function parseUpdateOrderFulfillmentInput(
  raw: Record<string, unknown>,
): UpdateOrderFulfillmentInput {
  const extra = assertNoUnknownFields(raw, ['status', 'expectedVersion']);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en despacho: ${extra.join(', ')}.`);
  }
  if (raw.status !== 'preparado' && raw.status !== 'enviado') {
    throw httpErrors.validation('El estado deseado debe ser "preparado" o "enviado".');
  }
  if (
    raw.expectedVersion !== undefined &&
    !isBoundedInteger(raw.expectedVersion, 1, 1_000_000_000)
  ) {
    throw httpErrors.validation('expectedVersion debe ser un entero positivo.');
  }
  return {
    status: raw.status,
    ...(raw.expectedVersion !== undefined ? { expectedVersion: raw.expectedVersion } : {}),
  };
}

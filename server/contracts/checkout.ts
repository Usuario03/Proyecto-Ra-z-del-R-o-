import crypto from 'node:crypto';
import { PAYMENT_METHODS, type Delivery, type PaymentMethod } from '../../src/domain';
import { isBoundedInteger } from '../domain/commerce';
import { httpErrors } from '../security/errors';
import { assertNoUnknownFields, isNonEmptyString, isPlainObject } from './common';

export interface CreateCheckoutAttemptInput {
  requestKey: string;
  cartVersion: number;
  method: PaymentMethod;
  bank: string;
  customerType: string;
  delivery: Delivery;
}

export interface ConfirmCheckoutAttemptInput {
  outcome: 'exitoso' | 'rechazado';
}

export interface CheckoutAttemptDto {
  id: string;
  status: 'pending' | 'exitoso' | 'rechazado' | 'vencido' | 'stale';
  paymentMethod: PaymentMethod;
  amountCop: string;
  expiresAt: string;
  orderId: string | null;
  resultCode: string | null;
}

const CREATE_ATTEMPT_FIELDS = [
  'requestKey',
  'cartVersion',
  'method',
  'bank',
  'customerType',
  'delivery',
] as const;

const DELIVERY_FIELDS = ['name', 'phone', 'address', 'slot', 'date'] as const;

export function parseCreateCheckoutAttemptInput(
  raw: Record<string, unknown>,
  headerIdempotencyKey?: string | null,
): CreateCheckoutAttemptInput {
  const extra = assertNoUnknownFields(raw, CREATE_ATTEMPT_FIELDS);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en checkout: ${extra.join(', ')}.`);
  }

  const requestKey = (headerIdempotencyKey ?? (raw.requestKey as string | undefined) ?? '').trim();
  if (!isNonEmptyString(requestKey, 120)) {
    throw httpErrors.validation('Se requiere requestKey o cabecera Idempotency-Key.');
  }

  if (!isBoundedInteger(raw.cartVersion, 1, 1_000_000_000)) {
    throw httpErrors.validation('cartVersion debe ser un entero positivo.');
  }

  if (typeof raw.method !== 'string' || !PAYMENT_METHODS.includes(raw.method as PaymentMethod)) {
    throw httpErrors.validation('Selecciona un método de pago válido (PSE, Nequi, Daviplata o Tarjeta).');
  }

  if (!isPlainObject(raw.delivery)) {
    throw httpErrors.validation('Completa los datos de entrega.');
  }
  const deliveryExtra = assertNoUnknownFields(raw.delivery, DELIVERY_FIELDS);
  if (deliveryExtra.length > 0) {
    throw httpErrors.validation(`Campos de entrega no permitidos: ${deliveryExtra.join(', ')}.`);
  }

  const name = typeof raw.delivery.name === 'string' ? raw.delivery.name.trim() : '';
  const phone = typeof raw.delivery.phone === 'string' ? raw.delivery.phone.trim() : '';
  const address = typeof raw.delivery.address === 'string' ? raw.delivery.address.trim() : '';
  const slot = typeof raw.delivery.slot === 'string' ? raw.delivery.slot.trim() : '';
  const date = typeof raw.delivery.date === 'string' ? raw.delivery.date.trim() : '';

  if (name.length < 2 || name.length > 100) {
    throw httpErrors.validation('Indica el nombre de quien recibe el pedido.');
  }
  if (!/^3\d{9}$/.test(phone)) {
    throw httpErrors.validation('Indica un celular de contacto válido de 10 dígitos.');
  }
  if (address.length < 8 || address.length > 180) {
    throw httpErrors.validation('Indica una dirección de entrega válida en Barrancabermeja.');
  }
  if (!isNonEmptyString(slot, 80) || !isNonEmptyString(date, 80)) {
    throw httpErrors.validation('Selecciona la fecha y franja de entrega.');
  }

  return {
    requestKey,
    cartVersion: raw.cartVersion,
    method: raw.method as PaymentMethod,
    bank: typeof raw.bank === 'string' ? raw.bank.trim().slice(0, 80) : '',
    customerType: typeof raw.customerType === 'string' ? raw.customerType.trim().slice(0, 40) : 'natural',
    delivery: { name, phone, address, slot, date },
  };
}

export function parseConfirmCheckoutAttemptInput(
  raw: Record<string, unknown>,
): ConfirmCheckoutAttemptInput {
  const extra = assertNoUnknownFields(raw, ['outcome']);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en confirmación: ${extra.join(', ')}.`);
  }
  const outcome = raw.outcome === 'success' ? 'exitoso' : raw.outcome === 'rejected' ? 'rechazado' : raw.outcome;
  if (outcome !== 'exitoso' && outcome !== 'rechazado') {
    throw httpErrors.validation('El resultado simulado (outcome) debe ser "exitoso" o "rechazado".');
  }
  return { outcome };
}

export function computeCheckoutRequestHash(input: CreateCheckoutAttemptInput): string {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        v: 1,
        cartVersion: input.cartVersion,
        method: input.method,
        bank: input.bank,
        customerType: input.customerType,
        delivery: input.delivery,
      }),
    )
    .digest('hex');
}

export function computeConfirmationHash(attemptId: string, outcome: 'exitoso' | 'rechazado'): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ v: 1, operation: 'confirm', attemptId, outcome }))
    .digest('hex');
}

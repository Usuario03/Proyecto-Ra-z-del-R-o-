import type {
  CartDto,
  MergeCartInput,
  SetCartLineInput,
} from '../../server/contracts/cart';
import type {
  CheckoutAttemptDto,
  ConfirmCheckoutAttemptInput,
  CreateCheckoutAttemptInput,
} from '../../server/contracts/checkout';
import type { OrderDto, UpdateOrderFulfillmentInput } from '../../server/contracts/order';
import type { FulfillmentStage } from '../../server/domain/commerce';
import { apiRequest } from './api';
import { getClientJwtToken } from './session';

export async function fetchCartFromApi(): Promise<CartDto> {
  return apiRequest<CartDto>('/api/cart', {
    method: 'GET',
    token: getClientJwtToken(),
  });
}

export async function setCartLineInApi(
  lotId: string,
  input: SetCartLineInput,
): Promise<CartDto> {
  return apiRequest<CartDto>(`/api/cart/lines/${encodeURIComponent(lotId)}`, {
    method: 'PUT',
    body: input,
    token: getClientJwtToken(),
  });
}

export async function removeCartLineInApi(lotId: string): Promise<CartDto> {
  return apiRequest<CartDto>(`/api/cart/lines/${encodeURIComponent(lotId)}`, {
    method: 'DELETE',
    token: getClientJwtToken(),
  });
}

export async function clearCartInApi(): Promise<CartDto> {
  return apiRequest<CartDto>('/api/cart', {
    method: 'DELETE',
    token: getClientJwtToken(),
  });
}

export async function mergeGuestCartInApi(input: MergeCartInput): Promise<CartDto> {
  return apiRequest<CartDto>('/api/cart/merge', {
    method: 'POST',
    body: input,
    token: getClientJwtToken(),
  });
}

export async function createCheckoutAttemptInApi(
  input: CreateCheckoutAttemptInput,
): Promise<CheckoutAttemptDto> {
  return apiRequest<CheckoutAttemptDto>('/api/checkout/attempts', {
    method: 'POST',
    body: input,
    headers: { 'Idempotency-Key': input.requestKey },
    token: getClientJwtToken(),
  });
}

export async function fetchCheckoutAttemptFromApi(
  attemptId: string,
): Promise<CheckoutAttemptDto> {
  return apiRequest<CheckoutAttemptDto>(
    `/api/checkout/attempts/${encodeURIComponent(attemptId)}`,
    {
      method: 'GET',
      token: getClientJwtToken(),
    },
  );
}

export async function confirmCheckoutAttemptInApi(
  attemptId: string,
  input: ConfirmCheckoutAttemptInput,
): Promise<{ attempt: CheckoutAttemptDto; order: OrderDto | null }> {
  return apiRequest<{ attempt: CheckoutAttemptDto; order: OrderDto | null }>(
    `/api/checkout/attempts/${encodeURIComponent(attemptId)}/confirm`,
    {
      method: 'POST',
      body: input,
      token: getClientJwtToken(),
    },
  );
}

export async function fetchOrdersFromApi(): Promise<OrderDto[]> {
  const res = await apiRequest<{ items: OrderDto[] }>('/api/orders', {
    method: 'GET',
    token: getClientJwtToken(),
  });
  return res.items;
}

export async function advanceOrderFulfillmentInApi(
  orderId: string,
  input: UpdateOrderFulfillmentInput,
): Promise<{ orderId: string; fisherId: string; status: FulfillmentStage; version: number }> {
  return apiRequest(`/api/orders/${encodeURIComponent(orderId)}/fulfillment`, {
    method: 'PATCH',
    body: input,
    token: getClientJwtToken(),
  });
}

export async function confirmOrderReceivedInApi(
  orderId: string,
): Promise<{ orderId: string; receivedAt: string }> {
  return apiRequest(`/api/orders/${encodeURIComponent(orderId)}/received`, {
    method: 'POST',
    token: getClientJwtToken(),
  });
}

export async function fetchFisherMetricsFromApi() {
  return apiRequest<{
    days: Array<{ date: string; amount: number; kg: number; pieces: number }>;
    today: number;
    week: number;
    kg: number;
    pieces: number;
    pending: number;
  }>('/api/metrics/me', {
    method: 'GET',
    token: getClientJwtToken(),
  });
}

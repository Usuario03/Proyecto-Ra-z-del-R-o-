import { isUuid } from '../contracts/common';
import { parseUpdateOrderFulfillmentInput } from '../contracts/order';
import { requireRole } from '../security/authorization';
import {
  httpErrors,
  jsonSuccess,
  readValidatedJsonBody,
  toErrorResponse,
} from '../security/errors';
import { enforceFixedWindowRateLimits } from '../security/limits';
import { verifyRequestOrigin } from '../security/origin';
import {
  advanceOrderFulfillmentByFisher,
  confirmOrderReceivedByBuyer,
  getFisherMetrics,
  listOrdersForBuyer,
  listOrdersForFisher,
  listTransactionsForBuyer,
} from '../services/checkout';

export async function handleOrdersGet(request: Request): Promise<Response> {
  try {
    const session = requireRole(request, ['client', 'fisher']);
    if (session.role === 'fisher') {
      const items = await listOrdersForFisher(session.sub);
      return jsonSuccess({ items, transactions: [] });
    }
    const [items, transactions] = await Promise.all([
      listOrdersForBuyer(session.sub),
      listTransactionsForBuyer(session.sub),
    ]);
    return jsonSuccess({ items, transactions });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleOrderFulfillmentPatch(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['fisher']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const { id } = await context.params;
    if (!isUuid(id)) {
      throw httpErrors.badRequest('Identificador de pedido inválido.');
    }

    const body = await readValidatedJsonBody(request);
    const input = parseUpdateOrderFulfillmentInput(body);
    const result = await advanceOrderFulfillmentByFisher(
      session.sub,
      id.toLowerCase(),
      input.status,
    );
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleOrderReceivedPost(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['client']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const { id } = await context.params;
    if (!isUuid(id)) {
      throw httpErrors.badRequest('Identificador de pedido inválido.');
    }

    const result = await confirmOrderReceivedByBuyer(session.sub, id.toLowerCase());
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleFisherMetricsGet(request: Request): Promise<Response> {
  try {
    const session = requireRole(request, ['fisher']);
    const metrics = await getFisherMetrics(session.sub);
    return jsonSuccess(metrics);
  } catch (error) {
    return toErrorResponse(error);
  }
}

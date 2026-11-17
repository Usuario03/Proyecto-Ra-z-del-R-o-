import {
  parseMergeCartInput,
  parseSetCartLineInput,
} from '../contracts/cart';
import { isUuid } from '../contracts/common';
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
  clearBuyerCart,
  getBuyerCart,
  mergeGuestCart,
  removeBuyerCartLine,
  setBuyerCartLine,
} from '../services/carts';

export async function handleCartGet(request: Request): Promise<Response> {
  try {
    const session = requireRole(request, ['client']);
    const cart = await getBuyerCart(session.sub);
    return jsonSuccess(cart);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCartDelete(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['client']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const cart = await clearBuyerCart(session.sub);
    return jsonSuccess(cart);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCartLinePut(
  request: Request,
  context: { params: Promise<{ lotId: string }> },
): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['client']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const { lotId } = await context.params;
    if (!isUuid(lotId)) {
      throw httpErrors.badRequest('Identificador de lote inválido.');
    }

    const body = await readValidatedJsonBody(request);
    const input = parseSetCartLineInput(body);
    const cart = await setBuyerCartLine(session.sub, lotId.toLowerCase(), input);
    return jsonSuccess(cart);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCartLineDelete(
  request: Request,
  context: { params: Promise<{ lotId: string }> },
): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['client']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const { lotId } = await context.params;
    if (!isUuid(lotId)) {
      throw httpErrors.badRequest('Identificador de lote inválido.');
    }

    const cart = await removeBuyerCartLine(session.sub, lotId.toLowerCase());
    return jsonSuccess(cart);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCartMergePost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['client']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const body = await readValidatedJsonBody(request);
    const input = parseMergeCartInput(body);
    const cart = await mergeGuestCart(session.sub, input);
    return jsonSuccess(cart);
  } catch (error) {
    return toErrorResponse(error);
  }
}

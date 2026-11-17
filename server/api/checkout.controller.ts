import {
  parseConfirmCheckoutAttemptInput,
  parseCreateCheckoutAttemptInput,
} from '../contracts/checkout';
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
  confirmCheckoutAttempt,
  createCheckoutAttempt,
  getCheckoutAttemptById,
} from '../services/checkout';

export async function handleCheckoutAttemptsPost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['client']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const body = await readValidatedJsonBody(request);
    const input = parseCreateCheckoutAttemptInput(body);
    const attempt = await createCheckoutAttempt(session.sub, input);
    return jsonSuccess(attempt, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCheckoutAttemptByIdGet(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = requireRole(request, ['client']);
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw httpErrors.badRequest('Identificador de intento inválido.');
    }

    const attempt = await getCheckoutAttemptById(session.sub, id.toLowerCase());
    return jsonSuccess(attempt);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleCheckoutConfirmPost(
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
      throw httpErrors.badRequest('Identificador de intento inválido.');
    }

    const body = await readValidatedJsonBody(request);
    const input = parseConfirmCheckoutAttemptInput(body);
    const result = await confirmCheckoutAttempt(session.sub, id.toLowerCase(), input);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

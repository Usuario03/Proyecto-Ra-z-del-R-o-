import {
  parseCreateCaptureLotInput,
  parseUpdateLotInventoryInput,
} from '../contracts/capture';
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
  createCaptureLot,
  listPublicCatalog,
  updateLotInventory,
  withdrawLot,
} from '../services/catalog';

export async function handleLotsGet(request: Request): Promise<Response> {
  try {
    const session = requireRole(request, ['fisher']);
    const items = await listPublicCatalog({ fisherId: session.sub });
    return jsonSuccess({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleLotsPost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['fisher']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const body = await readValidatedJsonBody(request);
    const input = parseCreateCaptureLotInput(body);
    const lot = await createCaptureLot(session.sub, input);
    return jsonSuccess(lot, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleLotByIdPatch(
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
      throw httpErrors.badRequest('Identificador de lote inválido.');
    }

    const body = await readValidatedJsonBody(request);
    const input = parseUpdateLotInventoryInput(body);
    const updated = await updateLotInventory(session.sub, id, input);
    return jsonSuccess(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleLotByIdDelete(
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
      throw httpErrors.badRequest('Identificador de lote inválido.');
    }

    await withdrawLot(session.sub, id);
    return jsonSuccess({ withdrawn: true, id });
  } catch (error) {
    return toErrorResponse(error);
  }
}

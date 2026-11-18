import { parseCreateFisherInput } from '../contracts/profile';
import { requireRole } from '../security/authorization';
import { jsonSuccess, readValidatedJsonBody, toErrorResponse } from '../security/errors';
import { enforceFixedWindowRateLimits } from '../security/limits';
import { verifyRequestOrigin } from '../security/origin';
import { createFisherAccount } from '../services/profiles';

export async function handleFisherCreatePost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['admin']);
    enforceFixedWindowRateLimits([
      { scope: 'create-fisher:account', key: session.sub, limit: 10, windowSeconds: 3600 },
    ]);
    const input = parseCreateFisherInput(await readValidatedJsonBody(request));
    const profile = await createFisherAccount(session, input);
    return jsonSuccess(profile, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

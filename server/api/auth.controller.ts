import { parseLoginInput } from '../contracts/profile';
import {
  buildSessionCookieHeader,
  clearSessionCookieHeader,
} from '../security/auth';
import {
  jsonSuccess,
  readValidatedJsonBody,
  toErrorResponse,
} from '../security/errors';
import { enforceFixedWindowRateLimits } from '../security/limits';
import { verifyRequestOrigin } from '../security/origin';
import { authenticateWithPassword } from '../services/profiles';

export async function handleLoginPost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const clientIp =
      request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';

    enforceFixedWindowRateLimits([
      { scope: 'login:ip', key: clientIp, limit: 10, windowSeconds: 300 },
    ]);

    const body = await readValidatedJsonBody(request);
    const input = parseLoginInput(body);
    const result = await authenticateWithPassword(input);

    return jsonSuccess(result, 200, {
      'Set-Cookie': buildSessionCookieHeader(result.token),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleLogoutPost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    return jsonSuccess({ loggedOut: true }, 200, {
      'Set-Cookie': clearSessionCookieHeader(),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

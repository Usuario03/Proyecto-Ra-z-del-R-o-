import {
  parseChangeCredentialsInput,
  parseOnboardingInput,
  parseUpdateProfileInput,
} from '../contracts/profile';
import { buildSessionCookieHeader } from '../security/auth';
import { requireSession } from '../security/authorization';
import {
  jsonSuccess,
  readValidatedJsonBody,
  toErrorResponse,
} from '../security/errors';
import { enforceFixedWindowRateLimits } from '../security/limits';
import { verifyRequestOrigin } from '../security/origin';
import {
  changeMyCredentials,
  getMyProfile,
  registerAndOnboardUser,
  updateMyProfile,
} from '../services/profiles';

export async function handleMeGet(request: Request): Promise<Response> {
  try {
    const session = requireSession(request);
    const profile = await getMyProfile(session.sub);
    return jsonSuccess(profile);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleMeProfilePatch(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireSession(request);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const body = await readValidatedJsonBody(request);
    const input = parseUpdateProfileInput(body);
    const updated = await updateMyProfile(session.sub, input);
    return jsonSuccess(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleMeCredentialsPost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireSession(request);
    enforceFixedWindowRateLimits([
      { scope: 'credentials:account', key: session.sub, limit: 5, windowSeconds: 900 },
    ]);

    const body = await readValidatedJsonBody(request);
    const input = parseChangeCredentialsInput(body);
    const result = await changeMyCredentials(session, input);
    return jsonSuccess(result, 200, {
      'Set-Cookie': buildSessionCookieHeader(result.token),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleMeOnboardingPost(request: Request): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const clientIp =
      request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';

    enforceFixedWindowRateLimits([
      { scope: 'onboarding:ip', key: clientIp, limit: 3, windowSeconds: 3600 },
    ]);

    const body = await readValidatedJsonBody(request);
    const input = parseOnboardingInput(body);
    const result = await registerAndOnboardUser(input);
    return jsonSuccess(result, 201, {
      'Set-Cookie': buildSessionCookieHeader(result.token),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

import { parseUpdateEnvironmentalRuleInput } from '../contracts/environment';
import { requireRole } from '../security/authorization';
import {
  jsonSuccess,
  readValidatedJsonBody,
  toErrorResponse,
} from '../security/errors';
import { enforceFixedWindowRateLimits } from '../security/limits';
import { verifyRequestOrigin } from '../security/origin';
import {
  listEnvironmentalAudit,
  listEnvironmentalRules,
  updateEnvironmentalRuleByAdmin,
} from '../services/environment';

export async function handleEnvironmentRulesGet(): Promise<Response> {
  try {
    const items = await listEnvironmentalRules();
    return jsonSuccess({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleEnvironmentRulePatch(
  request: Request,
  context: { params: Promise<{ speciesId: string }> },
): Promise<Response> {
  try {
    verifyRequestOrigin(request);
    const session = requireRole(request, ['admin']);
    enforceFixedWindowRateLimits([
      { scope: 'mut:account', key: session.sub, limit: 60, windowSeconds: 60 },
    ]);

    const { speciesId } = await context.params;
    const body = await readValidatedJsonBody(request);
    const input = parseUpdateEnvironmentalRuleInput(body);
    const updated = await updateEnvironmentalRuleByAdmin(
      session.sub,
      session.name,
      speciesId,
      input,
    );
    return jsonSuccess(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function handleEnvironmentAuditGet(request: Request): Promise<Response> {
  try {
    requireRole(request, ['admin']);
    const items = await listEnvironmentalAudit(50);
    return jsonSuccess({ items });
  } catch (error) {
    return toErrorResponse(error);
  }
}

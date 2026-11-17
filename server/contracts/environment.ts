import { isBoundedInteger } from '../domain/commerce';
import { validateEnvironmentalRuleInput } from '../domain/environment';
import { httpErrors } from '../security/errors';
import { assertNoUnknownFields } from './common';

export interface EnvironmentalRuleDto {
  speciesId: string;
  speciesName: string;
  banned: boolean;
  minimumLengthCm: number;
  simulatedLengthCm: number;
  version: number;
  updatedAt: string;
}

export interface EnvironmentalAuditDto {
  id: string;
  speciesId: string | null;
  actorName: string;
  description: string;
  occurredAt: string;
}

export interface UpdateEnvironmentalRuleInput {
  banned?: boolean;
  minimumLengthCm?: number;
  simulatedLengthCm?: number;
  expectedVersion: number;
}

const RULE_ALLOWED_FIELDS = [
  'banned',
  'minimumLengthCm',
  'simulatedLengthCm',
  'expectedVersion',
] as const;

export function parseUpdateEnvironmentalRuleInput(
  raw: Record<string, unknown>,
): UpdateEnvironmentalRuleInput {
  const extra = assertNoUnknownFields(raw, RULE_ALLOWED_FIELDS);
  if (extra.length > 0) {
    throw httpErrors.validation(`Campos no permitidos en regla ambiental: ${extra.join(', ')}.`);
  }

  if (!isBoundedInteger(raw.expectedVersion, 1, 1_000_000_000)) {
    throw httpErrors.validation('Se requiere expectedVersion entero positivo.');
  }

  if (
    raw.banned === undefined &&
    raw.minimumLengthCm === undefined &&
    raw.simulatedLengthCm === undefined
  ) {
    throw httpErrors.validation('Indica al menos un cambio en la regla ambiental.');
  }

  const ruleError = validateEnvironmentalRuleInput({
    banned: raw.banned,
    minimum: raw.minimumLengthCm,
  });
  if (ruleError) {
    throw httpErrors.validation(ruleError);
  }

  if (raw.simulatedLengthCm !== undefined) {
    const simError = validateEnvironmentalRuleInput({ minimum: raw.simulatedLengthCm });
    if (simError) {
      throw httpErrors.validation(simError);
    }
  }

  return {
    ...(raw.banned !== undefined ? { banned: raw.banned as boolean } : {}),
    ...(raw.minimumLengthCm !== undefined
      ? { minimumLengthCm: raw.minimumLengthCm as number }
      : {}),
    ...(raw.simulatedLengthCm !== undefined
      ? { simulatedLengthCm: raw.simulatedLengthCm as number }
      : {}),
    expectedVersion: raw.expectedVersion,
  };
}

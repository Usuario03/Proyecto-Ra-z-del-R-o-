import type {
  EnvironmentalAuditDto,
  EnvironmentalRuleDto,
  UpdateEnvironmentalRuleInput,
} from '../contracts/environment';
import { getDbPool, type QueryExecutor, withTransaction } from '../db/db';
import { httpErrors } from '../security/errors';

interface RuleJoinRow {
  species_id: string;
  species_name: string;
  banned: boolean;
  minimum_length_cm: number;
  simulated_length_cm: number;
  version: number;
  updated_at: Date | string;
}

export async function listEnvironmentalRules(
  db: QueryExecutor = getDbPool(),
): Promise<EnvironmentalRuleDto[]> {
  const result = await db.query<RuleJoinRow>(`
    SELECT
      er.species_id,
      s.name AS species_name,
      er.banned,
      er.minimum_length_cm,
      er.simulated_length_cm,
      er.version,
      er.updated_at
    FROM public.environmental_rules er
    INNER JOIN public.species s ON s.id = er.species_id
    ORDER BY s.name ASC
  `);

  return result.rows.map(row => ({
    speciesId: row.species_id,
    speciesName: row.species_name,
    banned: Boolean(row.banned),
    minimumLengthCm: Number(row.minimum_length_cm),
    simulatedLengthCm: Number(row.simulated_length_cm),
    version: Number(row.version),
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function updateEnvironmentalRuleByAdmin(
  actorId: string | null,
  actorName: string,
  speciesId: string,
  input: UpdateEnvironmentalRuleInput,
): Promise<EnvironmentalRuleDto> {
  return withTransaction(
    async tx => {
      const existing = await tx.query<RuleJoinRow>(
        `
        SELECT
          er.species_id,
          s.name AS species_name,
          er.banned,
          er.minimum_length_cm,
          er.simulated_length_cm,
          er.version,
          er.updated_at
        FROM public.environmental_rules er
        INNER JOIN public.species s ON s.id = er.species_id
        WHERE er.species_id = $1
        FOR UPDATE OF er
        `,
        [speciesId],
      );

      const current = existing.rows[0];
      if (!current) {
        throw httpErrors.notFound('Selecciona una especie válida del catálogo.');
      }

      if (Number(current.version) !== input.expectedVersion) {
        throw httpErrors.conflict(
          'La regla ambiental fue modificada por otra sesión. Recarga antes de aplicar cambios.',
          'VERSION_CONFLICT',
        );
      }

      const nextBanned = input.banned !== undefined ? input.banned : Boolean(current.banned);
      const nextMinimum =
        input.minimumLengthCm !== undefined
          ? input.minimumLengthCm
          : Number(current.minimum_length_cm);
      const nextSimulated =
        input.simulatedLengthCm !== undefined
          ? input.simulatedLengthCm
          : Number(current.simulated_length_cm);

      const updated = await tx.query<{ version: number; updated_at: Date }>(
        `
        UPDATE public.environmental_rules
        SET banned = $1,
            minimum_length_cm = $2,
            simulated_length_cm = $3,
            version = version + 1,
            updated_at = now()
        WHERE species_id = $4 AND version = $5
        RETURNING version, updated_at
        `,
        [nextBanned, nextMinimum, nextSimulated, speciesId, input.expectedVersion],
      );

      const parts: string[] = [];
      if (input.banned !== undefined) {
        parts.push(`veda ${nextBanned ? 'activada' : 'desactivada'}`);
      }
      if (input.minimumLengthCm !== undefined) {
        parts.push(`talla mínima ajustada a ${nextMinimum} cm`);
      }
      if (input.simulatedLengthCm !== undefined) {
        parts.push(`talla simulada ajustada a ${nextSimulated} cm`);
      }
      const description = `${current.species_name}: ${parts.join(', ')}.`;

      await tx.query(
        `
        INSERT INTO public.environmental_audit (
          species_id,
          actor_id,
          actor_name,
          description,
          previous_state,
          next_state
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
        `,
        [
          speciesId,
          actorId,
          actorName,
          description,
          JSON.stringify({
            banned: current.banned,
            minimumLengthCm: current.minimum_length_cm,
            simulatedLengthCm: current.simulated_length_cm,
            version: current.version,
          }),
          JSON.stringify({
            banned: nextBanned,
            minimumLengthCm: nextMinimum,
            simulatedLengthCm: nextSimulated,
            version: updated.rows[0].version,
          }),
        ],
      );

      return {
        speciesId,
        speciesName: current.species_name,
        banned: nextBanned,
        minimumLengthCm: nextMinimum,
        simulatedLengthCm: nextSimulated,
        version: Number(updated.rows[0].version),
        updatedAt: new Date(updated.rows[0].updated_at).toISOString(),
      };
    },
    { isolationLevel: 'SERIALIZABLE' },
  );
}

export async function listEnvironmentalAudit(
  limit = 50,
  db: QueryExecutor = getDbPool(),
): Promise<EnvironmentalAuditDto[]> {
  const safeLimit = Math.min(Math.max(1, limit), 50);
  const result = await db.query<{
    id: string;
    species_id: string | null;
    actor_name: string;
    description: string;
    occurred_at: Date | string;
  }>(
    `
    SELECT id, species_id, actor_name, description, occurred_at
    FROM public.environmental_audit
    ORDER BY occurred_at DESC, id DESC
    LIMIT $1
    `,
    [safeLimit],
  );

  return result.rows.map(row => ({
    id: row.id,
    speciesId: row.species_id,
    actorName: row.actor_name,
    description: row.description,
    occurredAt: new Date(row.occurred_at).toISOString(),
  }));
}

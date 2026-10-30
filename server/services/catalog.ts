import type {
  CreateCaptureLotInput,
  UpdateLotInventoryInput,
} from '../contracts/capture';
import type {
  CatalogLotDto,
  CatalogQueryFilters,
  SpeciesDto,
} from '../contracts/catalog';
import { portrait } from '../../src/domain';
import { getDbPool, type QueryExecutor, withTransaction } from '../db/db';
import { httpErrors } from '../security/errors';

interface SpeciesRow {
  id: string;
  name: string;
  scientific_name: string;
  description: string;
  illustration_color: string;
  suggested_price_cop: string | number;
  suggested_length_cm: number;
  banned: boolean | null;
  minimum_length_cm: number | null;
  simulated_length_cm: number | null;
}

interface CatalogLotRow {
  id: string;
  species_id: string;
  species_name: string;
  scientific_name: string;
  description: string;
  illustration_color: string;
  price_per_kg_cop: string | number;
  stock_units: number;
  piece_weight_grams: number | null;
  length_cm: number;
  minimum_length_cm: number;
  banned: boolean;
  zone: string;
  method: string;
  captured_at: Date | string;
  landed_at: Date | string;
  temperature_c: string | number | null;
  paused: boolean;
  fisher_id: string;
  fisher_name: string;
  member_code: string;
  version: number;
}

function mapCatalogLotRow(row: CatalogLotRow, index = 0): CatalogLotDto {
  return {
    id: row.id,
    speciesId: row.species_id,
    name: row.species_name,
    scientific: row.scientific_name,
    description: row.description,
    color: row.illustration_color,
    price: Number(row.price_per_kg_cop),
    stock: Number(row.stock_units),
    ...(row.piece_weight_grams !== null ? { pieceWeightGrams: Number(row.piece_weight_grams) } : {}),
    length: Number(row.length_cm),
    minimum: Number(row.minimum_length_cm),
    zone: row.zone,
    method: row.method,
    capturedAt: new Date(row.captured_at).toISOString(),
    landedAt: new Date(row.landed_at).toISOString(),
    temperature: row.temperature_c !== null ? Number(row.temperature_c) : 2,
    photo: portrait(row.illustration_color || '#9baf9b', index),
    paused: Boolean(row.paused),
    banned: Boolean(row.banned),
    fisherId: row.fisher_id,
    fisher: row.fisher_name,
    member: row.member_code,
    version: Number(row.version),
  };
}

export async function listSpecies(db: QueryExecutor = getDbPool()): Promise<SpeciesDto[]> {
  const result = await db.query<SpeciesRow>(`
    SELECT
      s.id,
      s.name,
      s.scientific_name,
      s.description,
      s.illustration_color,
      s.suggested_price_cop,
      s.suggested_length_cm,
      er.banned,
      er.minimum_length_cm,
      er.simulated_length_cm
    FROM public.species s
    LEFT JOIN public.environmental_rules er ON er.species_id = s.id
    ORDER BY s.name ASC
  `);

  return result.rows.map(row => ({
    id: row.id,
    name: row.name,
    scientificName: row.scientific_name,
    description: row.description,
    illustrationColor: row.illustration_color,
    suggestedPriceCop: Number(row.suggested_price_cop),
    suggestedLengthCm: Number(row.suggested_length_cm),
    banned: Boolean(row.banned ?? false),
    minimumLengthCm: Number(row.minimum_length_cm ?? row.suggested_length_cm),
    simulatedLengthCm: Number(row.simulated_length_cm ?? row.suggested_length_cm),
  }));
}

export async function listPublicCatalog(
  filters: CatalogQueryFilters = {},
  db: QueryExecutor = getDbPool(),
): Promise<CatalogLotDto[]> {
  const conditions: string[] = ['l.withdrawn_at IS NULL'];
  const values: unknown[] = [];

  if (filters.speciesId) {
    values.push(filters.speciesId);
    conditions.push(`l.species_id = $${values.length}`);
  }
  if (filters.zone) {
    values.push(filters.zone);
    conditions.push(`l.zone = $${values.length}`);
  }
  if (filters.fisherId) {
    values.push(filters.fisherId);
    conditions.push(`l.fisher_id = $${values.length}`);
  }
  if (filters.unitMode === 'piece') {
    conditions.push('l.piece_weight_grams IS NOT NULL');
  } else if (filters.unitMode === 'kg') {
    conditions.push('l.piece_weight_grams IS NULL');
  }
  if (filters.search) {
    values.push(`%${filters.search.trim()}%`);
    conditions.push(
      `(s.name ILIKE $${values.length} OR p.name ILIKE $${values.length} OR l.zone ILIKE $${values.length})`,
    );
  }

  const result = await db.query<CatalogLotRow>(
    `
    SELECT
      l.id,
      l.species_id,
      s.name AS species_name,
      s.scientific_name,
      s.description,
      s.illustration_color,
      l.price_per_kg_cop,
      l.stock_units,
      l.piece_weight_grams,
      l.length_cm,
      COALESCE(er.minimum_length_cm, s.suggested_length_cm) AS minimum_length_cm,
      COALESCE(er.banned, false) AS banned,
      l.zone,
      l.method,
      l.captured_at,
      l.landed_at,
      l.temperature_c,
      l.paused,
      l.fisher_id,
      p.name AS fisher_name,
      fd.member_code,
      l.version
    FROM public.lots l
    INNER JOIN public.species s ON s.id = l.species_id
    LEFT JOIN public.environmental_rules er ON er.species_id = s.id
    INNER JOIN public.fisher_details fd ON fd.user_id = l.fisher_id
    INNER JOIN public.profiles p ON p.user_id = fd.user_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY l.created_at DESC, l.id DESC
    LIMIT 50
    `,
    values,
  );

  return result.rows.map((row, idx) => mapCatalogLotRow(row, idx));
}

export async function createCaptureLot(
  fisherId: string,
  input: CreateCaptureLotInput,
): Promise<CatalogLotDto> {
  return withTransaction(async tx => {
    const speciesResult = await tx.query<{
      id: string;
      suggested_length_cm: number;
      banned: boolean | null;
      minimum_length_cm: number | null;
    }>(
      `
      SELECT
        s.id,
        s.suggested_length_cm,
        er.banned,
        er.minimum_length_cm
      FROM public.species s
      LEFT JOIN public.environmental_rules er ON er.species_id = s.id
      WHERE s.id = $1
      FOR SHARE
      `,
      [input.speciesId],
    );

    const species = speciesResult.rows[0];
    if (!species) {
      throw httpErrors.validation('Elige una especie de nuestra región.');
    }

    if (species.banned) {
      throw httpErrors.validation(
        'Esta especie está en veda. Ayudemos a cuidar la reproducción del río Magdalena.',
        undefined,
        'DOMAIN_RULE_VIOLATION',
      );
    }

    const minCm = Number(species.minimum_length_cm ?? species.suggested_length_cm);
    if (input.length < minCm) {
      throw httpErrors.validation(
        `La talla es menor a la permitida (${minCm} cm). Dejemos crecer a los peces.`,
        undefined,
        'DOMAIN_RULE_VIOLATION',
      );
    }

    const fisherCheck = await tx.query<{ user_id: string }>(
      `SELECT user_id FROM public.fisher_details WHERE user_id = $1`,
      [fisherId],
    );
    if (fisherCheck.rows.length === 0) {
      throw httpErrors.forbidden('Tu cuenta no tiene perfil de pescador registrado.');
    }

    const stockUnits =
      input.pieceWeightGrams !== undefined ? (input.quantity as number) : (input.kg as number);

    const inserted = await tx.query<{ id: string }>(
      `
      INSERT INTO public.lots (
        species_id,
        fisher_id,
        price_per_kg_cop,
        stock_units,
        piece_weight_grams,
        same_weight_confirmed,
        length_cm,
        zone,
        method,
        captured_at,
        landed_at,
        temperature_c,
        photo_id,
        paused,
        version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, 1)
      RETURNING id
      `,
      [
        input.speciesId,
        fisherId,
        input.price,
        stockUnits,
        input.pieceWeightGrams ?? null,
        input.sameWeightConfirmed ?? null,
        input.length,
        input.zone,
        input.method,
        input.capturedAt,
        input.landedAt,
        input.temperature,
        input.photoId ?? null,
      ],
    );

    const createdLots = await listPublicCatalog({ fisherId }, tx);
    const match = createdLots.find(lot => lot.id === inserted.rows[0].id);
    if (!match) {
      throw httpErrors.serviceUnavailable('No se pudo recuperar el lote recién publicado.');
    }
    return match;
  });
}

export async function updateLotInventory(
  fisherId: string,
  lotId: string,
  input: UpdateLotInventoryInput,
): Promise<CatalogLotDto> {
  return withTransaction(async tx => {
    const existing = await tx.query<{
      id: string;
      fisher_id: string;
      stock_units: number;
      paused: boolean;
      version: number;
      withdrawn_at: Date | null;
    }>(
      `
      SELECT id, fisher_id, stock_units, paused, version, withdrawn_at
      FROM public.lots
      WHERE id = $1
      FOR UPDATE
      `,
      [lotId],
    );

    const row = existing.rows[0];
    if (!row || row.withdrawn_at !== null) {
      throw httpErrors.notFound('El lote solicitado no existe o fue retirado.');
    }
    if (row.fisher_id !== fisherId) {
      throw httpErrors.forbidden(
        'Solo puedes cambiar tu propia pesca desde tu perfil de pescador.',
      );
    }
    if (Number(row.version) !== input.expectedVersion) {
      throw httpErrors.conflict(
        'El lote fue actualizado por otra operación. Recarga para ver la versión actual.',
        'VERSION_CONFLICT',
      );
    }

    const nextStock = input.stock !== undefined ? input.stock : Number(row.stock_units);
    const nextPaused = input.paused !== undefined ? input.paused : Boolean(row.paused);

    await tx.query(
      `
      UPDATE public.lots
      SET stock_units = $1,
          paused = $2,
          version = version + 1,
          updated_at = now()
      WHERE id = $3 AND version = $4
      `,
      [nextStock, nextPaused, lotId, input.expectedVersion],
    );

    const updatedLots = await listPublicCatalog({ fisherId }, tx);
    const match = updatedLots.find(lot => lot.id === lotId);
    if (!match) {
      throw httpErrors.notFound('El lote no pudo ser encontrado tras actualizar.');
    }
    return match;
  });
}

export async function withdrawLot(fisherId: string, lotId: string): Promise<void> {
  await withTransaction(async tx => {
    const existing = await tx.query<{
      id: string;
      fisher_id: string;
      withdrawn_at: Date | null;
    }>(
      `SELECT id, fisher_id, withdrawn_at FROM public.lots WHERE id = $1 FOR UPDATE`,
      [lotId],
    );

    const row = existing.rows[0];
    if (!row || row.withdrawn_at !== null) {
      throw httpErrors.notFound('El lote ya fue retirado o no existe.');
    }
    if (row.fisher_id !== fisherId) {
      throw httpErrors.forbidden('Solo puedes eliminar tus propias publicaciones.');
    }

    // Baja lógica: preserva los pedidos históricos (order_lines) y limpia canastas activas
    await tx.query(
      `
      UPDATE public.lots
      SET withdrawn_at = now(),
          paused = true,
          version = version + 1,
          updated_at = now()
      WHERE id = $1
      `,
      [lotId],
    );

    await tx.query(`DELETE FROM public.cart_lines WHERE lot_id = $1`, [lotId]);
  });
}

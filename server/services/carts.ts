import {
  type CartDto,
  type CartLineDto,
  computeCartMergeRequestHash,
  type MergeCartInput,
  type SetCartLineInput,
} from '../contracts/cart';
import {
  lineAmountBigInt,
  MAX_CART_DISTINCT_LINES,
  MAX_QUANTITY_UNITS,
  weightKg,
} from '../domain/commerce';
import { evaluateLotBlockReason } from '../domain/environment';
import { getDbPool, type QueryExecutor, withTransaction } from '../db/db';
import { httpErrors } from '../security/errors';

interface CartLineJoinRow {
  lot_id: string;
  quantity: number;
  species_id: string;
  species_name: string;
  fisher_id: string;
  fisher_name: string;
  price_per_kg_cop: string | number;
  piece_weight_grams: number | null;
  stock_units: number;
  length_cm: number;
  minimum_length_cm: number;
  banned: boolean;
  paused: boolean;
  withdrawn_at: Date | null;
}

async function ensureBuyerCartRow(
  buyerId: string,
  tx: QueryExecutor,
): Promise<{ id: string; version: number }> {
  const existing = await tx.query<{ id: string; version: number }>(
    `SELECT id, version FROM public.carts WHERE owner_id = $1 FOR UPDATE`,
    [buyerId],
  );
  if (existing.rows[0]) {
    return { id: existing.rows[0].id, version: Number(existing.rows[0].version) };
  }

  const inserted = await tx.query<{ id: string; version: number }>(
    `
    INSERT INTO public.carts (owner_id, version)
    VALUES ($1, 1)
    ON CONFLICT (owner_id) DO UPDATE SET updated_at = public.carts.updated_at
    RETURNING id, version
    `,
    [buyerId],
  );
  return { id: inserted.rows[0].id, version: Number(inserted.rows[0].version) };
}

export async function getBuyerCart(
  buyerId: string,
  db: QueryExecutor = getDbPool(),
): Promise<CartDto> {
  const cartRow = await db.query<{ id: string; version: number }>(
    `SELECT id, version FROM public.carts WHERE owner_id = $1`,
    [buyerId],
  );

  if (!cartRow.rows[0]) {
    return {
      version: 1,
      lines: [],
      totalWeightKg: 0,
      totalCop: '0',
    };
  }

  const { id: cartId, version } = cartRow.rows[0];
  const linesResult = await db.query<CartLineJoinRow>(
    `
    SELECT
      cl.lot_id,
      cl.quantity,
      l.species_id,
      s.name AS species_name,
      l.fisher_id,
      p.name AS fisher_name,
      l.price_per_kg_cop,
      l.piece_weight_grams,
      l.stock_units,
      l.length_cm,
      COALESCE(er.minimum_length_cm, s.suggested_length_cm) AS minimum_length_cm,
      COALESCE(er.banned, false) AS banned,
      l.paused,
      l.withdrawn_at
    FROM public.cart_lines cl
    INNER JOIN public.lots l ON l.id = cl.lot_id
    INNER JOIN public.species s ON s.id = l.species_id
    LEFT JOIN public.environmental_rules er ON er.species_id = s.id
    INNER JOIN public.profiles p ON p.user_id = l.fisher_id
    WHERE cl.cart_id = $1
    ORDER BY cl.created_at ASC, cl.lot_id ASC
    `,
    [cartId],
  );

  let totalCopBigInt = 0n;
  let totalWeightKg = 0;

  const lines: CartLineDto[] = linesResult.rows.map(row => {
    const pricePerKgCop = Math.trunc(Number(row.price_per_kg_cop));
    const quantity = Number(row.quantity);
    const lineCop = lineAmountBigInt(pricePerKgCop, quantity, row.piece_weight_grams);
    const lineKg = weightKg({ pieceWeightGrams: row.piece_weight_grams }, quantity);
    totalCopBigInt += lineCop;
    totalWeightKg += lineKg;

    const blockReason = evaluateLotBlockReason(
      {
        id: row.lot_id,
        speciesId: row.species_id,
        length: Number(row.length_cm),
        minimum: Number(row.minimum_length_cm),
        paused: Boolean(row.paused),
        stock: Number(row.stock_units),
        withdrawnAt: row.withdrawn_at,
      },
      {
        bans: { [row.species_id]: Boolean(row.banned) },
        minimumSizes: { [row.species_id]: Number(row.minimum_length_cm) },
      },
    );

    return {
      lotId: row.lot_id,
      speciesId: row.species_id,
      speciesName: row.species_name,
      fisherId: row.fisher_id,
      fisherName: row.fisher_name,
      pricePerKgCop,
      pieceWeightGrams: row.piece_weight_grams,
      quantity,
      weightKg: Number(lineKg.toFixed(3)),
      lineTotalCop: lineCop.toString(),
      availableStock: Number(row.stock_units),
      blockReason,
    };
  });

  return {
    version: Number(version),
    lines,
    totalWeightKg: Number(totalWeightKg.toFixed(3)),
    totalCop: totalCopBigInt.toString(),
  };
}

export async function setBuyerCartLine(
  buyerId: string,
  lotId: string,
  input: SetCartLineInput,
): Promise<CartDto> {
  return withTransaction(async tx => {
    const cart = await ensureBuyerCartRow(buyerId, tx);
    if (
      input.expectedCartVersion !== undefined &&
      cart.version !== input.expectedCartVersion
    ) {
      throw httpErrors.conflict(
        'Tu canasta cambió en otra pestaña. Recárgala antes de continuar.',
        'CART_VERSION_CONFLICT',
      );
    }

    const lotResult = await tx.query<{
      id: string;
      species_id: string;
      stock_units: number;
      length_cm: number;
      paused: boolean;
      withdrawn_at: Date | null;
      banned: boolean;
      minimum_length_cm: number;
    }>(
      `
      SELECT
        l.id,
        l.species_id,
        l.stock_units,
        l.length_cm,
        l.paused,
        l.withdrawn_at,
        COALESCE(er.banned, false) AS banned,
        COALESCE(er.minimum_length_cm, s.suggested_length_cm) AS minimum_length_cm
      FROM public.lots l
      INNER JOIN public.species s ON s.id = l.species_id
      LEFT JOIN public.environmental_rules er ON er.species_id = s.id
      WHERE l.id = $1
      FOR SHARE OF l
      `,
      [lotId],
    );

    const lot = lotResult.rows[0];
    if (!lot || lot.withdrawn_at !== null) {
      throw httpErrors.notFound('Ese lote ya no está disponible.');
    }

    const reason = evaluateLotBlockReason(
      {
        id: lot.id,
        speciesId: lot.species_id,
        length: Number(lot.length_cm),
        minimum: Number(lot.minimum_length_cm),
        paused: Boolean(lot.paused),
        stock: Number(lot.stock_units),
      },
      {
        bans: { [lot.species_id]: Boolean(lot.banned) },
        minimumSizes: { [lot.species_id]: Number(lot.minimum_length_cm) },
      },
    );
    if (reason) {
      throw httpErrors.validation(reason, undefined, 'DOMAIN_RULE_VIOLATION');
    }

    if (input.quantity > Number(lot.stock_units)) {
      throw httpErrors.conflict(
        `La cantidad solicitada supera las existencias disponibles (${lot.stock_units}).`,
      );
    }

    await tx.query(
      `
      INSERT INTO public.cart_lines (cart_id, lot_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, lot_id)
      DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()
      `,
      [cart.id, lotId, input.quantity],
    );

    const countResult = await tx.query<{ total_lines: string }>(
      `SELECT COUNT(*)::text AS total_lines FROM public.cart_lines WHERE cart_id = $1`,
      [cart.id],
    );
    if (Number(countResult.rows[0].total_lines) > MAX_CART_DISTINCT_LINES) {
      throw httpErrors.validation(
        `La canasta puede contener como máximo ${MAX_CART_DISTINCT_LINES} lotes distintos.`,
      );
    }

    await tx.query(
      `UPDATE public.carts SET version = version + 1, updated_at = now() WHERE id = $1`,
      [cart.id],
    );

    return getBuyerCart(buyerId, tx);
  });
}

export async function removeBuyerCartLine(buyerId: string, lotId: string): Promise<CartDto> {
  return withTransaction(async tx => {
    const cart = await ensureBuyerCartRow(buyerId, tx);
    const deleted = await tx.query(
      `DELETE FROM public.cart_lines WHERE cart_id = $1 AND lot_id = $2`,
      [cart.id, lotId],
    );
    if ((deleted.rowCount ?? 0) > 0) {
      await tx.query(
        `UPDATE public.carts SET version = version + 1, updated_at = now() WHERE id = $1`,
        [cart.id],
      );
    }
    return getBuyerCart(buyerId, tx);
  });
}

export async function clearBuyerCart(buyerId: string): Promise<CartDto> {
  return withTransaction(async tx => {
    const cart = await ensureBuyerCartRow(buyerId, tx);
    await tx.query(`DELETE FROM public.cart_lines WHERE cart_id = $1`, [cart.id]);
    await tx.query(
      `UPDATE public.carts SET version = version + 1, updated_at = now() WHERE id = $1`,
      [cart.id],
    );
    return getBuyerCart(buyerId, tx);
  });
}

/**
 * Fusión conservadora e idempotente de canasta invitada (RF-09, Plan §6.1).
 * Todo o nada en transacción SERIALIZABLE.
 */
export async function mergeGuestCart(
  buyerId: string,
  input: MergeCartInput,
): Promise<CartDto> {
  const requestHash = computeCartMergeRequestHash(input);

  return withTransaction(
    async tx => {
      const cart = await ensureBuyerCartRow(buyerId, tx);

      // 1. Comprobar replay / divergencia del mergeId ANTES de versión/stock actuales
      const previousMerge = await tx.query<{
        request_hash: string;
        response_status: number;
        response_snapshot: unknown;
      }>(
        `
        SELECT request_hash, response_status, response_snapshot
        FROM public.cart_merges
        WHERE owner_id = $1 AND merge_id = $2
        FOR UPDATE
        `,
        [buyerId, input.mergeId],
      );

      if (previousMerge.rows[0]) {
        const record = previousMerge.rows[0];
        if (record.request_hash !== requestHash) {
          throw httpErrors.conflict(
            'El identificador de fusión ya fue utilizado con un contenido diferente.',
            'MERGE_PAYLOAD_CONFLICT',
          );
        }
        if (record.response_status === 200) {
          return record.response_snapshot as CartDto;
        }
        const snap = record.response_snapshot as {
          code?: 'CART_VERSION_CONFLICT' | 'CART_MERGE_REJECTED';
          message?: string;
          details?: Record<string, unknown>;
        };
        throw httpErrors.conflict(
          snap.message ?? 'La fusión de canasta fue rechazada previamente.',
          snap.code ?? 'CART_MERGE_REJECTED',
          snap.details,
        );
      }

      // 2. Exigir expectedCartVersion vigente
      if (cart.version !== input.expectedCartVersion) {
        const conflictPayload = {
          code: 'CART_VERSION_CONFLICT' as const,
          message: 'La versión de tu canasta cambió. Revisa e intenta fusionar nuevamente.',
          details: { currentCartVersion: cart.version },
        };
        await tx.query(
          `
          INSERT INTO public.cart_merges (owner_id, merge_id, request_hash, response_status, response_snapshot)
          VALUES ($1, $2, $3, 409, $4::jsonb)
          `,
          [buyerId, input.mergeId, requestHash, JSON.stringify(conflictPayload)],
        );
        throw httpErrors.conflict(
          conflictPayload.message,
          'CART_VERSION_CONFLICT',
          conflictPayload.details,
        );
      }

      // 3. Cargar líneas actuales y sumar con las invitadas
      const existingLinesRes = await tx.query<{ lot_id: string; quantity: number }>(
        `SELECT lot_id, quantity FROM public.cart_lines WHERE cart_id = $1 FOR UPDATE`,
        [cart.id],
      );
      const existingMap = new Map<string, number>();
      for (const row of existingLinesRes.rows) {
        existingMap.set(row.lot_id.toLowerCase(), Number(row.quantity));
      }

      const candidateMap = new Map<string, number>(existingMap);
      for (const guestLine of input.lines) {
        const prev = candidateMap.get(guestLine.lotId) ?? 0;
        candidateMap.set(guestLine.lotId, prev + guestLine.quantity);
      }

      const candidateLotIds = [...candidateMap.keys()].sort();
      const reasons: Array<{
        lotId: string;
        reason:
          | 'LOT_UNAVAILABLE'
          | 'ENVIRONMENT_RESTRICTION'
          | 'QUANTITY_LIMIT'
          | 'INSUFFICIENT_STOCK';
        existingQuantity: number;
        guestQuantity: number;
        requestedQuantity: number;
        availableStock: number;
      }> = [];

      const lotsResult = await tx.query<{
        id: string;
        species_id: string;
        stock_units: number;
        length_cm: number;
        paused: boolean;
        withdrawn_at: Date | null;
        banned: boolean;
        minimum_length_cm: number;
      }>(
        `
        SELECT
          l.id,
          l.species_id,
          l.stock_units,
          l.length_cm,
          l.paused,
          l.withdrawn_at,
          COALESCE(er.banned, false) AS banned,
          COALESCE(er.minimum_length_cm, s.suggested_length_cm) AS minimum_length_cm
        FROM public.lots l
        INNER JOIN public.species s ON s.id = l.species_id
        LEFT JOIN public.environmental_rules er ON er.species_id = s.id
        WHERE l.id = ANY($1::uuid[])
        FOR SHARE OF l
        `,
        [candidateLotIds],
      );

      const lotsById = new Map(lotsResult.rows.map(row => [row.id.toLowerCase(), row]));
      const guestById = new Map(input.lines.map(l => [l.lotId, l.quantity]));

      for (const lotId of candidateLotIds) {
        const existingQty = existingMap.get(lotId) ?? 0;
        const guestQty = guestById.get(lotId) ?? 0;
        const requestedQty = candidateMap.get(lotId) ?? 0;
        const lot = lotsById.get(lotId);

        if (!lot || lot.withdrawn_at !== null || lot.paused) {
          reasons.push({
            lotId,
            reason: 'LOT_UNAVAILABLE',
            existingQuantity: existingQty,
            guestQuantity: guestQty,
            requestedQuantity: requestedQty,
            availableStock: lot ? Number(lot.stock_units) : 0,
          });
          continue;
        }

        if (lot.banned || Number(lot.length_cm) < Number(lot.minimum_length_cm)) {
          reasons.push({
            lotId,
            reason: 'ENVIRONMENT_RESTRICTION',
            existingQuantity: existingQty,
            guestQuantity: guestQty,
            requestedQuantity: requestedQty,
            availableStock: Number(lot.stock_units),
          });
          continue;
        }

        if (requestedQty > MAX_QUANTITY_UNITS) {
          reasons.push({
            lotId,
            reason: 'QUANTITY_LIMIT',
            existingQuantity: existingQty,
            guestQuantity: guestQty,
            requestedQuantity: requestedQty,
            availableStock: Number(lot.stock_units),
          });
          continue;
        }

        if (requestedQty > Number(lot.stock_units)) {
          reasons.push({
            lotId,
            reason: 'INSUFFICIENT_STOCK',
            existingQuantity: existingQty,
            guestQuantity: guestQty,
            requestedQuantity: requestedQty,
            availableStock: Number(lot.stock_units),
          });
        }
      }

      const globalLimitExceeded = candidateLotIds.length > MAX_CART_DISTINCT_LINES;
      if (reasons.length > 0 || globalLimitExceeded) {
        const rejectionDetails = {
          ...(globalLimitExceeded ? { globalReason: 'LINE_LIMIT' } : {}),
          reasons,
        };
        const rejectSnapshot = {
          code: 'CART_MERGE_REJECTED' as const,
          message:
            'No se pudo fusionar la canasta invitada porque uno o más lotes superan la disponibilidad o tienen restricciones.',
          details: rejectionDetails,
        };
        await tx.query(
          `
          INSERT INTO public.cart_merges (owner_id, merge_id, request_hash, response_status, response_snapshot)
          VALUES ($1, $2, $3, 409, $4::jsonb)
          `,
          [buyerId, input.mergeId, requestHash, JSON.stringify(rejectSnapshot)],
        );
        throw httpErrors.conflict(
          rejectSnapshot.message,
          'CART_MERGE_REJECTED',
          rejectionDetails,
        );
      }

      // 4. Todo válido: guardar todas las líneas y aumentar cartVersion una sola vez
      for (const [lotId, quantity] of candidateMap.entries()) {
        await tx.query(
          `
          INSERT INTO public.cart_lines (cart_id, lot_id, quantity)
          VALUES ($1, $2, $3)
          ON CONFLICT (cart_id, lot_id)
          DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()
          `,
          [cart.id, lotId, quantity],
        );
      }

      await tx.query(
        `UPDATE public.carts SET version = version + 1, updated_at = now() WHERE id = $1`,
        [cart.id],
      );

      const mergedCart = await getBuyerCart(buyerId, tx);
      await tx.query(
        `
        INSERT INTO public.cart_merges (owner_id, merge_id, request_hash, response_status, response_snapshot)
        VALUES ($1, $2, $3, 200, $4::jsonb)
        `,
        [buyerId, input.mergeId, requestHash, JSON.stringify(mergedCart)],
      );

      return mergedCart;
    },
    { isolationLevel: 'SERIALIZABLE' },
  );
}

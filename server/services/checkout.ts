import {
  type CheckoutAttemptDto,
  type ConfirmCheckoutAttemptInput,
  computeCheckoutRequestHash,
  computeConfirmationHash,
  type CreateCheckoutAttemptInput,
} from '../contracts/checkout';
import type { OrderDto, OrderLineSnapshotDto } from '../contracts/order';
import type { Delivery, PaymentMethod } from '../../src/domain';
import {
  computeOrderProgress,
  type FulfillmentStage,
  lineAmountBigInt,
  weightKg,
} from '../domain/commerce';
import { buildLastSevenBogotaDays, toBogotaDateKey } from '../domain/time';
import { getDbPool, type QueryExecutor, withTransaction } from '../db/db';
import { httpErrors } from '../security/errors';
import { getBuyerCart } from './carts';

const QUOTE_TTL_SECONDS = 10 * 60; // 10 minutos
const WALLET_TTL_SECONDS = 60; // 60 segundos para Nequi / Daviplata

function mapAttemptRow(row: {
  id: string;
  status: string;
  payment_method: string;
  amount_cop: string | number | bigint;
  expires_at: Date | string;
  order_id?: string | null;
  result_code: string | null;
}): CheckoutAttemptDto {
  return {
    id: row.id,
    status: row.status as CheckoutAttemptDto['status'],
    paymentMethod: row.payment_method as PaymentMethod,
    amountCop: BigInt(row.amount_cop).toString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    orderId: row.order_id ?? null,
    resultCode: row.result_code ?? null,
  };
}

export async function createCheckoutAttempt(
  buyerId: string,
  input: CreateCheckoutAttemptInput,
): Promise<CheckoutAttemptDto> {
  const requestHash = computeCheckoutRequestHash(input);

  return withTransaction(async tx => {
    const existing = await tx.query<{
      id: string;
      request_hash: string;
      status: string;
      payment_method: string;
      amount_cop: string;
      expires_at: Date;
      result_code: string | null;
      order_id: string | null;
    }>(
      `
      SELECT
        ca.id,
        ca.request_hash,
        ca.status,
        ca.payment_method,
        ca.amount_cop,
        ca.expires_at,
        ca.result_code,
        o.id AS order_id
      FROM public.checkout_attempts ca
      LEFT JOIN public.orders o ON o.attempt_id = ca.id
      WHERE ca.client_id = $1 AND ca.request_key = $2
      FOR UPDATE OF ca
      `,
      [buyerId, input.requestKey],
    );

    if (existing.rows[0]) {
      const prev = existing.rows[0];
      if (prev.request_hash !== requestHash) {
        throw httpErrors.conflict(
          'La clave Idempotency-Key ya fue usada con datos de pedido diferentes.',
        );
      }
      return mapAttemptRow(prev);
    }

    const cart = await getBuyerCart(buyerId, tx);
    if (cart.lines.length === 0) {
      throw httpErrors.validation('Agrega pescado a tu canasta para continuar.');
    }
    if (cart.version !== input.cartVersion) {
      throw httpErrors.conflict(
        'Tu canasta cambió. Revisa los productos antes de iniciar el pago.',
        'CART_VERSION_CONFLICT',
      );
    }

    const blockedLine = cart.lines.find(line => line.blockReason !== '');
    if (blockedLine) {
      throw httpErrors.validation(
        `${blockedLine.speciesName}: ${blockedLine.blockReason}. Retíralo de tu canasta para continuar.`,
        undefined,
        'DOMAIN_RULE_VIOLATION',
      );
    }

    const insufficientLine = cart.lines.find(line => line.quantity > line.availableStock);
    if (insufficientLine) {
      throw httpErrors.conflict(
        `Solo quedan ${insufficientLine.availableStock} unidades de ${insufficientLine.speciesName}. Ajusta tu canasta.`,
      );
    }

    const ttlSeconds =
      input.method === 'Nequi' || input.method === 'Daviplata'
        ? WALLET_TTL_SECONDS
        : QUOTE_TTL_SECONDS;

    const inserted = await tx.query<{
      id: string;
      status: string;
      payment_method: string;
      amount_cop: string;
      expires_at: Date;
      result_code: string | null;
    }>(
      `
      INSERT INTO public.checkout_attempts (
        client_id,
        request_key,
        request_hash,
        cart_version,
        payment_method,
        bank,
        customer_type,
        amount_cop,
        quote_snapshot,
        delivery_snapshot,
        status,
        expires_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, 'pending',
        clock_timestamp() + ($11 || ' seconds')::interval
      )
      RETURNING id, status, payment_method, amount_cop, expires_at, result_code
      `,
      [
        buyerId,
        input.requestKey,
        requestHash,
        cart.version,
        input.method,
        input.bank,
        input.customerType,
        cart.totalCop,
        JSON.stringify({
          cartVersion: cart.version,
          totalCop: cart.totalCop,
          lines: cart.lines,
        }),
        JSON.stringify(input.delivery),
        String(ttlSeconds),
      ],
    );

    return mapAttemptRow(inserted.rows[0]);
  });
}

/**
 * Confirmación transaccional SERIALIZABLE (RF-11..13, Plan §7).
 * Evita sobreventa, revalida vedas/tallas/stock y crea pedido con instantáneas inmutables.
 */
export async function confirmCheckoutAttempt(
  buyerId: string,
  attemptId: string,
  input: ConfirmCheckoutAttemptInput,
): Promise<{ attempt: CheckoutAttemptDto; order: OrderDto | null }> {
  const confirmationHash = computeConfirmationHash(attemptId, input.outcome);

  return withTransaction(
    async tx => {
      // 1. Bloquear intento propio y evaluar reloj efectivo de PostgreSQL tras adquirir lock
      const attemptRes = await tx.query<{
        id: string;
        client_id: string;
        cart_version: number;
        payment_method: string;
        bank: string;
        customer_type: string;
        amount_cop: string;
        quote_snapshot: {
          cartVersion: number;
          totalCop: string;
          lines: Array<{
            lotId: string;
            quantity: number;
            pricePerKgCop: number;
            pieceWeightGrams: number | null;
            lineTotalCop: string;
          }>;
        };
        delivery_snapshot: Delivery;
        status: string;
        result_code: string | null;
        expires_at: Date;
        confirmation_hash: string | null;
        confirmation_status: number | null;
        confirmation_response: unknown;
        is_expired_now: boolean;
      }>(
        `
        SELECT
          id,
          client_id,
          cart_version,
          payment_method,
          bank,
          customer_type,
          amount_cop,
          quote_snapshot,
          delivery_snapshot,
          status,
          result_code,
          expires_at,
          confirmation_hash,
          confirmation_status,
          confirmation_response,
          (clock_timestamp() >= expires_at) AS is_expired_now
        FROM public.checkout_attempts
        WHERE id = $1
        FOR UPDATE
        `,
        [attemptId],
      );

      const attempt = attemptRes.rows[0];
      if (!attempt || attempt.client_id !== buyerId) {
        throw httpErrors.notFound('El intento de pago no existe.');
      }

      // 2. Primero comparar confirmation_hash existente (Plan §7 paso 1)
      if (attempt.confirmation_hash !== null) {
        if (attempt.confirmation_hash !== confirmationHash) {
          throw httpErrors.conflict(
            'Este intento de pago ya fue procesado con un resultado distinto.',
            'CONFIRMATION_PAYLOAD_CONFLICT',
          );
        }
        const savedStatus = Number(attempt.confirmation_status ?? 200);
        const savedPayload = attempt.confirmation_response as {
          code?: 'ATTEMPT_EXPIRED' | 'ATTEMPT_STALE';
          message?: string;
          attempt?: CheckoutAttemptDto;
          order?: OrderDto | null;
        };
        if (savedStatus >= 400) {
          throw httpErrors.conflict(
            savedPayload.message ?? 'El intento de pago no pudo confirmarse.',
            savedPayload.code ?? 'CONFLICT',
          );
        }
        return {
          attempt: savedPayload.attempt!,
          order: savedPayload.order ?? null,
        };
      }

      // 3. Si ya estaba marcado vencido por /expire o venció según clock_timestamp()
      if (attempt.status === 'vencido' || attempt.is_expired_now) {
        const expiredDto = mapAttemptRow({
          ...attempt,
          status: 'vencido',
          result_code: 'ATTEMPT_EXPIRED',
        });
        const expiredResponse = {
          code: 'ATTEMPT_EXPIRED' as const,
          message: 'El tiempo para autorizar este pago venció. Inicia un nuevo intento.',
          attempt: expiredDto,
        };
        await tx.query(
          `
          UPDATE public.checkout_attempts
          SET status = 'vencido',
              result_code = 'ATTEMPT_EXPIRED',
              confirmation_hash = $1,
              confirmation_status = 409,
              confirmation_response = $2::jsonb,
              updated_at = now()
          WHERE id = $3
          `,
          [confirmationHash, JSON.stringify(expiredResponse), attemptId],
        );
        throw httpErrors.conflict(expiredResponse.message, 'ATTEMPT_EXPIRED');
      }

      // 4. Si el resultado simulado es rechazado -> registrar sin tocar stock ni canasta
      if (input.outcome === 'rechazado') {
        const rejectedDto = mapAttemptRow({
          ...attempt,
          status: 'rechazado',
          result_code: 'PAYMENT_REJECTED',
        });
        const rejectedPayload = { attempt: rejectedDto, order: null };
        await tx.query(
          `
          UPDATE public.checkout_attempts
          SET status = 'rechazado',
              result_code = 'PAYMENT_REJECTED',
              confirmation_hash = $1,
              confirmation_status = 200,
              confirmation_response = $2::jsonb,
              updated_at = now()
          WHERE id = $3
          `,
          [confirmationHash, JSON.stringify(rejectedPayload), attemptId],
        );
        return rejectedPayload;
      }

      // 5. Outcome = exitoso: bloquear canasta, reglas ambientales y lotes en orden determinista
      const cartRes = await tx.query<{ id: string; version: number }>(
        `SELECT id, version FROM public.carts WHERE owner_id = $1 FOR UPDATE`,
        [buyerId],
      );
      const cartRow = cartRes.rows[0];
      const currentCart = await getBuyerCart(buyerId, tx);

      const quotedLines = attempt.quote_snapshot.lines;
      const orderedLotIds = quotedLines.map(l => l.lotId).sort();

      const lockedLotsRes = await tx.query<{
        id: string;
        species_id: string;
        species_name: string;
        scientific_name: string;
        fisher_id: string;
        fisher_name: string;
        member_code: string;
        zone: string;
        method: string;
        price_per_kg_cop: string | number;
        piece_weight_grams: number | null;
        stock_units: number;
        length_cm: number;
        minimum_length_cm: number;
        banned: boolean;
        paused: boolean;
        withdrawn_at: Date | null;
      }>(
        `
        SELECT
          l.id,
          l.species_id,
          s.name AS species_name,
          s.scientific_name,
          l.fisher_id,
          p.name AS fisher_name,
          fd.member_code,
          l.zone,
          l.method,
          l.price_per_kg_cop,
          l.piece_weight_grams,
          l.stock_units,
          l.length_cm,
          COALESCE(er.minimum_length_cm, s.suggested_length_cm) AS minimum_length_cm,
          COALESCE(er.banned, false) AS banned,
          l.paused,
          l.withdrawn_at
        FROM public.lots l
        INNER JOIN public.species s ON s.id = l.species_id
        LEFT JOIN public.environmental_rules er ON er.species_id = s.id
        INNER JOIN public.fisher_details fd ON fd.user_id = l.fisher_id
        INNER JOIN public.profiles p ON p.user_id = fd.user_id
        WHERE l.id = ANY($1::uuid[])
        ORDER BY l.id ASC
        FOR UPDATE OF l
        `,
        [orderedLotIds],
      );

      const lotsById = new Map(lockedLotsRes.rows.map(row => [row.id, row]));

      let staleReason = '';
      if (
        !cartRow ||
        Number(cartRow.version) !== Number(attempt.cart_version) ||
        currentCart.totalCop !== attempt.quote_snapshot.totalCop ||
        currentCart.lines.length !== quotedLines.length
      ) {
        staleReason = 'Tu canasta o sus precios cambiaron. Revisa el pedido antes de pagar.';
      } else {
        for (const quoted of quotedLines) {
          const lot = lotsById.get(quoted.lotId);
          if (!lot || lot.withdrawn_at !== null || lot.paused) {
            staleReason = 'Uno de los lotes fue pausado o retirado antes de confirmar.';
            break;
          }
          if (lot.banned || Number(lot.length_cm) < Number(lot.minimum_length_cm)) {
            staleReason = `${lot.species_name} entró en restricción ambiental de veda o talla mínima.`;
            break;
          }
          if (Number(lot.stock_units) < quoted.quantity) {
            staleReason = `Solo quedan ${lot.stock_units} unidades de ${lot.species_name}.`;
            break;
          }
          const currentLineTotal = lineAmountBigInt(
            Math.trunc(Number(lot.price_per_kg_cop)),
            quoted.quantity,
            lot.piece_weight_grams,
          ).toString();
          if (currentLineTotal !== quoted.lineTotalCop) {
            staleReason = 'El precio de uno de los lotes cambió. Revisa la nueva cotización.';
            break;
          }
        }
      }

      if (staleReason) {
        const staleDto = mapAttemptRow({
          ...attempt,
          status: 'stale',
          result_code: 'ATTEMPT_STALE',
        });
        const stalePayload = {
          code: 'ATTEMPT_STALE' as const,
          message: staleReason,
          attempt: staleDto,
        };
        await tx.query(
          `
          UPDATE public.checkout_attempts
          SET status = 'stale',
              result_code = 'ATTEMPT_STALE',
              confirmation_hash = $1,
              confirmation_status = 409,
              confirmation_response = $2::jsonb,
              updated_at = now()
          WHERE id = $3
          `,
          [confirmationHash, JSON.stringify(stalePayload), attemptId],
        );
        throw httpErrors.conflict(staleReason, 'ATTEMPT_STALE');
      }

      // 6. Descontar stock con condición atómica stock_units >= requested e incrementar versión
      for (const quoted of quotedLines) {
        const dec = await tx.query(
          `
          UPDATE public.lots
          SET stock_units = stock_units - $1,
              version = version + 1,
              updated_at = now()
          WHERE id = $2 AND stock_units >= $1 AND withdrawn_at IS NULL AND paused = false
          `,
          [quoted.quantity, quoted.lotId],
        );
        if (dec.rowCount !== 1) {
          throw httpErrors.conflict(
            'El inventario cambió mientras se procesaba tu compra. Intenta nuevamente.',
            'ATTEMPT_STALE',
          );
        }
      }

      // 7. Crear pedido, líneas snapshot inmutables y partes de despacho por pescador
      const delivery = attempt.delivery_snapshot;
      const orderInsert = await tx.query<{ id: string; created_at: Date }>(
        `
        INSERT INTO public.orders (
          client_id,
          attempt_id,
          total_cop,
          payment_method,
          bank,
          customer_type,
          delivery_name,
          delivery_phone,
          delivery_address,
          delivery_slot,
          delivery_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, created_at
        `,
        [
          buyerId,
          attemptId,
          attempt.amount_cop,
          attempt.payment_method,
          attempt.bank,
          attempt.customer_type,
          delivery.name,
          delivery.phone,
          delivery.address,
          delivery.slot,
          delivery.date,
        ],
      );

      const orderId = orderInsert.rows[0].id;
      const orderCreatedAt = new Date(orderInsert.rows[0].created_at).toISOString();
      const fisherSet = new Set<string>();
      const orderLinesDto: OrderLineSnapshotDto[] = [];

      for (const quoted of quotedLines) {
        const lot = lotsById.get(quoted.lotId)!;
        fisherSet.add(lot.fisher_id);
        const lineKg = weightKg({ pieceWeightGrams: lot.piece_weight_grams }, quoted.quantity);

        const lineInsert = await tx.query<{ id: string }>(
          `
          INSERT INTO public.order_lines (
            order_id,
            lot_id,
            species_id,
            fisher_id,
            species_name_snapshot,
            scientific_name_snapshot,
            fisher_name_snapshot,
            fisher_member_snapshot,
            zone_snapshot,
            method_snapshot,
            price_per_kg_cop_snapshot,
            piece_weight_grams_snapshot,
            quantity,
            weight_kg_snapshot,
            line_total_cop
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id
          `,
          [
            orderId,
            lot.id,
            lot.species_id,
            lot.fisher_id,
            lot.species_name,
            lot.scientific_name,
            lot.fisher_name,
            lot.member_code,
            lot.zone,
            lot.method,
            lot.price_per_kg_cop,
            lot.piece_weight_grams,
            quoted.quantity,
            lineKg,
            quoted.lineTotalCop,
          ],
        );

        orderLinesDto.push({
          id: lineInsert.rows[0].id,
          lotId: lot.id,
          speciesId: lot.species_id,
          fisherId: lot.fisher_id,
          speciesName: lot.species_name,
          scientificName: lot.scientific_name,
          fisherName: lot.fisher_name,
          fisherMember: lot.member_code,
          zone: lot.zone,
          method: lot.method,
          pricePerKgCop: Number(lot.price_per_kg_cop),
          pieceWeightGrams: lot.piece_weight_grams,
          quantity: quoted.quantity,
          weightKg: Number(lineKg.toFixed(3)),
          lineTotalCop: quoted.lineTotalCop,
        });
      }

      const fulfillmentMap: Record<string, FulfillmentStage> = {};
      for (const fisherId of fisherSet) {
        fulfillmentMap[fisherId] = 'pendiente';
        await tx.query(
          `
          INSERT INTO public.order_fulfillments (order_id, fisher_id, status, version)
          VALUES ($1, $2, 'pendiente', 1)
          `,
          [orderId, fisherId],
        );
      }

      // 8. Vaciar canasta del comprador e incrementar su versión
      await tx.query(`DELETE FROM public.cart_lines WHERE cart_id = $1`, [cartRow.id]);
      await tx.query(
        `UPDATE public.carts SET version = version + 1, updated_at = now() WHERE id = $1`,
        [cartRow.id],
      );

      const orderDto: OrderDto = {
        id: orderId,
        clientId: buyerId,
        createdAt: orderCreatedAt,
        totalCop: BigInt(attempt.amount_cop).toString(),
        paymentMethod: attempt.payment_method as PaymentMethod,
        bank: attempt.bank,
        customerType: attempt.customer_type,
        delivery,
        lines: orderLinesDto,
        fulfillment: fulfillmentMap,
        progress: computeOrderProgress(fulfillmentMap, null),
        receivedAt: null,
      };

      const successAttemptDto = mapAttemptRow({
        ...attempt,
        status: 'exitoso',
        order_id: orderId,
        result_code: 'ORDER_CONFIRMED',
      });

      const responsePayload = {
        attempt: successAttemptDto,
        order: orderDto,
      };

      await tx.query(
        `
        UPDATE public.checkout_attempts
        SET status = 'exitoso',
            result_code = 'ORDER_CONFIRMED',
            confirmation_hash = $1,
            confirmation_status = 200,
            confirmation_response = $2::jsonb,
            updated_at = now()
        WHERE id = $3
        `,
        [confirmationHash, JSON.stringify(responsePayload), attemptId],
      );

      return responsePayload;
    },
    { isolationLevel: 'SERIALIZABLE' },
  );
}

export async function getCheckoutAttemptById(
  buyerId: string,
  attemptId: string,
  db: QueryExecutor = getDbPool(),
): Promise<CheckoutAttemptDto> {
  const result = await db.query<{
    id: string;
    client_id: string;
    status: string;
    payment_method: string;
    amount_cop: string;
    expires_at: Date;
    result_code: string | null;
    order_id: string | null;
  }>(
    `
    SELECT
      ca.id,
      ca.client_id,
      ca.status,
      ca.payment_method,
      ca.amount_cop,
      ca.expires_at,
      ca.result_code,
      o.id AS order_id
    FROM public.checkout_attempts ca
    LEFT JOIN public.orders o ON o.attempt_id = ca.id
    WHERE ca.id = $1
    `,
    [attemptId],
  );

  const row = result.rows[0];
  if (!row || row.client_id !== buyerId) {
    throw httpErrors.notFound('El intento de pago no existe.');
  }
  return mapAttemptRow(row);
}

export async function listOrdersForBuyer(
  buyerId: string,
  db: QueryExecutor = getDbPool(),
): Promise<OrderDto[]> {
  const ordersRes = await db.query<{
    id: string;
    client_id: string;
    created_at: Date;
    total_cop: string;
    payment_method: string;
    bank: string;
    customer_type: string;
    delivery_name: string;
    delivery_phone: string;
    delivery_address: string;
    delivery_slot: string;
    delivery_date: string;
    received_at: Date | null;
  }>(
    `
    SELECT
      id,
      client_id,
      created_at,
      total_cop,
      payment_method,
      bank,
      customer_type,
      delivery_name,
      delivery_phone,
      delivery_address,
      delivery_slot,
      delivery_date,
      received_at
    FROM public.orders
    WHERE client_id = $1
    ORDER BY created_at DESC, id DESC
    LIMIT 50
    `,
    [buyerId],
  );

  if (ordersRes.rows.length === 0) return [];
  const orderIds = ordersRes.rows.map(o => o.id);

  const linesRes = await db.query<{
    id: string;
    order_id: string;
    lot_id: string;
    species_id: string;
    fisher_id: string;
    species_name_snapshot: string;
    scientific_name_snapshot: string;
    fisher_name_snapshot: string;
    fisher_member_snapshot: string;
    zone_snapshot: string;
    method_snapshot: string;
    price_per_kg_cop_snapshot: string | number;
    piece_weight_grams_snapshot: number | null;
    quantity: number;
    weight_kg_snapshot: string | number;
    line_total_cop: string;
  }>(
    `
    SELECT
      id,
      order_id,
      lot_id,
      species_id,
      fisher_id,
      species_name_snapshot,
      scientific_name_snapshot,
      fisher_name_snapshot,
      fisher_member_snapshot,
      zone_snapshot,
      method_snapshot,
      price_per_kg_cop_snapshot,
      piece_weight_grams_snapshot,
      quantity,
      weight_kg_snapshot,
      line_total_cop
    FROM public.order_lines
    WHERE order_id = ANY($1::uuid[])
    ORDER BY created_at ASC, id ASC
    `,
    [orderIds],
  );

  const fulfillmentsRes = await db.query<{
    order_id: string;
    fisher_id: string;
    status: string;
  }>(
    `
    SELECT order_id, fisher_id, status
    FROM public.order_fulfillments
    WHERE order_id = ANY($1::uuid[])
    `,
    [orderIds],
  );

  const linesByOrder = new Map<string, OrderLineSnapshotDto[]>();
  for (const row of linesRes.rows) {
    const list = linesByOrder.get(row.order_id) ?? [];
    list.push({
      id: row.id,
      lotId: row.lot_id,
      speciesId: row.species_id,
      fisherId: row.fisher_id,
      speciesName: row.species_name_snapshot,
      scientificName: row.scientific_name_snapshot,
      fisherName: row.fisher_name_snapshot,
      fisherMember: row.fisher_member_snapshot,
      zone: row.zone_snapshot,
      method: row.method_snapshot,
      pricePerKgCop: Number(row.price_per_kg_cop_snapshot),
      pieceWeightGrams: row.piece_weight_grams_snapshot,
      quantity: Number(row.quantity),
      weightKg: Number(row.weight_kg_snapshot),
      lineTotalCop: BigInt(row.line_total_cop).toString(),
    });
    linesByOrder.set(row.order_id, list);
  }

  const fulfillmentsByOrder = new Map<string, Record<string, FulfillmentStage>>();
  for (const row of fulfillmentsRes.rows) {
    const map = fulfillmentsByOrder.get(row.order_id) ?? {};
    map[row.fisher_id] = row.status as FulfillmentStage;
    fulfillmentsByOrder.set(row.order_id, map);
  }

  return ordersRes.rows.map(order => {
    const fulfillment = fulfillmentsByOrder.get(order.id) ?? {};
    const receivedIso = order.received_at ? new Date(order.received_at).toISOString() : null;
    return {
      id: order.id,
      clientId: order.client_id,
      createdAt: new Date(order.created_at).toISOString(),
      totalCop: BigInt(order.total_cop).toString(),
      paymentMethod: order.payment_method as PaymentMethod,
      bank: order.bank,
      customerType: order.customer_type,
      delivery: {
        name: order.delivery_name,
        phone: order.delivery_phone,
        address: order.delivery_address,
        slot: order.delivery_slot,
        date: order.delivery_date,
      },
      lines: linesByOrder.get(order.id) ?? [],
      fulfillment,
      progress: computeOrderProgress(fulfillment, receivedIso),
      receivedAt: receivedIso,
    };
  });
}

export async function advanceOrderFulfillmentByFisher(
  fisherId: string,
  orderId: string,
  desiredStatus: FulfillmentStage,
): Promise<{ orderId: string; fisherId: string; status: FulfillmentStage; version: number }> {
  return withTransaction(async tx => {
    const currentRes = await tx.query<{ status: string; version: number }>(
      `
      SELECT status, version
      FROM public.order_fulfillments
      WHERE order_id = $1 AND fisher_id = $2
      FOR UPDATE
      `,
      [orderId, fisherId],
    );

    const row = currentRes.rows[0];
    if (!row) {
      throw httpErrors.forbidden('Este pedido no corresponde a tu perfil de pescador.');
    }

    const currentStatus = row.status as FulfillmentStage;
    // Transición idempotente si ya está en el estado deseado
    if (currentStatus === desiredStatus) {
      return {
        orderId,
        fisherId,
        status: currentStatus,
        version: Number(row.version),
      };
    }

    const validTransition =
      (currentStatus === 'pendiente' && desiredStatus === 'preparado') ||
      (currentStatus === 'preparado' && desiredStatus === 'enviado');

    if (!validTransition) {
      throw httpErrors.conflict(
        `No se puede pasar el despacho de "${currentStatus}" a "${desiredStatus}".`,
      );
    }

    const updated = await tx.query<{ version: number }>(
      `
      UPDATE public.order_fulfillments
      SET status = $1,
          version = version + 1,
          updated_at = now()
      WHERE order_id = $2 AND fisher_id = $3
      RETURNING version
      `,
      [desiredStatus, orderId, fisherId],
    );

    return {
      orderId,
      fisherId,
      status: desiredStatus,
      version: Number(updated.rows[0].version),
    };
  });
}

export async function confirmOrderReceivedByBuyer(
  buyerId: string,
  orderId: string,
): Promise<{ orderId: string; receivedAt: string }> {
  return withTransaction(async tx => {
    const orderRes = await tx.query<{
      id: string;
      client_id: string;
      received_at: Date | null;
    }>(
      `SELECT id, client_id, received_at FROM public.orders WHERE id = $1 FOR UPDATE`,
      [orderId],
    );

    const order = orderRes.rows[0];
    if (!order || order.client_id !== buyerId) {
      throw httpErrors.forbidden('Solo puedes confirmar la recepción de tus propias compras.');
    }

    if (order.received_at) {
      return {
        orderId,
        receivedAt: new Date(order.received_at).toISOString(),
      };
    }

    const fulfillmentsRes = await tx.query<{ status: string }>(
      `SELECT status FROM public.order_fulfillments WHERE order_id = $1 FOR SHARE`,
      [orderId],
    );

    if (
      fulfillmentsRes.rows.length === 0 ||
      !fulfillmentsRes.rows.every(r => r.status === 'enviado')
    ) {
      throw httpErrors.conflict('El pedido todavía no ha sido enviado completamente.');
    }

    const updated = await tx.query<{ received_at: Date }>(
      `
      UPDATE public.orders
      SET received_at = now(), updated_at = now()
      WHERE id = $1
      RETURNING received_at
      `,
      [orderId],
    );

    return {
      orderId,
      receivedAt: new Date(updated.rows[0].received_at).toISOString(),
    };
  });
}

export async function getFisherMetrics(
  fisherId: string,
  now: Date = new Date(),
  db: QueryExecutor = getDbPool(),
) {
  const days = buildLastSevenBogotaDays(now);
  const startUtc = days[0].dayStartUtc;

  const linesRes = await db.query<{
    created_at: Date;
    line_total_cop: string;
    weight_kg_snapshot: string | number;
    piece_weight_grams_snapshot: number | null;
    quantity: number;
  }>(
    `
    SELECT
      o.created_at,
      ol.line_total_cop,
      ol.weight_kg_snapshot,
      ol.piece_weight_grams_snapshot,
      ol.quantity
    FROM public.order_lines ol
    INNER JOIN public.orders o ON o.id = ol.order_id
    WHERE ol.fisher_id = $1 AND o.created_at >= $2
    `,
    [fisherId, startUtc.toISOString()],
  );

  const dayByKey = new Map(days.map(d => [d.dateKey, d]));
  for (const row of linesRes.rows) {
    const key = toBogotaDateKey(row.created_at);
    const bucket = dayByKey.get(key);
    if (bucket) {
      bucket.amount += Number(row.line_total_cop);
      bucket.kg = Number((bucket.kg + Number(row.weight_kg_snapshot)).toFixed(3));
      if (row.piece_weight_grams_snapshot !== null) {
        bucket.pieces += Number(row.quantity);
      }
    }
  }

  const pendingRes = await db.query<{ pending_count: string }>(
    `
    SELECT COUNT(*)::text AS pending_count
    FROM public.order_fulfillments
    WHERE fisher_id = $1 AND status <> 'enviado'
    `,
    [fisherId],
  );

  return {
    days: days.map(d => ({
      date: d.dateKey,
      amount: d.amount,
      kg: d.kg,
      pieces: d.pieces,
    })),
    today: days[6].amount,
    week: days.reduce((sum, d) => sum + d.amount, 0),
    kg: Number(days.reduce((sum, d) => sum + d.kg, 0).toFixed(3)),
    pieces: days.reduce((sum, d) => sum + d.pieces, 0),
    pending: Number(pendingRes.rows[0]?.pending_count ?? 0),
  };
}

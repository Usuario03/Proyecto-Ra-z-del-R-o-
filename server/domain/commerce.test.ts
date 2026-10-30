import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeOrderProgress,
  formatCop,
  isBoundedInteger,
  lineAmount,
  lineAmountBigInt,
  nextFulfillmentStage,
  quantityLabel,
  unitLabel,
  validateCaptureQuantity,
  weightKg,
} from './commerce';
import {
  effectiveMeasuredLengthCm,
  effectiveMinimumLengthCm,
  evaluateLotBlockReason,
  validateEnvironmentalRuleInput,
} from './environment';

test('lineAmountBigInt y lineAmount redondean 2 peces de 750 g a 10.001 COP/kg sin pérdida', () => {
  // 10001 * 750 * 2 = 15.001.500 -> + 500 = 15.002.000 / 1000 = 15.002 COP exactos
  assert.equal(lineAmountBigInt(10_001, 2, 750), 15_002n);
  assert.equal(lineAmount({ price: 10_001, pieceWeightGrams: 750 }, 2), 15_002);
  // 1 pez de 750 g a 10.001 COP/kg -> 7.500.750 + 500 = 7.501.250 / 1000 = 7.501 COP
  assert.equal(lineAmountBigInt(10_001, 1, 750), 7_501n);
  // Venta por kilo tradicional (sin pieceWeightGrams = 1000 g)
  assert.equal(lineAmountBigInt(18_000, 3), 54_000n);
});

test('unidades, etiquetas y pesos distinguen kg enteros de peces enteros', () => {
  assert.equal(weightKg({ pieceWeightGrams: 750 }, 2), 1.5);
  assert.equal(weightKg({}, 4), 4);
  assert.equal(unitLabel({ pieceWeightGrams: 500 }), 'pez');
  assert.equal(unitLabel({}), 'kg');
  assert.match(quantityLabel({ pieceWeightGrams: 750 }, 2), /^2 peces · 1[,.]5 kg$/);
  assert.equal(quantityLabel({}, 3), '3 kg');
  assert.match(formatCop(15_002), /15\.002/);
});

test('validateCaptureQuantity exige enteros en rango y confirmación de peso uniforme', () => {
  assert.equal(validateCaptureQuantity({ kg: 10 }), '');
  assert.match(validateCaptureQuantity({ kg: 0 }), /1 y 500 kilos/);
  assert.match(validateCaptureQuantity({ kg: 501 }), /1 y 500 kilos/);
  assert.equal(
    validateCaptureQuantity({ pieceWeightGrams: 750, quantity: 4, sameWeightConfirmed: true }),
    '',
  );
  assert.match(
    validateCaptureQuantity({ pieceWeightGrams: 750, quantity: 4, sameWeightConfirmed: false }),
    /mismo peso/,
  );
  assert.match(
    validateCaptureQuantity({ pieceWeightGrams: 60_000, quantity: 2, sameWeightConfirmed: true }),
    /1 y 50\.000 gramos/,
  );
  assert.equal(isBoundedInteger(500, 1, 500), true);
  assert.equal(isBoundedInteger(1.5, 1, 500), false);
});

test('evaluación ambiental aplica vedas, tallas mínimas, simulación 22 cm y pausas', () => {
  const baseLot = {
    id: 'lot-1',
    speciesId: 'bocachico',
    length: 28,
    minimum: 25,
    paused: false,
    stock: 10,
  };
  const ctx = {
    bans: { bocachico: false },
    minimumSizes: { bocachico: 25 },
    smallSizeSimulation: false,
  };

  assert.equal(evaluateLotBlockReason(baseLot, ctx), '');
  assert.equal(
    evaluateLotBlockReason(baseLot, { ...ctx, smallSizeSimulation: true }),
    'Talla no permitida',
  );
  assert.equal(effectiveMeasuredLengthCm(baseLot, true), 22);
  assert.equal(effectiveMinimumLengthCm(baseLot, { bocachico: 30 }), 30);
  assert.equal(
    evaluateLotBlockReason(baseLot, { ...ctx, bans: { bocachico: true } }),
    'Especie en veda',
  );
  assert.equal(evaluateLotBlockReason({ ...baseLot, paused: true }, ctx), 'Venta pausada');
  assert.equal(evaluateLotBlockReason({ ...baseLot, stock: 0 }, ctx), 'Agotado');
  assert.equal(validateEnvironmentalRuleInput({ banned: true, minimum: 25 }), '');
  assert.match(validateEnvironmentalRuleInput({ minimum: 0 }), /1 y 250 cm/);
});

test('computeOrderProgress y nextFulfillmentStage avanzan estados sin saltar etapas', () => {
  assert.equal(nextFulfillmentStage('pendiente'), 'preparado');
  assert.equal(nextFulfillmentStage('preparado'), 'enviado');
  assert.equal(nextFulfillmentStage('enviado'), 'enviado');
  assert.equal(computeOrderProgress({ f1: 'pendiente', f2: 'enviado' }), 'preparando');
  assert.equal(computeOrderProgress({ f1: 'preparado', f2: 'enviado' }), 'listo');
  assert.equal(computeOrderProgress({ f1: 'enviado', f2: 'enviado' }), 'enviado');
  assert.equal(
    computeOrderProgress({ f1: 'enviado', f2: 'enviado' }, '2026-10-30T12:00:00Z'),
    'recibido',
  );
});

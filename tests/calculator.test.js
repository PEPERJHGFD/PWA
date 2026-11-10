import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateMaterials } from '../calculator.js';

const defaultInput = {
  width: 30,
  depth: 30,
  height: 3,
  barCount: 8,
  barDiameter: 12.7,
  tieDiameter: 6.35,
  spacing: 20,
  cover: 4,
  stockLength: 12,
  waste: 10
};

test('calcula materiales para los valores iniciales de la PWA', () => {
  const result = calculateMaterials(defaultInput);

  assert.equal(result.sectionArea, 900);
  assert.equal(result.minimumBarCount, 8);
  assert.ok(Math.abs(result.ratio - 1.126) < 0.001);
  assert.equal(result.longitudinalMeters, 24);
  assert.equal(result.longitudinalPurchase, 3);
  assert.equal(result.tieCount, 16);
  assert.ok(Math.abs(result.tieLength - 16.112) < 0.001);
  assert.equal(result.tiePurchase, 2);
  assert.equal(result.totalPieces, 5);
});

test('redondea a una pieza cuando la cantidad calculada no completa una barra comercial', () => {
  const result = calculateMaterials({ ...defaultInput, height: 1.1 });

  assert.equal(result.longitudinalPurchase, 1);
  assert.equal(result.tiePurchase, 1);
});
import test from 'node:test';
import assert from 'node:assert/strict';
import { getLabelQuantityError, getRollWidthMm } from '../src/features/pos/utils/labelRolls.ts';

test('accepts complete rows and rejects partial rows for each supported count', () => {
  for (let columns = 1; columns <= 9; columns++) {
    for (const quantity of [columns, columns * 2, columns * 3, Math.floor(1000 / columns) * columns])
      assert.equal(getLabelQuantityError(String(quantity), columns), undefined);
    for (const quantity of ['0', '-3', '3.5', '1001', '', 'abc']) assert.ok(getLabelQuantityError(quantity, columns));
    if (columns > 1) assert.ok(getLabelQuantityError(String(columns + 1), columns));
  }
});

test('horizontal spacing contributes once between adjacent labels', () => {
  assert.equal(getRollWidthMm(31, 3, 1.5), 96);
  assert.equal(getRollWidthMm(50, 2, 0.5), 100.5);
  assert.equal(getRollWidthMm(22, 4, 2), 94);
  assert.equal(getRollWidthMm(31, 1, 0), 31);
  assert.ok(getRollWidthMm(31, 4, 2) > 108);
});

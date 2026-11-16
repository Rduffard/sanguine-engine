const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  getSpellSlotCreationTerms, projectSorceryPointsFromSlot,
  calculateCreatedSpellSlotBalances, deductSpellSlot,
} = require('../src/spell-slots');

test('spell slot creation terms cover the five supported levels', () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(getSpellSlotCreationTerms), [
    { cost: 2, minimumCallingLevel: 1 },
    { cost: 3, minimumCallingLevel: 3 },
    { cost: 5, minimumCallingLevel: 5 },
    { cost: 6, minimumCallingLevel: 7 },
    { cost: 7, minimumCallingLevel: 9 },
  ]);
  for (const level of [undefined, '1', 0, 1.5, 6, 7, 8, 9]) {
    assert.equal(getSpellSlotCreationTerms(level), null);
  }
});

test('converting an available slot grants its level in points up to the exact cap', () => {
  for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
    assert.equal(projectSorceryPointsFromSlot({ slotLevel, points: 0, maximum: 20 }), slotLevel);
    assert.equal(projectSorceryPointsFromSlot({ slotLevel, points: 20 - slotLevel, maximum: 20 }), 20);
    assert.equal(projectSorceryPointsFromSlot({ slotLevel, points: 21 - slotLevel, maximum: 20 }), null);
  }
});

test('creation adds a total and a marker that shared deduction consumes first', () => {
  for (const created of [0, 3, 99]) {
    const input = Object.freeze({ available: 2, created, points: 7, cost: 5 });
    const balances = calculateCreatedSpellSlotBalances(input);
    assert.deepEqual(balances, { available: 3, created: created + 1, points: 2 });
    assert.deepEqual(deductSpellSlot({ slotLevel: 3, ...balances }), { available: 2, created });
  }
});

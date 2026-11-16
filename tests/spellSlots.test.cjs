const assert = require('node:assert/strict');
const test = require('node:test');
const { SpellSlotReconciliationError, reconcileSpellSlots } = require('@crossworld/sanguine-engine/spell-slots');

function expected(available, reduction = available.map(() => 0)) {
  return available.map((count, i) => ({ available: count, remainingReduction: reduction[i] }));
}

test('both policies retain full, partial and depleted balances at unchanged levels', () => {
  for (const policy of ['advance', 'rebuild']) {
    assert.deepEqual(reconcileSpellSlots([4, 3, 2], [4, 1, 0], [4, 3, 2], policy), expected([4, 1, 0]));
  }
});

test('advancement grants increases and unlocks while rebuild caps availability', () => {
  assert.deepEqual(reconcileSpellSlots([3, 2, 1], [3, 1, 0], [4, 3, 2, 1], 'advance'), expected([4, 2, 1, 1]));
  assert.deepEqual(reconcileSpellSlots([3, 2, 1], [3, 1, 0], [4, 3, 2, 1], 'rebuild'), expected([3, 1, 0, 0]));
  assert.deepEqual(reconcileSpellSlots([], [], [2], 'advance'), expected([2]));
  assert.deepEqual(reconcileSpellSlots([], [], [2], 'rebuild'), expected([0]));
});

test('reconciliation floors reductions, reports any remainder and drops removed levels', () => {
  for (const policy of ['advance', 'rebuild']) {
    assert.deepEqual(reconcileSpellSlots([4, 3, 2, 1], [2, 1, 0, 1], [3, 1, 0], policy),
      expected([1, 0, 0], [0, 1, 2]));
    assert.deepEqual(reconcileSpellSlots([4, 3], [2, 1], [], policy), []);
  }
});

test('simultaneous changes are deterministic and leave all inputs intact', () => {
  const before = Object.freeze([3, 3, 1]);
  const saved = Object.freeze([1, 1, 0]);
  const after = Object.freeze([4, 0, 2, 1]);
  const first = reconcileSpellSlots(before, saved, after, 'advance');
  const second = reconcileSpellSlots(before, saved, after, 'advance');
  assert.deepEqual(first, expected([2, 0, 1, 1], [0, 2, 0, 0]));
  assert.deepEqual(second, first);
  assert.notEqual(first, second);
  assert.notEqual(first[0], second[0]);
});

test('invalid allocations, balances and policies use stable typed failures', () => {
  const invalid = (before, saved, after, policy, slotLevel) => assert.throws(
    () => reconcileSpellSlots(before, saved, after, policy),
    error => error instanceof SpellSlotReconciliationError &&
      error.code === 'INVALID_SPELL_SLOT_RECONCILIATION' && error.slotLevel === slotLevel,
  );
  for (const value of [-1, 0.5, '1', null, undefined, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    invalid([value], [0], [1], 'advance', 1);
    invalid([1], [value], [1], 'advance', 1);
    invalid([1], [0], [value], 'rebuild', 1);
  }
  invalid([1], [2], [1], 'advance', 1);
  invalid([1], Array(1), [1], 'advance', 1);
  invalid([1], [0], Array(1), 'rebuild', 1);
  for (const value of [null, undefined, {}, [], [0, 0]]) {
    invalid([1], value, [1], 'rebuild');
  }
  invalid([1], [0], Array(10).fill(0), 'advance');
  invalid([1], [0], [1], 'rest');
});

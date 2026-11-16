const assert = require('node:assert/strict');
const test = require('node:test');
const { HitDiceReconciliationError, reconcileHitDice } = require('@crossworld/sanguine-engine/hit-dice');

test('Hit Dice availability follows the characterized advancement and rebuild rules', () => {
  const previous = Object.freeze({ d10: 5 });
  for (const [available, nextMax, advanced, rebuilt] of [
    [5, 5, 5, 5], [3, 5, 3, 3], [0, 5, 0, 0],
    [5, 6, 6, 5], [3, 6, 4, 3], [0, 6, 1, 0],
    [5, 3, 3, 3], [3, 4, 2, 2], [3, 3, 1, 1], [3, 2, 0, 0], [3, 1, 0, 0],
    [0, 4, 0, 0], [5, 0, 0, 0],
  ]) {
    const state = Object.freeze({ d10: available });
    const next = Object.freeze({ d10: nextMax });
    assert.deepEqual(reconcileHitDice(previous, state, next, 'advance'), { d10: advanced });
    assert.deepEqual(reconcileHitDice(previous, state, next, 'rebuild'), { d10: rebuilt });
  }
});

test('synthetic die-type changes produce fresh deterministic maps in allocation order', () => {
  const before = Object.freeze({ d6: 1, d10: 3 });
  const state = Object.freeze({ d6: 1, d10: 1 });
  const next = Object.freeze({ d8: 2, d10: 4, d12: 1 });
  const first = reconcileHitDice(before, state, next, 'advance');
  const second = reconcileHitDice(before, state, next, 'advance');
  assert.equal(JSON.stringify(first), '{"d8":2,"d10":2,"d12":1}');
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.equal(JSON.stringify(reconcileHitDice(before, state, next, 'rebuild')), '{"d8":0,"d10":1,"d12":0}');
  assert.deepEqual(state, { d6: 1, d10: 1 });
});

test('missing saved counts and negative integers retain their historical floor behavior', () => {
  for (const state of [{}, { d10: null }, { d10: undefined }]) {
    assert.deepEqual(reconcileHitDice({ d10: 3 }, state, { d10: 4 }, 'advance'), { d10: 1 });
    assert.deepEqual(reconcileHitDice({ d10: 3 }, state, { d10: 4 }, 'rebuild'), { d10: 0 });
  }
  for (const policy of ['advance', 'rebuild']) {
    assert.deepEqual(reconcileHitDice({ d10: 3 }, { d10: -2 }, { d10: 4 }, policy), { d10: 0 });
  }
});

test('invalid inputs fail with a stable code without coercing saved counts', () => {
  const reject = (transition, die) => assert.throws(transition, error =>
    error instanceof HitDiceReconciliationError &&
    error.code === 'INVALID_HIT_DICE_RECONCILIATION' && error.die === die);
  for (const available of ['1', 0.5, true, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    reject(() => reconcileHitDice({ d10: 3 }, { d10: available }, { d10: 4 }, 'advance'), 'd10');
  }
  for (const count of [-1, '3', 0.5, undefined]) {
    reject(() => reconcileHitDice({ d10: count }, {}, { d10: 4 }, 'advance'), 'd10');
    reject(() => reconcileHitDice({ d10: 3 }, {}, { d10: count }, 'rebuild'), 'd10');
  }
  reject(() => reconcileHitDice({ d10: 3 }, { d10: 4 }, { d10: 4 }, 'advance'), 'd10');
  reject(() => reconcileHitDice({ d10: 3 }, { d10: 4 }, { d10: 2 }, 'rebuild'), 'd10');
  reject(() => reconcileHitDice({}, {}, { unknown: 1 }, 'advance'), 'unknown');
  reject(() => reconcileHitDice([], {}, {}, 'advance'));
  reject(() => reconcileHitDice({}, null, {}, 'advance'));
  reject(() => reconcileHitDice({}, {}, [], 'rebuild'));
  reject(() => reconcileHitDice({}, {}, {}, 'rest'));
});

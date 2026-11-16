const assert = require('node:assert/strict');
const test = require('node:test');
const { PreparationReconciliationError, reconcilePreparations } = require('@crossworld/sanguine-engine/preparations');

const input = {
  saved: ['saved-first', 'path-spell', 'saved-second', 'saved-first'],
  additions: ['new-first', 'saved-second', 'path-spell', 'new-second'],
  replayed: ['fallback', 'new-first', 'saved-first'],
  alwaysPrepared: ['path-spell'],
  eligible: ['saved-first', 'saved-second', 'new-first', 'new-second', 'fallback'],
  capacity: 5,
};

test('retains saved order, adds new grants, and fills from replay while removing duplicates and always-prepared spells', () => {
  assert.deepEqual(reconcilePreparations(input), input.eligible);
  assert.deepEqual(reconcilePreparations({ ...input, saved: [], capacity: 3 }), ['new-first', 'saved-second', 'new-second']);
  assert.deepEqual(reconcilePreparations({ ...input, additions: [], capacity: 4 }), ['saved-first', 'saved-second', 'fallback', 'new-first']);
});

test('applies the cap after exclusions and supports zero, decreased and increased capacities', () => {
  for (const capacity of [0, 1, 2, 3, 4, 5]) {
    assert.deepEqual(reconcilePreparations({ ...input, capacity }), input.eligible.slice(0, capacity));
  }
});

test('eligibility rejects a retained spell and ignores ineligible candidates past the cap', () => {
  const eligible = input.eligible.filter(id => id !== 'saved-second');
  assert.deepEqual(reconcilePreparations({ ...input, eligible, capacity: 1 }), ['saved-first']);
  assert.throws(() => reconcilePreparations({ ...input, eligible, capacity: 2 }), {
    name: 'PreparationReconciliationError', code: 'INELIGIBLE_PREPARATION', spellId: 'saved-second',
  });
});

test('invalid lists, capacities and underfilled results produce stable typed failures', () => {
  const invalid = (value, field) => assert.throws(() => reconcilePreparations(value), error =>
    error instanceof PreparationReconciliationError &&
      error.code === 'INVALID_PREPARATION_RECONCILIATION' && error.field === field);
  for (const field of ['saved', 'additions', 'replayed', 'alwaysPrepared', 'eligible']) {
    for (const value of [undefined, null, 'spell', {}, [null], [''], [' spell'], Array(1)]) {
      invalid({ ...input, [field]: value }, field);
    }
  }
  for (const capacity of [-1, 1.5, '5', undefined, Infinity, 6]) invalid({ ...input, capacity }, 'capacity');
  for (const value of [undefined, null, [], false]) invalid(value);
});

test('returns independent deterministic lists and leaves input arrays intact', () => {
  const frozen = Object.freeze(Object.fromEntries(Object.entries(input)
    .map(([key, value]) => [key, Array.isArray(value) ? Object.freeze([...value]) : value])));
  const first = reconcilePreparations(frozen);
  const second = reconcilePreparations(frozen);
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.deepEqual(frozen, input);
});

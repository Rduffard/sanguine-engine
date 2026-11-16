const assert = require('node:assert/strict');
const test = require('node:test');
const { CastingTurnBudgetError, transitionCastingTurnBudget } = require('@crossworld/sanguine-engine/casting-turn');

const empty = { slotSpent: false, leveled: false, quickened: false, freeMetamagic: false };
const rejects = (current, request, code) => assert.throws(
  () => transitionCastingTurnBudget(current, request),
  error => error instanceof CastingTurnBudgetError && error.code === code && error.statusCode === undefined,
);

test('uses printed level and actual slot expenditure independently', () => {
  assert.deepEqual(transitionCastingTurnBudget({}, { level: 0 }), empty);
  const slotless = transitionCastingTurnBudget({}, { level: 9 });
  assert.deepEqual(slotless, { ...empty, leveled: true });
  const reaction = transitionCastingTurnBudget(slotless, { level: 1, spentSlot: true });
  assert.deepEqual(reaction, { ...slotless, slotSpent: true });
  assert.deepEqual(transitionCastingTurnBudget(reaction, { level: 1 }), reaction);
  rejects(reaction, { level: 1, spentSlot: true }, 'CASTING_TURN_LIMIT');
});

test('Quickened cantrips retain their flag and reject later leveled casting from any source', () => {
  const quickened = { level: 0, quickened: true };
  const first = transitionCastingTurnBudget({}, quickened);
  assert.deepEqual(first, { ...empty, quickened: true });
  assert.deepEqual(transitionCastingTurnBudget(first, quickened), first);
  rejects(first, { level: 1 }, 'CASTING_TURN_LIMIT');
  rejects(first, { level: 1, spentSlot: true }, 'CASTING_TURN_LIMIT');
  rejects({ leveled: true }, quickened, 'CASTING_TURN_LIMIT');
});

test('all 256 prior and requested flag combinations follow conflict precedence and monotonic flags', () => {
  const keys = Object.keys(empty);
  const conflicts = [
    ['slotSpent', 'slotSpent'],
    ['leveled', 'quickened'],
    ['quickened', 'leveled'],
  ];
  const facts = mask => Object.fromEntries(keys.map((key, index) => [key, Boolean(mask & (1 << index))]));
  for (let priorMask = 0; priorMask < 16; priorMask++) {
    const prior = facts(priorMask);
    for (let nextMask = 0; nextMask < 16; nextMask++) {
      const requested = facts(nextMask);
      const request = { level: Number(requested.leveled), spentSlot: requested.slotSpent,
        quickened: requested.quickened, freeMetamagic: requested.freeMetamagic };
      if (conflicts.some(([before, after]) => prior[before] && requested[after])) {
        rejects(prior, request, 'CASTING_TURN_LIMIT');
      } else if (prior.freeMetamagic && requested.freeMetamagic) {
        rejects(prior, request, 'FREE_METAMAGIC_ALREADY_USED');
      } else {
        assert.deepEqual(transitionCastingTurnBudget(prior, request), facts(priorMask | nextMask));
      }
    }
  }
});

test('returns fresh deterministic budget flags without mutating facts or copying host metadata', () => {
  const current = Object.freeze({ leveled: true, relayCantrip: true });
  const request = Object.freeze({ level: 0, freeMetamagic: true });
  const first = transitionCastingTurnBudget(current, request);
  const second = transitionCastingTurnBudget(current, request);
  assert.deepEqual(first, { ...empty, leveled: true, freeMetamagic: true });
  assert.deepEqual(second, first);
  assert.notEqual(first, second);
  assert.deepEqual(current, { leveled: true, relayCantrip: true });
});

test('rejects malformed records, levels and flags consistently', () => {
  const invalid = 'INVALID_CASTING_TURN_INPUT';
  for (const record of [undefined, null, [], 'cast', new Date(0)]) {
    rejects(record, { level: 0 }, invalid);
    rejects({}, record, invalid);
  }
  for (const level of [undefined, null, -1, 10, 0.5, '1', Infinity]) rejects({}, { level }, invalid);
  for (const flag of Object.keys(empty)) rejects({ [flag]: 1 }, { level: 1 }, invalid);
  for (const flag of ['spentSlot', 'quickened', 'freeMetamagic']) rejects({}, { level: 0, [flag]: null }, invalid);
});

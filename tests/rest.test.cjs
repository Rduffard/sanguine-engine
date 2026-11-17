const test = require('node:test');
const assert = require('node:assert/strict');
const { recoverHealthWithHitDice, HitDiceRecoveryError } = require('@crossworld/sanguine-engine/hit-dice');
const { recoverArcaneSlots, ArcaneRecoveryError } = require('@crossworld/sanguine-engine/spell-slots');
const { restPreparationError } = require('@crossworld/sanguine-engine/preparations');
const { recoverRestPools } = require('@crossworld/sanguine-engine/resources');
const { restDuration, longRestRecoveryInterval } = require('@crossworld/sanguine-engine/rest');

test('Hit Dice are spent at full Health and at zero effective healing; an invalid later spend leaves the inputs intact', () => {
  const hitDice = { d8: 2 };
  const health = { current: 9, max: 10 };
  const input = { health, hitDice, allocation: { d8: 2 }, resolve: 6 };
  const spend = roll => ({ die: 'd8', roll });
  assert.deepEqual(recoverHealthWithHitDice({ ...input, spends: [spend(1), spend(8)] }), {
    health: { current: 10, max: 10 }, hitDice: { d8: 0 },
  });
  assert.deepEqual(recoverHealthWithHitDice({ ...input, spends: [spend(1)] }).health, health);
  assert.deepEqual(recoverHealthWithHitDice({
    ...input, health: { ...health, current: 10 }, spends: [spend(8)],
  }).hitDice, { d8: 1 });
  assert.throws(() => recoverHealthWithHitDice({ ...input, spends: [spend(8), spend(9)] }), HitDiceRecoveryError);
  assert.deepEqual(hitDice, { d8: 2 });
  assert.deepEqual(health, { current: 9, max: 10 });
});

test('Arcane Recovery counts repeated levels against both the budget and expended ordinary slots', () => {
  const input = { slots: [0, 0], maximums: [2, 1], slotLevels: [1, 1], shipwrightLevel: 3, uses: 1 };
  assert.deepEqual(recoverArcaneSlots(input), { slots: [2, 0], uses: 0 });
  assert.throws(() => recoverArcaneSlots({ ...input, shipwrightLevel: 2 }), ArcaneRecoveryError);
  assert.throws(() => recoverArcaneSlots({ ...input, slots: [1, 0] }), /needs expended slots/);
  assert.throws(() => recoverArcaneSlots({ ...input, uses: 0 }), /Invalid Arcane Recovery/);
  assert.deepEqual(input.slots, [0, 0]);
});

test('rest preparation changes keep Calling-specific limits and allow reordering', () => {
  const base = { kind: 'short-rest', callingId: 'shipwright', shipwrightLevel: 5, previous: ['a', 'b'], selected: ['b', 'c'] };
  assert.equal(restPreparationError(base), null);
  assert.match(restPreparationError({ ...base, shipwrightLevel: 4 }), /Memorize Spell/);
  assert.match(restPreparationError({ ...base, selected: ['c', 'd'] }), /Memorize Spell/);
  const long = { ...base, kind: 'long-rest', selected: ['c', 'd'] };
  assert.equal(restPreparationError({ ...long, callingId: 'doctor' }), null);
  for (const callingId of ['warden', 'navigator', 'tidecaller']) {
    assert.match(restPreparationError({ ...long, callingId }), /replacement limit/);
  }
  assert.equal(restPreparationError({ ...long, callingId: 'warden', selected: ['b', 'a'] }), null);
});

test('rest pools support capped partial recovery, full recovery, and Intervention cooldown', () => {
  const definitions = {
    rage: { max: 3, recovery: { shortRest: 1 } },
    signature: { max: 1, recovery: { shortRest: 'all' } },
    'doctor:intervention': { max: 1, recovery: { shortRest: null } },
  };
  for (const rage of [0, 2, 3]) {
    const pools = { rage, signature: 0, 'doctor:intervention': 0 };
    assert.deepEqual(recoverRestPools(pools, definitions, { kind: 'short-rest' }), {
      rage: Math.min(rage + 1, 3), signature: 1, 'doctor:intervention': 0,
    });
    assert.deepEqual(recoverRestPools(pools, definitions, { kind: 'long-rest', interventionCooldown: 1 }), {
      rage: 3, signature: 1, 'doctor:intervention': 0,
    });
    assert.equal(recoverRestPools(pools, definitions, { kind: 'long-rest', interventionCooldown: 0 })['doctor:intervention'], 1);
    assert.equal(pools.signature, 0);
  }
});

test('rest timing shares the interruption extension and the Long Rest interval', () => {
  const hour = 3600000;
  assert.equal(restDuration('short-rest', 2), hour);
  assert.equal(restDuration('long-rest'), 8 * hour);
  assert.equal(restDuration('long-rest', 2), 10 * hour);
  assert.equal(longRestRecoveryInterval, 24 * hour);
});

test('a four-hour Long Rest retains interruption extensions and the recovery interval', () => {
  const { restCompletionTimingError } = require('@crossworld/sanguine-engine/rest');
  const hour = 3_600_000;
  assert.equal(restCompletionTimingError('long-rest', 4 * hour, 0, 24 * hour, 4), null);
  assert.equal(restCompletionTimingError('long-rest', 4 * hour, 1, 24 * hour, 4), 'duration');
  assert.equal(restCompletionTimingError('long-rest', 5 * hour, 1, 23 * hour, 4), 'interval');
  assert.equal(restCompletionTimingError('long-rest', 5 * hour, 1, 24 * hour, 4), null);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  HealingError, healVitality, restoreVitality, freshDeathSaves, resolveDeathSave,
  applyVitalityDamage, relentlessRageDC, clearTemporaryHealth, recoverRestExhaustion,
} = require('@crossworld/sanguine-engine/vitality');

test('ordinary healing validates amounts before death and resets bookkeeping only at positive Health', () => {
  const health = { current: 0, max: 10 };
  const deathSaves = { ...freshDeathSaves(), failures: 2, stable: true, stableUntil: 100 };
  const state = { health, deathSaves, pendingRelentlessRage: { dc: 15 }, temporaryHealth: 4 };
  assert.deepEqual(healVitality(state, 0), { health });
  assert.deepEqual(healVitality(state, 100), {
    health: { current: 10, max: 10 }, deathSaves: freshDeathSaves(), pendingRelentlessRage: null,
  });
  assert.deepEqual(healVitality({ ...state, health: { ...health, current: 10 } }, 0).deathSaves, freshDeathSaves());
  assert.equal(state.deathSaves.failures, 2);
  assert.deepEqual(state.pendingRelentlessRage, { dc: 15 });
  const dead = { ...state, deathSaves: { ...deathSaves, dead: true } };
  assert.throws(() => healVitality(dead, -1), { constructor: HealingError, message: 'Invalid healing' });
  assert.throws(() => healVitality(dead, 1), /cannot revive/);
  assert.deepEqual(restoreVitality(dead, 20), { health: { current: 10, max: 10 }, deathSaves: freshDeathSaves() });
});

test('recorded death saves preserve Defy Death and defer stabilization timing', () => {
  const initial = freshDeathSaves();
  assert.deepEqual(resolveDeathSave(initial, 18), { kind: 'continue', deathSaves: { ...initial, successes: 1 } });
  assert.deepEqual(resolveDeathSave(initial, 18, { defyDeath: true }), { kind: 'restore-health' });
  assert.deepEqual(resolveDeathSave({ ...initial, successes: 2 }, 10), { kind: 'stabilize' });
  assert.deepEqual(resolveDeathSave({ ...initial, failures: 1 }, 1), {
    kind: 'continue', deathSaves: { ...initial, failures: 3, dead: true, cause: 'failed-saves' },
  });
});

test('damage absorbs temporary Health before applying massive damage or failed saves', () => {
  const state = { health: { current: 0, max: 10 }, temporaryHealth: 5,
    deathSaves: { ...freshDeathSaves(), stable: true } };
  const absorbed = applyVitalityDamage(state, 5, true);
  assert.equal(absorbed.absorbed, 5);
  assert.equal(absorbed.deathSaves.failures, 2);
  assert.equal(absorbed.deathSaves.stable, false);
  assert.equal(applyVitalityDamage(state, 14).deathSaves.dead, false);
  assert.equal(applyVitalityDamage(state, 15).deathSaves.cause, 'massive-damage');
  assert.equal(state.temporaryHealth, 5);
  assert.equal(state.deathSaves.stable, true);
});

test('rest exhaustion and temporary Health obey their independent recovery rules', () => {
  for (let level = 0; level <= 6; level++) {
    assert.equal(recoverRestExhaustion(level, { kind: 'long-rest', nourished: true }), Math.max(0, level - 1));
    assert.equal(recoverRestExhaustion(level, { kind: 'long-rest', nourished: false, navigatorLevel: 10 }), level);
    assert.equal(recoverRestExhaustion(level, { kind: 'short-rest', navigatorLevel: 10 }), Math.max(0, level - 1));
    assert.equal(recoverRestExhaustion(level, { kind: 'short-rest', nourished: true, navigatorLevel: 9 }), level);
  }
  assert.equal(recoverRestExhaustion(undefined, { kind: 'long-rest' }), undefined);
  assert.deepEqual(clearTemporaryHealth(), { temporaryHealth: 0, temporaryHealthMetadata: null });
  assert.equal(relentlessRageDC(2), 20);
});

test('mitigation applies Evasion and Resistance before Reef Skin, with immunity taking precedence', () => {
  const { mitigateDamage, concentrationDamageDC } = require('@crossworld/sanguine-engine/vitality');
  const facts = { agilityHalfSave: 'failure', evasion: true, resistant: true, reefSkinReduction: 2 };
  assert.deepEqual(mitigateDamage(19, facts), { damage: 2, evasionApplied: true });
  assert.deepEqual(mitigateDamage(19, { ...facts, immune: true }), { damage: 0, evasionApplied: true });
  assert.deepEqual(mitigateDamage(19, { ...facts, evasion: false }), { damage: 7, evasionApplied: false });
  assert.deepEqual(mitigateDamage(19, { ...facts, agilityHalfSave: 'success' }), { damage: 0, evasionApplied: true });
  assert.deepEqual([1, 23, 100].map(concentrationDamageDC), [10, 11, 30]);
});

test('sourced temporary Health replaces only a smaller pool and numeric tracking has an explicit zero clear', () => {
  const { grantTemporaryHealth, trackTemporaryHealth } = require('@crossworld/sanguine-engine/vitality');
  const metadata = { source: 'feature', expiresAt: 60 };
  for (const amount of [0, 3, 5]) assert.deepEqual(grantTemporaryHealth(5, amount, metadata), {});
  assert.deepEqual(grantTemporaryHealth(5, 6, metadata), { temporaryHealth: 6, temporaryHealthMetadata: metadata });
  assert.equal(trackTemporaryHealth(5, 0), 0);
  assert.equal(trackTemporaryHealth(5, 3), 5);
  assert.equal(trackTemporaryHealth(5, 6), 6);
});

test('Unbroken Current only checks use and Reaction for a declared nonfatal drop', () => {
  const { unbrokenCurrentUnlocked, evaluateUnbrokenCurrent } = require('@crossworld/sanguine-engine/vitality');
  assert.equal(unbrokenCurrentUnlocked('sanguine-conduit', 17), false);
  assert.equal(unbrokenCurrentUnlocked('sanguine-conduit', 18), true);
  assert.equal(unbrokenCurrentUnlocked('tempest-heart', 20), false);
  const facts = { declared: true, before: 2, current: 0, dead: false, canReact: true, uses: 1, level: 19 };
  assert.deepEqual(evaluateUnbrokenCurrent(facts), { kind: 'restore', health: 1, temporaryHealth: 19, remainingUses: 0 });
  assert.equal(evaluateUnbrokenCurrent({ ...facts, uses: 0 }).kind, 'unavailable');
  assert.equal(evaluateUnbrokenCurrent({ ...facts, canReact: false }).kind, 'unavailable');
  assert.equal(evaluateUnbrokenCurrent({ ...facts, uses: 0, dead: true }).kind, 'inactive');
  assert.equal(evaluateUnbrokenCurrent({ ...facts, before: 0 }).kind, 'inactive');
});

test('Relentless Rage uses the attempt count and the post-reaction Health state', () => {
  const { pendingRelentlessRage, canResolveRelentlessRage, resolveRelentlessRage } = require('@crossworld/sanguine-engine/vitality');
  const facts = { before: 2, current: 0, dead: false, raging: true, level: 11, attempts: 1 };
  assert.deepEqual(pendingRelentlessRage(facts), { dc: 15 });
  assert.equal(pendingRelentlessRage({ ...facts, current: 1 }), null);
  assert.equal(pendingRelentlessRage({ ...facts, level: 10 }), null);
  const pending = { pending: { dc: 15 }, current: 0, activeRage: true, level: 11 };
  assert.equal(canResolveRelentlessRage(pending), true);
  assert.equal(canResolveRelentlessRage({ ...pending, activeRage: false }), false);
  assert.deepEqual(resolveRelentlessRage({ ...facts, total: 15 }), { attempts: 2, restoredHealth: 22 });
  assert.deepEqual(resolveRelentlessRage({ ...facts, total: 14 }), { attempts: 2, restoredHealth: null });
});

test('only Hunter’s Mark qualifies for the Navigator damage concentration exemption', () => {
  const { isDamageConcentrationExempt } = require('@crossworld/sanguine-engine/vitality');
  assert.equal(isDamageConcentrationExempt({ spellId: 'hunter-s-mark', navigatorLevel: 12 }), false);
  assert.equal(isDamageConcentrationExempt({ spellId: 'hunter-s-mark', navigatorLevel: 13 }), true);
  assert.equal(isDamageConcentrationExempt({ spellId: 'guidance', navigatorLevel: 20 }), false);
});

test('Concentration selects the higher roll and treats natural results as ordinary totals', () => {
  const { resolveConcentrationSave } = require('@crossworld/sanguine-engine/vitality');
  const resolve = (rolls, resolveModifier, dc) => resolveConcentrationSave({ rolls, resolveModifier, dc });
  assert.deepEqual(resolve([4, 12], 3, 15), { selected: 12, total: 15, success: true });
  assert.deepEqual(resolve([12, 4], 2, 15), { selected: 12, total: 14, success: false });
  assert.deepEqual(resolve([1], 9, 10), { selected: 1, total: 10, success: true });
  assert.deepEqual(resolve([20], -1, 20), { selected: 20, total: 19, success: false });
});

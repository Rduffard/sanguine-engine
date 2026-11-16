const test = require('node:test');
const assert = require('node:assert/strict');
const { breakwaterBarrier } = require('@crossworld/sanguine-engine/callings');
const { profiles, healingDiceCount, healingSpellAmount } = require('@crossworld/sanguine-engine/spells/healing');

test('Breakwater barrier thresholds preserve Guard, Health and geometry', () => {
  assert.deepEqual([3, 6, 10, 14].map(level => {
    const barrier = breakwaterBarrier(level, 4, 'bulwark', -1);
    return [barrier.maximumHealth, barrier.guard, barrier.width, barrier.maximumPassers, barrier.resistance];
  }), [
    [15, 16, 10, 0, null], [42, 16, 10, 0, null],
    [70, 16, 20, 4, null], [140, 16, 20, 4, 'all-except-force-and-siege'],
  ]);
});

test('healing spell upcasting preserves dice, flat scaling and the zero floor', () => {
  const cure = profiles['cure-wounds'];
  assert.equal(healingDiceCount(cure, 3, 1), 6);
  assert.equal(healingSpellAmount(cure, { level: 3, baseLevel: 1, rolledTotal: 6, castingModifier: 2, bonus: 5 }), 13);
  assert.equal(healingSpellAmount(cure, { level: 1, baseLevel: 1, rolledTotal: 2, castingModifier: -4, bonus: 0 }), 0);
  assert.equal(healingSpellAmount(profiles.heal, { level: 8, baseLevel: 6, rolledTotal: 0, castingModifier: 4, bonus: 0 }), 90);
});

test('relay and Preserve Life retain level-dependent capacities', () => {
  const { aetherRelay, preserveLife } = require('@crossworld/sanguine-engine/callings');
  assert.equal(aetherRelay(13, 'mobile').capacity, 1);
  assert.deepEqual(aetherRelay(14, 'mobile'), {
    capacity: 2, guard: 15, maximumHealth: 28, immunities: ['poison', 'psychic'],
    mobile: true, sizeFeet: 1, movementFeet: 15,
  });
  assert.deepEqual(preserveLife(6), { maximumHealing: 30, healingCapFraction: 0.5 });
});

test('armor requirements and Outrider penalties stack for resolved heavy armor', () => {
  const { armorRestrictions } = require('@crossworld/sanguine-engine/equipment/restrictions');
  const projection = { attributes: { might: 10 }, paths: { gunslinger: 'brass-outrider' }, callingLevels: { gunslinger: 7 } };
  const result = armorRestrictions({ category: 'heavy', mightRequirement: 15 }, true, false, true, projection);
  assert.equal(result.speedPenaltyFeet, 20);
  assert.equal(result.untrainedShield, true);
  assert.equal(result.spellcastingBlocked, true);
});

test('Smite of Protection unlocks at fifteen and widens at eighteen', () => {
  const { smiteOfProtectionUnlocked, smiteOfProtectionAura } = require('@crossworld/sanguine-engine/callings');
  assert.equal(smiteOfProtectionUnlocked('divine-smite', 'leviathan-anchor', 14), false);
  assert.equal(smiteOfProtectionUnlocked('divine-smite', 'leviathan-anchor', 15), true);
  assert.equal(smiteOfProtectionUnlocked('divine-smite', 'lantern-vigil', 20), false);
  assert.deepEqual(smiteOfProtectionAura(17), { halfCover: true, radiusFeet: 10 });
  assert.deepEqual(smiteOfProtectionAura(18), { halfCover: true, radiusFeet: 30 });
});

test('Cunning Strike spends dice before critical doubling and misses roll nothing', () => {
  const { cunningStrikeDice, strikeRollCount, strikeSaveDC } = require('@crossworld/sanguine-engine/combat/strike');
  assert.deepEqual(cunningStrikeDice(5, [{ cost: 1 }, { cost: 2 }]), { cost: 3, diceCount: 2 });
  assert.equal(strikeRollCount(2, true, true), 4);
  assert.equal(strikeRollCount(2, false, true), 0);
  assert.equal(strikeSaveDC(4, 3), 15);
});

test('resolved magic equipment stacks bonuses and uses the fastest swim speed', () => {
  const { magicModifiers } = require('@crossworld/sanguine-engine/equipment/magic-modifiers');
  assert.deepEqual(magicModifiers([
    { guardBonus: 1, saveBonus: 1, swimSpeed: 20 },
    { saveBonus: 2, spellAttackBonus: 1, swimSpeed: 40, waterBreathing: true },
  ]), { guardBonus: 1, saveBonus: 3, attackBonus: 1, ignoreHalfCover: false, waterBreathing: true, swimSpeed: 40 });
});

test('carrying capacity and bundled equipment weight use resolved quantities', () => {
  const { carryingCapacity, equipmentWeight } = require('@crossworld/sanguine-engine/equipment/carrying');
  assert.deepEqual(carryingCapacity(12, 2), { capacityLb: 360, pushDragLiftLb: 720 });
  assert.equal(equipmentWeight({ weightLb: 2, units: 20 }, 5), 0.5);
});

test('Ghost repair is capped and sabotage uses the resolved spell save DC', () => {
  const { ghostRepairAmount, ghostService } = require('@crossworld/sanguine-engine/callings');
  assert.equal(ghostRepairAmount(4, 12), 4);
  assert.equal(ghostRepairAmount(12, 4), 4);
  assert.deepEqual(ghostService('ghost-sabotage', 15), { tool: 'thieves-tools', discoveryDC: 15 });
});

test('Impossible Operation includes the one-minute boundary and rejects ineligible recipients', () => {
  const { impossibleOperation } = require('@crossworld/sanguine-engine/callings');
  const context = { selfTarget: false, consent: true, bodyIntact: true, deathSeconds: 60 };
  assert.deepEqual(impossibleOperation(context), { restoresHealthTo: 1 });
  for (const change of [{ deathSeconds: 61 }, { deathSeconds: -1 }, { consent: false }, { selfTarget: true }, { bodyIntact: false }]) {
    assert.equal(impossibleOperation({ ...context, ...change }), null);
  }
});

test('Conductive conversion deduplicates damage types and records forfeiture', () => {
  const { conductiveConversion } = require('@crossworld/sanguine-engine/spells/conductive-conversion');
  assert.deepEqual(conductiveConversion(['thunder', 'fire', 'lightning'], 'lightning'), {
    damageTypes: ['lightning', 'fire'],
    conductiveConversion: { from: 'thunder', to: 'lightning', forfeited: false },
  });
  assert.equal(conductiveConversion(['fire'], 'thunder').conductiveConversion.forfeited, true);
});

test('Bloodied uses half Health rounded down and stops healing at the cap', () => {
  const { isBloodied, halfHealthHealingAmount } = require('@crossworld/sanguine-engine/vitality');
  assert.equal(isBloodied({ current: 5, max: 11 }), true);
  assert.equal(isBloodied({ current: 6, max: 11 }), false);
  assert.equal(halfHealthHealingAmount({ current: 3, max: 11 }, 20), 2);
  assert.equal(halfHealthHealingAmount({ current: 6, max: 11 }, 20), 0);
});

test('Saltglass Parry changes hits in the Guard window and preserves natural results', () => {
  const { saltglassParry } = require('@crossworld/sanguine-engine/callings');
  assert.equal(saltglassParry(15, 3, 15, 12).causedMiss, true);
  assert.equal(saltglassParry(15, 3, 18, 12).causedMiss, false);
  assert.equal(saltglassParry(15, 3, 15, 20).causedMiss, false);
});

test('Metamagic grants use the shared options and reject invalid replacement', () => {
  const { metamagicChoicesAtLevel, replaceMetamagic } = require('@crossworld/sanguine-engine/spells/metamagic');
  assert.deepEqual([1, 2, 9, 10, 16, 17, 20].map(level => metamagicChoicesAtLevel(level)?.count ?? 0), [0, 2, 0, 2, 0, 2, 0]);
  assert.deepEqual(replaceMetamagic(['distant-spell'], { from: 'distant-spell', to: 'subtle-spell' }), ['subtle-spell']);
  assert.equal(replaceMetamagic(['distant-spell'], { from: 'distant-spell', to: 'unknown' }), null);
});

test('Calling tactics preserve movement, recoil and resolved damage thresholds', () => {
  const { passingShotEligible, reaverAreaDamage, starwakePassage, stormhideRetaliationDamage } = require('@crossworld/sanguine-engine/callings');
  assert.equal(passingShotEligible({ voluntarySpeedFeet: 19 }), false);
  assert.equal(passingShotEligible({ voluntarySpeedFeet: 20 }), true);
  assert.equal(passingShotEligible({ voluntarySpeedFeet: 20, recoilBeforeHit: true }), false);
  assert.deepEqual(reaverAreaDamage([1, 2, 4]), { damage: 7, successDamage: 3 });
  assert.equal(stormhideRetaliationDamage(-1), 1);
  assert.equal(starwakePassage(6, 'cliff').speedFeet, 20);
  assert.deepEqual(starwakePassage(7, 'cliff'), { speedType: 'climb', speedFeet: 30, ignoreNonmagicalDifficultTerrain: true, extraMovement: false });
});

test('Calling milestones and tactical damage conserve established boundaries', () => {
  const { callingSaveGrants, primalChampionAttributes, leviathanBurden, suppressingFireTargetLimit, suppressingFireControl } = require('@crossworld/sanguine-engine/callings');
  assert.deepEqual(primalChampionAttributes(19, { might: 20, resolve: 23 }), {});
  assert.deepEqual(primalChampionAttributes(20, { might: 20, resolve: 23 }), { might: 24, resolve: 25 });
  assert.deepEqual(callingSaveGrants('corsair', 15), ['instinct', 'spirit']);
  assert.deepEqual(leviathanBurden(7), { transferredDamage: 3, allyDamage: 4 });
  assert.deepEqual([suppressingFireTargetLimit(14), suppressingFireTargetLimit(15)], [1, 2]);
  assert.deepEqual(suppressingFireControl(['primary', 'secondary'], 7, 'push').map(result => result.extraDamage), [7, 0]);
});

test('folio and tactical helpers preserve thresholds and arithmetic', () => {
  const { grayNetChoice, shipwrightFolioCount, powderSaintSavantCount, envoyTargetLimit, envoyCommandRange, freePortReroll } = require('@crossworld/sanguine-engine/callings');
  assert.equal(grayNetChoice('gray-net', 6), null);
  assert.equal(grayNetChoice('gray-net', 7).key, 'defensiveTactics');
  assert.deepEqual([1, 2].map(shipwrightFolioCount), [6, 2]);
  assert.equal(powderSaintSavantCount('powder-saint', 3, 1, 1), 2);
  assert.equal(powderSaintSavantCount('powder-saint', 5, 2, 1), 1);
  assert.equal(envoyTargetLimit('envoy-parley', -1), 1);
  assert.deepEqual([8, 9].map(envoyCommandRange), [30, 60]);
  assert.deepEqual(freePortReroll(12, 6, 3, 15), { checkTotal: 15, success: true });
});

test('Warden target caps and aura formulas preserve unlock thresholds and minimums', () => {
  const { abjureFoesTargetLimit, holyNimbus, covenantAura, passageAura, clearSightAura } =
    require('@crossworld/sanguine-engine/callings');
  assert.deepEqual([-2, 0, 1, 4].map(abjureFoesTargetLimit), [1, 1, 1, 4]);
  assert.equal(holyNimbus(17, -2, 6).radiusFeet, 10);
  assert.equal(holyNimbus(18, -2, 6).enemyStartTurnDamage, 4);
  assert.equal(covenantAura(18, -2, true).standardTemporaryHealth, 1);
  assert.equal(covenantAura(18, 4, false).standardTemporaryHealth, 0);
  assert.equal(passageAura(18, false).radiusFeet, 30);
  assert.equal(clearSightAura(17, true).dawnSunlight, true);
});

test('tactical checks preserve roll ties, target caps and movement boundaries', () => {
  const {
    chainbreakerEscape, thunderousLandingEligible, cinderRadiusEligible, recoilMovement,
    starwakeGuideEligible, starwakeHomewardEligible, lastTellDiceEligible,
  } = require('@crossworld/sanguine-engine/callings');
  assert.deepEqual(chainbreakerEscape([5, 8], 3, 11), { checkTotal: 11, dc: 11, success: true });
  assert.equal(chainbreakerEscape([5], 3, 9).success, false);
  assert.deepEqual([thunderousLandingEligible(9, true), thunderousLandingEligible(10, false),
    thunderousLandingEligible(10, true)], [false, false, true]);
  assert.deepEqual([cinderRadiusEligible(9, 5), cinderRadiusEligible(9, 10),
    cinderRadiusEligible(10, 10), cinderRadiusEligible(10, '10')], [true, false, true, false]);
  assert.equal(recoilMovement(0, 'self'), null);
  assert.equal(recoilMovement(15, 'mount').mountUsesRemainingMovement, true);
  assert.equal(recoilMovement(15, 'self').extraMovement, true);
  assert.equal(starwakeGuideEligible([], 'owner'), false);
  assert.equal(starwakeGuideEligible(['ally', 'owner'], 'owner'), false);
  assert.equal(starwakeHomewardEligible([], 'owner'), true);
  assert.equal(lastTellDiceEligible([0, 1, 2], 3), true);
  assert.equal(lastTellDiceEligible([0, 0], 3), false);
  assert.equal(lastTellDiceEligible([3], 3), false);
});

const assert = require('node:assert/strict');
const test = require('node:test');
const { ATTRIBUTE_KEYS, calculateCheckModifier } = require('@crossworld/sanguine-engine/attributes');
const {
  POINT_BUY_BUDGET, POINT_BUY_COSTS, createPointBuyAttributes, calculatePointBuyCost,
  calculateRemainingPointBuyPoints, validatePointBuyAllocation,
} = require('@crossworld/sanguine-engine/point-buy');
const { applyRollFloors, d20, rollDie } = require('@crossworld/sanguine-engine/dice');
const {
  aggregateEquipmentTraining, armorTrained, normalizeToolTraining,
  trainingBonusForLevel, trainingContribution, weaponTrained,
} = require('@crossworld/sanguine-engine/training');

test('every attribute uses the same expected modifiers across negative and positive boundaries', () => {
  assert.deepEqual(ATTRIBUTE_KEYS, ['might', 'agility', 'wit', 'spirit', 'resolve', 'instinct']);
  const expected = [-5, -4, -4, -3, -3, -2, -2, -1, -1, 0, 0, 1, 1, 2, 2,
    3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10];
  for (const key of ATTRIBUTE_KEYS) {
    expected.forEach((modifier, index) => {
      assert.equal(calculateCheckModifier({ [key]: index + 1 }, key), modifier);
    });
  }
  assert.equal(calculateCheckModifier({ might: Number.MAX_SAFE_INTEGER }, 'might'), 4503599627370490);
  for (const might of [undefined, 0, -1, 8.5, '10', Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => calculateCheckModifier({ might }, 'might'), TypeError);
  }
  assert.throws(() => calculateCheckModifier({ strength: 10 }, 'strength'), RangeError);
});

test('point buy preserves all eight prices and reports over-budget cost separately from validation', () => {
  const costs = [0, 1, 2, 3, 4, 5, 7, 9];
  assert.equal(POINT_BUY_BUDGET, 27);
  assert.deepEqual(Object.values(POINT_BUY_COSTS), costs);
  for (const key of ATTRIBUTE_KEYS) {
    costs.forEach((cost, index) => {
      const scores = { ...createPointBuyAttributes(), [key]: index + 8 };
      assert.deepEqual(validatePointBuyAllocation(scores), { cost, remaining: 27 - cost });
    });
  }
  const exhausted = { might: 8, agility: 15, resolve: 15, wit: 10, instinct: 10, spirit: 13 };
  assert.deepEqual(validatePointBuyAllocation(exhausted), { cost: 27, remaining: 0 });
  const overBudget = { ...exhausted, might: 9 };
  assert.equal(calculatePointBuyCost(overBudget), 28);
  assert.equal(calculateRemainingPointBuyPoints(overBudget), -1);
  assert.throws(() => validatePointBuyAllocation(overBudget), /27-point budget/);
  for (const invalid of [null, {}, { ...exhausted, strength: 10 }, { ...exhausted, might: 8.5 }]) {
    assert.throws(() => calculatePointBuyCost(invalid), TypeError);
  }
  for (const might of [7, 16]) {
    assert.throws(() => calculatePointBuyCost({ ...exhausted, might }), RangeError);
  }
});

test('d20 preserves dice order and cancellation and applies floors after selection', () => {
  for (const [advantage, disadvantage, dice, selected] of [
    [false, false, [4], 4], [true, true, [4], 4],
    [true, false, [4, 17], 17], [false, true, [4, 17], 4],
  ]) {
    const input = [4, 17];
    assert.deepEqual(d20({ advantage, disadvantage }, sides => {
      assert.equal(sides, 20);
      return input.shift();
    }), { dice, selected });
    assert.equal(input.length, 2 - dice.length);
  }
  assert.equal(rollDie(6, () => 6), 6);
  for (const value of [0, 7, 1.5, '4']) assert.throws(() => rollDie(6, () => value), /Invalid die result/);
  assert.deepEqual(applyRollFloors(4, 6, 10, -10000), { applied: 10, total: 16 });
  assert.deepEqual(applyRollFloors(4, -2, 1, 20), { applied: 4, total: 20 });
});

test('Training uses one contribution across the level schedule and Expertise states', () => {
  assert.deepEqual(Array.from({ length: 20 }, (_, i) => trainingBonusForLevel(i + 1)),
    [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]);
  for (const level of [0, 21, 1.5, '1']) assert.throws(() => trainingBonusForLevel(level), /Level must be 1–20/);
  assert.equal(trainingContribution(3, { trained: false }), 0);
  assert.equal(trainingContribution(3, { trained: true }), 3);
  assert.equal(trainingContribution(3, { trained: true, expertise: true }), 6);
  assert.equal(trainingContribution(3, { trained: false, expertise: true }), 6);
});

test('tool aliases preserve existing grant identifiers and instrument normalization', () => {
  for (const [grant, id] of [
    ['navigators-tools', 'navigator-tools'], ['carpenters-tools', 'carpenter-tools'],
    ['masons-tools', 'mason-tools'], ['smiths-tools', 'smith-tools'],
    ['tinkers-tools', 'tinker-tools'], ['poisoners-kit', 'poisoner-kit'],
    ['calligraphers-supplies', 'calligrapher-tools'], ['instrument:lute', 'lute'],
    ['thieves-tools', 'thieves-tools'],
  ]) assert.equal(normalizeToolTraining(grant), id);
});

test('equipment Training merges grants without mutating profiles and checks exact membership', () => {
  const base = { categories: ['simple'], weapons: ['cutlass'], groups: ['finesse'], armor: ['light'] };
  const profile = aggregateEquipmentTraining(base, [{ weapons: ['cutlass', 'musket'], armor: ['shield'] }]);
  assert.deepEqual(profile, { ...base, weapons: ['cutlass', 'musket'], armor: ['light', 'shield'] });
  assert.deepEqual(base.weapons, ['cutlass']);
  const groups = { finesse: ['rapier'] };
  for (const weapon of [
    { id: 'dagger', category: 'simple' },
    { id: 'musket', category: 'firearm' },
    { id: 'rapier', category: 'martial' },
  ]) assert.equal(weaponTrained(profile, weapon, groups), true);
  assert.equal(weaponTrained(profile, { id: 'greatsword', category: 'martial' }, groups), false);
  for (const category of ['light', 'shield']) assert.equal(armorTrained(profile, category), true);
  assert.equal(armorTrained(profile, 'heavy'), false);
});

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  baseSavingThrowModifier, projectSavingThrowModifiers, exhaustionD20Penalty,
} = require('@crossworld/sanguine-engine/saving-throws');

test('base saves combine floored attribute modifiers, binary Training and resolved aura', () => {
  assert.equal(baseSavingThrowModifier({ score: 7, trained: false, trainingBonus: 6 }), -2);
  assert.equal(baseSavingThrowModifier({ score: 10, trained: true, trainingBonus: 2 }), 2);
  assert.equal(baseSavingThrowModifier({ score: 21, trained: true, trainingBonus: 6, auraBonus: 3 }), 14);
});

test('live projection removes suppressed Aura, applies Exhaustion and adds eligible item bonuses', () => {
  const base = { resolve: 6, spirit: 2 };
  assert.deepEqual(projectSavingThrowModifiers(base, { suppressedAura: 2, exhaustion: 5, equipmentBonus: 2 }), {
    resolve: -4, spirit: -8,
  });
  assert.deepEqual(projectSavingThrowModifiers(base, {}), base);
  assert.deepEqual(base, { resolve: 6, spirit: 2 });
  assert.equal(exhaustionD20Penalty(6), 12);
});

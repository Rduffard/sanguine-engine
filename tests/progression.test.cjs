const assert = require('node:assert/strict');
const test = require('node:test');
const { ProgressionInputError, deriveVitalityProgression, derivePathResourceCapacity } =
  require('@crossworld/sanguine-engine/progression');

test('fixed vitality matches per-level replay for all supported levels, Hit Dice, and Resolve scores', () => {
  for (const hitDie of [6, 8, 10, 12]) {
    for (let resolve = 1; resolve <= 30; resolve++) {
      const modifier = Math.floor((resolve - 10) / 2);
      let baseHealth = 0;
      for (let level = 1; level <= 20; level++) {
        const gain = level === 1 ? hitDie : hitDie / 2 + 1;
        baseHealth += Math.max(1, gain + modifier);
        for (const bonusHealth of [0, level]) {
          assert.deepEqual(deriveVitalityProgression({ level, hitDie, resolve, bonusHealth }), {
            health: { max: baseHealth + bonusHealth },
            hitDice: { [`d${hitDie}`]: level },
          });
        }
      }
    }
  }
});

test('returns fresh results and keeps the bonus separate from the per-level floor', () => {
  const input = Object.freeze({ level: 3, hitDie: 6, resolve: 3, bonusHealth: 3 });
  const first = deriveVitalityProgression(input);
  const second = deriveVitalityProgression(input);
  assert.deepEqual(first, { health: { max: 7 }, hitDice: { d6: 3 } });
  assert.deepEqual(second, first);
  assert.notEqual(first.health, second.health);
  assert.notEqual(first.hitDice, second.hitDice);
  assert.deepEqual(input, { level: 3, hitDie: 6, resolve: 3, bonusHealth: 3 });
  assert.deepEqual(deriveVitalityProgression({ level: 3, hitDie: 6, resolve: 3 }), {
    health: { max: 4 }, hitDice: { d6: 3 },
  });
});

test('rejects malformed inputs and unsafe totals with a stable field-specific error', () => {
  const input = { level: 1, hitDie: 8, resolve: 12 };
  const rejects = (value, field) => assert.throws(() => deriveVitalityProgression(value), error =>
    error instanceof ProgressionInputError && error.code === 'INVALID_VITALITY_PROGRESSION' && error.field === field);
  for (const value of [null, undefined, [], 'level']) rejects(value, 'input');
  for (const [field, values] of Object.entries({
    level: [undefined, 0, 21, 1.5, '1'],
    hitDie: [undefined, 4, 7, 20, 'd8'],
    resolve: [undefined, 0, 31, 12.5, '12'],
    bonusHealth: [null, -1, 0.5, '1', 1n, Symbol('bonus'), Number.MAX_SAFE_INTEGER],
  })) {
    for (const value of values) rejects({ ...input, [field]: value }, field);
  }
});

test('Path capacity matches every level of the shared progression', () => {
  const expected = [0, 0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6];
  const actual = expected.map((_, i) => derivePathResourceCapacity({ level: i + 1, unlockLevel: 3 }));
  assert.deepEqual(actual, expected);
});

test('Path capacity uses the supplied unlock without mutating the input', () => {
  const input = Object.freeze({ level: 9, unlockLevel: 5 });
  assert.equal(derivePathResourceCapacity(input), 3);
  assert.equal(derivePathResourceCapacity(input), 3);
  assert.deepEqual(input, { level: 9, unlockLevel: 5 });
  assert.equal(derivePathResourceCapacity({ level: 19, unlockLevel: 20 }), 0);
  assert.equal(derivePathResourceCapacity({ level: 20, unlockLevel: 20 }), 2);
});

test('Path capacity reports invalid levels and unlock configuration with a stable error', () => {
  const rejects = (input, field) => assert.throws(() => derivePathResourceCapacity(input), error =>
    error instanceof ProgressionInputError && error.code === 'INVALID_PATH_RESOURCE_CAPACITY' &&
      error.field === field);
  for (const input of [undefined, null, [], '3']) rejects(input, 'input');
  for (const value of [undefined, null, 0, -1, 21, 3.5, '3', Infinity, 3n]) {
    rejects({ level: value, unlockLevel: 3 }, 'level');
    rejects({ level: 3, unlockLevel: value }, 'unlockLevel');
  }
});

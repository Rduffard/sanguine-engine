const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const test = require('node:test');
const equipment = require('@crossworld/sanguine-engine/equipment');
const { spells, profiles } = require('@crossworld/sanguine-engine/spells');

function hash(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

test('portable equipment matches the original ordered blueprint', () => {
  assert.equal(hash(equipment), 'ac35a648ab06d54257ceea17fc5b0ac0c51bd37119610ed217cfbff0c3449eda');
});

test('portable spell definitions and profiles match the host baseline', () => {
  assert.equal(spells.length, 316);
  assert.equal(hash(spells), '1ad51aff83b322e993e60c81edad8098293444eecd551468a2bd3c517d289db9');
  assert.equal(hash(profiles), '6b38743afa2faf6a9d9b569eda5766a59043cec78f64880480c87b47757f141f');
});

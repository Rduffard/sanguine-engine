const test = require('node:test');
const assert = require('node:assert/strict');
const { roster, numerical, progression, spellcasting } = require('@crossworld/sanguine-engine/callings');

test('Calling progression exposes every Path grant and spellcasting schedule', () => {
  const attributes = { wit: 16, instinct: 16, spirit: 16 };
  const pathIds = new Set();
  for (const [id, calling] of Object.entries(roster)) {
    const levels = progression(id);
    assert.equal(levels.length, 20);
    assert.equal(calling.paths.length, 4);
    assert.ok(Object.isFrozen(calling.definition));
    for (const path of calling.paths) pathIds.add(path.id);
    for (const entry of levels) {
      const { callingLevel: level } = entry;
      assert.deepEqual(entry.numerical, numerical(id, level));
      assert.equal(entry.pathFeatureGrant, calling.definition.pathLevels.includes(level));
      const casting = spellcasting(id, level, attributes);
      if (calling.definition.caster) {
        assert.deepEqual(entry.spellcasting.slots, casting.slots);
        assert.equal(entry.spellcasting.preparedCount, casting.preparedCount);
        assert.equal(casting.saveDC, 11);
      } else {
        assert.equal(casting, null);
      }
    }
  }
  assert.equal(pathIds.size, 32);
});

test('Calling execution formulas preserve minimums, thresholds and odd damage rounding', () => {
  const rules = require('@crossworld/sanguine-engine/callings');
  assert.equal(rules.colossusStanceHealth(3, -2), 1);
  assert.equal(rules.strokeOfLuckTotal(12, 7), 25);
  assert.equal(rules.mangroveVanishDamage(7), 3);
  assert.deepEqual([rules.auraOfProtectionBonus(5, 3), rules.auraOfProtectionBonus(6, -1), rules.auraOfProtectionBonus(20, 4)], [0, 1, 4]);
  assert.equal(rules.bloodPriceHealthCost(6), 12);
  assert.equal(rules.comfortTemporaryHealth(-2), 1);
  assert.equal(rules.barrierDamageReduction(0), 1);
  assert.equal(rules.barrierDamageReduction(11), 11);
});

test('Reef Skin and Conduit limits use resolved mechanical facts', () => {
  const rules = require('@crossworld/sanguine-engine/callings');
  const reefSkin = { attack: true, damageType: 'piercing', path: 'reef-colossus', level: 6, raging: true, suppressed: false };
  assert.equal(rules.reefSkinEligible(reefSkin), true);
  for (const change of [{ attack: false }, { damageType: 'fire' }, { path: 'bloodwake' }, { level: 5 }, { raging: false }, { suppressed: true }]) {
    assert.equal(rules.reefSkinEligible({ ...reefSkin, ...change }), false);
  }
  assert.deepEqual([3, 5, 6, 17, 18, 20].map(rules.bloodPriceDiceCount), [1, 1, 2, 2, 3, 3]);
  assert.equal(rules.bloodPriceShelterHealth(1, -2), 0);
  assert.equal(rules.bloodPriceShelterHealth(8, 4), 12);
  assert.deepEqual([-2, 0, 1, 5].map(rules.vitalCircuitHealth), [1, 1, 1, 5]);
  assert.deepEqual([-2, 0, 1, 5].map(rules.empoweredSpellRerollLimit), [1, 1, 1, 5]);
});

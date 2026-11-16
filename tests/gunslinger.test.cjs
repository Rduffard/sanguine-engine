const assert = require('node:assert/strict');
const test = require('node:test');
const {
  gunslinger, gunslingerProgression, gunslingerResources, gunslingerLevelGrants,
  gunslingerAbilityDefinitions, gunslingerAbilityPreview, gunslingerCriticalThreshold,
  indomitableTotal, halfWalkingSpeed, heroicRallyHealing,
} = require('@crossworld/sanguine-engine/callings');

test('Gunslinger owns four complete and immutable Path schedules', () => {
  assert.deepEqual(gunslinger.paths.map(path => path.id), ['deadeye', 'iron-suppressor', 'brass-outrider', 'cinder-artillerist']);
  assert.deepEqual(gunslinger.definition.starting.saves, ['might', 'resolve']);
  assert.equal(gunslinger.timeline.length, 20);
  assert.equal(new Set(gunslinger.features.map(feature => feature.id)).size, 35);
  for (const path of gunslinger.paths) {
    assert.deepEqual(path.featureLevels, [3, 7, 10, 15, 18]);
    for (const id of path.grants) assert.ok(gunslinger.features.some(feature => feature.id === id && feature.ownerId === path.id));
    for (let level = 1; level <= 20; level++) {
      const pools = gunslingerResources(level, path.id);
      assert.equal(pools['gunslinger:second-wind'].max, level >= 10 ? 4 : level >= 4 ? 3 : 2);
      for (const [key, spec] of Object.entries(path.pools ?? {})) {
        assert.equal(pools[path.id + ':' + key]?.max, level >= (spec.level ?? 3) ? spec.max : undefined);
      }
    }
  }
  assert.throws(() => gunslingerProgression(21), RangeError);
  assert.throws(() => gunslingerResources(3, 'wrong-path'), RangeError);
  assert.deepEqual(gunslingerProgression(20), { attacksPerAction:4, masteryCount:6, secondWindUses:4, actionSurgeUses:2, indomitableUses:3 });
  assert.equal(gunslingerLevelGrants(7,'deadeye').fightingStyle,true);
  assert.equal(gunslingerLevelGrants(3,'brass-outrider','rider').skill,'animal-handling');
  assert.equal(gunslingerLevelGrants(7,'cinder-artillerist').tool,'smiths-tools');
});

test('Gunslinger options and deterministic mechanics preserve costs and thresholds', () => {
  assert.deepEqual(gunslingerAbilityDefinitions['path:cinder-artillerist:grand-battery:18'][0][3], [['cinder-artillerist:charge',2],['cinder-artillerist:battery',1]]);
  assert.equal(gunslingerAbilityPreview('second-wind',{level:5}).roll.bonus,5);
  assert.equal(gunslingerAbilityPreview('suppressor-hit',{level:15,trainingBonus:5,agility:4,corridorDcBonus:2}).save.dc,19);
  assert.equal(gunslingerAbilityPreview('measured-charge',{level:7,trainingBonus:3,wit:2}).roll.count,3);
  assert.equal(gunslingerCriticalThreshold('deadeye',15),18);
  assert.equal(gunslingerCriticalThreshold('brass-outrider',20),20);
  assert.equal(indomitableTotal(1,-3,9),7);
  assert.equal(halfWalkingSpeed(25),12);
  assert.equal(heroicRallyHealing('deadeye',18,10,20,-2),3);
  assert.equal(heroicRallyHealing('deadeye',18,11,20,2),null);
});

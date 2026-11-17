const { test } = require('node:test');
const assert = require('node:assert/strict');
const { lineages, validateLineageSelection, deriveLineage, lineageActivationTerms } =
  require('@crossworld/sanguine-engine/lineages');

const context = { skillIds: ['athletics', 'stealth', 'perception', 'survival'], toolIds: ['smith-tools'] };
const human = { id: 'human', size: 'small', choices: { skill: 'stealth', originFeat: { id: 'alert' } } };
const fishmen = { id: 'fishmen', choices: { castingAttribute: 'wit' } };
const stoneborn = { id: 'stoneborn' };
const beastshifter = { id: 'beastshifters', size: 'small', choices: { skill: 'athletics', formId: 'dock-rat' } };
const changeling = { id: 'changelings', size: 'medium', choices: { skills: ['deception', 'persuasion'] } };
const feyTouched = heritage => ({
  id: 'fey-touched', choices: { heritage, skill: 'perception', castingAttribute: 'spirit' },
});

test('the public catalog has six stable lineages and immutable nested rules', () => {
  assert.deepEqual(lineages.map(({ id, source }) => [id, source.version]), [
    ['human', '5.2.1'], ['fishmen', 'lineages-v1'], ['stoneborn', '5.2.1'], ['fey-touched', '5.2.1'],
    ['beastshifters', 'lineages-v1'], ['changelings', 'lineages-v1'],
  ]);
  assert.ok(Object.isFrozen(lineages));
  assert.ok(Object.isFrozen(lineages[0].choices.size));
  assert.ok(Object.isFrozen(lineages[3].heritages.gloam.spells));
  assert.equal(lineages[2].source.license, 'CC BY 4.0');
  assert.equal(new Set(lineages.flatMap(entry => entry.traits.map(trait => trait.id))).size, 22);
});

test('creation previews expose missing choices and reject foreign choices and fixed-size overrides', () => {
  assert.deepEqual(validateLineageSelection({ id: 'human' }, context).pending,
    ['size', 'choices.skill', 'choices.originFeat']);
  assert.deepEqual(validateLineageSelection({ ...fishmen, size: 'medium' }).issues, [{ field: 'size', code: 'forbidden' }]);
  assert.deepEqual(validateLineageSelection({ id: 'stoneborn', choices: {} }).issues,
    [{ field: 'choices', code: 'forbidden' }]);
  assert.deepEqual(validateLineageSelection({ id: 'toString' }).issues, [{ field: 'id', code: 'ineligible' }]);
  assert.deepEqual(validateLineageSelection({ ...feyTouched('glasslight'),
    choices: { ...feyTouched('glasslight').choices, cantrip: 'mage-hand' } }).issues,
  [{ field: 'choices.cantrip', code: 'forbidden' }]);
  assert.deepEqual(validateLineageSelection({ ...beastshifter, choices: { skill: 'athletics', formId: 'gray-wolf' } }).issues,
    [{ field: 'choices.formId', code: 'ineligible' }]);
  assert.equal(validateLineageSelection({ ...changeling, choices: { skills: ['deception', 'deception'] } }).selection, null);
  assert.equal(validateLineageSelection(changeling, { trained: ['persuasion'] }).selection, null);
  assert.throws(() => deriveLineage({ id: 'human' }, 1, context), { code: 'INVALID_LINEAGE_SELECTION', field: 'size' });
});

test('Human adds one distinct skill, an Origin feat with its own grant key, and Long Rest Inspiration', () => {
  const result = deriveLineage(human, 1, context);
  assert.deepEqual(result.trainedSkills, ['stealth']);
  assert.equal(result.size, 'small');
  assert.deepEqual(result.movement, { walk: 30, swim: 0, climb: 0, fly: 0 });
  assert.deepEqual(result.originFeat, { id: 'alert', grantKey: 'lineage:human:origin-feat' });
  assert.deepEqual(result.longRestGrants, [{ kind: 'heroic-inspiration', amount: 1 }]);
  assert.equal(validateLineageSelection(human, { ...context, chosenFeats: ['alert'] }).selection, null);
  assert.equal(validateLineageSelection(human, { ...context, trained: ['stealth'] }).selection, null);
  assert.equal(deriveLineage({ ...human, size: 'medium' }, 1, context).size, 'medium');
  assert.equal(validateLineageSelection({ ...human, size: 'large' }, context).selection, null);
});

test('Human Origin feat options reuse existing list eligibility and treat Training grants as distinct', () => {
  const withFeat = originFeat => ({ ...human, choices: { ...human.choices, originFeat } });
  const skilled = training => withFeat({ id: 'skilled', options: { training } });
  const grants = ['skill:athletics', 'skill:survival', 'tool:smith-tools'];
  assert.deepEqual(deriveLineage(skilled(grants), 1, context).originFeat.options.training, grants);
  assert.equal(validateLineageSelection(skilled(['skill:stealth', ...grants.slice(1)]), context).selection, null);
  assert.equal(validateLineageSelection(withFeat({ id: 'skilled' }), context).selection, null);
  const initiate = withFeat({ id: 'magic-initiate',
    options: { list: 'shipwright', attribute: 'wit', cantrips: ['mage-hand', 'prestidigitation'], spell: 'detect-magic' } });
  assert.ok(validateLineageSelection(initiate, context).selection);
  assert.equal(validateLineageSelection(initiate, { ...context, initiateLists: ['shipwright'] }).selection, null);
  assert.equal(validateLineageSelection(withFeat({ id: 'alert', options: {} }), context).selection, null);
});

test('Fishmen have separate swim and walk speeds and three progressively unlocked, independent spell grants', () => {
  const fishAt = level => deriveLineage(fishmen, level, { attributes: { wit: 16 } });
  const first = fishAt(1);
  assert.equal(first.size, 'medium');
  assert.deepEqual(first.movement, { walk: 30, swim: 30, climb: 0, fly: 0 });
  assert.deepEqual(first.senses, { darkvision: 60 });
  assert.deepEqual(first.breathes, ['air', 'water']);
  assert.deepEqual(first.damageResistances, ['cold']);
  assert.equal(first.communication.direction, 'outgoing');
  assert.equal(first.pools.length, 1);
  assert.deepEqual(fishAt(3).spells.map(grant => grant.unlocked), [true, true, false]);
  const fifth = fishAt(5);
  assert.deepEqual(fifth.spells.map(spell => [spell.spellId, spell.spellLevel, spell.unlockLevel, spell.saveDC,
    spell.attackModifier, spell.modes]), [
    ['fog-cloud', 1, 1, 14, 6, ['free', 'slot']],
    ['gust-of-wind', 2, 3, 14, 6, ['free', 'slot']],
    ['water-walk', 3, 5, 14, 6, ['free', 'slot']],
  ]);
  assert.deepEqual(fifth.pools.map(pool => [pool.id, pool.max, pool.recovery.longRest]), [
    ['lineage:fishmen:fog-cloud', 1, 'all'], ['lineage:fishmen:gust-of-wind', 1, 'all'],
    ['lineage:fishmen:water-walk', 1, 'all'],
  ]);
});

test('Stoneborn derive level-based Health, distinct poison defenses, and timed Stone Listening terms', () => {
  assert.equal(deriveLineage(stoneborn, 1).maxHealthAdjustment, 1);
  const result = deriveLineage(stoneborn, 17);
  assert.equal(result.maxHealthAdjustment, 17);
  assert.deepEqual(result.senses, { darkvision: 120 });
  assert.deepEqual(result.damageResistances, ['poison']);
  assert.deepEqual(result.saveAdvantages, [{ conditionId: 'poisoned', when: ['avoid', 'end'] }]);
  assert.equal(result.pools[0].max, 6);
  const id = 'lineage:stoneborn:stone-listening';
  const terms = lineageActivationTerms(id, { lineageId: 'stoneborn', level: 17,
    canTakeBonusAction: true, pools: { [id]: 1 } });
  assert.equal(terms.effect.range, 60);
  assert.equal(terms.effect.durationMinutes, 10);
  assert.equal(terms.effect.requiresStoneContact, true);
  assert.deepEqual(terms.poolSpend, { poolId: id, amount: 1 });
});

test('Fey-Touched heritage alters movement or senses and grants its own cantrip and leveled spells', () => {
  for (const [heritage, walk, darkvision, spells] of [
    ['gloam', 30, 120, ['dancing-lights', 'faerie-fire', 'darkness']],
    ['glasslight', 30, 60, ['prestidigitation', 'detect-magic', 'misty-step']],
    ['greenwake', 35, 60, ['druidcraft', 'longstrider', 'pass-without-trace']],
  ]) {
    const result = deriveLineage(feyTouched(heritage), 5);
    assert.equal(result.movement.walk, walk);
    assert.equal(result.senses.darkvision, darkvision);
    assert.deepEqual(result.spells.map(spell => spell.spellId), spells);
    assert.deepEqual(deriveLineage(feyTouched(heritage), 1).spells.map(spell => spell.modes), [['cantrip'], [], []]);
    assert.equal(result.pools.length, 2);
    assert.deepEqual(result.restModes, [{ id: 'waking-reverie', hours: 4, conscious: true }]);
    assert.equal(result.magicalSleepImmune, true);
    assert.deepEqual(result.trainedSkills, ['perception']);
    assert.deepEqual(result.saveAdvantages, [{ conditionId: 'charmed', when: ['avoid', 'end'] }]);
  }
  assert.deepEqual(deriveLineage(feyTouched('glasslight'), 1).spells[0].replacement,
    { timing: 'long-rest', spellLevel: 0, list: 'wizard' });
});

test('Beastshifter and Changeling retain their derived base bodies and Training', () => {
  assert.deepEqual(deriveLineage(beastshifter, 1).animalForms, {
    initialFormId: 'dock-rat', knownCount: 1, knownForms: ['dock-rat'],
  });
  assert.deepEqual(deriveLineage(beastshifter, 3, { knownForms: ['reef-fox', 'gray-wolf'] }).animalForms.knownForms,
    ['reef-fox', 'gray-wolf']);
  assert.deepEqual(deriveLineage(beastshifter, 1).trainedSkills, ['athletics']);
  const base = deriveLineage(changeling, 1);
  assert.equal(base.type, 'fey');
  assert.equal(base.size, 'medium');
  assert.deepEqual(base.trainedSkills, ['deception', 'persuasion']);
  const id = 'lineage:changelings:shapechange';
  const facts = { lineageId: 'changelings', level: 1, canTakeAction: true };
  assert.deepEqual(lineageActivationTerms(id, { ...facts, appearanceEligible: true, size: 'small', description: ' A deckhand ' }),
    { action: 'action', appearance: { size: 'small', description: 'A deckhand' } });
  assert.deepEqual(lineageActivationTerms(id, { ...facts, revert: true, disguised: true }),
    { action: 'action', appearance: null });
  assert.throws(() => lineageActivationTerms(id, { ...facts, appearanceEligible: true, size: 'large', description: 'A giant' }),
    { code: 'INVALID_APPEARANCE' });
});

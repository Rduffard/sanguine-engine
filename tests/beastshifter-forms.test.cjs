const { test } = require('node:test');
const assert = require('node:assert/strict');
const { beastshifterForms, beastshifterFormChoices, validateBeastshifterFormChoices, deriveBeastshifterForm,
  advanceBeastshifterForms, transitionBeastshifterHealth, lineageActivationTerms } =
  require('@crossworld/sanguine-engine/lineages');

const transform = 'lineage:beastshifters:transform';
const revert = 'lineage:beastshifters:revert';
const primalRecovery = 'lineage:beastshifters:primal-recovery';
const vitality = { health: { current: 12, max: 20 } };
const create = (formId = 'reef-fox') => advanceBeastshifterForms(undefined, { level: 1, learnFormId: formId });

function activate(traitId, state, facts = {}) {
  return lineageActivationTerms(traitId, {
    lineageId: 'beastshifters', level: 1, canTakeBonusAction: true, legalPlacement: true,
    pools: { [transform]: 2 }, formId: 'reef-fox', vitality, state, ...facts,
  });
}

function changeHealth(state, type, amount, options = {}) {
  return transitionBeastshifterHealth({ level: 1, vitality, ...options, state, event: { type, amount } });
}

test('each of the 13 forms has the expected entry tier, movement, Health, and Guard', () => {
  const expected = [
    ['dock-rat', 1, 25, 0, 0, 0, 3, 12],
    ['dune-hare', 1, 40, 0, 0, 0, 3, 13],
    ['reef-fox', 1, 30, 0, 0, 0, 4, 12],
    ['gray-wolf', 3, 40, 0, 0, 0, 6, 13],
    ['salt-antelope', 3, 50, 0, 0, 0, 6, 12],
    ['river-otter', 5, 20, 35, 0, 0, 5, 12],
    ['harbor-seal', 5, 10, 40, 0, 0, 7, 12],
    ['gull', 9, 15, 0, 40, 0, 4, 12],
    ['night-owl', 9, 10, 0, 35, 0, 5, 13],
    ['ironback-boar', 13, 35, 0, 0, 0, 9, 15],
    ['black-bear', 13, 35, 0, 0, 25, 9, 14],
    ['sea-eagle', 17, 10, 0, 50, 0, 7, 14],
    ['deepwater-dolphin', 17, 0, 50, 0, 0, 9, 13],
  ];
  assert.deepEqual(beastshifterForms.map(form => form.id), expected.map(([id]) => id));
  for (const [id, level, walk, swim, fly, climb, health, guard] of expected) {
    const form = deriveBeastshifterForm(id, level);
    assert.deepEqual(form.movement, { walk, swim, fly, climb });
    assert.equal(form.baseHealth, health);
    assert.equal(deriveBeastshifterForm(id, 20).maxHealth, health + 9);
    assert.equal(form.guard, guard);
    assert.equal(form.type, 'beast');
    assert.equal(form.equipmentMerged, true);
    assert.equal(form.canCast, false);
    assert.ok(Object.isFrozen(form.attack));
    if (level > 1) assert.throws(() => deriveBeastshifterForm(id, level - 1), { code: 'INELIGIBLE_FORM' });
  }
  assert.ok(Object.isFrozen(beastshifterForms[12].senseRequirements.blindsight));
  assert.equal(deriveBeastshifterForm('deepwater-dolphin', 17).breathHoldMinutes, 15);
  const wolf = deriveBeastshifterForm('gray-wolf', 3);
  assert.deepEqual(wolf.attributes, { might: 14, agility: 14, resolve: 12 });
  assert.deepEqual([wolf.attack.kind, wolf.attack.attackModifier, wolf.attack.dice, wolf.attack.damageModifier],
    ['natural', 4, '1d6', 2]);
  const eagle = deriveBeastshifterForm('sea-eagle', 17);
  assert.deepEqual([eagle.attack.attackModifier, eagle.attack.dice, eagle.attack.damageModifier], [9, '1d6', 3]);
});

test('animal Health scales with total level across the scouting and durable forms', () => {
  const levels = [1, 5, 9, 13, 17, 20];
  assert.deepEqual(levels.map(level => deriveBeastshifterForm('dock-rat', level).maxHealth), [3, 5, 7, 9, 11, 12]);
  assert.deepEqual(levels.map(level => deriveBeastshifterForm('reef-fox', level).maxHealth), [4, 6, 8, 10, 12, 13]);
  assert.equal(deriveBeastshifterForm('gray-wolf', 3).maxHealth, 7);
  assert.equal(deriveBeastshifterForm('harbor-seal', 5).maxHealth, 9);
  assert.equal(deriveBeastshifterForm('gull', 9).maxHealth, 8);
  assert.equal(deriveBeastshifterForm('black-bear', 13).maxHealth, 15);
  assert.equal(deriveBeastshifterForm('deepwater-dolphin', 17).maxHealth, 17);
});

test('one explicit form is added at each milestone, with ordinary levels preserving the known set', () => {
  const milestones = new Map([[1, 'dock-rat'], [3, 'gray-wolf'], [5, 'harbor-seal'], [9, 'night-owl'],
    [13, 'black-bear'], [17, 'sea-eagle']]);
  const expectedEligible = new Map([[1, 3], [3, 5], [5, 7], [9, 9], [13, 11], [17, 13]]);
  let forms = [];
  for (let level = 1; level <= 20; level++) {
    const choice = milestones.get(level);
    const descriptor = beastshifterFormChoices(level, forms);
    assert.equal(descriptor.milestone, Boolean(choice));
    assert.equal(descriptor.canReplace, Boolean(choice) && level > 1);
    assert.equal(descriptor.usesPerLongRest, level >= 9 ? 3 : 2);
    if (choice) assert.equal(descriptor.eligibleFormIds.length, expectedEligible.get(level) - forms.length);
    forms = validateBeastshifterFormChoices(forms, { level, ...(choice ? { learnFormId: choice } : {}) });
    assert.equal(forms.length, descriptor.knownCount);
  }
  assert.deepEqual(forms, [...milestones.values()]);
});

test('replacement is milestone-bound and cannot reuse a known, ineligible or simultaneous choice', () => {
  const previous = ['reef-fox'];
  const swap = (fromFormId, toFormId) => ({ level: 3, learnFormId: 'gray-wolf',
    replaceForm: { fromFormId, toFormId } });
  assert.deepEqual(validateBeastshifterFormChoices(previous, swap('reef-fox', 'dock-rat')), ['dock-rat', 'gray-wolf']);
  assert.throws(() => validateBeastshifterFormChoices(previous, { level: 2, learnFormId: 'gray-wolf' }),
    { code: 'UNEXPECTED_FORM_CHOICE' });
  assert.throws(() => validateBeastshifterFormChoices(previous, { level: 3 }), { code: 'INELIGIBLE_FORM' });
  for (const choice of ['reef-fox', 'gray-wolf', 'sea-eagle', 'unknown']) {
    assert.throws(() => validateBeastshifterFormChoices(previous, swap('reef-fox', choice)), { code: 'INELIGIBLE_FORM' });
  }
  assert.throws(() => validateBeastshifterFormChoices(previous, swap('dock-rat', 'dune-hare')),
    { code: 'INVALID_FORM_REPLACEMENT' });
  assert.throws(() => validateBeastshifterFormChoices(previous, { ...swap('reef-fox', 'dock-rat'), forged: true }),
    { code: 'INVALID_FORM_EVENT' });
});

test('replacement preserves dormant Health and initializes only genuinely new forms', () => {
  const active = activate(transform, create()).state;
  const injured = changeHealth(active, 'damage', 1).state;
  const levelThree = advanceBeastshifterForms(advanceBeastshifterForms(injured, { level: 2 }), {
    level: 3, learnFormId: 'gray-wolf', replaceForm: { fromFormId: 'reef-fox', toFormId: 'dock-rat' },
  });
  assert.equal(levelThree.activeFormId, null);
  assert.deepEqual(levelThree.knownFormIds, ['dock-rat', 'gray-wolf']);
  assert.deepEqual(levelThree.healthByForm, { 'reef-fox': 3, 'dock-rat': 4, 'gray-wolf': 7 });
  assert.throws(() => activate(transform, levelThree, { level: 3 }), { code: 'FORM_UNAVAILABLE' });
  const fifthLevel = { level: 5, learnFormId: 'harbor-seal', replaceForm: { fromFormId: 'dock-rat', toFormId: 'reef-fox' } };
  const levelFour = advanceBeastshifterForms(levelThree, { level: 4 });
  const relearned = advanceBeastshifterForms(levelFour, fifthLevel);
  assert.deepEqual(relearned.knownFormIds, ['reef-fox', 'gray-wolf', 'harbor-seal']);
  assert.deepEqual(relearned.healthByForm, { 'reef-fox': 3, 'dock-rat': 4, 'gray-wolf': 7, 'harbor-seal': 9 });
  assert.deepEqual(advanceBeastshifterForms(JSON.parse(JSON.stringify(levelFour)), fifthLevel), relearned);
  assert.equal(activate(transform, relearned, { level: 5 }).state.activeFormId, 'reef-fox');
  assert.equal(injured.healthByForm['reef-fox'], 3);
});

test('indefinite form survives serialization, ordinary advancement and regained uses without healing', () => {
  const terms = activate(transform, create());
  assert.equal(terms.duration, 'indefinite');
  assert.equal(terms.action, 'bonus-action');
  assert.deepEqual(terms.poolSpend, { poolId: transform, amount: 1 });
  assert.equal('deadline' in terms.state, false);
  const injured = changeHealth(terms.state, 'damage', 2).state;
  const restored = JSON.parse(JSON.stringify(injured));
  const advanced = advanceBeastshifterForms(advanceBeastshifterForms(restored, { level: 2 }),
    { level: 3, learnFormId: 'gray-wolf' });
  assert.equal(advanced.activeFormId, 'reef-fox');
  assert.deepEqual(advanced.healthByForm, { 'reef-fox': 2, 'gray-wolf': 7 });
  assert.equal(changeHealth(advanced, 'heal', 20, { level: 3 }).state.healthByForm['reef-fox'], 5);
  assert.throws(() => activate(transform, restored, { formId: 'dock-rat', pools: { [transform]: 2 } }),
    { code: 'FORM_ALREADY_ACTIVE' });
  const reverted = activate(revert, restored);
  assert.equal(reverted.action, 'bonus-action');
  assert.equal(reverted.poolSpend, undefined);
  assert.equal(reverted.state.activeFormId, null);
  assert.equal(activate(transform, reverted.state, { pools: { [transform]: 1 } }).state.healthByForm['reef-fox'], 2);
});

test('transform needs a legal, known form, an available use, and permission to take the Bonus Action', () => {
  const base = create();
  assert.throws(() => activate(transform, base, { legalPlacement: false }), { code: 'FORM_PLACEMENT_UNAVAILABLE' });
  assert.throws(() => activate(transform, base, { formId: 'dock-rat' }), { code: 'FORM_UNAVAILABLE' });
  assert.throws(() => activate(transform, base, { pools: { [transform]: 0 } }), { code: 'LINEAGE_USES_UNAVAILABLE' });
  assert.throws(() => activate(transform, base, { canTakeBonusAction: false }), { code: 'ACTION_UNAVAILABLE' });
  assert.throws(() => activate(transform, base, { vitality: { health: { current: 0, max: 20 } } }),
    { code: 'ACTION_UNAVAILABLE' });
  assert.deepEqual(base, create());
});

test('damage consumes Temporary Health once, then animal Health, then applies only overflow to humanoid vitality', () => {
  const active = activate(transform, create()).state;
  const shielded = { ...vitality, temporaryHealth: 2 };
  const absorbed = changeHealth(active, 'damage', 3, { vitality: shielded });
  assert.deepEqual(absorbed.vitalityPatch, { temporaryHealth: 0, absorbed: 2 });
  assert.equal(absorbed.state.healthByForm['reef-fox'], 3);
  const exact = changeHealth(active, 'damage', 6, { vitality: shielded });
  assert.equal(exact.state.activeFormId, null);
  assert.equal(exact.overflow, 0);
  assert.deepEqual(exact.vitalityPatch, { temporaryHealth: 0, absorbed: 2 });
  const broken = changeHealth(active, 'damage', 9, { vitality: shielded });
  assert.equal(broken.state.activeFormId, null);
  assert.equal(broken.state.healthByForm['reef-fox'], 0);
  assert.equal(broken.overflow, 3);
  assert.deepEqual(broken.vitalityPatch.health, { current: 9, max: 20 });
  assert.equal(broken.vitalityPatch.absorbed, 2);
  assert.equal(changeHealth(active, 'damage', 36).vitalityPatch.deathSaves.cause, 'massive-damage');
  assert.equal(shielded.temporaryHealth, 2);
});

test('death and authoritative effects can force reversion, while conditions alone block the action', () => {
  const active = activate(transform, create()).state;
  for (const conditionId of ['incapacitated', 'unconscious']) {
    const health = { ...vitality, conditions: [{ conditionId }] };
    assert.throws(() => activate(revert, active, { vitality: health }), { code: 'ACTION_UNAVAILABLE' });
    assert.equal(changeHealth(active, 'damage', 0, { vitality: health }).state.activeFormId, 'reef-fox');
  }
  for (const reason of ['death', 'effect']) {
    const result = transitionBeastshifterHealth({ level: 1, state: active, event: { type: 'force-revert', reason } });
    assert.equal(result.state.activeFormId, null);
    assert.equal(result.state.healthByForm['reef-fox'], 4);
  }
  assert.throws(() => transitionBeastshifterHealth({
    level: 1, state: active, event: { type: 'force-revert', reason: 'long-rest' },
  }), { code: 'INVALID_REVERSION_REASON' });
});

test('compatible healing routes exclusively to the current body and stops at its Health maximum', () => {
  const active = activate(transform, create()).state;
  const injured = changeHealth(active, 'damage', 3).state;
  const healing = changeHealth(injured, 'heal', 20);
  assert.deepEqual(healing.vitalityPatch, {});
  assert.equal(healing.state.healthByForm['reef-fox'], 4);
  const broken = changeHealth(active, 'damage', 4).state;
  const humanoidHealing = changeHealth(broken, 'heal', 2);
  assert.equal(humanoidHealing.vitalityPatch.health.current, 14);
  assert.equal(humanoidHealing.state.healthByForm['reef-fox'], 0);
});

test('Primal Recovery uses the supplied Calling die and active Resolve, with an atomic cost and capped healing', () => {
  const state = changeHealth(activate(transform, create()).state, 'damage', 3).state;
  const dice = { hitDie: 'd8', hitDice: { d8: 1 } };
  assert.deepEqual(activate(primalRecovery, state, dice), {
    action: 'bonus-action', hitDieSpend: { die: 'd8', amount: 1 }, sides: 8, resolveModifier: 1,
  });
  const recovery = activate(primalRecovery, state, { ...dice, roll: 1 });
  assert.equal(recovery.healed, 2);
  assert.equal(recovery.state.healthByForm['reef-fox'], 3);
  assert.equal(activate(primalRecovery, state, { ...dice, roll: 8 }).healed, 3);
  const hare = activate(transform, create('dune-hare'), { formId: 'dune-hare' }).state;
  const injuredHare = changeHealth(hare, 'damage', 2).state;
  assert.equal(activate(primalRecovery, injuredHare, { ...dice, roll: 1 }).healed, 1);
  assert.equal(dice.hitDice.d8, 1);
  assert.throws(() => activate(primalRecovery, state, { ...dice, roll: 9 }), { code: 'INVALID_HIT_DIE_ROLL' });
  assert.throws(() => activate(primalRecovery, state, { ...dice, hitDice: {} }), { code: 'HIT_DIE_UNAVAILABLE' });
  assert.throws(() => activate(primalRecovery, state, { ...dice, canTakeBonusAction: false }),
    { code: 'ACTION_UNAVAILABLE' });
  assert.throws(() => activate(primalRecovery, create(), dice), { code: 'FORM_RECOVERY_UNAVAILABLE' });
});

test('a depleted form stays at zero through replacement and can recover once per depletion in humanoid form', () => {
  const broken = changeHealth(activate(transform, create()).state, 'damage', 4).state;
  const levelTwo = advanceBeastshifterForms(broken, { level: 2 });
  const dormant = advanceBeastshifterForms(levelTwo, { level: 3, learnFormId: 'gray-wolf',
    replaceForm: { fromFormId: 'reef-fox', toFormId: 'dock-rat' } });
  const dice = { hitDie: 'd8', hitDice: { d8: 1 }, roll: 8 };
  assert.throws(() => activate(primalRecovery, dormant, { ...dice, level: 3 }), { code: 'FORM_RECOVERY_UNAVAILABLE' });

  const levelFour = advanceBeastshifterForms(dormant, { level: 4 });
  const known = advanceBeastshifterForms(levelFour, { level: 5, learnFormId: 'reef-fox' });
  assert.equal(known.healthByForm['reef-fox'], 0);
  assert.throws(() => activate(transform, known, { level: 5 }), { code: 'FORM_UNAVAILABLE' });
  assert.throws(() => activate(primalRecovery, known, { ...dice, level: 5, hitDice: { d8: 0 } }),
    { code: 'HIT_DIE_UNAVAILABLE' });
  const terms = activate(primalRecovery, known, { ...dice, level: 5 });
  assert.deepEqual(terms.hitDieSpend, { die: 'd8', amount: 1 });
  assert.equal(terms.action, 'bonus-action');
  assert.equal(terms.poolSpend, undefined);
  assert.equal(terms.state.activeFormId, null);
  assert.deepEqual(terms.state.healthByForm, { 'reef-fox': 6, 'dock-rat': 4, 'gray-wolf': 7 });
  assert.equal(activate(transform, terms.state, { level: 5 }).state.activeFormId, 'reef-fox');
  assert.throws(() => activate(primalRecovery, terms.state, { ...dice, level: 5 }), { code: 'FORM_RECOVERY_UNAVAILABLE' });
  assert.deepEqual(activate(primalRecovery, JSON.parse(JSON.stringify(known)), { ...dice, level: 5 }), terms);
});

test('forged form IDs cannot become known or enter the Health record', () => {
  const state = create();
  for (const formId of ['unknown', '__proto__', 'sea-eagle']) {
    assert.throws(() => create(formId), { code: 'INELIGIBLE_FORM' });
    assert.throws(() => activate(transform, state, { formId }), { code: 'FORM_UNAVAILABLE' });
    const forged = { ...state, healthByForm: { ...state.healthByForm, [formId]: 3 } };
    assert.throws(() => changeHealth(forged, 'heal', 2), { code: 'INVALID_ANIMAL_STATE' });
  }
});

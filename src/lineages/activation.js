const { calculateCheckModifier } = require('../core/attributes');
const { spendPool, ResourceTransitionError } = require('../resources');
const { trainingBonusForLevel } = require('../training');
const { capHealing, isIncapacitated } = require('../vitality');
const { traitId } = require('./definitions');
const { animalMaximumHealth, formAtLevel } = require('./animal-forms');
const { validateAnimalState, updateAnimalHealth, copyWithActiveForm } = require('./animal-health');
const { beastshifterFormChoices } = require('./form-progression');
const { freeze, requireRule } = require('./contracts');

const beastshifter = 'beastshifters';
const transform = traitId(beastshifter, 'transform');
const revert = traitId(beastshifter, 'revert');
const recovery = traitId(beastshifter, 'primal-recovery');
const listen = traitId('stoneborn', 'stone-listening');
const shapechange = traitId('changelings', 'shapechange');

function requireAction(facts, action) {
  const able = action === 'bonus-action' ? facts.canTakeBonusAction : facts.canTakeAction;
  // While transformed, current animal Health is the relevant vitality for acting.
  const animalHealth = facts.lineageId === beastshifter && facts.state?.activeFormId != null
    ? { current: facts.state.healthByForm?.[facts.state.activeFormId] } : facts.vitality?.health;
  requireRule(able === true && !isIncapacitated({ ...facts.vitality, health: animalHealth }),
    'ACTION_UNAVAILABLE', 'action');
}

function lineagePoolSpend(facts, poolId, max) {
  const cost = { poolId, amount: 1 };
  try {
    spendPool(facts.pools ?? {}, { [poolId]: { max } }, cost);
  } catch (error) {
    if (!(error instanceof ResourceTransitionError)) throw error;
    requireRule(false, 'LINEAGE_USES_UNAVAILABLE', 'pools');
  }
  return cost;
}

function lineageActivationTerms(id, facts) {
  const training = trainingBonusForLevel(facts.level);
  const action = id === shapechange ? 'action' : 'bonus-action';
  const lineage = id === listen ? 'stoneborn' : id === shapechange ? 'changelings' : beastshifter;
  requireRule([transform, revert, recovery, listen, shapechange].includes(id), 'UNKNOWN_LINEAGE_TRAIT', 'id');
  requireRule(facts.lineageId === lineage, 'LINEAGE_TRAIT_UNAVAILABLE', 'lineageId');
  requireAction(facts, action);

  if (id === listen) {
    return freeze({ action, poolSpend: lineagePoolSpend(facts, listen, training),
      effect: { durationMinutes: 10, sense: 'tremorsense', range: 60,
        requiresStoneContact: true, sharedSurface: true, movementRequired: true, countsAsSight: false } });
  }
  if (id === shapechange) {
    if (facts.revert === true) {
      requireRule(facts.disguised === true, 'NO_ACTIVE_DISGUISE', 'disguised');
      return freeze({ action, appearance: null });
    }
    requireRule(['small', 'medium'].includes(facts.size) && facts.appearanceEligible === true &&
      typeof facts.description === 'string' && facts.description.trim().length > 0 &&
      facts.description.length <= 500, 'INVALID_APPEARANCE', 'appearance');
    return freeze({ action, appearance: { size: facts.size, description: facts.description.trim() } });
  }

  const { state, level } = facts;
  validateAnimalState(state, level);
  const { activeFormId, knownFormIds, healthByForm } = state;
  if (id === transform) {
    requireRule(activeFormId === null, 'FORM_ALREADY_ACTIVE', 'state.activeFormId');
    requireRule(knownFormIds.includes(facts.formId) && healthByForm[facts.formId] > 0,
      'FORM_UNAVAILABLE', 'formId');
    requireRule(facts.legalPlacement === true, 'FORM_PLACEMENT_UNAVAILABLE', 'legalPlacement');
    const maximum = beastshifterFormChoices(level).usesPerLongRest;
    return freeze({ action, poolSpend: lineagePoolSpend(facts, transform, maximum), duration: 'indefinite',
      state: copyWithActiveForm(state, facts.formId) });
  }

  if (id === revert) {
    requireRule(activeFormId !== null, 'NO_ACTIVE_FORM', 'state.activeFormId');
    return freeze({ action, state: copyWithActiveForm(state, null) });
  }

  const formId = activeFormId ?? facts.formId;
  requireRule(activeFormId !== null || (knownFormIds.includes(formId) && healthByForm[formId] === 0),
    'FORM_RECOVERY_UNAVAILABLE', 'formId');
  const form = formAtLevel(formId, level);
  const maxHealth = animalMaximumHealth(form, level);
  const before = healthByForm[formId];

  const { hitDie, hitDice, roll } = facts;
  requireRule(typeof hitDie === 'string' && /^d(?:6|8|10|12)$/.test(hitDie) &&
    Number.isSafeInteger(hitDice?.[hitDie]) && hitDice[hitDie] > 0, 'HIT_DIE_UNAVAILABLE', 'hitDie');
  const sides = Number(hitDie.slice(1));
  const resolveModifier = calculateCheckModifier(form.attributes, 'resolve');
  const terms = { action, hitDieSpend: { die: hitDie, amount: 1 }, sides, resolveModifier };
  if (roll === undefined) return freeze(terms);
  requireRule(Number.isSafeInteger(roll) && roll > 0 && roll <= sides, 'INVALID_HIT_DIE_ROLL', 'roll');
  const after = capHealing(before, maxHealth, Math.max(1, roll + resolveModifier));
  return freeze({ ...terms, healed: after - before, state: updateAnimalHealth(state, formId, after) });
}

module.exports = { lineageActivationTerms };

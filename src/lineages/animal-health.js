const { applyVitalityDamage, capHealing, healVitality } = require('../vitality');
const { absorbTemporaryHealth } = require('../vitality/temporary-health');
const { trainingBonusForLevel } = require('../training');
const { animalMaximumHealth, formAtLevel } = require('./animal-forms');
const { validKnownForms, validateBeastshifterFormChoices } = require('./form-progression');
const { freeze, hasOnlyKeys, isRecord, requireRule } = require('./contracts');

const emptyState = freeze({ activeFormId: null, knownFormIds: [], healthByForm: {} });

function validateAnimalState(state, level) {
  requireRule(hasOnlyKeys(state, ['activeFormId', 'knownFormIds', 'healthByForm']) &&
    isRecord(state.healthByForm), 'INVALID_ANIMAL_STATE', 'state');
  const { activeFormId, knownFormIds, healthByForm } = state;
  requireRule(validKnownForms(knownFormIds, level) &&
    knownFormIds.every(id => Object.hasOwn(healthByForm, id)) &&
    Object.entries(healthByForm).every(([id, health]) => {
      const form = formAtLevel(id, level);
      return form && Number.isSafeInteger(health) && health >= 0 &&
        health <= animalMaximumHealth(form, level);
    }) && (activeFormId === null || (knownFormIds.includes(activeFormId) && healthByForm[activeFormId] > 0)),
  'INVALID_ANIMAL_STATE', 'state');
}

function advanceBeastshifterForms(previousState, event) {
  if (previousState === undefined) {
    requireRule(event?.level === 1, 'INVALID_ANIMAL_STATE', 'state');
    previousState = emptyState;
  } else {
    requireRule(event?.level > 1, 'INVALID_FORM_EVENT', 'level');
    validateAnimalState(previousState, event.level - 1);
  }
  const { healthByForm, knownFormIds, activeFormId } = previousState;
  const nextKnown = validateBeastshifterFormChoices(knownFormIds, event);
  const recordedIds = new Set([...Object.keys(healthByForm), ...nextKnown]);
  const nextHealth = Object.fromEntries([...recordedIds].map(id => {
    const maxHealth = animalMaximumHealth(formAtLevel(id, event.level), event.level);
    return [id, Math.min(healthByForm[id] ?? maxHealth, maxHealth)];
  }));
  return freeze({
    activeFormId: nextKnown.includes(activeFormId) ? activeFormId : null,
    knownFormIds: nextKnown,
    healthByForm: nextHealth,
  });
}

function updateAnimalHealth(state, formId, current) {
  return freeze({
    activeFormId: current === 0 && state.activeFormId === formId ? null : state.activeFormId,
    healthByForm: { ...state.healthByForm, [formId]: current },
    knownFormIds: [...state.knownFormIds],
  });
}

function transitionBeastshifterHealth({ level, state, vitality, event }) {
  trainingBonusForLevel(level);
  validateAnimalState(state, level);
  requireRule(isRecord(event), 'INVALID_ANIMAL_EVENT', 'event');
  const { activeFormId } = state;
  if (event.type === 'force-revert') {
    requireRule(hasOnlyKeys(event, ['type', 'reason']) && ['death', 'effect'].includes(event.reason), 'INVALID_REVERSION_REASON', 'event.reason');
    return { state: activeFormId === null ? state : copyWithActiveForm(state, null), vitalityPatch: {} };
  }

  requireRule(event.type === 'damage' || event.type === 'heal', 'INVALID_ANIMAL_EVENT', 'event.type');
  const allowed = event.type === 'damage' ? ['type', 'amount', 'critical'] : ['type', 'amount'];
  requireRule(hasOnlyKeys(event, allowed) && (event.critical === undefined || typeof event.critical === 'boolean'),
    'INVALID_ANIMAL_EVENT', 'event');
  const { amount } = event;
  requireRule(Number.isSafeInteger(amount) && amount >= 0, 'INVALID_HEALTH_AMOUNT', 'event.amount');
  if (event.type === 'heal') {
    if (activeFormId === null || vitality.deathSaves?.dead) {
      return { state, vitalityPatch: healVitality(vitality, amount) };
    }
    const maxHealth = animalMaximumHealth(formAtLevel(activeFormId, level), level);
    const current = capHealing(state.healthByForm[activeFormId], maxHealth, amount);
    return { state: updateAnimalHealth(state, activeFormId, current), vitalityPatch: {} };
  }

  if (activeFormId === null) {
    return { state, vitalityPatch: applyVitalityDamage(vitality, amount, event.critical), overflow: 0 };
  }

  const { absorbed, remaining } = absorbTemporaryHealth(vitality.temporaryHealth, amount);
  const animalHealth = state.healthByForm[activeFormId];
  const damage = amount - absorbed;
  const overflow = Math.max(0, damage - animalHealth);
  const current = Math.max(0, animalHealth - damage);
  const vitalityPatch = overflow > 0
    ? { ...applyVitalityDamage({ ...vitality, temporaryHealth: remaining }, overflow, event.critical), absorbed }
    : absorbed > 0 ? { temporaryHealth: remaining, absorbed } : {};
  return { state: updateAnimalHealth(state, activeFormId, current), vitalityPatch, overflow };
}

function copyWithActiveForm(state, activeFormId) {
  return freeze({ activeFormId, knownFormIds: [...state.knownFormIds], healthByForm: { ...state.healthByForm } });
}

module.exports = { advanceBeastshifterForms, transitionBeastshifterHealth,
  validateAnimalState, updateAnimalHealth, copyWithActiveForm };

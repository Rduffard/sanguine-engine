const { grayNetRestSelection } = require('../callings/navigator/paths/gray-net');

class PreparationReconciliationError extends Error {
  constructor(code, field, spellId) {
    super(code === 'INELIGIBLE_PREPARATION'
      ? 'Reconciled spell is ineligible for preparation'
      : 'Invalid preparation reconciliation input');
    this.name = 'PreparationReconciliationError';
    this.code = code;
    this.field = field;
    this.spellId = spellId;
  }
}

function validateIds(ids, field) {
  if (!Array.isArray(ids)) throw new PreparationReconciliationError('INVALID_PREPARATION_RECONCILIATION', field);
  for (const id of ids) {
    if (typeof id !== 'string' || !id.trim() || id !== id.trim()) {
      throw new PreparationReconciliationError('INVALID_PREPARATION_RECONCILIATION', field);
    }
  }
}

function reconcilePreparations(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new PreparationReconciliationError('INVALID_PREPARATION_RECONCILIATION');
  }
  const { saved, additions, replayed, alwaysPrepared, eligible, capacity } = input;
  if (!Number.isSafeInteger(capacity) || capacity < 0) {
    throw new PreparationReconciliationError('INVALID_PREPARATION_RECONCILIATION', 'capacity');
  }
  for (const [field, ids] of Object.entries({ saved, additions, replayed, alwaysPrepared, eligible })) {
    validateIds(ids, field);
  }

  const always = new Set(alwaysPrepared);
  const prepared = [...new Set([...saved, ...additions, ...replayed])]
    .filter(id => !always.has(id)).slice(0, capacity);
  if (prepared.length !== capacity) throw new PreparationReconciliationError('INVALID_PREPARATION_RECONCILIATION', 'capacity');
  const eligibleIds = new Set(eligible);
  const rejected = prepared.find(id => !eligibleIds.has(id));
  if (rejected !== undefined) throw new PreparationReconciliationError('INELIGIBLE_PREPARATION', undefined, rejected);
  return prepared;
}

exports.PreparationReconciliationError = PreparationReconciliationError;
exports.reconcilePreparations = reconcilePreparations;

function restPreparationError({ kind, callingId, shipwrightLevel, previous, selected }) {
  const changed = selected.filter(id => !previous.includes(id)).length;
  if (kind === 'short-rest') {
    if (!canMemorizeOnShortRest(callingId, shipwrightLevel) || changed > 1) {
      return 'Memorize Spell requires Shipwright level five and replaces one spell';
    }
  } else if (callingId === 'tidecaller' || (['warden', 'navigator'].includes(callingId) && changed > 1)) {
    return 'Calling preparation replacement limit exceeded';
  }
  return null;
}

exports.restPreparationError = restPreparationError;

function cantripAdvancementEligible(callingId, level, previous, selected, capacity) {
  const replacements = level > 1 && callingId !== 'shipwright' ? 1 : 0;
  return !selected.length || selected.filter(id => !previous.includes(id)).length <= capacity - previous.length + replacements;
}

function preparedAdvancementEligible(callingId, previous, selected, alwaysPrepared, capacity) {
  if (callingId !== 'tidecaller' || !previous || !selected.length) return true;
  const retainedCapacity = previous.filter(id => !alwaysPrepared.includes(id)).length;
  return selected.filter(id => !previous.includes(id)).length <= Math.max(0, capacity - retainedCapacity) + 1;
}

exports.cantripAdvancementEligible = cantripAdvancementEligible;
exports.preparedAdvancementEligible = preparedAdvancementEligible;

function spellPreparationEligible(callingId, spell, casting) {
  return Boolean(spell && !casting.alwaysPrepared.includes(spell.id) && spell.callings.includes(callingId) &&
    spell.level >= 1 && spell.level <= casting.slots.length &&
    (callingId !== 'shipwright' || casting.folio.includes(spell.id) || casting.memorized?.includes(spell.id)));
}

function canMemorizeOnShortRest(callingId, shipwrightLevel) {
  return callingId === 'shipwright' && shipwrightLevel >= 5;
}

exports.spellPreparationEligible = spellPreparationEligible;
exports.canMemorizeOnShortRest = canMemorizeOnShortRest;

function restSelectionTerms(calling, path, key, kind) {
  const grayNet = grayNetRestSelection(path, key);
  if (kind !== 'long-rest' && !grayNet) return { error: 'These replacements require a Long Rest' };
  if (key === 'cantrips' && calling !== 'shipwright') return { error: 'Cantrip replacement requires a Calling level' };
  return { grayNet };
}

exports.restSelectionTerms = restSelectionTerms;

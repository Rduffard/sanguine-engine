const { trainingBonusForLevel } = require('../training');
const { beastshifterForms, formAtLevel } = require('./animal-forms');
const { freeze, hasOnlyKeys, requireRule } = require('./contracts');

const milestones = freeze([1, 3, 5, 9, 13, 17]);

function milestoneCount(level) {
  return milestones.filter(milestone => milestone <= level).length;
}

function validKnownForms(ids, level, count = milestoneCount(level)) {
  return Array.isArray(ids) && ids.length === count && new Set(ids).size === count &&
    [...ids].every(id => formAtLevel(id, level));
}

function beastshifterFormChoices(level, learnedForms = []) {
  trainingBonusForLevel(level);
  requireRule(Array.isArray(learnedForms) && validKnownForms(learnedForms, level, learnedForms.length) &&
    learnedForms.length <= milestoneCount(level), 'INVALID_KNOWN_FORMS', 'learnedForms');
  return freeze({
    knownCount: milestoneCount(level),
    milestone: milestones.includes(level),
    canReplace: level > 1 && milestones.includes(level),
    usesPerLongRest: level >= 9 ? 3 : 2,
    eligibleFormIds: beastshifterForms
      .filter(form => form.level <= level && !learnedForms.includes(form.id)).map(form => form.id),
  });
}

function validateBeastshifterFormChoices(previous, event) {
  requireRule(hasOnlyKeys(event, ['level', 'learnFormId', 'replaceForm']), 'INVALID_FORM_EVENT', 'event');
  const { level, learnFormId, replaceForm } = event;
  trainingBonusForLevel(level);
  const milestone = milestones.includes(level);
  requireRule(validKnownForms(previous, level - 1), 'INVALID_KNOWN_FORMS', 'previous');
  if (!milestone) {
    requireRule(!Object.hasOwn(event, 'learnFormId') && !Object.hasOwn(event, 'replaceForm'),
      'UNEXPECTED_FORM_CHOICE', 'event');
    return freeze([...previous]);
  }

  requireRule(formAtLevel(learnFormId, level) && !previous.includes(learnFormId),
    'INELIGIBLE_FORM', 'learnFormId');
  if (!Object.hasOwn(event, 'replaceForm')) return freeze([...previous, learnFormId]);

  requireRule(level > 1 && hasOnlyKeys(replaceForm, ['fromFormId', 'toFormId']) &&
    previous.includes(replaceForm.fromFormId), 'INVALID_FORM_REPLACEMENT', 'replaceForm.fromFormId');
  const { fromFormId, toFormId } = replaceForm;
  requireRule(formAtLevel(toFormId, level) && !previous.includes(toFormId) && toFormId !== learnFormId,
    'INELIGIBLE_FORM', 'replaceForm.toFormId');
  return freeze([...previous.map(id => id === fromFormId ? toFormId : id), learnFormId]);
}

module.exports = { milestones, beastshifterFormChoices, validateBeastshifterFormChoices, validKnownForms };

const { attributeModifier } = require('../core/attributes');

const INVALID_PATH_RESOURCE_CAPACITY = 'INVALID_PATH_RESOURCE_CAPACITY';

class ProgressionInputError extends Error {
  constructor(field, code = 'INVALID_VITALITY_PROGRESSION') {
    const mechanic = code === INVALID_PATH_RESOURCE_CAPACITY ? 'Path resource capacity' : 'vitality progression';
    super('Invalid ' + mechanic + ' input: ' + field);
    this.name = 'ProgressionInputError';
    this.code = code;
    this.field = field;
  }
}

function deriveVitalityProgression(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new ProgressionInputError('input');
  const { level, hitDie, resolve, bonusHealth = 0 } = input;
  if (!Number.isSafeInteger(level) || level < 1 || level > 20) throw new ProgressionInputError('level');
  if (![6, 8, 10, 12].includes(hitDie)) throw new ProgressionInputError('hitDie');
  if (!Number.isSafeInteger(resolve) || resolve < 1 || resolve > 30) throw new ProgressionInputError('resolve');
  if (!Number.isSafeInteger(bonusHealth) || bonusHealth < 0) throw new ProgressionInputError('bonusHealth');

  const modifier = attributeModifier(resolve);
  const firstGain = Math.max(1, hitDie + modifier);
  const laterGain = Math.max(1, hitDie / 2 + 1 + modifier);
  const max = firstGain + (level - 1) * laterGain + bonusHealth;
  if (!Number.isSafeInteger(max)) throw new ProgressionInputError('bonusHealth');
  return { health: { max }, hitDice: { [`d${hitDie}`]: level } };
}

function derivePathResourceCapacity(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ProgressionInputError('input', INVALID_PATH_RESOURCE_CAPACITY);
  }
  for (const field of ['level', 'unlockLevel']) {
    const level = input[field];
    if (!Number.isSafeInteger(level) || level < 1 || level > 20) {
      throw new ProgressionInputError(field, INVALID_PATH_RESOURCE_CAPACITY);
    }
  }
  const { level, unlockLevel } = input;
  return level < unlockLevel ? 0 : 2 + Math.floor((level - unlockLevel) / 4);
}

exports.ProgressionInputError = ProgressionInputError;
exports.deriveVitalityProgression = deriveVitalityProgression;
exports.derivePathResourceCapacity = derivePathResourceCapacity;

exports.advancementMovement = require('./movement').advancementMovement;
exports.maximumCharacterLevel = 20;

function reconcileHealthOnAdvance(current, previousMaximum, maximum) {
  return Math.max(0, Math.min(maximum, current + Math.max(0, maximum - previousMaximum)));
}

function reconcileHealthOnRebuild(current, maximum) {
  return Math.min(current, maximum);
}

exports.reconcileHealthOnAdvance = reconcileHealthOnAdvance;
exports.reconcileHealthOnRebuild = reconcileHealthOnRebuild;
Object.assign(module.exports, require('./creation'));
Object.assign(module.exports, require('./backgrounds'));

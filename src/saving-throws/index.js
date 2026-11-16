const { attributeModifier } = require('../core/attributes');
const { trainingContribution } = require('../training');

function baseSavingThrowModifier({ score, trained, trainingBonus, auraBonus = 0 }) {
  return attributeModifier(score) + trainingContribution(trainingBonus, { trained }) + auraBonus;
}

function exhaustionD20Penalty(level) {
  return 2 * level;
}

function projectSavingThrowModifiers(base, { suppressedAura = 0, exhaustion = 0, equipmentBonus = 0 }) {
  const penalty = exhaustionD20Penalty(exhaustion);
  return Object.fromEntries(Object.entries(base).map(([id, modifier]) => [
    id, modifier - suppressedAura - penalty + equipmentBonus,
  ]));
}

exports.baseSavingThrowModifier = baseSavingThrowModifier;
exports.exhaustionD20Penalty = exhaustionD20Penalty;
exports.projectSavingThrowModifiers = projectSavingThrowModifiers;

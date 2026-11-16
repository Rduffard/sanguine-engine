const { attributeModifier } = require('../core/attributes');

function spellCastingNumbers(score, trainingBonus = 0) {
  const modifier = attributeModifier(score);
  return { modifier, saveDC: 8 + modifier + trainingBonus, attackModifier: modifier + trainingBonus };
}

module.exports = { spellCastingNumbers };

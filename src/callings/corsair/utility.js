function steadyAimEffect(movementFeet, alreadyUsed) {
  if ((movementFeet ?? 0) > 0 || alreadyUsed) return null;
  return { steadyAim: true, nextAttackAdvantage: true, uncancelable: true };
}

const fastHandsTaskModes = Object.freeze(['lock', 'trap', 'pocket']);

function fastHandsCheck(mode) {
  if (!fastHandsTaskModes.includes(mode)) return null;
  return { skillId: 'sleight-of-hand', toolId: mode === 'pocket' ? undefined : 'thieves-tools' };
}

function steadyAimAttackBenefit() {
  return { attackAdvantage: true, speedRemainsZero: true };
}

function disengageEffect() {
  return { noOpportunityAttacksForMovement: true };
}

module.exports = { steadyAimEffect, steadyAimAttackBenefit, disengageEffect, fastHandsCheck, fastHandsTaskModes };

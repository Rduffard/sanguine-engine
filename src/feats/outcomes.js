function savageAttackerOutcome(rolls, weapon, grip, fightingStyles) {
  const greatWeaponFighting = fightingStyles.includes('great-weapon-fighting') &&
    weapon.type === 'melee' && grip === 'two' && (weapon.hands === 2 || weapon.versatileDamage);
  const totals = rolls.map(dice => dice.reduce((sum, die) => sum + (greatWeaponFighting ? Math.max(3, die) : die), 0));
  return { rolls, totals, weaponDiceTotal: Math.max(...totals) };
}

function improveFateOutcome(rolls, sign, originalTotal) {
  const adjustment = rolls.reduce((sum, die) => sum + die, 0) * (sign === 'bonus' ? 1 : -1);
  return { rolls, adjustment, total: originalTotal + adjustment };
}

function harborDefenderOutcome(incomingDamage, trainingBonus) {
  const damageReduction = Math.min(incomingDamage, trainingBonus);
  return { damageReduction, remainingDamage: incomingDamage - damageReduction };
}

function punchAndGrabOutcome(trainingBonus, mightModifier) {
  return { save: ['might', 'agility'], dc: 8 + trainingBonus + mightModifier, alsoDamage: true };
}

function initiativeOutcome(rolls, modifier, corsairPath, corsairLevel) {
  const roll = Math.max(...rolls);
  return {
    roll,
    rolls,
    total: roll + modifier,
    ...(corsairPath === 'reef-knife' && corsairLevel >= 17 ? { firstRoundExtraTurnOffset: -10 } : {}),
  };
}

function firstRoundExtraTurnTotal({ total, firstRoundExtraTurnOffset }) {
  return total + firstRoundExtraTurnOffset;
}

const dimensionalTravelMaximumFeet = 30;
const dimensionalTravelActions = Object.freeze(['attack', 'magic']);
const improveFateDice = Object.freeze({ count: 2, sides: 4 });
const improveFateSigns = Object.freeze(['bonus', 'penalty']);
const savageAttackerRollSets = 2;

function overwhelmingStrikeOutcome(sourceScore, damageType) {
  return { extraDamage: sourceScore, damageType, ignoresPhysicalResistance: true };
}

function fieldResponderOutcome() {
  return { stabilize: true, requireZeroHealth: true };
}

function peerlessAimOutcome() {
  return { hitInstead: true, naturalTwenty: false };
}

function featUseRecoversOnInitiativeOrRest(featId) {
  return featId === 'boon-of-fate';
}

function dimensionalTravelEligible(action, distance) {
  return dimensionalTravelActions.includes(action) &&
    Number.isSafeInteger(distance) && distance >= 0 && distance <= dimensionalTravelMaximumFeet;
}

module.exports = { savageAttackerOutcome, improveFateOutcome, harborDefenderOutcome, punchAndGrabOutcome, initiativeOutcome,
  firstRoundExtraTurnTotal,
  dimensionalTravelMaximumFeet, dimensionalTravelActions, dimensionalTravelEligible, improveFateDice, improveFateSigns, peerlessAimOutcome,
  featUseRecoversOnInitiativeOrRest, savageAttackerRollSets, overwhelmingStrikeOutcome, fieldResponderOutcome };

function potentSpellcastingVitality(clinicalModifier) {
  return Math.max(0, 2 * clinicalModifier);
}

exports.potentSpellcastingVitality = potentSpellcastingVitality;

function divineInterventionEligible(spell, level) {
  return level >= 10 && !spell.castingTime.startsWith('Reaction') &&
    (spell.callings.includes('doctor') && spell.level <= 5 || spell.id === 'wish' && wishInterventionUnlocked(level));
}

function wishInterventionUnlocked(level) {
  return level === 20;
}

function searUndeadUnlocked(level) {
  return level >= 5;
}

exports.divineInterventionEligible = divineInterventionEligible;
exports.wishInterventionUnlocked = wishInterventionUnlocked;
exports.searUndeadUnlocked = searUndeadUnlocked;

function divineStrikeDice(level) {
  return level >= 14 ? 2 : 1;
}

exports.divineStrikeDice = divineStrikeDice;

function wishCooldownRests(rolls) {
  return rolls[0] + rolls[1];
}

const wishCooldownDice = Object.freeze({ count: 2, sides: 4 });

function divineInterventionAvailable(uses, longRestsRemaining) {
  return uses > 0 && !(longRestsRemaining > 0);
}

function wishCooldownStateEligible(level, { rolls, longRestsRemaining }) {
  return wishInterventionUnlocked(level) && Array.isArray(rolls) && rolls.length === wishCooldownDice.count &&
    rolls.every(roll => Number.isSafeInteger(roll) && roll >= 1 && roll <= wishCooldownDice.sides) &&
    Number.isSafeInteger(longRestsRemaining) && longRestsRemaining >= 0 && longRestsRemaining <= wishCooldownRests(rolls);
}

function recoverWishCooldown(remaining, restKind) {
  return restKind === 'long-rest' && remaining > 0 ? remaining - 1 : remaining;
}

exports.wishCooldownRests = wishCooldownRests;
exports.wishCooldownDice = wishCooldownDice;
exports.divineInterventionAvailable = divineInterventionAvailable;
exports.wishCooldownStateEligible = wishCooldownStateEligible;
exports.recoverWishCooldown = recoverWishCooldown;

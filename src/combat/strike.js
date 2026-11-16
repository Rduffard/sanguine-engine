function cunningStrikeDice(sneakAttackDice, options) {
  const cost = options.reduce((sum, option) => sum + option.cost, 0);
  return { cost, diceCount: sneakAttackDice - cost };
}

function strikeRollCount(diceCount, hit, critical) {
  return hit === false ? 0 : diceCount * (critical ? 2 : 1);
}

function strikeSaveDC(trainingBonus, agilityModifier) {
  return 8 + trainingBonus + agilityModifier;
}

function strikeProfile(kind, level) {
  const cunning = kind === 'cunning';
  return {
    unlocked: level >= (cunning ? 1 : 9),
    optionLimit: level >= (cunning ? 11 : 17) ? 2 : 1,
    dieSides: cunning ? 6 : 10,
    brutalDice: level >= 17 ? 2 : 1,
  };
}

function strikePreviewDice(diceCount, critical) {
  return strikeRollCount(Math.max(0, diceCount), true, critical);
}

const strikeTargetSizes = Object.freeze(['tiny', 'small', 'medium', 'large', 'huge', 'gargantuan']);

function tripTargetEligible(size) {
  const rank = strikeTargetSizes.indexOf(size);
  return rank >= 0 && rank <= strikeTargetSizes.indexOf('large');
}

function sneakAttackWeaponEligible(weapon, disadvantage) {
  return Boolean(weapon && disadvantage !== true &&
    (weapon.type === 'ranged' || weapon.properties.some(property => property.id === 'finesse')));
}

function brutalStrikeEligible({ reckless, disadvantage, attack }) {
  return reckless === true && disadvantage !== true &&
    (!attack || attack.allowedAttributes.includes('might') && !attack.heavyDisadvantage);
}

module.exports = { cunningStrikeDice, strikeRollCount, strikeSaveDC, strikeProfile, strikePreviewDice, strikeTargetSizes,
  tripTargetEligible, sneakAttackWeaponEligible, brutalStrikeEligible, ...require('./strike-options') };

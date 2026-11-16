function armorRestrictions(armor, shield, shieldTrained, untrainedArmor, progression) {
  const { attributes, paths, callingLevels, raging, reefSkinSuppressed } = progression;
  let speedPenaltyFeet = armor?.mightRequirement && attributes.might < armor.mightRequirement ? 10 : 0;
  if (paths.reaver === 'reef-colossus' && callingLevels.reaver >= 6 && raging && !reefSkinSuppressed && armor?.category !== 'heavy') {
    speedPenaltyFeet += 5;
  }
  if (paths.gunslinger === 'brass-outrider' && callingLevels.gunslinger >= 7 && armor?.category === 'heavy') {
    speedPenaltyFeet += 10;
  }
  return {
    untrainedArmor,
    untrainedShield: shield && !shieldTrained,
    physicalD20Disadvantage: untrainedArmor,
    spellcastingBlocked: untrainedArmor,
    stealthDisadvantage: armor?.stealthDisadvantage ?? false,
    speedPenaltyFeet,
    pending: ['movement-speed', 'donning-doffing-time', 'spellcasting'],
  };
}

exports.armorRestrictions = armorRestrictions;

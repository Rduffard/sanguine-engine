function preserveLife(level) {
  return { maximumHealing: 5 * level, healingCapFraction: 0.5 };
}

exports.preserveLife = preserveLife;

function sanctuaryHealingFeatures(doctorLevel, spellLevel, usedSlot) {
  return {
    maximumHealingDice: doctorLevel >= 17,
    additionalHealingOnCastingTurn: usedSlot ? 2 + spellLevel : 0,
    blessedHealerEligible: usedSlot && doctorLevel >= 6,
  };
}

exports.sanctuaryHealingFeatures = sanctuaryHealingFeatures;

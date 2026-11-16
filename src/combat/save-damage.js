function halveDamage(damage) {
  return Math.floor(damage / 2);
}

function damageOnSuccessfulSave(damage, outcome) {
  return outcome === 'half' ? halveDamage(damage) : 0;
}

function halfDamageOutcome(damage) {
  const remainingDamage = halveDamage(damage);
  return { remainingDamage, damageReduction: damage - remainingDamage };
}

exports.damageOnSuccessfulSave = damageOnSuccessfulSave;
exports.halveDamage = halveDamage;
exports.halfDamageOutcome = halfDamageOutcome;

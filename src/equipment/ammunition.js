function ammunitionMatches(weapon, ammunition) {
  return Boolean(weapon?.ammunitionType && ammunition && ammunition.kind !== 'weapon' &&
    ammunition.ammunitionType === weapon.ammunitionType);
}

function ammunitionActionOutcome({ shots, actionType, attacksPerAction, total, weaponTotal, weapon, feats, available }) {
  const maximum = actionType === 'attack' ? attacksPerAction : 1;
  const ignoresLoading = feats.includes('powder-drill') && ['pistol', 'musket'].includes(weapon.id);
  const usedTotal = total + shots;
  const usedWeapon = weaponTotal + shots;
  if (usedTotal > maximum || weapon.loading && !ignoresLoading && usedWeapon > 1) {
    return { error: 'Extra Attack and Loading limits exceeded for this action' };
  }
  if (available < shots) return { error: 'Insufficient ammunition' };
  return { usedTotal, usedWeapon, remaining: available - shots };
}

function loadingHandAvailable(weaponHands, heldCount) {
  return weaponHands !== 1 || heldCount <= 1;
}

module.exports = { ammunitionMatches, ammunitionActionOutcome, loadingHandAvailable };

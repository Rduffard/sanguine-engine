function aetherRelay(level, discipline) {
  return {
    capacity: level >= 14 ? 2 : 1,
    guard: 15,
    maximumHealth: 2 * level,
    immunities: ['poison', 'psychic'],
    mobile: discipline === 'mobile',
    sizeFeet: 1,
    movementFeet: 15,
  };
}

exports.aetherRelay = aetherRelay;

function twinCircuitUnlocked(level, spellLevel) {
  return level >= 14 && spellLevel >= 1;
}

exports.twinCircuitUnlocked = twinCircuitUnlocked;

function relayCastingEligible(callingId, path, initiate) {
  return !initiate && callingId === 'shipwright' && path === 'sparkwrite-aetherist';
}

function relayCantripEligible(spellLevel) {
  return spellLevel === 0;
}

exports.relayCastingEligible = relayCastingEligible;
exports.relayCantripEligible = relayCantripEligible;

function relayDefenseBenefits(path, level, nearActiveRelay) {
  if (path !== 'sparkwrite-aetherist' || !(level >= 6) || !nearActiveRelay) return null;
  return { resistance: 'lightning', concentrationSaveAdvantage: true };
}

exports.relayDefenseBenefits = relayDefenseBenefits;

function relayDischargeTerms() {
  return { damageType: 'lightning', radiusFeet: 10, successfulSave: 'half' };
}

exports.relayDischargeTerms = relayDischargeTerms;

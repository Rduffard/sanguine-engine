function stormPulseMovement(level) {
  return {
    canCarryPassenger: level >= 14,
    feet: 10,
    provokesOpportunityAttacks: false,
  };
}

function stormPulseFollowsCast(cast, turnId) {
  return Boolean(cast && !(cast.slotLevel < 1) && cast.turnId === turnId);
}

const stormDamageTypes = Object.freeze(['lightning', 'thunder']);

function conductiveSoulCastEligible(callingId, damageTypes, discipline) {
  return callingId === 'tidecaller' && damageTypes.includes(discipline);
}

module.exports = { stormPulseMovement, stormPulseFollowsCast, stormDamageTypes, conductiveSoulCastEligible };

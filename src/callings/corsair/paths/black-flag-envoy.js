function envoyTargetLimit(handler, spiritModifier) {
  return handler === 'envoy-parley' ? Math.max(1, spiritModifier) : handler === 'envoy-all' ? 3 : 1;
}

function envoyCommandRange(level) {
  return level >= 9 ? 60 : 30;
}

const envoyRepeatedSaveConditions = Object.freeze(['charmed', 'frightened']);

function envoyParleyTerms() {
  return {
    rangeFeet: 60,
    onFailedSave: { condition: 'charmed', cannotAttackOwner: true },
    repeatSave: 'end-of-target-turn',
    endsOnOwnerOrAllyHarm: true,
    charmedImmunityPreventsAll: true,
  };
}

function envoyCommandGrant(handler, mode) {
  return handler === 'envoy-save'
    ? { repeatSaveAgainst: mode, advantage: true, endsConditionOnSuccess: true }
    : { movementSpeedFraction: 0.5, noOpportunityAttacks: true };
}

module.exports = { envoyTargetLimit, envoyCommandRange, envoyRepeatedSaveConditions, envoyParleyTerms, envoyCommandGrant };

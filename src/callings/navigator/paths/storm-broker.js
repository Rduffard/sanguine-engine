function stormBrokerToolAdvantage(task, attribute, discipline) {
  return task === 'predict-weather' && attribute === 'instinct' && discipline === 'weather' ||
    task === 'interpret-signals' && attribute === 'wit' && discipline === 'signals';
}

function borrowedSquall(level, instinctModifier, zone) {
  return {
    exemptionLimit: level >= 7 ? Math.max(1, instinctModifier) : 0,
    radius: level >= 15 ? 20 : level >= 7 ? 15 : 10,
    ends: level >= 11 ? 'end-of-next-turn' : 'start-of-next-turn',
    heavilyObscured: zone === 'fog',
    rangedWeaponAttacksThroughDisadvantage: zone === 'crosswind',
    difficultTerrain: zone === 'surge',
  };
}

function captainsCreditHealth(trainingBonus, instinctModifier) {
  return Math.max(1, trainingBonus + instinctModifier);
}

function stormBrokerResistanceAllowed(damageType) {
  return ['lightning', 'thunder'].includes(damageType);
}

module.exports = { stormBrokerToolAdvantage, borrowedSquall, captainsCreditHealth, stormBrokerResistanceAllowed };

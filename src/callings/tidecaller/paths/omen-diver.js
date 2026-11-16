function dragonCompanionEligible(spellId, callingId, pathId, level) {
  return spellId === 'summon-dragon' && callingId === 'tidecaller' && pathId === 'omen-diver' && level >= 18;
}

function dragonCompanionCasting({ requiresConcentration, noConcentration, companion, extended, components }) {
  return {
    concentration: requiresConcentration && !noConcentration,
    ...(noConcentration ? { durationSeconds: extended ? 120 : 60 } : {}),
    ...(companion ? { components: components.filter(component => component !== 'M') } : {}),
  };
}

module.exports = { dragonCompanionEligible, dragonCompanionCasting };

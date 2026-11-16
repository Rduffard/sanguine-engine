const { damageTypes } = require('./definitions');

function projectConditions({ conditions, resistances, immunities, levels, paths, raging, aura, incapacitated }) {
  const petrified = conditions.includes('petrified');
  const conditionImmunities = [
    ...(petrified ? ['poisoned'] : []),
    ...(paths.reaver === 'bloodwake' && raging && levels.reaver >= 6 ? ['charmed', 'frightened'] : []),
    ...(aura && !incapacitated && levels.warden >= 10 ? ['frightened'] : []),
    ...(aura && !incapacitated && paths.warden === 'leviathan-anchor' && levels.warden >= 7 ? ['charmed'] : []),
  ];
  return {
    conditions: conditions.filter(id => !conditionImmunities.includes(id)),
    conditionImmunities,
    suppressedConditions: conditions.filter(id => conditionImmunities.includes(id)),
    ...(petrified ? { resistances: [...new Set([...resistances, ...damageTypes])], immunities: [...new Set([...(immunities ?? []), 'poison'])] } : {}),
  };
}

const immobilizingConditions = new Set(['grappled', 'paralyzed', 'petrified', 'restrained', 'stunned', 'unconscious']);
const conditionsPreventMovement = conditions => conditions.some(id => immobilizingConditions.has(id));

module.exports = { projectConditions, conditionsPreventMovement };

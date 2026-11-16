const { spellCastingNumbers } = require('../spells/casting-numbers');
const { spells } = require('../spells');
const spellsById = new Map(spells.map(spell => [spell.id, spell]));

const magicInitiateChoices = Object.freeze({
  lists: Object.freeze(['doctor', 'druid', 'shipwright']),
  attributes: Object.freeze(['wit', 'instinct', 'spirit']),
  cantripCount: 2,
});

function magicInitiateSpells(list, level) {
  return spells.filter(spell => spell.level === level && spell.callings.includes(list)).map(spell => spell.id);
}

function replaceMagicInitiateSpell(source, from, to) {
  if (!source) return null;
  const granted = [...source.cantrips, source.spell];
  const oldSpell = spellsById.get(from);
  const newSpell = spellsById.get(to);
  if (!oldSpell || !newSpell || !granted.includes(from) || granted.includes(to) ||
      oldSpell.level !== newSpell.level || !newSpell.callings.includes(source.list)) return null;
  return oldSpell.level === 0
    ? { cantrips: source.cantrips.map(id => id === from ? to : id) }
    : { spell: to };
}

function magicInitiateCasting(source, score, trainingBonus) {
  return { ...source, ...spellCastingNumbers(score, trainingBonus) };
}

function magicInitiatePool(list) {
  return { id: `feat:magic-initiate:${list}`, max: 1, recovery: { longRest: 'all', shortRest: 0 } };
}

function magicInitiateReplacementAvailable(level) {
  return level > 1;
}

function magicInitiateReplacementBatchEligible(changes) {
  return Array.isArray(changes) && changes.length <= magicInitiateChoices.lists.length &&
    new Set(changes.map(change => change?.grantKey)).size === changes.length;
}

module.exports = { magicInitiateChoices, magicInitiateSpells, replaceMagicInitiateSpell, magicInitiateCasting, magicInitiatePool,
  magicInitiateReplacementAvailable, magicInitiateReplacementBatchEligible };

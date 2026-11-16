const { gunslingerLevelGrants } = require('./gunslinger/rules');

const scholarSkills = ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'];
const styles = ['archery', 'defense', 'great-weapon-fighting', 'two-weapon-fighting'];

function callingTrainingChoices(calling, level, first) {
  return {
    thievesCant: calling === 'corsair' && first,
    languageCount: calling === 'corsair' && first ? 1 : calling === 'navigator' && level === 2 ? 2 : 0,
    expertiseCount: calling === 'corsair' && [1, 6].includes(level) || calling === 'navigator' && level === 9
      ? 2 : calling === 'navigator' && level === 2 ? 1 : 0,
    skillCount: calling === 'reaver' && level === 3 ? 1 : 0,
    scholarCount: calling === 'shipwright' && level === 2 ? 1 : 0,
  };
}

function trainedScholarSkills(trained) {
  return trained.filter(skill => scholarSkills.includes(skill));
}

function divineOrderChoices(calling, level) {
  return calling === 'doctor' && level === 1 ? ['protector', 'thaumaturge'] : null;
}

function divineOrderTraining(order) {
  return order === 'protector' ? { weapons: ['martial'], armor: ['heavy'] } : { weapons: [], armor: [] };
}

function cantripStyleSource(calling) {
  if (calling === 'warden') return 'doctor';
  if (calling === 'navigator') return 'druid';
  return null;
}

function callingCantripCount(baseCount, divineOrder) {
  return baseCount + (divineOrder === 'thaumaturge' ? 1 : 0);
}

function cantripStyleSpellEligible(calling, spell) {
  const source = cantripStyleSource(calling);
  return Boolean(source && spell?.level === 0 && spell.callings.includes(source));
}

function styleCantripReplacementAvailable(level) {
  return level > 2;
}

function availableFightingStyles(calling, level, path, selected) {
  const cantripSource = cantripStyleSource(calling);
  if (!(calling === 'gunslinger' && gunslingerLevelGrants(level, path).fightingStyle) && !(cantripSource && level === 2)) return null;
  return [...styles, ...(cantripSource ? ['cantrip-style'] : [])].filter(style => !selected.includes(style));
}

function pathChoiceAtLevel(level) {
  return level === 3;
}

function omenDiverElementChoices(path, level) {
  return path === 'omen-diver' && level === 6 ? ['acid', 'cold', 'fire', 'lightning', 'poison'] : null;
}

function blessedStrikeChoices(calling, level) {
  return calling === 'doctor' && level === 7 ? ['divine-strike', 'potent-spellcasting'] : null;
}

function attacksPerAction(mechanics) {
  return Math.max(...Object.values(mechanics).map(calling => calling.attacksPerAction));
}

module.exports = { callingTrainingChoices, trainedScholarSkills, divineOrderChoices, divineOrderTraining, cantripStyleSource,
  callingCantripCount, cantripStyleSpellEligible, styleCantripReplacementAvailable, availableFightingStyles,
  pathChoiceAtLevel, omenDiverElementChoices, blessedStrikeChoices, attacksPerAction };

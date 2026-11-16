function featAvailable(feat, totalLevel, chosenFeats) {
  return Boolean(feat && feat.category !== 'fighting-style' && totalLevel >= feat.minimumLevel &&
    (feat.repeatable || !chosenFeats.includes(feat.id)));
}

function featPrerequisiteMet(feat, { scores, caster, weapons, armor, trained }) {
  if (feat.id === 'grappler' && scores.might < 13 && scores.agility < 13) return false;
  switch (feat.prerequisite) {
    case 'spellcasting': return Boolean(caster);
    case 'firearm': return weapons.includes('martial');
    case 'shield': return armor.includes('shield');
    case 'medicine': return trained.includes('medicine');
    default: return true;
  }
}

function featIncreaseShapeValid(feat, entries) {
  if (feat.id === 'ability-score-improvement') {
    return entries.length === 1 && entries[0][1] === 2 ||
      entries.length === 2 && entries.every(([, amount]) => amount === 1);
  }
  if (feat.category === 'origin') return entries.length === 0;
  return entries.length === 1 && entries[0][1] === 1;
}

function featIncreaseError(feat, attribute, score, increase) {
  if (feat.id === 'boon-of-irresistible-offense' && !['might', 'agility'].includes(attribute) ||
      feat.id === 'boon-of-spell-recall' && !['wit', 'instinct', 'spirit'].includes(attribute) ||
      feat.attributeOptions && !feat.attributeOptions.includes(attribute)) return 'Invalid feat attribute';
  if (feat.id === 'grappler' && !['might', 'agility'].includes(attribute)) return 'Invalid Grappler attribute';
  if (score + increase > (feat.category === 'epic-boon' ? 30 : 20)) return 'Attribute maximum exceeded';
  return null;
}

module.exports = { featAvailable, featPrerequisiteMet, featIncreaseShapeValid, featIncreaseError };

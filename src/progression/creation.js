const { goldToCopper } = require('../equipment/commerce');
const { feats } = require('../feats/definitions.json');

const creationSizes = Object.freeze(['medium', 'small']);
const backgroundGoldAlternative = 50;
const maximumCreationScore = 17;

function creationBackgroundIncreases(first, second, split) {
  return split ? { [first]: 1, [second]: 1 } : { [first]: 2 };
}

function advancementCallingPolicyError(initialCalling, selectedCalling, healthRoll) {
  if (initialCalling && initialCalling !== selectedCalling)
    return 'SA-CHAR-1 permits one Calling; multiclassing is unavailable';
  if (healthRoll !== undefined) return 'SA-CHAR-1 uses fixed Health gains';
  return null;
}

function customBackgroundFeatEligible(featId) {
  return feats.some(feat => feat.category === 'origin' && feat.id === featId);
}

function backgroundEquipmentEligible(backgroundId, option) {
  return option === 'gold' || (option === 'pack' && backgroundId !== 'custom');
}

function initialStandardLanguageCount(hasBackground) {
  return hasBackground ? 1 : 2;
}

function creationScores(scores, originAttribute, attributes, allowedBackgroundAttributes, increases) {
  const entries = Object.entries(increases);
  const validAmounts = entries.length === 1 && entries[0][1] === 2 ||
    entries.length === 2 && entries.every(([, amount]) => amount === 1);
  if (!validAmounts || entries.some(([attribute, amount]) => !allowedBackgroundAttributes.includes(attribute) || !Number.isInteger(amount))) {
    return { error: 'Background increases must be +2 to one or +1 to two eligible attributes' };
  }
  const adjusted = { ...scores, [originAttribute]: scores[originAttribute] + 1 };
  for (const [attribute, amount] of entries) adjusted[attribute] += amount;
  if (attributes.some(attribute => adjusted[attribute] > maximumCreationScore))
    return { error: 'Creation score maximum is 17' };
  return { scores: adjusted };
}

function backgroundEquipmentTerms(background, selection, instrument) {
  if (selection === 'gold') return { goldCp: goldToCopper(backgroundGoldAlternative), itemLabels: [] };
  const itemLabels = background.items.map(label => label === 'Musical Instrument' && instrument ? instrument : label);
  return { goldCp: goldToCopper(background.gold), itemLabels };
}

module.exports = { creationScores, backgroundEquipmentTerms, customBackgroundFeatEligible, backgroundEquipmentEligible,
  initialStandardLanguageCount, creationSizes, backgroundGoldAlternative, maximumCreationScore, creationBackgroundIncreases,
  advancementCallingPolicyError };

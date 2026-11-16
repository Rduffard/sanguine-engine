const { ATTRIBUTE_KEYS, attributeModifier } = require('../core/attributes');

function trainingBonusForLevel(level) {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error('Level must be 1–20');
  }
  return 2 + Math.floor((level - 1) / 4);
}

function trainingContribution(bonus, { trained, expertise = false }) {
  if (expertise) return bonus * 2;
  return trained ? bonus : 0;
}

const toolAliases = {
  'navigators-tools': 'navigator-tools',
  'carpenters-tools': 'carpenter-tools',
  'masons-tools': 'mason-tools',
  'smiths-tools': 'smith-tools',
  'tinkers-tools': 'tinker-tools',
  'poisoners-kit': 'poisoner-kit',
  'calligraphers-supplies': 'calligrapher-tools',
};

function normalizeToolTraining(id) {
  return toolAliases[id] ?? id.replace(/^instrument:/, '');
}

function aggregateEquipmentTraining(profile, grants = []) {
  const result = structuredClone(profile);
  for (const grant of grants) {
    for (const key of ['categories', 'weapons', 'armor', 'groups']) {
      result[key] = [...new Set([...result[key], ...(grant[key] ?? [])])];
    }
  }
  return result;
}

function weaponTrained(training, weapon, weaponGroups) {
  return (
    (training.groups ?? []).some(group => (weaponGroups[group] ?? []).includes(weapon.id)) ||
    training.categories.includes(weapon.category) ||
    training.weapons.includes(weapon.id)
  );
}

function armorTrained(training, category) {
  return training.armor.includes(category);
}

exports.trainingBonusForLevel = trainingBonusForLevel;
exports.trainingContribution = trainingContribution;
exports.normalizeToolTraining = normalizeToolTraining;
exports.aggregateEquipmentTraining = aggregateEquipmentTraining;
exports.weaponTrained = weaponTrained;
exports.armorTrained = armorTrained;

// A grant of an already trained skill adds Expertise.
function trainingGrantDestination(trained, skill) {
  return trained.includes(skill) ? 'expertise' : 'trained';
}

exports.trainingGrantDestination = trainingGrantDestination;

function weaponMasteryEligible(weapon, calling, training, allowNonMartialGroup = false) {
  return weapon.kind === 'weapon' && !weapon.baseWeaponId && Boolean(weapon.mastery) &&
    (calling !== 'reaver' || weapon.type === 'melee') &&
    (training.includes(weapon.category) || training.includes(weapon.id) ||
      training.includes('martial:finesse-or-light') &&
      (allowNonMartialGroup || weapon.category === 'martial') &&
      weapon.properties.some(property => ['finesse', 'light'].includes(property.id)));
}

function masteryReplacementLimit(calling, choice, currentCount) {
  return choice === 'mastery' && ['corsair', 'navigator', 'warden'].includes(calling) ? currentCount : 1;
}

exports.weaponMasteryEligible = weaponMasteryEligible;
exports.masteryReplacementLimit = masteryReplacementLimit;

function trainingProfile({ weapons, armor }, weaponGroups, { includeGroupIds = false } = {}) {
  const isCategory = id => id === 'simple' || id === 'martial';
  return {
    categories: weapons.filter(isCategory),
    weapons: weapons.filter(id => !isCategory(id) && (includeGroupIds || !Object.hasOwn(weaponGroups, id))),
    groups: Object.keys(weaponGroups).filter(id => weapons.includes(id)),
    armor,
  };
}

exports.trainingProfile = trainingProfile;

function trainingCheckModifier(attributes, attribute, level, training = [], trainingId = '', expertise = []) {
  const score = attributes?.[attribute];
  if (!ATTRIBUTE_KEYS.includes(attribute) || !Number.isSafeInteger(score) || score < 1)
    throw new Error('Attribute score unavailable');
  const bonus = trainingBonusForLevel(level);
  const trained = Boolean(trainingId && training.includes(trainingId));
  return attributeModifier(score) + trainingContribution(bonus, {
    trained,
    expertise: trained && expertise.includes(trainingId),
  });
}

exports.trainingCheckModifier = trainingCheckModifier;

const { calculateCheckModifier } = require('../core/attributes');
const { trainingBonusForLevel, trainingContribution, weaponTrained } = require('../training');
const { exhaustionD20Penalty } = require('../saving-throws');

function projectWeapon(d, progression, { training, weaponGroups, grip, sacredWeapon }) {
  const { attributes, totalLevel } = progression;
  const trained = weaponTrained(training, d, weaponGroups);
  const allowedAttributes = d.properties.some((p) => p.id === "finesse")
    ? ["might", "agility"]
    : [d.type === "ranged" ? "agility" : "might"];
  const modifiers = Object.fromEntries(
    allowedAttributes.map((key) => [
      key,
      calculateCheckModifier(attributes, key),
    ])
  );
  const attribute = allowedAttributes.reduce((a, b) =>
    modifiers[b] > modifiers[a] ? b : a
  );
  const damage =
    grip === "two" && d.versatileDamage
      ? { ...d.versatileDamage, type: d.damage.type }
      : d.damage;
  return {
    damage,
    heldHands: grip === "two" || d.hands === 2 ? 2 : 1,
    trained,
    allowedAttributes,
    attribute,
    attackModifier:
      modifiers[attribute] +
      (sacredWeapon?sacredWeaponAttackBonus(progression.attributeModifiers.spirit):0) +
      trainingContribution(trainingBonusForLevel(totalLevel), { trained }) +
      (d.type === "ranged" && progression.fightingStyles.includes("archery") ? 2 : 0) - exhaustionD20Penalty(progression.exhaustion ?? 0),
    damageModifier: modifiers[attribute],
    damageTypeOptions:sacredWeapon?[d.damage.type,'radiant']:[d.damage.type],
    mastery: progression.weaponMastery.includes(d.baseWeaponId??d.id) ? d.mastery : null,
    heavyDisadvantage: d.properties.some(p=>p.id==='heavy')&&attributes[d.type==='ranged'?'agility':'might']<13,
    requiresTwoHandGrip: d.hands===2&&grip!=='two',
    maxShotsPerAction: d.loading && !(progression.feats.includes('powder-drill')&&['pistol','musket'].includes(d.id)) ? 1 : progression.attacksPerAction,
    supported: d.automation.melee,
    unsupportedReason: d.automation.melee
      ? null
      : "Range, ammunition, thrown state, or mounted combat is not implemented",
  };
}

exports.projectWeapon = projectWeapon;

function readyMeleeWeapon(attack, attribute) {
  return Boolean(attack?.weapon.type === 'melee' && !attack.requiresTwoHandGrip &&
    (attribute === undefined || attack.allowedAttributes.includes(attribute)));
}

exports.readyMeleeWeapon = readyMeleeWeapon;
const { sacredWeaponAttackBonus } = require('../callings/warden/tactics');

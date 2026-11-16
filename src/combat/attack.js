const { calculateCheckModifier } = require('../core/attributes');
const { trainingBonusForLevel: proficiencyBonus } = require('../training');

function allowedAttributes(weapon) {
  if (weapon.properties.some((p) => p.id === "finesse"))
    return ["might", "agility"];
  return [weapon.type === "melee" ? "might" : "agility"];
}
function attackInputs(actor, weapon, options) {
  const allowed = allowedAttributes(weapon);
  const attribute =
    options.attribute ??
    allowed.reduce((a, b) =>
      calculateCheckModifier(actor.attributes, b) >
      calculateCheckModifier(actor.attributes, a)
        ? b
        : a
    );
  if (!allowed.includes(attribute)) throw new Error("Invalid attack attribute");
  const attributeModifier = calculateCheckModifier(actor.attributes, attribute);
  const proficiency =
    actor.weaponTraining.includes(weapon.id) ||
    actor.weaponTraining.includes(weapon.category)
      ? proficiencyBonus(actor.level)
      : 0;
  const heavy =
    weapon.properties.some((p) => p.id === "heavy") &&
    actor.attributes[weapon.type === "melee" ? "might" : "agility"] < 13;
  const disadvantage = Boolean(
    options.disadvantage || heavy || actor.restrictions?.physicalD20Disadvantage
  );
  return { attribute, attributeModifier, proficiency, disadvantage };
}

function attackOutcome(selected, attributeModifier, proficiency, guard, criticalThreshold) {
  const total = selected + attributeModifier + proficiency;
  const critical = selected >= (criticalThreshold ?? 20),
    hit = critical || (selected !== 1 && total >= guard);
  return { total, critical, hit };
}

function attackDamage(actor, weapon, damageDice, hit, attributeModifier, health) {
  const adjustedDamageDice =
    actor.greatWeaponFighting &&
    (weapon.heldHands ?? weapon.hands) === 2 &&
    weapon.properties.some((p) => ["two-handed", "versatile"].includes(p.id))
      ? damageDice.map((n) => Math.max(3, n))
      : damageDice;
  const damage = hit
    ? Math.max(
        0,
        adjustedDamageDice.reduce((a, b) => a + b, 0) + attributeModifier
      )
    : 0;
  const after = Math.max(0, health - damage);
  return { adjustedDamageDice, damage, after };
}

module.exports = { allowedAttributes, attackInputs, attackOutcome, attackDamage };

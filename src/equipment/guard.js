const { calculateCheckModifier } = require("../core/attributes");
// Armor inputs are structured definitions, never client-supplied defense totals.
function calculateGuard(
  attributes,
  { armor = null, shield = false, bonus = 0, unarmoredBase = null } = {}
) {
  const agility = calculateCheckModifier(attributes, "agility");
  let base = 10 + agility;
  if (unarmoredBase !== null) {
    if (!Number.isSafeInteger(unarmoredBase) || unarmoredBase < 1) throw new Error("Invalid unarmored Guard");
    if (!armor) base = Math.max(base, unarmoredBase);
  }
  if (armor) {
    if (
      !["light", "medium", "heavy"].includes(armor.category) ||
      !Number.isInteger(armor.base) ||
      armor.base < 1
    )
      throw new Error("Invalid armor definition");
    base =
      armor.base +
      (armor.category === "heavy"
        ? 0
        : armor.category === "medium"
        ? Math.min(2, agility)
        : agility);
  }
  if (typeof shield !== "boolean") throw new Error("Invalid shield input");
  if (!Number.isInteger(bonus) || bonus < 0 || bonus > 1)
    throw new Error("Invalid Guard feature bonus");
  return base + (shield ? 2 : 0) + bonus;
}
module.exports = { calculateGuard };

function loadoutGuardInputs(armor, shield, progression, covenantBonus) {
  const inputs = { armor, shield };
  const defenseBonus = progression.fightingStyles.includes('defense') && armor ? 1 : 0;
  if (!armor) {
    const { agility, resolve, spirit } = progression.attributeModifiers;
    const base = 10 + agility;
    const alternatives = [base];
    if (progression.callingLevels.reaver) alternatives.push(base + resolve);
    if (progression.paths.tidecaller === 'omen-diver') alternatives.push(base + spirit);
    if (alternatives.length > 1) inputs.unarmoredBase = Math.max(...alternatives);
  }
  inputs.bonus = defenseBonus + covenantBonus + (progression.magicGuardBonus ?? 0);
  return inputs;
}

module.exports.loadoutGuardInputs = loadoutGuardInputs;

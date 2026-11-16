const colossusStanceHealth = (level, resolveModifier) => level + resolveModifier;
const strokeOfLuckTotal = (total, originalRoll) => total + 20 - originalRoll;
const mangroveVanishDamage = (incomingDamage) => Math.floor(incomingDamage / 2);
const auraOfProtectionBonus = (level, spiritModifier) => level >= 6 ? Math.max(1, spiritModifier) : 0;
const bloodPriceHealthCost = (trainingBonus) => 2 * trainingBonus;
const sorcerousRestorationAmount = (level) => Math.floor(level / 2);
const comfortTemporaryHealth = (instinctModifier) => Math.max(1, instinctModifier);
const barrierDamageReduction = (rolledTotal) => Math.max(1, rolledTotal);

function reefSkinEligible({ attack, damageType, path, level, raging, suppressed }) {
  return attack && ['bludgeoning', 'piercing', 'slashing'].includes(damageType) &&
    path === 'reef-colossus' && level >= 6 && raging && !suppressed;
}

const bloodPriceDiceCount = (level) => level >= 18 ? 3 : level >= 6 ? 2 : 1;
const bloodPriceDiceSides = 8;
const measuredSacrificeTerms = Object.freeze({ healthCost: 6, sorceryRecovery: 2 });

function bloodPriceShelterSelected(discipline) {
  return discipline === 'shelter';
}

function canPayConduitHealth(current, cost) {
  return current > cost;
}

function bloodPriceSurgeOutcome(extraNecrotic, damageTypes) {
  const forfeited = damageTypes.length === 0;
  return { amount: forfeited ? 0 : extraNecrotic, damageType: 'necrotic', oneDamageRollOnly: true, forfeited };
}
const bloodPriceShelterHealth = (rolledTotal, spiritModifier) => Math.max(0, rolledTotal + spiritModifier);
const vitalCircuitHealth = (spiritModifier) => Math.max(1, spiritModifier);
const empoweredSpellRerollLimit = (spiritModifier) => Math.max(1, spiritModifier);

module.exports = {
  reefSkinEligible,
  bloodPriceDiceCount,
  bloodPriceDiceSides,
  measuredSacrificeTerms,
  bloodPriceShelterSelected,
  canPayConduitHealth,
  bloodPriceSurgeOutcome,
  bloodPriceShelterHealth,
  vitalCircuitHealth,
  empoweredSpellRerollLimit,
  colossusStanceHealth,
  strokeOfLuckTotal,
  mangroveVanishDamage,
  auraOfProtectionBonus,
  bloodPriceHealthCost,
  sorcerousRestorationAmount,
  comfortTemporaryHealth,
  barrierDamageReduction,
};

function fastHandsUnlocked(path, level) {
  return path === 'reef-knife' && level >= 3;
}

function chargedSpellLevel(baseLevel, requestedCharges) {
  return baseLevel + requestedCharges - 1;
}

const chargedSpellMaximumCharges = 3;

function chargedSpellChargeCountEligible(charges) {
  return Number.isSafeInteger(charges) && charges >= 1 && charges <= chargedSpellMaximumCharges;
}

function reefKnifeAdvancedMagicUnlocked(path, level) {
  return path === 'reef-knife' && level >= 13;
}

function reefKnifeAttunementLimit(path, level) {
  return reefKnifeAdvancedMagicUnlocked(path, level) ? 4 : 3;
}

const chargePreservationDieSides = 6;
const chargeDestructionDieSides = 20;

function chargeSpendOutcome(available, requested, preservationRoll) {
  const preserved = preservationRoll === chargePreservationDieSides;
  const chargesSpent = preserved ? 0 : requested;
  const remaining = available - chargesSpent;
  return { preserved, chargesSpent, remaining, requiresDestructionRoll: !preserved && remaining === 0 };
}

function itemDestroyedByChargeRoll(roll) {
  return roll === 1;
}

function chargedItemCastEligible(item, profile, heldIds, casting, featCasting) {
  return Boolean(item && profile?.spellId && profile.charges && profile.held && heldIds.includes(item.instanceId) &&
    (!profile.requiresAttunement || item.attuned && magicAttunementEligible(profile, casting, featCasting)));
}

function rechargeItem(available, profile, rolls) {
  const rolled = rolls.reduce((total, die) => total + die, profile.recharge.bonus ?? 0);
  const chargesRemaining = Math.min(profile.charges, available + rolled);
  return { rolls, recovered: chargesRemaining - available, chargesRemaining };
}

const oilProfiles = {
  throw: { action: 'attack-replacement', consume: true, rangeFeet: 20, save: true, oilCoating: true, durationSeconds: 60 },
  ground: { action: 'utilize', consume: true, rangeFeet: 5, areaFeet: 5, deployed: true, groundOil: true, burningDamage: 5, oncePerCreatureTurn: true },
  fuel: { action: 'utilize', consume: true, oilFuel: true, durationSeconds: 21600 },
};

function oilUseProfile(mode) {
  return typeof mode === 'string' && Object.hasOwn(oilProfiles, mode) ? { ...oilProfiles[mode] } : null;
}

function poisonCoating(kind, quantity) {
  const ammunition = kind !== 'weapon';
  return { ammunition, remainingHits: ammunition ? Math.min(3, quantity) : 1 };
}

function remainingOilFuel(remainingMs, elapsedMs) {
  return Math.max(0, remainingMs - elapsedMs);
}

const groundOilBurn = Object.freeze({ durationMs: 12000, burningDamage: oilProfiles.ground.burningDamage, oncePerCreatureTurn: true });

function poisonCoatingHitAllowed(ammunition, hit) {
  return hit !== false || ammunition;
}

function poisonCoatingHit(remainingHits, roll) {
  return { remainingHits: remainingHits - 1, damage: roll ?? 0 };
}

const oilFuelDeviceIds = Object.freeze(['lamp', 'lantern-bullseye', 'lantern-hooded']);
const poisonCoatingDamageTypes = Object.freeze(['piercing', 'slashing']);
const oilUseModes = Object.freeze(Object.keys(oilProfiles));
const holyWaterTargetTypes = Object.freeze(['fiend', 'undead', 'other']);

function holyWaterDamageEligible(targetType) {
  return targetType === 'fiend' || targetType === 'undead';
}

function poisonWeaponEligible(definition) {
  return Boolean(definition && (definition.kind === 'weapon' || definition.ammunitionType));
}

function objectUseSaveDC(profile, agilityModifier, trainingBonus) {
  return profile.saveDC ?? 8 + agilityModifier + trainingBonus;
}

function magicAttunementEligible(profile, casting, featCasting) {
  return profile?.requiresAttunement && (!profile.spellcasterPrerequisite ||
    Object.values(casting).some(source => source.cantrips.length || source.slots.length) || featCasting?.length);
}

function magicLoadoutError(inventory, limit, profileOf, eligible) {
  const attuned = inventory.filter(item => item.attuned);
  if (attuned.length > limit || new Set(attuned.map(item => profileOf(item).attunementFamily ?? item.definitionId)).size !== attuned.length ||
      attuned.some(item => !eligible(item))) return 'Attunement requires eligible distinct profiles within your limit';
  const cloaks = inventory.filter(item => item.worn && profileOf(item)?.wearSlot === 'cloak');
  return cloaks.length > 1 ? 'Wear only one cloak at a time' : null;
}

function magicItemActive(item, profile, heldIds, casting, featCasting) {
  return profile && (!profile.requiresAttunement || item.attuned && magicAttunementEligible(profile, casting, featCasting)) &&
    (!profile.wearSlot || item.worn) && (!profile.held || heldIds.includes(item.instanceId));
}

module.exports = { fastHandsUnlocked, chargedSpellLevel, chargeSpendOutcome, rechargeItem, oilUseProfile, poisonCoating,
  reefKnifeAdvancedMagicUnlocked, reefKnifeAttunementLimit, remainingOilFuel, groundOilBurn, poisonCoatingHitAllowed, poisonCoatingHit,
  magicAttunementEligible, magicLoadoutError, magicItemActive, chargedSpellChargeCountEligible, chargedSpellMaximumCharges,
  oilFuelDeviceIds, poisonCoatingDamageTypes, poisonWeaponEligible, objectUseSaveDC, basicPoisonDie: 4,
  oilUseModes, holyWaterTargetTypes, holyWaterDamageEligible,
  chargePreservationDieSides, chargeDestructionDieSides, itemDestroyedByChargeRoll, chargedItemCastEligible };

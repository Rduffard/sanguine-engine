function abjureFoesTargetLimit(spiritModifier) {
  return Math.max(1, spiritModifier);
}

function wardenAuraRadius(level) {
  return level >= 18 ? 30 : 10;
}

function holyNimbus(level, spiritModifier, trainingBonus) {
  return {
    saveAdvantageAgainst: ['fiend', 'undead'],
    sunlight: true,
    radiusFeet: wardenAuraRadius(level),
    enemyStartTurnDamage: spiritModifier + trainingBonus,
  };
}

function holyNimbusPulse(level, spiritModifier, trainingBonus) {
  return { damage: holyNimbus(level, spiritModifier, trainingBonus).enemyStartTurnDamage, damageType: 'radiant' };
}

function dawnAtSeaPulse(damage) {
  return { damage, damageType: 'radiant', noSave: true };
}

function vigilCureEffect(conditionSource) {
  return { endsCondition: 'charmed', endsConditionSource: conditionSource, requireConditionSource: true };
}

function covenantAura(level, spiritModifier, standard) {
  return {
    radiusFeet: wardenAuraRadius(level),
    saveAdvantageAgainst: ['forced-movement', 'prone'],
    standardTemporaryHealth: standard ? covenantStandardHealth(spiritModifier) : 0,
  };
}

function covenantStandardHealth(spiritModifier) {
  return Math.max(1, spiritModifier);
}

function covenantSentinel() {
  return { attackDisadvantage: true, rangeFeet: 5, beforeAttackRoll: true, reactionSpent: true };
}

function covenantShieldGuardBonus(bulwarkActive) {
  return bulwarkActive ? 1 : 0;
}

function sacredWeaponAttackBonus(spiritModifier) {
  return Math.max(1, spiritModifier);
}

function lightTheWatch(damageType) {
  return { watchLight: true, brightLightFeet: 20, sunlight: false, damageType };
}

function lightTheWatchHitTerms(undead) {
  return { preventsHealing: undead, healingPreventionEnds: 'start-of-next-owner-turn' };
}

function passageAura(level, openHarbor) {
  return {
    radiusFeet: wardenAuraRadius(level),
    ignoreNonmagicalDifficultTerrain: true,
    escapeGrappleAdvantage: true,
    openHarbor,
  };
}

function clearSightAura(level, dawnSunlight) {
  return {
    radiusFeet: wardenAuraRadius(level),
    seeThroughNonmagicalFog: true,
    undeadFearSaveAdvantage: true,
    piercesMagicalDarkness: false,
    dawnSunlight,
  };
}

function wardenPathAuras({ path, level, aura, spiritModifier, standard, openHarbor, dawnSunlight }) {
  const available = aura && level >= 7;
  if (path === 'iron-covenant') {
    return {
      fields: {
        covenantAura: available ? covenantAura(level, spiritModifier, standard) : null,
        ...(standard ? { preventsEnemyForcedMovement: true } : {}),
      },
      resistances: standard ? ['bludgeoning', 'piercing', 'slashing'] : [],
    };
  }
  if (path === 'oath-of-the-free-port') {
    return { fields: { passageAura: available ? passageAura(level, openHarbor) : null }, resistances: [] };
  }
  if (path === 'lantern-vigil') {
    return {
      fields: { clearSightAura: available ? clearSightAura(level, dawnSunlight) : null },
      resistances: dawnSunlight && aura ? ['necrotic'] : [],
    };
  }
  return { fields: {}, resistances: [] };
}

const restoringTouchConditions = Object.freeze(['blinded', 'charmed', 'deafened', 'frightened', 'paralyzed', 'stunned']);
const restoringTouchCostPerCondition = 5;

function restoringTouchCost(conditions) {
  if (!Array.isArray(conditions) || !conditions.length ||
      new Set(conditions).size !== conditions.length ||
      conditions.some(condition => !restoringTouchConditions.includes(condition))) return null;
  return restoringTouchCostPerCondition * conditions.length;
}

module.exports = { abjureFoesTargetLimit, holyNimbus, holyNimbusPulse, dawnAtSeaPulse, vigilCureEffect, covenantAura, passageAura, clearSightAura, wardenPathAuras,
  covenantStandardHealth, covenantSentinel, covenantShieldGuardBonus, sacredWeaponAttackBonus, lightTheWatch, lightTheWatchHitTerms,
  restoringTouchConditions, restoringTouchCostPerCondition, restoringTouchCost };

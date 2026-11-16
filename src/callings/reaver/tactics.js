const { trainingContribution } = require('../../training');
const { damageOnSuccessfulSave } = require('../../combat/save-damage');

function rageSkillModifiers({ might, training, expertise, trainingBonus }) {
  return Object.fromEntries(['acrobatics', 'intimidation', 'perception', 'stealth', 'survival'].map(id => [
    id, might + trainingContribution(trainingBonus, { trained: training.includes(id), expertise: expertise.includes(id) }),
  ]));
}

function stormhideRetaliationDamage(resolveModifier) {
  return Math.max(1, resolveModifier);
}

function reaverAreaDamage(rolls) {
  const damage = rolls.reduce((total, roll) => total + roll, 0);
  return { damage, successDamage: damageOnSuccessfulSave(damage, 'half') };
}

function chainbreakerEscape(rolls, athleticsModifier, dc) {
  const checkTotal = Math.max(...rolls) + athleticsModifier;
  return { checkTotal, dc, success: checkTotal >= dc };
}

function chainbreakerEscapeOutcome(rolls, athleticsModifier, dc, conditionSource) {
  const outcome = chainbreakerEscape(rolls, athleticsModifier, dc);
  return {
    ...outcome,
    ...(outcome.success ? { endsCondition: 'grappled', endsConditionSource: conditionSource, requireConditionSource: true } : {}),
    allyActionSpent: false,
  };
}

function thunderousLandingEligible(level, raging) {
  return level >= 10 && raging;
}

function thunderousLanding(targetIds, save) {
  return {
    save: { attribute: save.attribute, dc: save.dc },
    landing: { targetIds, proneOnFailure: true, radiusFeet: 5 },
  };
}

module.exports = {
  rageSkillModifiers,
  stormhideRetaliationDamage,
  reaverAreaDamage,
  chainbreakerEscape,
  thunderousLandingEligible,
  thunderousLanding,
};

function primalChampionAttributes(level, scores) {
  if (level !== 20) return {};
  return { might: Math.min(25, scores.might + 4), resolve: Math.min(25, scores.resolve + 4) };
}

module.exports.primalChampionAttributes = primalChampionAttributes;

function reefColossus(level, size, discipline, rageDamage) {
  return {
    effectiveSize: size === 'small' ? 'medium' : 'large',
    carryingMultiplier: size === 'small' ? 1 : 2,
    forcedMovementSaveAdvantage: discipline === 'anchor',
    objectDamageBonus: discipline === 'breaker' ? rageDamage : 0,
    ownTurnMeleeReachBonus: level >= 14 ? 5 : 0,
  };
}

module.exports.reefColossus = reefColossus;

function rageActivation(level, path, walkingSpeed) {
  return {
    cleansedConditions: path === 'bloodwake' && level >= 6 ? ['charmed', 'frightened'] : [],
    pounce: level >= 7 ? { maximumFeet: Math.floor(walkingSpeed / 2), provokesOpportunityAttacks: true } : null,
    ends: persistentRageUnlocked(level) ? null : 'end-of-next-turn',
  };
}

module.exports.rageActivation = rageActivation;

function persistentRageUnlocked(level) {
  return level >= 15;
}

module.exports.persistentRageUnlocked = persistentRageUnlocked;
module.exports.rageExtensionReasons = Object.freeze(['attack-roll', 'forced-save', 'bonus-action']);

function frenzyAttackEligible({ ownTurn, hit, attribute, raging, path, reckless, used }) {
  return ownTurn && hit && attribute === 'might' && raging && path === 'bloodwake' && reckless && !used;
}

module.exports.frenzyAttackEligible = frenzyAttackEligible;
module.exports.frenzyDamageDie = 6;

function stormhideLeap(distanceFeet) {
  if (!Number.isSafeInteger(distanceFeet) || distanceFeet < 1 || distanceFeet > 15) return null;
  return { feet: distanceFeet, provokesOpportunityAttacks: true, teleport: false };
}

function reaverPathHitDamage(rageDamage, path, discipline, weapon) {
  return { damage: rageDamage, damageType: path === 'thunderhide' ? discipline : weapon.damage.type };
}

function chainbreakerRallyTargets(targets, self) {
  return targets.length > 0 && targets.length <= 3 && !targets.includes(self);
}

function deckshakerLanding(targetIds) {
  return { targetIds, proneOnFailure: true, radiusFeet: 10 };
}

function deckshakerOutcome(rolls, targetIds, save) {
  const { damage, successDamage } = reaverAreaDamage(rolls);
  return {
    damage, damageType: 'bludgeoning', save: { ...save, successDamage }, landing: deckshakerLanding(targetIds), attackAction: false,
  };
}

function chainbreakerRallyEffect() {
  return { endsCondition: 'prone' };
}

Object.assign(module.exports, { stormhideLeap, reaverPathHitDamage, chainbreakerRallyTargets, deckshakerLanding,
  deckshakerOutcome, chainbreakerRallyEffect });

const chainbreakerHitModes = Object.freeze(['grappling-ally', 'carrying-restraints']);
const chainbreakerKneelConditions = Object.freeze(['charmed', 'frightened', 'restrained']);

function walkingStormEffect() {
  return { walkingStorm: true, ends: 'start-of-next-turn', radiusFeet: 10 };
}

function chainbreakerKneelOutcome(condition) {
  return { saveSucceedsInstead: true, endsCondition: condition };
}

Object.assign(module.exports, { chainbreakerHitModes, chainbreakerKneelConditions, walkingStormEffect, chainbreakerKneelOutcome });
module.exports.chainbreakerEscapeOutcome = chainbreakerEscapeOutcome;

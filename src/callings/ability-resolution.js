const { sumDice } = require('../core/dice');
const singleTargetAbilities = new Set(['second-wind', 'spark-heal', 'lay-heal', 'triage', 'triage-antidote', 'impossible-operation']);
const rageFeatures = new Set([
  'path:thunderhide:walking-storm:14', 'path:chainbreaker:none-shall-kneel:14', 'path:reef-colossus:deckshaker:10',
]);

function abilityTargetError(handler, targets, self) {
  if (singleTargetAbilities.has(handler) && targets.length > 1) return 'This option requires one target';
  if (handler === 'second-wind' && targets.some(id => id !== self)) return 'Second Wind only heals its owner';
  if (handler === 'spark-heal' && (!targets.length || targets[0] === self)) return 'Divine Spark requires another creature';
  if (handler === 'impossible-operation' && targets.length !== 1) return 'Impossible Operation requires one target';
  return null;
}

function abilityNeedsRage(featureId) {
  return rageFeatures.has(featureId);
}

function fixedAbilityRolls({ maximum, count, sides }) {
  return maximum ? Array(count).fill(sides) : null;
}

function nonnegativeAbilityAmount(amount) {
  return Math.max(0, amount);
}

function abilityTakesAction(action) {
  return ['Action', 'Bonus Action', 'Reaction', 'Magic action', 'Attack action rider'].includes(action);
}

function firstMissingAbilityCost(costs, pools) {
  return costs.find(cost => (pools?.[cost.poolId] ?? 0) < cost.amount);
}

module.exports = { abilityTargetError, abilityNeedsRage, fixedAbilityRolls, abilityRollTotal: sumDice, nonnegativeAbilityAmount,
  abilityTakesAction, firstMissingAbilityCost };

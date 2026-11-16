const gunslinger = require('./index');

function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

freeze(gunslinger);

const gunslingerAbilityDefinitions = freeze({
  'path:iron-suppressor:suppressing-fire:3':[['hit','Suppressing Fire','No action',[['iron-suppressor:suppression',1]],'suppressor-hit']],
  'path:iron-suppressor:crossing-denied:10':[['attack','Crossing Denied','Reaction',[['iron-suppressor:suppression',1]],'suppressor-crossing']],
  'path:iron-suppressor:hold-the-corridor:18':[['hold','Hold the Corridor','Bonus Action',[['iron-suppressor:hold-corridor',1]],'suppressor-hold']],
  'path:brass-outrider:ride-the-recoil:3':[['move','Ride the Recoil','No action',[['brass-outrider:outrider',1]],'outrider-recoil']],
  'path:brass-outrider:passing-shot:10':[['hit','Passing Shot','No action',[],'outrider-passing']],
  'path:brass-outrider:break-pursuit:15':[['move','Break Pursuit','Reaction',[['brass-outrider:outrider',1]],'outrider-break']],
  'path:brass-outrider:over-the-horizon:18':[['attack','Over the Horizon','Bonus Action',[['brass-outrider:horizon',1]],'outrider-horizon']],
  'path:cinder-artillerist:measured-charge:3':[['detonate','Measured Charge','Action',[['cinder-artillerist:charge',1]],'measured-charge']],
  'path:cinder-artillerist:grand-battery:18':[['detonate','Grand Battery','Action',[['cinder-artillerist:charge',2],['cinder-artillerist:battery',1]],'grand-battery']],
  'calling:gunslinger:second-wind:1':[['main','Recover Health','Bonus Action',[['gunslinger:second-wind',1]],'second-wind']],
  'calling:gunslinger:action-surge:2':[['main','Action Surge','No action',[['gunslinger:action-surge',1]],'action-surge']],
  'calling:gunslinger:tactical-mind:2':[['main','Tactical Mind','No action',[['gunslinger:second-wind',1]],'tactical-mind']],
  'calling:gunslinger:indomitable:9':[['main','Reroll a failed save','No action',[['gunslinger:indomitable',1]],'indomitable']],
});

const progressionThresholds = {
  attacksPerAction: [[1, 1], [5, 2], [11, 3], [20, 4]],
  masteryCount: [[1, 3], [4, 4], [10, 5], [16, 6]],
  secondWindUses: [[1, 2], [4, 3], [10, 4]],
  actionSurgeUses: [[2, 1], [17, 2]],
  indomitableUses: [[9, 1], [13, 2], [17, 3]],
};

function gunslingerProgression(level) {
  if (!Number.isInteger(level) || level < 1 || level > 20) throw new RangeError('Gunslinger level must be 1–20');
  return Object.fromEntries(Object.entries(progressionThresholds).map(([key, thresholds]) => [
    key, thresholds.reduce((value, [minimum, next]) => level >= minimum ? next : value, 0),
  ]));
}

function gunslingerResources(level, pathId) {
  const { secondWindUses, actionSurgeUses, indomitableUses } = gunslingerProgression(level);
  const pools = {};
  const add = (id, max, shortRest = 0) => {
    if (max > 0) pools[id] = { id, max, recovery: { longRest: 'all', shortRest } };
  };
  add('gunslinger:second-wind', secondWindUses, 1);
  add('gunslinger:action-surge', actionSurgeUses, 'all');
  add('gunslinger:indomitable', indomitableUses);
  const path = gunslinger.paths.find(path => path.id === pathId);
  if (pathId !== undefined && !path) throw new RangeError('Unknown Gunslinger Path');
  for (const [key, spec] of Object.entries(path?.pools ?? {})) {
    if (level >= (spec.level ?? 3)) add(pathId + ':' + key, spec.max, spec.short ?? 0);
  }
  return pools;
}

function gunslingerLevelGrants(level, pathId, discipline) {
  return {
    fightingStyle: level === 1 || pathId === 'deadeye' && level === 7,
    skill: pathId === 'brass-outrider' && level === 3 ? (discipline === 'rider' ? 'animal-handling' : 'athletics') : null,
    tool: pathId === 'cinder-artillerist' && level === 7 ? 'smiths-tools' : null,
  };
}

function gunslingerAbilityPreview(handler, { level, trainingBonus, wit, agility, corridorDcBonus = 0 }) {
  switch (handler) {
    case 'second-wind': return { roll: { label: 'Healing', count: 1, sides: 10, bonus: level, unit: 'Health' } };
    case 'measured-charge':
    case 'grand-battery':
      return {
        roll: { label: 'Fire damage per area', count: handler === 'grand-battery' ? 6 : level >= 15 ? 5 : level >= 7 ? 3 : 2, sides: 6, bonus: 0 },
        save: { attribute: 'agility', dc: 8 + trainingBonus + wit },
      };
    case 'suppressor-hit':
      return {
        roll: { label: 'Primary target extra damage', count: 1, sides: level >= 15 ? 10 : level >= 7 ? 8 : 6, bonus: 0 },
        save: { attribute: 'resolve', dc: 8 + trainingBonus + agility + corridorDcBonus },
      };
    case 'outrider-passing': return { roll: { label: 'Extra damage', count: 1, sides: 8, bonus: 0 } };
    default: return undefined;
  }
}

function gunslingerCriticalThreshold(pathId, level) {
  return pathId === 'deadeye' ? (level >= 15 ? 18 : 19) : 20;
}

function indomitableTotal(roll, saveModifier, level) {
  return roll + saveModifier + level;
}

function halfWalkingSpeed(speed) {
  return Math.floor(nonnegativeWalkingSpeed(speed) / 2);
}

function nonnegativeWalkingSpeed(speed) {
  return Math.max(0, speed);
}

function heroicRallyHealing(pathId, level, current, maximum, resolveModifier) {
  return pathId === 'deadeye' && level >= 18 && current > 0 && current <= Math.floor(maximum / 2)
    ? Math.max(0, 5 + resolveModifier)
    : null;
}

exports.gunslinger = gunslinger;
exports.gunslingerAbilityDefinitions = gunslingerAbilityDefinitions;
exports.gunslingerProgression = gunslingerProgression;
exports.gunslingerResources = gunslingerResources;
exports.gunslingerLevelGrants = gunslingerLevelGrants;
exports.gunslingerAbilityPreview = gunslingerAbilityPreview;
exports.gunslingerCriticalThreshold = gunslingerCriticalThreshold;
exports.indomitableTotal = indomitableTotal;
exports.halfWalkingSpeed = halfWalkingSpeed;
exports.nonnegativeWalkingSpeed = nonnegativeWalkingSpeed;
exports.heroicRallyHealing = heroicRallyHealing;

function passingShotEligible({ voluntarySpeedFeet, recoilBeforeHit }) {
  return !(voluntarySpeedFeet < 20 || recoilBeforeHit);
}

module.exports.passingShotEligible = passingShotEligible;

function suppressingFireTargetLimit(level) {
  return level >= 15 ? 2 : 1;
}

function suppressingFireControl(targetIds, damage, discipline) {
  const control = discipline === 'push'
    ? { pushFeet: 10, direction: 'directly-away' }
    : { speedReductionFeet: 10 };
  return targetIds.map((targetId, index) => ({
    targetId, extraDamage: index === 0 ? damage : 0, ...control, doesNotStackWithSameMastery: true,
  }));
}

exports.suppressingFireTargetLimit = suppressingFireTargetLimit;
exports.suppressingFireControl = suppressingFireControl;

function recoilMovement(distanceFeet, mode) {
  if (!Number.isSafeInteger(distanceFeet) || distanceFeet < 1 || distanceFeet > 15 || !['self', 'mount'].includes(mode)) return null;
  return {
    feet: distanceFeet,
    provokesOpportunityAttacks: false,
    mountUsesRemainingMovement: mode === 'mount',
    extraMovement: mode === 'self',
  };
}

function withinWalkingSpeed(distanceFeet, speed) {
  return Number.isSafeInteger(distanceFeet) && distanceFeet >= 0 && distanceFeet <= nonnegativeWalkingSpeed(speed);
}

exports.recoilMovement = recoilMovement;
exports.withinWalkingSpeed = withinWalkingSpeed;

function entrenchedDrill(level, ownerTurn) {
  return {
    halfCoverAgainstRanged: level >= 7 && Boolean(ownerTurn) && (ownerTurn.movementFeet ?? 0) <= 5,
    guardAndAgilitySaveBonus: 2,
    endsWhenMovedBeyondFeet: 5,
  };
}

exports.entrenchedDrill = entrenchedDrill;

function studiedAttacksUnlocked(level) {
  return level >= 13;
}

function deadeyeDefiesDeath(path, level) {
  return path === 'deadeye' && level >= 18;
}

exports.studiedAttacksUnlocked = studiedAttacksUnlocked;
exports.deadeyeDefiesDeath = deadeyeDefiesDeath;

function tacticalShiftMovement(level, speed) {
  return level >= 5 ? { maximumFeet: halfWalkingSpeed(speed), provokesOpportunityAttacks: false } : null;
}

exports.tacticalShiftMovement = tacticalShiftMovement;

function holdTheCorridorDCBonus(active) {
  return active ? 2 : 0;
}

exports.holdTheCorridorDCBonus = holdTheCorridorDCBonus;

const actionSurgeAdditionalActions = Object.freeze([
  'attack', 'dash', 'disengage', 'dodge', 'help', 'hide', 'influence', 'ready', 'search', 'study', 'utilize',
]);

function tacticalMindOutcome(originalTotal, bonus, dc) {
  const checkTotal = originalTotal + bonus;
  const success = checkTotal >= dc;
  return { checkTotal, success, refunded: !success };
}

exports.actionSurgeAdditionalActions = actionSurgeAdditionalActions;
exports.tacticalMindOutcome = tacticalMindOutcome;

function heroicWarriorInspirationAvailable(inCombat, features, inspiration) {
  return inCombat && features.some(feature => feature.id === 'path:deadeye:heroic-warrior:10') && !inspiration;
}

exports.heroicWarriorInspirationAvailable = heroicWarriorInspirationAvailable;

function holdTheCorridorEffect() {
  return { corridorDC: true, ends: 'start-of-next-turn' };
}

function suppressingFireEffect(controlTargets) {
  return { controlTargets, ends: 'start-of-next-turn' };
}

exports.holdTheCorridorEffect = holdTheCorridorEffect;
exports.suppressingFireEffect = suppressingFireEffect;

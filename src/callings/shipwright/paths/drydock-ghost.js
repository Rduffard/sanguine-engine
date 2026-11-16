function salvageCredit(level) {
  return 1000 * level;
}

exports.salvageCredit = salvageCredit;

function ghostRepairAmount(missingHealth, rolledHealing) {
  return Math.min(missingHealth, rolledHealing);
}

exports.ghostRepairAmount = ghostRepairAmount;

function ghostService(handler, spellSaveDC) {
  return handler === 'ghost-repair'
    ? { tool: 'carpenter-tools' }
    : { tool: 'thieves-tools', discoveryDC: spellSaveDC };
}

exports.ghostService = ghostService;

function ghostTradeBonus(eligible, usedThisTurn, witModifier) {
  return eligible && !usedThisTurn ? Math.max(1, witModifier) : 0;
}

exports.ghostTradeBonus = ghostTradeBonus;

function drydockSalvageUnlocked(path, level) {
  return path === 'drydock-ghost' && level >= 6;
}

function drydockToolExpertise(path, level) {
  return drydockSalvageUnlocked(path, level) ? ['thieves-tools', 'carpenters-tools'] : [];
}

exports.drydockSalvageUnlocked = drydockSalvageUnlocked;
exports.drydockToolExpertise = drydockToolExpertise;

const silentKeelVehicleLengthLimit = 100;
const silentKeelTargetLimits = Object.freeze({ vehicle: 1, creatures: 6 });

exports.silentKeelVehicleLengthLimit = silentKeelVehicleLengthLimit;
exports.silentKeelTargetsEligible = function silentKeelTargetsEligible(mode, count) {
  return typeof mode === 'string' && Object.hasOwn(silentKeelTargetLimits, mode) && count >= 1 && count <= silentKeelTargetLimits[mode];
};
exports.silentKeelVehicleEligible = function silentKeelVehicleEligible(length) {
  return Number.isFinite(length) && length > 0 && length <= silentKeelVehicleLengthLimit;
};

function unseenPassageBenefits() {
  return { movement: { climb: 'walk', swim: 'walk' }, structurePassage: true };
}

exports.unseenPassageBenefits = unseenPassageBenefits;

function ghostTradeMatches(path, specialty, task) {
  return path === 'drydock-ghost' && specialty === task;
}

exports.ghostTradeMatches = ghostTradeMatches;

const { absorbTemporaryHealth } = require('./temporary-health');

class HealingError extends Error {}

function freshDeathSaves() {
  return { successes: 0, failures: 0, stable: false, dead: false };
}

const incapacitatingConditions = new Set(['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious']);
const stabilizationDieSides = 4;

function isIncapacitated({ health, deathSaves, conditions }) {
  return Boolean(deathSaves?.dead || health?.current === 0 ||
    (conditions ?? []).some(condition => incapacitatingConditions.has(condition.conditionId)));
}

function isUnconscious({ health, conditions }) {
  return health.current === 0 || (conditions ?? []).some(condition => condition.conditionId === 'unconscious');
}

function canStabilize(health, deathSaves) {
  return health === 0 && !deathSaves?.dead;
}

function canRollDeathSave(health, deathSaves) {
  return canStabilize(health, deathSaves) && !deathSaves?.stable;
}

function stabilizationDurationMs(roll) {
  return roll * 3600000;
}

function healVitality({ health, deathSaves }, amount) {
  if (!Number.isSafeInteger(amount) || amount < 0) throw new HealingError('Invalid healing');
  if (deathSaves?.dead) throw new HealingError('Healing cannot revive a dead creature');

  const current = capHealing(health.current, health.max, amount);
  return {
    health: { ...health, current },
    ...(current > 0 ? { deathSaves: freshDeathSaves(), pendingRelentlessRage: null } : {}),
  };
}

function capHealing(current, maximum, amount) {
  return Math.min(maximum, current + amount);
}

function restoreVitality({ health }, amount = 1) {
  return { health: { ...health, current: Math.min(health.max, amount) }, deathSaves: freshDeathSaves() };
}

function failDeathSaves(deathSaves, count) {
  const failures = Math.min(3, deathSaves.failures + count);
  return {
    ...deathSaves,
    failures,
    ...(failures === 3 ? { dead: true, cause: 'failed-saves' } : {}),
  };
}

function resolveDeathSave(deathSaves, roll, { defyDeath = false } = {}) {
  const saves = deathSaves ?? freshDeathSaves();
  if (roll >= (defyDeath ? 18 : 20)) return { kind: 'restore-health' };
  if (roll >= 10) {
    if (saves.successes + 1 === 3) return { kind: 'stabilize' };
    return { kind: 'continue', deathSaves: { ...saves, successes: saves.successes + 1 } };
  }
  return { kind: 'continue', deathSaves: failDeathSaves(saves, roll === 1 ? 2 : 1) };
}

function applyVitalityDamage({ health, temporaryHealth = 0, deathSaves }, amount, critical) {
  const { absorbed, remaining } = absorbTemporaryHealth(temporaryHealth, amount);
  const current = Math.max(0, health.current - amount + absorbed);
  let saves = { ...(deathSaves ?? freshDeathSaves()) };
  if (amount > 0 && current === 0) {
    if (amount - absorbed - health.current >= health.max) {
      saves = { ...saves, dead: true, cause: 'massive-damage' };
    } else if (health.current === 0) {
      saves = failDeathSaves({ ...saves, stable: false }, critical ? 2 : 1);
    }
  }
  return {
    absorbed,
    health: { ...health, current },
    temporaryHealth: remaining,
    deathSaves: saves,
  };
}

function relentlessRageDC(previousAttempts = 0) {
  return 10 + 5 * previousAttempts;
}

function clearTemporaryHealth() {
  return { temporaryHealth: 0, temporaryHealthMetadata: null };
}

function recoverRestExhaustion(exhaustion, { kind, nourished, navigatorLevel }) {
  const recovers = kind === 'long-rest' ? nourished === true : navigatorLevel >= 10;
  return recovers ? Math.max(0, (exhaustion ?? 0) - 1) : exhaustion;
}

exports.HealingError = HealingError;
exports.freshDeathSaves = freshDeathSaves;
exports.isIncapacitated = isIncapacitated;
exports.isUnconscious = isUnconscious;
exports.canStabilize = canStabilize;
exports.canRollDeathSave = canRollDeathSave;
exports.stabilizationDieSides = stabilizationDieSides;
exports.stabilizationDurationMs = stabilizationDurationMs;
exports.healVitality = healVitality;
exports.capHealing = capHealing;
exports.restoreVitality = restoreVitality;
exports.resolveDeathSave = resolveDeathSave;
exports.applyVitalityDamage = applyVitalityDamage;
exports.relentlessRageDC = relentlessRageDC;
exports.clearTemporaryHealth = clearTemporaryHealth;
exports.recoverRestExhaustion = recoverRestExhaustion;

function mitigateDamage(amount, { agilityHalfSave, evasion, immune, resistant, reefSkinReduction = 0 }) {
  const evasionApplied = Boolean(agilityHalfSave && evasion);
  let damage = amount;
  if (evasionApplied && agilityHalfSave === 'success') damage = 0;
  else if (evasionApplied || agilityHalfSave === 'success') damage = Math.floor(damage / 2);

  if (immune) damage = 0;
  else if (resistant) damage = Math.floor(damage / 2);
  return { damage: Math.max(0, damage - reefSkinReduction), evasionApplied };
}

function concentrationDamageDC(damage) {
  return Math.min(30, Math.max(10, Math.floor(damage / 2)));
}

function grantTemporaryHealth(current, amount, metadata) {
  return amount > current ? { temporaryHealth: amount, temporaryHealthMetadata: metadata } : {};
}

function trackTemporaryHealth(current, amount) {
  return amount === 0 ? 0 : Math.max(current, amount);
}

exports.mitigateDamage = mitigateDamage;
exports.concentrationDamageDC = concentrationDamageDC;
exports.grantTemporaryHealth = grantTemporaryHealth;
exports.trackTemporaryHealth = trackTemporaryHealth;

function unbrokenCurrentUnlocked(path, level) {
  return path === 'sanguine-conduit' && !(level < 18);
}

function evaluateUnbrokenCurrent({ declared, before, current, dead, canReact, uses, level }) {
  if (!declared || !(before > 0) || current !== 0 || dead) return { kind: 'inactive' };
  if (!canReact || !(uses > 0)) return { kind: 'unavailable' };
  return { kind: 'restore', health: 1, temporaryHealth: level, remainingUses: uses - 1 };
}

function pendingRelentlessRage({ before, current, dead, raging, level, attempts }) {
  return before > 0 && current === 0 && !dead && raging && level >= 11
    ? { dc: relentlessRageDC(attempts) }
    : null;
}

function canResolveRelentlessRage({ level, pending, current, dead, activeRage }) {
  return !(level < 11 || !pending || current !== 0 || dead || !activeRage);
}

function resolveRelentlessRage({ total, attempts, level }) {
  return {
    attempts: attempts + 1,
    restoredHealth: total >= relentlessRageDC(attempts) ? 2 * level : null,
  };
}

function isDamageConcentrationExempt({ navigatorLevel, spellId }) {
  return navigatorLevel >= 13 && spellId === 'hunter-s-mark';
}

exports.unbrokenCurrentUnlocked = unbrokenCurrentUnlocked;
exports.evaluateUnbrokenCurrent = evaluateUnbrokenCurrent;
exports.pendingRelentlessRage = pendingRelentlessRage;
exports.canResolveRelentlessRage = canResolveRelentlessRage;
exports.resolveRelentlessRage = resolveRelentlessRage;
exports.isDamageConcentrationExempt = isDamageConcentrationExempt;

function resolveConcentrationSave({ rolls, resolveModifier, dc }) {
  const selected = Math.max(...rolls);
  const total = selected + resolveModifier;
  return { selected, total, success: total >= dc };
}

exports.resolveConcentrationSave = resolveConcentrationSave;

function isBloodied({ current, max }) {
  return current <= Math.floor(max / 2);
}

function halfHealthHealingAmount({ current, max }, amount) {
  return Math.min(amount, Math.max(0, Math.floor(max / 2) - current));
}

exports.isBloodied = isBloodied;
exports.halfHealthHealingAmount = halfHealthHealingAmount;

Object.assign(module.exports, require('./definitions'), require('./condition-projection'));

function directHealthReduction(current, amount) {
  return Math.max(0, current - amount);
}

exports.directHealthReduction = directHealthReduction;

const maximumExhaustionLevel = 6;

function validExhaustionLevel(level) {
  return Number.isInteger(level) && level >= 0 && level <= maximumExhaustionLevel;
}

exports.maximumExhaustionLevel = maximumExhaustionLevel;
exports.validExhaustionLevel = validExhaustionLevel;

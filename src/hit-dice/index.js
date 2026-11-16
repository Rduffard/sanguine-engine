const { attributeModifier } = require('../core/attributes');
const { capHealing } = require('../vitality');

class HitDiceReconciliationError extends Error {
  constructor(die) {
    super('Invalid Hit Dice reconciliation input');
    this.name = 'HitDiceReconciliationError';
    this.code = 'INVALID_HIT_DICE_RECONCILIATION';
    this.die = die;
  }
}

function isRecord(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateAllocation(allocation) {
  if (!isRecord(allocation)) throw new HitDiceReconciliationError();
  for (const [die, count] of Object.entries(allocation)) {
    if (!/^d[1-9]\d*$/.test(die) || !Number.isSafeInteger(count) || count < 0) {
      throw new HitDiceReconciliationError(die);
    }
  }
}

function reconcileHitDice(previousAllocation, previousState, nextAllocation, policy) {
  if ((policy !== 'advance' && policy !== 'rebuild') || !isRecord(previousState)) {
    throw new HitDiceReconciliationError();
  }
  validateAllocation(previousAllocation);
  validateAllocation(nextAllocation);

  return Object.fromEntries(Object.entries(nextAllocation).map(([die, max]) => {
    const previousMax = Object.hasOwn(previousAllocation, die) ? previousAllocation[die] : 0;
    const saved = Object.hasOwn(previousState, die) ? previousState[die] : undefined;
    const available = saved ?? 0;
    if (!Number.isSafeInteger(available)) throw new HitDiceReconciliationError(die);

    const adjusted = max - (previousMax - available);
    const reconciled = Math.max(0, policy === 'rebuild' ? Math.min(available, adjusted) : adjusted);
    // The backend historically rejected an over-max result during saved-state validation.
    if (reconciled > max) throw new HitDiceReconciliationError(die);
    return [die, reconciled];
  }));
}

exports.HitDiceReconciliationError = HitDiceReconciliationError;
exports.reconcileHitDice = reconcileHitDice;

class HitDiceRecoveryError extends Error {}

function recoverHealthWithHitDice({ health, hitDice, allocation, resolve, spends }) {
  if (!Array.isArray(spends) || spends.length > 20) {
    throw new HitDiceRecoveryError('Invalid Hit Dice');
  }
  const remaining = { ...hitDice };
  let current = health.current;
  for (const spend of spends) {
    if (
      !spend ||
      Object.keys(spend).some(key => key !== 'die' && key !== 'roll') ||
      !allocation[spend.die] ||
      remaining[spend.die] < 1 ||
      !Number.isSafeInteger(spend.roll) ||
      spend.roll < 1 ||
      spend.roll > Number(spend.die.slice(1))
    ) {
      throw new HitDiceRecoveryError('Unavailable Hit Die or invalid GM-recorded roll');
    }
    remaining[spend.die]--;
    const healing = Math.max(0, spend.roll + attributeModifier(resolve));
    current = capHealing(current, health.max, healing);
  }
  return { hitDice: remaining, health: { ...health, current } };
}

exports.HitDiceRecoveryError = HitDiceRecoveryError;
exports.recoverHealthWithHitDice = recoverHealthWithHitDice;

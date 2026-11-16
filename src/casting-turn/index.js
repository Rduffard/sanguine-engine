class CastingTurnBudgetError extends Error {
  constructor(code) {
    super(code);
    this.name = 'CastingTurnBudgetError';
    this.code = code;
  }
}

function isRecord(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function transitionCastingTurnBudget(current, request) {
  if (!isRecord(current) || !isRecord(request)) throw new CastingTurnBudgetError('INVALID_CASTING_TURN_INPUT');
  const { slotSpent = false, leveled = false, quickened: usedQuickened = false, freeMetamagic: usedFree = false } = current;
  const { level, spentSlot = false, quickened = false, freeMetamagic = false } = request;
  if (!Number.isSafeInteger(level) || level < 0 || level > 9 ||
      [slotSpent, leveled, usedQuickened, usedFree, spentSlot, quickened, freeMetamagic]
        .some(flag => typeof flag !== 'boolean')) {
    throw new CastingTurnBudgetError('INVALID_CASTING_TURN_INPUT');
  }

  const leveledCast = level > 0;
  if ((spentSlot && slotSpent) || (leveledCast && usedQuickened) || (quickened && leveled)) {
    throw new CastingTurnBudgetError('CASTING_TURN_LIMIT');
  }
  if (freeMetamagic && usedFree) throw new CastingTurnBudgetError('FREE_METAMAGIC_ALREADY_USED');

  return {
    slotSpent: slotSpent || spentSlot,
    leveled: leveled || leveledCast,
    quickened: usedQuickened || quickened,
    freeMetamagic: usedFree || freeMetamagic,
  };
}

exports.CastingTurnBudgetError = CastingTurnBudgetError;
exports.transitionCastingTurnBudget = transitionCastingTurnBudget;

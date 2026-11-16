class SpellSlotReconciliationError extends Error {
  constructor(slotLevel) {
    super('Invalid ordinary spell slot reconciliation input');
    this.name = 'SpellSlotReconciliationError';
    this.code = 'INVALID_SPELL_SLOT_RECONCILIATION';
    this.slotLevel = slotLevel;
  }
}

const maximumSpellSlotLevel = 9;

function isSpellSlotLevel(level) {
  return Number.isSafeInteger(level) && level >= 1 && level <= maximumSpellSlotLevel;
}

function validateCounts(counts, length, maxima) {
  if (!Array.isArray(counts) || counts.length !== length || length > maximumSpellSlotLevel) {
    throw new SpellSlotReconciliationError();
  }
  for (let i = 0; i < length; i++) {
    const count = counts[i];
    if (!Object.hasOwn(counts, i) || !Number.isSafeInteger(count) || count < 0 ||
        (maxima && count > maxima[i])) {
      throw new SpellSlotReconciliationError(i + 1);
    }
  }
}

function reconcileSpellSlots(previousAllocation, previousAvailable, nextAllocation, policy) {
  if (policy !== 'advance' && policy !== 'rebuild') throw new SpellSlotReconciliationError();
  validateCounts(previousAllocation, previousAllocation?.length);
  validateCounts(previousAvailable, previousAllocation.length, previousAllocation);
  validateCounts(nextAllocation, nextAllocation?.length);

  return nextAllocation.map((max, i) => {
    const available = previousAvailable[i] ?? 0;
    const spent = (previousAllocation[i] ?? 0) - available;
    const adjusted = max - spent;
    const capped = policy === 'rebuild' ? Math.min(available, adjusted) : adjusted;
    return {
      available: Math.max(0, capped),
      remainingReduction: Math.max(0, -capped),
    };
  });
}

exports.SpellSlotReconciliationError = SpellSlotReconciliationError;
exports.reconcileSpellSlots = reconcileSpellSlots;
exports.isSpellSlotLevel = isSpellSlotLevel;

class SpellSlotExpenditureError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'SpellSlotExpenditureError';
    this.code = code;
  }
}

function validateSpellSlotDeduction(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new SpellSlotExpenditureError('INVALID_SPELL_SLOT_EXPENDITURE', 'Invalid spell slot expenditure input');
  }
  const { slotLevel, available, created } = input;
  if (!isSpellSlotLevel(slotLevel) ||
      !Number.isSafeInteger(available) || available < 1) {
    throw new SpellSlotExpenditureError('SPELL_SLOT_UNAVAILABLE', 'Choose an available spell slot');
  }
  if (!Number.isSafeInteger(created) || created < 0) {
    throw new SpellSlotExpenditureError('INVALID_SPELL_SLOT_EXPENDITURE', 'Invalid spell slot expenditure input');
  }
}

function deductBalance({ available, created }) {
  return { available: available - 1, created: Math.max(0, created - 1) };
}

function deductSpellSlot(input) {
  validateSpellSlotDeduction(input);
  return deductBalance(input);
}

function requiresSpellRecallRoll(input) {
  validateSpellSlotDeduction(input);
  if (typeof input.recallEligible !== 'boolean') {
    throw new SpellSlotExpenditureError('INVALID_SPELL_SLOT_EXPENDITURE', 'Invalid spell slot expenditure input');
  }
  return input.recallEligible && input.slotLevel <= 4;
}

function calculateSpellSlotExpenditure(input, recallRoll) {
  const requiresRoll = requiresSpellRecallRoll(input);
  if (requiresRoll ? !Number.isSafeInteger(recallRoll) || recallRoll < 1 || recallRoll > 4 : recallRoll !== undefined) {
    throw new SpellSlotExpenditureError('INVALID_SPELL_RECALL_ROLL', 'Expected a d4 roll only for eligible Spell Recall');
  }
  const { slotLevel, available, created } = input;
  const spentSlot = recallRoll !== slotLevel;
  return {
    ...(spentSlot ? deductBalance(input) : { available, created }),
    spentSlot,
    ...(requiresRoll ? { spellRecall: { roll: recallRoll, slotLevel, preserved: !spentSlot } } : {}),
  };
}

exports.SpellSlotExpenditureError = SpellSlotExpenditureError;
exports.deductSpellSlot = deductSpellSlot;
exports.requiresSpellRecallRoll = requiresSpellRecallRoll;
exports.calculateSpellSlotExpenditure = calculateSpellSlotExpenditure;

const slotCreationCosts = [2, 3, 5, 6, 7];

function getSpellSlotCreationTerms(slotLevel) {
  if (!Number.isSafeInteger(slotLevel) || slotLevel < 1 || slotLevel > slotCreationCosts.length) return null;
  return { cost: slotCreationCosts[slotLevel - 1], minimumCallingLevel: slotLevel * 2 - 1 };
}

function projectSorceryPointsFromSlot({ slotLevel, points, maximum }) {
  const after = points + slotLevel;
  return after <= maximum ? after : null;
}

function calculateCreatedSpellSlotBalances({ available, created, points, cost }) {
  return { available: available + 1, created: created + 1, points: points - cost };
}

exports.getSpellSlotCreationTerms = getSpellSlotCreationTerms;
exports.projectSorceryPointsFromSlot = projectSorceryPointsFromSlot;
exports.calculateCreatedSpellSlotBalances = calculateCreatedSpellSlotBalances;

class ArcaneRecoveryError extends Error {}

function recoverArcaneSlots({ slots, maximums, slotLevels, shipwrightLevel, uses }) {
  if (
    !Array.isArray(slotLevels) || !slotLevels.length || uses < 1 || !shipwrightLevel ||
    slotLevels.some(level => !Number.isSafeInteger(level) || level < 1 || level > 5) ||
    slotLevels.reduce((total, level) => total + level, 0) > Math.ceil(shipwrightLevel / 2)
  ) {
    throw new ArcaneRecoveryError('Invalid Arcane Recovery');
  }
  const recovered = [...slots];
  for (const level of slotLevels) {
    const index = level - 1;
    if (maximums[index] === undefined || recovered[index] >= maximums[index]) {
      throw new ArcaneRecoveryError('Arcane Recovery needs expended slots');
    }
    recovered[index]++;
  }
  return { slots: recovered, uses: uses - 1 };
}

exports.ArcaneRecoveryError = ArcaneRecoveryError;
exports.recoverArcaneSlots = recoverArcaneSlots;

function availableCastingSlots(allocation, slots, spellLevel) {
  return allocation.map((_, index) => index + 1).filter(level => level >= spellLevel && slots[level - 1] > 0);
}

exports.availableCastingSlots = availableCastingSlots;

function savedSlotBalancesEligible(allocation, slots, createdSlots) {
  if (!Array.isArray(slots) || slots.length !== allocation.length ||
      !Array.isArray(createdSlots) || createdSlots.length !== slots.length) return false;
  for (let index = 0; index < slots.length; index++) {
    const total = slots[index], created = createdSlots[index];
    if (!Number.isSafeInteger(created) || created < 0 || created > 100 ||
        !Number.isSafeInteger(total) || total < 0 || total > allocation[index] + created) return false;
  }
  return true;
}

exports.savedSlotBalancesEligible = savedSlotBalancesEligible;

function reconcileCombinedSpellSlots(previousAllocation, slots, createdSlots, nextAllocation, policy) {
  const countedCreated = slots.map((total, index) => Math.min(total, createdSlots[index]));
  const ordinary = slots.map((total, index) => total - countedCreated[index]);
  return reconcileSpellSlots(previousAllocation, ordinary, nextAllocation, policy)
    .map(({ available, remainingReduction }, index) =>
      available + Math.max(0, (countedCreated[index] ?? 0) - remainingReduction));
}

exports.reconcileCombinedSpellSlots = reconcileCombinedSpellSlots;

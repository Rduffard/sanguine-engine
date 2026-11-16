class ResourceTransitionError extends Error {
  constructor(code, poolId) {
    super(code);
    this.name = 'ResourceTransitionError';
    this.code = code;
    this.poolId = poolId;
  }
}

function poolMaximum(definitions, id) {
  if (typeof id !== 'string' || !Object.hasOwn(definitions, id)) return undefined;
  const max = definitions[id]?.max;
  return Number.isSafeInteger(max) && max > 0 ? max : undefined;
}

function poolBalance(pools, id, max) {
  if (max === undefined || !Object.hasOwn(pools, id)) return undefined;
  const balance = pools[id];
  return Number.isSafeInteger(balance) && balance >= 0 && balance <= max ? balance : undefined;
}

// Callers supply the earned maximum and recovery amount for their feature.
function calculateCappedPoolRecovery({ current, maximum, amount }) {
  const remaining = Math.min(maximum, current + amount);
  return { remaining, recovered: remaining - current };
}

function spendPool(pools, definitions, { poolId, amount }) {
  const max = poolMaximum(definitions, poolId);
  const balance = poolBalance(pools, poolId, max);
  if (balance === undefined || !Number.isSafeInteger(amount) || amount < 1 || amount > balance) {
    throw new ResourceTransitionError('POOL_SPEND_UNAVAILABLE', poolId);
  }
  const remaining = balance - amount;
  return {
    pools: { ...pools, [poolId]: remaining },
    outcome: { type: 'spend-pool', poolId, amount, remaining },
  };
}

function recoverInitiativePool(pools, definitions, { poolId, reservePoolId, mode }) {
  const max = poolMaximum(definitions, poolId);
  const reserveMax = poolMaximum(definitions, reservePoolId);
  const balance = poolBalance(pools, poolId, max);
  if (poolId === reservePoolId || balance === undefined || reserveMax === undefined ||
      (mode !== 'all' && mode !== 'one-if-empty')) {
    throw new ResourceTransitionError('INITIATIVE_RECOVERY_UNAVAILABLE', poolId);
  }
  if (mode === 'one-if-empty' && balance !== 0) {
    throw new ResourceTransitionError('RECOVERY_POOL_NOT_EMPTY', poolId);
  }
  const reserve = poolBalance(pools, reservePoolId, reserveMax);
  if (!reserve) throw new ResourceTransitionError('INSUFFICIENT_RESERVE', reservePoolId);

  const remaining = mode === 'all' ? max : 1;
  return {
    pools: { ...pools, [poolId]: remaining, [reservePoolId]: reserve - 1 },
    outcome: { type: 'initiative-recovery', poolId, reservePoolId, spent: 1, restored: remaining - balance, remaining },
  };
}

function isRecord(value) {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function invalidReconciliation(poolId) {
  throw new ResourceTransitionError('INVALID_POOL_RECONCILIATION', poolId);
}

function reconciliationMax(definition, id) {
  const max = definition?.max;
  if (!Number.isSafeInteger(max) || max < 0) invalidReconciliation(id);
  return max;
}

function reconcilePools(previousDefinitions, previousPools, nextDefinitions, policy) {
  const advancing = policy === 'advance';
  if ((!advancing && policy !== 'rebuild') || !isRecord(previousDefinitions) ||
      !isRecord(previousPools) || !isRecord(nextDefinitions)) {
    invalidReconciliation();
  }

  return Object.fromEntries(Object.entries(nextDefinitions).map(([id, definition]) => {
    const max = reconciliationMax(definition, id);
    const retained = Object.hasOwn(previousDefinitions, id);
    const oldMax = retained ? reconciliationMax(previousDefinitions[id], id) : 0;
    if (!advancing && !retained) return [id, 0];

    const saved = Object.hasOwn(previousPools, id) ? previousPools[id] : undefined;
    // Advancement has historically treated a missing saved balance as zero.
    const balance = advancing ? saved ?? 0 : saved;
    if (!Number.isSafeInteger(balance)) invalidReconciliation(id);

    const available = max - (oldMax - balance);
    const cap = advancing ? max : balance;
    const reconciled = Math.max(0, Math.min(cap, available));
    if (reconciled > max) invalidReconciliation(id);
    return [id, reconciled];
  }));
}

exports.ResourceTransitionError = ResourceTransitionError;
exports.calculateCappedPoolRecovery = calculateCappedPoolRecovery;
exports.spendPool = spendPool;
exports.recoverInitiativePool = recoverInitiativePool;
exports.reconcilePools = reconcilePools;

function recoverRestPools(pools, definitions, { kind, interventionCooldown }) {
  const recovered = { ...pools };
  for (const [id, pool] of Object.entries(definitions)) {
    if (kind === 'long-rest') {
      if (id !== 'doctor:intervention' || !(interventionCooldown > 0)) recovered[id] = pool.max;
    } else {
      const recovery = pool.recovery.shortRest;
      if (recovery === 'all') recovered[id] = pool.max;
      else if (Number.isInteger(recovery)) {
        recovered[id] = calculateCappedPoolRecovery({
          current: recovered[id], maximum: pool.max, amount: recovery,
        }).remaining;
      }
    }
  }
  return recovered;
}

exports.recoverRestPools = recoverRestPools;

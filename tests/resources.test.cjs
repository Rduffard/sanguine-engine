const assert = require('node:assert/strict');
const test = require('node:test');
const { ResourceTransitionError, calculateCappedPoolRecovery, spendPool, recoverInitiativePool, reconcilePools } =
  require('@crossworld/sanguine-engine/resources');

test('capped pool recovery returns the final balance and actual recovery without mutating inputs', () => {
  const maxSafe = Number.MAX_SAFE_INTEGER;
  for (const [current, maximum, amount, remaining, recovered] of [
    [0, 6, 2, 2, 2],
    [2, 6, 0, 2, 0],
    [4, 6, 2, 6, 2],
    [5, 6, 2, 6, 1],
    [6, 6, 2, 6, 0],
    [0, 0, 2, 0, 0],
    [maxSafe - 1, maxSafe, maxSafe, maxSafe, 1],
  ]) {
    const facts = Object.freeze({ current, maximum, amount });
    const result = calculateCappedPoolRecovery(facts);
    assert.deepEqual(result, { remaining, recovered });
    assert.notStrictEqual(result, calculateCappedPoolRecovery(facts));
    assert.deepEqual(facts, { current, maximum, amount });
  }
});

const definitions = Object.freeze({
  rage: Object.freeze({ max: 5 }),
  reserve: Object.freeze({ max: 1 }),
  squall: Object.freeze({ max: 5 }),
});

function reject(transition, code, poolId) {
  assert.throws(transition, error =>
    error instanceof ResourceTransitionError && error.code === code && error.poolId === poolId);
}

test('pool spending is deterministic, immutable, and can exactly deplete a pool', () => {
  const pools = Object.freeze({ rage: 5, reserve: 1, squall: 0 });
  const operation = Object.freeze({ poolId: 'rage', amount: 5 });
  const expected = {
    pools: { rage: 0, reserve: 1, squall: 0 },
    outcome: { type: 'spend-pool', poolId: 'rage', amount: 5, remaining: 0 },
  };
  assert.deepEqual(spendPool(pools, definitions, operation), expected);
  assert.deepEqual(spendPool(pools, definitions, operation), expected);
  assert.equal(pools.rage, 5);
});

test('pool spending rejects invalid amounts, grants, and saved balances', () => {
  const pools = Object.freeze({ rage: 5, reserve: 1 });
  for (const amount of [0, -1, 1.5, '1', NaN, Infinity, 6, Number.MAX_SAFE_INTEGER + 1]) {
    reject(() => spendPool(pools, definitions, { poolId: 'rage', amount }), 'POOL_SPEND_UNAVAILABLE', 'rage');
  }
  for (const poolId of ['unknown', 'constructor', '__proto__', 'squall']) {
    reject(() => spendPool(pools, definitions, { poolId, amount: 1 }), 'POOL_SPEND_UNAVAILABLE', poolId);
  }
  for (const rage of [0, -1, 6, 1.5, '1']) {
    reject(() => spendPool({ rage }, definitions, { poolId: 'rage', amount: 1 }), 'POOL_SPEND_UNAVAILABLE', 'rage');
  }
  const max = Number.MAX_SAFE_INTEGER;
  assert.equal(spendPool({ large: max }, { large: { max } }, { poolId: 'large', amount: max }).pools.large, 0);
});

test('full Initiative recovery spends its reserve even when no uses are restored', () => {
  const operation = Object.freeze({ poolId: 'rage', reservePoolId: 'reserve', mode: 'all' });
  for (const [rage, restored] of [[0, 5], [1, 4], [5, 0]]) {
    const pools = Object.freeze({ rage, reserve: 1, squall: 2 });
    const expected = {
      pools: { rage: 5, reserve: 0, squall: 2 },
      outcome: { type: 'initiative-recovery', poolId: 'rage', reservePoolId: 'reserve', spent: 1, restored, remaining: 5 },
    };
    assert.deepEqual(recoverInitiativePool(pools, definitions, operation), expected);
    assert.deepEqual(recoverInitiativePool(pools, definitions, operation), expected);
    assert.deepEqual(pools, { rage, reserve: 1, squall: 2 });
  }
});

test('single-use Initiative recovery requires an empty pool and rejects invalid or exhausted reserves atomically', () => {
  const operation = { poolId: 'squall', reservePoolId: 'reserve', mode: 'one-if-empty' };
  assert.deepEqual(recoverInitiativePool({ squall: 0, reserve: 1 }, definitions, operation), {
    pools: { squall: 1, reserve: 0 },
    outcome: { type: 'initiative-recovery', poolId: 'squall', reservePoolId: 'reserve', spent: 1, restored: 1, remaining: 1 },
  });
  reject(() => recoverInitiativePool({ squall: 1, reserve: 0 }, definitions, operation), 'RECOVERY_POOL_NOT_EMPTY', 'squall');
  for (const reserve of [0, 2, -1, '1']) {
    const pools = Object.freeze({ squall: 0, reserve });
    reject(() => recoverInitiativePool(pools, definitions, operation), 'INSUFFICIENT_RESERVE', 'reserve');
    assert.deepEqual(pools, { squall: 0, reserve });
  }
  for (const overrides of [{ mode: 'half' }, { reservePoolId: 'missing' }, { reservePoolId: 'squall' }]) {
    reject(() => recoverInitiativePool({ squall: 0, reserve: 1 }, definitions, { ...operation, ...overrides }),
      'INITIATIVE_RECOVERY_UNAVAILABLE', 'squall');
  }
});

const poolDefinitions = maxima => Object.freeze(Object.fromEntries(
  Object.entries(maxima).map(([id, max]) => [id, Object.freeze({ max })]),
));

test('advancement preserves spent uses, grant identity, and next-definition order', () => {
  const previous = poolDefinitions({
    unchanged: 2, increased: 2, full: 5, partial: 5, depleted: 5, belowSpent: 5, zero: 2, removed: 2,
  });
  const next = poolDefinitions({
    newGrant: 3, unchanged: 2, full: 3, partial: 4, depleted: 3, increased: 3, belowSpent: 1, zero: 0,
  });
  const balances = Object.freeze({
    unchanged: 1, increased: 0, full: 5, partial: 3, depleted: 0, belowSpent: 2, zero: 2, removed: 1,
  });
  const expected = '{"newGrant":3,"unchanged":1,"full":3,"partial":2,"depleted":0,"increased":1,"belowSpent":0,"zero":0}';
  assert.equal(JSON.stringify(reconcilePools(previous, balances, next, 'advance')), expected);
  assert.equal(JSON.stringify(reconcilePools(previous, balances, next, 'advance')), expected);
});

test('rebuild never increases a retained balance and starts newly earned grants empty', () => {
  const previous = poolDefinitions({ existing: 2, full: 5, partial: 5, depleted: 5, zero: 2, removed: 2 });
  const next = poolDefinitions({ newGrant: 2, existing: 4, full: 3, partial: 4, depleted: 3, zero: 0 });
  const balances = Object.freeze({ existing: 1, full: 5, partial: 3, depleted: 0, zero: 2, removed: 1 });
  assert.equal(JSON.stringify(reconcilePools(previous, balances, next, 'rebuild')),
    '{"newGrant":0,"existing":1,"full":3,"partial":2,"depleted":0,"zero":0}');
});

test('advancement preserves legacy clamping and the nullish saved-balance fallback', () => {
  const previous = poolDefinitions({ overMax: 2, negative: 2, missing: 2, nullish: 2 });
  const next = poolDefinitions({ overMax: 3, negative: 2, missing: 3, nullish: 3 });
  assert.deepEqual(reconcilePools(previous, { overMax: 4, negative: -1, nullish: null, unknown: 10 }, next, 'advance'),
    { overMax: 3, negative: 0, missing: 1, nullish: 1 });
});

test('reconciliation rejects malformed maps, maxima, and balances with typed errors', () => {
  const definitions = poolDefinitions({ rage: 2 });
  const rejectPool = transition => reject(transition, 'INVALID_POOL_RECONCILIATION', 'rage');
  for (const max of [undefined, -1, 2.5, '2', Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    rejectPool(() => reconcilePools(definitions, { rage: 1 }, { rage: { max } }, 'advance'));
    rejectPool(() => reconcilePools({ rage: { max } }, { rage: 1 }, definitions, 'advance'));
  }
  for (const balance of [0.5, '1', NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    rejectPool(() => reconcilePools(definitions, { rage: balance }, definitions, 'advance'));
  }
  rejectPool(() => reconcilePools(definitions, {}, definitions, 'rebuild'));
  rejectPool(() => reconcilePools(definitions, { rage: 4 }, poolDefinitions({ rage: 1 }), 'rebuild'));
  reject(() => reconcilePools(definitions, null, definitions, 'advance'), 'INVALID_POOL_RECONCILIATION');
  reject(() => reconcilePools(definitions, { rage: 1 }, [], 'advance'), 'INVALID_POOL_RECONCILIATION');
  reject(() => reconcilePools(definitions, { rage: 1 }, definitions, 'other'), 'INVALID_POOL_RECONCILIATION');
});

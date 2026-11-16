const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calculateSpellSlotExpenditure, deductSpellSlot, requiresSpellRecallRoll } = require('../src/spell-slots');

test('direct deductions use the same balances as casts without Spell Recall', () => {
  for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
    for (const available of [1, 2, 3]) {
      for (const created of [0, 1, 4]) {
        const input = Object.freeze({ slotLevel, available, created });
        const deduction = deductSpellSlot(input);
        assert.deepEqual(deduction, { available: available - 1, created: Math.max(0, created - 1) });
        assert.deepEqual(calculateSpellSlotExpenditure({ ...input, recallEligible: false }),
          { ...deduction, spentSlot: true });
      }
    }
  }
});

test('direct deductions reject invalid balances and cannot spend markers at zero total', () => {
  const input = { slotLevel: 1, available: 1, created: 3 };
  for (const invalid of [{ available: 0 }, { available: 1.5 }, { slotLevel: 0 }, { slotLevel: 10 }, { slotLevel: '1' }]) {
    assert.throws(() => deductSpellSlot({ ...input, ...invalid }), {
      code: 'SPELL_SLOT_UNAVAILABLE', message: 'Choose an available spell slot',
    });
  }
  for (const invalid of [null, [], { ...input, created: -1 }, { ...input, created: undefined }]) {
    assert.throws(() => deductSpellSlot(invalid), { code: 'INVALID_SPELL_SLOT_EXPENDITURE' });
  }
});

test('expenditure matches saved-balance and Recall outcomes across levels and created markers', () => {
  for (let slotLevel = 1; slotLevel <= 9; slotLevel++) {
    for (const available of [1, 3]) {
      for (const created of [0, 1, 2]) {
        for (const recallEligible of [false, true]) {
          const input = Object.freeze({ slotLevel, available, created, recallEligible });
          const eligible = recallEligible && slotLevel <= 4;
          assert.equal(requiresSpellRecallRoll(input), eligible);
          for (const roll of eligible ? [1, 2, 3, 4] : [undefined]) {
            const preserved = roll === slotLevel;
            const expected = {
              available: preserved ? available : available - 1,
              created: preserved ? created : Math.max(0, created - 1),
              spentSlot: !preserved,
              ...(eligible ? { spellRecall: { roll, slotLevel, preserved } } : {}),
            };
            assert.deepEqual(calculateSpellSlotExpenditure(input, roll), expected);
            assert.deepEqual(calculateSpellSlotExpenditure(input, roll), expected);
          }
        }
      }
    }
  }
});

test('expenditure rejects invalid facts and rolls before returning a balance', () => {
  const input = { slotLevel: 1, available: 2, created: 1, recallEligible: true };
  for (const slotLevel of [0, -1, 10, 1.5, '1', undefined]) {
    assert.throws(() => requiresSpellRecallRoll({ ...input, slotLevel }), { code: 'SPELL_SLOT_UNAVAILABLE' });
  }
  for (const available of [0, -1, NaN, '2', undefined]) {
    assert.throws(() => requiresSpellRecallRoll({ ...input, available }), { code: 'SPELL_SLOT_UNAVAILABLE' });
  }
  for (const malformed of [null, [], { ...input, created: -1 }, { ...input, recallEligible: 1 }]) {
    assert.throws(() => requiresSpellRecallRoll(malformed), { code: 'INVALID_SPELL_SLOT_EXPENDITURE' });
  }
  for (const roll of [undefined, 0, 5, 1.5, '1']) {
    assert.throws(() => calculateSpellSlotExpenditure(input, roll), { code: 'INVALID_SPELL_RECALL_ROLL' });
  }
  assert.throws(() => calculateSpellSlotExpenditure({ ...input, slotLevel: 5 }, 1), { code: 'INVALID_SPELL_RECALL_ROLL' });
});

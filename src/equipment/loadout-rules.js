const equipmentSlots = Object.freeze(['mainHand', 'offHand', 'armor']);

function equipmentSlotEligible(slot, definition) {
  if (!definition) return false;
  return slot === 'armor' ? definition.kind === 'armor'
    : definition.kind === 'weapon' || definition.kind === 'shield' || Boolean(definition.profile?.held);
}

function equipmentGripError(grip, mainHand, offHand) {
  if (grip !== 'one' && grip !== 'two') return 'Invalid weapon grip';
  const held = [mainHand, offHand].filter(Boolean);
  if (held.filter(definition => definition.kind === 'shield').length > 1)
    return 'Only one shield can be equipped';
  if (held.some(definition => definition.hands === 2) && held.length !== 1)
    return 'Two-handed weapon conflicts with occupied hand';
  if (grip === 'two' && (!mainHand || offHand || !(mainHand.hands === 2 || mainHand.versatileDamage)))
    return 'Invalid two-hand grip';
  return null;
}

module.exports = { equipmentSlots, equipmentSlotEligible, equipmentGripError };

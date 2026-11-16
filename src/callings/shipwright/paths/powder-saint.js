function overchannelUnlocked(path, level) {
  return path === 'powder-saint' && level >= 14;
}

function overchannelCastEligible({ callingId, path, level, initiate, ritual, slotLevel, damageTypes }) {
  return !initiate && callingId === 'shipwright' && overchannelUnlocked(path, level) &&
    !ritual && Number.isSafeInteger(slotLevel) && slotLevel >= 1 && slotLevel <= 5 && damageTypes.length > 0;
}

function overchannelBacklash(previousUses, slotLevel) {
  const uses = nextOverchannelUse(previousUses);
  return { uses, diceCount: previousUses === 0 ? 0 : uses * slotLevel, sides: 12 };
}

function nextOverchannelUse(previousUses) {
  return previousUses + 1;
}

function sculptSpellsUnlocked(path, level, school) {
  return path === 'powder-saint' && level >= 6 && school === 'evocation';
}

function sculptSpellsTargetLimit(castingLevel) {
  return 1 + castingLevel;
}

function sculptSpellsTargetsEligible(targets, castingLevel, spellTargets, casterId) {
  return Array.isArray(targets) && targets.length <= sculptSpellsTargetLimit(castingLevel) &&
    new Set(targets).size === targets.length &&
    targets.every(id => typeof id === 'string' && id.trim() && id !== casterId && spellTargets?.includes(id));
}

module.exports = { overchannelUnlocked, overchannelCastEligible, overchannelBacklash, nextOverchannelUse, sculptSpellsUnlocked,
  sculptSpellsTargetLimit, sculptSpellsTargetsEligible };

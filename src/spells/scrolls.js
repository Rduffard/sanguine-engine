const { reefKnifeAdvancedMagicUnlocked: reefKnifeScrollcasting } = require('../equipment/item-effects');
const saveDCByLevel = [13, 13, 13, 15, 15, 17, 17, 18, 18, 19];

function scrollNeedsCheck(spellLevel, slotLevels, reefKnife) {
  return spellLevel > (reefKnife ? 1 : slotLevels);
}

function scrollCheckDC(spellLevel) {
  return 10 + spellLevel;
}

function resolveScrollCheck(spellLevel, roll, modifier) {
  const dc = scrollCheckDC(spellLevel);
  const checkTotal = roll + modifier;
  return { rolls: [roll], checkTotal, dc, success: checkTotal >= dc };
}

function scrollCastingModifiers(spellLevel) {
  const saveDC = saveDCByLevel[spellLevel];
  return { saveDC, attackModifier: saveDC - 8 };
}

function scrollSourceEligible(spell, callingId, casting, reefKnife) {
  return reefKnife || Boolean(casting && spell.callings.includes(callingId));
}

module.exports = { reefKnifeScrollcasting, scrollNeedsCheck, scrollCheckDC, resolveScrollCheck, scrollCastingModifiers, scrollSourceEligible };

function spellGrantEligible(spell, level) {
  if(!spell?.callings.includes('shipwright'))return false;
  return level===20?spell.level===3:spellMasterySpellEligible(spell);
}

function spellMasterySpellEligible(spell) {
  return [1, 2].includes(spell.level) && ['Action', 'Action or Ritual'].includes(spell.castingTime);
}

function spellMasteryReplacements(spells) {
  return new Set(spells.map(spell => spell.level)).size === 2;
}

function alwaysPreparedAfterMastery(alwaysPrepared, previous, selected) {
  return [...new Set([...alwaysPrepared.filter(id => !previous.includes(id)), ...selected])];
}

function shipwrightFolioCount(level) {
  return level === 1 ? 6 : 2;
}

function powderSaintSavantCount(path, level, maximum, previousMaximum) {
  if (path !== 'powder-saint') return 0;
  if (level === 3) return 2;
  return maximum > previousMaximum ? 1 : 0;
}

function folioCopyEligible(spell, casting) {
  return copiedFolioSpellEligible(spell, casting) && !casting.folio.includes(spell.id);
}

function copiedFolioSpellEligible(spell, casting) {
  return Boolean(casting && spell?.callings.includes('shipwright') && spell.level >= 1 && spell.level <= casting.slots.length);
}

function spellMasteryUnlocked(callingId, level) {
  return callingId === 'shipwright' && level >= 18;
}

function shipwrightFolioGrantAtLevel(callingId, level) {
  if (callingId !== 'shipwright') return null;
  if (level === 18) return { key: 'spellMastery', count: 2 };
  if (level === 20) return { key: 'signatureSpells', count: 2 };
  return null;
}

function folioCopyTerms(spellLevel) {
  return { costCp: spellLevel * 5000, hours: spellLevel * 2 };
}

function folioRebuildTerms(spellLevels) {
  const hours = spellLevels.reduce((total, level) => total + level, 0);
  return { costCp: hours * 1000, hours };
}

function folioMemoryAfterLoss({ prepared, alwaysPrepared, available, memorized = [] }) {
  return [...new Set([...prepared, ...alwaysPrepared].filter(id => available.includes(id) || memorized.includes(id)))];
}

function folioRebuildCandidates({ prepared, alwaysPrepared, memorized = [], unavailable = [] }) {
  return [...new Set([...prepared, ...alwaysPrepared])].filter(id => memorized.includes(id) && unavailable.includes(id));
}

module.exports = { spellGrantEligible, spellMasterySpellEligible, spellMasteryReplacements, alwaysPreparedAfterMastery, spellMasteryUnlocked,
  shipwrightFolioCount, powderSaintSavantCount, folioCopyEligible, copiedFolioSpellEligible, folioCopyTerms, folioRebuildTerms,
  shipwrightFolioGrantAtLevel,
  folioMemoryAfterLoss, folioRebuildCandidates };

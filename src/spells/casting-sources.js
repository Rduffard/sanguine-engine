function freeCastingTerms({ source, spellId, callingId, slotLevel, casting, initiate, dragonCompanion }) {
  if (initiate && source === initiate.grantKey && slotLevel === undefined) return { poolId: initiate.poolId };

  let eligible, poolId, error;
  switch (source) {
    case 'mastery':
      eligible = casting?.spellMastery.includes(spellId);
      error = 'Ineligible Spell Mastery casting';
      break;
    case 'signature':
      eligible = casting?.signatureSpells.includes(spellId);
      poolId = 'shipwright:signature:' + spellId;
      error = 'Ineligible Signature Spell';
      break;
    case 'favored-enemy':
      eligible = callingId === 'navigator' && spellId === 'hunter-s-mark';
      poolId = 'navigator:favored-enemy';
      error = 'Favored Enemy only grants Hunter’s Mark';
      break;
    case 'dragon-companion':
      eligible = dragonCompanion;
      poolId = 'omen-diver:companion';
      error = 'Dragon Companion free casting requires Omen Diver eighteen and Summon Dragon';
      break;
    case 'smite-free':
    case 'steed-free':
      eligible = callingId === 'warden' && spellId === (source === 'smite-free' ? 'divine-smite' : 'find-steed');
      poolId = 'warden:' + source;
      error = 'Wrong feature-granted spell';
      break;
    default:
      return null;
  }
  return eligible && slotLevel === undefined ? { poolId } : { error };
}

function spellAvailableFromSource({ spellId, callingId, casting, prepared, initiate, dragonCompanion, ritual }) {
  if (initiate) return [...initiate.cantrips, initiate.spell].includes(spellId);
  if (!casting) return false;
  return preparedCastingSpellIds(casting, prepared).includes(spellId) || Boolean(dragonCompanion) ||
    Boolean(ritual && callingId === 'shipwright' && casting.folio.includes(spellId));
}

function preparedCastingSpellIds(casting, prepared) {
  return [...casting.cantrips, ...prepared, ...casting.alwaysPrepared];
}

function castingSpellChoices(callingId, casting, prepared, spellById) {
  const ritualFolio = callingId === 'shipwright' ? casting.folio.filter(id => spellById(id)?.ritual) : [];
  return [...new Set([...preparedCastingSpellIds(casting, prepared), ...ritualFolio])];
}

function callingCantripEligible(spell, callingId) {
  return spell?.level === 0 && spell.callings.includes(callingId);
}

function leveledCallingSpellEligible(spell, callingId) {
  return Boolean(spell && spell.level > 0 && spell.callings.includes(callingId));
}

function leveledSpellWithinSlotLimit(spell, maximumLevel) {
  return spell.level > 0 && spell.level <= maximumLevel;
}

function ritualSourceAllowed(spell, casting, initiate) {
  return Boolean(spell.ritual && !initiate && casting);
}

const standardCastingSources = new Set([
  'intervention', 'slot', 'ritual', 'mastery', 'signature', 'favored-enemy', 'smite-free', 'steed-free', 'dragon-companion', undefined,
]);

function knownCastingSource(source, initiate) {
  return Boolean(initiate) || standardCastingSources.has(source);
}

function castingSourceError({ spell, casting, initiate, source, ritual, slotLevel, metamagic }) {
  if (ritual && !ritualSourceAllowed(spell, casting, initiate)) return 'This source has no ritual option';
  if (source === 'ritual' && !ritual) return 'Ritual source requires ritual casting';
  if (spell.level === 0 && slotLevel !== undefined) return 'Cantrips do not expend spell slots';
  if (ritual && (slotLevel !== undefined || metamagic?.length)) return 'Ritual cannot expend a slot or apply casting Metamagic';
  return null;
}

function spellTriggerTargetsEligible(trigger, { targetCount, inCombat, ownerTurnOpen }) {
  return trigger !== 'hit' || targetCount === 1 && (!inCombat || Boolean(ownerTurnOpen));
}

module.exports = { freeCastingTerms, spellAvailableFromSource, ritualSourceAllowed, knownCastingSource, castingSourceError,
  spellTriggerTargetsEligible, castingSpellChoices, callingCantripEligible, leveledCallingSpellEligible, leveledSpellWithinSlotLimit };

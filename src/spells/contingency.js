const spells = require('./definitions');
const maximumContingentSpellLevel = 5;
const selfSpells = new Set(`
  aid alter-self arcanist-s-magic-aura aura-of-life bane banishment beacon-of-hope
  bestow-curse bless blindness-deafness blink blur calm-emotions charm-monster
  charm-person chromatic-orb command comprehend-languages confusion contagion cure-wounds darkvision
  death-ward detect-evil-and-good detect-magic detect-poison-and-disease detect-thoughts
  dimension-door disguise-self dispel-evil-and-good dispel-magic dominate-person
  enhance-ability enlarge-reduce false-life fire-shield fly freedom-of-movement
  gaseous-form greater-invisibility greater-restoration guiding-bolt haste hideous-laughter
  heroism hold-monster hold-person ice-knife inflict-wounds invisibility jump levitate
  locate-animals-or-plants locate-creature locate-object longstrider mage-armor magic-missile mass-cure-wounds meld-into-stone
  mind-spike mirror-image mislead modify-memory nondetection pass-without-trace
  phantasmal-killer polymorph protection-from-energy protection-from-evil-and-good
  protection-from-poison ray-of-enfeeblement ray-of-sickness remove-curse
  resilient-sphere scorching-ray see-invisibility seeming sending slow speak-with-animals
  spider-climb stoneskin suggestion telepathic-bond tongues tree-stride
  water-breathing water-walk
`.trim().split(/\s+/));

const eligibleSpellIds = Object.freeze(spells.filter(spell =>
  spell.level >= 1 && spell.level <= maximumContingentSpellLevel &&
  ['Action', 'Action or Ritual'].includes(spell.castingTime) && selfSpells.has(spell.id)
).map(spell => spell.id));

function contingentSlotEligible(slotLevel, spellLevel) {
  return Number.isSafeInteger(slotLevel) && slotLevel >= spellLevel && slotLevel <= maximumContingentSpellLevel;
}

function contingentSlotAvailable(slots, primarySlot, contingentSlot) {
  return slots[contingentSlot - 1] > Number(contingentSlot === primarySlot);
}

function contingentSpellAvailable(spellId, { grant, prepared = [], alwaysPrepared = [], eligible = eligibleSpellIds }) {
  return eligible.includes(spellId) &&
    (grant !== undefined ? grant === spellId : prepared.includes(spellId) || alwaysPrepared.includes(spellId));
}

module.exports = { eligibleSpellIds, contingentSlotEligible, contingentSlotAvailable, maximumContingentSpellLevel, contingentSpellAvailable };

const { attributeModifier } = require('../core/attributes');
const { trainingBonusForLevel } = require('../training');
const { freeze, original, requireRule } = require('./contracts');

function form(id, name, level, size, movement, [might, agility, resolve, guard, baseHealth], attack, features = {}) {
  return {
    id, name, level, size, type: 'beast', movement, attributes: { might, agility, resolve },
    guard, baseHealth, attack: { ...attack, reach: 5, kind: 'natural' }, ...features, source: original,
  };
}

function strike(id, name, attribute, dice, damageType) {
  return { id, name, attribute, dice, damageType };
}

const bite = (attribute, dice) => strike('bite', 'Bite', attribute, dice, 'piercing');
const kick = (attribute, dice) => strike('kick', 'Kick', attribute, dice, 'bludgeoning');
const talons = dice => strike('talons', 'Talons', 'agility', dice, 'slashing');

const beastshifterForms = freeze([
  form('dock-rat', 'Dock Rat', 1, 'small', { walk: 25 }, [6, 14, 10, 12, 3], bite('agility', '1d4'), {
    senses: { darkvision: 30 }, checkAdvantages: [{ skill: 'survival', when: 'scent' }],
    capabilities: ['ordinary-climb', 'small-squeezing'],
  }),
  form('dune-hare', 'Dune Hare', 1, 'small', { walk: 40 }, [6, 16, 10, 13, 3], kick('agility', '1d4'), {
    checkAdvantages: [{ skill: 'perception', when: 'hearing' }], capabilities: ['ordinary-jump'],
  }),
  form('reef-fox', 'Reef Fox', 1, 'small', { walk: 30 }, [8, 14, 12, 12, 4], bite('agility', '1d4'), {
    senses: { darkvision: 30 }, checkAdvantages: [{ skill: 'stealth', when: 'hiding-in-natural-cover' }],
    capabilities: ['carry-one-light-item-in-mouth'],
  }),
  form('gray-wolf', 'Gray Wolf', 3, 'medium', { walk: 40 }, [14, 14, 12, 13, 6], bite('might', '1d6'), {
    checkAdvantages: [{ skill: 'survival', when: 'scent' }, { skill: 'perception', when: 'hearing' }],
    capabilities: ['ordinary-drag'],
  }),
  form('salt-antelope', 'Salt Antelope', 3, 'medium', { walk: 50 }, [14, 16, 12, 12, 6], kick('might', '1d6'), {
    capabilities: ['ordinary-jump'], restrictions: ['no-rider'],
  }),
  form('river-otter', 'River Otter', 5, 'small', { walk: 20, swim: 35 }, [8, 16, 12, 12, 5], bite('agility', '1d4'), {
    breathHoldMinutes: 5, capabilities: ['retrieve-small-loose-object-in-mouth'],
  }),
  form('harbor-seal', 'Harbor Seal', 5, 'medium', { walk: 10, swim: 40 }, [14, 12, 14, 12, 7], bite('might', '1d6'), {
    breathHoldMinutes: 10, capabilities: ['tow-one-willing-creature-within-drag-limits'],
  }),
  form('gull', 'Gull', 9, 'small', { walk: 15, fly: 40 }, [6, 16, 10, 12, 4], strike('peck', 'Peck', 'agility', '1d4', 'piercing'), {
    capabilities: ['land-on-calm-water'],
  }),
  form('night-owl', 'Night Owl', 9, 'small', { walk: 10, fly: 35 }, [6, 16, 12, 13, 5], talons('1d4'), {
    senses: { darkvision: 60 }, checkAdvantages: [{ skill: 'perception', when: 'hearing' }],
  }),
  form('ironback-boar', 'Ironback Boar', 13, 'large', { walk: 35 }, [16, 10, 16, 15, 9], strike('gore', 'Gore', 'might', '1d8', 'piercing'), {
    checkAdvantages: [{ skill: 'survival', when: 'scent' }], capabilities: ['ordinary-shove'],
  }),
  form('black-bear', 'Black Bear', 13, 'large', { walk: 35, climb: 25 }, [16, 12, 16, 14, 9], strike('claw', 'Claw', 'might', '1d8', 'slashing'), {
    capabilities: ['ordinary-drag'],
  }),
  form('sea-eagle', 'Sea Eagle', 17, 'medium', { walk: 10, fly: 50 }, [12, 16, 12, 14, 7], talons('1d6'), {
    checkAdvantages: [{ skill: 'perception', when: 'sight-in-daylight' }],
  }),
  form('deepwater-dolphin', 'Deepwater Dolphin', 17, 'large', { walk: 0, swim: 50 }, [16, 14, 14, 13, 9], strike('ram', 'Ram', 'might', '1d8', 'bludgeoning'), {
    breathHoldMinutes: 15, senses: { blindsight: 30 },
    senseRequirements: { blindsight: ['underwater', 'unobstructed-sound', 'can-hear', 'can-emit-sound'] },
    habitat: 'sufficient-water',
  }),
]);

const byId = new Map(beastshifterForms.map(entry => [entry.id, entry]));

function formAtLevel(formId, level) {
  const form = byId.get(formId);
  return form && form.level <= level ? form : undefined;
}

function animalMaximumHealth(form, level) {
  return form.baseHealth + Math.floor((level - 1) / 2);
}

function deriveBeastshifterForm(formId, level) {
  const training = trainingBonusForLevel(level);
  const form = formAtLevel(formId, level);
  requireRule(form, 'INELIGIBLE_FORM', 'formId');
  const modifier = attributeModifier(form.attributes[form.attack.attribute]);
  return freeze({
    ...form,
    maxHealth: animalMaximumHealth(form, level),
    movement: { walk: 0, swim: 0, fly: 0, climb: 0, ...form.movement },
    senses: { darkvision: 0, blindsight: 0, ...form.senses },
    attack: { ...form.attack, attackModifier: training + modifier, damageModifier: modifier },
    retainedAttributes: ['wit', 'instinct', 'spirit'],
    breathes: ['air'],
    wingedFlight: Boolean(form.movement.fly),
    hover: false,
    canCarryCreaturesInFlight: false,
    canSpeak: false,
    canCast: false,
    equipmentMerged: true,
  });
}

module.exports = { beastshifterForms, deriveBeastshifterForm, formAtLevel, animalMaximumHealth };

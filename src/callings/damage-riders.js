const { strikeRollCount } = require('../combat/strike');
const { damageOnSuccessfulSave } = require('../combat/save-damage');
const { sumDice } = require('../core/dice');
const { divineStrikeDice } = require('./doctor/tactics');

const divineStrikeDamageTypes = Object.freeze(['radiant', 'necrotic']);
const damageRiderModes = Object.freeze(['normal', 'critical', 'unarmed', 'unarmed-critical', 'miss', 'successful-save', 'marked-target-zero-health']);

function riderDamageDice(handler, mode, { doctorLevel, huntersMarkDie }) {
  const critical = mode === 'critical' || (handler !== 'rider-mark' && mode === 'unarmed-critical');
  const baseDice = handler === 'rider-divine' ? divineStrikeDice(doctorLevel) : 1;
  return {
    count: strikeRollCount(baseDice, true, handler !== 'rider-mark-secondary' && critical),
    sides: handler === 'rider-mark' || handler === 'rider-mark-secondary' ? huntersMarkDie : 8,
  };
}

function damagingCantrip(spellLevel, damageTypes) {
  return spellLevel === 0 && damageTypes.length > 0;
}

function damageRiderSpellEligible(handler, calling, school, damageTypes, affinity) {
  if (handler === 'rider-affinity') return damageTypes.includes(affinity);
  return calling === 'shipwright' && school === 'evocation' && damageTypes.length > 0;
}

function inoculatedSaveEffect() {
  return { poisonedSaveAdvantage: true, nextSaveOnly: true, durationSeconds: 3600 };
}

function riderRolledDamage(handler, rolls, chosenType) {
  const damageType = handler === 'rider-divine' ? chosenType : handler === 'rider-radiant' ? 'radiant' : 'force';
  return { damage: sumDice(rolls), damageType };
}

function riderModifierDamage(handler, modifiers, { clinical, affinity }) {
  if (handler === 'rider-potent') return { damage: modifiers[clinical], singleDamageRoll: true };
  const elemental = handler === 'rider-affinity';
  return { damage: modifiers[elemental ? 'spirit' : 'wit'], damageType: elemental ? affinity : undefined, singleDamageRoll: true };
}

function potentCantripOutcome(amount) {
  return { damage: damageOnSuccessfulSave(amount, 'half'), noAdditionalEffects: true };
}

module.exports = { riderDamageDice, damagingCantrip, damageRiderSpellEligible, inoculatedSaveEffect,
  divineStrikeDamageTypes, damageRiderModes, riderRolledDamage, riderModifierDamage, potentCantripOutcome };

const { comfortTemporaryHealth } = require('./mechanics');

const durationSeconds = Object.freeze({
  'echo-share': 3600,
  'tempest-live': 60,
  'turn-undead': 60,
  abjure: 60,
  'plague-quarantine': 60,
  'relay-place': 60,
  barrier: 60,
  'barrier-hour': 3600,
  rage: 600,
  innate: 60,
  wings: 3600,
  sense: 600,
  sacred: 600,
  nimbus: 600,
  presence: 60,
  'silent-keel': 600,
  'unseen-passage': 60,
  'envoy-parley': 60,
  'lantern-detect': 600,
  'covenant-steel': 60,
  'covenant-standard': 60,
  'starwake-guide': 60,
  'freeport-harbor': 600,
  'vigil-watch': 60,
  'vigil-dawn': 60,
});

function abilityEffectDuration(handler) {
  return durationSeconds[handler];
}

function abilityFlightSpeed(handler) {
  return ['wings', 'tempest-live'].includes(handler) ? 60 : 0;
}

function keeperHealing(doctorLevel) {
  return 2 * doctorLevel;
}

function keeperTreatmentTerms(handler, { level, discipline, instinctModifier }) {
  const rangeFeet = 30;
  if (handler === 'keeper-dawn') return { restoresHealthTo: 1, restoreFromFailedSaves: true, rangeFeet };
  if (handler === 'keeper-heal') return { healing: keeperHealing(level), requireZeroHealth: true, rangeFeet };
  return {
    stabilize: true,
    requireZeroHealth: true,
    ...(discipline === 'comfort'
      ? { temporaryHealth: comfortTemporaryHealth(instinctModifier) } : { permitsLastSentence: true }),
    rangeFeet,
  };
}

function veilEffect() {
  return { ends: 'end-of-next-turn', condition: 'invisible' };
}

function sacredWeaponLighting() {
  return { brightFeet: 20, dimBeyondFeet: 20 };
}

function intimidatingPresenceEffect(save) {
  return { targetCondition: 'frightened', repeatSave: 'end-of-target-turn', save, radiusFeet: 30 };
}

function turningConditions(handler) {
  return { targetConditions: handler === 'abjure' ? ['frightened'] : ['frightened', 'incapacitated'], endsOnTargetDamage: true };
}

function quarantineEffect() {
  return { speedMultiplier: 0.5, reactionsDisabled: true, repeatSave: 'end-of-target-turn' };
}

function plagueTargetLimit(handler) {
  return handler === 'plague-antidote' ? 2 : 1;
}

function divineChannelRange(handler) {
  return handler === 'abjure' ? 60 : 30;
}

const divineSparkDamageTypes = Object.freeze(['radiant', 'necrotic']);
const cleanBillEndedConditions = Object.freeze(['poisoned', 'blinded', 'deafened']);

function searUndeadOutcome(damage) {
  return { damage, damageType: 'radiant', searDoesNotEndTurning: true };
}

function poisonCureOutcome() {
  return { endsCondition: 'poisoned' };
}

function unseenPassageCollisionTerms() {
  return { damageType: 'force', movement: 'nearest empty space' };
}

module.exports = { abilityEffectDuration, abilityFlightSpeed, keeperHealing, keeperTreatmentTerms, veilEffect, sacredWeaponLighting,
  intimidatingPresenceEffect, turningConditions, quarantineEffect, plagueTargetLimit, divineChannelRange,
  divineSparkDamageTypes, cleanBillEndedConditions, searUndeadOutcome, poisonCureOutcome, unseenPassageCollisionTerms };

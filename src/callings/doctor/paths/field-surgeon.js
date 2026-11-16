function triageConditionOutcome(handler, level, surgicalDiscipline) {
  if (handler === 'triage-antidote') return 'poisoned';
  if (level >= 6 && surgicalDiscipline === 'trauma') return 'prone';
  return null;
}

exports.triageConditionOutcome = triageConditionOutcome;

function impossibleOperation({ selfTarget, bodyIntact, consent, deathSeconds }) {
  if (selfTarget || bodyIntact !== true || consent !== true ||
      !Number.isInteger(deathSeconds) || deathSeconds < 0 || deathSeconds > 60) return null;
  return { restoresHealthTo: 1 };
}

exports.impossibleOperation = impossibleOperation;

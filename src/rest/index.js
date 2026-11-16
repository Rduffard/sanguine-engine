const hour = 3600000;

function restDuration(kind, interruptions = 0) {
  return kind === 'long-rest' ? (8 + interruptions) * hour : hour;
}

const longRestRecoveryInterval = 24 * hour;
const restInterruptionReasons = Object.freeze(['initiative', 'non-cantrip-spell', 'damage', 'exertion-hour']);

function restInterruptionOutcome({ kind, elapsed, resume }) {
  return {
    shortRestGranted: kind === 'long-rest' && elapsed >= restDuration('short-rest'),
    resumed: kind === 'long-rest' && resume,
  };
}

function restStartHealthEligible(health, dead) {
  return health >= 1 && !dead;
}

function restCompletionTimingError(kind, elapsed, interruptions, elapsedSinceLongRest) {
  if (elapsed < restDuration(kind, interruptions)) return 'duration';
  if (kind === 'long-rest' && elapsedSinceLongRest < longRestRecoveryInterval) return 'interval';
  return null;
}

exports.restDuration = restDuration;
exports.longRestRecoveryInterval = longRestRecoveryInterval;
exports.restInterruptionReasons = restInterruptionReasons;
exports.restInterruptionOutcome = restInterruptionOutcome;
exports.restStartHealthEligible = restStartHealthEligible;
exports.restCompletionTimingError = restCompletionTimingError;

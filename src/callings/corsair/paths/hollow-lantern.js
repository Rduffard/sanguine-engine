const lanternTargetRange = 30;
const lastTellEligible = (strike) => Boolean(strike?.studyEffectId) && !strike.lastTellUsed;

function lastTellDiceEligible(indices, rollCount) {
  return Array.isArray(indices) && indices.length >= 1 && indices.length <= 3 &&
    new Set(indices).size === indices.length && indices.every(index => Number.isInteger(index) && index >= 0 && index < rollCount);
}

function lanternStudyEffect() {
  return { ends: 'end-of-next-turn', rangeFeet: lanternTargetRange, sneakWithoutAdvantage: true };
}

function lanternDetectionEffect() {
  return { detectFalseAdvantage: true, automaticReveal: false };
}

function lanternMarkEffect() {
  return { suppressesUnseenAdvantageAgainstOwner: true, ends: 'start-of-next-turn', rangeFeet: lanternTargetRange, revealsLaterLocation: false };
}

module.exports = { lanternTargetRange, lastTellEligible, lastTellDiceEligible, lanternStudyEffect, lanternDetectionEffect, lanternMarkEffect };

function echoSaveOutcome(checkTotal, roll, dc) {
  const adjustedTotal = checkTotal + roll;
  return { checkTotal: adjustedTotal, dc, success: adjustedTotal >= dc };
}

function echoVoiceLink() {
  return { rangeFeet: 30, endsBeyondRange: true, sharedLanguageRequired: false };
}

function echoSharedLink(participants) {
  return { rangeFeet: 5280, initialRangeFeet: 30, sharedLanguageRequired: false, participants };
}

function recalledPatternMovement() {
  return { feet: 10, provokesOpportunityAttacks: false, optional: true };
}

function recalledPatternCastEligible(callingId, school, savingThrow) {
  return callingId === 'tidecaller' && school === 'enchantment' && Boolean(savingThrow);
}

const echoSaveAttributes = Object.freeze(['spirit', 'instinct']);
const unwrittenSaveAttributes = Object.freeze(['wit', 'instinct', 'spirit']);
const unwrittenConditionChoices = Object.freeze(['charmed', 'frightened']);

function sharedRecollectionEligible(targetCount, trainingBonus) {
  return targetCount > 0 && targetCount <= trainingBonus;
}

function unwrittenSelfOutcome(condition, conditionSource) {
  return {
    ...(condition ? { endsCondition: condition, endsConditionSource: conditionSource, requireConditionSource: true } : {}),
    saveSucceedsInstead: true,
  };
}

module.exports = { echoSaveOutcome, echoVoiceLink, echoSharedLink, recalledPatternMovement, recalledPatternCastEligible,
  echoSaveAttributes, unwrittenSaveAttributes, unwrittenConditionChoices, sharedRecollectionEligible, unwrittenSelfOutcome };

function nextEncounterTurn(currentIndex, combatantCount, round) {
  const nextIndex = (currentIndex + 1) % combatantCount;
  return { nextIndex, round: nextIndex === 0 ? round + 1 : round };
}

function attackActionAvailable(actions, attacksRemaining) {
  return actions === 1 || attacksRemaining > 0;
}

function attacksAfterAttack(actions, attacksPerAction, attacksRemaining) {
  return actions === 1 ? (attacksPerAction ?? 1) - 1 : attacksRemaining - 1;
}

function startEncounterTurnBudget() {
  return { actions: 1, attacksRemaining: 0 };
}

function encounterMovementTotals(previous, feet, voluntary) {
  return {
    movementFeet: (previous.movementFeet ?? 0) + feet,
    voluntarySpeedFeet: voluntary ? (previous.voluntarySpeedFeet ?? 0) + feet : previous.voluntarySpeedFeet ?? 0,
  };
}

module.exports = { nextEncounterTurn, attackActionAvailable, attacksAfterAttack, startEncounterTurnBudget, encounterMovementTotals };

const { sumDice } = require('../../../core/dice');

function mangrovePredatorMovement() {
  return { feet: 10, endsHiddenOnLeavingCover: true, extraMovement: false };
}

function mangroveVanishMovement() {
  return { feet: 10, provokesOpportunityAttacks: true };
}

function mangroveSnareEffect(save) {
  return { snare: { speedFeet: 0, save }, ends: 'start-of-next-turn' };
}

function mangroveHitOutcome(rolls) {
  return { damage: sumDice(rolls), damageType: 'piercing' };
}

module.exports = { mangrovePredatorMovement, mangroveVanishMovement, mangroveSnareEffect, mangroveHitOutcome };

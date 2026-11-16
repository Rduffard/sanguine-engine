function starwakePassage(level, discipline) {
  const improved = level >= 7;
  return { speedType: discipline === 'cliff' ? 'climb' : 'swim', speedFeet: improved ? 30 : 20,
    ignoreNonmagicalDifficultTerrain: improved, extraMovement: false };
}

exports.starwakePassage = starwakePassage;

function starwakeGuideEligible(targets, ownerId) {
  return targets.length >= 1 && targets.length <= 2 && !targets.includes(ownerId);
}

function starwakeHomewardEligible(targets, ownerId) {
  return targets.length <= 2 && !targets.includes(ownerId);
}

function starwakeHomeward(targets, ownerId, destinations) {
  return { targetIds: [ownerId, ...targets], destinations, maximumFeet: 60, provokesOpportunityAttacks: false };
}

module.exports.starwakeGuideEligible = starwakeGuideEligible;
module.exports.starwakeHomewardEligible = starwakeHomewardEligible;
module.exports.starwakeHomeward = starwakeHomeward;

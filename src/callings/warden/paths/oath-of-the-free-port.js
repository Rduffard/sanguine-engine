function freePortSave(roll, modifier, dc) {
  const checkTotal = roll + modifier;
  return { checkTotal, success: checkTotal >= dc };
}

function freePortReroll(roll, previousTotal, previousRoll, dc) {
  const checkTotal = roll + previousTotal - previousRoll;
  return { checkTotal, success: checkTotal >= dc };
}

const freePortDefaultSaveDC = 15;
const freePortBreakConditions = Object.freeze(['grappled', 'restrained']);
const freePortRerollConditions = Object.freeze(['restrained', 'paralyzed']);

function freePortBreakBenefit(discipline, wardenLevel) {
  return discipline === 'refuge'
    ? { temporaryHealth: wardenLevel }
    : { movement: { feet: 10, noOpportunityAttacks: true } };
}

module.exports = { freePortSave, freePortReroll, freePortDefaultSaveDC, freePortBreakConditions,
  freePortRerollConditions, freePortBreakBenefit };

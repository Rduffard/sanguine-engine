function poisonedSaveAdvantage(paths, levels) {
  return paths.doctor === 'plaguewarden' && levels.doctor >= 6 ||
    paths.navigator === 'mangrove-stalker' && levels.navigator >= 7;
}

function outriderTraversal(level) {
  const unlocked = level >= 7;
  return { mountDismountCostFeet: unlocked ? 5 : null, ignoreRubbleAndSandDifficultTerrain: unlocked };
}

function mangroveTraversal(level) {
  const unlocked = level >= 7;
  return { poisonedSaveAdvantage: unlocked, ignoreNonmagicalPlantMovementCost: unlocked, ignoreNonmagicalPlantDamage: unlocked };
}

function starwakeSaveAdvantage(level) {
  return level >= 7 ? ['becoming-lost', 'unwilling-teleport'] : [];
}

function chainbreakerRage(level, discipline) {
  const unlocked = level >= 6;
  return {
    saveAdvantageAgainst: unlocked ? ['paralyzed', 'restrained'] : [],
    rescuerAuraFeet: unlocked && discipline === 'rescuer' ? 5 : 0,
    doubleDamageAgainstRestraints: unlocked && discipline === 'breaker',
  };
}

function brassOutriderPassingShot(path, level) {
  return path === 'brass-outrider' && level >= 10;
}

function recklessAttackUnlocked(level) {
  return level >= 2;
}

function corsairDefense(level, incapacitated) {
  return { reliableTalent: level >= 7, evasion: level >= 7 && !incapacitated, elusive: level >= 18 && !incapacitated };
}

function reaverDefense(level, incapacitated, might) {
  return { agilitySaveAdvantage: level >= 2 && !incapacitated, minimumMightTestTotal: level >= 18 ? might : null };
}

function callingSenses(paths, levels, incapacitated) {
  if (levels.navigator >= 18) return { blindsight: 30 };
  if (paths.corsair === 'hollow-lantern' && levels.corsair >= 13 && !incapacitated) return { blindsight: 10 };
  return {};
}

function livingTempestBenefits(damageType) {
  return {
    immunity: damageType,
    resistance: damageType === 'lightning' ? 'thunder' : 'lightning',
    stormMovement: { throughCreaturesAsDifficultTerrain: true, cannotEndInsideCreature: true },
  };
}

function innateSorceryCasting({ saveDC }) {
  return { saveDC: saveDC + 1, attackAdvantage: true };
}

function primalKnowledgeUnlocked(level) {
  return level >= 3;
}

function preciseHunterUnlocked(level) {
  return level >= 17;
}

function rageDefenseBenefits() {
  return { resistances: ['bludgeoning', 'piercing', 'slashing'], mightAdvantage: true };
}

function recklessAttackBenefits(recklessAttack, elusive) {
  return { recklessAttack, attacksAgainstHaveAdvantage: recklessAttack && !elusive };
}

function concentrationAdvantage(feats, extendedSpellActive) {
  return feats.includes('steady-channel') || extendedSpellActive;
}

module.exports = { poisonedSaveAdvantage, outriderTraversal, mangroveTraversal, starwakeSaveAdvantage, chainbreakerRage,
  brassOutriderPassingShot, recklessAttackUnlocked, corsairDefense, reaverDefense, callingSenses,
  livingTempestBenefits, innateSorceryCasting, primalKnowledgeUnlocked, preciseHunterUnlocked, rageDefenseBenefits,
  recklessAttackBenefits, concentrationAdvantage };

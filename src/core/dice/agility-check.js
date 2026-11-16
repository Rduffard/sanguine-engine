const { d20RollCount } = require('./roll-count');

function agilitySkillRules(summary, restrictions, skillId, toolId) {
  const trainedSkill = summary.training.includes(skillId);
  const trainedTool = toolId !== undefined && summary.equipmentTraining.tools.includes(toolId);
  const stealth = skillId === 'stealth';
  const advantage = Boolean(stealth && summary.silentKeelStealth || trainedSkill && trainedTool);
  const disadvantage = Boolean(summary.conditions?.includes('poisoned') ||
    restrictions.physicalD20Disadvantage || stealth && restrictions.stealthDisadvantage);
  return {
    advantage,
    disadvantage,
    rollCount: d20RollCount(advantage, disadvantage),
    minimumNatural: summary.reliableTalent && (trainedSkill || trainedTool) ? 10 : -Infinity,
    modifier: summary.skillModifiers[skillId] + (trainedTool && !trainedSkill ? summary.trainingBonus : 0),
  };
}

function hideOutcome(checkTotal) {
  const dc = 15;
  return { dc, success: checkTotal >= dc };
}

const coverLevels = Object.freeze(['none', 'half', 'three-quarters', 'total']);
const hideModes = Object.freeze(['cover', 'heavy-obscurement']);

function stealthCoverEligible(cover) {
  return cover === 'three-quarters' || cover === 'total';
}

module.exports = { agilitySkillRules, hideOutcome, coverLevels, hideModes, stealthCoverEligible };

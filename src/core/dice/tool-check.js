const { trainingContribution, normalizeToolTraining } = require('../../training');
const { exhaustionD20Penalty } = require('../../saving-throws');
const { cinderSafeHandlingUnlocked } = require('../../callings/gunslinger/paths/cinder-artillerist');
const { breakwaterReinforcementUnlocked } = require('../../callings/shipwright/paths/breakwater');
const { stormBrokerToolAdvantage } = require('../../callings/navigator/paths/storm-broker');

const toolCheckTasks = Object.freeze(['general', 'inspect-explosives', 'reinforce-structure', 'covert-repair',
  'sabotage', 'predict-weather', 'interpret-signals']);

function toolCheckTraining(summary, toolId, skillId) {
  return {
    toolTrained: summary.equipmentTraining.tools.some(id => normalizeToolTraining(id) === toolId),
    skillTrained: skillId ? summary.training.includes(skillId) : false,
    expertise: summary.toolExpertise.some(id => normalizeToolTraining(id) === toolId) ||
      Boolean(skillId && summary.expertise.includes(skillId)),
  };
}

function toolCheckCircumstances(summary, { task, attribute, skillId, toolTrained, skillTrained, advantage, disadvantage }) {
  const { paths, callingLevels } = summary;
  const featureAdvantage = task === 'inspect-explosives' && cinderSafeHandlingUnlocked(paths.gunslinger, callingLevels.gunslinger) ||
    task === 'reinforce-structure' && breakwaterReinforcementUnlocked(paths.shipwright, callingLevels.shipwright) ||
    paths.navigator === 'storm-broker' && stormBrokerToolAdvantage(task, attribute, summary.pathSelections.navigator?.stormDiscipline);
  const hasDisadvantage = Boolean(disadvantage || summary.conditions.includes('poisoned'));
  return {
    featureAdvantage: Boolean(featureAdvantage),
    advantage: Boolean(advantage || toolTrained && skillTrained || attribute === 'might' && summary.mightAdvantage ||
      featureAdvantage || skillId === 'stealth' && summary.silentKeelStealth),
    hasDisadvantage,
    checkArmor: !hasDisadvantage && ['might', 'agility'].includes(attribute),
  };
}

function toolCheckModifiers({ attribute, attributeModifier, trainingBonus, toolTrained, skillTrained, expertise, exhaustion,
  tradeBonus, reliableTalent, minimumMightTestTotal }) {
  const trained = toolTrained || skillTrained;
  return {
    modifier: attributeModifier + trainingContribution(trainingBonus, { trained, expertise }) - exhaustionD20Penalty(exhaustion ?? 0) + tradeBonus,
    minimumNatural: reliableTalent && trained ? 10 : 1,
    minimumTotal: attribute === 'might' ? minimumMightTestTotal ?? -10000 : -10000,
  };
}

module.exports = { toolCheckModifiers, toolCheckTasks, toolCheckTraining, toolCheckCircumstances };

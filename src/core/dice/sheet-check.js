const { exhaustionD20Penalty } = require('../../saving-throws');
const { stormBrokerToolAdvantage } = require('../../callings/navigator/paths/storm-broker');
const { cinderSafeHandlingUnlocked } = require('../../callings/gunslinger/paths/cinder-artillerist');

function sheetCheckRules(summary, equipment, {
  modifier, attribute, skillId, savingThrow = false, stealth = false,
  rollMode = 'normal', primalKnowledge = false, task = 'general',
}) {
  const exhaustion = exhaustionD20Penalty(summary.exhaustion ?? 0);
  if (!savingThrow && primalKnowledge && summary.rageSkillModifiers?.[skillId] !== undefined) {
    modifier = summary.rageSkillModifiers[skillId] - exhaustion;
    attribute = 'might';
  } else if (!savingThrow && !skillId) {
    // Projected skill and save modifiers already include Exhaustion.
    modifier -= exhaustion;
  }

  const physical = ['might', 'agility', 'resolve'].includes(attribute);
  const conditions = summary.conditions ?? [];
  const shroudedStealth = !savingThrow && skillId === 'stealth' && summary.silentKeelStealth;
  const advantage = shroudedStealth
    || rollMode === 'advantage'
    || (savingThrow && attribute === 'agility' && summary.agilitySaveAdvantage)
    || (!savingThrow && (
      (attribute === 'might' && summary.mightAdvantage)
      || (skillId === 'athletics' && summary.athleticsAdvantage)
      || (task === 'inspect-explosives' && cinderSafeHandlingUnlocked(summary.paths.gunslinger, summary.callingLevels.gunslinger))
      || (task === 'detect-false' && summary.detectFalseAdvantage)
      || (summary.paths.navigator === 'storm-broker' && stormBrokerToolAdvantage(task, attribute, summary.pathSelections.navigator?.stormDiscipline))
    ));
  const disadvantage = rollMode === 'disadvantage'
    || (physical && equipment?.restrictions.physicalD20Disadvantage)
    || (stealth && equipment?.restrictions.stealthDisadvantage)
    || (!savingThrow && conditions.includes('poisoned'))
    || (savingThrow && attribute === 'agility' && conditions.includes('restrained'));
  return {
    modifier,
    advantage,
    disadvantage,
    minimumNatural: skillId && summary.reliableTalent && summary.training.includes(skillId) ? 10 : 1,
    minimumTotal: attribute === 'might' ? summary.minimumMightTestTotal ?? -10000 : -10000,
  };
}

exports.sheetCheckRules = sheetCheckRules;

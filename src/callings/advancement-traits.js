const { attributeModifier } = require('../core/attributes');
const { trainingContribution } = require('../training');
const { paths: pathDefinitions } = require('./roster');

function advancementSkillModifier({ skill, scores, trainingBonus, trained, expertise, doctor }) {
  const clinicalBonus = doctor?.divineOrder === 'thaumaturge' && ['arcana', 'religion'].includes(skill.id)
    ? Math.max(1, attributeModifier(scores[doctor.clinicalAttribute ?? 'instinct']))
    : 0;
  return attributeModifier(scores[skill.attribute]) + trainingContribution(trainingBonus, { trained, expertise }) + clinicalBonus;
}

function advancementResistances(levels, paths, choices) {
  return [...new Set([
    choices.navigator?.stormResistance,
    choices.tidecaller?.element,
    ...Object.entries(paths).flatMap(([callingId, pathId]) => {
      const design = pathDefinitions.find(path => path.id === pathId)?.design;
      const granted = (design?.resistances ?? []).filter(([level]) => levels[callingId] >= level).map(([, type]) => type);
      if (pathId === 'tempest-heart' || (pathId === 'thunderhide' && levels[callingId] >= 6)) {
        granted.push(choices[callingId]?.pathDiscipline);
      }
      return granted;
    }),
  ].filter(Boolean))];
}

function advancementInitiative({ agility, trainingBonus, feats, levels, paths }) {
  return {
    modifier: attributeModifier(agility) + (feats.includes('alert') ? trainingBonus : 0),
    advantage: (levels.reaver ?? 0) >= 7 || paths.gunslinger === 'deadeye',
  };
}

module.exports = { advancementSkillModifier, advancementResistances, advancementInitiative };

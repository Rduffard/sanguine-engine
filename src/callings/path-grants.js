const { gunslingerLevelGrants } = require('./gunslinger/rules');

function designedPathGrants(path, level, discipline) {
  if (!path?.design || level !== 3) return {};
  const skills = {
    'black-flag-envoy': discipline === 'intimidation' ? 'intimidation' : 'persuasion',
    'hollow-lantern': discipline === 'watcher' ? 'perception' : 'investigation',
    'brass-outrider': gunslingerLevelGrants(level, path.id, discipline).skill,
    'memory-echo': discipline === 'voice' ? 'deception' : 'insight',
  };
  const tools = {
    'starwake-pilot': 'navigators-tools',
    plaguewarden: 'herbalism-kit',
    'sparkwrite-aetherist': 'tinkers-tools',
  };
  return { skill: skills[path.id], tool: tools[path.id] };
}

exports.designedPathGrants = designedPathGrants;

const specialtyTools = {
  'drydock-ghost': ['thieves-tools', 'carpenters-tools'],
  'storm-broker': ['navigators-tools'],
  breakwater: ['masons-tools', 'carpenters-tools'],
  'field-surgeon': ['healers-kit', 'herbalism-kit'],
};

function pathSpecialtyTools(pathId, level) {
  return level === 3 ? [...(specialtyTools[pathId] ?? [])] : [];
}

exports.pathSpecialtyTools = pathSpecialtyTools;

function pathAdvancementChoices(pathId, level) {
  if (pathId === 'storm-broker' && level === 7) return { stormResistance: ['lightning', 'thunder'] };
  if (pathId === 'field-surgeon' && level === 3) return { clinicalAttribute: ['wit', 'instinct'] };
  return {};
}

exports.pathAdvancementChoices = pathAdvancementChoices;

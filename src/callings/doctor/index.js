const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/sanctuary-hand.json'),
  require('./paths/field-surgeon.json'),
  require('./paths/plaguewarden.json'),
  require('./paths/keeper-of-last-breaths.json'),
];

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: [...features, ...paths.flatMap(entry => entry.features)],
};

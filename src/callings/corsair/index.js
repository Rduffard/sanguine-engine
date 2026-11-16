const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/reef-knife.json'),
  require('./paths/black-flag-envoy.json'),
  require('./paths/hollow-lantern.json'),
  require('./paths/saltglass-duelist.json'),
];

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: [...features, ...paths.flatMap(entry => entry.features)],
};

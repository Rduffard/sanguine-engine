const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/leviathan-anchor.json'),
  require('./paths/oath-of-the-free-port.json'),
  require('./paths/iron-covenant.json'),
  require('./paths/lantern-vigil.json'),
];

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: [...features, ...paths.flatMap(entry => entry.features)],
};

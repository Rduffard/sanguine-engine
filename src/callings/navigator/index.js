const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/gray-net.json'),
  require('./paths/storm-broker.json'),
  require('./paths/starwake-pilot.json'),
  require('./paths/mangrove-stalker.json'),
];

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: [...features, ...paths.flatMap(entry => entry.features)],
};

const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/omen-diver.json'),
  require('./paths/memory-echo.json'),
  require('./paths/tempest-heart.json'),
  require('./paths/sanguine-conduit.json'),
];

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: [...features, ...paths.flatMap(entry => entry.features)],
};

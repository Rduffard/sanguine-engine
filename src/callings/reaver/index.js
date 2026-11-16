const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/bloodwake.json'),
  require('./paths/thunderhide.json'),
  require('./paths/chainbreaker.json'),
  require('./paths/reef-colossus.json'),
];

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: [...features, ...paths.flatMap(entry => entry.features)],
};

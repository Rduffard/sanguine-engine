const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/powder-saint.json'),
  require('./paths/drydock-ghost.json'),
  require('./paths/breakwater.json'),
  require('./paths/sparkwrite-aetherist.json'),
];

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: [...features, ...paths.flatMap(entry => entry.features)],
};

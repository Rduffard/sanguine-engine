const { definition, timeline, features } = require('./definition.json');
const paths = [
  require('./paths/deadeye.json'),
  require('./paths/iron-suppressor.json'),
  require('./paths/brass-outrider.json'),
  require('./paths/cinder-artillerist.json'),
];

const byId = new Map([...features, ...paths.flatMap(entry => entry.features)].map(feature => [feature.id, feature]));

module.exports = {
  definition,
  timeline,
  paths: paths.map(entry => entry.path),
  features: require('./feature-order.json').map(id => byId.get(id)),
};

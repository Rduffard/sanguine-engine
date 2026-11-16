const { gunslinger } = require('./gunslinger/rules');
const order = require('./catalog-order.json');

const roster = {
  corsair: require('./corsair'),
  gunslinger: gunslinger,
  navigator: require('./navigator'),
  tidecaller: require('./tidecaller'),
  warden: require('./warden'),
  reaver: require('./reaver'),
  doctor: require('./doctor'),
  shipwright: require('./shipwright'),
};

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

function inCatalogOrder(key) {
  const entries = Object.values(roster).flatMap(calling => calling[key]);
  const byId = new Map(entries.map(entry => [entry.id, entry]));
  if (byId.size !== entries.length || new Set(order[key]).size !== entries.length || order[key].length !== entries.length) {
    throw new Error('Invalid Calling catalog order: ' + key);
  }
  return order[key].map(id => {
    if (!byId.has(id)) throw new Error('Missing Calling catalog entry: ' + id);
    return byId.get(id);
  });
}

const callings = Object.fromEntries(Object.entries(roster).map(([id, calling]) => [id, calling.definition]));
const timelines = Object.fromEntries(Object.entries(roster).map(([id, calling]) => [id, calling.timeline]));
const prepared = {
  navigator: [
    2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15,
  ],
  warden: [
    2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15,
  ],
  tidecaller: [
    2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
  ],
  doctor: [
    4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22,
  ],
  shipwright: [
    4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25,
  ],
};
// Independent transcription of SRD 5.2.1 spell slot tables (pp. 26, 53, 58, 65, 36, 77).
const fullSlots = [
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
const halfSlots = [
  [2],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];
const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-$/, " ")
    .trim();

module.exports = freeze({ roster, callings, timelines, prepared, fullSlots, halfSlots, slug,
  paths: inCatalogOrder('paths'), features: inCatalogOrder('features') });

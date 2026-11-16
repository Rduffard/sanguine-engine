const spells = require('./definitions');

for (const spell of spells) {
  Object.freeze(spell.callings);
  Object.freeze(spell.source);
  Object.freeze(spell);
}

module.exports = Object.freeze({ spells: Object.freeze(spells), profiles: require('./profiles'), materials: require('./materials') });

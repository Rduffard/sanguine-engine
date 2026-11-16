const { items } = require('./index');

const weaponGroups = Object.freeze({
  "martial:finesse-or-light": items
    .filter(w => w.kind === "weapon" && w.category === "martial" &&
      w.properties.some(p => ["finesse", "light"].includes(p.id))).map(w => w.id),
});

module.exports = weaponGroups;

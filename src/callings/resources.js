const { gunslingerResources } = require('./gunslinger/rules');
const { numerical } = require('./progression');
const rules = require('./roster');
const { attributeModifier } = require('../core/attributes');
const { derivePathResourceCapacity } = require('../progression');

const scalingPathResources = new Map([
  ['drydock-ghost', 'ghost-work'],
  ['storm-broker', 'squall'],
  ['field-surgeon', 'triage'],
  ['breakwater', 'bastion'],
]);

function resourcePools(levels, scores, paths) {
  const pools = {};
  const add = (id, key, max, shortRest = 0) => {
    if (max > 0)
      pools[`${id}:${key}`] = {
        id: `${id}:${key}`,
        max,
        recovery: { longRest: "all", shortRest },
      };
  };
  for (const [id, n] of Object.entries(levels)) {
    if (id === "gunslinger") {
      Object.assign(pools, gunslingerResources(n, paths[id]));
      continue;
    }
    const v = numerical(id, n);
    if (id === "reaver") {
      add(id, "rage", v.rageUses, 1);
      if (n >= 15) add(id, 'persistent-reserve', 1);
    }
    if (id === "navigator") {
      add(id, "favored-enemy", v.favoredEnemyUses);
      if (n >= 10) add(id, "tireless", Math.max(1, attributeModifier(scores.instinct)));
      if (n >= 14) add(id, "natures-veil", Math.max(1, attributeModifier(scores.instinct)));
    }
    if (id === "tidecaller") {
      add(id, "sorcery-points", v.sorceryPoints);
      if (n >= 5) add(id, "restoration", 1);
      add(id, "innate-sorcery", 2);
      if (paths[id] === "omen-diver" && n >= 14) add('omen-diver', "wings", 1);
      if (paths[id] === "omen-diver" && n >= 18) add('omen-diver', "companion", 1);
    }
    if (id === "warden") {
      add(id, "lay-on-hands", v.layOnHands);
      add(id, "channel-divinity", v.channelDivinityUses, 1);
      if (n >= 2) add(id, "smite-free", 1);
      if (n >= 5) add(id, "steed-free", 1);
      if (paths[id] === "leviathan-anchor" && n === 20)
        add('leviathan-anchor', "nimbus", 1);
    }
    if (id === "doctor") {
      add(id, "channel-divinity", v.channelDivinityUses, 1);
      if (n >= 10) add(id, "intervention", 1);
      if (n === 20)
        pools["doctor:intervention"].recovery.longRest =
          "after-Wish-cooldown";
    }
    if (id === "shipwright") add(id, "arcane-recovery", 1);
    const pathId = paths[id];
    const scalingKey = scalingPathResources.get(pathId);
    if (scalingKey) add(pathId, scalingKey, derivePathResourceCapacity({ level: n, unlockLevel: 3 }), 1);
    if (pathId === "drydock-ghost" && n >= 6) add(pathId, "salvage", 1);
    if (pathId === "storm-broker" && n >= 15) add(pathId, "eye-reserve", 1);
    if (pathId === "field-surgeon" && n >= 17) add(pathId, "operation", 1);
    if (pathId === "breakwater" && n >= 14) add(pathId, "hold-sea", 1);
    if (id === "corsair" && n === 20) add(id, "stroke-of-luck", 1, "all");
    if (paths[id] === "bloodwake" && n >= 14)
      add('bloodwake', "presence", 1);
    const path = rules.paths.find(p => p.id === paths[id]);
    for (const [key, spec] of Object.entries(path?.pools ?? {}))
      if (n >= (spec.level ?? 3)) add(path.id, key, spec.max, spec.short ?? 0);
  }
  return pools;
}
module.exports = { resourcePools };

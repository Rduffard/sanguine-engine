function breakwaterBarrier(level, trainingBonus, fortification, witModifier) {
  const harborGeometry = level >= 10;
  return {
    maximumPassers: harborGeometry ? trainingBonus : 0,
    width: harborGeometry ? 20 : 10,
    height: harborGeometry ? 10 : 5,
    canBend: harborGeometry,
    resistance: level >= 14 ? 'all-except-force-and-siege' : null,
    guard: 15 + (fortification === 'bulwark' ? Math.max(1, witModifier) : 0),
    maximumHealth: (level >= 14 ? 10 : level >= 6 ? 7 : 5) * level,
    cover: harborGeometry ? 'three-quarters' : 'half',
  };
}

exports.breakwaterBarrier = breakwaterBarrier;

function breakwaterReinforcementUnlocked(path, level) {
  return path === 'breakwater' && level >= 6;
}

exports.breakwaterReinforcementUnlocked = breakwaterReinforcementUnlocked;

function resolveConstructedObjectDamage({ kind, level, amount, damageType, siege, health }) {
  let damage = amount;
  if (['poison', 'psychic'].includes(damageType)) damage = 0;
  else if (kind === 'barrier' && level >= 14 && damageType !== 'force' && !siege) damage = Math.floor(damage / 2);
  return { damage, remainingHealth: Math.max(0, health - damage) };
}

exports.resolveConstructedObjectDamage = resolveConstructedObjectDamage;

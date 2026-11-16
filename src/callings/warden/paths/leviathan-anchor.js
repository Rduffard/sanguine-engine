function smiteOfProtectionUnlocked(spellId, path, level) {
  return spellId === 'divine-smite' && path === 'leviathan-anchor' && level >= 15;
}

function smiteOfProtectionAura(level) {
  return { halfCover: true, radiusFeet: level >= 18 ? 30 : 10 };
}

module.exports = { smiteOfProtectionUnlocked, smiteOfProtectionAura };

function leviathanBurden(incomingDamage) {
  const transferredDamage = Math.floor(incomingDamage / 2);
  return { transferredDamage, allyDamage: incomingDamage - transferredDamage };
}

module.exports.leviathanBurden = leviathanBurden;

function magicModifiers(profiles) {
  return {
    guardBonus: profiles.reduce((n, profile) => n + (profile.guardBonus ?? 0), 0),
    saveBonus: profiles.reduce((n, profile) => n + (profile.saveBonus ?? 0), 0),
    attackBonus: profiles.reduce((n, profile) => n + (profile.spellAttackBonus ?? 0), 0),
    ignoreHalfCover: profiles.some(profile => profile.ignoreHalfCover),
    waterBreathing: profiles.some(profile => profile.waterBreathing),
    swimSpeed: Math.max(0, ...profiles.map(profile => profile.swimSpeed ?? 0)),
  };
}

module.exports = { magicModifiers };

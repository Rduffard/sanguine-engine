const { paths: pathDefinitions } = require('../callings/roster');

function advancementMovement(levels, paths, selectedFeats) {
  const pathSpeed = Object.entries(paths).reduce((total, [callingId, pathId]) => {
    const speed = pathDefinitions.find(path => path.id === pathId)?.design?.speed ?? [];
    return total + speed.reduce((bonus, [level, feet]) => bonus + (levels[callingId] >= level ? feet : 0), 0);
  }, 0);
  return {
    walk: 30 + (selectedFeats.includes('seasoned-voyager') ? 5 : 0) +
      ((levels.reaver ?? 0) >= 5 ? 10 : 0) + ((levels.navigator ?? 0) >= 6 ? 10 : 0) + pathSpeed,
    climb: paths.corsair === 'reef-knife' || (levels.navigator ?? 0) >= 6 ? 'walk' : 0,
    swim: (levels.navigator ?? 0) >= 6 ? 'walk' : 0,
    fly: paths.tidecaller === 'tempest-heart' && levels.tidecaller >= 14 ? 30 : 0,
    heavyArmorRemovesCallingSpeedBonuses: true,
  };
}

module.exports = { advancementMovement };

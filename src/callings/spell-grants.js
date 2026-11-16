const { slug } = require('./roster');

function pathPreparedGrants(path, level) {
  return Object.entries(path?.spellsByCallingLevel ?? {})
    .filter(([unlockLevel]) => Number(unlockLevel) <= level)
    .flatMap(([, names]) => names.map(slug));
}

function acquiredCallingFeatures(features, paths, levels, chosenPaths) {
  const pathIds = new Set(Object.values(chosenPaths));
  return features.filter(feature => feature.ownerType === 'calling'
    ? feature.callingLevel <= (levels[feature.ownerId] ?? 0)
    : pathIds.has(feature.ownerId) && feature.callingLevel <=
      (levels[paths.find(path => path.id === feature.ownerId).callingId] ?? 0));
}

function callingPreparedGrants(calling, level) {
  if (calling === 'navigator') return ['hunter-s-mark'];
  if (calling !== 'warden' || level < 2) return [];
  return level >= 5 ? ['divine-smite', 'find-steed'] : ['divine-smite'];
}

function omenDiverBonusHealth(path, level) {
  return path === 'omen-diver' ? level : 0;
}

module.exports = { callingPreparedGrants, pathPreparedGrants, acquiredCallingFeatures, omenDiverBonusHealth };

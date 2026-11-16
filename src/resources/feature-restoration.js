const featureRestorations = Object.freeze([
  { poolId: 'omen-diver:wings', costPoolId: 'tidecaller:sorcery-points', cost: 3 },
  { poolId: 'tidecaller:innate-sorcery', costPoolId: 'tidecaller:sorcery-points', cost: 2, tidecallerLevel: 7 },
  { poolId: 'bloodwake:presence', costPoolId: 'reaver:rage', cost: 1 },
  { poolId: 'leviathan-anchor:nimbus', slotLevel: 5, bonusAction: false },
  { poolId: 'oath-of-the-free-port:open-harbor', slotLevel: 5, bonusAction: true },
  { poolId: 'iron-covenant:standard', slotLevel: 5, bonusAction: true },
  { poolId: 'lantern-vigil:dawn', slotLevel: 5, bonusAction: true },
].map(Object.freeze));

function featureRestoration(poolId) {
  return featureRestorations.find(restoration => restoration.poolId === poolId);
}

function restorationSlotLevel(poolId) {
  return featureRestoration(poolId)?.slotLevel;
}

function featureRestorationError(restoration, { poolId, resources, pools, slots, tidecallerLevel, slotLevel }) {
  if (!resources[poolId] || pools[poolId] !== 0) return 'Feature must be exhausted';
  if (restoration?.tidecallerLevel && tidecallerLevel < restoration.tidecallerLevel) return 'Sorcery Incarnate required';
  if (restoration?.costPoolId) {
    const balance = pools[restoration.costPoolId];
    if (!Number.isSafeInteger(balance) || balance < restoration.cost)
      return 'Insufficient feature resource: ' + restoration.costPoolId;
  } else {
    const level = restoration?.slotLevel;
    if (level === undefined || slotLevel !== level || !slots?.[level - 1]) return 'Level five slot required';
  }
  return null;
}

module.exports = { featureRestorations, featureRestoration, restorationSlotLevel, featureRestorationError };

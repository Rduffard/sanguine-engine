// SRD 5.2.1 healing clauses; all spatial and casting-completion facts are GM adjudicated.
const profiles={
  'cure-wounds':{dice:2,sides:8,perLevel:2,modifier:true,targets:1},
  'healing-word':{dice:2,sides:4,perLevel:2,modifier:true,targets:1},
  'mass-healing-word':{dice:2,sides:4,perLevel:1,modifier:true,targets:6},
  'mass-cure-wounds':{dice:5,sides:8,perLevel:1,modifier:true,targets:6},
  'prayer-of-healing':{dice:2,sides:8,perLevel:1,targets:5,prayerRest:true},
  heal:{flat:70,perLevel:10,targets:1,endsConditions:['blinded','deafened','poisoned']},
  'mass-heal':{budget:700,targets:100,endsConditions:['blinded','deafened','poisoned']},
  regenerate:{dice:4,sides:8,flat:15,perLevel:0,targets:1,ticks:true},
  'power-word-heal':{full:true,targets:1,endsConditions:['charmed','frightened','paralyzed','poisoned','stunned']},
};

function healingDiceCount(profile, level, baseLevel) {
  return (profile.dice ?? 0) + (profile.dice ? (level - baseLevel) * (profile.perLevel ?? 0) : 0);
}

function healingSpellAmount(profile, { level, baseLevel, rolledTotal, castingModifier, bonus }) {
  const flatScaling = profile.dice ? 0 : (level - baseLevel) * (profile.perLevel ?? 0);
  return Math.max(0, rolledTotal + (profile.flat ?? 0) + flatScaling + (profile.modifier ? castingModifier : 0) + bonus);
}

function healingAllocationWithinBudget(allocations, budget) {
  return healingAllocationTotal(allocations) <= budget;
}

function healingAllocationTotal(allocations) {
  return allocations.reduce((total, entry) => total + entry.amount, 0);
}

function healingAllocationsWithBonus(allocations, bonus) {
  return allocations.map(entry => ({ ...entry, amount: entry.amount + bonus }));
}

const healingPhases = Object.freeze(['initial', 'regeneration-turn']);

function healingTargetsEligible(targets, limit, recordedTargets) {
  return Array.isArray(targets) && targets.length > 0 && targets.length <= limit &&
    new Set(targets).size === targets.length && targets.every(id => recordedTargets?.includes(id));
}

module.exports = { profiles, healingDiceCount, healingSpellAmount, healingAllocationWithinBudget, healingAllocationsWithBonus,
  healingPhases, healingTargetsEligible, healingAllocationTotal, regenerationHealing: 1 };

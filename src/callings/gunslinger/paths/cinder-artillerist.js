function cinderExemptionLimit(level, witModifier) {
  return level >= 10 ? Math.max(1, witModifier) : 0;
}

function cinderAllySaveAdvantageUnlocked(level) {
  return level >= 7;
}

function cinderSafeHandlingUnlocked(path, level) {
  return path === 'cinder-artillerist' && level >= 7;
}

function cinderResolutions({ level, self, affected, areas, exemptions, objects, allies, rolls, discipline, save }) {
  return affected.map(targetId=>{
    const index=areas.findIndex(a=>a.targetIds.includes(targetId)),exempt=exemptions.includes(targetId),object=objects.includes(targetId);
    const rolled=rolls[index].reduce((a,b)=>a+b,0),damage=exempt?0:rolled*(object&&discipline==='breach'?2:1);
    return {targetId,areaId:areas[index].pointId,damage,damageType:'fire',exempt,
      save:object?null:{...save,successDamage:Math.floor(damage/2),advantage:cinderAllySaveAdvantageUnlocked(level)&&(targetId===self||allies.includes(targetId))},
      ignoresFireResistance:object&&discipline==='breach'&&level>=15,
      smokeAffected:!exempt&&discipline==='smoke'};
  });
}

function cinderRadiusEligible(level, radius) {
  return radius === 5 || (radius === 10 && level >= 10);
}

function cinderChargeProfile(grandBattery) {
  return grandBattery ? { areaCount: 2, rangeFeet: 60 } : { areaCount: 1, rangeFeet: 30 };
}

function cinderSmokeProfile(level) {
  const lingering = level >= 15;
  return { radiusFeet: lingering ? 10 : 5, dispersalWindMph: 20, obscurement: 'heavy',
    durationSeconds: lingering ? 60 : 0, ends: lingering ? null : 'start-of-next-turn' };
}

function cinderEquipmentError(hasSmithTools, heldCount, grip) {
  if (!hasSmithTools) return 'Charges require carried smith tools';
  return heldCount >= 2 || grip === 'two' ? 'Charges require a free hand' : null;
}

module.exports = { cinderExemptionLimit, cinderResolutions, cinderRadiusEligible, cinderAllySaveAdvantageUnlocked,
  cinderSafeHandlingUnlocked, cinderChargeProfile, cinderSmokeProfile, cinderEquipmentError };

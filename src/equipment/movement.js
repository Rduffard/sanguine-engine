function equipmentMovement(summary, definition, { swimSpeeds, activeFlySpeed }) {
  const movement = { ...summary.movement };
  const swim = movement.swim;
  if(definition?.category==='heavy'){
    const speedBonus=(summary.callingLevels.reaver>=5?10:0)+(summary.callingLevels.navigator>=6?10:0)+(summary.paths.gunslinger==='brass-outrider'&&summary.callingLevels.gunslinger>=7?10:0);movement.walk=Math.max(0,movement.walk-speedBonus);
    if(summary.paths.tidecaller==='tempest-heart'&&summary.callingLevels.tidecaller>=14)movement.fly=activeFlySpeed;
  }
  if(definition?.mightRequirement&&summary.attributes.might<definition.mightRequirement)movement.walk=Math.max(0,movement.walk-10);
  if(summary.paths.reaver==='reef-colossus'&&summary.callingLevels.reaver>=6&&summary.raging&&!summary.reefSkinSuppressed&&definition?.category!=='heavy')movement.walk=Math.max(0,movement.walk-5);
  movement.swim=Math.max(swim==='walk'?movement.walk:swim,...swimSpeeds);
  return movement;
}

exports.equipmentMovement = equipmentMovement;

function exhaustedMovement(speed, walkingSpeed, exhaustion) {
  return Math.max(0, (speed === 'walk' ? walkingSpeed : speed) - 5 * exhaustion);
}

exports.exhaustedMovement = exhaustedMovement;

function maximumGrantedMovement(speed, grants) {
  return grants.reduce((maximum, grant) => Math.max(maximum, grant ?? 0), speed);
}

exports.maximumGrantedMovement = maximumGrantedMovement;

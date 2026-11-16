const cunning=[
  {id:'poison',level:5,cost:1,save:'resolve',condition:'poisoned',durationSeconds:60,repeatSave:'end-of-target-turn'},
  {id:'trip',level:5,cost:1,save:'agility',condition:'prone'},
  {id:'withdraw',level:5,cost:1,halfSpeedMovement:true,noOpportunityAttacks:true},
  {id:'stealth-attack',level:9,cost:1,path:'reef-knife',preservesHide:true},
  {id:'daze',level:14,cost:2,save:'resolve',targetTurnRestriction:'Choose movement, one Action or one Bonus Action on the next turn'},
  {id:'knock-out',level:14,cost:6,save:'resolve',condition:'unconscious',durationSeconds:60,repeatSave:'end-of-target-turn',endsOnTargetDamage:true},
  {id:'obscure',level:14,cost:3,save:'agility',condition:'blinded',ends:'end-of-target-next-turn'},
];
const brutal=[
  {id:'forceful-blow',level:9,pushFeet:15,halfSpeedMovement:true,noOpportunityAttacks:true,movementDirection:'straight toward the target'},
  {id:'hamstring-blow',level:9,speedReductionFeet:15,ends:'start-of-next-turn',stacking:'replace previous Hamstring Blow'},
  {id:'staggering-blow',level:13,nextSaveDisadvantage:true,noOpportunityAttacks:true,ends:'start-of-next-turn'},
  {id:'sundering-blow',level:13,nextOtherCreatureAttackBonus:5,ends:'start-of-next-turn',stacking:'one Sundering bonus per attack'},
];
const optionsByKind = { cunning, brutal };

function availableStrikeOptions(kind, level, corsairPath, options = optionsByKind[kind]) {
  return (options ?? []).filter(option => level >= option.level && (!option.path || corsairPath === option.path));
}

module.exports = { availableStrikeOptions };

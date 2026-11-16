const profiles={
  acid:{action:'attack-replacement',consume:true,rangeFeet:20,dice:[2,6],damageType:'acid',save:true},
  'alchemists-fire':{action:'attack-replacement',consume:true,rangeFeet:20,dice:[1,4],damageType:'fire',save:true,burningOnFailure:true},
  'holy-water':{action:'attack-replacement',consume:true,rangeFeet:20,dice:[2,8],damageType:'radiant',save:true,fiendOrUndeadOnly:true},
  net:{action:'attack-replacement',consume:true,rangeFeet:15,save:true,deployed:true,restrainedOnFailure:true,hugeOrLargerAutoSucceeds:true,escapeDC:10,objectGuard:10,objectHealth:5,immunities:['bludgeoning','poison','psychic']},
  'ball-bearings':{action:'utilize',consume:true,deployed:true,recoverMinutes:10,rangeFeet:10,areaFeet:10,saveDC:10,proneOnFailure:true},
  caltrops:{action:'utilize',consume:true,deployed:true,recoverMinutes:10,rangeFeet:5,areaFeet:5,saveDC:15,damage:1,damageType:'piercing',speedZeroUntilTargetTurn:true},
  'hunting-trap':{action:'utilize',consume:true,deployed:true,recoverMinutes:0,saveDC:13,dice:[1,4],damageType:'piercing',speedZeroUntilTargetTurn:true,chainFeet:3,escapeDC:13,failedEscapeDamage:1},
  antitoxin:{action:'bonus',consume:true,antitoxin:true,durationSeconds:3600},
  'healing-potion':{action:'bonus',consume:true,healing:[2,4,2]},
  'healer-kit':{action:'utilize',kitCharge:true,stabilize:true},
  torch:{action:'utilize',consume:true,durationSeconds:3600,brightFeet:20,dimBeyondFeet:20},
  candle:{action:'utilize',consume:true,durationSeconds:3600,brightFeet:5,dimBeyondFeet:5},
  'basic-poison':{action:'bonus',consume:true,durationSeconds:60,weaponPoison:true},
};

module.exports = profiles;

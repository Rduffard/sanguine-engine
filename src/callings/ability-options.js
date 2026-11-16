const { gunslingerAbilityDefinitions, gunslingerAbilityPreview } = require('./gunslinger/rules');
const definitions = {
  ...gunslingerAbilityDefinitions,
  ...require('./corsair/abilities'),
  ...require('./navigator/abilities'),
  ...require('./tidecaller/abilities'),
  ...require('./warden/abilities'),
  ...require('./reaver/abilities'),
  ...require('./doctor/abilities'),
  ...require('./shipwright/abilities'),
};
function preview(handler,summary){
  const {callingLevels:levels,attributeModifiers,spellcasting}=summary;
  if(handler==='envoy-parley')return {save:{attribute:'instinct',dc:8+summary.trainingBonus+attributeModifiers.spirit}};
  if(handler==='triage'){
    const level=levels.doctor;
    return {roll:{label:'Healing',count:level>=17?6:level>=6?3:2,sides:8,bonus:level,unit:'Health'},kitCharges:1};
  }
  if(handler==='triage-antidote')return {kitCharges:1};
  if(handler==='impossible-operation')return {kitCharges:5};
  if(handler==='ghost-repair'){
    const level=levels.shipwright;
    return {roll:{label:'Object repair',count:level>=14?5:level>=10?4:level>=6?3:2,sides:8,bonus:level,unit:'Health'}};
  }
  const gunslinger = gunslingerAbilityPreview(handler, {
    level: levels.gunslinger, trainingBonus: summary.trainingBonus, wit: attributeModifiers.wit,
    agility: attributeModifiers.agility, corridorDcBonus: summary.corridorDcBonus,
  });
  if (gunslinger) return gunslinger;
  if(handler==='tactical-mind')return {roll:{label:'Failed check bonus',count:1,sides:10,bonus:0}};
  if(handler==='tireless')return {roll:{label:'Temporary Health',count:1,sides:8,bonus:attributeModifiers.instinct}};
  if(handler==='spark-damage'||handler==='spark-heal'){
    const level=levels.doctor,healing=handler==='spark-heal';
    const attribute=summary.pathSelections.doctor?.clinicalAttribute??'instinct';
    return {
      roll:{label:healing?'Healing':'Damage',count:level>=18?4:level>=13?3:level>=7?2:1,sides:8,bonus:attributeModifiers[attribute],
        ...(healing?{unit:'Health',maximum:summary.paths.doctor==='sanctuary-hand'&&level>=17}:{})},
      ...(!healing?{save:{attribute:'resolve',dc:spellcasting.doctor.saveDC}}:{}),
    };
  }
  if(handler==='turn-undead'){
    const attribute=summary.pathSelections.doctor?.clinicalAttribute??'instinct';
    return {save:{attribute:'instinct',dc:spellcasting.doctor.saveDC},
      ...(levels.doctor>=5?{roll:{label:'Optional Sear Undead damage',count:Math.max(1,attributeModifiers[attribute]),sides:8,bonus:0}}:{})};
  }
  if(handler==='abjure')return {save:{attribute:'instinct',dc:spellcasting.warden.saveDC}};
  if(handler==='plague-quarantine')return {save:{attribute:'resolve',dc:spellcasting.doctor.saveDC}};
  if(handler==='clean-bill')return {roll:{label:'Healing',count:6,sides:8,bonus:levels.doctor,unit:'Health'},kitCharges:1};
  if(handler==='relay-discharge')return {
    roll:{label:'Lightning damage',count:levels.shipwright>=14?6:4,sides:8,bonus:0},
    save:{attribute:'agility',dc:spellcasting.shipwright.saveDC},
  };
  if(handler==='presence')return {save:{attribute:'instinct',dc:8+summary.trainingBonus+attributeModifiers.might}};
  if(handler==='barrier-reduce')return {roll:{label:'Damage reduction',count:levels.shipwright>=14?4:2,sides:8,bonus:attributeModifiers.wit}};
  if(handler==='unseen-consequence')return {roll:{label:'Force damage',count:1,sides:10,bonus:0}};
  if(handler==='starwake-hit')return {roll:{label:'Extra damage',count:1,sides:8,bonus:0}};
  if(handler==='mangrove-hit')return {
    roll:{label:'Extra Piercing damage',count:levels.navigator>=11?2:1,sides:6,bonus:0},
    ...(summary.pathSelections.navigator?.pathDiscipline==='snare'?{save:{attribute:'might',dc:spellcasting.navigator.saveDC}}:{}),
  };
  if(handler==='stormhide-leap'&&levels.reaver>=10)return {save:{label:'Thunderous Landing',attribute:'might',dc:8+summary.trainingBonus+attributeModifiers.might}};
  if(handler==='stormhide-pulse')return {
    roll:{label:'Damage at the start of an enemy turn',count:3,sides:6,bonus:0},
    save:{attribute:'resolve',dc:8+summary.trainingBonus+attributeModifiers.might},
  };
  if(handler==='colossus-deck')return {
    roll:{label:'Bludgeoning damage',count:levels.reaver>=14?5:3,sides:8,bonus:0},
    save:{attribute:'might',dc:8+summary.trainingBonus+attributeModifiers.might},
  };
  if(handler==='chainbreaker-rally')return {roll:{label:'Temporary Health',count:1,sides:8,bonus:attributeModifiers.resolve}};
  if(handler==='echo-save')return {roll:{label:'Failed save bonus',count:1,sides:6,bonus:0}};
  if(handler==='vigil-hit')return {roll:{label:'Extra damage',count:levels.warden>=15?2:1,sides:6,bonus:0}};
  if(handler==='vigil-dawn-damage')return {fixed:{label:'Damage',amount:Math.max(1,summary.trainingBonus+attributeModifiers.spirit),unit:'Radiant'}};
  if(handler==='tempest-pulse'||handler==='tempest-damage')return {
    fixed:{label:handler==='tempest-pulse'?'Damage':'Spell damage bonus',
      amount:handler==='tempest-pulse'?Math.max(1,attributeModifiers.spirit):attributeModifiers.spirit,
      unit:summary.pathSelections.tidecaller.pathDiscipline},
  };
}
function list(summary){
  return summary.features.flatMap(f=>{
    const entries=definitions[f.id]??[];
    return entries.filter(e=>(e[4]!=='rider-divine'||summary.pathSelections.doctor?.blessedStrikes==='divine-strike')&&(!['rider-potent','rider-vitality'].includes(e[4])||summary.pathSelections.doctor?.blessedStrikes==='potent-spellcasting')&&(e[4]!=='covenant-sentinel'||summary.pathSelections.warden?.pathDiscipline==='sentinel')&&(e[4]!=='triage-antidote'||summary.pathSelections.doctor?.surgicalDiscipline==='toxicology')&&(e[4]!=='relay-move'||summary.pathSelections.shipwright?.pathDiscipline==='mobile')&&(!e[4].startsWith('plague-')||summary.pathSelections.doctor?.pathDiscipline===e[4].slice(7))).map(([key,name,action,costs,handler])=>({
      id:f.id+'#'+key,featureId:f.id,key,name,action,costs:costs.map(([poolId,amount])=>({poolId,amount})),handler,
      description:f.description,completionRules:f.completionRules,source:f.source,preview:preview(handler,summary)??null,
    }));
  });
}

module.exports = { list };

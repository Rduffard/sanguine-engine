const attributes = ['might','agility','resolve','wit','instinct','spirit'];
const tools = ['thieves-tools','herbalism-kit','navigators-tools','carpenters-tools','masons-tools','smiths-tools','tinkers-tools','poisoners-kit','calligraphers-supplies','musical-instrument','gaming-set'];
const backgrounds = [
  {id:'deckhand',name:'Deckhand',attributes:['might','agility','resolve'],skills:['athletics','survival'],tool:'navigators-tools',feat:'savage-attacker',items:['Rope (50 feet)','Common Clothes',"Navigator's Tools"],gold:10},
  {id:'dock-artisan',name:'Dock Artisan',attributes:['might','wit','resolve'],skills:['investigation','history'],tool:'carpenters-tools',feat:'skilled',items:["Carpenter's Tools",'Common Clothes'],gold:10},
  {id:'archive-apprentice',name:'Archive Apprentice',attributes:['wit','instinct','spirit'],skills:['arcana','history'],tool:'calligraphers-supplies',feat:'magic-initiate',list:'shipwright',items:["Calligrapher's Supplies",'Ink','10 Paper Sheets'],gold:10},
  {id:'field-medic',name:'Field Medic',attributes:['wit','instinct','resolve'],skills:['medicine','insight'],tool:'herbalism-kit',feat:'alert',items:['Herbalism Kit','Healer Kit','Common Clothes'],gold:10},
  {id:'free-agent',name:'Free Agent',attributes:['agility','wit','spirit'],skills:['stealth','deception'],tool:'thieves-tools',feat:'skilled',items:["Thieves' Tools",'Common Clothes'],gold:10},
  {id:'oath-witness',name:'Oath Witness',attributes:['might','instinct','spirit'],skills:['religion','persuasion'],tool:'musical-instrument',feat:'magic-initiate',list:'doctor',items:['Musical Instrument','Holy Symbol','Common Clothes'],gold:10},
  {id:'custom',name:'Custom',attributes,skills:[],tool:null,feat:null,items:[],gold:50},
];

module.exports = { creationAttributes: attributes, backgroundTools: tools, backgrounds };

const options = require('./metamagic-options');
const profiles = require('./profiles');
const { empoweredSpellRerollLimit } = require('../callings/mechanics');

const metamagicRerollOptions = Object.freeze(['empowered-spell', 'seeking-spell']);
const transmutedSpellDamageTypes = Object.freeze(['acid', 'cold', 'fire', 'lightning', 'poison', 'thunder']);

function metamagicNeedsSavingThrow(option) {
  return option === 'careful-spell' || option === 'heightened-spell';
}

function empoweredDiceSelectionEligible(indices, diceCount, spiritModifier) {
  return Array.isArray(indices) && indices.length > 0 &&
    new Set(indices).size === indices.length && indices.length <= empoweredSpellRerollLimit(spiritModifier) &&
    indices.every(index => Number.isSafeInteger(index) && index >= 0 && index < diceCount);
}

class MetamagicRuleError extends Error {}

function validate({ known, active, level, spiritModifier }, selected, spell, params = {}) {
  const fail = message => { throw new MetamagicRuleError(message); };
  const limit=active&&level>=7?2:1;
  const ordinary=selected.filter(id=>!metamagicRerollOptions.includes(id));
  if(ordinary.length>limit||selected.some(id=>!known.includes(id)||!options.some(o=>o.id===id)))fail('Unavailable Metamagic combination');
  if(selected.includes('quickened-spell')&&!['Action','Action or Ritual'].includes(spell.castingTime))fail('Quickened requires Action casting');
  const profile=profiles[spell.id];
  if(selected.some(id=>metamagicRerollOptions.includes(id)))fail('Apply Empowered after a damage roll or Seeking after a missed spell attack using the saved casting');
  if(selected.includes('distant-spell')&&profile.range.kind!=='touch'&&!(profile.range.feet>=5))fail('Distant requires Touch or a range of at least five feet');
  if(selected.includes('extended-spell')&&profile.durationSeconds<60)fail('Extended requires a duration of at least one minute');
  if(selected.includes('twinned-spell')&&!profile.twinnable)fail('Twinned requires higher-slot additional targets');
  if(selected.includes('heightened-spell')&&(!profile.savingThrow||typeof params.heightenedTarget!=='string'||!params.heightenedTarget.trim()))fail('Heightened requires one target of a spell with saving throws');
  if(selected.includes('transmuted-spell')&&(!transmutedSpellDamageTypes.includes(params.damageType)||!transmutedSpellDamageTypes.includes(params.originalDamageType)||params.damageType===params.originalDamageType||!profile.damageTypes.includes(params.originalDamageType)))fail('Choose different eligible original and replacement damage types');
  if(selected.includes('careful-spell')&&(!profile.savingThrow||!Array.isArray(params.exemptTargets)||new Set(params.exemptTargets).size!==params.exemptTargets.length||params.exemptTargets.some(id=>typeof id!=='string'||!id.trim()||id.length>100)||params.exemptTargets.length>Math.max(1,spiritModifier)))fail('Careful requires distinct saving targets within your Spirit limit');
  let free=params.freeMetamagic;
  if(free&&(!active||!arcaneApotheosisUnlocked(level)||!selected.includes(free)))fail('Arcane Apotheosis unavailable');
  return selected.reduce((sum,id)=>sum+(id===free?0:options.find(o=>o.id===id).cost),0);
}
function project(spell,selected,params={},slotLevel=spell.level){
  const profile=structuredClone(profiles[spell.id]);
  if(spell.id==='hunter-s-mark')profile.durationSeconds=slotLevel>=5?86400:slotLevel>=3?28800:3600;
  if(selected.includes('distant-spell'))profile.range={kind:'distance',feet:profile.range.kind==='touch'?30:profile.range.feet*2};
  if(selected.includes('extended-spell'))profile.durationSeconds=Math.min(86400,profile.durationSeconds*2);
  if(selected.includes('subtle-spell'))profile.components=spell.specificMaterial||profile.consumedMaterial?['M']:[];
  if(selected.includes('transmuted-spell'))profile.damageTypes=profile.damageTypes.map(id=>id===params.originalDamageType?params.damageType:id);
  return {...profile,castingTime:selected.includes('quickened-spell')?'Bonus Action':spell.castingTime,
    targetScalingLevel:slotLevel+(selected.includes('twinned-spell')?1:0),
    ...(selected.includes('careful-spell')?{carefulTargets:params.exemptTargets,carefulNoHalfDamage:true}:{}),
    ...(selected.includes('heightened-spell')?{heightenedTarget:params.heightenedTarget,disadvantageOnAllSaves:true}:{}),
    concentrationAdvantage:selected.includes('extended-spell')&&spell.concentration};
}
module.exports = { options, validate, project, MetamagicRuleError };
module.exports.metamagicRerollOptions = metamagicRerollOptions;
module.exports.transmutedSpellDamageTypes = transmutedSpellDamageTypes;
module.exports.metamagicNeedsSavingThrow = metamagicNeedsSavingThrow;
module.exports.empoweredDiceSelectionEligible = empoweredDiceSelectionEligible;


const metamagicOptionIds = Object.freeze(options.map(option => option.id));

function metamagicChoicesAtLevel(level) {
  return [2, 10, 17].includes(level) ? { count: 2, options: metamagicOptionIds } : null;
}

function metamagicReplacementAvailable(callingId, level) {
  return callingId === 'tidecaller' && level > 2;
}

function replaceMetamagic(known, { from, to }) {
  if (!known.includes(from) || known.includes(to) || !metamagicOptionIds.includes(to)) return null;
  return known.map(id => id === from ? to : id);
}

module.exports.metamagicChoicesAtLevel = metamagicChoicesAtLevel;
module.exports.metamagicReplacementAvailable = metamagicReplacementAvailable;
module.exports.replaceMetamagic = replaceMetamagic;
function arcaneApotheosisUnlocked(level) {
  return level >= 20;
}

module.exports.arcaneApotheosisUnlocked = arcaneApotheosisUnlocked;

// Typed priced/consumed materials from the complete SA-CHAR-1 spell reference.
// [material kind, minimum value in GP per unit, quantity, consumed, per target].
const rows={
  bless:[['holy-symbol',5]],
  'protection-from-evil-and-good':[['holy-water',25,1,true]],
  augury:[['divinatory-tokens',25]],'continual-flame':[['ruby-dust',50,1,true]],
  'gentle-repose':[], 'warding-bond':[['platinum-ring',50,2]],
  clairvoyance:[['clairvoyance-focus',100]],'glyph-of-warding':[['powdered-diamond',200,1,true]],
  'magic-circle':[['salt-and-powdered-silver',100,1,true]],revivify:[['diamond',300,1,true]],
  divination:[['incense',25,1,true]],'greater-restoration':[['diamond-dust',100,1,true]],
  hallow:[['incense',1000,1,true]],'legend-lore':[['incense',250,1,true],['ivory-strip',50,4]],
  'planar-binding':[['jewel',1000,1,true]],'raise-dead':[['diamond',500,1,true]],
  scrying:[['scrying-focus',1000]],'create-undead':[['black-onyx',150,1,false,true]],
  'find-the-path':[['divination-tools',100]],forbiddance:[['ruby-dust',1000]],
  'heroes-feast':[['gem-encrusted-bowl',1000,1,true]],'true-seeing':[['mushroom-powder',25,1,true]],
  'plane-shift':[['attuned-forked-metal-rod',250]],resurrection:[['diamond',1000,1,true]],
  'holy-aura':[['reliquary',1000]],'astral-projection':[['jacinth',1000,1,true,true],['silver-bar',100,1,true,true]],
  gate:[['diamond',5000]],'true-resurrection':[['diamonds',25000,1,true]],
  nondetection:[['diamond-dust',25,1,true]],stoneskin:[['diamond-dust',100,1,true]],
  'chromatic-orb':[['diamond',50]],'teleportation-circle':[['rare-inks',50,1,true]],
  'circle-of-death':[['crushed-black-pearl-powder',500]],'find-familiar':[['incense',10,1,true]],
  identify:[['pearl',100]],'illusory-script':[['ink',10,1,true]],'arcane-lock':[['gold-dust',25,1,true]],
  'magic-mouth':[['jade-dust',10,1,true]],'secret-chest':[['rare-material-chest',5000],['tiny-chest-replica',50]],
  'summon-dragon':[['engraved-dragon-object',500]],contingency:[['self-statuette',1500]],
  'guards-and-wards':[['silver-rod',10]],'instant-summons':[['sapphire',1000]],
  'magic-jar':[['gem-crystal-or-reliquary',500]],'programmed-illusion':[['jade-dust',25]],
  'arcane-sword':[['miniature-sword',250]],forcecage:[['ruby-dust',1500,1,true]],
  'magnificent-mansion':[['miniature-door',15]],'project-image':[['self-statuette',5]],
  sequester:[['gem-dust',5000,1,true]],simulacrum:[['powdered-ruby',1500,1,true]],
  clone:[['diamond',1000,1,true],['sealable-cloning-vessel',2000]],
  imprisonment:[['target-statuette',5000]],shapechange:[['jade-circlet',1500]],
};
const requirements=Object.fromEntries(Object.entries(rows).map(([id,entries])=>[id,entries.map(([kind,gp,count=1,consumed=false,perTarget=false])=>({kind,minValueCp:gp*100,count,consumed,perTarget}))]));
const items=[...new Map(Object.values(requirements).flat().filter(r=>r.kind!=='holy-symbol').map(r=>{
  const id='component-'+r.kind+'-'+r.minValueCp;
  return [id,{id,name:r.kind.replaceAll('-',' ')+' ('+r.minValueCp/100+' GP)',kind:'gear',version:1,costCp:r.minValueCp,
    componentKind:r.kind,componentValueCp:r.minValueCp,weightLb:null,stackable:true,automation:{melee:false},source:{document:'SA-CHAR-1 spells.md',section:'Priced components'}}];
})).values()];

function allocateSpellMaterials(requirementsForSpell, selected, targetCount, definition) {
  const quantities = new Map(selected.map(item => [item.instanceId, item.quantity]));
  const used = new Set();
  const consumed = [];
  for (const requirement of requirementsForSpell) {
    let remaining = requirement.count * (requirement.perTarget ? Math.max(1, targetCount) : 1);
    for (const item of selected) {
      const spec = definition(item.definitionId);
      if ((spec.componentKind ?? spec.id) !== requirement.kind ||
          (spec.componentValueCp ?? spec.costCp) < requirement.minValueCp) continue;
      const available = quantities.get(item.instanceId);
      const quantity = Math.min(remaining, available);
      remaining -= quantity;
      used.add(item.instanceId);
      if (requirement.consumed) {
        quantities.set(item.instanceId, available - quantity);
        consumed.push({ instanceId: item.instanceId, quantity });
      }
      if (!remaining) break;
    }
    if (remaining) return { error: 'Missing ' + remaining + ' ' + requirement.kind + ' worth at least ' + requirement.minValueCp + ' cp each' };
  }
  if (selected.some(item => !used.has(item.instanceId))) return { error: 'A selected component does not satisfy this spell' };
  return { consumed };
}

function spellMaterialCopperCost(spellId) {
  return spellId === 'gentle-repose' ? 2 : 0;
}

module.exports = { requirements, items, allocateSpellMaterials, spellMaterialCopperCost };

const { freeze, original } = require('./contracts');

const castingAttributes = ['wit', 'instinct', 'spirit'];
const sizes = ['small', 'medium'];

function srd(entry) {
  return {
    document: 'System Reference Document', version: '5.2.1', entry,
    author: 'Wizards of the Coast LLC', license: 'CC BY 4.0',
    url: 'https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    adaptation: 'Adapted rules and terminology for Sanguine Archipelago',
  };
}

const traitId = (lineage, trait) => `lineage:${lineage}:${trait}`;

function lineage(id, name, description, source, traits, details = {}) {
  return {
    id, name, description, source, type: 'humanoid', size: 'medium', movement: { walk: 30 },
    ...details, traits: traits.map(([key, name]) => ({ id: traitId(id, key), name })),
  };
}

const lineages = freeze([
  lineage('human', 'Human', 'Humans carry the trades and traditions of their ports into every new crew.', srd('Human'), [
    ['inspiration', 'Make Tomorrow Count'], ['skill', 'Quick Study'], ['origin-feat', 'Many Trades'],
  ], { size: null, choices: { size: sizes, skill: 'catalog', originFeat: 'origin-feat' } }),
  lineage('fishmen', 'Fishmen', 'Fishmen move with equal ease between submerged gardens and busy island harbors.',
    { ...original, inspiration: '5e aquatic lineages' }, [
      ['breathing', 'Two-Water Breath'], ['darkvision', 'Deepwater Eyes'], ['cold-resistance', 'Coldwater Hide'],
      ['current-speech', 'Current Speech'], ['innate-spells', 'Pressure Song'],
    ], { movement: { walk: 30, swim: 30 }, darkvision: 60, resistances: ['cold'],
      choices: { castingAttribute: castingAttributes }, spells: ['fog-cloud', 'gust-of-wind', 'water-walk'] }),
  lineage('stoneborn', 'Stoneborn', 'Stoneborn can listen through the same rock that carries the impact of a dropped tool.',
    srd('Dwarf'), [
      ['darkvision', 'Deep Sight'], ['poison-defense', 'Hard to Poison'], ['health', 'Built to Endure'],
      ['stone-listening', 'Stone Listening'],
    ], { darkvision: 120, resistances: ['poison'], saveAdvantages: ['poisoned'] }),
  lineage('fey-touched', 'Fey-Touched', 'Small inherited wonders follow the Fey-Touched through thicket, port and quiet watch.',
    srd('Elf'), [
      ['reverie', 'Waking Reverie'], ['charmed-defense', 'Old Accord'], ['skill', 'Keen Ear'],
      ['innate-spells', 'Inherited Current'],
    ], {
      darkvision: 60, saveAdvantages: ['charmed'],
      choices: { heritage: ['gloam', 'glasslight', 'greenwake'], skill: ['insight', 'perception', 'survival'],
        castingAttribute: castingAttributes },
      heritages: {
        gloam: { name: 'Gloam', darkvision: 120, spells: ['dancing-lights', 'faerie-fire', 'darkness'] },
        glasslight: { name: 'Glasslight', spells: ['prestidigitation', 'detect-magic', 'misty-step'] },
        greenwake: { name: 'Greenwake', walk: 35, spells: ['druidcraft', 'longstrider', 'pass-without-trace'] },
      },
    }),
  lineage('beastshifters', 'Beastshifters', 'Beastshifters take animal bodies to scout, travel and help their companions.',
    { ...original, inspiration: 'Wild Shape' }, [
      ['skill', 'Instinct Training'], ['transform', 'Animal Form'], ['revert', 'Revert'],
      ['primal-recovery', 'Primal Recovery'],
    ], { size: null, choices: { size: sizes, skill: ['acrobatics', 'athletics', 'intimidation', 'survival'],
      formId: 'level-one-form' } }),
  lineage('changelings', 'Changelings', 'Rare Changelings carry several faces and voices through the same life.',
    { ...original, inspiration: '5e shapechanging lineages' }, [
      ['skills', 'Social Training'], ['shapechange', 'Change Appearance'],
    ], { type: 'fey', size: null, choices: { size: sizes,
      skills: { count: 2, options: ['deception', 'insight', 'intimidation', 'performance', 'persuasion'] } } }),
]);

const lineagesById = new Map(lineages.map(entry => [entry.id, entry]));

module.exports = { lineages, getLineage: id => lineagesById.get(id), traitId };

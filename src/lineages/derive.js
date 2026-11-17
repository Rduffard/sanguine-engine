const { trainingBonusForLevel } = require('../training');
const { spellCastingNumbers } = require('../spells/casting-numbers');
const { spells } = require('../spells');
const { getLineage, traitId } = require('./definitions');
const { validateLineageSelection } = require('./selection');
const { beastshifterFormChoices, validKnownForms } = require('./form-progression');
const { requireRule, freeze } = require('./contracts');

const spellLevels = new Map(spells.map(spell => [spell.id, spell.level]));
const unlockLevels = [1, 3, 5];

function longRestPool(id, max) {
  return { id, max, recovery: { longRest: 'all', shortRest: 0 } };
}

function deriveLineage(selection, level, context = {}) {
  const trainingBonus = trainingBonusForLevel(level);
  const validation = validateLineageSelection(selection, context);
  requireRule(validation.selection, 'INVALID_LINEAGE_SELECTION', validation.issues[0]?.field);
  const { id, size, choices = {} } = validation.selection;
  const lineage = getLineage(id);
  const heritage = lineage.heritages?.[choices.heritage];
  const result = {
    id, size: lineage.size ?? size, type: lineage.type, traits: lineage.traits, source: lineage.source,
    movement: { walk: heritage?.walk ?? lineage.movement.walk, swim: lineage.movement.swim ?? 0, climb: 0, fly: 0 },
    senses: { darkvision: heritage?.darkvision ?? lineage.darkvision ?? 0 },
    trainedSkills: choices.skills ?? (choices.skill ? [choices.skill] : []),
    maxHealthAdjustment: id === 'stoneborn' ? level : 0,
    damageResistances: lineage.resistances ?? [],
    saveAdvantages: (lineage.saveAdvantages ?? []).map(conditionId => ({ conditionId, when: ['avoid', 'end'] })),
    breathes: id === 'fishmen' ? ['air', 'water'] : ['air'],
    pools: [],
    spells: [],
  };

  if (id === 'human') {
    result.originFeat = { ...choices.originFeat, grantKey: traitId(id, 'origin-feat') };
    result.longRestGrants = [{ kind: 'heroic-inspiration', amount: 1 }];
  }
  if (id === 'fishmen') {
    result.communication = { direction: 'outgoing', content: 'simple-ideas',
      creatureTypes: ['beast', 'elemental', 'monstrosity'], requiresSwimSpeed: true };
  }
  if (id === 'stoneborn') result.pools.push(longRestPool(traitId(id, 'stone-listening'), trainingBonus));
  if (id === 'fey-touched') {
    result.heritage = choices.heritage;
    result.restModes = [{ id: 'waking-reverie', hours: 4, conscious: true }];
    result.requiresSleep = false;
    result.magicalSleepImmune = true;
  }
  if (id === 'beastshifters') {
    const progression = beastshifterFormChoices(level);
    const knownForms = context.knownForms ?? (level < 3 ? [choices.formId] : undefined);
    requireRule(knownForms === undefined || validKnownForms(knownForms, level) &&
      (level >= 3 || knownForms[0] === choices.formId), 'INVALID_KNOWN_FORMS', 'knownForms');
    result.animalForms = { initialFormId: choices.formId, knownCount: progression.knownCount,
      knownForms: knownForms ? [...knownForms] : null };
    result.pools.push(longRestPool(traitId(id, 'transform'), progression.usesPerLongRest));
  }
  if (id === 'changelings') {
    result.appearanceChange = { action: 'action', sizes: lineage.choices.size, preservesType: true,
      sameLimbArrangement: true, changesVoice: true, changesEquipment: false, duration: 'indefinite' };
  }

  const spellsByTier = heritage?.spells ?? lineage.spells ?? [];
  const attribute = choices.castingAttribute;
  const score = context.attributes?.[attribute];
  if (attribute && context.attributes !== undefined) {
    requireRule(Number.isSafeInteger(score) && score > 0, 'INVALID_CASTING_ATTRIBUTE_SCORE', 'attributes.' + attribute);
  }
  result.spells = spellsByTier.map((spellId, index) => {
    const unlockLevel = unlockLevels[index];
    const spellLevel = spellLevels.get(spellId);
    const grantKey = traitId(id, heritage ? choices.heritage + ':' + spellId : spellId);
    const unlocked = level >= unlockLevel;
    const poolId = spellLevel > 0 && unlocked ? grantKey : null;
    if (poolId) result.pools.push(longRestPool(poolId, 1));
    return { spellId, spellLevel, unlockLevel, unlocked, grantKey, attribute, poolId,
      modes: unlocked ? (spellLevel === 0 ? ['cantrip'] : ['free', 'slot']) : [],
      ...(score === undefined ? {} : spellCastingNumbers(score, trainingBonus)),
      ...(choices.heritage === 'glasslight' && index === 0
        ? { replacement: { timing: 'long-rest', spellLevel: 0, list: 'wizard' } } : {}),
    };
  });
  return freeze(result);
}

module.exports = { deriveLineage };

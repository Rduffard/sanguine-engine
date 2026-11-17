const { feats } = require('../feats/definitions.json');
const { featAvailable, featPrerequisiteMet } = require('../feats/advancement');
const { magicInitiateChoices, magicInitiateSpells } = require('../feats/magicInitiate');
const { getLineage } = require('./definitions');
const { formAtLevel } = require('./animal-forms');
const { freeze, hasOnlyKeys, isRecord } = require('./contracts');

function distinctChoices(values, count, allowed) {
  return Array.isArray(values) && values.length === count && new Set(values).size === count &&
    [...values].every(value => allowed.includes(value));
}

function validateOriginFeat(selection, context, trained, report) {
  const field = 'choices.originFeat';
  if (selection === undefined) return report(field, 'required');
  if (!hasOnlyKeys(selection, ['id', 'options'])) return report(field, 'invalid');

  const { id, options } = selection;
  const feat = feats.find(entry => entry.id === id && entry.category === 'origin');
  const { scores = {}, caster = false, weapons = [], armor = [], chosenFeats = [] } = context;
  if (!feat || !featAvailable(feat, 1, chosenFeats) || !featPrerequisiteMet(feat, { scores, caster, weapons, armor, trained })) {
    return report(field + '.id', 'ineligible');
  }

  if (id === 'magic-initiate') {
    if (options === undefined) return report(field + '.options', 'required');
    if (!hasOnlyKeys(options, ['list', 'attribute', 'cantrips', 'spell'])) return report(field + '.options', 'invalid');
    const { list, attribute, cantrips, spell } = options;
    const { lists, attributes, cantripCount } = magicInitiateChoices;
    if (!lists.includes(list) || (context.initiateLists ?? []).includes(list)) report(field + '.options.list', 'ineligible');
    if (!attributes.includes(attribute)) report(field + '.options.attribute', attribute === undefined ? 'required' : 'ineligible');
    if (lists.includes(list)) {
      if (!distinctChoices(cantrips, cantripCount, magicInitiateSpells(list, 0))) {
        report(field + '.options.cantrips', cantrips === undefined ? 'required' : 'invalid');
      }
      if (!magicInitiateSpells(list, 1).includes(spell)) {
        report(field + '.options.spell', spell === undefined ? 'required' : 'ineligible');
      }
    }
    return;
  }

  if (id === 'skilled') {
    if (options === undefined) return report(field + '.options', 'required');
    if (!hasOnlyKeys(options, ['training'])) return report(field + '.options', 'invalid');
    const available = [
      ...(context.skillIds ?? []).filter(skill => !trained.includes(skill)).map(skill => 'skill:' + skill),
      ...(context.toolIds ?? []).filter(tool => !(context.tools ?? []).includes(tool)).map(tool => 'tool:' + tool),
    ];
    if (!distinctChoices(options.training, 3, available)) {
      report(field + '.options.training', options.training === undefined ? 'required' : 'invalid');
    }
    return;
  }

  if (Object.hasOwn(selection, 'options')) report(field + '.options', 'forbidden');
}

function validateLineageSelection(selection, context = {}) {
  const issues = [];
  const report = (field, code) => issues.push({ field, code });
  const result = () => freeze({
    selection: issues.length ? null : structuredClone(selection),
    issues,
    pending: issues.filter(issue => issue.code === 'required').map(issue => issue.field),
  });
  if (!isRecord(selection)) {
    report('lineage', selection === undefined ? 'required' : 'invalid');
    return result();
  }
  const { id, size, choices } = selection;
  const lineage = getLineage(id);
  if (!lineage) {
    report('id', id === undefined ? 'required' : 'ineligible');
    return result();
  }

  for (const key of Object.keys(selection)) {
    if (!['id', 'size', 'choices'].includes(key)) report(key, 'forbidden');
  }
  const descriptors = lineage.choices ?? {};
  if (descriptors.size) {
    if (!descriptors.size.includes(size)) report('size', size === undefined ? 'required' : 'ineligible');
  } else if (Object.hasOwn(selection, 'size')) {
    report('size', 'forbidden');
  }

  if (choices !== undefined && !isRecord(choices)) {
    report('choices', 'invalid');
    return result();
  }
  if (choices !== undefined && !Object.keys(descriptors).some(key => key !== 'size')) report('choices', 'forbidden');
  const selected = choices ?? {};
  for (const key of Object.keys(selected)) {
    if (key === 'size' || !Object.hasOwn(descriptors, key)) report('choices.' + key, 'forbidden');
  }

  const trained = context.trained ?? [];
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (key === 'size') continue;
    const field = 'choices.' + key;
    const value = selected[key];
    if (value === undefined) {
      report(field, 'required');
      continue;
    }
    if (key === 'originFeat') {
      validateOriginFeat(value, context, [...trained, selected.skill], report);
    } else if (key === 'formId') {
      if (!formAtLevel(value, 1)) report(field, 'ineligible');
    } else if (key === 'skills') {
      const available = descriptor.options.filter(skill => !trained.includes(skill));
      if (!distinctChoices(value, descriptor.count, available)) report(field, 'invalid');
    } else {
      const available = descriptor === 'catalog' ? (context.skillIds ?? []) : descriptor;
      if (!available.includes(value) || (key === 'skill' && trained.includes(value))) report(field, 'ineligible');
    }
  }
  return result();
}

module.exports = { validateLineageSelection };

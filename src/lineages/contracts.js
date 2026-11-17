class LineageRuleError extends Error {
  constructor(code, field) {
    super(code);
    this.name = 'LineageRuleError';
    this.code = code;
    this.field = field;
  }
}

function requireRule(valid, code, field) {
  if (!valid) throw new LineageRuleError(code, field);
}

function isRecord(value) {
  if (value === null || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasOnlyKeys(value, keys) {
  return isRecord(value) && Object.keys(value).every(key => keys.includes(key));
}

function freeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

const original = freeze({ document: 'Sanguine Archipelago', version: 'lineages-v1', adaptation: 'original' });

module.exports = { LineageRuleError, requireRule, isRecord, hasOnlyKeys, freeze, original };

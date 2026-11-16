const ATTRIBUTE_KEYS = Object.freeze(['might', 'agility', 'wit', 'spirit', 'resolve', 'instinct']);

// Use on scores whose input contract the caller already validated.
function attributeModifier(score) {
  return Math.floor((score - 10) / 2);
}

function calculateCheckModifier(attributes, attributeKey) {
  if (typeof attributeKey !== 'string' || !ATTRIBUTE_KEYS.includes(attributeKey)) {
    throw new RangeError('Invalid attribute identifier');
  }
  const score = attributes?.[attributeKey];
  if (!Number.isSafeInteger(score) || score < 1) {
    throw new TypeError('Selected ability score must be a positive safe integer');
  }
  return attributeModifier(score);
}

exports.ATTRIBUTE_KEYS = ATTRIBUTE_KEYS;
exports.attributeModifier = attributeModifier;
exports.calculateCheckModifier = calculateCheckModifier;

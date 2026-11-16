function purchaseQuote(unitPrice, quantity, balance) {
  const cost = unitPrice * quantity;
  if (!Number.isSafeInteger(cost) || cost < 0 || !Number.isSafeInteger(balance) || cost > balance) return null;
  return { cost, remainingCopper: balance - cost };
}

function canCatalogPurchase(definition) {
  return Number.isSafeInteger(definition.costCp) && definition.costCp >= 0;
}

function goldToCopper(gold) {
  return gold * 100;
}

function catalogUnits(quantity, unitsPerGroup) {
  return quantity * unitsPerGroup;
}

module.exports = { purchaseQuote, canCatalogPurchase, goldToCopper, catalogUnits };

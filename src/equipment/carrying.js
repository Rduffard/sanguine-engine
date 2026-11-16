function carryingCapacity(might, multiplier = 1) {
  return { capacityLb: 15 * might * multiplier, pushDragLiftLb: 30 * might * multiplier };
}

function equipmentWeight(definition, quantity) {
  return (definition?.weightLb ?? 0) * quantity / (definition?.units ?? 1);
}

function totalEquipmentWeight(items) {
  return items.reduce((total, { definition, quantity }) => total + equipmentWeight(definition, quantity), 0);
}

module.exports = { carryingCapacity, equipmentWeight, totalEquipmentWeight };

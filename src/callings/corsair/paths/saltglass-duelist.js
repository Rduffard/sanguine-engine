function saltglassParry(guard, trainingBonus, attackTotal, originalRoll) {
  const guardAfter = guard + trainingBonus;
  return {
    guardBefore: guard,
    guardAfter,
    attackTotal,
    originalRoll,
    causedMiss: ![1, 20].includes(originalRoll) && attackTotal >= guard && attackTotal < guardAfter,
  };
}

exports.saltglassParry = saltglassParry;

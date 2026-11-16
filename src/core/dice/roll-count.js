function d20RollCount(advantage = false, disadvantage = false) {
  return advantage === disadvantage ? 1 : 2;
}

module.exports = { d20RollCount };

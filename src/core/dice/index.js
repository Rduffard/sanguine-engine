const { d20RollCount } = require('./roll-count');

function rollDie(sides, roll) {
  const value = roll(sides);
  if (!Number.isInteger(value) || value < 1 || value > sides) {
    throw new Error('Invalid die result');
  }
  return value;
}

const supportedRecordedDieSides = Object.freeze([4, 6, 8, 10, 12, 20, 100]);

function recordedDieEligible(sides, value) {
  return supportedRecordedDieSides.includes(sides) && Number.isSafeInteger(value) && value >= 1 && value <= sides;
}

function selectD20(dice, advantage, disadvantage) {
  if (advantage === disadvantage) return dice[0];
  return advantage ? Math.max(...dice) : Math.min(...dice);
}

function d20({ advantage = false, disadvantage = false } = {}, roll) {
  const dice = [rollDie(20, roll)];
  if (d20RollCount(advantage, disadvantage) === 2) dice.push(rollDie(20, roll));
  return { dice, selected: selectD20(dice, advantage, disadvantage) };
}

function applyRollFloors(natural, modifier, minimumNatural, minimumTotal) {
  const applied = Math.max(minimumNatural, natural);
  return { applied, total: Math.max(minimumTotal, d20Total(applied, modifier)) };
}

function d20Total(natural, modifier) {
  return natural + modifier;
}

function checkSucceeded(total, dc) {
  return total >= dc;
}

exports.rollDie = rollDie;
exports.selectD20 = selectD20;
exports.d20 = d20;
exports.d20RollCount = d20RollCount;
exports.supportedRecordedDieSides = supportedRecordedDieSides;
exports.recordedDieEligible = recordedDieEligible;
exports.applyRollFloors = applyRollFloors;
exports.d20Total = d20Total;
exports.checkSucceeded = checkSucceeded;

exports.sheetCheckRules = require('./sheet-check').sheetCheckRules;
Object.assign(exports, require('./tool-check'));
exports.agilitySkillRules = require('./agility-check').agilitySkillRules;
exports.hideOutcome = require('./agility-check').hideOutcome;
exports.coverLevels = require('./agility-check').coverLevels;
exports.hideModes = require('./agility-check').hideModes;
exports.stealthCoverEligible = require('./agility-check').stealthCoverEligible;

function sumDice(rolls, bonus = 0) {
  return rolls.reduce((total, value) => total + value, bonus);
}

exports.sumDice = sumDice;

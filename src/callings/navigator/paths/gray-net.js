const hunterPrey = ['colossus-slayer', 'horde-breaker'];
const defensiveTactics = ['escape-the-horde', 'multiattack-defense'];

function grayNetChoice(path, level) {
  if (path !== 'gray-net') return null;
  if (level === 3) return { key: 'hunterPrey', options: [...hunterPrey] };
  if (level === 7) return { key: 'defensiveTactics', options: [...defensiveTactics] };
  return null;
}

exports.grayNetChoice = grayNetChoice;

function grayNetReplacementOptions(path, level, key) {
  if (path !== 'gray-net') return [];
  if (key === 'hunterPrey') return [...hunterPrey];
  if (key === 'defensiveTactics' && level >= 7) return [...defensiveTactics];
  return [];
}

exports.grayNetReplacementOptions = grayNetReplacementOptions;

function grayNetRestSelection(path, key) {
  return path === 'gray-net' && (key === 'hunterPrey' || key === 'defensiveTactics');
}

exports.grayNetRestSelection = grayNetRestSelection;

function multiattackDefenseUnlocked(level, choice) {
  return level >= 7 && choice === 'multiattack-defense';
}

exports.multiattackDefenseUnlocked = multiattackDefenseUnlocked;

function colossusSlayerDice(choice, missingHealth, critical) {
  if (choice !== 'colossus-slayer' || missingHealth !== true) return null;
  return { count: critical ? 2 : 1, sides: 8 };
}

exports.colossusSlayerDice = colossusSlayerDice;

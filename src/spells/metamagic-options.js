const options = [
  ['careful-spell','Careful Spell',1,'Choose up to max(1, Spirit modifier) saving creatures; they succeed and take no damage if success normally halves damage.'],
  ['distant-spell','Distant Spell',1,'Double range of at least 5 feet; Touch becomes 30 feet. Area size is unchanged.'],
  ['empowered-spell','Empowered Spell',1,'Reroll up to max(1, Spirit modifier) damage dice and use new rolls; may combine with another option.'],
  ['extended-spell','Extended Spell',1,'Double duration of at least one minute to at most 24 hours; advantage on Concentration saves for this casting.'],
  ['heightened-spell','Heightened Spell',2,'One target has disadvantage on all saves against this spell for its duration.'],
  ['quickened-spell','Quickened Spell',2,'Action becomes Bonus Action; no other level-one-or-higher spell before or after it on this turn.'],
  ['seeking-spell','Seeking Spell',1,'Reroll one missed spell attack and use the new roll; may combine with another option.'],
  ['subtle-spell','Subtle Spell',1,'Remove V/S and unpriced, nonconsumed M components.'],
  ['transmuted-spell','Transmuted Spell',1,'Change one Acid/Cold/Fire/Lightning/Poison/Thunder damage type to another from that list.'],
  ['twinned-spell','Twinned Spell',1,'Increase target count as if one slot level higher only for spells whose higher-slot text adds targets.'],
].map(([id,name,cost,description])=>({id,name,cost,description}));

module.exports = options;

const { damageTypes } = require('../vitality');

function nightSpiritLightEligible(light) {
  return light === 'dim' || light === 'dark';
}

function mergeWithShadowsEffect() {
  return { condition: 'invisible', endsAfterAction: true };
}

function featPassives(feats, light) {
  const nightSpirit = feats.includes('boon-of-the-night-spirit') && nightSpiritLightEligible(light);
  return {
    resistances: nightSpirit ? damageTypes.filter(type => !['psychic', 'radiant'].includes(type)) : [],
    ignoresPhysicalResistance: feats.includes('boon-of-irresistible-offense'),
    grapplerBenefits: feats.includes('grappler')
      ? { attackAdvantageAgainstOwnGrapple: true, noExtraMovementForOwnSizeOrSmaller: true }
      : null,
    senses: feats.includes('boon-of-truesight') ? { truesight: 60 } : {},
  };
}

module.exports = { featPassives, nightSpiritLightEligible, mergeWithShadowsEffect };

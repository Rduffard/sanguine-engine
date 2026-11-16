function conductiveConversion(damageTypes, to) {
  const from = to === 'lightning' ? 'thunder' : 'lightning';
  return {
    damageTypes: [...new Set(damageTypes.map(type => type === from ? to : type))],
    conductiveConversion: { from, to, forfeited: !damageTypes.includes(from) },
  };
}

exports.conductiveConversion = conductiveConversion;

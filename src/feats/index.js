const { feats } = require('./definitions.json');
const { clauses, options } = require('./options');

module.exports = { feats, clauses, options, ...require('./magicInitiate'), ...require('./outcomes'), ...require('./passives'), ...require('./advancement') };

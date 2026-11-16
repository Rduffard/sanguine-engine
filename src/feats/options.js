const clauses={alert:'initiative-swap','savage-attacker':'weapon-dice',grappler:'punch-and-grab','boon-of-combat-prowess':'peerless-aim','boon-of-dimensional-travel':'blink-steps','boon-of-fate':'improve-fate','boon-of-irresistible-offense':'overwhelming-strike','boon-of-the-night-spirit':'merge-with-shadows','harbor-defender':'intercept','field-responder':'stabilize'};
const options=Object.entries(clauses).map(([featId,clause])=>({featId,clause}));

module.exports = { clauses, options };

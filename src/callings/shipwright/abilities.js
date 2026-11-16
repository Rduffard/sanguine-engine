module.exports = {
  'path:powder-saint:potent-cantrip:3':[['half','Potent Cantrip: avoided damage','No action',[],'rider-cantrip-half']],
  'path:powder-saint:empowered-evocation:10':[['damage','Empowered Evocation damage','No action',[],'rider-evocation']],
  'path:drydock-ghost:ghost-patch:3':[['repair','Ghost Patch: repair','Action',[['drydock-ghost:ghost-work',1]],'ghost-repair'],['sabotage','Conceal tampering','Action',[['drydock-ghost:ghost-work',1]],'ghost-sabotage']],
  'path:drydock-ghost:paid-in-scrap:6':[['salvage','Salvage wreck','10 minutes',[['drydock-ghost:salvage',1]],'salvage']],
  'path:drydock-ghost:silent-keel:10':[['main','Silent Keel','Action',[['drydock-ghost:ghost-work',1]],'silent-keel']],
  'path:drydock-ghost:unseen-passage:14':[['main','Unseen Passage','Bonus Action',[['drydock-ghost:ghost-work',2]],'unseen-passage'],['inside','End turn inside a structure','No action',[],'unseen-consequence']],
  'path:breakwater:breakwater-doctrine:3':[['main','Create barrier','Action',[['breakwater:bastion',1]],'barrier']],
  'path:breakwater:reinforced-anchorage:6':[['reduce','Reduce damage by barrier','Reaction',[['breakwater:bastion',1]],'barrier-reduce']],
  'path:breakwater:hold-against-the-sea:14':[['free-barrier','Create one-hour barrier','Action',[['breakwater:hold-sea',1]],'barrier-hour']],
  'path:sparkwrite-aetherist:aether-relay:3':[['place','Place Aether Relay','Bonus Action',[['sparkwrite-aetherist:relay',1]],'relay-place'],['move','Move mobile relay','Bonus Action',[],'relay-move']],
  'path:sparkwrite-aetherist:grounding-circuit:6':[['proximity','Record Grounding Circuit proximity','No action',[],'relay-proximity']],
  'path:sparkwrite-aetherist:capacitor-discharge:10':[['discharge','Capacitor Discharge','Action',[['sparkwrite-aetherist:relay',1]],'relay-discharge']],
};

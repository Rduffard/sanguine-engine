const focusByCalling = { doctor: 'holy', warden: 'holy', navigator: 'druidic', tidecaller: 'arcane', shipwright: 'arcane' };

function resolveCastingComponents({ spell, management, callingId, focusId, inventory, heldIds, grip, speechBlocked, definition }) {
  const freeHands = grip === 'two' ? 0 : 2 - heldIds.length;
  if (management.components.includes('V') && speechBlocked) return { error: 'Verbal components require speech' };

  let focus = null;
  if (focusId !== undefined) {
    focus = inventory.find(item => item.instanceId === focusId);
    if (!focus?.definitionId) return { error: 'Choose an owned catalog focus or component pouch' };
  }
  const somatic = management.components.includes('S');
  if (!management.components.includes('M')) {
    if (focusId !== undefined) return { error: 'This casting has no Material component' };
    if (somatic && freeHands < 1) return { error: 'Somatic components require a free hand' };
    return { freeHands, focusId: null };
  }

  const usable = item => {
    const spec = item.definitionId ? definition(item.definitionId) : null;
    return spec && (spec.focus === 'component-pouch' || spec.focus === focusByCalling[callingId]);
  };
  if (focus && !usable(focus)) return { error: 'This focus cannot serve the spell source' };
  if (spell.specificMaterial || management.consumedMaterial) {
    if (freeHands < 1) return { error: 'Handling priced or consumed Material components requires a free hand' };
    return { freeHands, focusId: null, actualMaterial: true };
  }

  focus ??= inventory.find(usable);
  if (!focus) return { error: 'Material components require a proper focus or component pouch' };
  const { id } = definition(focus.definitionId);
  const held = heldIds.includes(focus.instanceId);
  const wornHoly = id === 'holy-symbol' || id === 'holy-symbol-emblem';
  if (!held && !wornHoly && freeHands < 1) return { error: 'Holding a focus or using a component pouch requires a free hand' };
  if (somatic && freeHands < 1 && !held) return { error: 'Somatic components require a free hand or the hand holding the Material focus' };
  return { freeHands, focusId: focus.instanceId };
}

module.exports = { resolveCastingComponents };

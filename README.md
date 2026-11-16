# Sanguine Archipelago engine

`@crossworld/sanguine-engine` is the independent mechanics package for Sanguine Archipelago. The export map in `package.json` lists all public subpaths.

| Import subpath | Mechanics |
| --- | --- |
| `/attributes` | Attribute keys, validated check modifiers and arithmetic for prevalidated scores |
| `/point-buy` | Cost table, 27-point budget, base allocation and validation before origin/background changes |
| `/dice` | Injected die rolls, d20 selection and roll floors |
| `/training` | Level schedule, one Training/Expertise contribution, tool aliases, equipment grant aggregation and eligibility |
| `/resources` | Manual pool spending, reserve-backed Initiative recovery, and pool reconciliation |
| `/hit-dice` | Deterministic Hit Dice reconciliation for advancement and rebuild |
| `/spell-slots` | Ordinary spell-slot reconciliation, shared expenditure via `deductSpellSlot({ slotLevel, available, created })`, created-slot precedence, Spell Recall, and Sorcery Point conversion |
| `/preparations` | Ordered prepared-spell reconciliation and preparation eligibility |
| `/progression` | Earned Health and Hit Dice from fixed, single-Calling progression and shared Path resource capacity |
| `/casting-turn` | Shared per-turn spell-slot, leveled-cast, Quickened Spell, and free Metamagic flags |
| `/resources/feature-restoration` | Alternate resource and slot costs for exhausted features |
| `/spells/casting-sources` | Free-cast pool and spell-source eligibility |
| `/spells/components` | Speech, hands, focus and priced-material requirements |
| `/combat/encounter` | Turn and attack-budget arithmetic from supplied encounter facts |

Each subpath has one CommonJS implementation with explicit named exports. CommonJS callers use `require()`. Node ESM and Vite callers use named imports. Public modules depend on standard JavaScript only. Dice callers supply their own roll source. Training callers supply profiles and weapon group membership from their catalogs.

`spendPool(pools, definitions, { poolId, amount })` spends a positive safe integer. `recoverInitiativePool(pools, definitions, { poolId, reservePoolId, mode })` spends one reserve use. The supported recovery modes are `all` and `one-if-empty`. The host supplies earned definitions with a `max` for each pool and chooses the granted recovery pairing. Both functions return `{ pools, outcome }` and throw a `ResourceTransitionError` with a stable `code` on mechanical rejection. The host owns combat eligibility, once-per-combat tracking, and persistence.

`reconcilePools(previousDefinitions, previousPools, nextDefinitions, policy)` returns a fresh balance map in next-definition order. Definitions supply nonnegative integer maxima. The `advance` policy preserves expenditure as maxima change and starts new grants full. The `rebuild` policy caps retained pools at their previous balance and starts new grants empty. Both drop inactive pool IDs from the balance map. The host selects the policy, resolves grants, and owns journal retention.

`reconcileHitDice(previousAllocation, previousState, nextAllocation, policy)` takes die-keyed integer count maps such as `{ d10: 3 }`. Both policies preserve expenditure by die type and return only the next allocation's keys. The `advance` policy grants the new earned dice, and `rebuild` caps availability at the prior saved count for each die type. Invalid inputs raise `HitDiceReconciliationError` with code `INVALID_HIT_DICE_RECONCILIATION`. The host calculates earned allocations and owns rest, rolls, and persistence.

`reconcileSpellSlots(previousAllocation, previousAvailable, nextAllocation, policy)` accepts dense arrays of ordinary counts indexed by spell level minus one. It returns fresh entries in next-allocation order. Each entry contains the reconciled `available` count and the `remainingReduction` below zero that the ordinary balance could not absorb. Advancement preserves expenditure and grants newly earned slots. Rebuild also caps availability at the old ordinary balance. Invalid inputs raise `SpellSlotReconciliationError` with code `INVALID_SPELL_SLOT_RECONCILIATION`. The host supplies allocations, owns the combined saved representation and created-slot accounting, and executes casting, conversion, and rest.

`reconcilePreparations({ saved, additions, replayed, alwaysPrepared, eligible, capacity })` returns a fresh ordinary preparation list. It keeps the first occurrence of each ID in saved, newly earned, and replay order, excludes always-prepared IDs, and caps the result. The result must fill capacity and its retained IDs must be eligible. An ineligible retained spell rejects the transition even when another candidate is available past the cap. `PreparationReconciliationError` reports `INVALID_PREPARATION_RECONCILIATION` or `INELIGIBLE_PREPARATION`. The host supplies eligibility, grants and capacity and owns rest, casting and folio management.

For cast expenditure, pass `{ slotLevel, available, created, recallEligible }` to `requiresSpellRecallRoll` before generating a trusted d4. `available` is the total count at the chosen level, including created slots. Call `calculateSpellSlotExpenditure(input, roll)` with that roll when required and omit it otherwise. The result contains fresh `available` and `created` balances, `spentSlot`, and an optional `spellRecall` record. A matching d4 preserves both balances. Otherwise the expenditure reduces the total and consumes a created marker first. `SpellSlotExpenditureError` identifies unavailable slots, invalid mechanical inputs, and invalid roll inputs by code. The host decides casting and feat eligibility and applies the balances.

`deriveVitalityProgression({ level, hitDie, resolve, bonusHealth = 0 })` returns `{ health: { max }, hitDice }` using the final Resolve score for every level. The first level starts from the full Hit Die and later levels use the fixed half-die-plus-one gain. Each level contributes at least one Health before the supplied earned bonus is added. Levels are 1–20 and supported dice are d6, d8, d10, and d12. Invalid inputs raise `ProgressionInputError` with code `INVALID_VITALITY_PROGRESSION` and the affected field. The host supplies grant facts and reconciles saved Health and available Hit Dice separately.

`derivePathResourceCapacity({ level, unlockLevel })` returns zero before the supplied unlock, two at the unlock, and one additional use for every four levels since unlock. Both levels must be integers from 1 to 20. Invalid inputs raise `ProgressionInputError` with code `INVALID_PATH_RESOURCE_CAPACITY` and the affected field. The host supplies Path eligibility, unlock level, and pool identity and owns recovery and saved balances.

`transitionCastingTurnBudget(current, { level, spentSlot, quickened, freeMetamagic })` returns fresh boolean flags `slotSpent`, `leveled`, `quickened`, and `freeMetamagic`. Missing flags default to false, and level is the printed spell level, from 0 to 9. Slot and Quickened conflicts take precedence over an already-used free Metamagic option. The host supplies the actual slot expenditure and owns casting eligibility, turn identity, action handling, journal metadata and persistence. `CastingTurnBudgetError` provides `CASTING_TURN_LIMIT`, `FREE_METAMAGIC_ALREADY_USED`, and `INVALID_CASTING_TURN_INPUT`.

`getSpellSlotCreationTerms(slotLevel)` returns the cost and minimum Calling level for creation, or null for unsupported levels. `projectSorceryPointsFromSlot({ slotLevel, points, maximum })` takes a validated slot level and pool balance and returns the prospective balance, or null if it would exceed the maximum. The host checks slot availability and calls `deductSpellSlot` to pay for the conversion. After validating creation eligibility and available points, call `calculateCreatedSpellSlotBalances({ available, created, points, cost })` for fresh balances. The host owns the saved-state marker bound and allocation validation.

`/vitality` supplies pure Health and death-save transitions. `healVitality({ health, deathSaves }, amount)` returns a patch and raises `HealingError` for invalid amounts or dead creatures. At positive resulting Health it resets death saves and clears pending Relentless Rage. Hit Dice use only `capHealing(current, maximum, amount)`. `restoreVitality({ health }, amount)` restores the supplied Health and resets death saves. `applyVitalityDamage(state, amount, critical)` takes post-mitigation damage and returns Health, temporary Health, death saves, and absorption. `resolveDeathSave(deathSaves, roll, { defyDeath })` returns a continuation, stabilization, or Health restoration outcome. The host supplies rolls, eligibility, stabilization timing, and effect cleanup. `freshDeathSaves()`, `relentlessRageDC(previousAttempts)`, `clearTemporaryHealth()`, and `recoverRestExhaustion(exhaustion, { kind, nourished, navigatorLevel })` expose the corresponding rules.

`mitigateDamage(amount, { agilityHalfSave, evasion, immune, resistant, reefSkinReduction })` returns damage and the Evasion flag after applying Agility, immunity or Resistance, and Reef Skin in that order. The host resolves eligibility and may bypass mitigation. `concentrationDamageDC(damage)` takes post-mitigation damage before absorption. `grantTemporaryHealth(current, amount, metadata)` returns a replacement patch only for a strictly larger sourced grant. `trackTemporaryHealth(current, amount)` preserves the legacy numeric tracker, where zero clears the amount and metadata is host-owned.

The damage reaction helpers in `/vitality` take resolved facts. `unbrokenCurrentUnlocked` checks declaration eligibility and `evaluateUnbrokenCurrent` returns an inactive, unavailable, or restore outcome. `pendingRelentlessRage` returns a DC for a qualifying Health drop. `canResolveRelentlessRage` takes active Rage and pending state, and `resolveRelentlessRage` returns the next attempt count and optional Health restoration from a supplied total. `isDamageConcentrationExempt` checks a resolved spell ID and Navigator level only for damage saves. The host applies these decisions in sequence and owns RNG, effects, and persistence.

`resolveConcentrationSave({ rolls, resolveModifier, dc })` returns the selected roll, modified total and success. The host supplies one d20 or two when advantage applies, validates or generates the rolls, and owns pending checks and effects. Concentration uses the highest supplied roll and has no special natural-one or natural-twenty result.

`/saving-throws` provides `baseSavingThrowModifier({ score, trained, trainingBonus, auraBonus })` and `projectSavingThrowModifiers(base, { suppressedAura, exhaustion, equipmentBonus })`. It uses the existing attribute and Training rules, removes a suppressed aura, subtracts the Exhaustion penalty, and adds resolved equipment bonuses. `exhaustionD20Penalty(level)` is shared with other affected d20 projections. The host resolves eligibility, active equipment, and applicable aura facts.

`/callings` owns the Gunslinger definition, all four Paths and their feature metadata and typed option definitions. Progression helpers provide level-scaled combat and pool values and Fighting Style, skill and tool grants. Pure ability helpers accept completed rolls or resolved modifiers and movement facts. Hosts select legal weapons and targets, validate triggers, roll dice, assign effect identities and commit the typed operation.

Run `npm test` on Node 22 and `npm pack` to produce an installable tarball. For this pass, the applications pin identical copies of the packed artifact by relative path. When updating it, bump the package version, pack once, and update both application tarballs and lockfiles. Verify the packed exports before committing consumer updates. See [NOTICE.md](NOTICE.md) for provenance.

The Calling roster exports all eight definitions, 32 Paths, ordered feature metadata, numerical progression, spellcasting capacities, resource pool grants and typed ability option previews. Hosts supply ledger and catalog context where relevant.

The Calling execution helpers include Reef Skin eligibility, Blood Price dice and Shelter Health, Vital Circuit temporary Health, and the Empowered Spell reroll limit. Hosts provide armor context, die results and effect state.
The /calling-mechanics entry point exposes these formulas without loading the Calling catalog.

## Catalog domains

- Find Calling and Path records in `src/callings/<calling>/definition.json` and `src/callings/<calling>/paths/<path>.json`. Typed option declarations live in the corresponding Calling folder and their shared projection lives in `src/callings/ability-options.js`.
- Find individual spells in `src/spells/definitions/level-<level>/<id>.json`. The definitions index preserves API order. `src/spells/profiles` holds typed operational metadata, and `src/spells/materials.js` holds priced component requirements.
- Find equipment sources in `src/equipment`, including weapon, armor, shield, supply, pack and magic item definitions. The equipment export assembles those sources in canonical order. Its subpaths expose raw weapon definitions, weapon groups and object-use profiles.

The dice export includes sheetCheckRules for projected check modifiers, advantage, disadvantage and floors. The spells/healing export provides healing profiles and upcast arithmetic. The Calling export includes Breakwater barrier statistics. Hosts supply context, rolls, effect IDs and clocks.

Execution exports include /spells/metamagic and /equipment/restrictions. The Calling export includes Aether Relay statistics and Preserve Life limits.

The equipment/guard and equipment/weapon-projection exports calculate Guard and weapon mechanics from resolved loadout facts. The combat/strike export owns strike dice and save calculations. Calling helpers cover Smite of Protection, Drydock Ghost salvage, and Triage condition outcomes; Training exposes the Training or Expertise destination for automatic skill grants.

The combat/attack export calculates attack inputs, hit outcomes and damage from resolved dice. Equipment exports include magic-modifiers and carrying. The Calling export includes level-three designed Path grants.

The equipment/movement and spells/conductive-conversion exports consume resolved context. The Calling export includes Ghost servicing rules, Impossible Operation eligibility and level-three Path specialty tool grants.

The vitality export includes Bloodied eligibility and half-Health treatment budgeting. Calling helpers include Saltglass Parry and level-gated specialty choice options.

The Metamagic export provides level grants and replacement validation using the same catalog as casting. Calling rules include Stormhide retaliation, Reaver area damage, Passage and Passing Shot movement eligibility.

Calling advancement and tactics include Primal Champion attributes, Corsair save Training, Leviathan Burden and Suppressing Fire control.

Calling exports include Gray Net choices, Shipwright folio grants, Envoy limits and Free Port saves. Equipment movement provides exhaustedMovement for resolved speeds.
Calling tactics also expose Cinder Artillerist target results and Potent Spellcasting vitality.

Calling tactics expose Warden aura calculations and Abjure Foes caps, Reaver escape and landing outcomes, Cinder charge radius eligibility, and selected Brass Outrider, Starwake Pilot and Hollow Lantern targeting and movement rules. Hosts supply resolved facts, rolls and active effect evidence.

The feats export provides feat definitions and option identifiers. The equipment/starting-equipment export provides Calling packages and selects equipment and gold from a package choice. Inventory instance creation and bundle expansion remain host operations.

Advancement movement and cantrip or prepared-spell replacement limits use resolved Calling levels and choices. The vitality export provides condition definitions, suppression, and movement restrictions.

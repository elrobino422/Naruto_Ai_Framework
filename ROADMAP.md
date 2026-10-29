# Naruto CustomNPC Project Roadmap

Target: Minecraft 1.12.2. Legend: [x] done, [ ] planned, [?] validation pending.

## 0. Foundation
- [x] Identify NarutoMod JutsuEnum registry and DynamicDojutsu CustomNPC API
- [x] Inspect JutsuExecutor callback path
- [ ] Clean test world and organized local dependencies

## 1. Konoha Genin
- [x] Scripted NPC, target detection
- [x] NarutoMod Great Fireball and Rasenshuriken casting
- [x] DynamicDojutsu Steel Projectile casting
- [x] Weighted ability selection and cooldown foundation
- [ ] Equipment, stats, melee fallback
- [ ] Real NarutoMod Ryo drops and death tests
- [ ] Save reusable Genin preset

## 2. Combat framework
- [x] Both casting systems, element-colored announcements
- [x] Ability ranges, weights, cooldown counters
- [x] V13 facing and casting tested in game
- [?] Controlled range checks at 2, 8, 18, 25 blocks
- [?] Verify V14 navigation, distance and cooldown timing in Minecraft
- [x] Prepare V14 candidate with optional, throttled debug and real-tick timing (automated check only)
- [?] Verify V14 in Minecraft and mark stable
- [ ] Separate common engine from NPC configuration

## 3. Ability database
- [x] V2/V3/V4 registry scans and collision investigation
- [x] V5 resolver validation
- [ ] Master ability database and element categorization
- [ ] Expand tested jutsu and ability requirements

## 4. Combat AI
- [x] Targeting, facing, basic scripted repositioning
- [ ] Line of sight and wall avoidance
- [ ] Melee fallback, dodging and ability-specific movement

## 5. NPC presets and progression
- [ ] Village and rank-specific Genin/Chunin/Jonin presets
- [ ] Equipment, stats, loot and faction behavior

## 6. Bosses
- [ ] Boss templates, phases, health thresholds and transformations
- [ ] Verified dojutsu, Curse Mark, Gates, Susanoo integrations
- [ ] Original CustomNPC versions of rare and summonable bosses

## 7. Spawning and villages
- [ ] Natural spawn conditions, village NPC pools, rarity tiers
- [ ] Villages, guards, traders and quest NPCs

## 8. Release
- [ ] Performance, multiplayer, persistence and spawn tests
- [ ] Documentation and release packaging

**Current status (2026-10-29):** The exact user-supplied V13 script is archived unchanged. A V14 candidate has been committed to the active script and version archive, with optional throttled debug, real-tick timers and navigation throttling. It passed JavaScript syntax and mocked combat-loop tests, **not** an in-game Minecraft test.

**Next step:** Test V14 in Minecraft using `tests/V14_TEST_PLAN.md`. Only then mark V14 stable. Roll back to `versions/V13/` if needed.

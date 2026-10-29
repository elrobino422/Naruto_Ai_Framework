# V14 — Combat framework stabilization candidate

**Status: CANDIDATE / NOT YET TESTED IN MINECRAFT.**
**Base:** User-uploaded original V13, archived unchanged at `versions/V13/NarutoNPCFramework.js`.
**Script type:** NPC (CustomNPCs 1.12.2).
**Installation:** Replace the active V13 NPC script with `scripts/framework/NarutoNPCFramework.js`. Do not run V13 and V14 on the same NPC.

## V14 changes
- Debug display is controlled by `CONFIG.debug` (default false), emits one line at most every `debugIntervalTicks` (default 40 game ticks), and shows distance, per-ability range/cooldown and global lock.
- Cooldowns and global cast lock decrement on *every game tick* rather than once per combat update.
- To preserve approximate effective V13 timings, cooldowns are now 200 ticks (Fireball), 350 ticks (Rasenshuriken), 125 ticks (Steel Projectile), and 50 ticks (global lock).
- Combat updates remain every 5 ticks; navigation commands refresh every 20 ticks when approaching/retreating and every 100 ticks for strafing, unless movement mode changes.
- New `v14_*` stored-data keys and initialization isolate old state.
- NarutoMod resolved jutsus cached by ID; unsuccessful lookups are not cached.
- Existing targeting, aiming, ability weights, ranged filtering, casting bridges, animation ownership and announcements are preserved.

## Automated checks (not a substitute for Minecraft)
- JavaScript source passed `node --check`.
- A mocked event loop checked range eligibility, 1-tick cooldown decrement, global cast lock, debug throttling, navigation command throttling, and target loss.

## In-game testing checklist
1. Load V14 on a test NPC; **unload V13**.
2. Set `CONFIG.debug = true` temporarily.
3. Test at 2, 8, 18 and 25 blocks. The NPC will move toward 8 blocks, so use a controlled test or prevent movement temporarily if needed.
4. Verify only Rasenshuriken is eligible around 18 blocks; none are eligible around 25 blocks.
5. Verify Fireball, Rasenshuriken and Steel Projectile activate separately rather than in one burst.
6. Observe navigation, strafing, retreating and facing.
7. Confirm effective cooldowns are near 10s, 17.5s and 6.25s and global lock near 2.5s on a 20 TPS server.
8. Disable debug and run a multiplayer/lag test.

## Known limitations
- Range checks use 3D distance; LOS/obstacle checks and projectile hit prediction are not implemented.
- No Jutsu requirements beyond the three tested skills are generalized.
- A valid jutsu callback may still produce an attack that misses or fails due to mod-specific behavior.
- All Java APIs are inferred from the previously tested V13; verify in the actual installed game.

## Rollback
Replace V14 in the NPC script editor with the exact script in `versions/V13/NarutoNPCFramework.js`, then reinitialize/reload the NPC. Do not edit the archived V13.

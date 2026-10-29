# Codex instructions — Naruto AI Framework
Target: Minecraft Forge 1.12.2, CustomNPCs, NarutoMod 0.3.1 beta, DynamicDojutsu 1.3.9.7.

- Never invent CustomNPCs or mod API methods: inspect the exact JAR or verified source before implementing.
- Keep working code stable; changes should be small, reviewable and reversible.
- Existing NarutoMod/DynamicDojutsu bosses are references, not replacements. Build our own CustomNPC bosses.
- Do not upload third-party JARs or proprietary assets to this public repository.
- On every delivered script state: New or replacement; Load on NPC/player; Unload which prior script; Temporary test yes/no; What to restore afterward.
- Update ROADMAP.md only after user confirms in-game success.
- Use Nashorn-compatible JavaScript.
- DynamicDojutsu 1.3.9.7 bridge: com.leolifeless.dynamicdojutsu.compat.customnpcs.ShinobiNPCScriptAPI.
- NarutoMod registry: net.narutomod.item.ItemJutsu$JutsuEnum.
- CustomNPC tick(e), npc.setRotation(yaw), npc.setPitch(pitch), npc.navigateTo(x,y,z,speed), npc.clearNavigation() were previously validated.
- V12 combat rewrite regressed aim/distance/coordination; V13 restored scripted movement and aiming.
- The last V13 decremented cooldowns once every updateInterval=5 ticks, not every tick. Investigate before changing behavior.
- First task: recover the exact in-game V13 framework source, then test a throttled distance and ability-validity display; do not pretend an unverified reconstruction is tested.

## Version archive rules
- Keep the user-uploaded `versions/V13/NarutoNPCFramework.js` byte-for-byte unchanged.
- `versions/V14/NarutoNPCFramework.js` is a development snapshot, not confirmed stable until Minecraft tests pass.
- Before future substantial changes, snapshot the previous known-good source in `versions/VXX/` with release notes; never overwrite an earlier version.
- Edit `scripts/framework/NarutoNPCFramework.js` as the active work copy. When a new version is ready, archive the exact release candidate and document test status.
- Testing in Node or with mocks does not validate Nashorn's mod API behavior; never claim that it does.

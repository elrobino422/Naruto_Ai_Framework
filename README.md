# Naruto AI Framework 🍥

Minecraft Forge **1.12.2** CustomNPCs AI combat framework using **NarutoMod**, **DynamicDojutsu**, and supporting Naruto addons.

## Current versions
- **V13 — original user-uploaded backup:** [versions/V13/NarutoNPCFramework.js](versions/V13/NarutoNPCFramework.js).
- **V14 — polished candidate (NOT YET TESTED IN MINECRAFT):** [scripts/framework/NarutoNPCFramework.js](scripts/framework/NarutoNPCFramework.js).
- **V14 snapshot:** [versions/V14/NarutoNPCFramework.js](versions/V14/NarutoNPCFramework.js) with [release notes](versions/V14/NOTES.md).

Use [tests/V14_TEST_PLAN.md](tests/V14_TEST_PLAN.md) to verify V14 before declaring it stable. To debug distance and eligibility, temporarily set `CONFIG.debug = true` in the V14 script and turn it off afterward.

## Installation
1. Install the required Minecraft mods locally (see [dependencies](docs/DEPENDENCIES.md)).
2. On a **test NPC**, replace the current V13 CustomNPC script with `scripts/framework/NarutoNPCFramework.js` from this repository.
3. Do not load multiple versions on the same NPC.
4. Verify the three jutsus, range checks, target facing, movement and cooldowns.
5. On problems, restore the original file from `versions/V13/`.

## Documentation
- [AGENTS.md](AGENTS.md): permanent Codex development rules
- [ROADMAP.md](ROADMAP.md): verified milestones and remaining work
- [docs/TECHNICAL_NOTES.md](docs/TECHNICAL_NOTES.md): investigated mod APIs
- [versions/README.md](versions/README.md): snapshot and rollback procedure

Third-party game mod JAR files are not redistributed.

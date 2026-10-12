# Framework version archive

This folder stores **immutable snapshots of versions confirmed working in Minecraft**. Git commit history provides another recovery method, but these files make manual rollback easy.

## Naming
- `versions/V13/NarutoNPCFramework.js`
- `versions/V14/NarutoNPCFramework.js`
- `versions/V15/NarutoNPCFramework.js`

Each version should also have a `NOTES.md` explaining tested features, known issues, required mods and rollback steps.

## Workflow
1. Develop and test in `scripts/framework/NarutoNPCFramework.js`.
2. After the user confirms the new version works in-game, copy the **exact tested file** into `versions/VXX/NarutoNPCFramework.js`.
3. Add `versions/VXX/NOTES.md` with test results and compatibility details.
4. Never edit an archived snapshot; if a fix is needed, create a new version.
5. To roll back, copy the archived JS into the active framework script, replace the NPC's current script, reload the NPC/world as needed and retest.

**Important:** Previous V1–V13 source files are not yet available in this repository. Do not invent or label reconstructed files as confirmed snapshots.

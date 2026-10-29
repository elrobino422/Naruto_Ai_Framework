# V13 — original script archived

**Status:** Original V13 script supplied by the user and archived unchanged on 2026-10-29.

**File:** [NarutoNPCFramework.js](NarutoNPCFramework.js).

Previous tests confirmed target facing and NarutoMod Fireball and Rasenshuriken casting. Steel Projectile had worked in earlier versions. Exact range filtering and movement behavior still need controlled verification.

**Known problems in this uploaded V13:**
- `debugCombatStatus()` is called unconditionally during combat, causing up to four NPC chat messages every five game ticks. The nested function declaration is syntactically valid JavaScript; the real problem is lack of a debug guard and throttling.
- `updateCooldowns()` runs only on combat updates (every five game ticks by default), making configured cooldown and global lock counters five times longer than their apparent tick units.
- Navigation may be issued every five ticks while approaching or retreating, causing unnecessary path recalculations.

**Rollback:** Replace the active NPC framework script with this archived V13, reload/reinitialize the NPC, and disable conflicting frameworks. Do not modify this V13 archive.

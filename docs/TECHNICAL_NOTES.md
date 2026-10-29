# Verified technical notes

## Target mods
Minecraft Forge 1.12.2; CustomNPCs 1.12.2; NarutoMod 0.3.1 beta; DynamicDojutsu 1.3.9.7; JutsuExecutor and other Naruto addons.

## DynamicDojutsu bridge
```javascript
var ShinobiAPI = Java.type("com.leolifeless.dynamicdojutsu.compat.customnpcs.ShinobiNPCScriptAPI");
ShinobiAPI.cast(npc, "steel_steel_projectile");
```
The package changed from an earlier shinobiaddon namespace. The JAR has CustomNPC boss examples for steel, swift, typhoon, dark, blaze, ink, barriers, etc. Verify actual signatures against installed JAR.

## NarutoMod direct callback
```javascript
var JutsuEnum = Java.type("net.narutomod.item.ItemJutsu$JutsuEnum");
var ItemStack = Java.type("net.minecraft.item.ItemStack");
var Items = Java.type("net.minecraft.init.Items");
var stack = new ItemStack(Items.field_151055_y);
var result = selected.jutsu.createJutsu(stack, npc.getMCEntity(), power);
```
Resolve selected from JutsuEnum.getJutsuList() by type and unlocalizedName. Callback collisions may require class comparison. Nashorn used Items.field_151055_y instead of Items.STICK. Rasenshuriken needs an ItemFuton.block stack at power 1; SENJUTSU can need ItemSenjutsu.block.

## Working IDs
- KATON:katonfireball — Great Fireball
- FUTON:rasenshuriken — Rasenshuriken
- steel_steel_projectile — DynamicDojutsu

## V13 ability config
Fireball range 4–15, weight 100, cooldown 40, power 1.
Rasenshuriken range 5–20, weight 25, cooldown 70, power 1.
Steel Projectile range 3–15, weight 50, cooldown 25.
Global cast lock 10; updateInterval 5; combat distance 8, tolerance 1.5.

## Caveats
V13 user confirmed facing and Fireball/Rasenshuriken firing, but exact range filtering was not verified. The cooldown decrement happens once per update cycle, not every game tick. Fireball AoE at power 1 is very small (roughly 0.4 block). V12 native AI attempt broke targeting coordination and was abandoned.

## Registry discovery
221 NarutoMod registry entries observed; duplicate type/index/display names can have different callbacks. V5 resolved Slug Sage Mode, Axolotl Sage Mode, Tenseigan variants, Sand Bind, Fireball and Rasenshuriken. Do not redo large scans without a concrete need.

## Spawn goals
Common natural NPCs: village civilians, Genin, Chunin, Jonin.
Rare natural: Gaara, Killer Bee, Nagato/Pain, Minato, first three Hokage.
Summonable CustomNPC bosses: Kaguya, Momoshiki, other Otsutsuki, Ten-Tails Madara and Ten-Tails Obito.

## V14 stabilization candidate (2026-10-29)
The original user-uploaded V13 is archived unchanged. V14 active and snapshot scripts now use game-tick cooldown timers with approximate V13 pacing (200 / 350 / 125 ticks), 50-tick global lock, optional throttled debug, navigation request throttling, and cached successful NarutoMod jutsu lookups. Passed JavaScript syntax and mocked event-loop tests only. **Not verified in Minecraft yet.** See `versions/V14/NOTES.md` and `tests/V14_TEST_PLAN.md`.

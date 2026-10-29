# V14 test plan

**Candidate only:** automation mock checks are not Minecraft integration tests.

## Script deployment
- **New/replacement:** V14 replaces V13 active script
- **Load on:** NPC script editor, where V13 ran
- **Unload:** V13 (do not run two combat frameworks)
- **Temporary debug:** Set `CONFIG.debug = true`; set false when finished
- **Restore on failure:** `versions/V13/NarutoNPCFramework.js`

## Eligibility at an exact 3D distance
| Blocks | Great Fireball 4–15 | Rasenshuriken 5–20 | Steel 3–15 |
|---:|:---:|:---:|:---:|
| 2 | no | no | no |
| 8 | yes | yes | yes |
| 18 | no | yes | no |
| 25 | no | no | no |

'yes' means in range only; cooldown/global lock still apply.

## Expected pacing at 20 TPS
- Fireball 200 ticks ~10 seconds
- Rasenshuriken 350 ticks ~17.5 seconds
- Steel 125 ticks ~6.25 seconds
- Global cast lock 50 ticks ~2.5 seconds

Observe NPC facing, pursuing, retreating, strafing and chat rate (max one debug message per 40 ticks). Disable debug for normal use.

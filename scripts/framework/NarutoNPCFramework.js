/*
 * Naruto CustomNPC Framework V14 — stabilization candidate
 * SCRIPT TYPE: NPC combat framework (CustomNPCs 1.12.2 / Nashorn)
 * REPLACES: V13 active script; preserve versions/V13 unchanged
 * LOAD ON: NPC (Script tab: init + tick event handlers)
 * UNLOAD: V13 from the same NPC before loading V14
 * TEMPORARY TEST: Yes. V14 is not confirmed in Minecraft yet.
 *
 * Main fixes:
 *   - Debug is optional, throttled, and displayed in one chat line.
 *   - Cooldowns and global cast lock now use actual game ticks (20/s).
 *   - Default timings preserve V13's approximate effective intervals.
 *   - Navigation requests are throttled to avoid repeatedly resetting paths.
 *   - New v14_* state keys prevent old V13 counters from interfering.
 */

var ShinobiAPI = Java.type("com.leolifeless.dynamicdojutsu.compat.customnpcs.ShinobiNPCScriptAPI");
var JutsuEnum = Java.type("net.narutomod.item.ItemJutsu$JutsuEnum");
var ItemStack = Java.type("net.minecraft.item.ItemStack");
var Items = Java.type("net.minecraft.init.Items");
var ItemFuton = Java.type("net.narutomod.item.ItemFuton");
var ItemSenjutsu = Java.type("net.narutomod.item.ItemSenjutsu");

var CONFIG = {
    // Enable temporarily to check exact distance, ranges and cooldowns.
    debug: false,
    debugIntervalTicks: 40,   // One NPC chat line at most every two seconds.
    announceCasts: true,

    // Expensive combat logic only runs every five ticks (0.25 seconds).
    combatUpdateInterval: 5,

    // V13 used 10 lock COUNTS, each 5 ticks => ~50 actual ticks.
    globalCastLockTicks: 50,

    movement: {
        combatDistance: 8.0,
        distanceTolerance: 1.5,
        speed: 1.0,
        strafeDistance: 3.0,
        approachRefreshTicks: 20,
        strafeRefreshTicks: 100   // V13: 20 updates * 5 ticks.
    },

    // All cooldowns below are in real Minecraft ticks (20 ticks = 1 second).
    // Values preserve approximately the effective V13 timings.
    abilities: [
        {
            system: "narutomod", id: "KATON:katonfireball",
            name: "Gōkakyū no Jutsu", element: "Katon", color: "§c",
            power: 1.0, minRange: 4, maxRange: 15,
            cooldownTicks: 200, weight: 100
        },
        {
            system: "narutomod", id: "FUTON:rasenshuriken",
            name: "Rasenshuriken", element: "Fūton", color: "§f",
            power: 1.0, minRange: 5, maxRange: 20,
            cooldownTicks: 350, weight: 25
        },
        {
            system: "dynamicdojutsu", id: "steel_steel_projectile",
            name: "Steel Projectile", element: "Steel", color: "§7",
            minRange: 3, maxRange: 15,
            cooldownTicks: 125, weight: 50
        }
    ]
};

var jutsuCache = {};

function data(npc) { return npc.getStoreddata(); }
function getNumber(npc, key, fallback) {
    var d = data(npc);
    if (!d.has(key)) return fallback;
    var number = Number(d.get(key));
    return isNaN(number) ? fallback : number;
}
function setNumber(npc, key, value) { data(npc).put(key, value); }
function getString(npc, key, fallback) {
    var d = data(npc);
    return d.has(key) ? String(d.get(key)) : fallback;
}
function setString(npc, key, value) { data(npc).put(key, value); }
function debugLog(message) {
    if (CONFIG.debug) print("[Naruto V14] " + message);
}

function init(e) {
    var npc = e.npc;
    setNumber(npc, "v14_combatTimer", 0);
    setNumber(npc, "v14_debugTimer", 0);
    setNumber(npc, "v14_globalLock", 0);
    setNumber(npc, "v14_navTimer", 0);
    setNumber(npc, "v14_strafeSide", 1);
    setString(npc, "v14_navMode", "idle");
    for (var i = 0; i < CONFIG.abilities.length; i++) {
        setNumber(npc, "v14_cd_" + i, 0);
    }
    if (CONFIG.debug) npc.say("§aNaruto Combat Framework V14 debug enabled.");
}

function tick(e) {
    var npc = e.npc;

    // Decrement on EVERY real tick, not just on combat updates.
    decreaseTimer(npc, "v14_globalLock");
    decreaseTimer(npc, "v14_navTimer");
    decreaseTimer(npc, "v14_debugTimer");
    for (var i = 0; i < CONFIG.abilities.length; i++) {
        decreaseTimer(npc, "v14_cd_" + i);
    }

    var combatTimer = getNumber(npc, "v14_combatTimer", 0) - 1;
    if (combatTimer > 0) {
        setNumber(npc, "v14_combatTimer", combatTimer);
        return;
    }
    setNumber(npc, "v14_combatTimer", Math.max(1, CONFIG.combatUpdateInterval));

    var target = npc.getAttackTarget();
    if (!target || !target.isAlive()) {
        stopMoving(npc);
        return;
    }

    var distance = getDistance(npc, target);
    if (isNaN(distance) || !isFinite(distance)) return;

    faceTarget(npc, target);
    updateCombatMovement(npc, target, distance);

    // Debug is now opt-in and throttled; never spam 4 messages every update.
    if (CONFIG.debug && getNumber(npc, "v14_debugTimer", 0) <= 0) {
        debugCombatStatus(npc, distance);
        setNumber(npc, "v14_debugTimer", Math.max(20, CONFIG.debugIntervalTicks));
    }

    if (getNumber(npc, "v14_globalLock", 0) > 0) return;

    var abilityIndex = chooseAbility(npc, distance);
    if (abilityIndex < 0) return;

    if (castAbility(npc, CONFIG.abilities[abilityIndex])) {
        setNumber(npc, "v14_globalLock", CONFIG.globalCastLockTicks);
        setNumber(npc, "v14_cd_" + abilityIndex, CONFIG.abilities[abilityIndex].cooldownTicks);
    }
}

function decreaseTimer(npc, key) {
    var remaining = getNumber(npc, key, 0);
    if (remaining > 0) setNumber(npc, key, remaining - 1);
}

function getDistance(npc, target) {
    var dx = target.getX() - npc.getX();
    var dy = target.getY() - npc.getY();
    var dz = target.getZ() - npc.getZ();
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function faceTarget(npc, target) {
    var dx = target.getX() - npc.getX();
    var dy = (target.getY() + target.getEyeHeight()) - (npc.getY() + npc.getEyeHeight());
    var dz = target.getZ() - npc.getZ();
    var horizontal = Math.sqrt(dx * dx + dz * dz);
    if (horizontal < 0.001) return;

    var yaw = Math.atan2(dz, dx) * 180.0 / Math.PI - 90.0;
    var pitch = -Math.atan2(dy, horizontal) * 180.0 / Math.PI;
    npc.setRotation(yaw);
    npc.setPitch(pitch);
}

function stopMoving(npc) {
    // Avoid clearing navigation repeatedly when the NPC already has no target.
    if (getString(npc, "v14_navMode", "idle") !== "idle") {
        npc.clearNavigation();
        setString(npc, "v14_navMode", "idle");
    }
    setNumber(npc, "v14_navTimer", 0);
}

function updateCombatMovement(npc, target, distance) {
    var movement = CONFIG.movement;
    var minimum = movement.combatDistance - movement.distanceTolerance;
    var maximum = movement.combatDistance + movement.distanceTolerance;
    var mode = distance > maximum ? "approach" : (distance < minimum ? "retreat" : "strafe");
    var previousMode = getString(npc, "v14_navMode", "idle");

    // Only refresh a path after a meaningful interval, or if movement mode changes.
    if (mode === previousMode && getNumber(npc, "v14_navTimer", 0) > 0) return;

    var dx = npc.getX() - target.getX();
    var dz = npc.getZ() - target.getZ();
    var horizontal = Math.sqrt(dx * dx + dz * dz);
    if (horizontal < 0.001) { dx = 1.0; dz = 0.0; horizontal = 1.0; }
    dx /= horizontal;
    dz /= horizontal;

    var destX = target.getX() + dx * movement.combatDistance;
    var destZ = target.getZ() + dz * movement.combatDistance;
    var refresh = movement.approachRefreshTicks;

    if (mode === "strafe") {
        var side = -getNumber(npc, "v14_strafeSide", 1);
        setNumber(npc, "v14_strafeSide", side);
        destX += (-dz) * movement.strafeDistance * side;
        destZ += dx * movement.strafeDistance * side;
        refresh = movement.strafeRefreshTicks;
    }

    npc.navigateTo(destX, target.getY(), destZ, movement.speed);
    setString(npc, "v14_navMode", mode);
    setNumber(npc, "v14_navTimer", Math.max(CONFIG.combatUpdateInterval, refresh));
}

function isAbilityInRange(ability, distance) {
    return distance >= ability.minRange && distance <= ability.maxRange;
}
function isAbilityReady(npc, index) {
    return getNumber(npc, "v14_cd_" + index, 0) <= 0;
}

function chooseAbility(npc, distance) {
    var candidates = [];
    var totalWeight = 0;
    for (var i = 0; i < CONFIG.abilities.length; i++) {
        var a = CONFIG.abilities[i];
        if (!isAbilityInRange(a, distance) || !isAbilityReady(npc, i) || a.weight <= 0) continue;
        candidates.push(i);
        totalWeight += a.weight;
    }
    if (candidates.length === 0 || totalWeight <= 0) return -1;

    var r = Math.random() * totalWeight;
    var cumulative = 0;
    for (var j = 0; j < candidates.length; j++) {
        var index = candidates[j];
        cumulative += CONFIG.abilities[index].weight;
        if (r < cumulative) return index;
    }
    return candidates[candidates.length - 1];
}

function debugCombatStatus(npc, distance) {
    var parts = ["§eDist §f" + distance.toFixed(2) + " blocks"];
    for (var i = 0; i < CONFIG.abilities.length; i++) {
        var ability = CONFIG.abilities[i];
        var label = ability.element + "/" + (ability.system === "dynamicdojutsu" ? "Steel" : (ability.id.indexOf("rasenshuriken") >= 0 ? "Rasen" : "Fireball"));
        if (!isAbilityInRange(ability, distance)) {
            parts.push("§c" + label + ":range");
        } else {
            var cooldown = getNumber(npc, "v14_cd_" + i, 0);
            parts.push(cooldown > 0 ? "§6" + label + ":CD" + (cooldown / 20.0).toFixed(1) + "s" : "§a" + label + ":READY");
        }
    }
    var lock = getNumber(npc, "v14_globalLock", 0);
    if (lock > 0) parts.push("§7LOCK:" + (lock / 20.0).toFixed(1) + "s");
    npc.say(parts.join(" §8| "));
}

function createJutsuStack(typeName) {
    try {
        if (typeName === "FUTON") return new ItemStack(ItemFuton.block);
        if (typeName === "SENJUTSU") return new ItemStack(ItemSenjutsu.block);
    } catch (err) {
        debugLog("Jutsu stack creation error: " + err);
    }
    return new ItemStack(Items.field_151055_y);
}

function resolveNarutoJutsu(fullId) {
    if (Object.prototype.hasOwnProperty.call(jutsuCache, fullId)) return jutsuCache[fullId];
    var parts = fullId.split(":");
    if (parts.length !== 2) return null;

    var type;
    try { type = JutsuEnum.Type.valueOf(parts[0]); }
    catch (err) { debugLog("Invalid jutsu type " + parts[0]); return null; }

    var list = JutsuEnum.getJutsuList();
    for (var i = 0; i < list.size(); i++) {
        var entry = list.get(i);
        if (entry.getType() === type && entry.unlocalizedName === parts[1]) {
            jutsuCache[fullId] = entry;
            return entry;
        }
    }
    return null;
}

function castAbility(npc, ability) {
    try {
        if (ability.system === "narutomod") {
            var selected = resolveNarutoJutsu(ability.id);
            if (!selected) { debugLog("Unresolved NarutoMod jutsu: " + ability.id); return false; }
            var typeName = ability.id.split(":")[0];
            var stack = createJutsuStack(typeName);
            var result = selected.jutsu.createJutsu(stack, npc.getMCEntity(), ability.power);
            if (result === false) { debugLog("Jutsu rejected: " + ability.id); return false; }
            announceJutsu(npc, ability);
            return true;
        }
        if (ability.system === "dynamicdojutsu") {
            if (!ShinobiAPI.exists(npc, ability.id)) {
                debugLog("Unknown DynamicDojutsu ability: " + ability.id);
                return false;
            }
            var castResult = ShinobiAPI.cast(npc, ability.id);
            if (castResult === false) { debugLog("DynamicDojutsu cast rejected: " + ability.id); return false; }
            announceJutsu(npc, ability);
            return true;
        }
    } catch (err) {
        print("[Naruto V14] Cast failed (" + ability.id + "): " + err);
    }
    return false;
}

function announceJutsu(npc, ability) {
    if (CONFIG.announceCasts) npc.say(ability.color + "[" + ability.element + "] » " + ability.name);
}
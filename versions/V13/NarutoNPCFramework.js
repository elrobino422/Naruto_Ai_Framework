/*
 * Naruto CustomNPC Framework V13
 *
 * SCRIPT TYPE:
 * NPC combat framework
 *
 * REPLACES:
 * V12
 *
 * LOAD ON:
 * NPC
 */

var ShinobiAPI = Java.type(
    "com.leolifeless.dynamicdojutsu.compat.customnpcs.ShinobiNPCScriptAPI"
);

var JutsuEnum = Java.type(
    "net.narutomod.item.ItemJutsu$JutsuEnum"
);

var ItemStack = Java.type(
    "net.minecraft.item.ItemStack"
);

var Items = Java.type(
    "net.minecraft.init.Items"
);

var ItemFuton = Java.type(
    "net.narutomod.item.ItemFuton"
);

var ItemSenjutsu = Java.type(
    "net.narutomod.item.ItemSenjutsu"
);


/* =========================================================
 * CONFIG
 * ========================================================= */

var CONFIG = {

    debug: false,

    /*
     * How often combat logic updates.
     *
     * 5 ticks = 0.25 seconds
     */
    updateInterval: 5,


    /*
     * COMBAT MOVEMENT
     */

    movement: {

        /*
         * Preferred distance from the target.
         *
         * 8 blocks means all three current abilities
         * are normally available.
         */
        combatDistance: 8.0,

        /*
         * Distance tolerance.
         *
         * If the NPC is between:
         *
         * 6.5 and 9.5
         *
         * it will generally hold position.
         */
        distanceTolerance: 1.5,

        /*
         * Movement speed passed to CustomNPCs navigateTo().
         */
        speed: 1.0,

        /*
         * How far sideways the NPC tries to move
         * when orbiting the target.
         */
        strafeDistance: 3.0,

        /*
         * How frequently the combat position changes.
         */
        repositionInterval: 20
    },


    /*
     * GLOBAL CAST LOCK
     *
     * Prevents several abilities from being cast
     * immediately one after another.
     */
    globalCastLock: 10,


    /*
     * ABILITIES
     */

    abilities: [

        {
            system: "narutomod",

            id: "KATON:katonfireball",

            name: "Gōkakyū no Jutsu",

            element: "Katon",

            color: "§c",

            power: 1.0,

            minRange: 4,

            maxRange: 15,

            cooldown: 40,

            weight: 100
        },


        {
            system: "narutomod",

            id: "FUTON:rasenshuriken",

            name: "Rasenshuriken",

            element: "Fūton",

            color: "§f",

            power: 1.0,

            minRange: 5,

            maxRange: 20,

            cooldown: 70,

            weight: 25
        },


        {
            system: "dynamicdojutsu",

            id: "steel_steel_projectile",

            name: "Steel Projectile",

            element: "Steel",

            color: "§7",

            minRange: 3,

            maxRange: 15,

            cooldown: 25,

            weight: 50
        }

    ]
};


/* =========================================================
 * STORED DATA HELPERS
 * ========================================================= */

function data(npc) {
    return npc.getStoreddata();
}


function getNumber(npc, key, fallback) {

    var d = data(npc);

    if (!d.has(key)) {
        return fallback;
    }

    var value = Number(d.get(key));

    if (isNaN(value)) {
        return fallback;
    }

    return value;
}


function setNumber(npc, key, value) {

    data(npc).put(key, value);
}


/* =========================================================
 * INITIALIZATION
 * ========================================================= */

function init(e) {

    var npc = e.npc;

    setNumber(npc, "v13_globalLock", 0);
    setNumber(npc, "v13_moveTimer", 0);
    setNumber(npc, "v13_strafeSide", 1);

    for (var i = 0; i < CONFIG.abilities.length; i++) {

        var ability = CONFIG.abilities[i];

        setNumber(
            npc,
            "v13_cd_" + i,
            0
        );
    }

    if (CONFIG.debug) {
        npc.say("§aNaruto Combat Framework V13 loaded.");
    }
}


/* =========================================================
 * TICK
 * ========================================================= */

function tick(e) {

    var npc = e.npc;

    /*
     * Only perform the expensive combat logic
     * every CONFIG.updateInterval ticks.
     */

    var timer = getNumber(
        npc,
        "v13_updateTimer",
        0
    );

    timer--;

    if (timer > 0) {

        setNumber(
            npc,
            "v13_updateTimer",
            timer
        );

        return;
    }

    setNumber(
        npc,
        "v13_updateTimer",
        CONFIG.updateInterval
    );


    /*
     * Update cooldowns.
     */

    updateCooldowns(npc);


    /*
     * Get current target.
     */

    var target = npc.getAttackTarget();

    if (!target) {

        stopMoving(npc);

        return;
    }


    if (!target.isAlive()) {

        stopMoving(npc);

        return;
    }


    /*
     * Calculate distance.
     */

    var distance = getDistance(
        npc,
        target
    );

    debugCombatStatus(
    npc,
    target,
    distance
    );

    /*
     * Always face the target.
     */

    faceTarget(
        npc,
        target
    );


    /*
     * Combat movement.
     */

    updateCombatMovement(
        npc,
        target,
        distance
    );


    /*
     * Global cast lock.
     */

    var globalLock = getNumber(
        npc,
        "v13_globalLock",
        0
    );

    if (globalLock > 0) {

        return;
    }


    /* =========================================================
 * TEMPORARY DEBUG DISPLAY
 * ========================================================= */

function debugCombatStatus(npc, target, distance) {

    var lines = [];

    lines.push(
        "§eDistance: §f" +
        distance.toFixed(2)
    );

    for (var i = 0; i < CONFIG.abilities.length; i++) {

        var ability = CONFIG.abilities[i];

        var inRange = isAbilityInRange(
            ability,
            distance
        );

        var ready = isAbilityReady(
            npc,
            i
        );

        var status;

        if (!inRange) {

            status =
                "§c✗ " +
                ability.name +
                " §7[range]";

        } else if (!ready) {

            var cooldown =
                getNumber(
                    npc,
                    "v13_cd_" + i,
                    0
                );

            status =
                "§c✗ " +
                ability.name +
                " §7[CD " +
                cooldown +
                "]";

        } else {

            status =
                "§a✓ " +
                ability.name +
                " §7[READY]";
        }

        lines.push(status);
        }


    /*
     * Display one message at a time.
     *
     * CustomNPC chat messages are much easier to read
     * than trying to print everything in one huge line.
     */

    for (var j = 0; j < lines.length; j++) {

        npc.say(lines[j]);
        }
    }

    /*
     * Find an ability that can currently be used.
     */

    var abilityIndex = chooseAbility(
        npc,
        target,
        distance
    );


    if (abilityIndex < 0) {

        return;
    }


    /*
     * Cast exactly ONE ability.
     */

    var success = castAbility(
        npc,
        CONFIG.abilities[abilityIndex]
    );


    if (success) {

        /*
         * Global lock prevents another ability
         * from being immediately fired.
         */

        setNumber(
            npc,
            "v13_globalLock",
            CONFIG.globalCastLock
        );


        /*
         * Individual cooldown.
         */

        setNumber(
            npc,
            "v13_cd_" + abilityIndex,
            CONFIG.abilities[abilityIndex].cooldown
        );
    }
}


/* =========================================================
 * COOLDOWNS
 * ========================================================= */

function updateCooldowns(npc) {

    var globalLock = getNumber(
        npc,
        "v13_globalLock",
        0
    );

    if (globalLock > 0) {

        setNumber(
            npc,
            "v13_globalLock",
            globalLock - 1
        );
    }


    for (var i = 0; i < CONFIG.abilities.length; i++) {

        var key = "v13_cd_" + i;

        var cooldown = getNumber(
            npc,
            key,
            0
        );

        if (cooldown > 0) {

            setNumber(
                npc,
                key,
                cooldown - 1
            );
        }
    }
}


/* =========================================================
 * DISTANCE
 * ========================================================= */

function getDistance(npc, target) {

    var dx = target.getX() - npc.getX();
    var dy = target.getY() - npc.getY();
    var dz = target.getZ() - npc.getZ();

    return Math.sqrt(
        dx * dx +
        dy * dy +
        dz * dz
    );
}


/* =========================================================
 * AIMING
 * ========================================================= */

function faceTarget(npc, target) {

    var dx =
        target.getX() -
        npc.getX();

    var dy =
        (target.getY() + target.getEyeHeight()) -
        (npc.getY() + npc.getEyeHeight());

    var dz =
        target.getZ() -
        npc.getZ();


    /*
     * Horizontal distance.
     */

    var horizontalDistance = Math.sqrt(
        dx * dx +
        dz * dz
    );


    if (horizontalDistance < 0.001) {

        return;
    }


    /*
     * Minecraft yaw.
     */

    var yaw =
        Math.atan2(dz, dx) *
        180.0 /
        Math.PI -
        90.0;


    /*
     * Minecraft pitch.
     */

    var pitch =
        -Math.atan2(
            dy,
            horizontalDistance
        ) *
        180.0 /
        Math.PI;


    /*
     * These are confirmed CustomNPC API methods.
     */

    npc.setRotation(
        yaw
    );

    npc.setPitch(
        pitch
    );
}


/* =========================================================
 * COMBAT MOVEMENT
 * ========================================================= */

function updateCombatMovement(
    npc,
    target,
    distance
) {

    var movement =
        CONFIG.movement;


    var minimum =
        movement.combatDistance -
        movement.distanceTolerance;


    var maximum =
        movement.combatDistance +
        movement.distanceTolerance;


    /*
     * TOO FAR
     *
     * Move toward the target.
     */

    if (distance > maximum) {

        moveTowardTarget(
            npc,
            target
        );

        return;
    }


    /*
     * TOO CLOSE
     *
     * Move away from target.
     */

    if (distance < minimum) {

        retreatFromTarget(
            npc,
            target
        );

        return;
    }


    /*
     * GOOD DISTANCE
     *
     * Orbit / strafe instead of standing
     * completely still.
     */

    updateStrafeMovement(
        npc,
        target
    );
}


/* =========================================================
 * MOVE TOWARD TARGET
 * ========================================================= */

function moveTowardTarget(
    npc,
    target
) {

    /*
     * The target position itself is NOT used
     * as the destination.
     *
     * We stop before reaching the target.
     */

    var desired =
        CONFIG.movement.combatDistance;


    var dx =
        npc.getX() -
        target.getX();

    var dz =
        npc.getZ() -
        target.getZ();


    var horizontal =
        Math.sqrt(
            dx * dx +
            dz * dz
        );


    if (horizontal < 0.001) {

        return;
    }


    dx /= horizontal;
    dz /= horizontal;


    var destinationX =
        target.getX() +
        dx * desired;


    var destinationZ =
        target.getZ() +
        dz * desired;


    npc.navigateTo(
        destinationX,
        target.getY(),
        destinationZ,
        CONFIG.movement.speed
    );
}


/* =========================================================
 * RETREAT
 * ========================================================= */

function retreatFromTarget(
    npc,
    target
) {

    var dx =
        npc.getX() -
        target.getX();

    var dz =
        npc.getZ() -
        target.getZ();


    var horizontal =
        Math.sqrt(
            dx * dx +
            dz * dz
        );


    if (horizontal < 0.001) {

        /*
         * If we are directly on top of the target,
         * pick a deterministic direction.
         */

        dx = 1.0;
        dz = 0.0;

        horizontal = 1.0;
    }


    dx /= horizontal;
    dz /= horizontal;


    var desired =
        CONFIG.movement.combatDistance;


    var destinationX =
        target.getX() +
        dx * desired;


    var destinationZ =
        target.getZ() +
        dz * desired;


    npc.navigateTo(
        destinationX,
        target.getY(),
        destinationZ,
        CONFIG.movement.speed
    );
}


/* =========================================================
 * STRAFE / ORBIT
 * ========================================================= */

function updateStrafeMovement(
    npc,
    target
) {

    var timer =
        getNumber(
            npc,
            "v13_moveTimer",
            0
        );


    timer--;

    if (timer > 0) {

        return;
    }


    setNumber(
        npc,
        "v13_moveTimer",
        CONFIG.movement.repositionInterval
    );


    /*
     * Alternate left/right.
     */

    var side =
        getNumber(
            npc,
            "v13_strafeSide",
            1
        );


    side *= -1;


    setNumber(
        npc,
        "v13_strafeSide",
        side
    );


    /*
     * Direction from target -> NPC.
     */

    var dx =
        npc.getX() -
        target.getX();

    var dz =
        npc.getZ() -
        target.getZ();


    var horizontal =
        Math.sqrt(
            dx * dx +
            dz * dz
        );


    if (horizontal < 0.001) {

        dx = 1.0;
        dz = 0.0;

        horizontal = 1.0;
    }


    dx /= horizontal;
    dz /= horizontal;


    /*
     * Perpendicular vector.
     *
     * This creates the left/right strafe.
     */

    var perpX = -dz;
    var perpZ = dx;


    var desired =
        CONFIG.movement.combatDistance;


    var strafe =
        CONFIG.movement.strafeDistance *
        side;


    /*
     * Destination combines:
     *
     * radial distance
     * +
     * sideways movement
     */

    var destinationX =
        target.getX() +
        dx * desired +
        perpX * strafe;


    var destinationZ =
        target.getZ() +
        dz * desired +
        perpZ * strafe;


    npc.navigateTo(
        destinationX,
        target.getY(),
        destinationZ,
        CONFIG.movement.speed
    );
}


/* =========================================================
 * STOP MOVING
 * ========================================================= */

function stopMoving(npc) {

    /*
     * Confirmed CustomNPC API.
     */

    npc.clearNavigation();
}


/* =========================================================
 * ABILITY RANGE
 * ========================================================= */

function isAbilityInRange(
    ability,
    distance
) {

    return (
        distance >= ability.minRange &&
        distance <= ability.maxRange
    );
}


/* =========================================================
 * ABILITY COOLDOWN
 * ========================================================= */

function isAbilityReady(
    npc,
    index
) {

    return (
        getNumber(
            npc,
            "v13_cd_" + index,
            0
        ) <= 0
    );
}


/* =========================================================
 * ABILITY SELECTION
 * ========================================================= */

function chooseAbility(
    npc,
    target,
    distance
) {

    var candidates = [];
    var totalWeight = 0;


    for (
        var i = 0;
        i < CONFIG.abilities.length;
        i++
    ) {

        var ability =
            CONFIG.abilities[i];


        /*
         * Distance filter.
         */

        if (!isAbilityInRange(
            ability,
            distance
        )) {

            continue;
        }


        /*
         * Cooldown filter.
         */

        if (!isAbilityReady(
            npc,
            i
        )) {

            continue;
        }


        /*
         * Invalid weight.
         */

        if (ability.weight <= 0) {

            continue;
        }


        candidates.push(i);

        totalWeight +=
            ability.weight;
    }


    /*
     * Nothing available.
     */

    if (
        candidates.length === 0 ||
        totalWeight <= 0
    ) {

        return -1;
    }


    /*
     * Weighted random selection.
     */

    var random =
        Math.random() *
        totalWeight;


    var current = 0;


    for (
        var j = 0;
        j < candidates.length;
        j++
    ) {

        var index =
            candidates[j];

        current +=
            CONFIG.abilities[index].weight;


        if (random < current) {

            return index;
        }
    }


    return candidates[
        candidates.length - 1
    ];
}


/* =========================================================
 * JUTSU STACK
 * ========================================================= */

function createJutsuStack(typeName) {

    try {

        if (typeName === "FUTON") {

            return new ItemStack(
                ItemFuton.block
            );
        }


        if (typeName === "SENJUTSU") {

            return new ItemStack(
                ItemSenjutsu.block
            );
        }

    } catch (err) {

        if (CONFIG.debug) {

            print(
                "Stack creation error: " +
                err
            );
        }
    }


    /*
     * Known working fallback from the
     * JutsuExecutor investigation.
     */

    return new ItemStack(
        Items.field_151055_y
    );
}


/* =========================================================
 * NARUTOMOD RESOLVER
 * ========================================================= */

function resolveNarutoJutsu(
    fullId
) {

    var split =
        fullId.split(":");


    if (split.length !== 2) {

        return null;
    }


    var typeName =
        split[0];

    var unlocalizedName =
        split[1];


    var type;

    try {

        type =
            JutsuEnum.Type.valueOf(
                typeName
            );

    } catch (err) {

        if (CONFIG.debug) {

            print(
                "Invalid Jutsu type: " +
                typeName
            );
        }

        return null;
    }


    var list =
        JutsuEnum.getJutsuList();


    for (
        var i = 0;
        i < list.size();
        i++
    ) {

        var entry =
            list.get(i);


        if (
            entry.getType() === type &&
            entry.unlocalizedName ===
                unlocalizedName
        ) {

            return entry;
        }
    }


    return null;
}


/* =========================================================
 * CAST ABILITY
 * ========================================================= */

function castAbility(
    npc,
    ability
) {

    try {

        /*
         * NARUTOMOD
         */

        if (
            ability.system ===
            "narutomod"
        ) {

            var selected =
                resolveNarutoJutsu(
                    ability.id
                );


            if (!selected) {

                if (CONFIG.debug) {

                    npc.say(
                        "§cCould not resolve " +
                        ability.id
                    );
                }

                return false;
            }


            var typeName =
                ability.id.split(":")[0];


            var stack =
                createJutsuStack(
                    typeName
                );


            var result =
                selected.jutsu.createJutsu(
                    stack,
                    npc.getMCEntity(),
                    ability.power
                );


            if (result === false) {

                if (CONFIG.debug) {

                    npc.say(
                        "§cJutsu rejected: " +
                        ability.name
                    );
                }

                return false;
            }


            announceJutsu(
                npc,
                ability
            );


            return true;
        }


        /*
         * DYNAMIC DOJUTSU
         */

        if (
            ability.system ===
            "dynamicdojutsu"
        ) {

            if (
                !ShinobiAPI.exists(
                    npc,
                    ability.id
                )
            ) {

                if (CONFIG.debug) {

                    npc.say(
                        "§cDynamic ability not found: " +
                        ability.id
                    );
                }

                return false;
            }


            ShinobiAPI.cast(
                npc,
                ability.id
            );


            announceJutsu(
                npc,
                ability
            );


            return true;
        }


        return false;

    } catch (err) {

        print(
            "V13 cast error: " +
            err
        );

        return false;
    }
}


/* =========================================================
 * CHAT / CAST ANNOUNCEMENT
 * ========================================================= */

function announceJutsu(
    npc,
    ability
) {

    npc.say(
        ability.color +
        "[" +
        ability.element +
        "] » " +
        ability.name
    );
}
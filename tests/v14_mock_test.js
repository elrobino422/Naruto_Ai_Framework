/*
 * V14 simulated combat-loop regression checks.
 * Run from repository root: node tests/v14_mock_test.js
 * These use mocked Minecraft APIs and DO NOT replace in-game testing.
 */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');

const messages = [], casts = [], moves = [];
const registry = ['KATON', 'FUTON'].map(type => ({
    getType: () => type,
    unlocalizedName: type === 'KATON' ? 'katonfireball' : 'rasenshuriken',
    jutsu: { createJutsu: (stack, actor, power) => {
        casts.push({ type, power, stack: stack.val });
        return true;
    }}
}));
const types = {
    'com.leolifeless.dynamicdojutsu.compat.customnpcs.ShinobiNPCScriptAPI': {
        exists: () => true,
        cast: (npc, id) => { casts.push({ type:'STEEL', id }); return true; }
    },
    'net.narutomod.item.ItemJutsu$JutsuEnum': {
        Type: { valueOf: x => x },
        getJutsuList: () => ({ size: () => registry.length, get: i => registry[i] })
    },
    'net.minecraft.item.ItemStack': function(val) { this.val = val; },
    'net.minecraft.init.Items': { field_151055_y: 'stick' },
    'net.narutomod.item.ItemFuton': { block: 'futon-block' },
    'net.narutomod.item.ItemSenjutsu': { block: 'senjutsu-block' }
};
const fixedMath = Object.create(Math);
fixedMath.random = () => 0;
const ctx = {
    Java: { type: name => {
        if (!(name in types)) throw Error('Unexpected class: ' + name);
        return types[name];
    }},
    print: msg => messages.push(msg), Math: fixedMath, Number, String,
    isNaN, isFinite, Object
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../scripts/framework/NarutoNPCFramework.js'), 'utf8'), ctx);

const stored = new Map();
let target = {
    getX: () => 8, getY: () => 0, getZ: () => 0,
    getEyeHeight: () => 1.6, isAlive: () => true
};
const npc = {
    getStoreddata: () => ({
        has: key => stored.has(key),
        get: key => stored.get(key),
        put: (key, value) => stored.set(key, value)
    }),
    getAttackTarget: () => target,
    getX: () => 0, getY: () => 0, getZ: () => 0,
    getEyeHeight: () => 1.6,
    setRotation: () => {}, setPitch: () => {},
    navigateTo: (...args) => moves.push(args),
    clearNavigation: () => moves.push('clear'),
    say: msg => messages.push(msg),
    getMCEntity: () => ({})
};

ctx.init({ npc });
assert.equal(ctx.CONFIG.debug, false);
assert.equal(ctx.CONFIG.abilities[0].cooldownTicks, 200);
assert.equal(ctx.chooseAbility(npc, 2), -1);
assert.equal(ctx.chooseAbility(npc, 25), -1);
assert.equal(ctx.CONFIG.abilities.filter(a => ctx.isAbilityInRange(a, 18)).length, 1);

ctx.CONFIG.debug = true;
ctx.CONFIG.announceCasts = false;
for (let t = 0; t < 40; t++) ctx.tick({ npc });
assert.equal(messages.length, 1, 'One debug line per 40 game ticks');
assert.equal(moves.length, 1, 'Strafe request should not refresh every combat update');
assert.equal(casts.length, 1, 'Global lock prevents burst multi-cast');
assert.equal(stored.get('v14_globalLock'), 11);
assert.equal(stored.get('v14_cd_0'), 161, 'Cooldown decrements once per game tick');

for (let t = 40; t < 80; t++) ctx.tick({ npc });
assert.equal(messages.length, 2, 'Debug is throttled');
assert(casts.length >= 2, 'Further cast allowed when global lock expires');

target = null;
ctx.tick({ npc });
assert(moves.includes('clear'), 'Navigation clears when target disappears');

console.log('PASS: range, cooldown, cast lock, debug, navigation, target loss');
console.log('Casts: ' + casts.map(c => c.type).join(',') + '; navigation calls: ' + moves.length);

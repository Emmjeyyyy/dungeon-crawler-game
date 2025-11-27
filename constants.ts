
import { AbilityType, WeaponType, ItemRarity, PassiveItem } from "./types";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const TILE_SIZE = 64;

// Physics (Top Down - No Gravity)
export const FRICTION = 0.82;
export const PLAYER_SPEED = 3.5; // Faster base speed
export const PLAYER_DASH_FORCE = 22;

export const PLAYER_SIZE = { width: 16, height: 16 }; // Reduced from 32x32 to Torso size
export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_DAMAGE = 12;

// Combat Timing
export const ATTACK_COOLDOWN = 12; // Faster combat
export const HEAVY_ATTACK_COOLDOWN = 45;
export const DASH_COOLDOWN = 45;
export const ABILITY_BASE_COOLDOWN = 300; // 5 seconds

// Combo System
export const COMBO_DECAY = 120; // Frames before combo drops (2s)
export const COMBO_DAMAGE_MULT_PER_STACK = 0.02; // +2% per hit

// Visuals
export const HIT_STOP_LIGHT = 4;
export const HIT_STOP_HEAVY = 12;
export const DAMAGE_TEXT_LIFETIME = 45;

// Weapon Configs (Including Secondary Abilities)
export const WEAPONS = {
  [WeaponType.BLOOD_BLADE]: {
    name: 'Blood Blade',
    damageMult: 1.0,
    speedMult: 1.0,
    range: 52, // Matched to visual sword length
    arc: (Math.PI * 2) / 3, // Standardized 120-degree arc
    heavyMult: 2.0,
    color: '#ef4444', // Red 500
    cooldown: 18,
    description: 'Balanced slash attacks.',
    secondary: {
        type: AbilityType.BLOOD_WAVE,
        name: 'Blood Wave',
        cooldown: 180, // 3s
        color: '#dc2626',
        damageMult: 2.0,
        description: 'Launch a crimson wave that harvests souls.'
    }
  },
  [WeaponType.DUAL_FANGS]: {
    name: 'Dual Fangs',
    damageMult: 0.5,
    speedMult: 1.8,
    range: 45,
    arc: (Math.PI * 2) / 3, // Standardized 120-degree arc
    heavyMult: 1.5,
    color: '#f472b6', // Pink 400
    cooldown: 8,
    description: 'Rapid strikes, low damage.',
    secondary: {
        type: AbilityType.WHIRLING_FLURRY,
        name: 'Whirling Flurry',
        cooldown: 180, // 3s
        color: '#f9a8d4',
        damageMult: 1.0,
        duration: 20,
        speed: 25,
        description: 'Dash and spin through enemies.'
    }
  },
  [WeaponType.REAPER_AXE]: {
    name: 'Reaper Axe',
    damageMult: 2.5,
    speedMult: 0.5,
    range: 95,
    arc: (Math.PI * 2) / 3, // Standardized 120-degree arc
    heavyMult: 3.5,
    color: '#7f1d1d', // Red 900
    cooldown: 40,
    description: 'Slow, devastating cleaves.',
    secondary: {
        type: AbilityType.GROUND_CLEAVE,
        name: 'Ground Cleave',
        cooldown: 240, // 4s
        color: '#450a0a',
        damageMult: 4.0,
        radius: 120,
        description: 'Slam ground, AoE knockback.'
    }
  },
  [WeaponType.SHADOW_BOW]: {
    name: 'Shadow Bow',
    damageMult: 0.7,
    speedMult: 1.0,
    range: 400,
    arc: 0, // Projectile
    heavyMult: 1.5,
    color: '#94a3b8', // Slate 400
    cooldown: 20,
    description: 'Ranged shadow arrows.',
    secondary: {
        type: AbilityType.PIERCING_VOLLEY,
        name: 'Piercing Volley',
        cooldown: 150, // 2.5s
        color: '#cbd5e1',
        damageMult: 1.5,
        projectiles: 5,
        description: 'Fire a burst of piercing arrows.'
    }
  }
};

// Ability Configs (Only Primary remains as a constant config, secondary is in weapon)
export const ABILITIES = {
  [AbilityType.SHADOW_CALL]: {
    name: 'Shadow Call',
    cooldown: 30, // Short cooldown to prevent spam, but resource is Stacks
    color: '#22d3ee', // Cyan
    description: 'Release all collected souls as Shadow Allies.',
    slot: 'PRIMARY'
  }
};

export const PASSIVE_ITEMS: PassiveItem[] = [
    // COMMON
    {
        id: 'soldier_syringe',
        name: 'Neural Overclock',
        description: '+15% Attack Speed',
        rarity: ItemRarity.COMMON,
        icon: '⚡',
        statMod: { target: 'attackSpeed', value: 0.15, isMult: true }
    },
    {
        id: 'lens_maker',
        name: 'Ocular HUD Mk.I',
        description: '+10% Crit Chance',
        rarity: ItemRarity.COMMON,
        icon: '🎯',
        statMod: { target: 'critChance', value: 0.1, isMult: false }
    },
    {
        id: 'goat_hoof',
        name: 'Void Thrusters',
        description: '+10% Movement Speed',
        rarity: ItemRarity.COMMON,
        icon: '💨',
        statMod: { target: 'speed', value: 0.1, isMult: true }
    },
    {
        id: 'bison_steak',
        name: 'Synthetic Weave',
        description: '+25 Max Health',
        rarity: ItemRarity.COMMON,
        icon: '🧬',
        statMod: { target: 'maxHp', value: 25, isMult: false }
    },
    
    // UNCOMMON
    {
        id: 'hopoo_feather',
        name: 'Vampire\'s Capacitor',
        description: 'Heal 5 HP on Critical Strikes.',
        rarity: ItemRarity.UNCOMMON,
        icon: '🩸',
        effect: 'lifestealOnCrit'
    },
    {
        id: 'ukulele',
        name: 'Tesla Coil Arc',
        description: '25% chance to fire chain lightning on hit.',
        rarity: ItemRarity.UNCOMMON,
        icon: '🌩️',
        effect: 'chainLightning'
    },
    {
        id: 'atg_missile',
        name: 'Micro-Swarm Launcher',
        description: '10% chance to fire a missile on hit.',
        rarity: ItemRarity.UNCOMMON,
        icon: '🚀',
        effect: 'missileOnHit'
    },
    {
        id: 'predatory_instincts',
        name: 'Adrenaline Injector',
        description: 'Critical strikes increase attack speed.',
        rarity: ItemRarity.UNCOMMON,
        icon: '👺',
        effect: 'speedOnCrit'
    },
    
    // LEGENDARY
    {
        id: 'brilliant_behemoth',
        name: 'Volatile Core',
        description: 'All your attacks explode.',
        rarity: ItemRarity.LEGENDARY,
        icon: '💥',
        effect: 'explodeOnHit'
    },
    {
        id: 'ceremonial_dagger',
        name: 'Soul-Seeker Drones',
        description: 'Killing an enemy fires homing energy.',
        rarity: ItemRarity.LEGENDARY,
        icon: '👻',
        effect: 'daggersOnKill'
    },
    {
        id: '57_clover',
        name: 'Quantum Dice',
        description: '+1 Luck. Reroll random effects.',
        rarity: ItemRarity.LEGENDARY,
        icon: '🎲',
        effect: 'luck'
    }
];

// Colors
export const COLORS = {
  background: '#020617', // Slate 950
  wall: '#1e293b', // Slate 800
  floor: '#0f172a', // Slate 900
  floorAlt: '#1e1b4b', // Dark Indigo (checker pattern)
  doorClosed: '#7f1d1d', // Red 900
  doorOpen: '#334155', // Slate 700
  player: '#f8fafc', // Slate 50
  echo: '#22d3ee', // Cyan 400 (Ghostly)
  echoTier2: '#8b5cf6', // Violet
  echoTier3: '#f43f5e', // Rose
  enemyStandard: '#b91c1c', // Red 700
  enemyElite: '#ca8a04', // Yellow 600
  enemyMystic: '#7e22ce', // Purple 700
  enemyBoss: '#dc2626', // Red 600
  text: '#f8fafc',
  damagePlayer: '#ffffff',
  damageEnemy: '#ef4444',
  heal: '#22c55e',
  buffDamage: '#ef4444',
  buffSpeed: '#3b82f6',
  abilityScroll: '#f59e0b', // Amber 500
  xp: '#3b82f6',
  interaction: '#fbbf24', // UI Prompt
  weaponDrop: '#94a3b8',
  portal: '#8b5cf6', // Violet 500
  
  // Rarity
  rarityCommon: '#f8fafc', // White
  rarityUncommon: '#84cc16', // Green
  rarityLegendary: '#ef4444' // Red
};
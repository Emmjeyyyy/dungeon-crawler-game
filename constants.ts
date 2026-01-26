
import { AbilityType, WeaponType, ItemRarity, PassiveItem, EnemyType } from "./types";

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const TILE_SIZE = 64;

// Physics (Top Down - No Gravity)
export const FRICTION = 0.82;
export const PLAYER_SPEED = 3.5; 
export const PLAYER_DASH_FORCE = 22;
export const SPRINT_SPEED_MULT = 1.6;

export const PLAYER_SIZE = { width: 16, height: 16 }; 
export const PLAYER_BASE_HP = 100;
export const PLAYER_BASE_DAMAGE = 12;

// Combat Timing
export const ATTACK_COOLDOWN = 12; 
export const HEAVY_ATTACK_COOLDOWN = 45;
export const DASH_COOLDOWN = 45;
export const ABILITY_BASE_COOLDOWN = 300; 

// Combo System
export const COMBO_DECAY = 120; 
export const COMBO_DAMAGE_MULT_PER_STACK = 0.02; 

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
    range: 52, 
    arc: (Math.PI * 2) / 3, 
    heavyMult: 2.0,
    color: '#ef4444', 
    cooldown: 18,
    description: 'Balanced slash attacks.',
    secondary: {
        type: AbilityType.BLOOD_WAVE,
        name: 'Blood Wave',
        cooldown: 180, 
        color: '#dc2626',
        damageMult: 2.0,
        description: 'Launch a crimson wave that harvests souls.'
    }
  },
  [WeaponType.CURSED_BLADE]: {
    name: 'Cursed Blade',
    damageMult: 0.85, 
    speedMult: 2.2, 
    range: 65, 
    arc: (Math.PI * 2) / 3,
    heavyMult: 1.5,
    color: '#4c1d95', 
    cooldown: 7, 
    description: 'Extremely fast, cursed katana strikes.',
    secondary: {
        type: AbilityType.CURSED_DASH,
        name: 'Shadow Strike',
        cooldown: 180, 
        color: '#7c3aed',
        damageMult: 2.0,
        duration: 15,
        speed: 30,
        description: 'Dash through enemies with a shadow slash.'
    }
  },
  [WeaponType.EXECUTIONER_AXE]: {
    name: 'Executioner Axe',
    damageMult: 2.5,
    speedMult: 0.5,
    range: 95,
    arc: (Math.PI * 2) / 3, 
    heavyMult: 3.5,
    color: '#334155', 
    cooldown: 40,
    description: 'Brutal double-edged heavy strikes.',
    secondary: {
        type: AbilityType.EXECUTIONER_SWIRL,
        name: 'Executioner Swirl',
        cooldown: 480, 
        color: '#7f1d1d',
        damageMult: 0.8, 
        radius: 80,
        description: 'Spin for 3s, dealing continuous damage.'
    }
  },
  [WeaponType.SHADOW_BOW]: {
    name: 'Shadow Bow',
    damageMult: 0.7,
    speedMult: 1.0,
    range: 400,
    arc: 0, 
    heavyMult: 1.5,
    color: '#7c3aed', 
    cooldown: 20,
    description: 'Ranged shadow arrows.',
    secondary: {
        type: AbilityType.PIERCING_VOLLEY,
        name: 'Piercing Volley',
        cooldown: 150, 
        color: '#d8b4fe',
        damageMult: 1.5,
        projectiles: 5,
        description: 'Fire a burst of piercing arrows.'
    }
  }
};

export const ABILITIES = {
  [AbilityType.SHADOW_CALL]: {
    name: 'Shadow Call',
    cooldown: 30, 
    color: '#22d3ee', 
    description: 'Release all collected souls as Shadow Allies.',
    slot: 'PRIMARY'
  }
};

export const PASSIVE_ITEMS: PassiveItem[] = [
    // COMMON
    {
        id: 'ion_booster',
        name: 'Ion Booster',
        description: '+12% Attack Speed',
        rarity: ItemRarity.COMMON,
        icon: '⚡',
        statMod: { target: 'attackSpeed', value: 0.12, isMult: true }
    },
    {
        id: 'phantom_lens',
        name: 'Phantom Lens',
        description: '+8% Crit Chance',
        rarity: ItemRarity.COMMON,
        icon: '🧿',
        statMod: { target: 'critChance', value: 0.08, isMult: false }
    },
    {
        id: 'rift_striders',
        name: 'Rift Striders',
        description: '+12% Movement Speed',
        rarity: ItemRarity.COMMON,
        icon: '👟',
        statMod: { target: 'speed', value: 0.12, isMult: true }
    },
    {
        id: 'bio_shell',
        name: 'Bio-Reinforced Shell',
        description: '+30 Max Health',
        rarity: ItemRarity.COMMON,
        icon: '🐢',
        statMod: { target: 'maxHp', value: 30, isMult: false }
    },
    {
        id: 'carbon_stabilizer',
        name: 'Carbon Stabilizer',
        description: '+10% Damage Reduction',
        rarity: ItemRarity.COMMON,
        icon: '🛡️',
        statMod: { target: 'damageReduction', value: 0.10, isMult: false }
    },
    {
        id: 'void_prism',
        name: 'Void Prism',
        description: '+25% Critical Hit Damage',
        rarity: ItemRarity.COMMON,
        icon: '💎',
        statMod: { target: 'critDamage', value: 0.25, isMult: false }
    },
    {
        id: 'grav_pulse_unit',
        name: 'Grav-Pulse Unit',
        description: '+50 Item Pickup Range',
        rarity: ItemRarity.COMMON,
        icon: '🧲',
        statMod: { target: 'pickupRange', value: 50, isMult: false }
    },

    // UNCOMMON
    {
        id: 'blood_conduit',
        name: 'Blood Conduit',
        description: 'Heal 3 HP on hit',
        rarity: ItemRarity.UNCOMMON,
        icon: '🩸',
        effect: 'healOnHit'
    },
    {
        id: 'arc_repeater',
        name: 'Arc Repeater Node',
        description: '20% chance to fire electric pulse',
        rarity: ItemRarity.UNCOMMON,
        icon: '🔌',
        effect: 'lightningOnHit'
    },
    {
        id: 'nanite_pod',
        name: 'Nanite Swarm Pod',
        description: 'Apply stacking nanite DoT on hit',
        rarity: ItemRarity.UNCOMMON,
        icon: '🦠',
        effect: 'naniteOnHit'
    },
    {
        id: 'berserker_cortex',
        name: 'Berserker Cortex',
        description: 'Taking damage increases attack speed',
        rarity: ItemRarity.UNCOMMON,
        icon: '😡',
        effect: 'berserkOnHit'
    },
    {
        id: 'gravity_shredder',
        name: 'Gravity Shredder Shards',
        description: '+15% Cooldown Reduction',
        rarity: ItemRarity.UNCOMMON,
        icon: '⏳',
        statMod: { target: 'cooldownReduction', value: 0.15, isMult: false }
    },
    {
        id: 'thorned_plating',
        name: 'Thorned Plating',
        description: 'Reflect 30% of damage taken back to attacker',
        rarity: ItemRarity.UNCOMMON,
        icon: '🌵',
        effect: 'reflectDamage'
    },
    {
        id: 'volatile_catalyst',
        name: 'Volatile Catalyst',
        description: 'Enemies explode on death',
        rarity: ItemRarity.UNCOMMON,
        icon: '💣',
        effect: 'explodeOnKill'
    },
    {
        id: 'thunderstep_module',
        name: 'Thunderstep Module',
        description: 'Dashing releases electric shockwaves',
        rarity: ItemRarity.UNCOMMON,
        icon: '🌩️',
        effect: 'lightningDash'
    },

    // LEGENDARY
    {
        id: 'oblivion_engine',
        name: 'Oblivion Engine',
        description: 'Attacks emit void implosions',
        rarity: ItemRarity.LEGENDARY,
        icon: '⚫',
        effect: 'voidOnAttack'
    },
    {
        id: 'spectral_choir',
        name: 'Spectral Choir',
        description: 'Kills summon spectral allies',
        rarity: ItemRarity.LEGENDARY,
        icon: '👻',
        effect: 'ghostOnKill'
    },
    {
        id: 'fatebreaker_catalyst',
        name: 'Fatebreaker Catalyst',
        description: '+1 Luck and amplifies random effects',
        rarity: ItemRarity.LEGENDARY,
        icon: '🍀',
        statMod: { target: 'luck', value: 1, isMult: false }
    },
    {
        id: 'cataclysm_vein',
        name: 'Cataclysm Vein',
        description: 'Survive lethal damage once, explode',
        rarity: ItemRarity.LEGENDARY,
        icon: '❤️‍🔥',
        effect: 'revive'
    },
    {
        id: 'chrono_splitter',
        name: 'Chrono Splitter',
        description: 'Dodging creates a time-clone',
        rarity: ItemRarity.LEGENDARY,
        icon: '👥',
        effect: 'cloneOnDodge'
    },
    {
        id: 'echo_amplifier',
        name: 'Echo Amplifier',
        description: 'Echoes deal 100% more damage and move faster',
        rarity: ItemRarity.LEGENDARY,
        icon: '🔊',
        effect: 'strongEchoes'
    },
    {
        id: 'gemini_protocol',
        name: 'Gemini Protocol',
        description: '30% chance to double cast attacks',
        rarity: ItemRarity.LEGENDARY,
        icon: '👯',
        effect: 'doubleCast'
    }
];

// Colors
export const COLORS = {
  background: '#020617', 
  wall: '#1e293b', 
  floor: '#0f172a', 
  floorAlt: '#1e1b4b', 
  doorClosed: '#7f1d1d', 
  doorOpen: '#334155', 
  player: '#f8fafc', 
  echo: '#22d3ee', 
  echoTier2: '#8b5cf6', 
  echoTier3: '#f43f5e', 
  
  // Enemy Colors
  enemyStandard: '#b91c1c', 
  enemyElite: '#ca8a04', 
  enemyMystic: '#7e22ce', 
  enemyBoss: '#dc2626', 
  enemyVoidRatch: '#475569', 
  enemyIronHulk: '#1e293b',
  enemyAcolyte: '#14b8a6',
  enemyStrider: '#0f172a',

  text: '#f8fafc',
  damagePlayer: '#ffffff',
  damageEnemy: '#ef4444',
  heal: '#22c55e',
  // buffDamage and buffSpeed removed
  abilityScroll: '#f59e0b', 
  xp: '#3b82f6',
  interaction: '#fbbf24', 
  weaponDrop: '#94a3b8',
  portal: '#8b5cf6', 
  
  // Rarity
  rarityCommon: '#f8fafc', 
  rarityUncommon: '#84cc16', 
  rarityLegendary: '#ef4444' 
};

// Story Mode Floor Configuration
export const STORY_FLOORS = [
    { name: 'The Ashen Outskirts', pool: [EnemyType.STANDARD, EnemyType.VOID_RATCH] },
    { name: 'Whispering Catacombs', pool: [EnemyType.STANDARD, EnemyType.CORRUPTED_ACOLYTE] },
    { name: 'Forgotten Armory', pool: [EnemyType.IRON_HULK, EnemyType.VOID_RATCH] },
    { name: 'The Iron Foundry', pool: [EnemyType.IRON_HULK, EnemyType.ELITE] },
    { name: 'Crimson Altar', pool: [EnemyType.STANDARD] }, // Boss Floor (Floor 5)
    { name: 'Hall of Mirrors', pool: [EnemyType.SHADOW_STRIDER, EnemyType.CORRUPTED_ACOLYTE] },
    { name: 'Void Nexus', pool: [EnemyType.VOID_RATCH, EnemyType.ELITE] },
    { name: 'Sanctum of Silence', pool: [EnemyType.SHADOW_STRIDER, EnemyType.IRON_HULK] },
    { name: 'The Ascendant Stair', pool: [EnemyType.ELITE, EnemyType.MYSTIC] },
    { name: 'Throne of the Curator', pool: [] } // Final Boss Floor (Floor 10)
];

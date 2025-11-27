

export enum EntityType {
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  ECHO = 'ECHO',
  PROJECTILE = 'PROJECTILE',
  ITEM = 'ITEM',
  PARTICLE = 'PARTICLE',
  PROP = 'PROP'
}

export enum GameMode {
  DUNGEON = 'DUNGEON',
  BOSS_RUSH = 'BOSS_RUSH' // Reserved for future
}

export enum EnemyType {
  STANDARD = 'STANDARD', // Weak, fast
  ELITE = 'ELITE',       // Tanky, slower
  MYSTIC = 'MYSTIC',     // Ranged/Special
  BOSS = 'BOSS'
}

export enum ItemType {
  BLOOD_VIAL = 'BLOOD_VIAL', // Heal
  BUFF_DAMAGE = 'BUFF_DAMAGE', // Temp Damage Up
  BUFF_SPEED = 'BUFF_SPEED',   // Temp Speed Up
  WEAPON_DROP = 'WEAPON_DROP',
  PORTAL = 'PORTAL' // New Portal Object
}

export enum WeaponType {
  BLOOD_BLADE = 'BLOOD_BLADE', // Sword
  DUAL_FANGS = 'DUAL_FANGS',   // Fast Daggers
  REAPER_AXE = 'REAPER_AXE',   // Heavy Slow
  SHADOW_BOW = 'SHADOW_BOW'    // Ranged
}

export enum AbilityType {
  SHADOW_CALL = 'SHADOW_CALL', // Primary (Q)
  
  // Weapon Specific Secondaries
  BLOOD_WAVE = 'BLOOD_WAVE', // Blood Blade (New)
  HEAVY_SWING = 'HEAVY_SWING', // Deprecated but kept for compatibility if needed
  WHIRLING_FLURRY = 'WHIRLING_FLURRY', // Dual Fangs
  GROUND_CLEAVE = 'GROUND_CLEAVE', // Reaper Axe
  PIERCING_VOLLEY = 'PIERCING_VOLLEY', // Shadow Bow
  
  // Map Pickups (Disabled for now)
  SAMURAI_SLASH = 'SAMURAI_SLASH',
  BLOOD_NOVA = 'BLOOD_NOVA',
  PHASE_SHIFT = 'PHASE_SHIFT',
  SPECTRAL_DAGGERS = 'SPECTRAL_DAGGERS'
}

export enum ItemRarity {
  COMMON = 'COMMON',     // White
  UNCOMMON = 'UNCOMMON', // Green
  LEGENDARY = 'LEGENDARY' // Red
}

export interface PassiveItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  icon: string; // icon name
  statMod?: {
      target: 'damage' | 'speed' | 'attackSpeed' | 'critChance' | 'maxHp' | 'echoDuration';
      value: number; // Additive or Multiplicative base
      isMult?: boolean;
  };
  effect?: string; // 'bleed', 'chain', etc.
}

export interface Inventory {
  [itemId: string]: number; // itemId -> stack count
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Entity extends Rect {
  id: string;
  type: EntityType;
  vx: number;
  vy: number;
  color: string;
  isDead: boolean;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  value: number;
  isCrit: boolean;
  lifeTime: number;
  maxLifeTime: number;
  vx: number;
  vy: number;
  color: string;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  level: number;
  runes: number; // Currency
  xp: number;
  maxXp: number;
  
  // Controls
  facingX: number; // -1 or 1
  facingY: number; // -1 or 1
  aimAngle: number; // Angle in radians pointing to cursor
  isDashing: boolean;
  isSlashDashing: boolean; // Special ability state
  isAttacking: boolean;
  
  // Cooldowns
  attackCooldown: number;
  maxAttackCooldown: number; // For animation normalization
  heavyAttackCooldown: number;
  dashCooldown: number;
  
  abilityCooldown: number; // Primary (Q)
  secondaryAbilityCooldown: number; // Secondary (R-Click)
  interactionCooldown: number; // Prevent spam swapping
  
  invulnTimer: number;
  hitFlashTimer: number;
  slashDashTimer: number;
  
  // Loadout
  currentWeapon: WeaponType;
  inventory: Inventory; // Item Stacks
  
  activeAbility: AbilityType; // Primary Slot (Q)
  // secondaryAbility removed, derived from weapon
  
  // Stats
  stats: {
    damage: number;
    speed: number;
    attackSpeed: number;
    critChance: number;
    echoDurationMult: number;
  };

  // Shadow Army Mechanic
  shadowStack: EnemyType[];

  // Combo System
  combo: number;
  comboTimer: number;
  maxCombo: number;

  // Buffs
  activeBuffs: { type: ItemType; timer: number; value: number }[];
}

export interface Enemy extends Entity {
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  damage: number;
  attackCooldown: number;
  maxAttackCooldown: number; // For animation
  targetId: string | null;
  xpValue: number;
  agroRange: number;
  hitFlashTimer: number;
  scale: number;
  facingX: number;
  facingY: number;
  // Status Effects
  bleedStack?: number;
  bleedTimer?: number;
}

export interface Echo extends Entity {
  tier: number; // 1 = normal, 2 = merged, 3 = mystic
  lifeTime: number;
  maxLifeTime: number;
  targetId: string | null;
  damage: number;
  scale: number;
  facingX: number;
  facingY: number;
}

export interface Projectile extends Entity {
  damage: number;
  ownerId: string;
  lifeTime: number;
  piercing?: boolean;
  renderStyle?: 'DEFAULT' | 'WAVE' | 'DAGGER' | 'SHADOW_ARROW'; // For visual distinction
}

export interface Particle extends Entity {
  lifeTime: number;
  maxLifeTime: number;
  startColor: string;
  endColor: string;
}

export interface Item extends Entity {
  itemType: ItemType;
  value: number;
  floatOffset: number;
  payload?: any; // For ability type or weapon type
}

export enum TileType {
  VOID = 0,
  FLOOR = 1,
  WALL = 2,
  DOOR_OPEN = 3,
  DOOR_CLOSED = 4
}

export interface Room extends Rect {
  id: string;
  isCleared: boolean;
  isActive: boolean;
  doorTiles: { x: number, y: number }[]; // Coordinates of door tiles
}

export interface Dungeon {
  width: number;
  height: number;
  tileSize: number;
  grid: TileType[][];
  rooms: Room[];
  floor: number;
  portalRoomId: string; // The ID of the room where the portal spawns
}

export interface GameState {
  dungeon: Dungeon;
  player: Player;
  enemies: Enemy[];
  echoes: Echo[];
  projectiles: Projectile[];
  particles: Particle[];
  items: Item[];
  damageNumbers: DamageNumber[];
  interactionItem: Item | null; // Item under player feet
  
  camera: {
    x: number;
    y: number;
    shake: number;
  };
  
  score: number;
  time: number;
  timeScale: number;
  hitStop: number;
  isGameOver: boolean;
  isPaused: boolean;
  isTestMode: boolean;
  pendingLevelUp: boolean;
}
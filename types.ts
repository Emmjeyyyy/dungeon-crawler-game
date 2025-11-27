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
  BOSS_RUSH = 'BOSS_RUSH' 
}

export enum EnemyType {
  STANDARD = 'STANDARD', 
  ELITE = 'ELITE',       
  MYSTIC = 'MYSTIC',     
  BOSS = 'BOSS'
}

export enum ItemType {
  BLOOD_VIAL = 'BLOOD_VIAL', 
  BUFF_DAMAGE = 'BUFF_DAMAGE', 
  BUFF_SPEED = 'BUFF_SPEED',   
  BUFF_ATTACK_SPEED = 'BUFF_ATTACK_SPEED', // New for Berserker Cortex
  WEAPON_DROP = 'WEAPON_DROP',
  PORTAL = 'PORTAL' 
}

export enum WeaponType {
  BLOOD_BLADE = 'BLOOD_BLADE', 
  CURSED_BLADE = 'CURSED_BLADE', 
  EXECUTIONER_AXE = 'EXECUTIONER_AXE',   
  SHADOW_BOW = 'SHADOW_BOW'    
}

export enum AbilityType {
  SHADOW_CALL = 'SHADOW_CALL', 
  BLOOD_WAVE = 'BLOOD_WAVE', 
  HEAVY_SWING = 'HEAVY_SWING', 
  CURSED_DASH = 'CURSED_DASH', 
  EXECUTIONER_SWIRL = 'EXECUTIONER_SWIRL', 
  PIERCING_VOLLEY = 'PIERCING_VOLLEY', 
  SAMURAI_SLASH = 'SAMURAI_SLASH',
  BLOOD_NOVA = 'BLOOD_NOVA',
  PHASE_SHIFT = 'PHASE_SHIFT',
  SPECTRAL_DAGGERS = 'SPECTRAL_DAGGERS'
}

export enum ItemRarity {
  COMMON = 'COMMON',     
  UNCOMMON = 'UNCOMMON', 
  LEGENDARY = 'LEGENDARY' 
}

export interface PassiveItem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  icon: string; 
  statMod?: {
      target: 'damage' | 'speed' | 'attackSpeed' | 'critChance' | 'maxHp' | 'echoDuration' | 'damageReduction' | 'cooldownReduction' | 'luck';
      value: number; 
      isMult?: boolean;
  };
  effect?: string; 
}

export interface Inventory {
  [itemId: string]: number; 
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
  runes: number; 
  xp: number;
  maxXp: number;
  
  facingX: number; 
  facingY: number; 
  aimAngle: number; 
  isDashing: boolean;
  isSlashDashing: boolean; 
  isAttacking: boolean;
  
  isSpinning: boolean;
  spinTimer: number;
  spinTickTimer: number; 

  swingHitList: string[]; 

  attackCooldown: number;
  maxAttackCooldown: number; 
  heavyAttackCooldown: number;
  dashCooldown: number;
  
  abilityCooldown: number; 
  secondaryAbilityCooldown: number; 
  interactionCooldown: number; 
  
  invulnTimer: number;
  hitFlashTimer: number;
  slashDashTimer: number;
  
  currentWeapon: WeaponType;
  inventory: Inventory; 
  
  activeAbility: AbilityType; 
  
  stats: {
    damage: number;
    speed: number;
    attackSpeed: number;
    critChance: number;
    echoDurationMult: number;
    damageReduction: number;
    cooldownReduction: number;
    luck: number;
  };

  shadowStack: EnemyType[];

  combo: number;
  comboTimer: number;
  maxCombo: number;

  activeBuffs: { type: ItemType; timer: number; value: number }[];
  reviveUsed: boolean; // For Cataclysm Vein
}

export interface Enemy extends Entity {
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  damage: number;
  attackCooldown: number;
  maxAttackCooldown: number; 
  targetId: string | null;
  xpValue: number;
  agroRange: number;
  hitFlashTimer: number;
  scale: number;
  facingX: number;
  facingY: number;
  
  bleedStack?: number;
  bleedTimer?: number;
  naniteStack?: number; // New DoT
  naniteTimer?: number;
  swirlTimer?: number; 
}

export interface Echo extends Entity {
  tier: number; 
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
  renderStyle?: 'DEFAULT' | 'WAVE' | 'DAGGER' | 'SHADOW_ARROW' | 'VOID_ORB'; 
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
  payload?: any; 
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
  doorTiles: { x: number, y: number }[]; 
}

export interface Dungeon {
  width: number;
  height: number;
  tileSize: number;
  grid: TileType[][];
  rooms: Room[];
  floor: number;
  portalRoomId: string; 
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
  interactionItem: Item | null; 
  
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
import { GameState, Player, WeaponType, AbilityType, EntityType } from '../types';
import * as C from '../constants';
import { createDungeon } from './dungeon';

export const recalculateStats = (player: Player) => {
    player.maxHp = C.PLAYER_BASE_HP;
    player.stats = {
        damage: C.PLAYER_BASE_DAMAGE,
        speed: C.PLAYER_SPEED,
        attackSpeed: 1.0,
        critChance: 0.05,
        echoDurationMult: 1.0
    };

    Object.entries(player.inventory).forEach(([itemId, stack]) => {
        const item = C.PASSIVE_ITEMS.find(i => i.id === itemId);
        if (item?.statMod) {
            const { target, value, isMult } = item.statMod;
            const totalVal = value * stack;
            
            if (target === 'maxHp') {
                const oldMax = player.maxHp;
                player.maxHp += totalVal;
                player.hp += (player.maxHp - oldMax);
            } else {
                const keyMap = {
                    'damage': 'damage', 'speed': 'speed', 'attackSpeed': 'attackSpeed',
                    'critChance': 'critChance', 'echoDuration': 'echoDurationMult'
                };
                const targetKey = keyMap[target] as keyof typeof player.stats;

                if (targetKey) {
                    if (isMult) {
                        player.stats[targetKey] *= Math.pow(1 + value, stack);
                    } else {
                        player.stats[targetKey] += totalVal;
                    }
                }
            }
        }
    });
     // Attack speed is inverse, so we modify cooldowns based on it
    player.stats.attackSpeed = 1 / (1 + (player.inventory['soldier_syringe'] || 0) * 0.15);
};

export const createInitialState = (): GameState => {
  const dungeon = createDungeon(1);
  const startRoom = dungeon.rooms[0];
  const px = (startRoom.x + startRoom.width/2) * C.TILE_SIZE;
  const py = (startRoom.y + startRoom.height/2) * C.TILE_SIZE;
  
  const camX = -(px - C.CANVAS_WIDTH / 2 + C.PLAYER_SIZE.width / 2);
  const camY = -(py - C.CANVAS_HEIGHT / 2 + C.PLAYER_SIZE.height / 2);

  const player: Player = {
      id: 'player',
      type: EntityType.PLAYER,
      x: px, y: py,
      width: C.PLAYER_SIZE.width, height: C.PLAYER_SIZE.height,
      vx: 0, vy: 0, color: C.COLORS.player, isDead: false,
      hp: C.PLAYER_BASE_HP, maxHp: C.PLAYER_BASE_HP,
      level: 1, runes: 0, xp: 0, maxXp: 100,
      facingX: 1, facingY: 1, aimAngle: 0,
      isDashing: false, isSlashDashing: false, isAttacking: false,
      attackCooldown: 0, maxAttackCooldown: 0, heavyAttackCooldown: 0, dashCooldown: 0,
      abilityCooldown: 0, secondaryAbilityCooldown: 0, interactionCooldown: 0,
      invulnTimer: 0, hitFlashTimer: 0, slashDashTimer: 0,
      currentWeapon: WeaponType.BLOOD_BLADE,
      inventory: {},
      activeAbility: AbilityType.SHADOW_CALL,
      stats: { damage: C.PLAYER_BASE_DAMAGE, speed: C.PLAYER_SPEED, attackSpeed: 1.0, critChance: 0.05, echoDurationMult: 1.0 },
      shadowStack: [],
      combo: 0, comboTimer: 0, maxCombo: 0,
      activeBuffs: []
  };

  return {
    dungeon, player,
    enemies: [], echoes: [], projectiles: [], particles: [], items: [], damageNumbers: [],
    interactionItem: null,
    camera: { x: camX, y: camY, shake: 0 },
    score: 0, time: 0, timeScale: 1.0,
    hitStop: 0, isGameOver: false, isPaused: false, pendingLevelUp: false,
  };
};
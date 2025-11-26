
import { useRef, useEffect, useCallback, useState } from 'react';
import { 
  GameState, Player, Enemy,
  EntityType, EnemyType, ItemType, WeaponType, AbilityType, TileType, Dungeon, Rect, Room, Entity, Item
} from '../types';
import * as C from '../constants';
import { PASSIVE_ITEMS } from '../constants';

// --- Generators ---

const createDungeon = (floor: number): Dungeon => {
  const width = 60;
  const height = 60;
  const grid: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.VOID));
  const rooms: Room[] = [];

  // Random Room Placement (Simple procedural)
  const roomCount = 10 + Math.floor(floor * 0.5);
  
  for (let i = 0; i < roomCount; i++) {
    const w = Math.floor(Math.random() * 8) + 8; // 8-16 size (larger rooms)
    const h = Math.floor(Math.random() * 8) + 8;
    const x = Math.floor(Math.random() * (width - w - 2)) + 1;
    const y = Math.floor(Math.random() * (height - h - 2)) + 1;

    const newRoom: Room = { 
        id: `room-${i}`,
        x, y, width: w, height: h,
        isCleared: i === 0, // Start room cleared
        isActive: i === 0,
        doorTiles: []
    };
    
    // Check overlap
    let overlap = false;
    for (const r of rooms) {
      if (
        x < r.x + r.width + 2 && x + w + 2 > r.x &&
        y < r.y + r.height + 2 && y + h + 2 > r.y
      ) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      // Carve Room
      for(let ry = y; ry < y + h; ry++) {
        for(let rx = x; rx < x + w; rx++) {
          grid[ry][rx] = TileType.FLOOR;
        }
      }
      rooms.push(newRoom);

      // Connect to previous room (L-Corridor)
      if (rooms.length > 1) {
        const prev = rooms[rooms.length - 2];
        const cx1 = Math.floor(prev.x + prev.width/2);
        const cy1 = Math.floor(prev.y + prev.height/2);
        const cx2 = Math.floor(newRoom.x + newRoom.width/2);
        const cy2 = Math.floor(newRoom.y + newRoom.height/2);

        // Carve path
        const carve = (tx: number, ty: number) => {
            if (grid[ty][tx] === TileType.VOID || grid[ty][tx] === TileType.WALL) {
                grid[ty][tx] = TileType.FLOOR;
            }
        };

        if (Math.random() < 0.5) {
          for (let xx = Math.min(cx1, cx2); xx <= Math.max(cx1, cx2); xx++) carve(xx, cy1);
          for (let yy = Math.min(cy1, cy2); yy <= Math.max(cy1, cy2); yy++) carve(cx2, yy);
        } else {
          for (let yy = Math.min(cy1, cy2); yy <= Math.max(cy1, cy2); yy++) carve(cx1, yy);
          for (let xx = Math.min(cx1, cx2); xx <= Math.max(cx1, cx2); xx++) carve(xx, cy2);
        }
      }
    }
  }

  // Post-process: Add Walls and Identify Doors
  for(const room of rooms) {
      // Check perimeter
      for(let x = room.x - 1; x <= room.x + room.width; x++) {
          for(let y = room.y - 1; y <= room.y + room.height; y++) {
              if (x >= 0 && x < width && y >= 0 && y < height) {
                  const isPerimeter = x === room.x - 1 || x === room.x + room.width || y === room.y - 1 || y === room.y + room.height;
                  
                  if (grid[y][x] === TileType.FLOOR && isPerimeter) {
                      grid[y][x] = TileType.DOOR_OPEN;
                      room.doorTiles.push({x, y});
                  } else if (grid[y][x] === TileType.VOID) {
                      grid[y][x] = TileType.WALL;
                  }
              }
          }
      }
  }

  // Ensure walls surround everything
  for(let y=0; y<height; y++) {
    for(let x=0; x<width; x++) {
        if (grid[y][x] === TileType.VOID) {
            let neighborFloor = false;
            for(let dy=-1; dy<=1; dy++) {
                for(let dx=-1; dx<=1; dx++) {
                    if (y+dy >= 0 && y+dy < height && x+dx >= 0 && x+dx < width) {
                        const n = grid[y+dy][x+dx];
                        if (n === TileType.FLOOR || n === TileType.DOOR_OPEN) neighborFloor = true;
                    }
                }
            }
            if (neighborFloor) grid[y][x] = TileType.WALL;
        }
    }
  }

  const portalRoomId = rooms[rooms.length - 1].id;

  return { width, height, tileSize: C.TILE_SIZE, grid, rooms, floor, portalRoomId };
};

const recalculateStats = (player: Player) => {
    // Reset to Base
    player.maxHp = C.PLAYER_BASE_HP;
    player.stats = {
        damage: C.PLAYER_BASE_DAMAGE,
        speed: C.PLAYER_SPEED,
        attackSpeed: 1.0,
        critChance: 0.05,
        echoDurationMult: 1.0
    };

    // Apply Items
    Object.entries(player.inventory).forEach(([itemId, stack]) => {
        const item = PASSIVE_ITEMS.find(i => i.id === itemId);
        if (item && item.statMod) {
            const mod = item.statMod;
            const totalVal = mod.value * stack;
            
            if (mod.target === 'maxHp') {
                const oldMax = player.maxHp;
                player.maxHp += totalVal;
                player.hp += (player.maxHp - oldMax); // Heal the difference
            } else {
                let targetKey: keyof typeof player.stats | null = null;
                if (mod.target === 'damage') targetKey = 'damage';
                if (mod.target === 'speed') targetKey = 'speed';
                if (mod.target === 'attackSpeed') targetKey = 'attackSpeed';
                if (mod.target === 'critChance') targetKey = 'critChance';
                if (mod.target === 'echoDuration') targetKey = 'echoDurationMult';

                if (targetKey) {
                    if (mod.isMult) {
                        if (mod.target === 'attackSpeed' || mod.target === 'speed') {
                             player.stats[targetKey] += totalVal; 
                        } else {
                             player.stats[targetKey] *= (1 + totalVal);
                        }
                    } else {
                        player.stats[targetKey] += totalVal;
                    }
                }
            }
        }
    });
};

const createInitialState = (): GameState => {
  const dungeon = createDungeon(1);
  const startRoom = dungeon.rooms[0];
  const px = (startRoom.x + startRoom.width/2) * C.TILE_SIZE;
  const py = (startRoom.y + startRoom.height/2) * C.TILE_SIZE;
  
  // Center camera on player initially
  const camX = -(px - C.CANVAS_WIDTH / 2 + C.PLAYER_SIZE.width / 2);
  const camY = -(py - C.CANVAS_HEIGHT / 2 + C.PLAYER_SIZE.height / 2);

  return {
    dungeon,
    player: {
      id: 'player',
      type: EntityType.PLAYER,
      x: px,
      y: py,
      width: C.PLAYER_SIZE.width,
      height: C.PLAYER_SIZE.height,
      vx: 0,
      vy: 0,
      color: C.COLORS.player,
      isDead: false,
      hp: C.PLAYER_BASE_HP,
      maxHp: C.PLAYER_BASE_HP,
      level: 1,
      runes: 0,
      xp: 0,
      maxXp: 100,
      facingX: 1,
      facingY: 1,
      aimAngle: 0,
      isDashing: false,
      isSlashDashing: false,
      isAttacking: false,
      attackCooldown: 0,
      maxAttackCooldown: 0,
      heavyAttackCooldown: 0,
      dashCooldown: 0,
      abilityCooldown: 0,
      secondaryAbilityCooldown: 0,
      interactionCooldown: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      slashDashTimer: 0,
      currentWeapon: WeaponType.BLOOD_BLADE,
      inventory: {},
      activeAbility: AbilityType.SHADOW_CALL, // Primary (Q)
      stats: {
        damage: C.PLAYER_BASE_DAMAGE,
        speed: C.PLAYER_SPEED,
        attackSpeed: 1.0,
        critChance: 0.05,
        echoDurationMult: 1.0
      },
      shadowStack: [],
      combo: 0,
      comboTimer: 0,
      maxCombo: 0,
      activeBuffs: []
    } as Player,
    enemies: [],
    echoes: [],
    projectiles: [],
    particles: [],
    items: [],
    damageNumbers: [],
    interactionItem: null,
    camera: { x: camX, y: camY, shake: 0 },
    score: 0,
    time: 0,
    timeScale: 1.0,
    hitStop: 0,
    isGameOver: false,
    isPaused: false,
    pendingLevelUp: false,
  };
};

export const useGameLoop = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onLevelUp: () => void
) => {
  const gameState = useRef<GameState>(createInitialState());
  const requestRef = useRef<number>(0);
  const inputRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  const [uiState, setUiState] = useState({
    hp: 100,
    maxHp: 100,
    xp: 0,
    maxXp: 100,
    level: 1,
    floor: 1,
    echoCount: 0,
    isGameOver: false,
    isPaused: false,
    activeAbility: AbilityType.SHADOW_CALL,
    activeAbilityCooldown: 0,
    secondaryAbility: null as AbilityType | null,
    secondaryAbilityCooldown: 0,
    combo: 0,
    activeBuffs: [] as {type: ItemType, timer: number}[],
    shadowStackCount: 0,
    interactionItem: null as Item | null,
    inventory: {} as {[key: string]: number},
    currentWeapon: WeaponType.BLOOD_BLADE
  });

  // --- Input ---
  useEffect(() => {
    const onKD = (e: KeyboardEvent) => {
        inputRef.current.add(e.code);
        // Toggle Pause
        if (e.code === 'Escape') {
            const state = gameState.current;
            if (!state.isGameOver && !state.pendingLevelUp) {
                state.isPaused = !state.isPaused;
                setUiState(prev => ({...prev, isPaused: state.isPaused}));
            }
        }
    };
    const onKU = (e: KeyboardEvent) => inputRef.current.delete(e.code);
    const onMM = (e: MouseEvent) => {
      if (canvasRef.current) {
        const r = canvasRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: (e.clientX - r.left) * (C.CANVAS_WIDTH / r.width),
            y: (e.clientY - r.top) * (C.CANVAS_HEIGHT / r.height)
        };
      }
    };
    const onMD = (e: MouseEvent) => inputRef.current.add(e.button === 0 ? 'MouseLeft' : 'MouseRight');
    const onMU = (e: MouseEvent) => inputRef.current.delete(e.button === 0 ? 'MouseLeft' : 'MouseRight');
    
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mousedown', onMD);
    window.addEventListener('mouseup', onMU);
    window.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mousedown', onMD);
      window.removeEventListener('mouseup', onMU);
    };
  }, []);

  // --- Update ---
  const update = useCallback(() => {
    const state = gameState.current;
    if (state.isPaused || state.isGameOver || state.pendingLevelUp) return;

    if (state.hitStop > 0) {
      state.hitStop--;
      updateCamera(state);
      return;
    }

    state.time++;
    const { player, dungeon } = state;
    const inputs = inputRef.current;

    // Room Logic
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;
    const px = Math.floor(pcx / C.TILE_SIZE);
    const py = Math.floor(pcy / C.TILE_SIZE);
    
    let currentRoom = dungeon.rooms.find(r => 
        px >= r.x && px < r.x + r.width && 
        py >= r.y && py < r.y + r.height
    );

    // Prevent sticking: only activate if player is FULLY not in door
    if (currentRoom && !currentRoom.isCleared && !currentRoom.isActive) {
        const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        let safeToClose = true;
        
        for (const door of currentRoom.doorTiles) {
            const doorRect = { x: door.x * C.TILE_SIZE, y: door.y * C.TILE_SIZE, width: C.TILE_SIZE, height: C.TILE_SIZE };
            if (rectIntersect(playerRect, doorRect)) {
                safeToClose = false;
                break;
            }
        }

        if (safeToClose) {
            activateRoom(state, currentRoom);
        }
    }
    
    if (currentRoom && currentRoom.isActive && !currentRoom.isCleared) {
        if (state.enemies.length === 0) {
            clearRoom(state, currentRoom);
        }
    }

    // Aim Logic
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const worldMx = mx - state.camera.x;
    const worldMy = my - state.camera.y;
    const pCenterX = player.x + player.width/2;
    const pCenterY = player.y + player.height/2;
    
    player.aimAngle = Math.atan2(worldMy - pCenterY, worldMx - pCenterX);
    
    // Only flip sprite if not in a fixed-animation state
    if (!player.isSlashDashing) {
        player.facingX = Math.abs(player.aimAngle) > Math.PI / 2 ? -1 : 1;
    }

    // Interaction / Swap Logic
    if (player.interactionCooldown > 0) player.interactionCooldown--;
    if (inputs.has('KeyE') && state.interactionItem && player.interactionCooldown <= 0) {
        if (state.interactionItem.itemType === ItemType.PORTAL) {
             nextFloor(state);
        }
        else if (state.interactionItem.itemType === ItemType.WEAPON_DROP) {
            // Swap Weapon
            const newWeapon = state.interactionItem.payload;
            const currentWeapon = player.currentWeapon;
            
            player.currentWeapon = newWeapon;
            // Reset secondary cooldown on swap
            player.secondaryAbilityCooldown = 0;

            state.interactionItem.payload = currentWeapon;
            
            spawnDamageNumber(state, player.x, player.y, 1, true, '#94a3b8'); 
            player.interactionCooldown = 30;
            state.interactionItem.y -= 5;
        }
    }

    // Ability Handling (Primary 'Q')
    if (player.abilityCooldown > 0) player.abilityCooldown--;
    if (inputs.has('KeyQ') && player.abilityCooldown <= 0) {
        handleAbility(state, 'PRIMARY');
    }

    // Ability Handling (Secondary 'R-Click')
    if (player.secondaryAbilityCooldown > 0) player.secondaryAbilityCooldown--;

    // Combo Decay
    if (player.combo > 0) {
        player.comboTimer--;
        if (player.comboTimer <= 0) {
            player.combo = 0;
        }
    }

    // Buff Handling
    player.activeBuffs = player.activeBuffs.filter(b => {
        b.timer--;
        return b.timer > 0;
    });

    // --- Special Action: Slash Dash State (Whirling Flurry / Samurai Slash) ---
    if (player.isSlashDashing) {
        player.slashDashTimer--;
        
        // Physics for Dash
        if (state.time % 3 === 0) {
            createParticles(state, player.x, player.y, 1, '#fbbf24');
        }

        // Deal damage to enemies intersected
        state.enemies.forEach(e => {
            if (e.hitFlashTimer <= 0 && rectIntersect(player, e)) {
                // Determine damage based on weapon/ability logic
                const weaponConfig = C.WEAPONS[player.currentWeapon];
                // Use secondary config damage
                const dmgMult = weaponConfig.secondary?.damageMult || 1.0;
                
                const damage = player.stats.damage * dmgMult;
                dealDamage(state, e, damage, true); // Auto-crit
                createParticles(state, e.x, e.y, 5, '#ffffff');
                state.camera.shake = 5;
                state.hitStop = 2;
                // Knockback
                e.vx += player.vx * 0.5;
                e.vy += player.vy * 0.5;
                
                // Aggro Echoes
                state.echoes.forEach(echo => echo.targetId = e.id);
            }
        });

        resolveMapCollision(player, dungeon);

        if (player.slashDashTimer <= 0) {
            player.isSlashDashing = false;
            player.vx *= 0.1;
            player.vy *= 0.1;
        }

    } else if (!player.isDashing) {
      // Normal Movement
      let dx = 0;
      let dy = 0;
      if (inputs.has('KeyW')) dy -= 1;
      if (inputs.has('KeyS')) dy += 1;
      if (inputs.has('KeyA')) dx -= 1;
      if (inputs.has('KeyD')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len;
        dy /= len;
      }

      const speedBuff = player.activeBuffs.find(b => b.type === ItemType.BUFF_SPEED);
      const speedMult = speedBuff ? 1.5 : 1.0;
      const speed = player.stats.speed * speedMult;
      
      player.vx += dx * speed * 0.2;
      player.vy += dy * speed * 0.2;
      player.vx *= C.FRICTION;
      player.vy *= C.FRICTION;

      // Attack Controls
      // Ensure state remains true while cooldown is active for animation visibility
      if (player.attackCooldown > 0) {
        player.attackCooldown--;
        player.isAttacking = true;
      } else {
        player.isAttacking = false;
      }
      
      if (player.heavyAttackCooldown > 0) player.heavyAttackCooldown--;

      const isLight = inputs.has('MouseLeft');
      const isRightClick = inputs.has('MouseRight');

      // Right Click: Always Secondary Ability of current weapon
      if (isRightClick) {
          if (player.secondaryAbilityCooldown <= 0) {
              handleAbility(state, 'SECONDARY');
          }
      } else if (isLight && player.attackCooldown <= 0) {
          handleAttack(state, false);
      }

      // Dash
      if (player.dashCooldown > 0) player.dashCooldown--;
      if (inputs.has('ShiftLeft') && player.dashCooldown <= 0) {
          player.isDashing = true;
          player.dashCooldown = C.DASH_COOLDOWN;
          player.invulnTimer = 20;
          const dashSpeed = C.PLAYER_DASH_FORCE;
          
          if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
              const len = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
              player.vx = (player.vx / len) * dashSpeed;
              player.vy = (player.vy / len) * dashSpeed;
          } else {
              player.vx = Math.cos(player.aimAngle) * dashSpeed;
              player.vy = Math.sin(player.aimAngle) * dashSpeed;
          }
          createParticles(state, player.x, player.y, 8, '#ffffff');
      }

      resolveMapCollision(player, dungeon);

    } else {
        // Dash Physics
        player.vx *= 0.9;
        player.vy *= 0.9;
        resolveMapCollision(player, dungeon);

        if (Math.sqrt(player.vx*player.vx + player.vy*player.vy) < 4) {
            player.isDashing = false;
        }
    }
    
    if (player.x < 0) player.x = 0;
    if (player.y < 0) player.y = 0;
    
    if (player.invulnTimer > 0) player.invulnTimer--;
    if (player.hitFlashTimer > 0) player.hitFlashTimer--;

    updateCamera(state);
    updateProjectiles(state);
    updateEnemies(state, onLevelUp);
    updateEchoes(state);
    updateItems(state);
    updateParticles(state);
    updateDamageNumbers(state);

    if (player.hp <= 0) state.isGameOver = true;

    setUiState({
        hp: player.hp,
        maxHp: player.maxHp,
        xp: player.xp,
        maxXp: player.maxXp,
        level: player.level,
        floor: dungeon.floor,
        echoCount: state.echoes.length,
        isGameOver: state.isGameOver,
        isPaused: state.isPaused,
        activeAbility: player.activeAbility,
        activeAbilityCooldown: player.abilityCooldown,
        secondaryAbility: null, // UI handles this via weapon
        secondaryAbilityCooldown: player.secondaryAbilityCooldown,
        combo: player.combo,
        activeBuffs: player.activeBuffs.map(b => ({type: b.type, timer: b.timer})),
        shadowStackCount: player.shadowStack.length,
        interactionItem: state.interactionItem,
        inventory: player.inventory,
        currentWeapon: player.currentWeapon
    });

  }, [onLevelUp]);

  // --- Drawing System ---
  const drawCharacter = (
      ctx: CanvasRenderingContext2D, 
      entity: Entity & { 
        facingX?: number, 
        activeBuffs?: any[], 
        currentWeapon?: WeaponType, 
        isAttacking?: boolean, 
        enemyType?: EnemyType, 
        tier?: number, 
        scale?: number, 
        attackCooldown?: number, 
        maxAttackCooldown?: number,
        aimAngle?: number,
        isSlashDashing?: boolean
      }, 
      time: number, 
      isEcho: boolean = false
  ) => {
    // If Slash Dashing, draw ghost trails behind the character
    if (entity.type === EntityType.PLAYER && entity.isSlashDashing) {
         ctx.save();
         ctx.translate(entity.x + entity.width/2 - entity.vx * 2, entity.y + entity.height - entity.vy * 2);
         ctx.globalAlpha = 0.3;
         ctx.fillStyle = '#fbbf24';
         ctx.beginPath();
         ctx.arc(0, -10, 10, 0, Math.PI*2);
         ctx.fill();
         ctx.restore();
         
         ctx.save();
         ctx.translate(entity.x + entity.width/2 - entity.vx, entity.y + entity.height - entity.vy);
         ctx.globalAlpha = 0.5;
         ctx.fillStyle = '#fbbf24';
         ctx.beginPath();
         ctx.arc(0, -10, 10, 0, Math.PI*2);
         ctx.fill();
         ctx.restore();
    }

    const isMoving = Math.abs(entity.vx) > 0.5 || Math.abs(entity.vy) > 0.5;
    const facing = entity.facingX || 1;
    const bob = isMoving ? Math.sin(time * 0.5) * 2 : Math.sin(time * 0.1) * 1;
    
    ctx.save();
    
    // Position
    const cx = entity.x + entity.width/2;
    const cy = entity.y + entity.height;
    ctx.translate(cx, cy);
    
    // Scale
    if (entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.BOSS) {
        ctx.scale(2, 2);
    } else {
        ctx.scale(entity.scale || 1, entity.scale || 1);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI*2);
    ctx.fill();

    // Echo Transparency
    if (isEcho) {
        ctx.globalAlpha = 0.5;
        if (entity.tier === 3) ctx.globalAlpha = 0.5 + Math.sin(time * 0.2) * 0.2;
    }

    // --- LEGS ---
    ctx.fillStyle = '#0f172a';
    if (entity.type === EntityType.ENEMY) ctx.fillStyle = '#271a1a';

    const legOffset = isMoving ? Math.sin(time * 0.5) * 6 : 0;
    
    if (entity.enemyType !== EnemyType.MYSTIC) {
        ctx.beginPath();
        ctx.moveTo(-4, -8);
        ctx.lineTo(-6 + legOffset, 0);
        ctx.lineTo(-2 + legOffset, 0);
        ctx.lineTo(0, -8);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(4, -8);
        ctx.lineTo(6 - legOffset, 0);
        ctx.lineTo(2 - legOffset, 0);
        ctx.lineTo(0, -8);
        ctx.fill();
    } else {
        ctx.fillStyle = entity.color;
        ctx.beginPath();
        ctx.moveTo(-8, -10 + bob);
        ctx.lineTo(0, 5 + bob);
        ctx.lineTo(8, -10 + bob);
        ctx.fill();
    }

    // --- BODY ---
    ctx.translate(0, -12 + bob); 
    
    if ((entity as any).hitFlashTimer > 0) {
        ctx.fillStyle = '#ffffff';
    } else {
        ctx.fillStyle = entity.color;
    }

    if (entity.enemyType === EnemyType.STANDARD || entity.type === EntityType.ECHO && entity.tier === 1) {
        ctx.fillRect(-6, -10, 12, 14);
    } else if (entity.enemyType === EnemyType.ELITE || (entity.type === EntityType.ECHO && entity.tier === 2)) {
        ctx.fillRect(-10, -18, 20, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-8, -16, 16, 8); 
    } else if (entity.enemyType === EnemyType.MYSTIC || (entity.type === EntityType.ECHO && entity.tier === 3)) {
        ctx.beginPath();
        ctx.moveTo(-8, 0);
        ctx.lineTo(8, 0);
        ctx.lineTo(0, -20);
        ctx.fill();
    } else {
        ctx.fillRect(-6, -14, 12, 16);
        if (entity.type === EntityType.PLAYER) {
            ctx.fillStyle = '#334155';
            ctx.fillRect(-6, -2, 12, 2);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-2, -12, 4, 12);
        }
    }

    // --- HEAD ---
    ctx.translate(0, -14);
    const headColor = (entity as any).hitFlashTimer > 0 ? '#fff' : (entity.type === EntityType.PLAYER ? '#f1f5f9' : entity.color);
    ctx.fillStyle = headColor;

    if (entity.enemyType === EnemyType.ELITE) {
        ctx.fillRect(-7, -10, 14, 12);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-7, -8); ctx.lineTo(-12, -14); ctx.lineTo(-6, -10);
        ctx.moveTo(7, -8); ctx.lineTo(12, -14); ctx.lineTo(6, -10);
        ctx.fill();
    } else if (entity.enemyType === EnemyType.MYSTIC) {
        ctx.beginPath();
        ctx.arc(0, -5, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-2, -6, 1, 1);
        ctx.fillRect(2, -6, 1, 1);
    } else {
        ctx.beginPath();
        ctx.arc(0, -5, 5, 0, Math.PI*2);
        ctx.fill();
        if (entity.type === EntityType.PLAYER) {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(0, -5, 5.5, Math.PI, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- WEAPON ---
    if (entity.type === EntityType.PLAYER && !entity.isDead && !entity.isSlashDashing) {
        const weapon = C.WEAPONS[entity.currentWeapon || WeaponType.BLOOD_BLADE];
        const isAttacking = entity.isAttacking;
        
        ctx.save();
        ctx.translate(facing * 6, 4);
        
        // Base Aim Rotation
        let baseRot = entity.aimAngle !== undefined ? entity.aimAngle : 0;
        
        // Weapon Swing Calculation
        let swingOffset = 0;
        let progress = 0;
        
        if (isAttacking) {
             const maxCd = entity.maxAttackCooldown || weapon.cooldown;
             progress = 1 - ((entity.attackCooldown || 0) / maxCd);
             
             if (entity.currentWeapon !== WeaponType.SHADOW_BOW) {
                 const swingArc = weapon.arc || Math.PI;
                 const swingProgress = Math.sin((progress - 0.5) * Math.PI); 
                 swingOffset = swingProgress * (swingArc / 2);
             } else {
                 const recoil = Math.sin(progress * Math.PI) * 0.2;
                 swingOffset = -recoil;
             }
        } else {
             swingOffset = Math.sin(time * 0.1) * 0.1;
        }

        // SWOOSH EFFECT - SYNCED
        if (isAttacking && entity.currentWeapon !== WeaponType.SHADOW_BOW && progress > 0.1 && progress < 0.9) {
             ctx.save();
             // IMPORTANT: Use the exact same transform origin as the weapon to stay synced
             // The weapon translation is (facing * 6, 4). We are already there because we are inside the `save` block.
             ctx.rotate(baseRot); // Rotate to aim direction
             
             const range = (weapon.range || 50); // Exact match to weapon length
             const arcSize = weapon.arc || Math.PI;
             
             // Dynamic Alpha based on speed (center of swing is fastest)
             const intensity = Math.sin(progress * Math.PI);
             
             ctx.globalCompositeOperation = 'lighter'; // GLOW
             ctx.globalAlpha = intensity * 0.8;

             // Draw Trail
             ctx.beginPath();
             // Outer Arc matches tip
             ctx.arc(0, 0, range * 1.1, -arcSize/2, arcSize/2, false);
             // Inner Arc follows the blade edge
             ctx.arc(0, 0, range * 0.75, arcSize/2, -arcSize/2, true); 
             ctx.closePath();
             
             const gradient = ctx.createRadialGradient(0, 0, range * 0.6, 0, 0, range * 1.1);
             gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
             gradient.addColorStop(0.4, '#ffffff'); // Hot Core closer to inner edge
             gradient.addColorStop(0.6, weapon.color); // Weapon Color
             gradient.addColorStop(1, `rgba(255, 255, 255, 0)`); // Fade edge
             
             ctx.fillStyle = gradient;
             ctx.fill();
             
             // Draw a sharp "Core" line for definition
             ctx.beginPath();
             ctx.arc(0, 0, range * 0.9, -arcSize/2 * 0.9, arcSize/2 * 0.9, false);
             ctx.strokeStyle = 'rgba(255,255,255,0.6)';
             ctx.lineWidth = 1.5;
             ctx.stroke();

             ctx.restore();
        }

        // Apply Rotation for Weapon Sprite
        ctx.rotate(baseRot + swingOffset);

        if (Math.abs(baseRot) > Math.PI / 2) {
             ctx.scale(1, -1);
        }

        const weaponLen = (weapon.range || 50) - 5; 

        if (entity.currentWeapon === WeaponType.BLOOD_BLADE) {
            // Pixel Art Interpretation of the provided asset
            const s = 2.5; // Scale factor to match hitbox range (~60px)

            // Handle (Dark Brown)
            ctx.fillStyle = '#3f2e22'; 
            ctx.fillRect(-4 * s, -1 * s, 5 * s, 2 * s);
            
            // Pommel (Dark Grey)
            ctx.fillStyle = '#565963';
            ctx.fillRect(-5 * s, -1.5 * s, 2 * s, 3 * s);

            // Guard (Light Grey)
            ctx.fillStyle = '#8f939d';
            ctx.fillRect(1 * s, -4 * s, 2 * s, 8 * s);
            // Guard Shadow/Detail
            ctx.fillStyle = '#565963';
            ctx.fillRect(1.5 * s, -1 * s, 1 * s, 2 * s);

            // Blade (Light Silver)
            ctx.fillStyle = '#c7cfdd';
            ctx.fillRect(3 * s, -2 * s, 14 * s, 4 * s);
            
            // Blade Edges (Darker Grey for depth)
            ctx.fillStyle = '#8f939d';
            ctx.fillRect(3 * s, -2 * s, 14 * s, 1 * s); // Top edge
            ctx.fillRect(3 * s, 1 * s, 14 * s, 1 * s);  // Bottom edge
            
            // Central Ridge (Dark Line)
            ctx.fillStyle = '#565963';
            ctx.fillRect(3 * s, -0.5 * s, 13 * s, 1 * s);

            // Tip (Tapering)
            ctx.fillStyle = '#c7cfdd';
            ctx.beginPath();
            ctx.moveTo(17 * s, -2 * s);
            ctx.lineTo(20 * s, 0);
            ctx.lineTo(17 * s, 2 * s);
            ctx.fill();

        } else if (entity.currentWeapon === WeaponType.DUAL_FANGS) {
            const daggerLen = weaponLen * 0.7; // Daggers are shorter than range usually imply
            ctx.fillStyle = weapon.color;
            ctx.fillRect(0, -2, daggerLen, 4);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-2, 0, 4, 2);
        } else if (entity.currentWeapon === WeaponType.REAPER_AXE) {
            ctx.fillStyle = '#5c3a2e';
            ctx.fillRect(0, -2, weaponLen, 4); // Handle
            ctx.fillStyle = weapon.color;
            ctx.beginPath();
            // Axe Head at the end
            ctx.moveTo(weaponLen - 20, -4);
            ctx.lineTo(weaponLen + 5, -16);
            ctx.lineTo(weaponLen + 5, 16);
            ctx.lineTo(weaponLen - 20, 4);
            ctx.fill();
        } else if (entity.currentWeapon === WeaponType.SHADOW_BOW) {
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(6, 0, 16, -Math.PI/2, Math.PI/2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(6, -16); ctx.lineTo(6, 16);
            ctx.stroke();
        }
        
        ctx.restore();
    }

    ctx.restore(); 
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = gameState.current;

    ctx.fillStyle = C.COLORS.background;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);

    const startCol = Math.floor(-state.camera.x / C.TILE_SIZE);
    const endCol = startCol + (C.CANVAS_WIDTH / C.TILE_SIZE) + 1;
    const startRow = Math.floor(-state.camera.y / C.TILE_SIZE);
    const endRow = startRow + (C.CANVAS_HEIGHT / C.TILE_SIZE) + 1;

    for (let y = Math.max(0, startRow); y < Math.min(state.dungeon.height, endRow); y++) {
      for (let x = Math.max(0, startCol); x < Math.min(state.dungeon.width, endCol); x++) {
        const tile = state.dungeon.grid[y][x];
        const px = x * C.TILE_SIZE;
        const py = y * C.TILE_SIZE;

        if (tile === TileType.FLOOR) {
          ctx.fillStyle = (x + y) % 2 === 0 ? C.COLORS.floor : C.COLORS.floorAlt;
          ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
          if ((x*y)%7 === 0) {
              ctx.fillStyle = 'rgba(0,0,0,0.1)';
              ctx.fillRect(px + 10, py + 10, 5, 5);
          }
        } else if (tile === TileType.WALL) {
          ctx.fillStyle = C.COLORS.wall;
          ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
          ctx.fillStyle = '#334155';
          ctx.fillRect(px, py, C.TILE_SIZE, 4);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px + 8, py + 8, 4, 4);
          ctx.fillRect(px + 32, py + 32, 4, 4);
        } else if (tile === TileType.DOOR_CLOSED) {
          ctx.fillStyle = C.COLORS.doorClosed;
          ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
          ctx.fillStyle = '#000';
          ctx.fillRect(px + 10, py, 4, C.TILE_SIZE);
          ctx.fillRect(px + 30, py, 4, C.TILE_SIZE);
          ctx.fillRect(px + 50, py, 4, C.TILE_SIZE);
        } else if (tile === TileType.DOOR_OPEN) {
          ctx.fillStyle = C.COLORS.doorOpen;
          ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
        }
      }
    }

    state.items.forEach(item => {
      ctx.shadowBlur = 10;
      ctx.shadowColor = item.color;
      ctx.fillStyle = item.color;
      
      const bob = Math.sin(state.time * 0.1) * 3;
      const cy = item.y + item.height/2 + bob;
      const cx = item.x + item.width/2;
      
      // Draw Item Icons
      if (item.itemType === ItemType.PORTAL) {
          // Draw Portal
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(state.time * 0.05);
          
          // Outer swirl
          const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 25);
          gradient.addColorStop(0, '#ffffff');
          gradient.addColorStop(0.5, C.COLORS.portal);
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, 25 + Math.sin(state.time * 0.2) * 2, 0, Math.PI * 2);
          ctx.fill();

          // Inner Vortex
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for(let i=0; i<3; i++) {
              ctx.rotate(Math.PI * 2 / 3);
              ctx.moveTo(5, 0);
              ctx.quadraticCurveTo(15, 10, 20, 0);
          }
          ctx.stroke();

          ctx.restore();
          
          // Emit particles
          if (Math.random() > 0.8) {
              createParticles(state, cx, cy, 1, C.COLORS.portal);
          }

      } else if (item.itemType === ItemType.WEAPON_DROP) {
          ctx.fillStyle = '#000'; // shadow
          ctx.fillRect(cx - 8, cy - 2, 16, 4);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-Math.PI/4);
          ctx.fillStyle = item.color;
          ctx.fillRect(-10, -2, 20, 4); // Generic weapon shape
          ctx.restore();
      } else {
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
      }
      
      if (item.itemType !== ItemType.PORTAL) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.shadowBlur = 0;
          let label = '';
          if (item.itemType === ItemType.BUFF_DAMAGE) label = '⚔️';
          if (item.itemType === ItemType.BUFF_SPEED) label = '⚡';
          if (item.itemType === ItemType.BLOOD_VIAL) label = '❤️';
          if (item.itemType === ItemType.WEAPON_DROP) label = '';
          if (label) ctx.fillText(label, cx, cy + 4);
      }
    });

    const allEntities = [
        ...state.enemies.map(e => ({...e, renderType: 'enemy'})),
        ...state.echoes.map(e => ({...e, renderType: 'echo'})),
        {...state.player, renderType: 'player'}
    ].sort((a, b) => (a.y + a.height) - (b.y + b.height));

    allEntities.forEach(e => {
        if (e.renderType === 'player') {
             drawCharacter(ctx, e as any, state.time);
             state.player.activeBuffs.forEach((b, i) => {
                ctx.strokeStyle = b.type === ItemType.BUFF_DAMAGE ? C.COLORS.buffDamage : C.COLORS.buffSpeed;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(e.x + e.width/2, e.y + e.height, 20 + i * 4, 0, (Math.PI*2) * (b.timer / 600));
                ctx.stroke();
            });
        } else if (e.renderType === 'enemy') {
             drawCharacter(ctx, e as any, state.time);
             const hpPct = (e as Enemy).hp / (e as Enemy).maxHp;
             if (hpPct < 1) {
                ctx.fillStyle = '#450a0a';
                ctx.fillRect(e.x, e.y - 12, e.width, 4);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(e.x, e.y - 12, e.width * hpPct, 4);
             }
        } else if (e.renderType === 'echo') {
             drawCharacter(ctx, {...e, enemyType: (e as any).tier === 3 ? EnemyType.MYSTIC : EnemyType.STANDARD} as any, state.time, true);
        }
    });

    state.projectiles.forEach(proj => {
        ctx.save();
        
        if (proj.renderStyle === 'WAVE') {
             // BLOOD WAVE RENDER
             ctx.translate(proj.x, proj.y);
             const angle = Math.atan2(proj.vy, proj.vx);
             ctx.rotate(angle);
             
             // Trail
             ctx.globalCompositeOperation = 'lighter';
             ctx.fillStyle = `rgba(239, 68, 68, 0.4)`;
             ctx.beginPath();
             ctx.arc(-10, 0, 20, -Math.PI/2, Math.PI/2);
             ctx.fill();

             // Core Crescent
             const gradient = ctx.createLinearGradient(0, -15, 0, 15);
             gradient.addColorStop(0, '#7f1d1d');
             gradient.addColorStop(0.5, '#ef4444');
             gradient.addColorStop(1, '#7f1d1d');
             
             ctx.fillStyle = gradient;
             ctx.beginPath();
             ctx.arc(0, 0, 15, -Math.PI/2, Math.PI/2, false);
             ctx.quadraticCurveTo(-5, 0, 0, 15);
             ctx.fill();
             
             // Highlight
             ctx.fillStyle = '#fff';
             ctx.globalAlpha = 0.8;
             ctx.beginPath();
             ctx.arc(2, 0, 12, -Math.PI/2.5, Math.PI/2.5, false);
             ctx.quadraticCurveTo(0, 0, 2, 12);
             ctx.fill();
             
             // Dripping Particles
             if (Math.random() > 0.5) {
                 createParticles(state, proj.x, proj.y, 1, '#7f1d1d');
             }

        } else {
            // Default Projectile
            ctx.fillStyle = proj.color;
            ctx.beginPath();
            ctx.globalAlpha = 0.3;
            ctx.arc(proj.x - proj.vx, proj.y - proj.vy, proj.width/2, 0, Math.PI*2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
            
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.width/2, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    });

    state.particles.forEach(part => {
        ctx.fillStyle = part.color;
        ctx.globalAlpha = part.lifeTime / part.maxLifeTime;
        ctx.fillRect(part.x, part.y, part.width, part.height);
        ctx.globalAlpha = 1.0;
    });

    ctx.restore(); 
    state.damageNumbers.forEach(dn => {
        const screenX = dn.x + state.camera.x;
        const screenY = dn.y + state.camera.y;
        
        const alpha = Math.min(1, dn.lifeTime / 20);
        ctx.globalAlpha = alpha;

        ctx.font = dn.isCrit ? '900 24px "Segoe UI", Arial' : 'bold 16px "Segoe UI", Arial';
        ctx.fillStyle = dn.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(Math.floor(dn.value).toString(), screenX, screenY);
        ctx.fillText(Math.floor(dn.value).toString(), screenX, screenY);
        
        ctx.globalAlpha = 1.0;
    });

  }, []);

  // --- Loop ---
  const tick = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [tick]);

  const applyUpgrade = (itemName: string) => {
      const { player } = gameState.current;
      if (!player.inventory[itemName]) player.inventory[itemName] = 0;
      player.inventory[itemName]++;
      recalculateStats(player);
      gameState.current.pendingLevelUp = false;
  };

  const restartGame = () => {
      gameState.current = createInitialState();
      setUiState(prev => ({...prev, isGameOver: false, isPaused: false}));
  };

  const togglePause = () => {
      gameState.current.isPaused = !gameState.current.isPaused;
      setUiState(prev => ({...prev, isPaused: gameState.current.isPaused}));
  };

  return { uiState, applyUpgrade, restartGame, togglePause };
};


// --- Systems Implementation ---

function resolveMapCollision(entity: Entity, dungeon: Dungeon) {
    const nextX = entity.x + entity.vx;
    if (!checkWall(nextX, entity.y, entity.width, entity.height, dungeon)) {
        entity.x = nextX;
    } else {
        entity.vx = 0;
    }

    const nextY = entity.y + entity.vy;
    if (!checkWall(entity.x, nextY, entity.width, entity.height, dungeon)) {
        entity.y = nextY;
    } else {
        entity.vy = 0;
    }
}

function checkWall(x: number, y: number, w: number, h: number, dungeon: Dungeon): boolean {
    const tilesToCheck = [
        { tx: Math.floor(x / C.TILE_SIZE), ty: Math.floor(y / C.TILE_SIZE) },
        { tx: Math.floor((x + w) / C.TILE_SIZE), ty: Math.floor(y / C.TILE_SIZE) },
        { tx: Math.floor(x / C.TILE_SIZE), ty: Math.floor((y + h) / C.TILE_SIZE) },
        { tx: Math.floor((x + w) / C.TILE_SIZE), ty: Math.floor((y + h) / C.TILE_SIZE) },
    ];

    for (const t of tilesToCheck) {
        if (t.ty < 0 || t.ty >= dungeon.height || t.tx < 0 || t.tx >= dungeon.width) return true;
        const tile = dungeon.grid[t.ty][t.tx];
        if (tile === TileType.WALL || tile === TileType.VOID || tile === TileType.DOOR_CLOSED) return true;
    }
    return false;
}

function updateCamera(state: GameState) {
    const targetX = -state.player.x + C.CANVAS_WIDTH / 2 - state.player.width / 2;
    const targetY = -state.player.y + C.CANVAS_HEIGHT / 2 - state.player.height / 2;
    
    state.camera.x += (targetX - state.camera.x) * 0.1;
    state.camera.y += (targetY - state.camera.y) * 0.1;

    if (state.camera.shake > 0) {
        state.camera.x += (Math.random() - 0.5) * state.camera.shake;
        state.camera.y += (Math.random() - 0.5) * state.camera.shake;
        state.camera.shake *= 0.9;
        if (state.camera.shake < 0.5) state.camera.shake = 0;
    }
}

function activateRoom(state: GameState, room: Room) {
    room.isActive = true;
    for(const t of room.doorTiles) {
        state.dungeon.grid[t.y][t.x] = TileType.DOOR_CLOSED;
    }

    const count = 2 + Math.floor(state.dungeon.floor) + Math.floor(Math.random() * 3);
    const cx = (room.x + room.width/2) * C.TILE_SIZE;
    const cy = (room.y + room.height/2) * C.TILE_SIZE;

    for(let j=0; j<count; j++) {
        const ex = cx + (Math.random() - 0.5) * (room.width * C.TILE_SIZE * 0.6);
        const ey = cy + (Math.random() - 0.5) * (room.height * C.TILE_SIZE * 0.6);
        
        const roll = Math.random();
        let type = EnemyType.STANDARD;
        let scale = 1;
        let hp = 30 + (state.dungeon.floor * 5);
        let color = C.COLORS.enemyStandard;
        let size = 18; // Base visual size approximation

        if (state.dungeon.floor > 2 && roll > 0.8) {
            type = EnemyType.ELITE;
            scale = 1.5;
            hp *= 2;
            color = C.COLORS.enemyElite;
        }

        // Adjust size based on scale
        const w = size * scale;
        const h = size * scale;

        state.enemies.push({
            id: Math.random().toString(),
            type: EntityType.ENEMY,
            enemyType: type,
            x: ex, y: ey,
            width: w, height: h,
            vx: 0, vy: 0,
            facingX: 1, facingY: 0,
            color: color,
            isDead: false,
            hp, maxHp: hp,
            damage: 5 + state.dungeon.floor,
            attackCooldown: 0,
            maxAttackCooldown: 0,
            targetId: null,
            xpValue: 10 * (type === EnemyType.ELITE ? 3 : 1),
            agroRange: 1000, 
            hitFlashTimer: 0,
            scale,
            bleedStack: 0,
            bleedTimer: 0
        });
        createParticles(state, ex, ey, 5, color);
    }
}

function clearRoom(state: GameState, room: Room) {
    room.isCleared = true;
    room.isActive = false;
    for(const t of room.doorTiles) {
        state.dungeon.grid[t.y][t.x] = TileType.DOOR_OPEN;
    }

    const cx = (room.x + room.width/2) * C.TILE_SIZE;
    const cy = (room.y + room.height/2) * C.TILE_SIZE;

    // --- PORTAL SPAWN CHECK ---
    if (room.id === state.dungeon.portalRoomId) {
        state.items.push({
            id: 'portal',
            type: EntityType.ITEM,
            itemType: ItemType.PORTAL,
            x: cx - 20, y: cy - 20,
            width: 40, height: 40,
            vx: 0, vy: 0,
            color: C.COLORS.portal,
            isDead: false,
            value: 0,
            floatOffset: 0,
            payload: null
        });
        createParticles(state, cx, cy, 20, C.COLORS.portal);
        spawnDamageNumber(state, cx, cy, 0, true, C.COLORS.portal); // Visual pop
        return; 
    }

    const roll = Math.random();
    let itemType = ItemType.BLOOD_VIAL;
    let color = C.COLORS.heal;
    let payload = null;
    
    // Loot Table (Removed random Ability Scrolls since secondary is now weapon-bound)
    if (roll > 0.9) {
        itemType = ItemType.WEAPON_DROP;
        color = C.COLORS.weaponDrop;
        const weapons = [WeaponType.DUAL_FANGS, WeaponType.REAPER_AXE, WeaponType.SHADOW_BOW, WeaponType.BLOOD_BLADE];
        payload = weapons[Math.floor(Math.random() * weapons.length)];
    } else if (roll > 0.6) {
        itemType = ItemType.BUFF_DAMAGE;
        color = C.COLORS.buffDamage;
    } else if (roll > 0.4) {
        itemType = ItemType.BUFF_SPEED;
        color = C.COLORS.buffSpeed;
    }

    state.items.push({
        id: Math.random().toString(),
        type: EntityType.ITEM,
        itemType: itemType,
        x: cx, y: cy,
        width: 24, height: 24,
        vx: 0, vy: 0,
        color: color,
        isDead: false,
        value: 20, 
        floatOffset: Math.random(),
        payload
    });
}

function handleAttack(state: GameState, isHeavy: boolean) {
    const { player } = state;
    const weapon = C.WEAPONS[player.currentWeapon];
    
    // Scale cooldown by attack speed
    const baseCooldown = isHeavy ? C.HEAVY_ATTACK_COOLDOWN : weapon.cooldown;
    const speedMod = player.stats.attackSpeed;
    player.attackCooldown = Math.max(2, baseCooldown / speedMod);
    player.maxAttackCooldown = player.attackCooldown; // Capture exact duration for animation normalization
    player.isAttacking = true;

    if (isHeavy) player.heavyAttackCooldown = Math.max(10, C.HEAVY_ATTACK_COOLDOWN / speedMod);

    const dmgBuff = player.activeBuffs.find(b => b.type === ItemType.BUFF_DAMAGE);
    const dmgMult = dmgBuff ? 1.5 : 1.0;

    const comboMult = 1 + (player.combo * C.COMBO_DAMAGE_MULT_PER_STACK);

    if (player.currentWeapon === WeaponType.SHADOW_BOW) {
        const angle = player.aimAngle;
        state.projectiles.push({
            id: Math.random().toString(),
            type: EntityType.PROJECTILE,
            ownerId: player.id,
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            width: 10, height: 10,
            vx: Math.cos(angle) * 15,
            vy: Math.sin(angle) * 15,
            damage: player.stats.damage * (isHeavy ? 1.5 : 1) * dmgMult * comboMult,
            color: weapon.color,
            lifeTime: 60,
            isDead: false,
            piercing: isHeavy
        });
        return;
    }

    const cx = player.x + player.width/2;
    const cy = player.y + player.height/2;
    const angle = player.aimAngle; 
    
    let hitCount = 0;

    state.enemies.forEach(e => {
        const ex = e.x + e.width/2;
        const ey = e.y + e.height/2;
        const dist = Math.sqrt((ex-cx)**2 + (ey-cy)**2);
        
        if (dist < weapon.range + e.width/2) {
            const angleToEnemy = Math.atan2(ey - cy, ex - cx);
            let angleDiff = angleToEnemy - angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI*2;
            
            if (Math.abs(angleDiff) < weapon.arc / 2) {
                const baseDmg = player.stats.damage * weapon.damageMult * (isHeavy ? weapon.heavyMult : 1);
                const finalDmg = baseDmg * dmgMult * comboMult;
                
                const isCrit = Math.random() < player.stats.critChance;
                dealDamage(state, e, isCrit ? finalDmg * 2 : finalDmg, isCrit);
                
                e.vx += Math.cos(angleToEnemy) * (isHeavy ? 15 : 5);
                e.vy += Math.sin(angleToEnemy) * (isHeavy ? 15 : 5);

                hitCount++;
                state.camera.shake = isHeavy ? 10 : 3;
                state.hitStop = isHeavy ? C.HIT_STOP_HEAVY : C.HIT_STOP_LIGHT;
            }
        }
    });

    if (hitCount > 0) {
        player.combo++;
        player.comboTimer = C.COMBO_DECAY;
        if (player.combo > player.maxCombo) player.maxCombo = player.combo;
    }
}

function handleAbility(state: GameState, slot: 'PRIMARY' | 'SECONDARY') {
    const { player } = state;
    
    let abilityType: AbilityType | undefined;
    
    if (slot === 'PRIMARY') {
        abilityType = player.activeAbility;
    } else {
        // Look up secondary ability from weapon
        const weaponConfig = C.WEAPONS[player.currentWeapon];
        abilityType = weaponConfig.secondary?.type;
    }
    
    if (!abilityType) return;
    
    const config = slot === 'PRIMARY' ? (C.ABILITIES as any)[abilityType] : C.WEAPONS[player.currentWeapon].secondary;
    if (!config) return;

    // Set Cooldown
    if (slot === 'PRIMARY') player.abilityCooldown = config.cooldown;
    else player.secondaryAbilityCooldown = config.cooldown;

    // --- Ability Specific Logic ---
    
    if (abilityType === AbilityType.SHADOW_CALL) {
        if (player.shadowStack.length === 0) return; // Nothing to summon

        // Summon all stacked echoes
        player.shadowStack.forEach((enemyType, i) => {
            let tier = 1;
            if (enemyType === EnemyType.ELITE) tier = 2;
            if (enemyType === EnemyType.MYSTIC) tier = 3;

            const angle = (Math.PI * 2 / player.shadowStack.length) * i;
            const dist = 40 + Math.random() * 20;
            const ex = player.x + player.width/2 + Math.cos(angle) * dist;
            const ey = player.y + player.height/2 + Math.sin(angle) * dist;
            
            spawnEcho(state, ex, ey, tier);
        });

        createParticles(state, player.x, player.y, 20, config.color);
        state.camera.shake = 8;
        player.shadowStack = [];
    }
    
    else if (abilityType === AbilityType.BLOOD_WAVE) {
        // Blood Blade: Crimson Wave
        const speed = 12;
        const dmg = player.stats.damage * (config.damageMult || 2.0);
        
        state.projectiles.push({
            id: Math.random().toString(),
            type: EntityType.PROJECTILE,
            ownerId: player.id,
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            width: 30, height: 30, // Visual size
            vx: Math.cos(player.aimAngle) * speed,
            vy: Math.sin(player.aimAngle) * speed,
            damage: dmg,
            color: config.color,
            lifeTime: 30, // Short range
            isDead: false,
            piercing: true,
            renderStyle: 'WAVE'
        });

        createParticles(state, player.x, player.y, 10, '#ef4444');
        state.camera.shake = 10;
        // Blood drippings are handled in rendering/update
    }

    // Weapon Specific Secondaries
    else if (abilityType === AbilityType.WHIRLING_FLURRY) {
        // Dual Fangs: Dash + Spin
        const speed = 25;
        player.isSlashDashing = true;
        player.slashDashTimer = 20; // duration
        player.invulnTimer = 20;
        player.vx = Math.cos(player.aimAngle) * speed;
        player.vy = Math.sin(player.aimAngle) * speed;
        state.camera.shake = 5;
    }

    else if (abilityType === AbilityType.HEAVY_SWING) {
        // Fallback or deprecated
        createParticles(state, player.x, player.y, 15, config.color);
        state.camera.shake = 15;
    }

    else if (abilityType === AbilityType.GROUND_CLEAVE) {
        // Reaper Axe: AoE Slam
        const radius = config.radius || 120;
        const damage = player.stats.damage * (config.damageMult || 4.0);
        createParticles(state, player.x, player.y, 30, config.color);
        state.camera.shake = 20;
        
        state.enemies.forEach(e => {
            const dist = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
            if (dist < radius) {
                dealDamage(state, e, damage, true);
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                e.vx += Math.cos(angle) * 15;
                e.vy += Math.sin(angle) * 15;
            }
        });
    }

    else if (abilityType === AbilityType.PIERCING_VOLLEY) {
        // Shadow Bow: 5 Arrows
        const count = 5;
        const spread = Math.PI / 6; 
        const startAngle = player.aimAngle - spread / 2;
        
        for(let i=0; i<count; i++) {
            const angle = startAngle + (spread / (count-1)) * i;
            state.projectiles.push({
                id: Math.random().toString(),
                type: EntityType.PROJECTILE,
                ownerId: player.id,
                x: player.x + player.width/2,
                y: player.y + player.height/2,
                width: 8, height: 8,
                vx: Math.cos(angle) * 18,
                vy: Math.sin(angle) * 18,
                damage: player.stats.damage * (config.damageMult || 1.5),
                color: config.color,
                lifeTime: 40,
                isDead: false,
                piercing: true
            });
        }
    }
}

function updateEnemies(state: GameState, onLevelUp: () => void) {
    const pcx = state.player.x + state.player.width / 2;
    const pcy = state.player.y + state.player.height / 2;

    state.enemies.forEach(e => {
        e.vx *= 0.9;
        e.vy *= 0.9;
        
        const ecx = e.x + e.width / 2;
        const ecy = e.y + e.height / 2;

        const dist = Math.sqrt((pcx - ecx)**2 + (pcy - ecy)**2);
        
        if (dist < e.agroRange) {
            const angle = Math.atan2(pcy - ecy, pcx - ecx);
            const speed = e.enemyType === EnemyType.ELITE ? 1.2 : 2.0;
            e.vx += Math.cos(angle) * speed * 0.1;
            e.vy += Math.sin(angle) * speed * 0.1;
            e.facingX = Math.sign(Math.cos(angle));

            // Damage player if not invulnerable
            // Use tighter center-to-center check. 
            // Overlap = radii sum. Reduce by factor to require 'deep' hit or touch.
            const overlapThreshold = (state.player.width/2 + e.width/2) * 0.9;

            if (dist < overlapThreshold && e.attackCooldown <= 0 && state.player.invulnTimer <= 0) {
                state.player.hp -= e.damage;
                state.player.hitFlashTimer = 10;
                e.attackCooldown = 60;
                e.maxAttackCooldown = 60;
                spawnDamageNumber(state, state.player.x, state.player.y, e.damage, false, '#ff0000');
                state.camera.shake = 5;
                state.player.combo = 0; 
            }
        }
        
        if (e.attackCooldown > 0) e.attackCooldown--;
        if (e.hitFlashTimer > 0) e.hitFlashTimer--;

        // Status Effects
        if (e.bleedStack && e.bleedTimer) {
             if (state.time % 30 === 0) {
                 const bleedDmg = e.bleedStack * (state.player.stats.damage * 0.2); // 20% base dmg per stack tick
                 dealDamage(state, e, bleedDmg, false, true); // True to not re-proc on-hits
             }
             e.bleedTimer--;
             if (e.bleedTimer <= 0) e.bleedStack = 0;
        }

        resolveMapCollision(e, state.dungeon);
    });

    state.enemies = state.enemies.filter(e => {
        if (e.hp <= 0) {
            // Check ON-KILL effects
            const daggerStack = state.player.inventory['ceremonial_dagger'];
            if (daggerStack) {
                for(let i=0; i<3; i++) {
                     state.projectiles.push({
                        id: Math.random().toString(),
                        type: EntityType.PROJECTILE,
                        ownerId: state.player.id,
                        x: e.x, y: e.y,
                        width: 6, height: 6,
                        vx: (Math.random()-0.5) * 10,
                        vy: (Math.random()-0.5) * 10,
                        damage: state.player.stats.damage * 1.5,
                        color: '#a855f7',
                        lifeTime: 100,
                        isDead: false,
                        piercing: false
                     });
                }
            }

            state.player.shadowStack.push(e.enemyType);
            state.player.xp += e.xpValue;
            if (state.player.xp >= state.player.maxXp) {
                state.player.level++;
                state.player.xp = 0;
                state.player.maxXp *= 1.2;
                state.pendingLevelUp = true;
                onLevelUp();
            }
            createParticles(state, e.x, e.y, 10, C.COLORS.echo); 
            return false;
        }
        return true;
    });
}

function spawnEcho(state: GameState, x: number, y: number, tier: number) {
    state.echoes.push({
        id: Math.random().toString(),
        type: EntityType.ECHO,
        x, y,
        width: 24, height: 24,
        vx: 0, vy: 0,
        facingX: 1, facingY: 0,
        color: C.COLORS.echo,
        isDead: false,
        tier,
        lifeTime: 600 * state.player.stats.echoDurationMult,
        maxLifeTime: 600,
        targetId: null,
        damage: 5 * tier * state.player.level,
        scale: 1 + (tier - 1) * 0.5
    });
}

function updateEchoes(state: GameState) {
    state.echoes.forEach(echo => {
        echo.lifeTime--;
        if (echo.lifeTime <= 0) echo.isDead = true;

        let nearest: Enemy | null = null;
        let minD = 500;
        
        state.enemies.forEach(e => {
            const d = Math.sqrt((e.x - echo.x)**2 + (e.y - echo.y)**2);
            if (d < minD) {
                minD = d;
                nearest = e;
            }
        });

        if (nearest) {
            // Explicit type check for nearest to ensure TS knows it's an Enemy
            const target: Enemy = nearest;
            const angle = Math.atan2(target.y - echo.y, target.x - echo.x);
            echo.vx += Math.cos(angle) * 0.3;
            echo.vy += Math.sin(angle) * 0.3;
            echo.facingX = Math.sign(Math.cos(angle));
            
            if (minD < 30) {
                dealDamage(state, target, echo.damage, false);
                echo.lifeTime -= 30;
                echo.vx = -Math.cos(angle) * 5;
                echo.vy = -Math.sin(angle) * 5;
            }
        } else {
            const d = Math.sqrt((state.player.x - echo.x)**2 + (state.player.y - echo.y)**2);
            if (d > 100) {
                const angle = Math.atan2(state.player.y - echo.y, state.player.x - echo.x);
                echo.vx += Math.cos(angle) * 0.2;
                echo.vy += Math.sin(angle) * 0.2;
                echo.facingX = Math.sign(Math.cos(angle));
            }
        }

        echo.vx *= 0.9;
        echo.vy *= 0.9;
        
        resolveMapCollision(echo, state.dungeon);
    });

    state.echoes = state.echoes.filter(e => !e.isDead);
}

function rectIntersect(r1: Rect, r2: Rect): boolean {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

function createParticles(state: GameState, x: number, y: number, count: number, color: string) {
    for(let i=0; i<count; i++) {
        state.particles.push({
            id: Math.random().toString(),
            type: EntityType.PARTICLE,
            x, y,
            width: 4, height: 4,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            color: color,
            isDead: false,
            lifeTime: 20 + Math.random() * 10,
            maxLifeTime: 30,
            startColor: color,
            endColor: color
        });
    }
}

function spawnDamageNumber(state: GameState, x: number, y: number, value: number, isCrit: boolean, color: string) {
    state.damageNumbers.push({
        id: Math.random().toString(),
        x: x + (Math.random() - 0.5) * 20, 
        y: y - 20,
        value,
        isCrit,
        lifeTime: C.DAMAGE_TEXT_LIFETIME,
        maxLifeTime: C.DAMAGE_TEXT_LIFETIME,
        vx: (Math.random() - 0.5) * 2,
        vy: -3,
        color
    });
}

function dealDamage(state: GameState, enemy: Enemy, amount: number, isCrit: boolean, skipOnHit: boolean = false) {
    enemy.hp -= amount;
    enemy.hitFlashTimer = 5;
    spawnDamageNumber(state, enemy.x, enemy.y, amount, isCrit, isCrit ? '#fbbf24' : '#ffffff');
    
    // Simple proc logic for now
    if (!skipOnHit && state.player.inventory['ukulele'] && Math.random() < 0.25) {
         // Chain lightning
         const range = 150;
         const target = state.enemies.find(e => e.id !== enemy.id && Math.sqrt((e.x-enemy.x)**2 + (e.y-enemy.y)**2) < range);
         if (target) {
             // Visual for chain lightning?
             createParticles(state, enemy.x, enemy.y, 5, '#facc15'); 
             dealDamage(state, target, amount * 0.5, false, true);
         }
    }
}

function nextFloor(state: GameState) {
    state.dungeon.floor++;
    const newDungeon = createDungeon(state.dungeon.floor);
    state.dungeon = newDungeon;
    const startRoom = newDungeon.rooms[0];
    state.player.x = (startRoom.x + startRoom.width/2) * C.TILE_SIZE;
    state.player.y = (startRoom.y + startRoom.height/2) * C.TILE_SIZE;
    state.enemies = [];
    state.items = [];
    state.projectiles = [];
    state.echoes = [];
    state.particles = [];
    state.damageNumbers = [];
    state.interactionItem = null;
    
    // Heal a bit
    state.player.hp = Math.min(state.player.hp + state.player.maxHp * 0.2, state.player.maxHp);
}

function updateProjectiles(state: GameState) {
    state.projectiles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifeTime--;
        
        // Wall Collision
        if (checkWall(p.x, p.y, p.width, p.height, state.dungeon)) {
            p.lifeTime = 0;
            createParticles(state, p.x, p.y, 3, p.color);
        }
        
        // Enemy Collision
        if (p.ownerId === state.player.id) {
            for (const e of state.enemies) {
                if (rectIntersect(p, e)) {
                    dealDamage(state, e, p.damage, false);
                    createParticles(state, p.x, p.y, 3, p.color);
                    
                    if (!p.piercing) {
                        p.lifeTime = 0;
                        break;
                    }
                }
            }
        }
    });
    state.projectiles = state.projectiles.filter(p => p.lifeTime > 0);
}

function updateItems(state: GameState) {
    let hovering: Item | null = null;
    state.items.forEach(item => {
        if (rectIntersect(state.player, item)) {
             if (item.itemType === ItemType.WEAPON_DROP || item.itemType === ItemType.PORTAL) {
                 hovering = item;
             } else {
                 // Auto Pickup
                 if (item.itemType === ItemType.BLOOD_VIAL) {
                     state.player.hp = Math.min(state.player.hp + 25, state.player.maxHp); // Fixed 25 or based on item? using 25 for now
                     spawnDamageNumber(state, state.player.x, state.player.y, 25, false, C.COLORS.heal);
                 } else if (item.itemType === ItemType.BUFF_DAMAGE) {
                     state.player.activeBuffs.push({type: ItemType.BUFF_DAMAGE, timer: 600, value: 1.5});
                 } else if (item.itemType === ItemType.BUFF_SPEED) {
                     state.player.activeBuffs.push({type: ItemType.BUFF_SPEED, timer: 600, value: 1.5});
                 }
                 item.isDead = true;
             }
        }
    });
    state.interactionItem = hovering;
    state.items = state.items.filter(i => !i.isDead);
}

function updateParticles(state: GameState) {
    state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifeTime--;
        p.vx *= 0.9;
        p.vy *= 0.9;
    });
    state.particles = state.particles.filter(p => p.lifeTime > 0);
}

function updateDamageNumbers(state: GameState) {
    state.damageNumbers.forEach(dn => {
        dn.x += dn.vx;
        dn.y += dn.vy;
        dn.lifeTime--;
    });
    state.damageNumbers = state.damageNumbers.filter(dn => dn.lifeTime > 0);
}

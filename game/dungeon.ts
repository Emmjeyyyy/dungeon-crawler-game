
import { Dungeon, GameState, ItemType, Room, TileType, WeaponType, EntityType, EnemyType, GameMode } from '../types';
import * as C from '../constants';
import { rectIntersect } from './physics';
import { createParticles } from './spawners';
import { spawnDamageNumber } from './spawners';

export const createTestDungeon = (): Dungeon => {
    const width = 40;
    const height = 30;
    const grid: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.VOID));
    
    // Create one massive room
    for(let y = 0; y < height; y++) {
        for(let x = 0; x < width; x++) {
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                grid[y][x] = TileType.WALL;
            } else {
                grid[y][x] = TileType.FLOOR;
            }
        }
    }

    // A single logical room encompassing the whole area
    const rooms: Room[] = [{
        id: 'test-chamber',
        x: 1, y: 1, width: width - 2, height: height - 2,
        isCleared: true, // Prevent spawning / door closing logic
        isActive: true,
        doorTiles: []
    }];

    return { width, height, tileSize: C.TILE_SIZE, grid, rooms, floor: 0, floorName: 'Developer Test Chamber', portalRoomId: '', weaponRoomId: '' };
};

export const createDungeon = (floor: number, gameMode: GameMode): Dungeon => {
  const width = 64; // Slightly larger map
  const height = 64;
  const grid: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.VOID));
  const rooms: Room[] = [];

  const targetRoomCount = 8 + Math.floor(floor * 0.5);
  const minRooms = 5;
  let attempts = 0;
  const maxAttempts = 500;
  
  while ((rooms.length < targetRoomCount || rooms.length < minRooms) && attempts < maxAttempts) {
    attempts++;
    const roll = Math.random();
    let w, h;

    // 1. Varied Room Sizes
    if (roll < 0.2) { // Treasure / Small Room
        w = Math.floor(Math.random() * 4) + 6;
        h = Math.floor(Math.random() * 4) + 6;
    } else if (roll < 0.7) { // Standard Room
        w = Math.floor(Math.random() * 6) + 10;
        h = Math.floor(Math.random() * 6) + 10;
    } else { // Large Hall / Arena
        w = Math.floor(Math.random() * 8) + 16;
        h = Math.floor(Math.random() * 8) + 16;
    }

    const x = Math.floor(Math.random() * (width - w - 4)) + 2;
    const y = Math.floor(Math.random() * (height - h - 4)) + 2;

    const newRoom: Room = { 
        id: `room-${rooms.length}`,
        x, y, width: w, height: h,
        isCleared: rooms.length === 0,
        isActive: rooms.length === 0,
        doorTiles: []
    };
    
    // 2. Padding to prevent awkward merges
    let overlap = false;
    const padding = 4;
    for (const r of rooms) {
      if (x < r.x + r.width + padding && x + w + padding > r.x && 
          y < r.y + r.height + padding && y + h + padding > r.y) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      for(let ry = y; ry < y + h; ry++) {
        for(let rx = x; rx < x + w; rx++) {
          grid[ry][rx] = TileType.FLOOR;
        }
      }
      rooms.push(newRoom);

      if (rooms.length > 1) {
        const prev = rooms[rooms.length - 2];
        const cx1 = Math.floor(prev.x + prev.width/2);
        const cy1 = Math.floor(prev.y + prev.height/2);
        const cx2 = Math.floor(newRoom.x + newRoom.width/2);
        const cy2 = Math.floor(newRoom.y + newRoom.height/2);

        // 3. Wider Corridors (2 tiles wide)
        const carve = (tx: number, ty: number) => {
            for(let oy=0; oy<2; oy++) {
                for(let ox=0; ox<2; ox++) {
                    const gx = tx+ox;
                    const gy = ty+oy;
                    if (gx >= 0 && gx < width && gy >= 0 && gy < height) {
                        if (grid[gy][gx] === TileType.VOID || grid[gy][gx] === TileType.WALL) {
                            grid[gy][gx] = TileType.FLOOR;
                        }
                    }
                }
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

  // Door Generation
  for(const room of rooms) {
      for(let x = room.x - 1; x <= room.x + room.width; x++) {
          for(let y = room.y - 1; y <= room.y + room.height; y++) {
              if (x >= 0 && x < width && y >= 0 && y < height) {
                  const isPerimeter = x === room.x - 1 || x === room.x + room.width || y === room.y - 1 || y === room.y + room.height;
                  // Only place doors if it connects to a corridor floor
                  if (grid[y][x] === TileType.FLOOR && isPerimeter) {
                      grid[y][x] = TileType.DOOR_OPEN;
                      room.doorTiles.push({x, y});
                  } else if (grid[y][x] === TileType.VOID) {
                      // Initial wall pass
                      grid[y][x] = TileType.WALL;
                  }
              }
          }
      }
  }

  // Global Wall Pass - Fill gaps around all floor tiles
  for(let y=0; y<height; y++) {
    for(let x=0; x<width; x++) {
        if (grid[y][x] === TileType.VOID) {
            let neighborFloor = false;
            for(let dy=-1; dy<=1; dy++) for(let dx=-1; dx<=1; dx++) {
                if (grid[y+dy]?.[x+dx] === TileType.FLOOR || grid[y+dy]?.[x+dx] === TileType.DOOR_OPEN) neighborFloor = true;
            }
            if (neighborFloor) grid[y][x] = TileType.WALL;
        }
    }
  }

  const portalRoomId = rooms.length > 0 ? rooms[rooms.length - 1].id : '';

  // Select Guaranteed Weapon Room
  // Choose a room that is NOT the start room (index 0) and NOT the portal room (last index)
  let weaponRoomId = '';
  const candidateRooms = rooms.filter((r, i) => i !== 0 && i !== rooms.length - 1);
  if (candidateRooms.length > 0) {
      weaponRoomId = candidateRooms[Math.floor(Math.random() * candidateRooms.length)].id;
  } else if (rooms.length > 1) {
      // Fallback if map is tiny (unlikely with minRooms=5 logic)
      weaponRoomId = rooms[0].id;
  }

  let floorName = `Floor ${floor}`;
  if (gameMode === GameMode.STORY && floor <= C.STORY_FLOORS.length) {
      floorName = C.STORY_FLOORS[floor - 1].name;
  } else if (gameMode === GameMode.ENDLESS) {
      const prefixes = ["Infinite", "Void", "Eternal", "Cursed", "Shattered"];
      const suffixes = ["Depths", "Sanctum", "Nexus", "Chamber", "Abyss"];
      floorName = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]} ${floor}`;
  }

  return { width, height, tileSize: C.TILE_SIZE, grid, rooms, floor, floorName, portalRoomId, weaponRoomId };
};

export const updateDungeonState = (state: GameState) => {
    // Skip room logic in test mode
    if (state.isTestMode) return;

    const { player, dungeon } = state;
    const pcx = player.x + player.width / 2;
    const pcy = player.y + player.height / 2;
    const px = Math.floor(pcx / C.TILE_SIZE);
    const py = Math.floor(pcy / C.TILE_SIZE);
    
    let currentRoom = dungeon.rooms.find(r => 
        px >= r.x && px < r.x + r.width && 
        py >= r.y && py < r.y + r.height
    );

    if (currentRoom && !currentRoom.isCleared && !currentRoom.isActive) {
        let safeToClose = true;
        for (const door of currentRoom.doorTiles) {
            const doorRect = { x: door.x * C.TILE_SIZE, y: door.y * C.TILE_SIZE, width: C.TILE_SIZE, height: C.TILE_SIZE };
            if (rectIntersect(player, doorRect)) {
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
};

const activateRoom = (state: GameState, room: Room) => {
    room.isActive = true;
    for(const t of room.doorTiles) {
        state.dungeon.grid[t.y][t.x] = TileType.DOOR_CLOSED;
    }

    const cx = (room.x + room.width/2) * C.TILE_SIZE;
    const cy = (room.y + room.height/2) * C.TILE_SIZE;
    
    // --- BOSS SPAWN LOGIC ---
    let isBossRoom = false;
    
    if (state.gameMode === GameMode.STORY) {
        // Floor 5: Mid-Boss, Floor 10: Final Boss
        if ((state.dungeon.floor === 5 || state.dungeon.floor === 10) && room.id === state.dungeon.portalRoomId) {
             isBossRoom = true;
        }
    } else {
        // Endless: Every 5 floors
        if (state.dungeon.floor % 5 === 0 && room.id === state.dungeon.portalRoomId) {
             isBossRoom = true;
        }
    }

    if (isBossRoom) {
        const hpMult = state.dungeon.floor;
        state.enemies.push({
            id: `boss-kurogami`,
            type: EntityType.ENEMY,
            enemyType: EnemyType.BOSS,
            x: cx - 32, y: cy - 32,
            width: 64, height: 64, // Bigger hitbox
            vx: 0, vy: 0,
            facingX: 1, facingY: 0,
            color: C.COLORS.enemyBoss,
            isDead: false,
            hp: 2000 + (hpMult * 200), 
            maxHp: 2000 + (hpMult * 200),
            damage: 25,
            attackCooldown: 0,
            maxAttackCooldown: 60,
            targetId: null,
            xpValue: 1000,
            agroRange: 9999,
            hitFlashTimer: 0,
            scale: 3, 
            bossPhase: 1
        });
        return;
    }

    // --- STANDARD SPAWN LOGIC ---
    const count = 3 + Math.floor(state.dungeon.floor) + Math.floor(Math.random() * 3);
    
    let enemyPool: EnemyType[] = [EnemyType.STANDARD];

    if (state.gameMode === GameMode.STORY && state.dungeon.floor <= C.STORY_FLOORS.length) {
        const config = C.STORY_FLOORS[state.dungeon.floor - 1];
        if (config.pool.length > 0) enemyPool = config.pool;
    } else {
        // Endless Mode Generation
        if (state.dungeon.floor > 1) enemyPool.push(EnemyType.VOID_RATCH);
        if (state.dungeon.floor > 3) enemyPool.push(EnemyType.CORRUPTED_ACOLYTE);
        if (state.dungeon.floor > 5) enemyPool.push(EnemyType.ELITE);
        if (state.dungeon.floor > 7) enemyPool.push(EnemyType.IRON_HULK);
        if (state.dungeon.floor > 9) enemyPool.push(EnemyType.SHADOW_STRIDER);
        if (state.dungeon.floor > 12) enemyPool.push(EnemyType.MYSTIC);
    }

    for(let j=0; j<count; j++) {
        const ex = cx + (Math.random() - 0.5) * (room.width * C.TILE_SIZE * 0.6);
        const ey = cy + (Math.random() - 0.5) * (room.height * C.TILE_SIZE * 0.6);
        
        const type = enemyPool[Math.floor(Math.random() * enemyPool.length)];
        
        let scale = 1;
        let hp = 30 + (state.dungeon.floor * 5);
        let damage = 5 + state.dungeon.floor;
        let color = C.COLORS.enemyStandard;
        let size = 18;

        if (type === EnemyType.ELITE) { 
            scale = 1.5; hp *= 2.0; color = C.COLORS.enemyElite; damage *= 1.5;
        } else if (type === EnemyType.MYSTIC) {
            color = C.COLORS.enemyMystic;
        } else if (type === EnemyType.VOID_RATCH) {
            size = 14; hp *= 0.6; damage *= 0.8; color = C.COLORS.enemyVoidRatch;
        } else if (type === EnemyType.IRON_HULK) {
            size = 24; hp *= 3.0; damage *= 2.0; color = C.COLORS.enemyIronHulk;
        } else if (type === EnemyType.CORRUPTED_ACOLYTE) {
            color = C.COLORS.enemyAcolyte;
        } else if (type === EnemyType.SHADOW_STRIDER) {
            color = C.COLORS.enemyStrider; damage *= 1.8; hp *= 0.8;
        }

        const w = size * scale;
        const h = size * scale;

        state.enemies.push({
            id: `enemy-${Math.random()}`,
            type: EntityType.ENEMY,
            enemyType: type,
            x: ex, y: ey,
            width: w, height: h,
            vx: 0, vy: 0,
            facingX: 1, facingY: 0,
            color: color,
            isDead: false,
            hp, maxHp: hp,
            damage,
            attackCooldown: 0,
            maxAttackCooldown: 60,
            targetId: null,
            xpValue: 10 + (hp / 5),
            agroRange: 1000, 
            hitFlashTimer: 0,
            scale,
            bleedStack: 0,
            bleedTimer: 0
        });
        createParticles(state, ex, ey, 5, color);
    }
};

const clearRoom = (state: GameState, room: Room) => {
    room.isCleared = true;
    room.isActive = false;
    for(const t of room.doorTiles) {
        state.dungeon.grid[t.y][t.x] = TileType.DOOR_OPEN;
    }

    const cx = (room.x + room.width/2) * C.TILE_SIZE;
    const cy = (room.y + room.height/2) * C.TILE_SIZE;

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
        spawnDamageNumber(state, cx, cy, 0, true, C.COLORS.portal);
        return; 
    }

    // Check for Guaranteed Weapon Room
    if (room.id === state.dungeon.weaponRoomId) {
        const weapons = Object.values(WeaponType);
        const payload = weapons[Math.floor(Math.random() * weapons.length)];
        
        state.items.push({
            id: `guaranteed-weapon-${Math.random()}`,
            type: EntityType.ITEM,
            itemType: ItemType.WEAPON_DROP,
            x: cx, y: cy,
            width: 24, height: 24,
            vx: 0, vy: 0,
            color: C.COLORS.weaponDrop,
            isDead: false,
            value: 0, 
            floatOffset: Math.random(),
            payload
        });
        createParticles(state, cx, cy, 15, C.COLORS.weaponDrop);
        // Do not return, can still drop a blood vial potentially? 
        // No, let's make the weapon the sole reward to avoid clutter.
        return;
    }

    const roll = Math.random();
    let itemType = ItemType.BLOOD_VIAL;
    let color = C.COLORS.heal;
    let payload = null;
    
    // Removed Buff drops, now only Weapon Drop chance or Blood Vial
    if (roll > 0.95) {
        itemType = ItemType.WEAPON_DROP;
        color = C.COLORS.weaponDrop;
        const weapons = Object.values(WeaponType);
        payload = weapons[Math.floor(Math.random() * weapons.length)];
    } 

    state.items.push({
        id: `item-${Math.random()}`,
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
};

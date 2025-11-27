import { Dungeon, GameState, ItemType, Room, TileType, WeaponType, EntityType, EnemyType } from '../types';
import * as C from '../constants';
import { rectIntersect } from './physics';
import { createParticles } from './spawners';
import { spawnDamageNumber } from './spawners';

export const createDungeon = (floor: number): Dungeon => {
  const width = 60;
  const height = 60;
  const grid: TileType[][] = Array(height).fill(null).map(() => Array(width).fill(TileType.VOID));
  const rooms: Room[] = [];

  const roomCount = 10 + Math.floor(floor * 0.5);
  
  for (let i = 0; i < roomCount; i++) {
    const w = Math.floor(Math.random() * 8) + 8;
    const h = Math.floor(Math.random() * 8) + 8;
    const x = Math.floor(Math.random() * (width - w - 2)) + 1;
    const y = Math.floor(Math.random() * (height - h - 2)) + 1;

    const newRoom: Room = { 
        id: `room-${i}`,
        x, y, width: w, height: h,
        isCleared: i === 0,
        isActive: i === 0,
        doorTiles: []
    };
    
    let overlap = false;
    for (const r of rooms) {
      if (x < r.x + r.width + 2 && x + w + 2 > r.x && y < r.y + r.height + 2 && y + h + 2 > r.y) {
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

        const carve = (tx: number, ty: number) => {
            if (grid[ty]?.[tx] === TileType.VOID || grid[ty]?.[tx] === TileType.WALL) {
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

  for(const room of rooms) {
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

  return { width, height, tileSize: C.TILE_SIZE, grid, rooms, floor, portalRoomId };
};

export const updateDungeonState = (state: GameState) => {
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

    const count = 2 + Math.floor(state.dungeon.floor) + Math.floor(Math.random() * 3);
    const cx = (room.x + room.width/2) * C.TILE_SIZE;
    const cy = (room.y + room.height/2) * C.TILE_SIZE;

    for(let j=0; j<count; j++) {
        const ex = cx + (Math.random() - 0.5) * (room.width * C.TILE_SIZE * 0.6);
        const ey = cy + (Math.random() - 0.5) * (room.height * C.TILE_SIZE * 0.6);
        
        const roll = Math.random();
        // FIX: Replaced C.EnemyType with EnemyType, imported from ../types.
        let type = EnemyType.STANDARD;
        let scale = 1;
        let hp = 30 + (state.dungeon.floor * 5);
        let color = C.COLORS.enemyStandard;
        let size = 18;

        if (state.dungeon.floor > 2 && roll > 0.8) {
            // FIX: Replaced C.EnemyType with EnemyType, imported from ../types.
            type = EnemyType.ELITE;
            scale = 1.5;
            hp *= 2;
            color = C.COLORS.enemyElite;
        }

        const w = size * scale;
        const h = size * scale;

        state.enemies.push({
            id: `enemy-${Math.random()}`,
            // FIX: Replaced C.EntityType with EntityType, imported from ../types.
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
            maxAttackCooldown: 60,
            targetId: null,
            // FIX: Replaced C.EnemyType with EnemyType, imported from ../types.
            xpValue: 10 * (type === EnemyType.ELITE ? 3 : 1),
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
            // FIX: Replaced C.EntityType with EntityType, imported from ../types.
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

    const roll = Math.random();
    let itemType = ItemType.BLOOD_VIAL;
    let color = C.COLORS.heal;
    let payload = null;
    
    if (roll > 0.9) {
        itemType = ItemType.WEAPON_DROP;
        color = C.COLORS.weaponDrop;
        const weapons = Object.values(WeaponType);
        payload = weapons[Math.floor(Math.random() * weapons.length)];
    } else if (roll > 0.6) {
        itemType = ItemType.BUFF_DAMAGE;
        color = C.COLORS.buffDamage;
    } else if (roll > 0.4) {
        itemType = ItemType.BUFF_SPEED;
        color = C.COLORS.buffSpeed;
    }

    state.items.push({
        id: `item-${Math.random()}`,
        // FIX: Replaced C.EntityType with EntityType, imported from ../types.
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
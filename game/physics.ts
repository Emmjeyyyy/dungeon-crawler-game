import { Entity, Dungeon, TileType, Rect } from '../types';
import * as C from '../constants';

export function resolveMapCollision(entity: Entity, dungeon: Dungeon) {
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

export function checkWall(x: number, y: number, w: number, h: number, dungeon: Dungeon): boolean {
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

export function rectIntersect(r1: Rect, r2: Rect): boolean {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}


import { Entity, Dungeon, TileType, Rect, EntityType, EnemyType } from '../types';
import * as C from '../constants';

export function resolveEntityCollision(entities: Entity[]) {
    // Increased push strength for better separation (was 0.5)
    const pushStrength = 0.8;

    for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
            const e1 = entities[i];
            const e2 = entities[j];

            if (e1.isDead || e2.isDead) continue;
            
            // Skip non-character collisions
            if (e1.type === EntityType.PROJECTILE || e2.type === EntityType.PROJECTILE) continue;
            if (e1.type === EntityType.ITEM || e2.type === EntityType.ITEM) continue;
            if (e1.type === EntityType.ECHO || e2.type === EntityType.ECHO) continue;
            if (e1.type === EntityType.PARTICLE || e2.type === EntityType.PARTICLE) continue;

            const cx1 = e1.x + e1.width / 2;
            const cy1 = e1.y + e1.height / 2;
            const cx2 = e2.x + e2.width / 2;
            const cy2 = e2.y + e2.height / 2;

            const dx = cx1 - cx2;
            const dy = cy1 - cy2;
            const distSq = dx * dx + dy * dy;

            // Approximate collision radius (slightly smaller than hitbox)
            const r1 = e1.width * 0.45;
            const r2 = e2.width * 0.45;
            const minDist = r1 + r2;

            if (distSq < minDist * minDist && distSq > 0.001) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                
                const nx = dx / dist;
                const ny = dy / dist;

                const force = overlap * pushStrength;
                
                // Determine Mass to prevent players from being pushed easily by small mobs
                let m1 = 1;
                let m2 = 1;

                if (e1.type === EntityType.PLAYER) m1 = 5;
                if (e2.type === EntityType.PLAYER) m2 = 5;
                
                // Cast to any to safely check extended properties
                const t1 = e1 as any;
                const t2 = e2 as any;

                if (t1.enemyType === EnemyType.BOSS) m1 = 100;
                if (t2.enemyType === EnemyType.BOSS) m2 = 100;
                if (t1.enemyType === EnemyType.ELITE) m1 = 2;
                if (t2.enemyType === EnemyType.ELITE) m2 = 2;

                const totalMass = m1 + m2;
                const r1Factor = m2 / totalMass;
                const r2Factor = m1 / totalMass;

                e1.x += nx * force * r1Factor;
                e1.y += ny * force * r1Factor;
                e2.x -= nx * force * r2Factor;
                e2.y -= ny * force * r2Factor;
            }
        }
    }
}

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

// Special hitbox handling for Bosses (Tall Hurtbox)
export function getHurtbox(entity: Entity): Rect {
    if (entity.type === EntityType.ENEMY && (entity as any).enemyType === EnemyType.BOSS) {
        // Boss is physically 64x64 at feet level.
        // Visuals extend upwards significantly (scale 3, ~180px tall total).
        // We create a hurtbox that covers the visual body.
        return {
            x: entity.x - 20, // Slightly wider to catch side hits
            y: entity.y - 120, // Extend UP to catch head/body hits
            width: entity.width + 40,
            height: entity.height + 120
        };
    }
    return entity;
}

export function checkCircleRect(circle: {x: number, y: number, r: number}, rect: Rect): boolean {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;

    return (dx * dx + dy * dy) < (circle.r * circle.r);
}

import { GameState, WeaponType, EnemyType, ItemType, TileType, Player, Enemy, Echo, EntityType } from '../types';
import * as C from '../constants';

const drawCharacter = (
      ctx: CanvasRenderingContext2D, 
      entity: Player | Enemy | Echo,
      time: number
  ) => {
    // FIX: Guard Player-specific property `isSlashDashing`
    if (entity.type === EntityType.PLAYER && entity.isSlashDashing) {
         ctx.save();
         ctx.translate(entity.x + entity.width/2 - entity.vx * 2, entity.y + entity.height - entity.vy * 2);
         ctx.globalAlpha = 0.3; ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI*2); ctx.fill();
         ctx.restore();
         ctx.save();
         ctx.translate(entity.x + entity.width/2 - entity.vx, entity.y + entity.height - entity.vy);
         ctx.globalAlpha = 0.5; ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI*2); ctx.fill();
         ctx.restore();
    }

    const isMoving = Math.abs(entity.vx) > 0.5 || Math.abs(entity.vy) > 0.5;
    const facing = entity.facingX || 1;
    const bob = isMoving ? Math.sin(time * 0.5) * 2 : Math.sin(time * 0.1) * 1;
    
    ctx.save();
    ctx.translate(entity.x + entity.width/2, entity.y + entity.height);

    if (entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.BOSS) {
      ctx.scale(2, 2);
    } else if (entity.type === EntityType.ENEMY || entity.type === EntityType.ECHO) {
      ctx.scale(entity.scale || 1, entity.scale || 1);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI*2); ctx.fill();

    if (entity.type === EntityType.ECHO) {
        ctx.globalAlpha = 0.5;
        if (entity.tier === 3) ctx.globalAlpha = 0.5 + Math.sin(time * 0.2) * 0.2;
    }

    ctx.fillStyle = entity.type === EntityType.ENEMY ? '#271a1a' : '#0f172a';
    const legOffset = isMoving ? Math.sin(time * 0.5) * 6 : 0;
    if (entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.MYSTIC) {
        ctx.fillStyle = entity.color;
        ctx.beginPath(); ctx.moveTo(-8, -10 + bob); ctx.lineTo(0, 5 + bob); ctx.lineTo(8, -10 + bob); ctx.fill();
    } else {
        ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-6 + legOffset, 0); ctx.lineTo(-2 + legOffset, 0); ctx.lineTo(0, -8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(6 - legOffset, 0); ctx.lineTo(2 - legOffset, 0); ctx.lineTo(0, -8); ctx.fill();
    }

    ctx.translate(0, -12 + bob); 
    ctx.fillStyle = (entity.type === EntityType.PLAYER || entity.type === EntityType.ENEMY) && entity.hitFlashTimer > 0 ? '#ffffff' : entity.color;
    
    if ((entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.STANDARD) || (entity.type === EntityType.ECHO && entity.tier === 1)) {
        ctx.fillRect(-6, -10, 14, 14);
    } else if ((entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.ELITE) || (entity.type === EntityType.ECHO && entity.tier === 2)) {
        ctx.fillRect(-10, -18, 20, 22);
        ctx.fillStyle = '#facc15'; ctx.fillRect(-8, -16, 16, 8); 
    } else if ((entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.MYSTIC) || (entity.type === EntityType.ECHO && entity.tier === 3)) {
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(0, -20); ctx.fill();
    } else if (entity.type === EntityType.PLAYER) {
        ctx.fillRect(-6, -14, 12, 16);
        ctx.fillStyle = '#334155'; ctx.fillRect(-6, -2, 12, 2);
        ctx.fillStyle = '#dc2626'; ctx.fillRect(-2, -12, 4, 12);
    }

    ctx.translate(0, -14);
    ctx.fillStyle = (entity.type === EntityType.PLAYER || entity.type === EntityType.ENEMY) && entity.hitFlashTimer > 0 ? '#fff' : (entity.type === EntityType.PLAYER ? '#f1f5f9' : entity.color);

    if (entity.type === EntityType.ENEMY) {
        if (entity.enemyType === EnemyType.ELITE) {
            ctx.fillRect(-7, -10, 14, 12);
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-12, -14); ctx.lineTo(-6, -10);
            ctx.moveTo(7, -8); ctx.lineTo(12, -14); ctx.lineTo(6, -10); ctx.fill();
        } else if (entity.enemyType === EnemyType.MYSTIC) {
            ctx.beginPath(); ctx.arc(0, -5, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffff00'; ctx.fillRect(-2, -6, 1, 1); ctx.fillRect(2, -6, 1, 1);
        } else {
            ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI*2); ctx.fill();
        }
    } else if (entity.type === EntityType.PLAYER) {
        ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(0, -5, 5.5, Math.PI, Math.PI * 2); ctx.fill();
    }

    if (entity.type === EntityType.PLAYER && !entity.isDead && !entity.isSlashDashing) {
        const weapon = C.WEAPONS[entity.currentWeapon];
        ctx.save();
        ctx.translate(facing * 10, 2);
        let baseRot = entity.aimAngle || 0;
        let swingOffset = 0; let progress = 0;
        
        if (entity.isAttacking) {
             progress = 1 - (entity.attackCooldown / (entity.maxAttackCooldown || weapon.cooldown));
             if (entity.currentWeapon !== WeaponType.SHADOW_BOW) swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);
             else swingOffset = -Math.sin(progress * Math.PI) * 0.2;
        } else {
             swingOffset = Math.sin(time * 0.1) * 0.1;
        }

        // SWOOSH EFFECT
        if (entity.isAttacking && entity.currentWeapon !== WeaponType.SHADOW_BOW && progress > 0.1 && progress < 0.9) {
            ctx.save();
            ctx.rotate(baseRot);
            ctx.globalAlpha = Math.sin(progress * Math.PI) * 0.95;

            const range = weapon.range || 50;
            const arcSize = weapon.arc || Math.PI;

            // Custom Procedural Slash Path
            const createSlashPath = (ctx: CanvasRenderingContext2D, r: number, arc: number) => {
                const halfArc = arc / 2;
                // Outer curve
                ctx.beginPath();
                ctx.arc(0, 0, r, -halfArc, halfArc, false);
                // Sharp tapered return
                ctx.quadraticCurveTo(r * 0.6, 0, Math.cos(-halfArc) * r, Math.sin(-halfArc) * r);
                ctx.closePath();
            };

            // 1. Outer Glow (Soft Aura)
            ctx.shadowBlur = 20;
            ctx.shadowColor = weapon.color;
            ctx.fillStyle = weapon.color;
            ctx.globalAlpha = 0.3 * Math.sin(progress * Math.PI);
            createSlashPath(ctx, range * 1.1, arcSize);
            ctx.fill();
            ctx.shadowBlur = 0;

            // 2. Main Color Body (Solid Blade)
            ctx.fillStyle = weapon.color;
            ctx.globalAlpha = 0.8 * Math.sin(progress * Math.PI);
            createSlashPath(ctx, range, arcSize);
            ctx.fill();

            // 3. White Hot Core (Cutting Edge)
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.9 * Math.sin(progress * Math.PI);
            createSlashPath(ctx, range * 0.9, arcSize * 0.9);
            ctx.fill();

            ctx.restore();
        }

        ctx.rotate(baseRot + swingOffset);
        if (Math.abs(baseRot) > Math.PI / 2) ctx.scale(1, -1);
        
        if (entity.isAttacking && progress > 0.2 && progress < 0.8) {
            ctx.save(); ctx.rotate(swingOffset * -0.2); ctx.globalAlpha = 0.3;
            ctx.fillStyle = weapon.color; ctx.fillRect(0, -2, weapon.range - 5, 4);
            ctx.restore();
        }

        if (entity.currentWeapon === WeaponType.BLOOD_BLADE) {
            const s = 2.5;
            ctx.fillStyle = '#3f2e22'; ctx.fillRect(-4 * s, -1 * s, 5 * s, 2 * s);
            ctx.fillStyle = '#565963'; ctx.fillRect(-5 * s, -1.5 * s, 2 * s, 3 * s);
            ctx.fillStyle = '#8f939d'; ctx.fillRect(1 * s, -4 * s, 2 * s, 8 * s);
            ctx.fillStyle = '#565963'; ctx.fillRect(1.5 * s, -1 * s, 1 * s, 2 * s);
            ctx.fillStyle = '#c7cfdd'; ctx.fillRect(3 * s, -2 * s, 14 * s, 4 * s);
            ctx.fillStyle = '#8f939d'; ctx.fillRect(3 * s, 0, 14 * s, 1 * s);
        } else if (entity.currentWeapon === WeaponType.DUAL_FANGS) {
            ctx.translate(-4, 0);
            ctx.fillStyle = '#525252'; ctx.fillRect(-2, -2, 8, 4);
            ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(16, -4); ctx.lineTo(12, 0); ctx.lineTo(16, 4); ctx.fill();
        } else if (entity.currentWeapon === WeaponType.REAPER_AXE) {
            ctx.translate(-10, 0);
            ctx.fillStyle = '#451a03'; ctx.fillRect(0, -2, 40, 4);
            ctx.fillStyle = '#991b1b'; ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(36, -16); ctx.lineTo(44, 0); ctx.lineTo(36, 16); ctx.fill();
        } else if (entity.currentWeapon === WeaponType.SHADOW_BOW) {
            ctx.translate(2, 0);
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(5, 0, 12, -Math.PI/2, Math.PI/2); ctx.stroke();
            ctx.fillStyle = '#cbd5e1'; ctx.fillRect(5, -12, 2, 24);
        }

        ctx.restore();
    }
    
    ctx.restore();
};

const drawDungeon = (ctx: CanvasRenderingContext2D, state: GameState) => {
    const { dungeon, camera } = state;
    const startCol = Math.floor((-camera.x) / C.TILE_SIZE);
    const endCol = startCol + (C.CANVAS_WIDTH / C.TILE_SIZE) + 1;
    const startRow = Math.floor((-camera.y) / C.TILE_SIZE);
    const endRow = startRow + (C.CANVAS_HEIGHT / C.TILE_SIZE) + 1;

    for (let y = startRow; y <= endRow; y++) {
        for (let x = startCol; x <= endCol; x++) {
            if (y < 0 || y >= dungeon.height || x < 0 || x >= dungeon.width) continue;
            
            const tile = dungeon.grid[y][x];
            const px = x * C.TILE_SIZE;
            const py = y * C.TILE_SIZE;

            if (tile === TileType.FLOOR || tile === TileType.DOOR_OPEN) {
                const isAlt = (x + y) % 2 === 0;
                ctx.fillStyle = isAlt ? C.COLORS.floor : C.COLORS.floorAlt;
                ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
                
                // Grid overlay
                ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                ctx.strokeRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
            } 
            else if (tile === TileType.WALL) {
                ctx.fillStyle = C.COLORS.wall;
                ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
                // 3D effect
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(px, py + C.TILE_SIZE - 10, C.TILE_SIZE, 10);
            }
            else if (tile === TileType.DOOR_CLOSED) {
                ctx.fillStyle = C.COLORS.doorClosed;
                ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + C.TILE_SIZE, py + C.TILE_SIZE);
                ctx.moveTo(px + C.TILE_SIZE, py); ctx.lineTo(px, py + C.TILE_SIZE);
                ctx.stroke();
            }
        }
    }
};

export const renderScene = (ctx: CanvasRenderingContext2D, state: GameState) => {
    // Clear Screen
    ctx.fillStyle = C.COLORS.background;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    ctx.save();
    
    // Camera Shake
    const shakeX = (Math.random() - 0.5) * state.camera.shake;
    const shakeY = (Math.random() - 0.5) * state.camera.shake;
    ctx.translate(state.camera.x + shakeX, state.camera.y + shakeY);

    // Draw Map
    drawDungeon(ctx, state);

    // Draw Shadows (Decals)
    state.enemies.forEach(e => {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(e.x + e.width/2, e.y + e.height - 2, e.width/2, 6, 0, 0, Math.PI*2); ctx.fill();
    });
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(state.player.x + state.player.width/2, state.player.y + state.player.height - 2, state.player.width/2, 6, 0, 0, Math.PI*2); ctx.fill();

    // Draw Items
    state.items.forEach(item => {
        const bounce = Math.sin(state.time * 0.1 + item.floatOffset * 10) * 5;
        ctx.save();
        ctx.translate(item.x + item.width/2, item.y + item.height/2 + bounce);
        
        // Glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = item.color;
        
        if (item.itemType === ItemType.PORTAL) {
             const angle = state.time * 0.05;
             ctx.rotate(angle);
             ctx.fillStyle = C.COLORS.portal;
             ctx.fillRect(-15, -15, 30, 30);
             ctx.rotate(-angle * 2);
             ctx.strokeStyle = '#fff';
             ctx.strokeRect(-10, -10, 20, 20);
        } else {
            ctx.fillStyle = item.color;
            if (item.itemType === ItemType.WEAPON_DROP) {
                 ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(8, 0); ctx.lineTo(0, 10); ctx.lineTo(-8, 0); ctx.fill();
            } else {
                 ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.restore();
    });

    // Draw Entities
    // Sort by Y for depth
    const entities: (Player | Enemy | Echo)[] = [...state.enemies, ...state.echoes, state.player];
    entities.sort((a, b) => (a.y + a.height) - (b.y + b.height));
    
    entities.forEach(e => {
        if (!e.isDead) drawCharacter(ctx, e, state.time);
    });

    // Draw Projectiles
    state.projectiles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.atan2(p.vy, p.vx));
        
        if (p.renderStyle === 'WAVE') {
             ctx.fillStyle = p.color;
             ctx.shadowBlur = 10; ctx.shadowColor = p.color;
             ctx.beginPath(); ctx.arc(0, 0, p.width, -Math.PI/2, Math.PI/2); ctx.fill();
        } else {
             ctx.fillStyle = p.color;
             ctx.fillRect(-p.width/2, -p.height/2, p.width, p.height);
             // Trail
             ctx.globalAlpha = 0.3;
             ctx.fillStyle = p.color;
             ctx.fillRect(-p.width*2, -p.height/2, p.width*2, p.height);
        }
        ctx.restore();
    });

    // Draw Particles
    state.particles.forEach(p => {
        ctx.globalAlpha = p.lifeTime / p.maxLifeTime;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

    // Draw Damage Numbers
    state.damageNumbers.forEach(dn => {
        ctx.save();
        ctx.globalAlpha = dn.lifeTime / dn.maxLifeTime;
        ctx.fillStyle = dn.color;
        ctx.font = dn.isCrit ? 'bold 24px Arial' : 'bold 16px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(Math.round(dn.value).toString(), dn.x, dn.y);
        ctx.fillText(Math.round(dn.value).toString(), dn.x, dn.y);
        ctx.restore();
    });

    // Health Bars for Enemies
    state.enemies.forEach(e => {
        if (e.hp < e.maxHp) {
            const hpPct = e.hp / e.maxHp;
            ctx.fillStyle = 'black';
            ctx.fillRect(e.x, e.y - 10, e.width, 4);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(e.x, e.y - 10, e.width * hpPct, 4);
        }
    });

    ctx.restore();
};
import { GameState, Entity, WeaponType, EnemyType, ItemType, TileType, Enemy, EntityType } from '../types';
import * as C from '../constants';

const drawCharacter = (
      ctx: CanvasRenderingContext2D, 
      entity: any, 
      time: number, 
      isEcho: boolean = false
  ) => {
    // FIX: Replaced C.EntityType with EntityType, imported from ../types.
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
    // FIX: Replaced C.EntityType with EntityType, imported from ../types.
    if (entity.type === EntityType.ENEMY && entity.enemyType === EnemyType.BOSS) ctx.scale(2, 2);
    else ctx.scale(entity.scale || 1, entity.scale || 1);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI*2); ctx.fill();

    if (isEcho) {
        ctx.globalAlpha = 0.5;
        if (entity.tier === 3) ctx.globalAlpha = 0.5 + Math.sin(time * 0.2) * 0.2;
    }

    // FIX: Replaced C.EntityType with EntityType, imported from ../types.
    ctx.fillStyle = entity.type === EntityType.ENEMY ? '#271a1a' : '#0f172a';
    const legOffset = isMoving ? Math.sin(time * 0.5) * 6 : 0;
    if (entity.enemyType !== EnemyType.MYSTIC) {
        ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-6 + legOffset, 0); ctx.lineTo(-2 + legOffset, 0); ctx.lineTo(0, -8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(6 - legOffset, 0); ctx.lineTo(2 - legOffset, 0); ctx.lineTo(0, -8); ctx.fill();
    } else {
        ctx.fillStyle = entity.color;
        ctx.beginPath(); ctx.moveTo(-8, -10 + bob); ctx.lineTo(0, 5 + bob); ctx.lineTo(8, -10 + bob); ctx.fill();
    }

    ctx.translate(0, -12 + bob); 
    ctx.fillStyle = entity.hitFlashTimer > 0 ? '#ffffff' : entity.color;

    if (entity.enemyType === EnemyType.STANDARD || (isEcho && entity.tier === 1)) {
        ctx.fillRect(-6, -10, 14, 14);
    } else if (entity.enemyType === EnemyType.ELITE || (isEcho && entity.tier === 2)) {
        ctx.fillRect(-10, -18, 20, 22);
        ctx.fillStyle = '#facc15'; ctx.fillRect(-8, -16, 16, 8); 
    } else if (entity.enemyType === EnemyType.MYSTIC || (isEcho && entity.tier === 3)) {
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(0, -20); ctx.fill();
    } else {
        ctx.fillRect(-6, -14, 12, 16);
        // FIX: Replaced C.EntityType with EntityType, imported from ../types.
        if (entity.type === EntityType.PLAYER) {
            ctx.fillStyle = '#334155'; ctx.fillRect(-6, -2, 12, 2);
            ctx.fillStyle = '#dc2626'; ctx.fillRect(-2, -12, 4, 12);
        }
    }

    ctx.translate(0, -14);
    // FIX: Replaced C.EntityType with EntityType, imported from ../types.
    ctx.fillStyle = entity.hitFlashTimer > 0 ? '#fff' : (entity.type === EntityType.PLAYER ? '#f1f5f9' : entity.color);
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
        // FIX: Replaced C.EntityType with EntityType, imported from ../types.
        if (entity.type === EntityType.PLAYER) {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath(); ctx.arc(0, -5, 5.5, Math.PI, Math.PI * 2); ctx.fill();
        }
    }

    // FIX: Replaced C.EntityType with EntityType, imported from ../types.
    if (entity.type === EntityType.PLAYER && !entity.isDead && !entity.isSlashDashing) {
        const weapon = C.WEAPONS[entity.currentWeapon || WeaponType.BLOOD_BLADE];
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

        if (entity.isAttacking && entity.currentWeapon !== WeaponType.SHADOW_BOW && progress > 0.05 && progress < 0.95) {
            ctx.save();
            ctx.rotate(baseRot);
            const range = weapon.range || 50;
            const arcSize = weapon.arc || Math.PI;
            ctx.globalAlpha = Math.min(1, Math.sin(progress * Math.PI) * 1.5);

            const createCrescentPath = (r: number, thickness: number) => {
                const innerR = r - thickness; ctx.beginPath(); ctx.arc(0, 0, r, -arcSize / 2, arcSize / 2);
                const endPointX = innerR * Math.cos(arcSize / 2); const endPointY = innerR * Math.sin(arcSize / 2);
                ctx.quadraticCurveTo(r * 0.5, 0, endPointX, endPointY); ctx.arc(0, 0, innerR, arcSize / 2, -arcSize / 2, true);
                const startPointX = r * Math.cos(-arcSize / 2); const startPointY = r * Math.sin(-arcSize / 2);
                ctx.quadraticCurveTo(r * 0.5, 0, startPointX, startPointY); ctx.closePath();
            };
            
            ctx.shadowBlur = 15; ctx.shadowColor = weapon.color; ctx.fillStyle = weapon.color;
            createCrescentPath(range, 12); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = weapon.color; createCrescentPath(range, 8); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; createCrescentPath(range - 2, 4); ctx.fill();
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
            ctx.fillStyle = '#8f939d'; ctx.fillRect(3 * s, -2 * s, 14 * s, 1 * s); ctx.fillRect(3 * s, 1 * s, 14 * s, 1 * s);
            ctx.fillStyle = '#565963'; ctx.fillRect(3 * s, -0.5 * s, 13 * s, 1 * s);
            ctx.fillStyle = '#c7cfdd'; ctx.beginPath(); ctx.moveTo(17 * s, -2 * s); ctx.lineTo(20 * s, 0); ctx.lineTo(17 * s, 2 * s); ctx.fill();
        } else if (entity.currentWeapon === WeaponType.DUAL_FANGS) {
            ctx.fillStyle = weapon.color; ctx.fillRect(-4, -2, weapon.range * 0.7, 4);
            ctx.fillStyle = '#64748b'; ctx.fillRect(-6, 0, 4, 2);
        } else if (entity.currentWeapon === WeaponType.REAPER_AXE) {
            ctx.fillStyle = '#5c3a2e'; ctx.fillRect(-10, -2, weapon.range, 4);
            ctx.fillStyle = weapon.color; ctx.beginPath();
            ctx.moveTo(weapon.range - 30, -4); ctx.lineTo(weapon.range - 5, -16); ctx.lineTo(weapon.range - 5, 16); ctx.lineTo(weapon.range - 30, 4);
            ctx.fill();
        } else if (entity.currentWeapon === WeaponType.SHADOW_BOW) {
            ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2; ctx.beginPath();
            ctx.arc(2, 0, 16, -Math.PI/2, Math.PI/2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(2, -16); ctx.lineTo(2, 16); ctx.stroke();
        }
        ctx.restore();
    }
    ctx.restore(); 
};

export const renderScene = (ctx: CanvasRenderingContext2D, state: GameState) => {
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
        } else if (tile === TileType.WALL) {
          ctx.fillStyle = C.COLORS.wall;
          ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
        } else if (tile === TileType.DOOR_CLOSED) {
          ctx.fillStyle = C.COLORS.doorClosed;
          ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
        } else if (tile === TileType.DOOR_OPEN) {
          ctx.fillStyle = C.COLORS.doorOpen;
          ctx.fillRect(px, py, C.TILE_SIZE, C.TILE_SIZE);
        }
      }
    }

    state.items.forEach(item => {
      ctx.shadowBlur = 10; ctx.shadowColor = item.color; ctx.fillStyle = item.color;
      const bob = Math.sin(state.time * 0.1) * 3;
      const cx = item.x + item.width/2; const cy = item.y + item.height/2 + bob;
      if (item.itemType === ItemType.PORTAL) {
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(state.time * 0.05);
          const gradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 25);
          gradient.addColorStop(0, '#ffffff'); gradient.addColorStop(0.5, C.COLORS.portal); gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, 25 + Math.sin(state.time * 0.2) * 2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
      } else {
          ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
      }
    });

    const allEntities = [...state.enemies, ...state.echoes, state.player].sort((a, b) => (a.y + a.height) - (b.y + b.height));
    // FIX: Replaced C.EntityType with EntityType, imported from ../types.
    allEntities.forEach(e => drawCharacter(ctx, e, state.time, e.type === EntityType.ECHO));
    // FIX: Replaced C.EntityType with EntityType, imported from ../types.
    allEntities.filter(e => e.type === EntityType.ENEMY).forEach((e: any) => {
        const hpPct = e.hp / e.maxHp;
        if (hpPct < 1) {
           ctx.fillStyle = '#450a0a'; ctx.fillRect(e.x, e.y - 12, e.width, 4);
           ctx.fillStyle = '#ef4444'; ctx.fillRect(e.x, e.y - 12, e.width * hpPct, 4);
        }
    });

    state.projectiles.forEach(proj => {
        ctx.save();
        if (proj.renderStyle === 'WAVE') {
             ctx.translate(proj.x, proj.y);
             ctx.rotate(Math.atan2(proj.vy, proj.vx));
             ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 20; ctx.shadowColor = '#ef4444';
             ctx.fillStyle = `rgba(239, 68, 68, 0.4)`; ctx.beginPath(); ctx.arc(-10, 0, 20, -Math.PI/2, Math.PI/2); ctx.fill();
             const gradient = ctx.createLinearGradient(0, -15, 0, 15);
             gradient.addColorStop(0, '#7f1d1d'); gradient.addColorStop(0.5, '#ef4444'); gradient.addColorStop(1, '#7f1d1d');
             ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(0, 0, 15, -Math.PI/2, Math.PI/2, false); ctx.quadraticCurveTo(-5, 0, 0, 15); ctx.fill();
        } else {
            ctx.fillStyle = proj.color; ctx.beginPath();
            ctx.arc(proj.x, proj.y, proj.width/2, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });

    state.particles.forEach(part => {
        ctx.fillStyle = part.color; ctx.globalAlpha = part.lifeTime / part.maxLifeTime;
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
        ctx.fillStyle = dn.color; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
        ctx.strokeText(Math.floor(dn.value).toString(), screenX, screenY);
        ctx.fillText(Math.floor(dn.value).toString(), screenX, screenY);
        ctx.globalAlpha = 1.0;
    });
};
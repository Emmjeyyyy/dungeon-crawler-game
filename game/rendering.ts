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
            
            const createCrescentPath = (ctx: CanvasRenderingContext2D, r: number, arc: number, innerRScale: number) => {
                const innerRadius = r * innerRScale;
                const startAngle = -arc / 2;
                const endAngle = arc / 2;

                ctx.beginPath();
                ctx.arc(0, 0, r, startAngle, endAngle, false);
                const innerEndX = Math.cos(endAngle) * innerRadius;
                const innerEndY = Math.sin(endAngle) * innerRadius;
                ctx.lineTo(innerEndX, innerEndY);
                ctx.arc(0, 0, innerRadius, endAngle, startAngle, true);
                ctx.closePath();
            };

            // 1. Outer Glow
            ctx.shadowBlur = 25;
            ctx.shadowColor = weapon.color;
            createCrescentPath(ctx, range, arcSize, 0.4);
            ctx.fillStyle = weapon.color;
            ctx.fill();
            ctx.shadowBlur = 0;

            // 2. Main Color Body
            ctx.fillStyle = weapon.color;
            createCrescentPath(ctx, range, arcSize, 0.5);
            ctx.fill();
            
            // 3. Inner texture lines
            ctx.save();
            createCrescentPath(ctx, range, arcSize, 0.5);
            ctx.clip();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
            for (let i = 0; i < 3; i++) {
                const streakRadius = range * (0.65 + i * 0.1);
                ctx.beginPath();
                ctx.arc(0, 0, streakRadius, -arcSize / 2, arcSize / 2, false);
                ctx.stroke();
            }
            ctx.restore();

            // 4. White Hot Core
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            createCrescentPath(ctx, range * 0.85, arcSize, 0.5);
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
            ctx.fillStyle = '#8f
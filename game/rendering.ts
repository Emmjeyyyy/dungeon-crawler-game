
import { GameState, WeaponType, EnemyType, ItemType, TileType, Player, Enemy, Echo, EntityType } from '../types';
import * as C from '../constants';

const drawCharacter = (
      ctx: CanvasRenderingContext2D, 
      entity: Player | Enemy | Echo,
      time: number
  ) => {
    
    const isPlayer = entity.type === EntityType.PLAYER;
    const isEnemy = entity.type === EntityType.ENEMY;
    const isEcho = entity.type === EntityType.ECHO;

    const p = isPlayer ? (entity as Player) : null;
    const e = isEnemy ? (entity as Enemy) : null;
    const echo = isEcho ? (entity as Echo) : null;

    // Guard Player-specific property `isSlashDashing`
    if (p && p.isSlashDashing) {
         ctx.save();
         ctx.translate(p.x + p.width/2 - p.vx * 2, p.y + p.height - p.vy * 2);
         // Purple/Black trail for Cursed Blade dash
         const trailColor = p.currentWeapon === WeaponType.CURSED_BLADE ? '#4c1d95' : '#fbbf24';
         ctx.globalAlpha = 0.3; ctx.fillStyle = trailColor; ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI*2); ctx.fill();
         ctx.restore();
         ctx.save();
         ctx.translate(p.x + p.width/2 - p.vx, p.y + p.height - p.vy);
         ctx.globalAlpha = 0.5; ctx.fillStyle = trailColor; ctx.beginPath(); ctx.arc(0, -10, 10, 0, Math.PI*2); ctx.fill();
         ctx.restore();
    }

    const isMoving = Math.abs(entity.vx) > 0.5 || Math.abs(entity.vy) > 0.5;
    const facing = entity.facingX || 1;
    const bob = isMoving ? Math.sin(time * 0.5) * 2 : Math.sin(time * 0.1) * 1;
    
    ctx.save();
    ctx.translate(entity.x + entity.width/2, entity.y + entity.height);

    // Scaling
    if (e && e.enemyType === EnemyType.BOSS) {
      ctx.scale(2, 2);
    } else if (e) {
      const scale = e.scale || 1;
      ctx.scale(scale, scale);
    } else if (echo) {
      const scale = echo.scale || 1;
      ctx.scale(scale, scale);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, 0, 10, 4, 0, 0, Math.PI*2); ctx.fill();

    if (echo) {
        ctx.globalAlpha = 0.5;
        if (echo.tier === 3) ctx.globalAlpha = 0.5 + Math.sin(time * 0.2) * 0.2;
    }

    ctx.fillStyle = isEnemy ? '#271a1a' : '#0f172a';
    const legOffset = isMoving ? Math.sin(time * 0.5) * 6 : 0;
    
    if (e && e.enemyType === EnemyType.MYSTIC) {
        ctx.fillStyle = entity.color;
        ctx.beginPath(); ctx.moveTo(-8, -10 + bob); ctx.lineTo(0, 5 + bob); ctx.lineTo(8, -10 + bob); ctx.fill();
    } else {
        ctx.beginPath(); ctx.moveTo(-4, -8); ctx.lineTo(-6 + legOffset, 0); ctx.lineTo(-2 + legOffset, 0); ctx.lineTo(0, -8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(6 - legOffset, 0); ctx.lineTo(2 - legOffset, 0); ctx.lineTo(0, -8); ctx.fill();
    }

    ctx.translate(0, -12 + bob); 
    
    // Hit flash
    let hitFlash = false;
    if (p && p.hitFlashTimer > 0) hitFlash = true;
    if (e && e.hitFlashTimer > 0) hitFlash = true;

    ctx.fillStyle = hitFlash ? '#ffffff' : entity.color;
    
    // Body shapes logic
    if ((e && e.enemyType === EnemyType.STANDARD) || (echo && echo.tier === 1)) {
        ctx.fillRect(-6, -10, 14, 14);
    } else if ((e && e.enemyType === EnemyType.ELITE) || (echo && echo.tier === 2)) {
        ctx.fillRect(-10, -18, 20, 22);
        ctx.fillStyle = '#facc15'; ctx.fillRect(-8, -16, 16, 8); 
    } else if ((e && e.enemyType === EnemyType.MYSTIC) || (echo && echo.tier === 3)) {
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(0, -20); ctx.fill();
    } else if (p) {
        ctx.fillRect(-6, -14, 12, 16);
        ctx.fillStyle = '#334155'; ctx.fillRect(-6, -2, 12, 2);
        ctx.fillStyle = '#dc2626'; ctx.fillRect(-2, -12, 4, 12);
    }

    ctx.translate(0, -14);
    ctx.fillStyle = hitFlash ? '#fff' : (isPlayer ? '#f1f5f9' : entity.color);

    if (e) {
        if (e.enemyType === EnemyType.ELITE) {
            ctx.fillRect(-7, -10, 14, 12);
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(-7, -8); ctx.lineTo(-12, -14); ctx.lineTo(-6, -10);
            ctx.moveTo(7, -8); ctx.lineTo(12, -14); ctx.lineTo(6, -10); ctx.fill();
        } else if (e.enemyType === EnemyType.MYSTIC) {
            ctx.beginPath(); ctx.arc(0, -5, 6, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffff00'; ctx.fillRect(-2, -6, 1, 1); ctx.fillRect(2, -6, 1, 1);
        } else {
            ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI*2); ctx.fill();
        }
    } else if (p) {
        ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(0, -5, 5.5, Math.PI, Math.PI * 2); ctx.fill();
    } else if (echo) {
        // Echo Head Rendering
        if (echo.tier === 3) {
             ctx.beginPath(); ctx.arc(0, -5, 6, 0, Math.PI*2); ctx.fill();
        } else {
             ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI*2); ctx.fill();
        }
    }

    // Player specific rendering (Weapon etc)
    if (p && !p.isDead && !p.isSlashDashing) {
            const weapon = C.WEAPONS[p.currentWeapon];
            ctx.save();
            
            if (p.currentWeapon === WeaponType.SHADOW_BOW) {
                const chestHeight = 0; 
                ctx.translate(0, chestHeight);
                ctx.rotate(p.aimAngle);
                const orbitRadius = 18;
                ctx.translate(orbitRadius, 0);

                if (Math.abs(p.aimAngle) > Math.PI / 2) {
                    ctx.scale(1, -1);
                }

                // --- Pixel Art Shadow Bow Rendering ---
                const s = 2; // scale
                const cDark = '#2e1065'; 
                const cMain = '#7c3aed'; 
                const cHigh = '#c4b5fd'; 
                const cGlow = '#a855f7'; 
                const cString = 'rgba(203, 213, 225, 0.6)';

                let pull = 0;
                if (p.isAttacking) {
                    pull = (1 - (p.attackCooldown / (p.maxAttackCooldown || 20))) * 8;
                }
                
                ctx.strokeStyle = cString;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-3*s, -8*s); 
                ctx.lineTo(-4*s - pull*s, 0); 
                ctx.lineTo(-3*s, 8*s); 
                ctx.stroke();

                if (p.isAttacking) {
                    ctx.fillStyle = cGlow;
                    ctx.fillRect((-4 - pull)*s, -0.5*s, 14*s, 1*s); 
                    ctx.fillStyle = '#e9d5ff';
                    ctx.fillRect((-4 - pull)*s, -1*s, 2*s, 2*s); 
                    ctx.fillStyle = '#e9d5ff';
                    ctx.fillRect((9 - pull)*s, -0.5*s, 2*s, 1*s); 
                }

                ctx.fillStyle = '#4b5563'; ctx.fillRect(-1*s, -2*s, 2*s, 4*s); 
                
                ctx.fillStyle = cMain; ctx.fillRect(-3*s, -4*s, 3*s, 2*s); 
                ctx.fillStyle = cDark; ctx.fillRect(0, -4*s, 1*s, 2*s); 
                ctx.fillStyle = cMain; ctx.fillRect(-3*s, -6*s, 2*s, 2*s); 
                ctx.fillStyle = cHigh; ctx.fillRect(-3*s, -5*s, 1*s, 1*s); 
                ctx.fillStyle = cMain; ctx.fillRect(-4*s, -8*s, 2*s, 2*s); 
                ctx.fillStyle = cGlow; ctx.fillRect(-3.5*s, -7.5*s, 1*s, 1*s); 
                ctx.fillStyle = cDark; ctx.fillRect(-4*s, -9*s, 1*s, 2*s); 
                ctx.fillStyle = cDark; ctx.fillRect(-4*s, -9*s, 2*s, 1*s); 
                
                ctx.fillStyle = cMain; ctx.fillRect(-3*s, 2*s, 3*s, 2*s);
                ctx.fillStyle = cDark; ctx.fillRect(0, 2*s, 1*s, 2*s);
                ctx.fillStyle = cMain; ctx.fillRect(-3*s, 4*s, 2*s, 2*s);
                ctx.fillStyle = cHigh; ctx.fillRect(-3*s, 4*s, 1*s, 1*s);
                ctx.fillStyle = cMain; ctx.fillRect(-4*s, 6*s, 2*s, 2*s);
                ctx.fillStyle = cGlow; ctx.fillRect(-3.5*s, 6.5*s, 1*s, 1*s);
                ctx.fillStyle = cDark; ctx.fillRect(-4*s, 7*s, 1*s, 2*s);
                ctx.fillStyle = cDark; ctx.fillRect(-4*s, 8*s, 2*s, 1*s);
            } else if (p.currentWeapon === WeaponType.EXECUTIONER_AXE) {
                // --- EXECUTIONER AXE RENDER ---
                if (p.isSpinning) {
                    ctx.translate(0, 0); // Moved down by 5px
                    ctx.rotate(time * 0.5); 
                } else {
                    // Standard visual stance
                    ctx.translate(facing * 3, 7);
                    
                    let baseRot = p.aimAngle || 0;
                    let swingOffset = 0; let progress = 0;
                    if (p.isAttacking) {
                        progress = 1 - (p.attackCooldown / (p.maxAttackCooldown || weapon.cooldown));
                        swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);
                        
                        // FIX: Invert swing offset when facing left to ensure top-to-bottom swing
                        if (Math.abs(baseRot) > Math.PI / 2) {
                            swingOffset *= -1;
                        }
                    } else {
                        swingOffset = Math.sin(time * 0.1) * 0.1;
                    }
                    ctx.rotate(baseRot + swingOffset);
                    if (Math.abs(baseRot) > Math.PI / 2) ctx.scale(1, -1);
                }

                // --- AXE PIXEL ART ---
                const s = 2.0;
                
                // Handle (Dark Wood/Leather) - Extended for reach
                ctx.fillStyle = '#451a03'; // Deep brown
                ctx.fillRect(0, -1*s, 40*s, 2*s); // Start at hand (0), go out 80px
                
                // Grip Wraps
                ctx.fillStyle = '#78350f';
                ctx.fillRect(4*s, -1.2*s, 2*s, 2.4*s);
                ctx.fillRect(12*s, -1.2*s, 2*s, 2.4*s);
                
                const headX = 30*s; // 60px out

                // Axe Head Connector (Dark Steel)
                ctx.fillStyle = '#1e293b'; // Slate 800
                ctx.fillRect(headX - 2*s, -3*s, 4*s, 6*s);
                
                // Double Headed Blades
                ctx.fillStyle = '#334155'; // Slate 700 (Blade Base)
                
                // Top Blade
                ctx.beginPath();
                ctx.moveTo(headX - 2*s, -3*s);
                ctx.lineTo(headX - 6*s, -8*s); // Top back
                ctx.lineTo(headX + 6*s, -10*s); // Top front point
                ctx.lineTo(headX + 2*s, -3*s); // Connect
                ctx.fill();
                
                // Bottom Blade
                ctx.beginPath();
                ctx.moveTo(headX - 2*s, 3*s);
                ctx.lineTo(headX - 6*s, 8*s); // Bottom back
                ctx.lineTo(headX + 6*s, 10*s); // Bottom front point
                ctx.lineTo(headX + 2*s, 3*s); // Connect
                ctx.fill();

                // Blade Edge (Lighter Steel)
                ctx.fillStyle = '#94a3b8'; // Slate 400
                // Top Edge
                ctx.beginPath(); ctx.moveTo(headX - 6*s, -8*s); ctx.lineTo(headX + 6*s, -10*s); ctx.lineTo(headX + 4*s, -6*s); ctx.fill();
                // Bottom Edge
                ctx.beginPath(); ctx.moveTo(headX - 6*s, 8*s); ctx.lineTo(headX + 6*s, 10*s); ctx.lineTo(headX + 4*s, 6*s); ctx.fill();

                // Blood Stains
                ctx.fillStyle = '#7f1d1d'; // Red 900
                ctx.fillRect(headX + 2*s, -8*s, 2*s, 2*s);
                ctx.fillRect(headX + 4*s, 8*s, 1*s, 2*s);
                ctx.fillRect(headX, -4*s, 3*s, 1*s);

            } else {
                // --- STANDARD MELEE WEAPONS ---
                ctx.translate(facing * 10, 2);
                let baseRot = p.aimAngle || 0;
                let swingOffset = 0; let progress = 0;
                
                if (p.isAttacking) {
                     progress = 1 - (p.attackCooldown / (p.maxAttackCooldown || weapon.cooldown));
                     swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);
                     
                     // FIX: Invert swing offset when facing left to ensure top-to-bottom swing
                     if (Math.abs(baseRot) > Math.PI / 2) {
                        swingOffset *= -1;
                     }
                } else {
                     swingOffset = Math.sin(time * 0.1) * 0.1;
                }
    
                // SWOOSH EFFECT
                if (p.isAttacking && progress > 0.05 && progress < 0.95) {
                    ctx.save();
                    ctx.rotate(baseRot);
                    ctx.globalAlpha = Math.sin(progress * Math.PI);
                    ctx.lineCap = 'round';
                    const range = weapon.range || 50;
                    const arcSize = weapon.arc || Math.PI;
    
                    const glowWidth = 16;
                    ctx.lineWidth = glowWidth;
                    ctx.strokeStyle = weapon.color;
                    ctx.shadowBlur = 15;
                    ctx.shadowColor = weapon.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, range - glowWidth / 2, -arcSize / 2, arcSize / 2);
                    ctx.stroke();
                    
                    ctx.shadowBlur = 0;
                    
                    const mainWidth = 10;
                    ctx.lineWidth = mainWidth;
                    ctx.strokeStyle = weapon.color;
                    ctx.beginPath();
                    ctx.arc(0, 0, range - mainWidth / 2, -arcSize / 2, arcSize / 2);
                    ctx.stroke();
                    
                    const coreWidth = 4;
                    ctx.lineWidth = coreWidth;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                    ctx.beginPath();
                    ctx.arc(0, 0, range - coreWidth / 2, -arcSize / 2, arcSize / 2);
                    ctx.stroke();
                    
                    ctx.restore();
                }
    
                ctx.rotate(baseRot + swingOffset);
                if (Math.abs(baseRot) > Math.PI / 2) ctx.scale(1, -1);
                
                if (p.isAttacking && progress > 0.2 && progress < 0.8) {
                    ctx.save(); ctx.rotate(swingOffset * -0.2); ctx.globalAlpha = 0.3;
                    ctx.fillStyle = weapon.color; ctx.fillRect(0, -2, weapon.range - 5, 4);
                    ctx.restore();
                }
    
                if (p.currentWeapon === WeaponType.BLOOD_BLADE) {
                    const s = 2.5;
                    ctx.fillStyle = '#3f2e22'; ctx.fillRect(-4 * s, -1 * s, 5 * s, 2 * s);
                    ctx.fillStyle = '#565963'; ctx.fillRect(-5 * s, -1.5 * s, 2 * s, 3 * s);
                    ctx.fillStyle = '#8f939d'; ctx.fillRect(1 * s, -4 * s, 2 * s, 8 * s);
                    ctx.fillStyle = '#565963'; ctx.fillRect(1.5 * s, -1 * s, 1 * s, 2 * s);
                    ctx.fillStyle = '#c7cfdd'; ctx.fillRect(3 * s, -2 * s, 14 * s, 4 * s);
                    ctx.fillStyle = '#8f939d'; ctx.fillRect(3 * s, -2 * s, 14 * s, 1 * s); ctx.fillRect(3 * s, 1 * s, 14 * s, 1 * s);
                    ctx.fillStyle = '#565963'; ctx.fillRect(3 * s, -0.5 * s, 13 * s, 1 * s);
                    ctx.fillStyle = '#c7cfdd'; ctx.beginPath(); ctx.moveTo(17 * s, -2 * s); ctx.lineTo(20 * s, 0); ctx.lineTo(17 * s, 2 * s); ctx.fill();
                } else if (p.currentWeapon === WeaponType.CURSED_BLADE) {
                    // CURSED BLADE (Katana) - Pixel Art Construction
                    const s = 2.0;
                    ctx.fillStyle = '#2e1065'; ctx.fillRect(-6*s, -1.5*s, 6*s, 3*s);
                    ctx.fillStyle = '#4c1d95'; ctx.fillRect(-5*s, -0.5*s, 1*s, 1*s); ctx.fillRect(-3*s, -0.5*s, 1*s, 1*s);
                    ctx.fillStyle = '#b45309'; ctx.fillRect(0, -2.5*s, 2*s, 5*s);
                    ctx.fillStyle = '#78350f'; ctx.fillRect(0.5*s, -1.5*s, 1*s, 3*s);
                    ctx.fillStyle = '#334155'; ctx.fillRect(2*s, -1.5*s, 24*s, 3*s); 
                    ctx.fillStyle = '#a855f7'; ctx.fillRect(2*s, 0.5*s, 22*s, 1*s);
                    ctx.beginPath(); ctx.moveTo(26*s, -1.5*s); ctx.lineTo(30*s, 0); ctx.lineTo(24*s, 1.5*s);
                    ctx.fillStyle = '#334155'; ctx.fill();
                    ctx.fillStyle = '#d8b4fe'; ctx.fillRect(10*s, -1*s, 1*s, 1*s); ctx.fillRect(20*s, 0, 1*s, 1*s);
                }
            }
            ctx.restore();
    }
    ctx.restore(); 
};

export const renderScene = (ctx: CanvasRenderingContext2D, state: GameState) => {
    // 1. Clear Screen
    ctx.fillStyle = C.COLORS.background;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);

    // 2. Render Dungeon
    const { dungeon } = state;
    const { grid, tileSize } = dungeon;
    
    // Viewport calculation to cull tiles
    const startCol = Math.floor(-state.camera.x / tileSize) - 1;
    const endCol = startCol + (C.CANVAS_WIDTH / tileSize) + 2;
    const startRow = Math.floor(-state.camera.y / tileSize) - 1;
    const endRow = startRow + (C.CANVAS_HEIGHT / tileSize) + 2;

    for (let y = Math.max(0, startRow); y < Math.min(dungeon.height, endRow); y++) {
        for (let x = Math.max(0, startCol); x < Math.min(dungeon.width, endCol); x++) {
            const tile = grid[y][x];
            if (tile === TileType.VOID) continue;

            const tx = x * tileSize;
            const ty = y * tileSize;

            if (tile === TileType.FLOOR) {
                ctx.fillStyle = ((x + y) % 2 === 0) ? C.COLORS.floor : C.COLORS.floorAlt;
                ctx.fillRect(tx, ty, tileSize, tileSize);
            } else if (tile === TileType.WALL) {
                ctx.fillStyle = C.COLORS.wall;
                ctx.fillRect(tx, ty, tileSize, tileSize);
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(tx, ty - 10, tileSize, 10);
            } else if (tile === TileType.DOOR_CLOSED) {
                ctx.fillStyle = C.COLORS.doorClosed;
                ctx.fillRect(tx, ty, tileSize, tileSize);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(tx, ty, tileSize, tileSize);
            } else if (tile === TileType.DOOR_OPEN) {
                ctx.fillStyle = C.COLORS.doorOpen;
                ctx.fillRect(tx, ty, tileSize, tileSize);
            }
        }
    }

    // 3. Render Items
    state.items.forEach(item => {
        const floatY = Math.sin(state.time * 0.1 + item.floatOffset * 10) * 5;
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2 + floatY;
        
        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 20 - floatY, 8, 3, 0, 0, Math.PI * 2); ctx.fill();

        if (item.itemType === ItemType.PORTAL) {
             ctx.fillStyle = item.color;
             const scale = 1 + Math.sin(state.time * 0.1) * 0.1;
             ctx.scale(scale, scale);
             ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
             ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        } else {
             ctx.fillStyle = item.color;
             ctx.rotate(state.time * 0.05);
             ctx.fillRect(-8, -8, 16, 16);
             ctx.fillStyle = '#fff';
             ctx.globalAlpha = 0.5;
             ctx.fillRect(-8, -8, 16, 4);
        }
        ctx.restore();
    });

    // 4. Render Entities
    const allEntities = [state.player, ...state.enemies, ...state.echoes];
    allEntities.sort((a, b) => (a.y + a.height) - (b.y + b.height));

    allEntities.forEach(entity => {
        if (!entity.isDead) {
            drawCharacter(ctx, entity as Player | Enemy | Echo, state.time);
        }
    });

    // 5. Render Projectiles
    state.projectiles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        if (p.renderStyle === 'WAVE') {
             const angle = Math.atan2(p.vy, p.vx);
             ctx.rotate(angle);
             ctx.beginPath(); ctx.arc(0, 0, p.width, -Math.PI/2, Math.PI/2); ctx.fill();
        } else if (p.renderStyle === 'SHADOW_ARROW') {
             const angle = Math.atan2(p.vy, p.vx);
             ctx.rotate(angle);
             ctx.fillStyle = '#d8b4fe';
             ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.fill();
        } else {
             ctx.beginPath(); ctx.arc(0, 0, p.width/2, 0, Math.PI*2); ctx.fill();
        }
        ctx.restore();
    });

    // 6. Render Particles
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.lifeTime / p.maxLifeTime;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.globalAlpha = 1.0;
    });

    // 7. Render Damage Numbers
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    state.damageNumbers.forEach(dn => {
        ctx.fillStyle = dn.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        const scale = Math.min(1.5, dn.lifeTime / 10);
        ctx.save();
        ctx.translate(dn.x, dn.y);
        ctx.scale(scale, scale);
        if (dn.isCrit) {
            ctx.font = 'bold 16px monospace';
            ctx.fillStyle = '#fbbf24';
        }
        ctx.strokeText(Math.floor(dn.value).toString(), 0, 0);
        ctx.fillText(Math.floor(dn.value).toString(), 0, 0);
        ctx.restore();
    });

    ctx.restore();
};

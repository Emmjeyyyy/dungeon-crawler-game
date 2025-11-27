
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
            
            // Unified Weapon Orbit Logic
            const orbitRadius = 12; 
            const shoulderOffset = 2; // Vertical adjustment from center
            
            ctx.translate(0, shoulderOffset); 
            
            // Standard Melee & Bow Rotation
            if (p.currentWeapon === WeaponType.SHADOW_BOW) {
                 // Slight adjustment for Bow specific rendering (chest height, orbit)
                 // Keeping bow slightly distinct or unified?
                 // Original bow code used orbitRadius 18. Let's adapt to unified style but keep offset.
                 ctx.rotate(p.aimAngle);
                 ctx.translate(18, 0); 
            } else if (p.isSpinning) {
                 // Special Spin Case (Executioner Swirl)
                 ctx.rotate(time * 0.5);
                 // No flip needed for spin
            } else {
                 // Standard Melee Orbit
                 ctx.rotate(p.aimAngle);
                 ctx.translate(orbitRadius, 0);
            }

            // Flip Y if facing left to keep weapon "upright" relative to swing
            if (!p.isSpinning && Math.abs(p.aimAngle) > Math.PI / 2) {
                ctx.scale(1, -1);
            }

            if (p.currentWeapon === WeaponType.SHADOW_BOW) {
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
                // Apply Swing Rotation locally (Scale handled above)
                let swingOffset = 0; 
                if (p.isAttacking && !p.isSpinning) {
                    const progress = 1 - (p.attackCooldown / (p.maxAttackCooldown || weapon.cooldown));
                    swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);
                    // NOTE: Do not invert swingOffset here, scale(1, -1) handles the flip for left-facing
                } else if (!p.isSpinning) {
                    swingOffset = Math.sin(time * 0.1) * 0.1; // Idle breath
                }
                
                if (!p.isSpinning) ctx.rotate(swingOffset);

                // --- AXE PIXEL ART ---
                const s = 2.0;
                
                // Handle (Dark Wood/Leather) - Draw from 0
                ctx.fillStyle = '#451a03'; ctx.fillRect(0, -1*s, 32*s, 2*s); 
                
                // Grip Wraps
                ctx.fillStyle = '#78350f';
                ctx.fillRect(4*s, -1.2*s, 2*s, 2.4*s);
                ctx.fillRect(12*s, -1.2*s, 2*s, 2.4*s);
                
                const headX = 22*s; // 44px out (Was 30s / 60px)

                // Axe Head Connector (Dark Steel)
                ctx.fillStyle = '#1e293b'; // Slate 800
                ctx.fillRect(headX - 2*s, -3*s, 4*s, 6*s);
                
                // Double Headed Blades
                ctx.fillStyle = '#334155'; // Slate 700
                
                // Top Blade
                ctx.beginPath();
                ctx.moveTo(headX - 2*s, -3*s);
                ctx.lineTo(headX - 6*s, -8*s); 
                ctx.lineTo(headX + 6*s, -10*s); 
                ctx.lineTo(headX + 2*s, -3*s); 
                ctx.fill();
                
                // Bottom Blade
                ctx.beginPath();
                ctx.moveTo(headX - 2*s, 3*s);
                ctx.lineTo(headX - 6*s, 8*s); 
                ctx.lineTo(headX + 6*s, 10*s); 
                ctx.lineTo(headX + 2*s, 3*s); 
                ctx.fill();

                // Blade Edge
                ctx.fillStyle = '#94a3b8'; // Slate 400
                ctx.beginPath(); ctx.moveTo(headX - 6*s, -8*s); ctx.lineTo(headX + 6*s, -10*s); ctx.lineTo(headX + 4*s, -6*s); ctx.fill();
                ctx.beginPath(); ctx.moveTo(headX - 6*s, 8*s); ctx.lineTo(headX + 6*s, 10*s); ctx.lineTo(headX + 4*s, 6*s); ctx.fill();

                // Blood Stains
                ctx.fillStyle = '#7f1d1d'; 
                ctx.fillRect(headX + 2*s, -8*s, 2*s, 2*s);
                ctx.fillRect(headX + 4*s, 8*s, 1*s, 2*s);
                ctx.fillRect(headX, -4*s, 3*s, 1*s);

            } else {
                // --- STANDARD MELEE WEAPONS ---
                let swingOffset = 0; 
                
                if (p.isAttacking) {
                     const progress = 1 - (p.attackCooldown / (p.maxAttackCooldown || weapon.cooldown));
                     swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);
                     // NOTE: Scale flip handles direction
                } else {
                     swingOffset = Math.sin(time * 0.1) * 0.1;
                }
    
                ctx.rotate(swingOffset);
                
                if (p.currentWeapon === WeaponType.BLOOD_BLADE) {
                    const s = 2.5;
                    // Adjusted coordinates to start Hilt at 0
                    ctx.fillStyle = '#3f2e22'; ctx.fillRect(0, -1 * s, 5 * s, 2 * s); // Hilt
                    ctx.fillStyle = '#565963'; ctx.fillRect(-1 * s, -1.5 * s, 2 * s, 3 * s); // Guard Back
                    ctx.fillStyle = '#8f939d'; ctx.fillRect(5 * s, -4 * s, 2 * s, 8 * s); // Guard Cross
                    ctx.fillStyle = '#c7cfdd'; ctx.fillRect(7 * s, -2 * s, 14 * s, 4 * s); // Blade
                    ctx.fillStyle = '#8f939d'; ctx.fillRect(7 * s, -2 * s, 14 * s, 1 * s); ctx.fillRect(7 * s, 1 * s, 14 * s, 1 * s);
                    ctx.fillStyle = '#565963'; ctx.fillRect(7 * s, -0.5 * s, 13 * s, 1 * s);
                    ctx.fillStyle = '#c7cfdd'; ctx.beginPath(); ctx.moveTo(21 * s, -2 * s); ctx.lineTo(24 * s, 0); ctx.lineTo(21 * s, 2 * s); ctx.fill();
                } else if (p.currentWeapon === WeaponType.CURSED_BLADE) {
                    // CURSED BLADE (Katana)
                    const s = 2.0;
                    // Hilt starts at 0
                    ctx.fillStyle = '#2e1065'; ctx.fillRect(0, -1.5*s, 6*s, 3*s);
                    ctx.fillStyle = '#4c1d95'; ctx.fillRect(1*s, -0.5*s, 1*s, 1*s); ctx.fillRect(3*s, -0.5*s, 1*s, 1*s);
                    ctx.fillStyle = '#b45309'; ctx.fillRect(6*s, -2.5*s, 2*s, 5*s); // Tsuba
                    ctx.fillStyle = '#78350f'; ctx.fillRect(6.5*s, -1.5*s, 1*s, 3*s);
                    ctx.fillStyle = '#334155'; ctx.fillRect(8*s, -1.5*s, 24*s, 3*s); // Blade
                    ctx.fillStyle = '#a855f7'; ctx.fillRect(8*s, 0.5*s, 22*s, 1*s); // Edge Glow
                    ctx.beginPath(); ctx.moveTo(32*s, -1.5*s); ctx.lineTo(36*s, 0); ctx.lineTo(30*s, 1.5*s);
                    ctx.fillStyle = '#334155'; ctx.fill();
                    ctx.fillStyle = '#d8b4fe'; ctx.fillRect(16*s, -1*s, 1*s, 1*s); ctx.fillRect(26*s, 0, 1*s, 1*s);
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

    // 3. Render Particles (MOVED HERE: Behind Entities)
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.lifeTime / p.maxLifeTime;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.globalAlpha = 1.0;
    });

    // 4. Render Items
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

    // 5. Render Entities
    const allEntities = [state.player, ...state.enemies, ...state.echoes];
    allEntities.sort((a, b) => (a.y + a.height) - (b.y + b.height));

    allEntities.forEach(entity => {
        if (!entity.isDead) {
            drawCharacter(ctx, entity as Player | Enemy | Echo, state.time);
        }
    });

    // 5.5 Render Health Bars
    state.enemies.forEach(e => {
        if (!e.isDead) {
            const hpPct = Math.max(0, e.hp / e.maxHp);
            const barWidth = e.width * 1.5;
            const barHeight = 4;
            const barX = e.x + (e.width - barWidth) / 2;
            
            // Dynamic Y-offset based on height to ensure it clears the head
            const barY = e.y - e.height - 10; 

            // Border
            ctx.fillStyle = '#000000';
            ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

            // Background
            ctx.fillStyle = '#450a0a';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Foreground
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
        }
    });

    // 6. Render Projectiles
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


import { GameState, WeaponType, EnemyType, ItemType, TileType, Player, Enemy, Echo, EntityType, BossState } from '../types';
import * as C from '../constants';

const drawKurogami = (ctx: CanvasRenderingContext2D, boss: Enemy, time: number) => {
    // Boss Scale handled in drawCharacter wrapper, here we draw relative to 0,0
    // But wrapper does uniform scale. Boss needs specific detail scale.
    // Boss drawing area is roughly -20 to +20.

    const phase = boss.bossPhase || 1;
    const isP2 = phase === 2;
    const isCharging = boss.bossState === BossState.CHARGING || boss.bossState === BossState.CASTING;
    const isAttacking = boss.bossState === BossState.ATTACKING;
    const shake = isCharging ? (Math.random() - 0.5) * 2 : 0;

    ctx.translate(shake, shake);

    // -- COLORS --
    const cArmor = '#1e293b'; // Dark Slate
    const cArmorLight = '#334155';
    const cGold = '#fbbf24'; // Amber 400
    const cBone = '#e2e8f0'; // Slate 200
    const cFlameOut = '#3b82f6'; 
    const cVoid = '#4c1d95'; // Violet 900 (Aura)

    // -- AURA (Phase 2) --
    if (isP2) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(time * 0.1) * 0.2;
        ctx.fillStyle = cVoid;
        ctx.beginPath();
        ctx.arc(0, -15, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Particles rising
        if (time % 5 === 0) {
             // Logic handled in update usually, but visual flare here is ok for pure rendering
        }
    }

    // -- LEGS / HAKAMA --
    ctx.fillStyle = '#0f172a'; // Black/Blue
    // Wide stance
    ctx.beginPath();
    ctx.moveTo(-12, 0); 
    ctx.lineTo(-16, 8); // Left foot
    ctx.lineTo(-6, 0); // Crotch
    ctx.lineTo(16, 8); // Right foot
    ctx.lineTo(12, 0);
    ctx.fill();
    
    // Armored Skirt (Kusazuri)
    ctx.fillStyle = cArmor;
    ctx.fillRect(-14, -8, 28, 8);
    ctx.fillStyle = cGold; // Trim
    ctx.fillRect(-14, -8, 28, 2);
    ctx.fillRect(-14, -1, 28, 1);
    
    // -- TORSO --
    // Breastplate
    ctx.fillStyle = cArmor;
    ctx.fillRect(-12, -24, 24, 16);
    // Ribs detail (Skeletal motif)
    ctx.fillStyle = cArmorLight;
    ctx.fillRect(-8, -20, 16, 2);
    ctx.fillRect(-9, -16, 18, 2);
    ctx.fillRect(-7, -12, 14, 2);

    // Shoulders (Sode) - Big and menacing
    ctx.fillStyle = cArmor;
    ctx.beginPath(); ctx.moveTo(-12, -24); ctx.lineTo(-24, -20); ctx.lineTo(-22, -10); ctx.lineTo(-12, -14); ctx.fill(); // Left
    ctx.beginPath(); ctx.moveTo(12, -24); ctx.lineTo(24, -20); ctx.lineTo(22, -10); ctx.lineTo(12, -14); ctx.fill(); // Right
    // Gold trim on shoulders
    ctx.fillStyle = cGold;
    ctx.fillRect(-24, -20, 2, 10);
    ctx.fillRect(22, -20, 2, 10);

    // -- HEAD --
    ctx.translate(0, -26);
    
    if (isP2) {
        // FLAMING SKULL
        // Blue Flame Hair
        ctx.fillStyle = cFlameOut;
        for(let i=0; i<5; i++) {
            const h = 8 + Math.sin(time*0.2 + i)*4;
            ctx.fillRect(-8 + i*4, -8 - h, 3, h);
        }
        
        // Skull
        ctx.fillStyle = cBone;
        ctx.fillRect(-7, -8, 14, 10);
        
        // Eyes (Red Glowing)
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-4, -4, 2, 2);
        ctx.fillRect(2, -4, 2, 2);
        
        // Broken Helmet Fragments
        ctx.fillStyle = cGold;
        ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-12, -10); ctx.lineTo(-8, -8); ctx.fill();

    } else {
        // FULL HELMET (Kabuto)
        ctx.fillStyle = cArmor; // Helmet Bowl
        ctx.beginPath(); ctx.arc(0, -6, 9, Math.PI, 0); ctx.fill();
        ctx.fillRect(-9, -6, 18, 8);
        
        // Face Mask (Menpo)
        ctx.fillStyle = '#0f172a'; // Dark face
        ctx.fillRect(-6, -2, 12, 6);
        ctx.fillStyle = cGold; // Teeth/Detail
        ctx.fillRect(-4, 0, 2, 3);
        ctx.fillRect(2, 0, 2, 3);

        // Horns (Kuwagata)
        ctx.fillStyle = cGold;
        ctx.beginPath(); ctx.moveTo(-4, -10); ctx.lineTo(-14, -20); ctx.lineTo(-10, -10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(4, -10); ctx.lineTo(14, -20); ctx.lineTo(10, -10); ctx.fill();
    }

    ctx.translate(0, 26); // Restore

    // -- WEAPON (Giant Katana) --
    ctx.save();
    ctx.translate(16, -10); // Hand position
    
    let angle = 0;
    if (boss.bossState === BossState.CHARGING) angle = -Math.PI / 2; // Held high
    else if (isAttacking) angle = Math.PI * 0.7; // Swing down
    else angle = Math.PI * 0.2; // Idle low

    ctx.rotate(angle);

    // Handle
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, -2, 12, 4);
    
    // Guard (Tsuba)
    ctx.fillStyle = cGold;
    ctx.fillRect(12, -6, 4, 12);
    
    // Blade
    ctx.fillStyle = isP2 ? '#93c5fd' : '#cbd5e1'; // Blueish steel in P2
    ctx.fillRect(16, -2, 40, 4);
    
    // Edge
    if (isP2) {
        ctx.shadowColor = cFlameOut;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#fff';
    } else {
        ctx.fillStyle = '#f1f5f9';
    }
    ctx.fillRect(16, 0, 38, 2);
    ctx.shadowBlur = 0;

    ctx.restore();
};

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
      const bossScale = e.scale || 3;
      ctx.scale(bossScale, bossScale);
      
      // Hit flash for boss
      if (e.hitFlashTimer > 0) {
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = 'white';
      }
      
      drawKurogami(ctx, e, time);
      
      ctx.restore();
      return; // Skip default drawing
    } else if (e) {
      const scale = e.scale || 1;
      ctx.scale(scale, scale);
    } else if (echo) {
      const scale = echo.scale || 1;
      ctx.scale(scale, scale);
    }

    // --- STANDARD ENTITY DRAWING ---
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
        // --- IMPROVED PLAYER BODY ---
        const cArmor = hitFlash ? '#ffffff' : '#cbd5e1';
        const cArmorDark = hitFlash ? '#ffffff' : '#94a3b8';
        const cCape = hitFlash ? '#ffffff' : '#7f1d1d';
        const cScarf = hitFlash ? '#ffffff' : '#dc2626';
        const cBelt = hitFlash ? '#ffffff' : '#1e293b';
        const cGold = hitFlash ? '#ffffff' : '#f59e0b';

        // Cape/Back
        ctx.fillStyle = cCape; 
        ctx.fillRect(-7, -12, 14, 11);

        // Armor Body
        ctx.fillStyle = cArmor; 
        ctx.fillRect(-6, -14, 12, 14);
        
        // Armor Shading (Right side)
        ctx.fillStyle = cArmorDark;
        ctx.fillRect(3, -14, 3, 14);

        // Tabard (Center Red)
        ctx.fillStyle = cScarf;
        ctx.fillRect(-2, -14, 4, 14);

        // Belt
        ctx.fillStyle = cBelt; 
        ctx.fillRect(-6.5, -4, 13, 3);
        
        // Buckle
        ctx.fillStyle = cGold; 
        ctx.fillRect(-2, -4, 4, 3);
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
        // --- IMPROVED PLAYER HEAD ---
        const cHelmet = hitFlash ? '#ffffff' : '#f1f5f9';
        const cHelmetDark = hitFlash ? '#ffffff' : '#cbd5e1';
        const cVisor = hitFlash ? '#ffffff' : '#0f172a';
        const cScarf = hitFlash ? '#ffffff' : '#ef4444';
        const cEye = hitFlash ? '#ffffff' : '#0ea5e9';
        const cCrest = hitFlash ? '#ffffff' : '#94a3b8';

        // Scarf/Collar (Behind Head)
        ctx.fillStyle = cScarf; 
        ctx.fillRect(-5, -2, 10, 4);

        // Helmet Main
        ctx.fillStyle = cHelmet;
        ctx.fillRect(-5, -11, 10, 11);
        
        // Helmet Shading
        ctx.fillStyle = cHelmetDark;
        ctx.fillRect(3, -11, 2, 11);

        // Visor Area
        ctx.fillStyle = cVisor;
        ctx.fillRect(-4, -8, 8, 4);
        
        // Vertical slit for visor
        ctx.fillRect(-1, -10, 2, 8);

        if (!hitFlash) {
            // Eye glow inside visor
            ctx.fillStyle = cEye; 
            ctx.globalAlpha = 0.8;
            ctx.fillRect(-2.5, -7, 2, 1);
            ctx.fillRect(1.5, -7, 2, 1);
            ctx.globalAlpha = 1.0;
        }

        // Helmet Top/Crest
        ctx.fillStyle = cCrest;
        ctx.fillRect(-1, -12, 2, 2);

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
                 ctx.rotate(p.aimAngle);
                 ctx.translate(18, 0); 
            } else if (p.isSpinning) {
                 // Special Spin Case (Executioner Swirl)
                 ctx.rotate(time * 0.5);
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

// --- CUSTOM ITEM DRAWERS ---

const drawBloodVial = (ctx: CanvasRenderingContext2D, time: number) => {
    // Bob animation
    const yOff = Math.sin(time * 0.1) * 3;
    ctx.translate(0, yOff);

    // Glow
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();

    // Bottle
    ctx.fillStyle = '#cbd5e1'; // Glass
    ctx.beginPath(); ctx.arc(0, 4, 6, 0, Math.PI*2); ctx.fill();
    
    // Liquid
    ctx.fillStyle = '#ef4444'; // Red
    ctx.beginPath(); ctx.arc(0, 6, 5, 0, Math.PI*2); ctx.fill();
    
    // Neck
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-2, -6, 4, 5);
    
    // Cork
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2.5, -7, 5, 2);

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(-2, 2, 1.5, 3, Math.PI/4, 0, Math.PI*2); ctx.fill();
}

const drawBuffIcon = (ctx: CanvasRenderingContext2D, type: 'DAMAGE' | 'SPEED', time: number) => {
    const yOff = Math.sin(time * 0.1) * 3;
    ctx.translate(0, yOff);
    
    const color = type === 'DAMAGE' ? '#ef4444' : '#3b82f6';
    
    // Glow
    ctx.fillStyle = type === 'DAMAGE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();

    // Stone Background
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(9, -5); ctx.lineTo(9, 5); ctx.lineTo(0, 10); ctx.lineTo(-9, 5); ctx.lineTo(-9, -5);
    ctx.fill();

    // Icon
    ctx.fillStyle = color;
    if (type === 'DAMAGE') {
        // Sword / Jagged shape
        ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-4, -2); ctx.lineTo(0, -8); ctx.lineTo(4, -2); ctx.fill();
        ctx.fillRect(-3, -2, 6, 2); // Crossguard
    } else {
        // Wing shape
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(2, -6); ctx.lineTo(6, -2); ctx.lineTo(4, 4); ctx.lineTo(-2, 2); ctx.fill();
    }
}

const drawWeaponDrop = (ctx: CanvasRenderingContext2D, weaponType: WeaponType, time: number) => {
    const yOff = Math.sin(time * 0.1) * 3;
    ctx.translate(0, yOff);

    // Pedestal Glow
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath(); ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI*2); ctx.fill();

    // Mini weapon representation
    const weapon = C.WEAPONS[weaponType];
    ctx.fillStyle = weapon.color;
    ctx.rotate(Math.PI / 4); // Angled presentation
    
    if (weaponType === WeaponType.SHADOW_BOW) {
        ctx.strokeStyle = weapon.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 8, -0.5, 3.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.stroke();
    } else {
        // Generic sword-like shape for others, varying color is enough cue
        ctx.fillRect(-2, -8, 4, 16); // Blade
        ctx.fillStyle = '#fff'; ctx.fillRect(-3, 2, 6, 2); // Guard
        ctx.fillStyle = '#451a03'; ctx.fillRect(-1, 4, 2, 4); // Hilt
    }
}

const drawPortal = (ctx: CanvasRenderingContext2D, time: number) => {
    const scale = 1 + Math.sin(time * 0.1) * 0.05;
    ctx.scale(scale, scale);

    // Outer Swirl
    ctx.strokeStyle = '#7c3aed'; // Violet
    ctx.lineWidth = 2;
    for(let i=0; i<4; i++) {
        const angle = (time * 0.05) + (i * Math.PI/2);
        ctx.beginPath();
        ctx.arc(0, 0, 12 + Math.sin(time*0.2 + i)*2, angle, angle + Math.PI);
        ctx.stroke();
    }

    // Inner Void
    ctx.fillStyle = '#2e1065';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
    
    // Center Core
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5 + Math.sin(time * 0.3) * 0.5;
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;
}

// ---------------------------

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
                // Checkboard subtle variant
                const isAlt = (x + y) % 2 === 0;
                ctx.fillStyle = isAlt ? '#0f172a' : '#1e293b'; 
                ctx.fillRect(tx, ty, tileSize, tileSize);
                
                // Add Grid Lines
                ctx.strokeStyle = '#1e293b'; 
                ctx.lineWidth = 1;
                ctx.strokeRect(tx, ty, tileSize, tileSize);
                
                // Random Floor Detail (deterministic by position)
                if ((x * 17 + y * 23) % 7 === 0) {
                     ctx.fillStyle = 'rgba(255,255,255,0.03)';
                     ctx.fillRect(tx + 10, ty + 10, tileSize - 20, tileSize - 20);
                }

            } else if (tile === TileType.WALL) {
                // 2.5D Wall Rendering
                // Draw Base (Shadow)
                ctx.fillStyle = '#020617'; 
                ctx.fillRect(tx, ty, tileSize, tileSize);

                // Draw Wall Block (Top Face)
                ctx.fillStyle = '#1e293b'; // Side/Top
                const wallHeight = 12;
                ctx.fillRect(tx, ty - wallHeight, tileSize, tileSize);
                
                // Top Highlight (Bevel)
                ctx.fillStyle = '#334155'; 
                ctx.fillRect(tx, ty - wallHeight, tileSize, 4);

                // Front Face (Simulated by drawing the block slightly higher and darkening the bottom of the visible rect? 
                // Actually the rect `ty-wallHeight` covers the tile. The "Front" is the gap we see if we looked from side, 
                // but in top down the "Front" is the south face.)
                
                // Let's add a "Front Face" specifically for the bottom of the wall block
                ctx.fillStyle = '#0f172a';
                ctx.fillRect(tx, ty + tileSize - wallHeight, tileSize, wallHeight);

            } else if (tile === TileType.DOOR_CLOSED) {
                ctx.fillStyle = '#450a0a';
                ctx.fillRect(tx, ty, tileSize, tileSize);
                
                // Bars
                ctx.fillStyle = '#7f1d1d';
                ctx.fillRect(tx + 10, ty, 8, tileSize);
                ctx.fillRect(tx + 26, ty, 8, tileSize);
                ctx.fillRect(tx + 42, ty, 8, tileSize);
                
                ctx.strokeStyle = '#000';
                ctx.strokeRect(tx, ty, tileSize, tileSize);
            } else if (tile === TileType.DOOR_OPEN) {
                ctx.fillStyle = '#1e293b'; // Dark Floor
                ctx.fillRect(tx, ty, tileSize, tileSize);
                // Threshold
                ctx.fillStyle = '#334155';
                ctx.fillRect(tx, ty + tileSize - 4, tileSize, 4);
            }
        }
    }

    // 3. Render Particles (Behind Entities)
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.lifeTime / p.maxLifeTime;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.globalAlpha = 1.0;
    });

    // 4. Render Items (Updated Visuals)
    state.items.forEach(item => {
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        
        ctx.save();
        ctx.translate(cx, cy);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(0, 16, 10, 4, 0, 0, Math.PI * 2); ctx.fill();

        if (item.itemType === ItemType.PORTAL) {
             drawPortal(ctx, state.time);
        } else if (item.itemType === ItemType.BLOOD_VIAL) {
             drawBloodVial(ctx, state.time);
        } else if (item.itemType === ItemType.BUFF_DAMAGE) {
             drawBuffIcon(ctx, 'DAMAGE', state.time);
        } else if (item.itemType === ItemType.BUFF_SPEED) {
             drawBuffIcon(ctx, 'SPEED', state.time);
        } else if (item.itemType === ItemType.WEAPON_DROP) {
             drawWeaponDrop(ctx, item.payload as WeaponType, state.time);
        } else {
             // Fallback
             ctx.fillStyle = item.color;
             ctx.rotate(state.time * 0.05);
             ctx.fillRect(-8, -8, 16, 16);
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
        // Translate to Center of Projectile
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        ctx.translate(cx, cy);

        ctx.fillStyle = p.color;
        
        if (p.renderStyle === 'WAVE') {
             const angle = Math.atan2(p.vy, p.vx);
             ctx.rotate(angle);
             
             const s = p.width / 20; // Approx 1.5

             // Pixel-art style Crescent Slash
             // Main Red Body
             ctx.fillStyle = '#dc2626'; 
             ctx.beginPath();
             ctx.moveTo(-6 * s, -14 * s);
             ctx.quadraticCurveTo(18 * s, 0, -6 * s, 14 * s); // Forward Curve
             ctx.quadraticCurveTo(4 * s, 0, -6 * s, -14 * s); // Inner Scoop
             ctx.fill();

             // Core Brightness
             ctx.fillStyle = '#fca5a5';
             ctx.beginPath();
             ctx.moveTo(-2 * s, -10 * s);
             ctx.quadraticCurveTo(14 * s, 0, -2 * s, 10 * s);
             ctx.quadraticCurveTo(4 * s, 0, -2 * s, -10 * s);
             ctx.fill();
             
             // Speed Lines (Rects for pixel feel)
             ctx.fillStyle = '#ef4444';
             ctx.fillRect(-14 * s, -12 * s, 8 * s, 2 * s);
             ctx.fillRect(-18 * s, -4 * s, 12 * s, 2 * s);
             ctx.fillRect(-18 * s, 2 * s, 12 * s, 2 * s);
             ctx.fillRect(-14 * s, 10 * s, 8 * s, 2 * s);

        } else if (p.renderStyle === 'SHADOW_ARROW') {
             const angle = Math.atan2(p.vy, p.vx);
             ctx.rotate(angle);
             ctx.fillStyle = '#d8b4fe';
             ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.fill();
        } else if (p.renderStyle === 'SPECTRAL_BLADE') {
             // BOSS PROJECTILE
             const angle = Math.atan2(p.vy, p.vx);
             ctx.rotate(angle);
             ctx.fillStyle = '#60a5fa'; // Blue
             // Katana Shape
             ctx.beginPath();
             ctx.moveTo(10, 0);
             ctx.lineTo(-10, -3);
             ctx.lineTo(-10, 3);
             ctx.fill();
             // Hilt
             ctx.fillStyle = '#1e3a8a';
             ctx.fillRect(-14, -1, 4, 2);
             // Trail
             ctx.fillStyle = '#3b82f6';
             ctx.globalAlpha = 0.5;
             ctx.fillRect(-20, -2, 10, 4);
             ctx.globalAlpha = 1.0;

        } else if (p.renderStyle === 'TOMBSTONE_ZONE') {
             // Ground Effect
             ctx.globalAlpha = 0.3;
             ctx.fillStyle = '#4c1d95';
             ctx.beginPath(); ctx.arc(0, 0, p.width/2, 0, Math.PI*2); ctx.fill();
             
             // Cracks
             ctx.globalAlpha = 1.0;
             ctx.strokeStyle = '#7c3aed';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
             ctx.moveTo(0, -20); ctx.lineTo(0, 20);
             ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
             ctx.stroke();

        } else {
             // Default Circle - Aligned to center now
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

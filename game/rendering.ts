
import { GameState, WeaponType, EnemyType, ItemType, TileType, Player, Enemy, Echo, EntityType, BossState } from '../types';
import * as C from '../constants';

const drawKurogami = (ctx: CanvasRenderingContext2D, boss: Enemy, time: number) => {
    const phase = boss.bossPhase || 1;
    const isP2 = phase === 2;
    const state = boss.bossState || BossState.IDLE;
    const timer = boss.bossTimer || 0;

    // --- COLOR PALETTE (Regal & Dead) ---
    // Updated colors to be visible against Slate 800/900 background
    const cArmorDark = '#334155'; // Slate 700 (Lighter than floor)
    const cArmorMid = '#475569';  // Slate 600
    const cBone = '#e2e8f0';      
    const cBoneShadow = '#94a3b8'; 
    const cGold = '#d97706';      
    const cCloth = isP2 ? '#5b21b6' : '#991b1b'; // Brighter Violet / Red
    const cGlow = isP2 ? '#a855f7' : '#ef4444';  // Neon Purple or Red
    const cBlade = isP2 ? '#818cf8' : '#cbd5e1'; // Spectral or Steel

    // --- ANIMATION CALCULATIONS ---
    const breath = Math.sin(time * 0.05);
    const heavyBreath = Math.sin(time * 0.05 + Math.PI); // Offset
    const float = isP2 ? Math.sin(time * 0.1) * 2 : 0;
    
    // Shake / Rage effect
    const isCharging = state === BossState.CHARGING || state === BossState.CASTING;
    const shakeAmt = isCharging ? (Math.random() - 0.5) * 2 : 0;
    
    // Fixed vertical offset to align feet to ground
    // Feet draw at approx +22 relative to origin. We need to shift up.
    ctx.translate(shakeAmt, shakeAmt + float - 22);

    // --- AURA (Phase 2 Only) ---
    if (isP2) {
        ctx.save();
        ctx.globalAlpha = 0.15 + Math.sin(time * 0.1) * 0.05;
        ctx.fillStyle = cGlow;
        // Spiky aura
        for(let i=0; i<8; i++) {
            const angle = (time * 0.05) + (i * Math.PI / 4);
            const dist = 40 + Math.sin(time * 0.2 + i)*5;
            ctx.beginPath();
            ctx.moveTo(0, -20);
            ctx.lineTo(Math.cos(angle)*dist, -20 + Math.sin(angle)*dist);
            ctx.lineTo(Math.cos(angle + 0.5)*dist*0.5, -20 + Math.sin(angle + 0.5)*dist*0.5);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- LEGS & LOWER BODY ---
    // Wide Stance
    const stanceW = 16;
    const legLength = 18;
    
    ctx.save();
    // Simulate leg movement if moving
    const isMoving = Math.abs(boss.vx) > 0.1 || Math.abs(boss.vy) > 0.1;
    const walkCycle = isMoving ? Math.sin(time * 0.15) : 0;

    // HAKAMA (Pants) - Dark, flowing
    ctx.fillStyle = '#0f172a'; // Pants remain dark Slate 900
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-stanceW - 4, legLength); // Left leg flare
    ctx.lineTo(0, legLength - 4); // Crotch
    ctx.lineTo(stanceW + 4, legLength); // Right leg flare
    ctx.lineTo(0, -5);
    ctx.fill();

    // LEG ARMOR (Suneate)
    const drawLeg = (xOffset: number, yOffset: number) => {
        ctx.save();
        ctx.translate(xOffset, yOffset);
        // Shin Guard
        ctx.fillStyle = cArmorMid; 
        ctx.fillRect(-5, 0, 10, 14);
        // Gold Detail
        ctx.fillStyle = cGold;
        ctx.fillRect(-2, 2, 4, 10);
        // Foot
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.moveTo(-5, 14); ctx.lineTo(6, 14); ctx.lineTo(8, 18); ctx.lineTo(-6, 18); ctx.fill();
        ctx.restore();
    };

    drawLeg(-stanceW, 8 + walkCycle * 3);
    drawLeg(stanceW, 8 - walkCycle * 3);
    
    // SKIRT (Kusazuri) - Layered Plates
    ctx.translate(0, -2);
    const plates = [-18, -6, 6];
    plates.forEach((x, i) => {
        const sway = Math.sin(time * 0.1 + i) * 1;
        ctx.save();
        ctx.translate(x + sway, 0);
        // Main Plate
        ctx.fillStyle = cArmorDark;
        ctx.fillRect(0, 0, 12, 16);
        // Lacing
        ctx.fillStyle = cCloth;
        for(let j=1; j<4; j++) ctx.fillRect(1, j*4, 10, 1);
        // Gold Tip
        ctx.fillStyle = cGold;
        ctx.fillRect(0, 14, 12, 2);
        ctx.restore();
    });

    ctx.restore();

    // --- TORSO GROUP ---
    const torsoY = -22 + breath * 1.5;
    ctx.translate(0, torsoY);

    // Cape BEFORE Torso (Behind) - Drawn first so it is behind
    ctx.save();
    ctx.translate(0, -14);
    ctx.fillStyle = cCloth;
    const capeSway = Math.sin(time * 0.1) * 5;
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-25 + capeSway, 35); // Left point
    ctx.lineTo(0, 25);
    ctx.lineTo(25 + capeSway, 35); // Right point
    ctx.lineTo(10, 0);
    ctx.fill();
    ctx.restore();

    // Do (Breastplate) - Ribcage Design
    ctx.fillStyle = cArmorDark;
    ctx.beginPath();
    ctx.moveTo(-14, 10); ctx.lineTo(14, 10); // Waist
    ctx.lineTo(18, -14); ctx.lineTo(-18, -14); // Shoulder line
    ctx.fill();

    // Bone Ribs Overlay
    ctx.fillStyle = cBone;
    ctx.globalAlpha = 0.8;
    for(let i=0; i<3; i++) {
        const w = 12 - i*2;
        ctx.fillRect(-w, -10 + i*5, w*2, 2);
    }
    ctx.fillRect(-2, -12, 4, 16); // Spine
    ctx.globalAlpha = 1.0;

    // --- SHOULDERS (O-Sode) ---
    const drawShoulder = (isLeft: boolean) => {
        ctx.save();
        const dir = isLeft ? -1 : 1;
        ctx.translate(dir * 20, -16 + heavyBreath * 2);
        ctx.rotate(dir * Math.PI * 0.05); 
        
        // Main Shield
        ctx.fillStyle = cArmorMid;
        ctx.fillRect(-8, 0, 16, 24);
        
        // Gold Crest
        ctx.fillStyle = cGold;
        ctx.beginPath(); ctx.arc(0, 6, 4, 0, Math.PI*2); ctx.fill();
        
        // Layering
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-8, 8, 16, 2);
        ctx.fillRect(-8, 16, 16, 2);
        
        ctx.restore();
    };
    drawShoulder(true);
    drawShoulder(false);

    // --- HEAD ---
    ctx.save();
    ctx.translate(0, -18);

    // Neck Guard (Shikoro)
    ctx.fillStyle = cArmorDark; 
    ctx.beginPath(); ctx.arc(0, 2, 12, Math.PI, 0); ctx.fill();

    // Skull Face
    ctx.fillStyle = cBone;
    ctx.beginPath(); 
    ctx.ellipse(0, 0, 7, 9, 0, 0, Math.PI*2); 
    ctx.fill();
    
    // Shadowing for depth
    ctx.fillStyle = cBoneShadow;
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = cBone;
    ctx.beginPath(); ctx.arc(-2, -2, 6, 0, Math.PI*2); ctx.fill();

    // Eyes
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(-3, 0, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, 0, 2.5, 0, Math.PI*2); ctx.fill();
    
    // Glowing Pupils
    ctx.fillStyle = cGlow;
    ctx.shadowColor = cGlow;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(-3, 0, 1, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(3, 0, 1, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;

    // Helmet (Kabuto)
    ctx.translate(0, -6);
    ctx.fillStyle = cArmorDark;
    ctx.beginPath(); ctx.arc(0, 0, 10, Math.PI, 0); ctx.fill(); // Dome
    ctx.fillRect(-10, 0, 20, 4); // Rim
    
    // Kuwagata (Antler Crest) - Huge Gold V
    ctx.fillStyle = cGold;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.quadraticCurveTo(-15, -10, -20, -35); // Left point
    ctx.lineTo(-12, -10);
    ctx.lineTo(0, -2);
    ctx.lineTo(12, -10);
    ctx.lineTo(20, -35); // Right point
    ctx.quadraticCurveTo(15, -10, 0, -2);
    ctx.fill();

    // High Crest Center
    ctx.fillStyle = cGlow;
    ctx.beginPath(); ctx.arc(0, -8, 2, 0, Math.PI*2); ctx.fill();

    ctx.restore(); // End Head

    // --- ARMS & WEAPON ---
    let rightArmAngle = Math.PI / 3; // Idle: 60 deg down
    let leftArmAngle = Math.PI / 4;  // Idle: 45 deg down

    if (state === BossState.IDLE) {
        rightArmAngle += Math.sin(time * 0.05) * 0.1;
    } else if (state === BossState.CHARGING) {
        const progress = 1 - (timer / 45); 
        const t = progress * progress * (3 - 2 * progress); 
        rightArmAngle = (Math.PI/3) * (1 - t) + (-Math.PI * 0.7) * t; 
    } else if (state === BossState.ATTACKING) {
        const progress = 1 - (timer / 20);
        const t = 1 - Math.pow(1 - progress, 3);
        rightArmAngle = (-Math.PI * 0.7) * (1 - t) + (Math.PI * 0.8) * t; 
    } else if (state === BossState.CASTING) {
        leftArmAngle = -Math.PI * 0.5; // Raised hand
    }

    // RIGHT ARM (Weapon)
    ctx.save();
    ctx.translate(20, -14); 
    ctx.rotate(rightArmAngle);
    
    // Upper Arm
    ctx.fillStyle = cArmorMid; 
    ctx.fillRect(-4, 0, 8, 14);
    // Forearm (Kote)
    ctx.fillStyle = cArmorDark;
    ctx.fillRect(-5, 12, 10, 12);
    // Gold Trim
    ctx.fillStyle = cGold;
    ctx.fillRect(-5, 12, 10, 2);

    // WEAPON (Great Odachi)
    ctx.translate(0, 22); 
    ctx.rotate(Math.PI / 2); 

    // Hilt
    ctx.fillStyle = '#18181b';
    ctx.fillRect(-3, -8, 6, 32);
    // Tsuba
    ctx.fillStyle = cGold;
    ctx.fillRect(-8, -8, 16, 4);
    // Blade
    const bladeL = 90;
    ctx.fillStyle = cBlade;
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(-6, -bladeL); // Tip flare
    ctx.lineTo(0, -bladeL - 6); // Point
    ctx.lineTo(2, -8);
    ctx.fill();
    // Edge Highlight
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.moveTo(-6, -bladeL); ctx.lineTo(0, -bladeL - 6); ctx.lineTo(-4, -10); ctx.fill();

    // Energy Trail / Aura on blade
    if (isP2 || state === BossState.ATTACKING) {
        ctx.fillStyle = cGlow;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(-4, -10); ctx.lineTo(-10, -bladeL); ctx.lineTo(4, -bladeL); ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    ctx.restore(); // End Right Arm

    // LEFT ARM (Balance/Magic)
    ctx.save();
    ctx.translate(-20, -14);
    ctx.rotate(leftArmAngle);
    
    // Upper
    ctx.fillStyle = cArmorMid;
    ctx.fillRect(-4, 0, 8, 14);
    // Forearm
    ctx.fillStyle = cArmorDark;
    ctx.fillRect(-5, 12, 10, 12);
    
    // Hand / Magic
    if (state === BossState.CASTING) {
        ctx.translate(0, 24);
        ctx.fillStyle = cGlow;
        const pulse = 1 + Math.sin(time * 0.5) * 0.5;
        ctx.beginPath(); ctx.arc(0, 0, 6 * pulse, 0, Math.PI*2); ctx.fill();
        
        // Orbiting particles
        for(let i=0; i<3; i++) {
            ctx.rotate(time * 0.2);
            ctx.fillStyle = '#fff';
            ctx.fillRect(10, 0, 2, 2);
        }
    }
    
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
    const isSprinting = isMoving && (Math.abs(entity.vx) > 4 || Math.abs(entity.vy) > 4);
    const bob = isMoving ? (isSprinting ? Math.sin(time * 0.8) * 3 : Math.sin(time * 0.5) * 2) : Math.sin(time * 0.1) * 1;
    
    ctx.save();
    ctx.translate(entity.x + entity.width/2, entity.y + entity.height);

    // Scaling
    if (e && e.enemyType === EnemyType.BOSS) {
      const bossScale = e.scale || 3;
      ctx.scale(bossScale, bossScale);
      
      if (e.hitFlashTimer > 0) {
          ctx.globalCompositeOperation = 'source-atop';
          ctx.fillStyle = 'white';
      }
      
      drawKurogami(ctx, e, time);
      
      ctx.restore();
      return; 
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
    
    if ((e && e.enemyType === EnemyType.STANDARD) || (echo && echo.tier === 1)) {
        ctx.fillRect(-6, -10, 14, 14);
    } else if ((e && e.enemyType === EnemyType.ELITE) || (echo && echo.tier === 2)) {
        ctx.fillRect(-10, -18, 20, 22);
        ctx.fillStyle = '#facc15'; ctx.fillRect(-8, -16, 16, 8); 
    } else if ((e && e.enemyType === EnemyType.MYSTIC) || (echo && echo.tier === 3)) {
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.lineTo(0, -20); ctx.fill();
    } else if (p) {
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
        if (echo.tier === 3) {
             ctx.beginPath(); ctx.arc(0, -5, 6, 0, Math.PI*2); ctx.fill();
        } else {
             ctx.beginPath(); ctx.arc(0, -5, 5, 0, Math.PI*2); ctx.fill();
        }
    }

    if (p && !p.isDead && !p.isSlashDashing) {
            const weapon = C.WEAPONS[p.currentWeapon];
            ctx.save();
            
            const orbitRadius = 12; 
            const shoulderOffset = 2; 
            
            ctx.translate(0, shoulderOffset); 
            
            if (p.currentWeapon === WeaponType.SHADOW_BOW) {
                 ctx.rotate(p.aimAngle);
                 ctx.translate(18, 0); 
            } else if (p.isSpinning) {
                 ctx.rotate(time * 0.5);
            } else {
                 ctx.rotate(p.aimAngle);
                 ctx.translate(orbitRadius, 0);
            }

            if (!p.isSpinning && Math.abs(p.aimAngle) > Math.PI / 2) {
                ctx.scale(1, -1);
            }

            if (p.currentWeapon === WeaponType.SHADOW_BOW) {
                const s = 2; 
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
                let swingOffset = 0; 
                if (p.isAttacking && !p.isSpinning) {
                    const progress = 1 - (p.attackCooldown / (p.maxAttackCooldown || weapon.cooldown));
                    swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);
                } else if (!p.isSpinning) {
                    swingOffset = Math.sin(time * 0.1) * 0.1;
                }
                
                if (!p.isSpinning) ctx.rotate(swingOffset);

                const s = 2.0;
                
                // Handle
                ctx.fillStyle = '#451a03'; ctx.fillRect(0, -1*s, 32*s, 2*s); 
                
                // Grip Wraps
                ctx.fillStyle = '#78350f';
                ctx.fillRect(4*s, -1.2*s, 2*s, 2.4*s);
                ctx.fillRect(12*s, -1.2*s, 2*s, 2.4*s);
                
                const headX = 22*s; 

                // Axe Head Connector
                ctx.fillStyle = '#1e293b'; 
                ctx.fillRect(headX - 2*s, -3*s, 4*s, 6*s);
                
                // Blades
                ctx.fillStyle = '#334155'; 
                
                ctx.beginPath();
                ctx.moveTo(headX - 2*s, -3*s);
                ctx.lineTo(headX - 6*s, -8*s); 
                ctx.lineTo(headX + 6*s, -10*s); 
                ctx.lineTo(headX + 2*s, -3*s); 
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(headX - 2*s, 3*s);
                ctx.lineTo(headX - 6*s, 8*s); 
                ctx.lineTo(headX + 6*s, 10*s); 
                ctx.lineTo(headX + 2*s, 3*s); 
                ctx.fill();

                ctx.fillStyle = '#94a3b8'; 
                ctx.beginPath(); ctx.moveTo(headX - 6*s, -8*s); ctx.lineTo(headX + 6*s, -10*s); ctx.lineTo(headX + 4*s, -6*s); ctx.fill();
                ctx.beginPath(); ctx.moveTo(headX - 6*s, 8*s); ctx.lineTo(headX + 6*s, 10*s); ctx.lineTo(headX + 4*s, 6*s); ctx.fill();

                ctx.fillStyle = '#7f1d1d'; 
                ctx.fillRect(headX + 2*s, -8*s, 2*s, 2*s);
                ctx.fillRect(headX + 4*s, 8*s, 1*s, 2*s);
                ctx.fillRect(headX, -4*s, 3*s, 1*s);

            } else {
                let swingOffset = 0; 
                
                if (p.isAttacking) {
                     const progress = 1 - (p.attackCooldown / (p.maxAttackCooldown || weapon.cooldown));
                     swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);
                } else {
                     swingOffset = Math.sin(time * 0.1) * 0.1;
                }
    
                ctx.rotate(swingOffset);
                
                if (p.currentWeapon === WeaponType.BLOOD_BLADE) {
                    const s = 2.5;
                    ctx.fillStyle = '#3f2e22'; ctx.fillRect(0, -1 * s, 5 * s, 2 * s); 
                    ctx.fillStyle = '#565963'; ctx.fillRect(-1 * s, -1.5 * s, 2 * s, 3 * s); 
                    ctx.fillStyle = '#8f939d'; ctx.fillRect(5 * s, -4 * s, 2 * s, 8 * s); 
                    ctx.fillStyle = '#c7cfdd'; ctx.fillRect(7 * s, -2 * s, 14 * s, 4 * s); 
                    ctx.fillStyle = '#8f939d'; ctx.fillRect(7 * s, -2 * s, 14 * s, 1 * s); ctx.fillRect(7 * s, 1 * s, 14 * s, 1 * s);
                    ctx.fillStyle = '#565963'; ctx.fillRect(7 * s, -0.5 * s, 13 * s, 1 * s);
                    ctx.fillStyle = '#c7cfdd'; ctx.beginPath(); ctx.moveTo(21 * s, -2 * s); ctx.lineTo(24 * s, 0); ctx.lineTo(21 * s, 2 * s); ctx.fill();
                } else if (p.currentWeapon === WeaponType.CURSED_BLADE) {
                    const s = 2.0;
                    ctx.fillStyle = '#2e1065'; ctx.fillRect(0, -1.5*s, 6*s, 3*s);
                    ctx.fillStyle = '#4c1d95'; ctx.fillRect(1*s, -0.5*s, 1*s, 1*s); ctx.fillRect(3*s, -0.5*s, 1*s, 1*s);
                    ctx.fillStyle = '#b45309'; ctx.fillRect(6*s, -2.5*s, 2*s, 5*s); 
                    ctx.fillStyle = '#78350f'; ctx.fillRect(6.5*s, -1.5*s, 1*s, 3*s);
                    ctx.fillStyle = '#334155'; ctx.fillRect(8*s, -1.5*s, 24*s, 3*s); 
                    ctx.fillStyle = '#a855f7'; ctx.fillRect(8*s, 0.5*s, 22*s, 1*s); 
                    ctx.beginPath(); ctx.moveTo(32*s, -1.5*s); ctx.lineTo(36*s, 0); ctx.lineTo(30*s, 1.5*s);
                    ctx.fillStyle = '#334155'; ctx.fill();
                    ctx.fillStyle = '#d8b4fe'; ctx.fillRect(16*s, -1*s, 1*s, 1*s); ctx.fillRect(26*s, 0, 1*s, 1*s);
                }
            }
            ctx.restore();
    }
    ctx.restore(); 
};

const drawBloodVial = (ctx: CanvasRenderingContext2D, time: number) => {
    const yOff = Math.sin(time * 0.1) * 3;
    ctx.translate(0, yOff);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#cbd5e1'; 
    ctx.beginPath(); ctx.arc(0, 4, 6, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = '#ef4444'; 
    ctx.beginPath(); ctx.arc(0, 6, 5, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-2, -6, 4, 5);
    
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-2.5, -7, 5, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.ellipse(-2, 2, 1.5, 3, Math.PI/4, 0, Math.PI*2); ctx.fill();
}

const drawBuffIcon = (ctx: CanvasRenderingContext2D, type: 'DAMAGE' | 'SPEED', time: number) => {
    const yOff = Math.sin(time * 0.1) * 3;
    ctx.translate(0, yOff);
    
    const color = type === 'DAMAGE' ? '#ef4444' : '#3b82f6';
    
    ctx.fillStyle = type === 'DAMAGE' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)';
    ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI*2); ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, -10); ctx.lineTo(9, -5); ctx.lineTo(9, 5); ctx.lineTo(0, 10); ctx.lineTo(-9, 5); ctx.lineTo(-9, -5);
    ctx.fill();

    ctx.fillStyle = color;
    if (type === 'DAMAGE') {
        ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-4, -2); ctx.lineTo(0, -8); ctx.lineTo(4, -2); ctx.fill();
        ctx.fillRect(-3, -2, 6, 2); 
    } else {
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(2, -6); ctx.lineTo(6, -2); ctx.lineTo(4, 4); ctx.lineTo(-2, 2); ctx.fill();
    }
}

const drawWeaponDrop = (ctx: CanvasRenderingContext2D, weaponType: WeaponType, time: number) => {
    const yOff = Math.sin(time * 0.1) * 3;
    ctx.translate(0, yOff);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath(); ctx.ellipse(0, 10, 10, 4, 0, 0, Math.PI*2); ctx.fill();

    const weapon = C.WEAPONS[weaponType];
    ctx.fillStyle = weapon.color;
    ctx.rotate(Math.PI / 4); 
    
    if (weaponType === WeaponType.SHADOW_BOW) {
        ctx.strokeStyle = weapon.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 8, -0.5, 3.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(6, 6); ctx.stroke();
    } else {
        ctx.fillRect(-2, -8, 4, 16); 
        ctx.fillStyle = '#fff'; ctx.fillRect(-3, 2, 6, 2); 
        ctx.fillStyle = '#451a03'; ctx.fillRect(-1, 4, 2, 4); 
    }
}

const drawPortal = (ctx: CanvasRenderingContext2D, time: number) => {
    const scale = 1 + Math.sin(time * 0.1) * 0.05;
    ctx.scale(scale, scale);

    ctx.strokeStyle = '#7c3aed'; 
    ctx.lineWidth = 2;
    for(let i=0; i<4; i++) {
        const angle = (time * 0.05) + (i * Math.PI/2);
        ctx.beginPath();
        ctx.arc(0, 0, 12 + Math.sin(time*0.2 + i)*2, angle, angle + Math.PI);
        ctx.stroke();
    }

    ctx.fillStyle = '#2e1065';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.5 + Math.sin(time * 0.3) * 0.5;
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1.0;
}

export const renderScene = (ctx: CanvasRenderingContext2D, state: GameState) => {
    ctx.fillStyle = C.COLORS.background;
    ctx.fillRect(0, 0, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    ctx.save();
    ctx.translate(state.camera.x, state.camera.y);

    // 2. Render Dungeon
    const { dungeon } = state;
    const { grid, tileSize } = dungeon;
    
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
                const isAlt = (x + y) % 2 === 0;
                ctx.fillStyle = isAlt ? '#0f172a' : '#1e293b'; 
                ctx.fillRect(tx, ty, tileSize, tileSize);
                
                ctx.strokeStyle = '#1e293b'; 
                ctx.lineWidth = 1;
                ctx.strokeRect(tx, ty, tileSize, tileSize);
                
                if ((x * 17 + y * 23) % 7 === 0) {
                     ctx.fillStyle = 'rgba(255,255,255,0.03)';
                     ctx.fillRect(tx + 10, ty + 10, tileSize - 20, tileSize - 20);
                }

            } else if (tile === TileType.WALL) {
                ctx.fillStyle = '#020617'; 
                ctx.fillRect(tx, ty, tileSize, tileSize);

                ctx.fillStyle = '#1e293b'; 
                const wallHeight = 12;
                ctx.fillRect(tx, ty - wallHeight, tileSize, tileSize);
                
                ctx.fillStyle = '#334155'; 
                ctx.fillRect(tx, ty - wallHeight, tileSize, 4);

                ctx.fillStyle = '#0f172a';
                ctx.fillRect(tx, ty + tileSize - wallHeight, tileSize, wallHeight);

            } else if (tile === TileType.DOOR_CLOSED) {
                ctx.fillStyle = '#450a0a';
                ctx.fillRect(tx, ty, tileSize, tileSize);
                
                ctx.fillStyle = '#7f1d1d';
                ctx.fillRect(tx + 10, ty, 8, tileSize);
                ctx.fillRect(tx + 26, ty, 8, tileSize);
                ctx.fillRect(tx + 42, ty, 8, tileSize);
                
                ctx.strokeStyle = '#000';
                ctx.strokeRect(tx, ty, tileSize, tileSize);
            } else if (tile === TileType.DOOR_OPEN) {
                ctx.fillStyle = '#1e293b'; 
                ctx.fillRect(tx, ty, tileSize, tileSize);
                ctx.fillStyle = '#334155';
                ctx.fillRect(tx, ty + tileSize - 4, tileSize, 4);
            }
        }
    }

    // 3. Render Particles
    state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.lifeTime / p.maxLifeTime;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.globalAlpha = 1.0;
    });

    // 4. Render Items
    state.items.forEach(item => {
        const cx = item.x + item.width / 2;
        const cy = item.y + item.height / 2;
        
        ctx.save();
        ctx.translate(cx, cy);

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
             ctx.fillStyle = item.color;
             ctx.rotate(state.time * 0.05);
             ctx.fillRect(-8, -8, 16, 16);
        }
        ctx.restore();
    });

    // 4.5 Render Shadows (Enhanced Pass)
    const shadowEntities = [state.player, ...state.enemies];
    shadowEntities.forEach(e => {
        if(e.isDead) return;
        const cx = e.x + e.width / 2;
        const cy = e.y + e.height;
        // Shadow width scales better with entity size
        const radius = Math.max(8, e.width * 0.6);
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, 0.4); 
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; // Darker shadows
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI*2);
        ctx.fill();
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
            
            const barY = e.y - e.height - 10; 

            ctx.fillStyle = '#000000';
            ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

            ctx.fillStyle = '#450a0a';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
        }
    });

    // 6. Render Projectiles
    state.projectiles.forEach(p => {
        ctx.save();
        const cx = p.x + p.width / 2;
        const cy = p.y + p.height / 2;
        ctx.translate(cx, cy);

        ctx.fillStyle = p.color;
        
        if (p.renderStyle === 'WAVE') {
             const angle = Math.atan2(p.vy, p.vx);
             ctx.rotate(angle);
             
             const s = p.width / 20;

             ctx.fillStyle = '#dc2626'; 
             ctx.beginPath();
             ctx.moveTo(-6 * s, -14 * s);
             ctx.quadraticCurveTo(18 * s, 0, -6 * s, 14 * s); 
             ctx.quadraticCurveTo(4 * s, 0, -6 * s, -14 * s); 
             ctx.fill();

             ctx.fillStyle = '#fca5a5';
             ctx.beginPath();
             ctx.moveTo(-2 * s, -10 * s);
             ctx.quadraticCurveTo(14 * s, 0, -2 * s, 10 * s);
             ctx.quadraticCurveTo(4 * s, 0, -2 * s, -10 * s);
             ctx.fill();
             
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
             const angle = Math.atan2(p.vy, p.vx);
             ctx.rotate(angle);
             ctx.fillStyle = '#60a5fa'; 
             ctx.beginPath();
             ctx.moveTo(10, 0);
             ctx.lineTo(-10, -3);
             ctx.lineTo(-10, 3);
             ctx.fill();
             ctx.fillStyle = '#1e3a8a';
             ctx.fillRect(-14, -1, 4, 2);
             ctx.fillStyle = '#3b82f6';
             ctx.globalAlpha = 0.5;
             ctx.fillRect(-20, -2, 10, 4);
             ctx.globalAlpha = 1.0;

        } else if (p.renderStyle === 'TOMBSTONE_ZONE') {
             ctx.globalAlpha = 0.3;
             ctx.fillStyle = '#4c1d95';
             ctx.beginPath(); ctx.arc(0, 0, p.width/2, 0, Math.PI*2); ctx.fill();
             
             ctx.globalAlpha = 1.0;
             ctx.strokeStyle = '#7c3aed';
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(-20, 0); ctx.lineTo(20, 0);
             ctx.moveTo(0, -20); ctx.lineTo(0, 20);
             ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
             ctx.stroke();

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

    // 8. Lighting / Vignette with Low HP Pulse
    const playerCx = state.player.x + state.player.width/2;
    const playerCy = state.player.y + state.player.height/2;
    
    // Dynamic Vignette Radius
    const baseRadius = 150;
    const hpPct = state.player.hp / state.player.maxHp;
    const isLowHp = hpPct < 0.3;
    const pulse = isLowHp ? Math.sin(state.time * 0.2) * 20 : 0;
    
    // Create a large radial gradient centered on player
    const grad = ctx.createRadialGradient(playerCx, playerCy, baseRadius - pulse, playerCx, playerCy, 500);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    
    if (isLowHp) {
        // Red tinted vignette when low HP
        grad.addColorStop(1, `rgba(40,0,0,${0.7 + Math.sin(state.time * 0.2) * 0.2})`);
    } else {
        grad.addColorStop(1, 'rgba(2,6,23,0.8)'); // Dark slate
    }

    // Apply gradient over visible viewport
    const viewX = -state.camera.x;
    const viewY = -state.camera.y;
    ctx.fillStyle = grad;
    ctx.fillRect(viewX, viewY, C.CANVAS_WIDTH, C.CANVAS_HEIGHT);

    ctx.restore();
};


import { GameState, Enemy, AbilityType, WeaponType, EntityType, EnemyType, ItemType, BossState, Entity } from '../types';
import * as C from '../constants';
import { createParticles, spawnDamageNumber, spawnEcho } from './spawners';
import { createDungeon } from './dungeon';
import { checkWall } from './physics';

export const handleAttack = (state: GameState) => {
    const { player } = state;
    if (player.isSpinning) return;

    const weapon = C.WEAPONS[player.currentWeapon];
    
    // Apply Attack Speed
    const speedMod = player.stats.attackSpeed;
    const baseCooldown = Math.max(2, weapon.cooldown / speedMod);
    
    player.attackCooldown = baseCooldown;
    player.maxAttackCooldown = player.attackCooldown;
    player.isAttacking = true;
    player.swingHitList = []; 

    const dmgBuff = player.activeBuffs.find(b => b.type === ItemType.BUFF_DAMAGE);
    const dmgMult = dmgBuff ? 1.5 : 1.0;
    const comboMult = 1 + (player.combo * C.COMBO_DAMAGE_MULT_PER_STACK);

    if (player.currentWeapon === WeaponType.SHADOW_BOW) {
        const orbitRadius = 18;
        const chestHeightOffset = 25; 
        
        const pCenterX = player.x + player.width/2;
        const pCenterY = player.y + player.height;

        const spawnX = pCenterX + Math.cos(player.aimAngle) * orbitRadius;
        const spawnY = (pCenterY - chestHeightOffset) + Math.sin(player.aimAngle) * orbitRadius;

        // Gemini Protocol: Chance to double cast
        let projectileCount = 1;
        if (player.inventory['gemini_protocol'] && Math.random() < 0.3) {
            projectileCount = 2;
        }

        for (let i = 0; i < projectileCount; i++) {
            const angleOffset = (i * 0.1) - (projectileCount > 1 ? 0.05 : 0);
            
            state.projectiles.push({
                id: `proj-${Math.random()}`,
                type: EntityType.PROJECTILE,
                ownerId: player.id,
                x: spawnX,
                y: spawnY,
                width: 14, height: 14,
                vx: Math.cos(player.aimAngle + angleOffset) * 15,
                vy: Math.sin(player.aimAngle + angleOffset) * 15,
                damage: player.stats.damage * dmgMult * comboMult,
                color: weapon.color,
                lifeTime: 60,
                isDead: false,
                renderStyle: 'SHADOW_ARROW'
            });
        }

        // Oblivion Engine Check
        if (player.inventory['oblivion_engine']) {
             createParticles(state, spawnX, spawnY, 8, '#000000', player.aimAngle);
        } else {
             createParticles(state, spawnX, spawnY, 5, '#d8b4fe', player.aimAngle);
        }
        return;
    }

    // For all melee weapons, we defer collision to updatePlayer loop
    return;
};

export const handleAbility = (state: GameState, slot: 'PRIMARY' | 'SECONDARY') => {
    const { player } = state;
    
    let abilityType: AbilityType | undefined;
    if (slot === 'PRIMARY') abilityType = player.activeAbility;
    else abilityType = C.WEAPONS[player.currentWeapon].secondary?.type;
    
    if (!abilityType) return;
    
    const config = slot === 'PRIMARY' ? (C.ABILITIES as any)[abilityType] : C.WEAPONS[player.currentWeapon].secondary;
    if (!config) return;

    // Apply Cooldown Reduction
    const cdr = Math.min(0.75, player.stats.cooldownReduction);
    const cooldown = Math.ceil(config.cooldown * (1 - cdr));

    if (slot === 'PRIMARY') player.abilityCooldown = cooldown;
    else player.secondaryAbilityCooldown = cooldown;

    if (abilityType === AbilityType.SHADOW_CALL) {
        if (player.shadowStack.length === 0) return;
        player.shadowStack.forEach((enemyType, i) => {
            let tier = 1;
            if (enemyType === EnemyType.ELITE) tier = 2;
            if (enemyType === EnemyType.MYSTIC) tier = 3;
            const angle = (Math.PI * 2 / player.shadowStack.length) * i;
            let dist = 40 + Math.random() * 20;
            const echoSize = 24;

            // Determine spawn position centered on calculated point
            // Echo is 24x24, so subtract 12 to center
            let ex = player.x + player.width/2 + Math.cos(angle) * dist - echoSize/2;
            let ey = player.y + player.height/2 + Math.sin(angle) * dist - echoSize/2;

            // Check if inside wall
            if (checkWall(ex, ey, echoSize, echoSize, state.dungeon)) {
                // Try closer
                dist = 10;
                ex = player.x + player.width/2 + Math.cos(angle) * dist - echoSize/2;
                ey = player.y + player.height/2 + Math.sin(angle) * dist - echoSize/2;

                if (checkWall(ex, ey, echoSize, echoSize, state.dungeon)) {
                    // Fallback to player center
                    ex = player.x + player.width/2 - echoSize/2;
                    ey = player.y + player.height/2 - echoSize/2;
                }
            }

            spawnEcho(state, ex, ey, tier);
        });
        createParticles(state, player.x, player.y, 20, config.color);
        state.camera.shake = 8;
        player.shadowStack = [];
    } else if (abilityType === AbilityType.BLOOD_WAVE) {
        // Visuals: Trigger an attack swing to match the wave
        player.isAttacking = true;
        player.attackCooldown = 20;
        player.maxAttackCooldown = 20;
        
        // Align spawn with visual weapon position
        const pCenterX = player.x + player.width/2;
        const pVisualY = player.y + player.height - 14; 
        const offset = 24; 

        const spawnX = pCenterX + Math.cos(player.aimAngle) * offset;
        const spawnY = pVisualY + Math.sin(player.aimAngle) * offset;
        const pSize = 30;

        state.projectiles.push({
            id: `proj-${Math.random()}`, type: EntityType.PROJECTILE, ownerId: player.id,
            x: spawnX - pSize/2, 
            y: spawnY - pSize/2,
            width: pSize, height: pSize,
            vx: Math.cos(player.aimAngle) * 12, vy: Math.sin(player.aimAngle) * 12,
            damage: player.stats.damage * (config.damageMult || 2.0),
            color: config.color, lifeTime: 30, isDead: false,
            piercing: true, renderStyle: 'WAVE'
        });
        createParticles(state, spawnX, spawnY, 10, '#ef4444', player.aimAngle);
        state.camera.shake = 4;
    } else if (abilityType === AbilityType.CURSED_DASH) {
        player.isDashing = true;
        player.isSlashDashing = true; 
        player.slashDashTimer = 15; 
        player.dashCooldown = cooldown;
        player.invulnTimer = 15; 
        
        player.vx = Math.cos(player.aimAngle) * 25;
        player.vy = Math.sin(player.aimAngle) * 25;
        
        createParticles(state, player.x, player.y, 15, '#7c3aed'); 
        state.camera.shake = 10;
        
    } else if (abilityType === AbilityType.EXECUTIONER_SWIRL) {
        player.isSpinning = true;
        player.spinTimer = 180; 
        player.spinTickTimer = 0;
        createParticles(state, player.x + player.width/2, player.y + player.height/2, 20, '#7f1d1d');
        state.camera.shake = 10;

    } else if (abilityType === AbilityType.PIERCING_VOLLEY) {
        const orbitRadius = 18;
        const chestHeightOffset = 19; 
        
        const pCenterX = player.x + player.width/2;
        const pCenterY = player.y + player.height;

        const spawnX = pCenterX + Math.cos(player.aimAngle) * orbitRadius;
        const spawnY = (pCenterY - chestHeightOffset) + Math.sin(player.aimAngle) * orbitRadius;

        const count = 5;
        const spread = Math.PI / 4;
        for(let i=0; i<count; i++) {
             const angle = player.aimAngle - spread/2 + (spread/(count-1)) * i;
             state.projectiles.push({
                id: `proj-${Math.random()}`, type: EntityType.PROJECTILE, ownerId: player.id,
                x: spawnX, y: spawnY,
                width: 12, height: 12,
                vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18,
                damage: player.stats.damage * 1.5,
                color: '#d8b4fe', lifeTime: 50, isDead: false,
                piercing: true, renderStyle: 'SHADOW_ARROW'
            });
        }
        createParticles(state, spawnX, spawnY, 10, '#d8b4fe', player.aimAngle);
    }
};

export const dealDamage = (state: GameState, target: Enemy, amount: number, isCrit: boolean, isDoT = false) => {
    // Boss Invulnerability during phase transition
    if (target.bossState === BossState.PHASE_TRANSITION) return;

    // Apply Crit Damage Stat if it is a crit
    let finalAmount = amount;
    if (isCrit) {
        // Base crit is 2.0. If `critDamage` is 2.5, we need to add 0.5x base damage.
        // `amount` is currently 2x base.
        // base = amount / 2.
        // bonus = base * (player.stats.critDamage - 2.0).
        // total = amount + bonus.
        
        const base = amount / 2;
        const bonus = base * (state.player.stats.critDamage - 2.0);
        finalAmount += bonus;
    }

    target.hp -= finalAmount;
    
    // Prevent Phase 1 boss from dying before transition
    if (target.enemyType === EnemyType.BOSS && target.bossPhase === 1 && target.hp <= target.maxHp * 0.5) {
        target.hp = target.maxHp * 0.5; // Cap at 50% so logic in updateKurogami catches it
    }

    if (!isDoT) {
        target.hitFlashTimer = 5;
        target.vx += (Math.random()-0.5) * 0.5;
        target.vy += (Math.random()-0.5) * 0.5;
    }
    
    // --- ON HIT EFFECTS ---
    if (!isDoT) {
        const luck = state.player.stats.luck;

        // 6. Blood Conduit: Heal 3 HP on hit
        if (state.player.inventory['blood_conduit']) {
            const heal = 3 * state.player.inventory['blood_conduit'];
            state.player.hp = Math.min(state.player.hp + heal, state.player.maxHp);
            if (Math.random() < 0.2) spawnDamageNumber(state, state.player.x, state.player.y, heal, false, '#22c55e');
        }

        // 7. Arc Repeater Node: Electric Pulse
        const arcChance = 0.2 + (luck * 0.05);
        if (state.player.inventory['arc_repeater'] && Math.random() < arcChance) {
            const range = 150;
            const dmg = state.player.stats.damage * 0.5 * state.player.inventory['arc_repeater'];
            state.enemies.forEach(e => {
                if (e.id !== target.id) {
                    const d = Math.sqrt((e.x - target.x)**2 + (e.y - target.y)**2);
                    if (d < range) {
                        dealDamage(state, e, dmg, false, true); 
                        createParticles(state, e.x, e.y, 3, '#facc15');
                        const steps = 5;
                        for(let i=0; i<steps; i++) {
                            const lx = target.x + (e.x - target.x) * (i/steps);
                            const ly = target.y + (e.y - target.y) * (i/steps);
                            state.particles.push({
                                id: `light-${Math.random()}`, type: EntityType.PARTICLE,
                                x: lx, y: ly, width: 2, height: 2,
                                vx: 0, vy: 0, color: '#facc15', isDead: false, lifeTime: 10, maxLifeTime: 10, startColor: '#facc15', endColor: '#facc15'
                            });
                        }
                    }
                }
            });
        }

        // 8. Nanite Swarm Pod: Apply stacking DoT
        if (state.player.inventory['nanite_pod']) {
            const stacks = state.player.inventory['nanite_pod'];
            if (!target.naniteStack) target.naniteStack = 0;
            target.naniteStack += stacks;
            target.naniteTimer = 180; 
        }

        // 11. Oblivion Engine: Void Implosion
        if (state.player.inventory['oblivion_engine']) {
            if (Math.random() < 0.3 + (luck * 0.1)) {
                createParticles(state, target.x, target.y, 15, '#000000');
                const range = 80;
                const dmg = state.player.stats.damage * 1.0;
                state.enemies.forEach(e => {
                    const d = Math.sqrt((e.x - target.x)**2 + (e.y - target.y)**2);
                    if (d < range) {
                        e.vx += (target.x - e.x) * 0.1;
                        e.vy += (target.y - e.y) * 0.1;
                        dealDamage(state, e, dmg, false, true);
                    }
                });
            }
        }
    }

    if (target.hp <= 0 && !target.isDead) {
         // --- ON KILL EFFECTS ---
         
         // 12. Spectral Choir
         if (state.player.inventory['spectral_choir']) {
             const count = state.player.inventory['spectral_choir'];
             if (Math.random() < 0.2 * count) { 
                 spawnEcho(state, target.x, target.y, 2); 
                 createParticles(state, target.x, target.y, 10, '#22d3ee');
             }
         }

         // Volatile Catalyst (Uncommon)
         if (state.player.inventory['volatile_catalyst']) {
             const stack = state.player.inventory['volatile_catalyst'];
             const range = 100;
             const explosionDmg = target.maxHp * 0.5 * stack; 
             createParticles(state, target.x, target.y, 20, '#f97316'); // Orange
             
             state.enemies.forEach(e => {
                 if (e.id !== target.id) {
                     const d = Math.sqrt((e.x - target.x)**2 + (e.y - target.y)**2);
                     if (d < range) {
                         dealDamage(state, e, explosionDmg, false, true);
                         e.vx += (e.x - target.x) * 0.1;
                         e.vy += (e.y - target.y) * 0.1;
                     }
                 }
             });
             // Visual Shockwave
             state.projectiles.push({
                id: `exp-${Math.random()}`, type: EntityType.PROJECTILE, ownerId: state.player.id,
                x: target.x + target.width/2 - range/2, y: target.y + target.height/2 - range/2,
                width: range, height: range, vx: 0, vy: 0,
                damage: 0, color: '#f97316', lifeTime: 10, isDead: false, renderStyle: 'VOID_ORB'
             });
         }
    }
    
    spawnDamageNumber(state, target.x, target.y, finalAmount, isCrit, isDoT ? '#fca5a5' : (isCrit ? '#fbbf24' : '#ef4444'));
};

export const damagePlayer = (state: GameState, amount: number, source?: Entity) => {
    // God Mode Cheat
    if (state.cheats.godMode) return;

    const { player } = state;
    
    let finalAmount = amount * (1 - player.stats.damageReduction);
    finalAmount = Math.max(1, finalAmount); 

    // Thorned Plating (Reflect Damage)
    if (player.inventory['thorned_plating'] && source && source.type === EntityType.ENEMY) {
        const reflectPct = 0.3 * player.inventory['thorned_plating'];
        const reflectedDmg = amount * reflectPct;
        const enemy = source as Enemy;
        if (!enemy.isDead) {
            dealDamage(state, enemy, reflectedDmg, false, true);
            createParticles(state, player.x, player.y, 5, '#84cc16'); // Green Spikes
        }
    }

    // Berserker Cortex
    if (player.inventory['berserker_cortex']) {
        const stack = player.inventory['berserker_cortex'];
        const duration = 180; 
        const existing = player.activeBuffs.find(b => b.type === ItemType.BUFF_ATTACK_SPEED);
        if (existing) {
            existing.timer = duration;
        } else {
            player.activeBuffs.push({
                type: ItemType.BUFF_ATTACK_SPEED,
                timer: duration,
                value: 0.2 * stack 
            });
            player.stats.attackSpeed += 0.2 * stack;
        }
    }

    player.hp -= finalAmount;
    player.hitFlashTimer = 10;
    state.camera.shake = 5;
    player.combo = 0; 

    // 14. Cataclysm Vein
    if (player.hp <= 0 && player.inventory['cataclysm_vein'] && !player.reviveUsed) {
        player.hp = player.maxHp * 0.5; 
        player.reviveUsed = true;
        player.invulnTimer = 120; 
        
        createParticles(state, player.x, player.y, 50, '#ef4444');
        state.camera.shake = 20;
        state.enemies.forEach(e => {
            const d = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
            if (d < 300) {
                dealDamage(state, e, 500, true); 
                e.vx += (e.x - player.x) * 0.5;
                e.vy += (e.y - player.y) * 0.5;
            }
        });
        spawnDamageNumber(state, player.x, player.y, 0, true, '#ef4444'); 
    }
};

export const nextFloor = (state: GameState) => {
    state.dungeon.floor++;
    state.dungeon = createDungeon(state.dungeon.floor);
    const startRoom = state.dungeon.rooms[0];
    state.player.x = (startRoom.x + startRoom.width/2) * C.TILE_SIZE;
    state.player.y = (startRoom.y + startRoom.height/2) * C.TILE_SIZE;
    state.enemies = [];
    state.projectiles = [];
    state.items = [];
    state.echoes.forEach(e => {
        e.x = state.player.x + (Math.random()-0.5)*50;
        e.y = state.player.y + (Math.random()-0.5)*50;
    });
    state.particles = [];
    state.interactionItem = null;
    
    createParticles(state, state.player.x, state.player.y, 30, '#ffffff');
};

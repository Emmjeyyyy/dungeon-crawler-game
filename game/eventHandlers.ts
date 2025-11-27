

import { GameState, Enemy, AbilityType, WeaponType, EntityType, EnemyType, ItemType } from '../types';
import * as C from '../constants';
import { createParticles, spawnDamageNumber, spawnEcho } from './spawners';
import { createDungeon } from './dungeon';

export const handleAttack = (state: GameState) => {
    const { player } = state;
    // Prevent attacking while spinning
    if (player.isSpinning) return;

    const weapon = C.WEAPONS[player.currentWeapon];
    
    const speedMod = player.stats.attackSpeed;
    player.attackCooldown = Math.max(2, weapon.cooldown / speedMod);
    player.maxAttackCooldown = player.attackCooldown;
    player.isAttacking = true;
    player.swingHitList = []; // Reset hit list for new swing

    const dmgBuff = player.activeBuffs.find(b => b.type === ItemType.BUFF_DAMAGE);
    const dmgMult = dmgBuff ? 1.5 : 1.0;
    const comboMult = 1 + (player.combo * C.COMBO_DAMAGE_MULT_PER_STACK);

    if (player.currentWeapon === WeaponType.SHADOW_BOW) {
        // Updated Orbital Spawn Logic
        // Radius matches the visual offset (18px) + offset from body center (-14px height, lower than before)
        const orbitRadius = 18;
        const chestHeightOffset = 14; // Up from feet (Lowered by 10px from 24)
        
        const pCenterX = player.x + player.width/2;
        const pCenterY = player.y + player.height;

        const spawnX = pCenterX + Math.cos(player.aimAngle) * orbitRadius;
        const spawnY = (pCenterY - chestHeightOffset) + Math.sin(player.aimAngle) * orbitRadius;

        state.projectiles.push({
            id: `proj-${Math.random()}`,
            type: EntityType.PROJECTILE,
            ownerId: player.id,
            x: spawnX,
            y: spawnY,
            width: 14, height: 14,
            vx: Math.cos(player.aimAngle) * 15,
            vy: Math.sin(player.aimAngle) * 15,
            damage: player.stats.damage * dmgMult * comboMult,
            color: weapon.color,
            lifeTime: 60,
            isDead: false,
            renderStyle: 'SHADOW_ARROW'
        });
        // Bow Fire Effect
        createParticles(state, spawnX, spawnY, 5, '#d8b4fe', player.aimAngle);
        return;
    }

    // --- EXECUTIONER AXE (REAL-TIME HITBOX) ---
    if (player.currentWeapon === WeaponType.EXECUTIONER_AXE) {
        // We only set the state here. Collision is handled in updatePlayer frame-by-frame.
        return;
    }

    const cx = player.x + player.width/2;
    const cy = player.y + player.height/2;
    let hitCount = 0;

    state.enemies.forEach(e => {
        const ex = e.x + e.width/2;
        const ey = e.y + e.height/2;
        const dist = Math.sqrt((ex-cx)**2 + (ey-cy)**2);
        
        if (dist < weapon.range + e.width/2) {
            const angleToEnemy = Math.atan2(ey - cy, ex - cx);
            let angleDiff = angleToEnemy - player.aimAngle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI*2;
            
            if (Math.abs(angleDiff) < weapon.arc / 2) {
                const baseDmg = player.stats.damage * weapon.damageMult;
                const finalDmg = baseDmg * dmgMult * comboMult;
                const isCrit = Math.random() < player.stats.critChance;
                
                dealDamage(state, e, isCrit ? finalDmg * 2 : finalDmg, isCrit);
                
                e.vx += Math.cos(angleToEnemy) * 5;
                e.vy += Math.sin(angleToEnemy) * 5;
                
                // Color particles based on weapon
                createParticles(state, e.x, e.y, 3, weapon.color, angleToEnemy);

                hitCount++;
                state.camera.shake = 6;
                state.hitStop = C.HIT_STOP_LIGHT;
            }
        }
    });

    if (hitCount > 0) {
        player.combo++;
        player.comboTimer = C.COMBO_DECAY;
        if (player.combo > player.maxCombo) player.maxCombo = player.combo;
    }
};

export const handleAbility = (state: GameState, slot: 'PRIMARY' | 'SECONDARY') => {
    const { player } = state;
    
    let abilityType: AbilityType | undefined;
    if (slot === 'PRIMARY') abilityType = player.activeAbility;
    else abilityType = C.WEAPONS[player.currentWeapon].secondary?.type;
    
    if (!abilityType) return;
    
    const config = slot === 'PRIMARY' ? (C.ABILITIES as any)[abilityType] : C.WEAPONS[player.currentWeapon].secondary;
    if (!config) return;

    if (slot === 'PRIMARY') player.abilityCooldown = config.cooldown;
    else player.secondaryAbilityCooldown = config.cooldown;

    if (abilityType === AbilityType.SHADOW_CALL) {
        if (player.shadowStack.length === 0) return;
        player.shadowStack.forEach((enemyType, i) => {
            let tier = 1;
            if (enemyType === EnemyType.ELITE) tier = 2;
            if (enemyType === EnemyType.MYSTIC) tier = 3;
            const angle = (Math.PI * 2 / player.shadowStack.length) * i;
            const dist = 40 + Math.random() * 20;
            const ex = player.x + player.width/2 + Math.cos(angle) * dist;
            const ey = player.y + player.height/2 + Math.sin(angle) * dist;
            spawnEcho(state, ex, ey, tier);
        });
        createParticles(state, player.x, player.y, 20, config.color);
        state.camera.shake = 8;
        player.shadowStack = [];
    } else if (abilityType === AbilityType.BLOOD_WAVE) {
        state.projectiles.push({
            id: `proj-${Math.random()}`, type: EntityType.PROJECTILE, ownerId: player.id,
            x: player.x + player.width/2, y: player.y + player.height/2,
            width: 30, height: 30,
            vx: Math.cos(player.aimAngle) * 12, vy: Math.sin(player.aimAngle) * 12,
            damage: player.stats.damage * (config.damageMult || 2.0),
            color: config.color, lifeTime: 30, isDead: false,
            piercing: true, renderStyle: 'WAVE'
        });
        createParticles(state, player.x, player.y, 10, '#ef4444');
        state.camera.shake = 4;
    } else if (abilityType === AbilityType.CURSED_DASH) {
        // Replaces Whirling Flurry with Samurai Slash Dash
        player.isDashing = true;
        player.isSlashDashing = true; // Flag for collision damage logic in player.ts
        player.slashDashTimer = 15; // Duration of the dash
        player.dashCooldown = config.cooldown;
        player.invulnTimer = 15; // I-frames
        
        // High Velocity
        player.vx = Math.cos(player.aimAngle) * 25;
        player.vy = Math.sin(player.aimAngle) * 25;
        
        // Initial Burst
        createParticles(state, player.x, player.y, 15, '#7c3aed'); // Purple
        state.camera.shake = 10;
        
    } else if (abilityType === AbilityType.EXECUTIONER_SWIRL) {
        // Activate Spin State
        player.isSpinning = true;
        player.spinTimer = 180; // 3 seconds duration
        player.spinTickTimer = 0;
        createParticles(state, player.x + player.width/2, player.y + player.height/2, 20, '#7f1d1d');
        state.camera.shake = 10;

    } else if (abilityType === AbilityType.PIERCING_VOLLEY) {
        // Updated Orbital Spawn Logic for Volley
        const orbitRadius = 18;
        const chestHeightOffset = 14; // Up from feet (Lowered by 10px from 24)
        
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
    target.hp -= amount;
    if (!isDoT) {
        target.hitFlashTimer = 5;
        target.vx += (Math.random()-0.5) * 2;
        target.vy += (Math.random()-0.5) * 2;
    }
    
    // Items Proc
    if (!isDoT && state.player.inventory['hopoo_feather']) {
        if (isCrit) {
             state.player.hp = Math.min(state.player.hp + 5 * state.player.inventory['hopoo_feather'], state.player.maxHp);
             spawnDamageNumber(state, state.player.x, state.player.y, 5 * state.player.inventory['hopoo_feather'], false, '#22c55e');
        }
    }

    if (target.hp <= 0 && !target.isDead) {
         // Death logic handled in enemy updater, but we trigger onKill effects here if needed
         if (state.player.inventory['ceremonial_dagger']) {
             // ... spawned in enemy updater
         }
    }
    
    spawnDamageNumber(state, target.x, target.y, amount, isCrit, isDoT ? '#fca5a5' : (isCrit ? '#fbbf24' : '#ef4444'));
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
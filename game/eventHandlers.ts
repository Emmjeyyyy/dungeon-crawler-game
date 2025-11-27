import { GameState, Enemy, AbilityType, WeaponType, EntityType, EnemyType, ItemType } from '../types';
import * as C from '../constants';
import { createParticles, spawnDamageNumber, spawnEcho } from './spawners';
import { createDungeon } from './dungeon';

export const handleAttack = (state: GameState) => {
    const { player } = state;
    const weapon = C.WEAPONS[player.currentWeapon];
    
    const speedMod = player.stats.attackSpeed;
    player.attackCooldown = Math.max(2, weapon.cooldown / speedMod);
    player.maxAttackCooldown = player.attackCooldown;
    player.isAttacking = true;

    const dmgBuff = player.activeBuffs.find(b => b.type === ItemType.BUFF_DAMAGE);
    const dmgMult = dmgBuff ? 1.5 : 1.0;
    const comboMult = 1 + (player.combo * C.COMBO_DAMAGE_MULT_PER_STACK);

    if (player.currentWeapon === WeaponType.SHADOW_BOW) {
        state.projectiles.push({
            id: `proj-${Math.random()}`,
            type: EntityType.PROJECTILE,
            ownerId: player.id,
            x: player.x + player.width/2,
            y: player.y + player.height/2,
            width: 10, height: 10,
            vx: Math.cos(player.aimAngle) * 15,
            vy: Math.sin(player.aimAngle) * 15,
            damage: player.stats.damage * dmgMult * comboMult,
            color: weapon.color,
            lifeTime: 60,
            isDead: false,
        });
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
                
                createParticles(state, e.x, e.y, 3, '#b91c1c', angleToEnemy);

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
        state.camera.shake = 10;
    } else if (abilityType === AbilityType.WHIRLING_FLURRY) {
        player.isSlashDashing = true;
        player.slashDashTimer = 20;
        player.invulnTimer = 20;
        player.vx = Math.cos(player.aimAngle) * 25;
        player.vy = Math.sin(player.aimAngle) * 25;
        state.camera.shake = 5;
    } else if (abilityType === AbilityType.GROUND_CLEAVE) {
        const radius = config.radius || 120;
        const damage = player.stats.damage * (config.damageMult || 4.0);
        createParticles(state, player.x, player.y, 30, config.color);
        state.camera.shake = 20;
        state.enemies.forEach(e => {
            if (Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2) < radius) {
                dealDamage(state, e, damage, true);
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                e.vx += Math.cos(angle) * 15;
                e.vy += Math.sin(angle) * 15;
            }
        });
    } else if (abilityType === AbilityType.PIERCING_VOLLEY) {
        const count = 5;
        const spread = Math.PI / 6; 
        const startAngle = player.aimAngle - spread / 2;
        for(let i=0; i<count; i++) {
            const angle = startAngle + (spread / (count-1)) * i;
            state.projectiles.push({
                id: `proj-${Math.random()}`, type: EntityType.PROJECTILE, ownerId: player.id,
                x: player.x + player.width/2, y: player.y + player.height/2,
                width: 8, height: 8,
                vx: Math.cos(angle) * 18, vy: Math.sin(angle) * 18,
                damage: player.stats.damage * (config.damageMult || 1.5),
                color: config.color, lifeTime: 40, isDead: false,
                piercing: true
            });
        }
    }
};

export const dealDamage = (state: GameState, enemy: Enemy, amount: number, isCrit: boolean, skipOnHit: boolean = false) => {
    enemy.hp -= amount;
    enemy.hitFlashTimer = 5;
    spawnDamageNumber(state, enemy.x, enemy.y, amount, isCrit, isCrit ? '#fbbf24' : '#ffffff');
    
    if (!skipOnHit) {
        const lightningStack = state.player.inventory['ukulele'];
        if (lightningStack && Math.random() < 0.25 * lightningStack) {
             const range = 150;
             const target = state.enemies.find(e => e.id !== enemy.id && Math.sqrt((e.x-enemy.x)**2 + (e.y-enemy.y)**2) < range);
             if (target) {
                 createParticles(state, enemy.x, enemy.y, 5, '#facc15'); 
                 dealDamage(state, target, amount * 0.5, false, true);
             }
        }
    }
};

export const nextFloor = (state: GameState) => {
    state.dungeon.floor++;
    const newDungeon = createDungeon(state.dungeon.floor);
    state.dungeon = newDungeon;
    const startRoom = newDungeon.rooms[0];
    state.player.x = (startRoom.x + startRoom.width/2) * C.TILE_SIZE;
    state.player.y = (startRoom.y + startRoom.height/2) * C.TILE_SIZE;
    state.enemies = [];
    state.items = [];
    state.projectiles = [];
    state.echoes = [];
    state.damageNumbers = [];
    state.interactionItem = null;
    state.player.hp = Math.min(state.player.hp + state.player.maxHp * 0.2, state.player.maxHp);
};
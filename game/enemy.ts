import { GameState, EnemyType, EntityType } from '../types';
import * as C from '../constants';
import { resolveMapCollision } from './physics';
import { dealDamage, damagePlayer } from './eventHandlers';
import { createParticles } from './spawners';

export const updateEnemies = (state: GameState, onLevelUp: () => void) => {
    const pcx = state.player.x + state.player.width / 2;
    const pcy = state.player.y + state.player.height / 2;

    state.enemies.forEach(e => {
        e.vx *= 0.9;
        e.vy *= 0.9;
        
        const ecx = e.x + e.width / 2;
        const ecy = e.y + e.height / 2;
        const dist = Math.sqrt((pcx - ecx)**2 + (pcy - ecy)**2);
        
        if (dist < e.agroRange) {
            const angle = Math.atan2(pcy - ecy, pcx - ecx);
            const speed = e.enemyType === EnemyType.ELITE ? 1.2 : 2.0;
            e.vx += Math.cos(angle) * speed * 0.1;
            e.vy += Math.sin(angle) * speed * 0.1;
            e.facingX = Math.sign(Math.cos(angle));

            const overlapThreshold = (state.player.width/2 + e.width/2) * 0.9;
            if (dist < overlapThreshold && e.attackCooldown <= 0 && state.player.invulnTimer <= 0) {
                // Use centralized damage function
                damagePlayer(state, e.damage);
                e.attackCooldown = 60;
            }
        }
        
        if (e.attackCooldown > 0) e.attackCooldown--;
        if (e.hitFlashTimer > 0) e.hitFlashTimer--;
        if (e.swirlTimer && e.swirlTimer > 0) e.swirlTimer--;

        // Bleed Processing (Existing)
        if (e.bleedStack && e.bleedTimer) {
             if (state.time % 30 === 0) {
                 const bleedDmg = e.bleedStack * (state.player.stats.damage * 0.2);
                 dealDamage(state, e, bleedDmg, false, true);
             }
             e.bleedTimer--;
             if (e.bleedTimer <= 0) e.bleedStack = 0;
        }

        // Nanite Swarm Processing (New)
        if (e.naniteStack && e.naniteTimer) {
            if (state.time % 20 === 0) { // Ticks faster than bleed
                const naniteDmg = e.naniteStack * (state.player.stats.damage * 0.1);
                dealDamage(state, e, naniteDmg, false, true);
                createParticles(state, e.x + Math.random()*10, e.y + Math.random()*10, 1, '#10b981'); // Green/Tech particles
            }
            e.naniteTimer--;
            if (e.naniteTimer <= 0) e.naniteStack = 0;
        }

        resolveMapCollision(e, state.dungeon);
    });

    state.enemies = state.enemies.filter(e => {
        if (e.hp <= 0) {
            state.player.shadowStack.push(e.enemyType);
            state.player.xp += e.xpValue;
            if (state.player.xp >= state.player.maxXp) {
                state.player.level++;
                state.player.xp -= state.player.maxXp;
                state.player.maxXp *= 1.2;
                state.pendingLevelUp = true;
                onLevelUp();
            }
            createParticles(state, e.x, e.y, 10, C.COLORS.echo); 
            return false;
        }
        return true;
    });
};
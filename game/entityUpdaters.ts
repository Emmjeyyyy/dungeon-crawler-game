
import { GameState, Enemy, ItemType } from '../types';
import { resolveMapCollision, checkWall, rectIntersect } from './physics';
import { dealDamage } from './eventHandlers';
import { createParticles } from './spawners';

export const updateEchoes = (state: GameState) => {
    state.echoes.forEach(echo => {
        echo.lifeTime--;
        if (echo.lifeTime <= 0) echo.isDead = true;

        let nearest: Enemy | null = null;
        let minD = 500;
        
        state.enemies.forEach(e => {
            const d = Math.sqrt((e.x - echo.x)**2 + (e.y - echo.y)**2);
            if (d < minD) {
                minD = d;
                nearest = e;
            }
        });

        if (nearest) {
            const target: Enemy = nearest;
            const angle = Math.atan2(target.y - echo.y, target.x - echo.x);
            echo.vx += Math.cos(angle) * 0.3;
            echo.vy += Math.sin(angle) * 0.3;
            echo.facingX = Math.sign(Math.cos(angle));
            
            if (minD < 30) {
                // Echo Amplifier Effect
                let dmg = echo.damage;
                if (state.player.inventory['echo_amplifier']) {
                    dmg *= 2.0;
                }

                dealDamage(state, target, dmg, false);
                echo.lifeTime -= 30;
                echo.vx = -Math.cos(angle) * 5;
                echo.vy = -Math.sin(angle) * 5;
            }
        } else {
            // Grav-Pulse Unit Attraction (Items drift to player if no enemy nearby)
            const d = Math.sqrt((state.player.x - echo.x)**2 + (state.player.y - echo.y)**2);
            const attractRange = 100 + state.player.stats.pickupRange;

            if (d < attractRange && d > 20) {
                const angle = Math.atan2(state.player.y - echo.y, state.player.x - echo.x);
                const speed = state.player.inventory['echo_amplifier'] ? 0.4 : 0.2;
                echo.vx += Math.cos(angle) * speed;
                echo.vy += Math.sin(angle) * speed;
            } else if (d > 100) {
                const angle = Math.atan2(state.player.y - echo.y, state.player.x - echo.x);
                echo.vx += Math.cos(angle) * 0.2;
                echo.vy += Math.sin(angle) * 0.2;
                echo.facingX = Math.sign(Math.cos(angle));
            }
        }

        echo.vx *= 0.9;
        echo.vy *= 0.9;
        resolveMapCollision(echo, state.dungeon);
    });

    state.echoes = state.echoes.filter(e => !e.isDead);
};

export const updateProjectiles = (state: GameState) => {
    state.projectiles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifeTime--;
        
        if (checkWall(p.x, p.y, p.width, p.height, state.dungeon)) {
            p.lifeTime = 0;
            createParticles(state, p.x, p.y, 3, p.color);
        }
        
        if (p.ownerId === state.player.id) {
            for (const e of state.enemies) {
                if (rectIntersect(p, e)) {
                    dealDamage(state, e, p.damage, false);
                    const sprayAngle = Math.atan2(p.vy, p.vx);
                    createParticles(state, e.x, e.y, 3, '#b91c1c', sprayAngle);
                    if (!p.piercing) {
                        p.lifeTime = 0;
                        break;
                    }
                }
            }
        }
    });
    state.projectiles = state.projectiles.filter(p => p.lifeTime > 0);
};

export const updateItems = (state: GameState) => {
    let hovering: any = null;
    const attractRange = 80 + state.player.stats.pickupRange;

    state.items.forEach(item => {
        // Attraction Logic
        if (item.itemType !== ItemType.PORTAL && item.itemType !== ItemType.WEAPON_DROP) {
            const dx = (state.player.x + state.player.width/2) - (item.x + item.width/2);
            const dy = (state.player.y + state.player.height/2) - (item.y + item.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < attractRange) {
                item.vx += (dx / dist) * 0.5;
                item.vy += (dy / dist) * 0.5;
            }
            item.x += item.vx;
            item.y += item.vy;
            item.vx *= 0.9;
            item.vy *= 0.9;
        }

        if (rectIntersect(state.player, item)) {
             if (item.itemType === ItemType.WEAPON_DROP || item.itemType === ItemType.PORTAL) {
                 hovering = item;
             } else {
                 if (item.itemType === ItemType.BLOOD_VIAL) {
                     state.player.hp = Math.min(state.player.hp + 25, state.player.maxHp);
                 } else if (item.itemType === ItemType.BUFF_DAMAGE) {
                     state.player.activeBuffs.push({type: ItemType.BUFF_DAMAGE, timer: 600, value: 1.5});
                 } else if (item.itemType === ItemType.BUFF_SPEED) {
                     state.player.activeBuffs.push({type: ItemType.BUFF_SPEED, timer: 600, value: 1.5});
                 }
                 item.isDead = true;
             }
        }
    });
    state.interactionItem = hovering;
    state.items = state.items.filter(i => !i.isDead);
};

export const updateParticles = (state: GameState) => {
    state.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.lifeTime--;
        p.vx *= 0.9;
        p.vy *= 0.9;
    });
    state.particles = state.particles.filter(p => p.lifeTime > 0);
};

export const updateDamageNumbers = (state: GameState) => {
    state.damageNumbers.forEach(dn => {
        dn.x += dn.vx;
        dn.y += dn.vy;
        dn.lifeTime--;
        dn.vy += 0.1; // Gravity
    });
    state.damageNumbers = state.damageNumbers.filter(dn => dn.lifeTime > 0);
};

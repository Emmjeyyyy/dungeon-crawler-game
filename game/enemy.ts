
import { GameState, EnemyType, BossState, EntityType, Enemy } from '../types';
import * as C from '../constants';
import { resolveMapCollision, rectIntersect, resolveEntityCollision } from './physics';
import { dealDamage, damagePlayer } from './eventHandlers';
import { createParticles } from './spawners';

const updateKurogami = (state: GameState, boss: Enemy) => {
    // Initialization
    if (!boss.bossState) {
        boss.bossState = BossState.IDLE;
        boss.bossPhase = 1;
        boss.bossTimer = 60;
        boss.bossSubTimer = 0;
    }

    const { player } = state;
    const dist = Math.sqrt((player.x - boss.x)**2 + (player.y - boss.y)**2);
    const angleToPlayer = Math.atan2(player.y - boss.y, player.x - boss.x);
    
    // Facing
    if (boss.bossState !== BossState.DASHING && boss.bossState !== BossState.ATTACKING) {
        boss.facingX = Math.sign(Math.cos(angleToPlayer));
    }

    // Phase Transition
    if (boss.bossPhase === 1 && boss.hp <= boss.maxHp * 0.5) {
        boss.bossState = BossState.PHASE_TRANSITION;
        boss.bossPhase = 2;
        boss.bossTimer = 180; // 3 seconds transition
        boss.color = '#3b82f6'; // Blue flame color
        
        // Knockback player away
        const pushAngle = angleToPlayer + Math.PI;
        player.vx += Math.cos(pushAngle) * 20;
        player.vy += Math.sin(pushAngle) * 20;
        createParticles(state, boss.x + boss.width/2, boss.y + boss.height/2, 50, '#3b82f6');
        state.camera.shake = 20;
    }

    // --- STATE MACHINE ---
    switch (boss.bossState) {
        case BossState.PHASE_TRANSITION:
            boss.bossTimer!--;
            boss.vx = 0;
            boss.vy = 0;
            // Visuals
            if (state.time % 5 === 0) {
                createParticles(state, boss.x + Math.random()*boss.width, boss.y + Math.random()*boss.height, 5, '#3b82f6');
            }
            if (boss.bossTimer! <= 0) {
                boss.bossState = BossState.IDLE;
                boss.bossTimer = 30;
                boss.damage *= 1.5; // Enraged Damage
            }
            return; // Skip normal logic

        case BossState.IDLE:
            boss.bossTimer!--;
            
            // Slow Movement towards player
            const moveSpeed = boss.bossPhase === 2 ? 1.5 : 0.8;
            boss.vx = Math.cos(angleToPlayer) * moveSpeed;
            boss.vy = Math.sin(angleToPlayer) * moveSpeed;

            // Decision making
            if (boss.bossTimer! <= 0) {
                const roll = Math.random();
                if (dist < 150) {
                    // Close range: Slash
                    boss.bossState = BossState.CHARGING;
                    boss.bossTimer = boss.bossPhase === 2 ? 30 : 45; // Faster charge in P2
                    boss.bossSubTimer = 0; // 0 = Slash
                } else {
                    // Long range
                    if (roll < 0.4) {
                        boss.bossState = BossState.CHARGING; // For Dash
                        boss.bossTimer = 40;
                        boss.bossSubTimer = 1; // 1 = Dash
                    } else if (roll < 0.8) {
                        boss.bossState = BossState.CASTING;
                        boss.bossTimer = 60; // Cast time
                    } else {
                        // Just keep moving
                        boss.bossTimer = 30;
                    }
                }
            }
            break;

        case BossState.CHARGING:
            boss.bossTimer!--;
            boss.vx *= 0.8; 
            boss.vy *= 0.8;
            
            // Visual telegraph
            if (state.time % 5 === 0) {
                const color = boss.bossSubTimer === 0 ? '#ef4444' : '#fbbf24'; // Red for slash, Gold for dash
                createParticles(state, boss.x + boss.width/2, boss.y + boss.height/2, 2, color);
            }

            if (boss.bossTimer! <= 0) {
                if (boss.bossSubTimer === 0) {
                    // Execute Slash
                    boss.bossState = BossState.ATTACKING;
                    boss.bossTimer = 20; // Active frames
                    state.camera.shake = 5;
                    // Giant hitbox check
                    const slashRange = 180;
                    if (dist < slashRange) {
                        damagePlayer(state, boss.damage * 1.5, boss);
                        // Knockback
                        player.vx += Math.cos(angleToPlayer) * 15;
                        player.vy += Math.sin(angleToPlayer) * 15;
                    }
                    createParticles(state, boss.x + boss.width/2, boss.y + boss.height/2, 20, '#ef4444');
                } else {
                    // Execute Dash
                    boss.bossState = BossState.DASHING;
                    boss.bossTimer = 30;
                    boss.vx = Math.cos(angleToPlayer) * (boss.bossPhase === 2 ? 25 : 18);
                    boss.vy = Math.sin(angleToPlayer) * (boss.bossPhase === 2 ? 25 : 18);
                }
            }
            break;

        case BossState.ATTACKING:
            boss.bossTimer!--;
            boss.vx = 0;
            boss.vy = 0;
            if (boss.bossTimer! <= 0) {
                boss.bossState = BossState.RECOVERING;
                boss.bossTimer = boss.bossPhase === 2 ? 20 : 40;
            }
            break;

        case BossState.DASHING:
            boss.bossTimer!--;
            // Trail
            if (state.time % 2 === 0) {
                createParticles(state, boss.x + boss.width/2, boss.y + boss.height/2, 3, '#1e293b');
            }
            // Contact Damage
            if (rectIntersect(boss, player) && player.invulnTimer <= 0) {
                damagePlayer(state, boss.damage, boss);
            }
            
            if (boss.bossTimer! <= 0) {
                boss.bossState = BossState.RECOVERING;
                boss.bossTimer = 20;
                boss.vx = 0;
                boss.vy = 0;
            }
            break;

        case BossState.CASTING:
            boss.bossTimer!--;
            boss.vx = 0;
            boss.vy = 0;
            
            // Channeling particles
            createParticles(state, boss.x + boss.width/2 + (Math.random()-0.5)*50, boss.y + boss.height/2 + (Math.random()-0.5)*50, 1, '#22d3ee');

            if (boss.bossTimer! <= 0) {
                // Summon Spiritbound Blades
                const count = boss.bossPhase === 2 ? 8 : 4;
                for(let i=0; i<count; i++) {
                    const angle = (Math.PI * 2 / count) * i + (state.time * 0.1);
                    state.projectiles.push({
                        id: `boss-proj-${Math.random()}`,
                        type: EntityType.PROJECTILE,
                        ownerId: boss.id,
                        x: boss.x + boss.width/2,
                        y: boss.y + boss.height/2,
                        width: 20, height: 20,
                        vx: Math.cos(angle) * 4,
                        vy: Math.sin(angle) * 4,
                        damage: boss.damage * 0.8,
                        color: '#3b82f6',
                        lifeTime: 120,
                        isDead: false,
                        piercing: false,
                        renderStyle: 'SPECTRAL_BLADE'
                    });
                }
                
                // Phase 2: Create Slow Zone (Soul-Lock)
                if (boss.bossPhase === 2) {
                     state.projectiles.push({
                        id: `boss-zone-${Math.random()}`,
                        type: EntityType.PROJECTILE,
                        ownerId: boss.id,
                        x: player.x, // Spawns on player location
                        y: player.y,
                        width: 100, height: 100,
                        vx: 0, vy: 0,
                        damage: 1, // Minimal tick dmg
                        color: '#4c1d95',
                        lifeTime: 240,
                        isDead: false,
                        renderStyle: 'TOMBSTONE_ZONE'
                    });
                }

                boss.bossState = BossState.RECOVERING;
                boss.bossTimer = 30;
            }
            break;

        case BossState.RECOVERING:
            boss.bossTimer!--;
            if (boss.bossTimer! <= 0) {
                boss.bossState = BossState.IDLE;
                boss.bossTimer = boss.bossPhase === 2 ? 20 : 40;
            }
            break;
    }
};


export const updateEnemies = (state: GameState, onLevelUp: () => void) => {
    const pcx = state.player.x + state.player.width / 2;
    const pcy = state.player.y + state.player.height / 2;

    // Resolve collisions between enemies and player to prevent stacking
    resolveEntityCollision([state.player, ...state.enemies]);

    state.enemies.forEach(e => {
        // Projectile Zones Logic (e.g. Tombstone Zone Slow)
        if (e.enemyType === EnemyType.BOSS) {
            updateKurogami(state, e);
            
            // Passive Aura in P2 (Soul-Lock proximity check)
            if (e.bossPhase === 2) {
                const dist = Math.sqrt((state.player.x - e.x)**2 + (state.player.y - e.y)**2);
                if (dist < 250) {
                     // Minor slow
                     state.player.vx *= 0.9;
                     state.player.vy *= 0.9;
                     if (state.time % 20 === 0) createParticles(state, state.player.x, state.player.y, 1, '#4c1d95');
                }
            }

            resolveMapCollision(e, state.dungeon);
            return;
        }

        // --- STANDARD ENEMY LOGIC ---
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
                damagePlayer(state, e.damage, e);
                e.attackCooldown = 60;
            }
        }
        
        if (e.attackCooldown > 0) e.attackCooldown--;
        if (e.hitFlashTimer > 0) e.hitFlashTimer--;
        if (e.swirlTimer && e.swirlTimer > 0) e.swirlTimer--;

        // Bleed Processing
        if (e.bleedStack && e.bleedTimer) {
             if (state.time % 30 === 0) {
                 const bleedDmg = e.bleedStack * (state.player.stats.damage * 0.2);
                 dealDamage(state, e, bleedDmg, false, true);
             }
             e.bleedTimer--;
             if (e.bleedTimer <= 0) e.bleedStack = 0;
        }

        // Nanite Swarm Processing
        if (e.naniteStack && e.naniteTimer) {
            if (state.time % 20 === 0) { 
                const naniteDmg = e.naniteStack * (state.player.stats.damage * 0.1);
                dealDamage(state, e, naniteDmg, false, true);
                createParticles(state, e.x + Math.random()*10, e.y + Math.random()*10, 1, '#10b981'); 
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

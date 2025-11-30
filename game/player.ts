
import { GameState, ItemType, WeaponType, EntityType } from '../types';
import * as C from '../constants';
import { handleAttack, handleAbility, nextFloor, dealDamage } from './eventHandlers';
import { resolveMapCollision, rectIntersect } from './physics';
import { createParticles, spawnDamageNumber, spawnEcho } from './spawners';

export const updatePlayer = (state: GameState, inputs: Set<string>, mouse: {x: number, y: number}) => {
    const { player, dungeon } = state;

    // Cheat: No Cooldowns
    if (state.cheats.noCooldowns) {
        player.attackCooldown = 0;
        player.abilityCooldown = 0;
        player.secondaryAbilityCooldown = 0;
        player.dashCooldown = 0;
        player.interactionCooldown = 0;
    }

    const mx = mouse.x;
    const my = mouse.y;
    const worldMx = mx - state.camera.x;
    const worldMy = my - state.camera.y;
    const pCenterX = player.x + player.width/2;
    const pCenterY = player.y + player.height/2;
    
    player.aimAngle = Math.atan2(worldMy - pCenterY, worldMx - pCenterX);
    
    if (!player.isSlashDashing) {
        player.facingX = Math.abs(player.aimAngle) > Math.PI / 2 ? -1 : 1;
    }

    if (player.interactionCooldown > 0) player.interactionCooldown--;
    if (inputs.has('KeyE') && state.interactionItem && player.interactionCooldown <= 0) {
        if (state.interactionItem.itemType === ItemType.PORTAL) {
             nextFloor(state);
        }
        else if (state.interactionItem.itemType === ItemType.WEAPON_DROP) {
            const newWeapon = state.interactionItem.payload;
            player.currentWeapon = newWeapon;
            player.secondaryAbilityCooldown = 0;
            player.isSpinning = false;
            
            state.interactionItem.payload = player.currentWeapon;
            spawnDamageNumber(state, player.x, player.y, 1, true, '#94a3b8'); 
            player.interactionCooldown = 30;
            state.interactionItem.y -= 5;
        }
    }

    if (player.abilityCooldown > 0) player.abilityCooldown--;
    if (inputs.has('KeyQ') && player.abilityCooldown <= 0) {
        handleAbility(state, 'PRIMARY');
    }

    if (player.secondaryAbilityCooldown > 0) player.secondaryAbilityCooldown--;
    if (player.combo > 0) {
        player.comboTimer--;
        if (player.comboTimer <= 0) player.combo = 0;
    }

    player.activeBuffs = player.activeBuffs.filter(b => {
        b.timer--;
        return b.timer > 0;
    });

    // --- SPECIAL ABILITY STATES ---

    if (player.isSpinning) {
        // EXECUTIONER SWIRL LOGIC
        player.spinTimer--;
        
        const orbitRadius = 48; 
        const spinSpeed = 0.5;
        const spinAngle = state.time * spinSpeed;
        const axeHeadX = pCenterX + Math.cos(spinAngle) * orbitRadius;
        const axeHeadY = pCenterY + Math.sin(spinAngle) * orbitRadius;
        
        if (state.time % 2 === 0) {
             createParticles(state, axeHeadX, axeHeadY, 2, '#7f1d1d', spinAngle + Math.PI/2);
        }

        const hitboxRadius = 40; 
        const weaponConfig = C.WEAPONS[player.currentWeapon];
        
        let hitCount = 0;

        state.enemies.forEach(e => {
            const dist = Math.sqrt((e.x + e.width/2 - axeHeadX)**2 + (e.y + e.height/2 - axeHeadY)**2);
            
            if (dist < hitboxRadius && (!e.swirlTimer || e.swirlTimer <= 0)) {
                const dmgMult = weaponConfig.secondary?.damageMult || 0.5;
                const damage = player.stats.damage * dmgMult;
                const isCrit = Math.random() < player.stats.critChance;
                
                // We pass Base Dmg * 2 if Crit, but now dealDamage handles Extra Crit Dmg
                dealDamage(state, e, isCrit ? damage * 2 : damage, isCrit);
                
                e.swirlTimer = 10;
                
                const angle = Math.atan2(e.y - player.y, e.x - player.x);
                e.vx += Math.cos(angle) * 1.5;
                e.vy += Math.sin(angle) * 1.5;
                
                createParticles(state, e.x, e.y, 3, '#7f1d1d');
                hitCount++;
            }
        });

        if (hitCount > 0) state.camera.shake = 3;

        // Movement Logic
        let dx = 0; let dy = 0;
        if (inputs.has('KeyW')) dy -= 1;
        if (inputs.has('KeyS')) dy += 1;
        if (inputs.has('KeyA')) dx -= 1;
        if (inputs.has('KeyD')) dx += 1;

        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            dx /= len; dy /= len;
        }
        const speed = player.stats.speed * 0.8; 
        player.vx += dx * speed * 0.2;
        player.vy += dy * speed * 0.2;
        player.vx *= C.FRICTION;
        player.vy *= C.FRICTION;
        resolveMapCollision(player, dungeon);

        if (player.spinTimer <= 0) {
            player.isSpinning = false;
        }

    } else if (player.isSlashDashing) {
        player.slashDashTimer--;
        if (state.time % 3 === 0) createParticles(state, player.x, player.y, 1, '#fbbf24');

        state.enemies.forEach(e => {
            if (e.hitFlashTimer <= 0 && rectIntersect(player, e)) {
                const weaponConfig = C.WEAPONS[player.currentWeapon];
                const dmgMult = weaponConfig.secondary?.damageMult || 1.0;
                const damage = player.stats.damage * dmgMult;
                dealDamage(state, e, damage, true);
                createParticles(state, e.x, e.y, 8, '#ffffff');
                state.camera.shake = 6;
                
                e.vx += player.vx * 0.1; 
                e.vy += player.vy * 0.1;
                state.echoes.forEach(echo => echo.targetId = e.id);
            }
        });
        resolveMapCollision(player, dungeon);
        if (player.slashDashTimer <= 0) {
            player.isSlashDashing = false;
            player.vx *= 0.1;
            player.vy *= 0.1;
        }
    } else if (!player.isDashing) {
      // NORMAL MOVEMENT
      let dx = 0; let dy = 0;
      if (inputs.has('KeyW')) dy -= 1;
      if (inputs.has('KeyS')) dy += 1;
      if (inputs.has('KeyA')) dx -= 1;
      if (inputs.has('KeyD')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;
      }
      const speed = player.stats.speed * (player.activeBuffs.some(b => b.type === ItemType.BUFF_SPEED) ? 1.5 : 1.0);
      player.vx += dx * speed * 0.2;
      player.vy += dy * speed * 0.2;
      player.vx *= C.FRICTION;
      player.vy *= C.FRICTION;

      // Handle Attack Logic
      if (player.attackCooldown > 0) {
        player.attackCooldown--;
        player.isAttacking = true;

        const weapon = C.WEAPONS[player.currentWeapon];
        const progress = 1 - (player.attackCooldown / player.maxAttackCooldown);
        let swingOffset = Math.sin((progress - 0.5) * Math.PI) * (weapon.arc / 2);

        if (Math.abs(player.aimAngle) > Math.PI / 2) {
            swingOffset *= -1;
        }

        const currentAngle = player.aimAngle + swingOffset;
        const orbitRadius = 12;
        const handX = pCenterX + Math.cos(player.aimAngle) * orbitRadius;
        const handY = pCenterY + 2 + Math.sin(player.aimAngle) * orbitRadius; 

        // --- EXECUTIONER AXE ---
        if (player.currentWeapon === WeaponType.EXECUTIONER_AXE) {
             const weaponReach = 48; 
             const axeX = handX + Math.cos(currentAngle) * weaponReach;
             const axeY = handY + Math.sin(currentAngle) * weaponReach;

             if (state.time % 2 === 0) {
                 createParticles(state, axeX, axeY, 1, '#334155');
             }

             const axeHitboxRadius = 40; 
             
             state.enemies.forEach(e => {
                 if (player.swingHitList.includes(e.id)) return; 

                 const dist = Math.sqrt((e.x + e.width/2 - axeX)**2 + (e.y + e.height/2 - axeY)**2);
                 if (dist < axeHitboxRadius) {
                     const dmgBuff = player.activeBuffs.find(b => b.type === ItemType.BUFF_DAMAGE);
                     const dmgMult = dmgBuff ? 1.5 : 1.0;
                     const comboMult = 1 + (player.combo * C.COMBO_DAMAGE_MULT_PER_STACK);
                     const baseDmg = player.stats.damage * weapon.damageMult;
                     const finalDmg = baseDmg * dmgMult * comboMult;
                     const isCrit = Math.random() < player.stats.critChance;

                     dealDamage(state, e, isCrit ? finalDmg * 2 : finalDmg, isCrit);
                     
                     // Gemini Protocol (Melee)
                     if (player.inventory['gemini_protocol'] && Math.random() < 0.3) {
                         // Double hit visual
                         createParticles(state, e.x, e.y, 5, '#818cf8');
                         dealDamage(state, e, isCrit ? finalDmg * 2 : finalDmg, isCrit);
                     }

                     const pushAngle = Math.atan2(e.y - player.y, e.x - player.x);
                     e.vx += Math.cos(pushAngle) * 3; 
                     e.vy += Math.sin(pushAngle) * 3;
                     
                     createParticles(state, e.x, e.y, 5, '#7f1d1d', pushAngle);
                     state.camera.shake = 8;
                     
                     player.swingHitList.push(e.id);
                     player.combo++;
                     player.comboTimer = C.COMBO_DECAY;
                 }
             });
        }
        // --- BLOOD BLADE & CURSED BLADE ---
        else if (player.currentWeapon === WeaponType.BLOOD_BLADE || player.currentWeapon === WeaponType.CURSED_BLADE) {
             const range = weapon.range;
             const numPoints = 5;
             const points: {x: number, y: number}[] = [];
             
             for(let i=1; i<=numPoints; i++) {
                 const d = (range / numPoints) * i;
                 points.push({
                     x: handX + Math.cos(currentAngle) * d,
                     y: handY + Math.sin(currentAngle) * d
                 });
             }

             state.enemies.forEach(e => {
                 if (player.swingHitList.includes(e.id)) return;

                 const ex = e.x + e.width/2;
                 const ey = e.y + e.height/2;
                 const eRadius = Math.max(e.width, e.height) / 2;

                 let hit = false;
                 for(const p of points) {
                     const dist = Math.sqrt((ex - p.x)**2 + (ey - p.y)**2);
                     if (dist < eRadius + 5) {
                         hit = true;
                         break;
                     }
                 }

                 if (hit) {
                     const dmgBuff = player.activeBuffs.find(b => b.type === ItemType.BUFF_DAMAGE);
                     const dmgMult = dmgBuff ? 1.5 : 1.0;
                     const comboMult = 1 + (player.combo * C.COMBO_DAMAGE_MULT_PER_STACK);
                     const baseDmg = player.stats.damage * weapon.damageMult;
                     const finalDmg = baseDmg * dmgMult * comboMult;
                     const isCrit = Math.random() < player.stats.critChance;

                     dealDamage(state, e, isCrit ? finalDmg * 2 : finalDmg, isCrit);

                     // Gemini Protocol (Melee)
                     if (player.inventory['gemini_protocol'] && Math.random() < 0.3) {
                         createParticles(state, e.x, e.y, 5, '#818cf8');
                         dealDamage(state, e, isCrit ? finalDmg * 2 : finalDmg, isCrit);
                     }
                     
                     const pushAngle = Math.atan2(e.y - player.y, e.x - player.x);
                     e.vx += Math.cos(pushAngle) * 1.5;
                     e.vy += Math.sin(pushAngle) * 1.5;
                     
                     createParticles(state, e.x, e.y, 3, weapon.color, pushAngle);
                     state.camera.shake = 4;
                     
                     player.swingHitList.push(e.id);
                     player.combo++;
                     player.comboTimer = C.COMBO_DECAY;
                 }
             });
        }

      } else {
        player.isAttacking = false;
      }
      
      if (inputs.has('MouseRight') && player.secondaryAbilityCooldown <= 0) {
          handleAbility(state, 'SECONDARY');
      } else if (inputs.has('MouseLeft') && player.attackCooldown <= 0) {
          handleAttack(state);
      }

      if (player.dashCooldown > 0) player.dashCooldown--;
      if (inputs.has('ShiftLeft') && player.dashCooldown <= 0) {
          player.isDashing = true;
          const cdr = Math.min(0.75, player.stats.cooldownReduction);
          player.dashCooldown = Math.ceil(C.DASH_COOLDOWN * (1 - cdr));
          
          player.invulnTimer = 20;
          
          // 15. Chrono Splitter
          if (player.inventory['chrono_splitter']) {
              spawnEcho(state, player.x + player.width/2, player.y + player.height/2, 2); 
              createParticles(state, player.x, player.y, 10, '#ffffff'); 
          }

          // Thunderstep Module
          if (player.inventory['thunderstep_module']) {
              const stacks = player.inventory['thunderstep_module'];
              for(let i=0; i<3 * stacks; i++) {
                 const angle = Math.random() * Math.PI * 2;
                 state.projectiles.push({
                     id: `thunder-${Math.random()}`, type: EntityType.PROJECTILE, ownerId: player.id,
                     x: player.x + player.width/2, y: player.y + player.height/2,
                     width: 8, height: 8,
                     vx: Math.cos(angle) * 10, vy: Math.sin(angle) * 10,
                     damage: 10 * stacks, color: '#facc15', lifeTime: 10, isDead: false, renderStyle: 'SHADOW_ARROW' // Re-use arrow for sharp look or create Lightning style
                 });
              }
              createParticles(state, player.x, player.y, 10, '#facc15');
          }

          const len = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
          if (len > 0.1) {
              player.vx = (player.vx / len) * C.PLAYER_DASH_FORCE;
              player.vy = (player.vy / len) * C.PLAYER_DASH_FORCE;
          } else {
              player.vx = Math.cos(player.aimAngle) * C.PLAYER_DASH_FORCE;
              player.vy = Math.sin(player.aimAngle) * C.PLAYER_DASH_FORCE;
          }
          createParticles(state, player.x, player.y, 8, '#ffffff');
      }
      resolveMapCollision(player, dungeon);
    } else {
        player.vx *= 0.9;
        player.vy *= 0.9;
        resolveMapCollision(player, dungeon);
        if (Math.sqrt(player.vx*player.vx + player.vy*player.vy) < 4) {
            player.isDashing = false;
        }
    }
    
    if (player.invulnTimer > 0) player.invulnTimer--;
    if (player.hitFlashTimer > 0) player.hitFlashTimer--;
};

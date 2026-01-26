
import { GameState, ItemType, WeaponType, EntityType, AbilityType } from '../types';
import * as C from '../constants';
import { handleAttack, handleAbility, nextFloor, dealDamage } from './eventHandlers';
import { resolveMapCollision, rectIntersect, getHurtbox, checkCircleRect } from './physics';
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
    
    if (!player.isSlashDashing && !player.isDashing) {
        player.facingX = Math.abs(player.aimAngle) > Math.PI / 2 ? -1 : 1;
    }

    // --- TIMERS ---
    if (player.interactionCooldown > 0) player.interactionCooldown--;
    if (player.dashCooldown > 0) player.dashCooldown--;
    if (player.invulnTimer > 0) player.invulnTimer--;
    if (player.hitFlashTimer > 0) player.hitFlashTimer--;

    // --- INTERACTION ---
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

    // --- ABILITIES ---
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

    // --- MOVEMENT STATE MACHINE ---

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
            const hurtbox = getHurtbox(e);
            if (checkCircleRect({x: axeHeadX, y: axeHeadY, r: hitboxRadius}, hurtbox) && (!e.swirlTimer || e.swirlTimer <= 0)) {
                const dmgMult = weaponConfig.secondary?.damageMult || 0.5;
                const damage = player.stats.damage * dmgMult;
                const isCrit = Math.random() < player.stats.critChance;
                
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

        // Movement Logic during spin
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
        // CURSED BLADE DASH LOGIC
        player.slashDashTimer--;
        if (state.time % 3 === 0) createParticles(state, player.x, player.y, 1, '#fbbf24');

        state.enemies.forEach(e => {
            if (e.hitFlashTimer <= 0 && rectIntersect(player, getHurtbox(e))) {
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
            player.isDashing = false; // Also clear generic dash flag
            player.vx *= 0.1;
            player.vy *= 0.1;
        }
    } else if (player.isDashing) {
        // STANDARD DASH LOGIC
        player.vx *= 0.92; // Less friction than walking for slide effect
        player.vy *= 0.92;

        const speed = Math.sqrt(player.vx*player.vx + player.vy*player.vy);
        if (speed < 4) {
            player.isDashing = false;
        }

        // Trail Visuals
        if (state.time % 3 === 0) {
             createParticles(state, player.x + player.width/2, player.y + player.height, 1, '#94a3b8');
        }
        
        // Thunderstep Module (Uncommon)
        if (player.inventory['thunderstep_module']) {
             if (state.time % 4 === 0) {
                 createParticles(state, player.x + player.width/2, player.y + player.height/2, 2, '#facc15');
             }
        }

        resolveMapCollision(player, dungeon);
        
    } else {
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
      
      // Sprint Check
      const isSprinting = inputs.has('ShiftLeft');
      const sprintMult = isSprinting ? C.SPRINT_SPEED_MULT : 1.0;

      const speed = player.stats.speed * sprintMult;
      player.vx += dx * speed * 0.2;
      player.vy += dy * speed * 0.2;
      player.vx *= C.FRICTION;
      player.vy *= C.FRICTION;

      // Sprint Particles
      if (isSprinting && (dx !== 0 || dy !== 0) && state.time % 5 === 0) {
          createParticles(state, player.x + player.width/2, player.y + player.height, 1, '#64748b'); // Dust
      }

      // --- DASH TRIGGER ---
      if (inputs.has('Space') && player.dashCooldown <= 0) {
          player.isDashing = true;
          player.dashCooldown = C.DASH_COOLDOWN;
          player.invulnTimer = 15; // 0.25s Invuln
          
          let dashDx = dx;
          let dashDy = dy;
          
          // Dash towards mouse if not moving
          if (dashDx === 0 && dashDy === 0) {
              dashDx = Math.cos(player.aimAngle);
              dashDy = Math.sin(player.aimAngle);
          }
          
          player.vx = dashDx * C.PLAYER_DASH_FORCE;
          player.vy = dashDy * C.PLAYER_DASH_FORCE;
          
          createParticles(state, player.x + player.width/2, player.y + player.height/2, 12, '#ffffff');
          state.camera.shake = 3;

          // Chrono Splitter (Legendary): Create Clone
          if (player.inventory['chrono_splitter']) {
              spawnEcho(state, player.x, player.y, 2); // Use Tier 2 Echo as clone
          }
          
          // Thunderstep (Uncommon): AoE Blast
          if (player.inventory['thunderstep_module']) {
              const range = 100;
              const dmg = player.stats.damage * 1.5;
              state.enemies.forEach(e => {
                  const dist = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
                  if (dist < range) {
                      dealDamage(state, e, dmg, false);
                      createParticles(state, e.x, e.y, 5, '#facc15');
                  }
              });
          }

          return; // Skip rest of movement logic
      }

      // Handle Attack Logic (Melee Hit Detection)
      if (player.attackCooldown > 0) {
        player.attackCooldown--;
        player.isAttacking = true;

        if (player.currentWeapon !== WeaponType.SHADOW_BOW) {
            const weapon = C.WEAPONS[player.currentWeapon];
            
            state.enemies.forEach(e => {
                if (player.swingHitList.includes(e.id)) return;
                
                const hurtbox = getHurtbox(e);
                const ecx = hurtbox.x + hurtbox.width/2;
                const ecy = hurtbox.y + hurtbox.height/2;
                
                const dx = ecx - (player.x + player.width/2);
                const dy = ecy - (player.y + player.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                const angle = Math.atan2(dy, dx);
                
                let angleDiff = angle - player.aimAngle;
                while(angleDiff > Math.PI) angleDiff -= Math.PI*2;
                while(angleDiff < -Math.PI) angleDiff += Math.PI*2;
                
                const hitDist = weapon.range + Math.max(e.width, e.height) * 0.5;
                
                if (dist < hitDist && Math.abs(angleDiff) < weapon.arc / 2) {
                     const dmgMult = 1.0; 
                     const damage = player.stats.damage * weapon.damageMult * dmgMult;
                     const isCrit = Math.random() < player.stats.critChance;
                     
                     dealDamage(state, e, damage, isCrit);
                     player.swingHitList.push(e.id);
                     
                     // Knockback
                     e.vx += Math.cos(angle) * 5;
                     e.vy += Math.sin(angle) * 5;
                     
                     createParticles(state, ecx, ecy, 3, '#ffffff');
                     state.camera.shake = 2;
                }
            });
        }
      } else {
          player.isAttacking = false;
      }

      // Start Attack
      if (inputs.has('MouseLeft') && player.attackCooldown <= 0) {
          handleAttack(state);
      }
      
      // Start Secondary
      if (inputs.has('MouseRight') && player.secondaryAbilityCooldown <= 0) {
          handleAbility(state, 'SECONDARY');
      }

      resolveMapCollision(player, dungeon);
    }
};

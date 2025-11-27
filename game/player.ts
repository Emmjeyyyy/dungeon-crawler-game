import { GameState, ItemType } from '../types';
import * as C from '../constants';
import { handleAttack, handleAbility, nextFloor, dealDamage } from './eventHandlers';
import { resolveMapCollision, rectIntersect } from './physics';
import { createParticles } from './spawners';
import { spawnDamageNumber } from './spawners';

export const updatePlayer = (state: GameState, inputs: Set<string>, mouse: {x: number, y: number}) => {
    const { player, dungeon } = state;

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
        // FIX: Replaced C.ItemType with ItemType, imported from ../types.
        if (state.interactionItem.itemType === ItemType.PORTAL) {
             nextFloor(state);
        }
        // FIX: Replaced C.ItemType with ItemType, imported from ../types.
        else if (state.interactionItem.itemType === ItemType.WEAPON_DROP) {
            const newWeapon = state.interactionItem.payload;
            player.currentWeapon = newWeapon;
            player.secondaryAbilityCooldown = 0;
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

    if (player.isSlashDashing) {
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
                state.hitStop = 2;
                e.vx += player.vx * 0.5;
                e.vy += player.vy * 0.5;
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
      let dx = 0; let dy = 0;
      if (inputs.has('KeyW')) dy -= 1;
      if (inputs.has('KeyS')) dy += 1;
      if (inputs.has('KeyA')) dx -= 1;
      if (inputs.has('KeyD')) dx += 1;

      if (dx !== 0 || dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len; dy /= len;
      }
      // FIX: Replaced C.ItemType with ItemType, imported from ../types.
      const speed = player.stats.speed * (player.activeBuffs.some(b => b.type === ItemType.BUFF_SPEED) ? 1.5 : 1.0);
      player.vx += dx * speed * 0.2;
      player.vy += dy * speed * 0.2;
      player.vx *= C.FRICTION;
      player.vy *= C.FRICTION;

      if (player.attackCooldown > 0) {
        player.attackCooldown--;
        player.isAttacking = true;
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
          player.dashCooldown = C.DASH_COOLDOWN;
          player.invulnTimer = 20;
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
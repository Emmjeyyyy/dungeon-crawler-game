

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, ItemType, WeaponType, AbilityType, Item, Inventory, EntityType, EnemyType } from '../types';
import * as stateManager from '../game/state';
import * as playerUpdater from '../game/player';
import * as enemyUpdater from '../game/enemy';
import * as entityUpdaters from '../game/entityUpdaters';
import * as dungeonManager from '../game/dungeon';
import * as cameraManager from '../game/camera';
import * as renderer from '../game/rendering';
import { createParticles } from '../game/spawners';
import * as C from '../constants';

export const useGameLoop = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  onLevelUp: () => void
) => {
  const gameState = useRef<GameState>(stateManager.createInitialState());
  const requestRef = useRef<number>(0);
  const inputRef = useRef<Set<string>>(new Set());
  const mouseRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  const [uiState, setUiState] = useState({
    hp: 100, maxHp: 100, xp: 0, maxXp: 100,
    level: 1, floor: 1, echoCount: 0, isGameOver: false, isPaused: false, isTestMode: false,
    activeAbility: AbilityType.SHADOW_CALL, activeAbilityCooldown: 0,
    secondaryAbility: null as AbilityType | null, secondaryAbilityCooldown: 0,
    combo: 0, activeBuffs: [] as {type: ItemType, timer: number}[],
    shadowStackCount: 0, interactionItem: null as Item | null,
    inventory: {} as Inventory, currentWeapon: WeaponType.BLOOD_BLADE
  });

  const togglePause = useCallback(() => {
      const state = gameState.current;
      if (!state.isGameOver && !state.pendingLevelUp) {
          state.isPaused = !state.isPaused;
          // Force UI update so Pause Menu renders
          setUiState(prev => ({...prev, isPaused: state.isPaused}));
      }
  }, []);

  useEffect(() => {
    const onKD = (e: KeyboardEvent) => {
        inputRef.current.add(e.code);
        if (e.code === 'Escape') {
            togglePause();
        }
    };
    const onKU = (e: KeyboardEvent) => inputRef.current.delete(e.code);
    const onMM = (e: MouseEvent) => {
      if (canvasRef.current) {
        const r = canvasRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: (e.clientX - r.left) * (canvasRef.current.width / r.width),
            y: (e.clientY - r.top) * (canvasRef.current.height / r.height)
        };
      }
    };
    const onMD = (e: MouseEvent) => inputRef.current.add(e.button === 0 ? 'MouseLeft' : 'MouseRight');
    const onMU = (e: MouseEvent) => inputRef.current.delete(e.button === 0 ? 'MouseLeft' : 'MouseRight');
    
    window.addEventListener('keydown', onKD);
    window.addEventListener('keyup', onKU);
    window.addEventListener('mousemove', onMM);
    window.addEventListener('mousedown', onMD);
    window.addEventListener('mouseup', onMU);
    window.addEventListener('contextmenu', e => e.preventDefault());

    return () => {
      window.removeEventListener('keydown', onKD);
      window.removeEventListener('keyup', onKU);
      window.removeEventListener('mousemove', onMM);
      window.removeEventListener('mousedown', onMD);
      window.removeEventListener('mouseup', onMU);
    };
  }, [canvasRef, togglePause]);

  const update = useCallback(() => {
    const state = gameState.current;
    if (state.isPaused || state.isGameOver || state.pendingLevelUp) return;

    if (state.hitStop > 0) {
      state.hitStop--;
      cameraManager.updateCamera(state);
      return;
    }

    state.time++;
    
    dungeonManager.updateDungeonState(state);
    playerUpdater.updatePlayer(state, inputRef.current, mouseRef.current);
    enemyUpdater.updateEnemies(state, onLevelUp);
    entityUpdaters.updateEchoes(state);
    entityUpdaters.updateProjectiles(state);
    entityUpdaters.updateItems(state);
    entityUpdaters.updateParticles(state);
    entityUpdaters.updateDamageNumbers(state);
    cameraManager.updateCamera(state);

    if (state.player.hp <= 0 && !state.isGameOver) {
        state.isGameOver = true;
    }

    setUiState({
        hp: state.player.hp, maxHp: state.player.maxHp,
        xp: state.player.xp, maxXp: state.player.maxXp,
        level: state.player.level, floor: state.dungeon.floor,
        echoCount: state.echoes.length,
        isGameOver: state.isGameOver, isPaused: state.isPaused, isTestMode: state.isTestMode,
        activeAbility: state.player.activeAbility,
        activeAbilityCooldown: state.player.abilityCooldown,
        secondaryAbility: null,
        secondaryAbilityCooldown: state.player.secondaryAbilityCooldown,
        combo: state.player.combo,
        activeBuffs: state.player.activeBuffs.map(b => ({type: b.type, timer: b.timer})),
        shadowStackCount: state.player.shadowStack.length,
        interactionItem: state.interactionItem,
        inventory: state.player.inventory,
        currentWeapon: state.player.currentWeapon
    });

  }, [onLevelUp]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderer.renderScene(ctx, gameState.current);
  }, [canvasRef]);

  const tick = useCallback(() => {
    update();
    draw();
    requestRef.current = requestAnimationFrame(tick);
  }, [update, draw]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(requestRef.current);
  }, [tick]);

  const applyUpgrade = (itemName: string) => {
      const { player } = gameState.current;
      if (!player.inventory[itemName]) player.inventory[itemName] = 0;
      player.inventory[itemName]++;
      stateManager.recalculateStats(player);
      gameState.current.pendingLevelUp = false;
  };

  const restartGame = () => {
      gameState.current = stateManager.createInitialState();
      setUiState(prev => ({...prev, isGameOver: false, isPaused: false, isTestMode: false}));
  };

  const enterTestMode = () => {
      gameState.current = stateManager.createTestState();
      setUiState(prev => ({...prev, isGameOver: false, isPaused: false, isTestMode: true}));
  };

  // DEBUG ACTIONS
  const debugSpawnEnemy = (type: EnemyType) => {
      const state = gameState.current;
      const ex = state.player.x + (Math.random() - 0.5) * 300;
      const ey = state.player.y + (Math.random() - 0.5) * 300;
      
      let scale = 1;
      let hp = 100;
      let color = C.COLORS.enemyStandard;
      
      if (type === EnemyType.ELITE) { scale = 1.5; hp = 200; color = C.COLORS.enemyElite; }
      else if (type === EnemyType.BOSS) { scale = 2.0; hp = 1000; color = C.COLORS.enemyBoss; }
      else if (type === EnemyType.MYSTIC) { color = C.COLORS.enemyMystic; }

      const w = 18 * scale;
      const h = 18 * scale;

      state.enemies.push({
          id: `enemy-${Math.random()}`,
          type: EntityType.ENEMY,
          enemyType: type,
          x: ex, y: ey,
          width: w, height: h,
          vx: 0, vy: 0,
          facingX: 1, facingY: 0,
          color: color,
          isDead: false,
          hp, maxHp: hp,
          damage: 10,
          attackCooldown: 0,
          maxAttackCooldown: 60,
          targetId: null,
          xpValue: 100,
          agroRange: 2000,
          hitFlashTimer: 0,
          scale,
          bleedStack: 0,
          bleedTimer: 0
      });
      createParticles(state, ex, ey, 10, '#ffffff');
  };

  const debugSetWeapon = (weapon: WeaponType) => {
      const state = gameState.current;
      state.player.currentWeapon = weapon;
  };

  const debugTriggerLevelUp = () => {
      const state = gameState.current;
      state.pendingLevelUp = true;
      onLevelUp();
  };

  return { 
      uiState, applyUpgrade, restartGame, togglePause, enterTestMode,
      debugSpawnEnemy, debugSetWeapon, debugTriggerLevelUp
  };
};
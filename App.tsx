
import React, { useRef, useState, useCallback } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import GameCanvas from './components/GameCanvas';
import HUD from './components/UI/HUD';
import UpgradeModal from './components/UI/UpgradeModal';
import DebugMenu from './components/UI/DebugMenu';
import { Play, RotateCcw, Pause, LogOut, Skull, BookOpen, Crown } from 'lucide-react';
import { GameMode } from './types';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const onLevelUp = useCallback(() => setShowLevelUp(true), []);
  
  const { 
      uiState, applyUpgrade, startGame, restartGame, togglePause, enterTestMode,
      debugSpawnEnemy, debugSetWeapon, debugTriggerLevelUp, debugReset,
      debugToggleGodMode, debugToggleNoCooldowns, debugAddItem
  } = useGameLoop(canvasRef, onLevelUp);

  const handleStart = (mode: GameMode) => {
      setGameStarted(true);
      startGame(mode);
  };

  const handleUpgrade = (fn: any) => {
      applyUpgrade(fn);
      setShowLevelUp(false);
  };

  const handleQuit = () => {
      setGameStarted(false);
      setSecretCode('');
      // Reset logic handled in startGame next time
  };

  const handleSecretCode = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          if (secretCode === 'ASDASD') {
              setGameStarted(true);
              enterTestMode();
              setSecretCode('');
          }
      }
  };

  return (
    <div className="w-full h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden select-none">
      
      <div className="relative shadow-2xl shadow-red-900/20">
        <GameCanvas ref={canvasRef} />
        
        {gameStarted && !uiState.isGameOver && !uiState.isGameWon && <HUD {...uiState} />}
        
        {/* Debug UI */}
        {gameStarted && uiState.isTestMode && !uiState.isPaused && (
            <DebugMenu 
                onSpawnEnemy={debugSpawnEnemy}
                onSetWeapon={debugSetWeapon}
                onLevelUp={debugTriggerLevelUp}
                onReset={debugReset}
                cheats={uiState.cheats}
                onToggleGodMode={debugToggleGodMode}
                onToggleNoCooldowns={debugToggleNoCooldowns}
                onAddItem={debugAddItem}
            />
        )}

        {/* Start Screen / Main Menu */}
        {!gameStarted && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
                <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 tracking-tighter drop-shadow-lg">
                        BLOOD ECHOES
                    </h1>
                    <p className="text-slate-500 text-xl tracking-[0.5em] uppercase mt-2">Roguelite Dungeon Crawler</p>
                </div>
                
                <div className="flex gap-8 mb-8">
                    {/* Story Mode */}
                    <button 
                        onClick={() => handleStart(GameMode.STORY)}
                        className="group relative w-64 h-80 bg-slate-900 border border-slate-800 hover:border-red-500 rounded-lg transition-all overflow-hidden flex flex-col hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                        <div className="h-2/3 bg-red-950/20 group-hover:bg-red-900/30 transition-colors flex items-center justify-center">
                            <BookOpen size={48} className="text-red-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="relative z-20 p-6 text-left">
                            <h3 className="text-2xl font-black text-white italic mb-1">STORY</h3>
                            <div className="h-0.5 w-8 bg-red-500 mb-2"></div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Ascend the Spire. Defeat the Curator. A curated gauntlet.
                            </p>
                        </div>
                    </button>

                    {/* Endless Mode */}
                    <button 
                        onClick={() => handleStart(GameMode.ENDLESS)}
                        className="group relative w-64 h-80 bg-slate-900 border border-slate-800 hover:border-purple-500 rounded-lg transition-all overflow-hidden flex flex-col hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80 z-10"></div>
                        <div className="h-2/3 bg-purple-950/20 group-hover:bg-purple-900/30 transition-colors flex items-center justify-center">
                            <Skull size={48} className="text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="relative z-20 p-6 text-left">
                            <h3 className="text-2xl font-black text-white italic mb-1">ENDLESS</h3>
                            <div className="h-0.5 w-8 bg-purple-500 mb-2"></div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Infinite floors. Escalating difficulty. How deep can you go?
                            </p>
                        </div>
                    </button>
                </div>

                <div className="absolute bottom-8 right-8 opacity-20 hover:opacity-100 transition-opacity flex flex-col items-end">
                    <label className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Developer Access</label>
                    <input 
                        type="password"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        onKeyDown={handleSecretCode}
                        className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 text-xs rounded focus:border-red-500 outline-none w-32 text-right"
                        placeholder="Passcode"
                    />
                </div>
            </div>
        )}

        {/* Pause Menu */}
        {gameStarted && uiState.isPaused && !uiState.isGameOver && !uiState.isGameWon && (
             <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in">
                 <h2 className="text-4xl font-black text-white mb-8 uppercase tracking-widest flex items-center gap-4">
                     <Pause size={32} /> PAUSED
                 </h2>
                 <div className="flex flex-col gap-4 min-w-[200px]">
                     <button 
                        onClick={togglePause}
                        className="px-8 py-3 bg-red-700 text-white font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Play size={18} fill="currentColor" /> RESUME
                    </button>
                    <button 
                        onClick={handleQuit}
                        className="px-8 py-3 bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> MAIN MENU
                    </button>
                 </div>
             </div>
        )}

        {/* Game Over */}
        {gameStarted && uiState.isGameOver && (
             <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-in fade-in">
                 <h2 className="text-6xl font-black text-red-600 mb-8 uppercase tracking-widest">Slain</h2>
                 <div className="flex gap-12 text-center mb-12">
                     <div>
                         <div className="text-slate-500 uppercase text-xs">Floor Reached</div>
                         <div className="text-4xl font-mono text-white">{uiState.floor}</div>
                     </div>
                     <div>
                         <div className="text-slate-500 uppercase text-xs">Level</div>
                         <div className="text-4xl font-mono text-white">{uiState.level}</div>
                     </div>
                 </div>
                 <div className="flex gap-4">
                    <button 
                        onClick={restartGame}
                        className="px-8 py-3 bg-white text-black font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        <RotateCcw size={18} /> RESTART RUN
                    </button>
                    <button 
                        onClick={handleQuit}
                        className="px-8 py-3 bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> MENU
                    </button>
                 </div>
             </div>
        )}

        {/* Victory Screen */}
        {gameStarted && uiState.isGameWon && (
             <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-in fade-in">
                 <div className="mb-6 text-amber-500 animate-pulse">
                     <Crown size={80} />
                 </div>
                 <h2 className="text-6xl font-black text-amber-500 mb-4 uppercase tracking-widest">Victory</h2>
                 <p className="text-slate-400 text-lg mb-8 max-w-md text-center">
                     The Curator has fallen. The Spire is silent. You have ascended.
                 </p>
                 <div className="flex gap-12 text-center mb-12 border-t border-b border-slate-800 py-8 w-full max-w-2xl justify-center">
                     <div>
                         <div className="text-slate-500 uppercase text-xs">Level Achieved</div>
                         <div className="text-4xl font-mono text-white">{uiState.level}</div>
                     </div>
                     <div>
                         <div className="text-slate-500 uppercase text-xs">Echoes Collected</div>
                         <div className="text-4xl font-mono text-white">{uiState.xp * 5}</div> {/* Simple score metric */}
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <button 
                        onClick={restartGame}
                        className="px-8 py-3 bg-amber-600 text-white font-bold hover:bg-amber-500 transition-colors flex items-center gap-2"
                    >
                        <RotateCcw size={18} /> PLAY AGAIN
                    </button>
                    <button 
                        onClick={handleQuit}
                        className="px-8 py-3 bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> MENU
                    </button>
                 </div>
             </div>
        )}

        {showLevelUp && <UpgradeModal onSelect={handleUpgrade} />}
      </div>
    </div>
  );
};

export default App;

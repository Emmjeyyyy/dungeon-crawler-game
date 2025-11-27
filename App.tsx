
import React, { useRef, useState, useCallback } from 'react';
import { useGameLoop } from './hooks/useGameLoop';
import GameCanvas from './components/GameCanvas';
import HUD from './components/UI/HUD';
import UpgradeModal from './components/UI/UpgradeModal';
import DebugMenu from './components/UI/DebugMenu';
import { Play, RotateCcw, Pause, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [secretCode, setSecretCode] = useState('');

  const onLevelUp = useCallback(() => setShowLevelUp(true), []);
  
  const { 
      uiState, applyUpgrade, restartGame, togglePause, enterTestMode,
      debugSpawnEnemy, debugSetWeapon, debugTriggerLevelUp 
  } = useGameLoop(canvasRef, onLevelUp);

  const handleStart = () => {
      setGameStarted(true);
      restartGame();
  };

  const handleUpgrade = (fn: any) => {
      applyUpgrade(fn);
      setShowLevelUp(false);
  };

  const handleQuit = () => {
      restartGame();
      setGameStarted(false);
      setSecretCode('');
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
        
        {gameStarted && !uiState.isGameOver && <HUD {...uiState} />}
        
        {/* Debug UI */}
        {gameStarted && uiState.isTestMode && !uiState.isPaused && (
            <DebugMenu 
                onSpawnEnemy={debugSpawnEnemy}
                onSetWeapon={debugSetWeapon}
                onLevelUp={debugTriggerLevelUp}
            />
        )}

        {/* Start Screen */}
        {!gameStarted && (
            <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
                <div className="text-center mb-12 animate-in fade-in zoom-in duration-700">
                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-500 to-red-900 tracking-tighter drop-shadow-lg">
                        BLOOD ECHOES
                    </h1>
                    <p className="text-slate-500 text-xl tracking-[0.5em] uppercase mt-2">Roguelite Dungeon Crawler</p>
                </div>
                
                <button 
                    onClick={handleStart}
                    className="group relative px-12 py-4 bg-red-700 hover:bg-red-600 text-white font-bold text-xl rounded-sm transition-all overflow-hidden mb-8"
                >
                    <div className="absolute inset-0 bg-red-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <span className="relative flex items-center gap-2">
                        <Play fill="currentColor" /> ENTER THE SPIRE
                    </span>
                </button>

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
        {gameStarted && uiState.isPaused && !uiState.isGameOver && (
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
                 <button 
                    onClick={restartGame}
                    className="px-8 py-3 bg-white text-black font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                    <RotateCcw size={18} /> RESTART RUN
                </button>
             </div>
        )}

        {showLevelUp && <UpgradeModal onSelect={handleUpgrade} />}
      </div>
    </div>
  );
};

export default App;

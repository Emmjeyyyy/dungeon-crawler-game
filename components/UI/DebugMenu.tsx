
import React, { useState } from 'react';
import { EnemyType, WeaponType } from '../../types';
import { Bug, Sword, Skull, Zap, RotateCcw, Shield, Clock, Package } from 'lucide-react';
import { WEAPONS } from '../../constants';
import DebugItemBrowser from './DebugItemBrowser';

interface DebugMenuProps {
  onSpawnEnemy: (type: EnemyType) => void;
  onSetWeapon: (weapon: WeaponType) => void;
  onLevelUp: () => void;
  onReset: () => void;
  cheats: { godMode: boolean; noCooldowns: boolean };
  onToggleGodMode: () => void;
  onToggleNoCooldowns: () => void;
  onAddItem: (itemId: string) => void;
}

const DebugMenu: React.FC<DebugMenuProps> = ({ 
    onSpawnEnemy, onSetWeapon, onLevelUp, onReset,
    cheats, onToggleGodMode, onToggleNoCooldowns, onAddItem
}) => {
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType>(EnemyType.STANDARD);
  const [showItemBrowser, setShowItemBrowser] = useState(false);

  return (
    <>
        <div className="absolute top-20 right-4 w-72 bg-slate-900/90 border border-amber-500/30 text-slate-200 p-4 rounded-lg backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-right font-mono z-50 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 text-amber-500 font-bold border-b border-amber-500/20 pb-2">
                <Bug size={18} /> DEVELOPER CONSOLE
            </div>

            {/* Cheats */}
            <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">Cheats</label>
                <div className="flex flex-col gap-2">
                    <button 
                        onClick={onToggleGodMode}
                        className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold border transition-colors ${cheats.godMode ? 'bg-amber-900/50 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                        <Shield size={14} />
                        GOD MODE: {cheats.godMode ? 'ON' : 'OFF'}
                    </button>
                    <button 
                        onClick={onToggleNoCooldowns}
                        className={`flex items-center gap-2 px-3 py-2 rounded text-xs font-bold border transition-colors ${cheats.noCooldowns ? 'bg-amber-900/50 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                        <Clock size={14} />
                        NO COOLDOWNS: {cheats.noCooldowns ? 'ON' : 'OFF'}
                    </button>
                     <button 
                        onClick={() => setShowItemBrowser(true)}
                        className="flex items-center gap-2 px-3 py-2 rounded text-xs font-bold border bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white transition-colors"
                    >
                        <Package size={14} />
                        BROWSE ITEMS
                    </button>
                </div>
            </div>

            {/* Spawn Enemy */}
            <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">Spawn Entity</label>
                <div className="flex gap-2 mb-2">
                    <select 
                        value={selectedEnemy}
                        onChange={(e) => setSelectedEnemy(e.target.value as EnemyType)}
                        className="flex-1 bg-black border border-slate-700 rounded text-xs px-2 py-1 outline-none focus:border-amber-500"
                    >
                        {Object.values(EnemyType).map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                    <button 
                        onClick={() => onSpawnEnemy(selectedEnemy)}
                        className="bg-amber-900/50 hover:bg-amber-800 text-amber-500 border border-amber-800 p-1.5 rounded transition-colors"
                    >
                        <Skull size={14} />
                    </button>
                </div>
            </div>

            {/* Weapons */}
            <div className="mb-6">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block mb-2">Equip Weapon</label>
                <div className="grid grid-cols-2 gap-2">
                    {Object.values(WeaponType).map(w => (
                        <button
                            key={w}
                            onClick={() => onSetWeapon(w)}
                            className="text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 py-1 px-2 rounded truncate transition-all text-left flex items-center gap-2"
                        >
                            <Sword size={10} className="text-slate-400" />
                            {WEAPONS[w].name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 block">Global Actions</label>
                <button 
                    onClick={onLevelUp}
                    className="w-full bg-cyan-900/30 hover:bg-cyan-900/50 border border-cyan-800 hover:border-cyan-500 text-cyan-400 text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                >
                    <Zap size={14} /> FORCE LEVEL UP
                </button>
                <button 
                    onClick={onReset}
                    className="w-full bg-red-900/30 hover:bg-red-900/50 border border-red-800 hover:border-red-500 text-red-400 text-xs font-bold py-2 rounded transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCcw size={14} /> RESET TEST ENV
                </button>
            </div>
        </div>

        {showItemBrowser && (
            <DebugItemBrowser 
                onClose={() => setShowItemBrowser(false)}
                onAddItem={onAddItem}
            />
        )}
    </>
  );
};

export default DebugMenu;



import React from 'react';
import { Heart, Ghost, Sword, Map, Wind, MousePointer2, RefreshCw, DoorOpen, Zap } from 'lucide-react';
import { AbilityType, ItemType, Item, WeaponType, Inventory } from '../../types';
import { WEAPONS, PASSIVE_ITEMS } from '../../constants';

interface HUDProps {
  hp: number;
  maxHp: number;
  xp: number;
  maxXp: number;
  level: number;
  floor: number;
  echoCount: number;
  activeAbility: AbilityType;
  secondaryAbility: AbilityType | null;
  secondaryAbilityCooldown: number;
  combo: number;
  activeBuffs: {type: ItemType, timer: number}[];
  shadowStackCount?: number;
  interactionItem: Item | null;
  inventory: Inventory;
  currentWeapon: WeaponType;
}

const HUD: React.FC<HUDProps> = ({ 
  hp, maxHp, xp, maxXp, level, floor, echoCount,
  secondaryAbilityCooldown, combo, activeBuffs, shadowStackCount = 0,
  interactionItem, inventory, currentWeapon
}) => {
  const hpPercent = (hp / maxHp) * 100;
  const xpPercent = (xp / maxXp) * 100;

  // Derive secondary ability config from current weapon
  const weaponConfig = WEAPONS[currentWeapon];
  const secondaryConfig = weaponConfig.secondary;

  return (
    <div className="absolute top-0 left-0 w-full h-full p-6 pointer-events-none flex flex-col justify-between font-sans">
      
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Vitals */}
        <div className="w-80">
            {/* HP */}
            <div className="bg-slate-900/90 rounded-sm p-1 border border-slate-800 shadow-xl mb-2 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-red-500 font-bold mb-1 px-1 text-sm tracking-wider">
                    <Heart size={14} fill="currentColor" />
                    <span>{Math.ceil(hp)} / {Math.ceil(maxHp)}</span>
                </div>
                <div className="h-3 bg-black rounded-sm overflow-hidden relative">
                    <div className="absolute inset-0 bg-red-900/30"></div>
                    <div 
                        className="h-full bg-gradient-to-r from-red-800 to-red-600 transition-all duration-200"
                        style={{ width: `${Math.max(0, hpPercent)}%` }}
                    />
                </div>
            </div>

            {/* XP */}
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-lg shadow-lg">
                    {level}
                </div>
                <div className="flex-1 h-1.5 bg-black rounded-full overflow-hidden border border-slate-800">
                    <div 
                        className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-300"
                        style={{ width: `${Math.max(0, xpPercent)}%` }}
                    />
                </div>
            </div>
        </div>

        {/* Center: Location */}
        <div className="bg-gradient-to-b from-slate-900/80 to-transparent px-8 py-3 rounded-b-xl border-x border-b border-slate-800 flex flex-col items-center backdrop-blur-md">
            <div className="flex items-center gap-2 text-amber-500 font-black uppercase tracking-[0.2em] text-sm">
                <Map size={14} /> Floor {floor}
            </div>
            <div className="text-slate-500 text-[10px] tracking-widest mt-1 uppercase opacity-70">Sanctum of Echoes</div>
        </div>

        {/* Right: Resources (Echoes only now) */}
        <div className="flex flex-col items-end gap-2 max-w-md">
            {/* Active Echoes */}
            <div className="bg-slate-900/90 px-4 py-2 rounded border border-slate-800 flex items-center gap-4 shadow-lg backdrop-blur-sm group/echo mb-2">
                <div className="text-right">
                    <div className="text-[10px] text-cyan-500 uppercase tracking-wider font-bold">Active Echoes</div>
                    <div className="text-2xl font-black text-white leading-none">{echoCount}</div>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 blur opacity-20 group-hover/echo:opacity-40 transition-opacity"></div>
                    <Ghost className="text-cyan-400 relative z-10" size={24} />
                </div>
            </div>
        </div>
      </div>

      {/* Combo Display */}
      {combo > 0 && (
          <div className="absolute top-1/3 left-12 animate-in slide-in-from-left duration-300 pointer-events-none">
              <div 
                className="text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-red-600 drop-shadow-[0_5px_5px_rgba(0,0,0,1)]" 
                style={{ transform: `skew(-10deg) scale(${1 + Math.min(combo, 50)/150})` }}
              >
                  {combo}x
              </div>
              <div className="text-white font-mono tracking-[0.5em] text-sm uppercase bg-red-600 px-3 py-1 inline-block transform -skew-x-12 shadow-lg">
                  COMBO
              </div>
          </div>
      )}

      {/* Interaction Prompt (Swap) */}
      {interactionItem && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom duration-300 pointer-events-none">
              <div className="bg-slate-900/95 border border-amber-500/50 rounded-lg p-4 shadow-2xl flex items-center gap-6 backdrop-blur-md">
                  
                  {interactionItem.itemType !== ItemType.PORTAL ? (
                    <>
                        {/* Current */}
                        <div className="flex flex-col items-center opacity-50 scale-90">
                            <div className="w-10 h-10 rounded bg-slate-800 border border-slate-600 flex items-center justify-center mb-1 text-slate-400">
                                <RefreshCw size={18} />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 max-w-[80px] text-center truncate">
                                Current
                            </span>
                        </div>

                        <div className="flex flex-col items-center gap-1">
                            <RefreshCw size={24} className="text-amber-500 animate-spin-slow" />
                            <div className="bg-white text-black font-black text-xs px-2 py-0.5 rounded">PRESS E</div>
                        </div>

                        {/* New */}
                        <div className="flex flex-col items-center scale-110">
                            <div className="w-12 h-12 rounded bg-amber-900/30 border-2 border-amber-500 flex items-center justify-center mb-1 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                <Sword size={24} className="text-amber-500" />
                            </div>
                            <span className="text-xs uppercase font-bold text-amber-500 max-w-[100px] text-center">
                                {WEAPONS[interactionItem.payload as WeaponType].name}
                            </span>
                        </div>
                    </>
                  ) : (
                    // Portal Prompt
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-14 h-14 rounded-full bg-violet-900/40 border-2 border-violet-500 flex items-center justify-center animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                                <DoorOpen size={32} className="text-violet-300" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <div className="text-xl font-black text-violet-400 tracking-widest">DESCEND</div>
                             <div className="flex items-center gap-2">
                                 <div className="bg-white text-black font-black text-[10px] px-1.5 py-0.5 rounded">PRESS E</div>
                                 <span className="text-[10px] text-violet-300 uppercase">To Next Floor</span>
                             </div>
                        </div>
                    </div>
                  )}

              </div>
          </div>
      )}

      {/* Bottom Bar */}
      <div className="flex justify-between items-end w-full">
          
          {/* Left: Inventory & Buffs */}
          <div className="flex flex-col gap-4 items-start">
             {/* Inventory Strip (Moved here, RoR Style) */}
             <div className="flex flex-wrap gap-1 pointer-events-auto max-w-lg">
                {Object.entries(inventory).map(([itemId, stack]) => {
                    const itemDef = PASSIVE_ITEMS.find(i => i.id === itemId);
                    if (!itemDef) return null;
                    const borderColor = itemDef.rarity === 'COMMON' ? 'border-slate-500' : (itemDef.rarity === 'UNCOMMON' ? 'border-green-500' : 'border-red-500');
                    const bgClass = itemDef.rarity === 'COMMON' ? 'bg-slate-900' : (itemDef.rarity === 'UNCOMMON' ? 'bg-green-950' : 'bg-red-950');
                    
                    return (
                        <div key={itemId} className={`w-10 h-10 ${bgClass} border-2 ${borderColor} rounded relative shadow-md group/item transition-transform hover:scale-110`}>
                            {/* Icon - USING EMOJI */}
                            <div className="w-full h-full flex items-center justify-center overflow-hidden p-0.5">
                                <span className="text-lg leading-none filter drop-shadow-md select-none">{itemDef.icon}</span>
                            </div>
                            <div className="absolute -top-1 -right-1 bg-black text-white text-[9px] font-bold px-1 rounded border border-slate-700 shadow">
                                x{stack}
                            </div>
                            
                            {/* Tooltip (Positioned Above) */}
                            <div className="absolute bottom-full left-0 mb-2 w-52 bg-slate-900/95 border border-slate-600 p-3 rounded z-50 hidden group-hover/item:block backdrop-blur-sm shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                <div className={`text-xs font-bold mb-1 uppercase tracking-wide ${itemDef.rarity === 'COMMON' ? 'text-white' : (itemDef.rarity === 'UNCOMMON' ? 'text-green-400' : 'text-red-500')}`}>
                                    {itemDef.name}
                                </div>
                                <div className="text-[10px] text-slate-300 leading-tight">{itemDef.description}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Buffs */}
            <div className="flex gap-4">
                {activeBuffs.map((buff, i) => (
                    <div key={i} className="flex flex-col items-center animate-in fade-in slide-in-from-bottom duration-500">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 bg-slate-950 shadow-lg ${buff.type === ItemType.BUFF_DAMAGE ? 'border-red-900 text-red-500' : 'border-blue-900 text-blue-500'}`}>
                            {buff.type === ItemType.BUFF_DAMAGE ? <Sword size={20} /> : <Wind size={20} />}
                        </div>
                        <div className="h-1 w-full bg-slate-900 mt-1 rounded overflow-hidden border border-slate-800">
                            <div className={`h-full transition-all ${buff.type === ItemType.BUFF_DAMAGE ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(buff.timer / 600) * 100}%` }} />
                        </div>
                    </div>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
              
              {/* Weapon Slot */}
              <div className="flex flex-col items-end mr-4">
                  <div className="w-16 h-16 bg-slate-900 rounded-lg border-2 border-slate-500 flex items-center justify-center overflow-hidden shadow-lg relative">
                       <div className="absolute top-1 left-1 w-2 h-2 bg-slate-500 rounded-full"></div>
                       <Sword size={32} style={{ color: WEAPONS[currentWeapon].color }} />
                       <div className="absolute bottom-0 w-full bg-black/70 text-[8px] text-center text-white py-0.5 uppercase tracking-wider font-bold">
                           {WEAPONS[currentWeapon].name}
                       </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                      <MousePointer2 size={10} /> L-CLICK
                  </div>
              </div>

              {/* Secondary Ability (Right Click) - DYNAMIC FROM WEAPON */}
              <div className="flex flex-col items-end">
                  <div className={`relative w-12 h-12 bg-slate-900 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all border-amber-500`}>
                       {/* Icon / Info */}
                       <Zap size={20} style={{ color: secondaryConfig?.color || '#fff' }} />
                       {secondaryAbilityCooldown > 0 && (
                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                               {Math.ceil(secondaryAbilityCooldown / 60)}
                           </div>
                       )}
                       {/* Tooltip on hover if needed, or just label */}
                       <div className="absolute bottom-0 w-full bg-black/70 text-[6px] text-center text-white py-0.5 uppercase tracking-wider font-bold truncate px-1">
                           {secondaryConfig?.name}
                       </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
                      <MousePointer2 size={10} className="scale-x-[-1]" /> R-CLICK
                  </div>
              </div>

              {/* Primary Ability Widget: Shadow Stack */}
              <div className="flex items-center gap-4 bg-slate-900/95 p-1 pr-4 rounded-full border border-slate-800 shadow-2xl relative overflow-hidden">
                  <div className={`relative w-16 h-16 bg-black rounded-full border-4 overflow-hidden flex items-center justify-center group/echo ${shadowStackCount > 0 ? 'border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.5)]' : 'border-slate-700'}`}>
                      {/* Background Pulse if ready */}
                      {shadowStackCount > 0 && (
                          <div className="absolute inset-0 bg-cyan-900/50 animate-pulse"></div>
                      )}
                      
                      {/* Count */}
                      <span className={`relative z-10 text-3xl font-black ${shadowStackCount > 0 ? 'text-white drop-shadow-[0_0_5px_cyan]' : 'text-slate-600'}`}>
                          {shadowStackCount}
                      </span>
                  </div>
                  <div className="text-right">
                      <div className="text-white font-bold text-sm tracking-wide uppercase">Shadow Call</div>
                      <div className="text-[10px] text-cyan-400 font-mono">
                          {shadowStackCount > 0 ? 'READY TO SUMMON [Q]' : 'KILL TO CHARGE'}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default HUD;
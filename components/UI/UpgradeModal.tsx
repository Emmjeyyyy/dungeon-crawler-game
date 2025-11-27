

import React, { useMemo } from 'react';
import { PASSIVE_ITEMS } from '../../constants';
import { ItemRarity, PassiveItem } from '../../types';

interface UpgradeModalProps {
  onSelect: (itemName: string) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onSelect }) => {
  const options = useMemo(() => {
    // Weighted Random Selection
    const rollRarity = () => {
        const r = Math.random();
        if (r > 0.90) return ItemRarity.LEGENDARY;
        if (r > 0.65) return ItemRarity.UNCOMMON;
        return ItemRarity.COMMON;
    };

    const selected: PassiveItem[] = [];
    for(let i=0; i<3; i++) {
        const targetRarity = rollRarity();
        const pool = PASSIVE_ITEMS.filter(item => item.rarity === targetRarity);
        const item = pool[Math.floor(Math.random() * pool.length)];
        selected.push(item);
    }
    return selected;
  }, []);

  const getRarityColor = (r: ItemRarity) => {
      switch(r) {
          case ItemRarity.COMMON: return 'border-slate-400 text-slate-200';
          case ItemRarity.UNCOMMON: return 'border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]';
          case ItemRarity.LEGENDARY: return 'border-red-600 text-red-500 shadow-[0_0_25px_rgba(220,38,38,0.4)]';
      }
  };

  const getRarityBg = (r: ItemRarity) => {
      switch(r) {
          case ItemRarity.COMMON: return 'bg-slate-800';
          case ItemRarity.UNCOMMON: return 'bg-green-950/40';
          case ItemRarity.LEGENDARY: return 'bg-red-950/40';
      }
  };

  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="max-w-5xl w-full p-8">
        <div className="text-center mb-12">
            <h2 className="text-5xl font-black text-white mb-2 font-mono uppercase tracking-[0.2em] drop-shadow-xl">
                Cargo Secured
            </h2>
            <div className="h-1 w-64 bg-gradient-to-r from-transparent via-white to-transparent mx-auto"></div>
            <p className="text-slate-400 mt-4 tracking-widest text-sm uppercase">Select an artifact to integrate</p>
        </div>
        
        <div className="grid grid-cols-3 gap-8">
          {options.map((opt, idx) => (
            <button
                key={opt.id + idx}
                onClick={() => onSelect(opt.id)}
                className={`group relative border-2 ${getRarityColor(opt.rarity)} ${getRarityBg(opt.rarity)} p-1 rounded-xl transition-all hover:-translate-y-4 hover:scale-105 duration-300 overflow-hidden`}
            >
                {/* Card Shine */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                <div className="bg-slate-900/90 h-full w-full rounded-lg p-6 flex flex-col items-center gap-6 relative z-10">
                    
                    {/* Icon Container - USING EMOJI */}
                    <div className={`w-24 h-24 rounded-full border-4 ${getRarityColor(opt.rarity)} flex items-center justify-center bg-black/50 group-hover:bg-black/80 transition-colors`}>
                        <div className={`text-5xl filter drop-shadow-lg ${opt.rarity === 'LEGENDARY' ? 'animate-pulse' : ''}`}>
                            {opt.icon}
                        </div>
                    </div>

                    <div className="text-center">
                        <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${opt.rarity === 'LEGENDARY' ? 'text-red-500' : (opt.rarity === 'UNCOMMON' ? 'text-green-400' : 'text-slate-400')}`}>
                            {opt.rarity}
                        </div>
                        <h3 className="text-2xl font-black text-white mb-4 leading-none">{opt.name}</h3>
                        <p className="text-slate-300 text-sm leading-relaxed border-t border-slate-700 pt-4">
                            {opt.description}
                        </p>
                    </div>
                </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
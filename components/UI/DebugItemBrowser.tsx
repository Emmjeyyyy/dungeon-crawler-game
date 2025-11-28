
import React from 'react';
import { PASSIVE_ITEMS } from '../../constants';
import { ItemRarity } from '../../types';
import { X } from 'lucide-react';

interface DebugItemBrowserProps {
  onClose: () => void;
  onAddItem: (itemId: string) => void;
}

const DebugItemBrowser: React.FC<DebugItemBrowserProps> = ({ onClose, onAddItem }) => {
  
  const getRarityColor = (r: ItemRarity) => {
      switch(r) {
          case ItemRarity.COMMON: return 'text-slate-200 border-slate-500';
          case ItemRarity.UNCOMMON: return 'text-green-400 border-green-500';
          case ItemRarity.LEGENDARY: return 'text-red-500 border-red-500';
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-8 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-5xl w-full max-h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Item Browser</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>
            
            <div className="p-4 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {PASSIVE_ITEMS.map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => onAddItem(item.id)}
                        className={`group flex items-start gap-3 p-3 bg-slate-950/50 border rounded-lg hover:bg-slate-800 transition-all text-left ${getRarityColor(item.rarity)}`}
                    >
                        <div className="text-3xl bg-black/40 w-12 h-12 flex items-center justify-center rounded border border-inherit">
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">{item.name}</div>
                            <div className="text-[10px] text-slate-400 leading-tight mt-1 line-clamp-2">
                                {item.description}
                            </div>
                            <div className="text-[9px] font-mono mt-2 opacity-50 uppercase">{item.rarity}</div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-2 border-t border-slate-700 text-center text-[10px] text-slate-500 uppercase tracking-widest">
                Click to add item to inventory
            </div>
        </div>
    </div>
  );
};

export default DebugItemBrowser;

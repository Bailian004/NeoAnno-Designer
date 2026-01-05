import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PlacedBuilding, GameConfig } from '../types';
import { calculateResourceBalance, ResourceBalance } from '../utils/resourceUtils';

interface ResourcePanelProps {
  buildings: PlacedBuilding[];
  config: GameConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const ResourcePanel: React.FC<ResourcePanelProps> = ({ buildings, config, isOpen, onClose }) => {
  const [popMultiplier, setPopMultiplier] = useState(1.0);
  const [expandedRes, setExpandedRes] = useState<string | null>(null);
  const [surplusTargets, setSurplusTargets] = useState<Record<string, number>>({});
  
  // Draggable State
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  const balances = useMemo(() => {
    return calculateResourceBalance(buildings, config, popMultiplier);
  }, [buildings, config, popMultiplier]);

  const handleTargetChange = (resId: string, val: string) => {
      const num = parseFloat(val) || 0;
      setSurplusTargets(prev => ({...prev, [resId]: num}));
  };

  // Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
      if (panelRef.current) {
          const rect = panelRef.current.getBoundingClientRect();
          setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          setIsDragging(true);
      }
  };

  useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
          if (isDragging) {
              setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
          }
      };
      const handleMouseUp = () => setIsDragging(false);

      if (isDragging) {
          window.addEventListener('mousemove', handleMouseMove);
          window.addEventListener('mouseup', handleMouseUp);
      }
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging, dragOffset]);

  useEffect(() => {
     if (isOpen) {
         const x = Math.min(Math.max(20, position.x), window.innerWidth - 300);
         const y = Math.min(Math.max(20, position.y), window.innerHeight - 300);
         setPosition({ x, y });
     }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
        ref={panelRef}
        style={{ left: position.x, top: position.y }}
        className="fixed w-full max-w-[360px] bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 ring-1 ring-black/40 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 flex flex-col overflow-hidden animate-fade-in max-h-[80vh]"
    >
      {/* Draggable Header */}
      <div 
        onMouseDown={handleMouseDown}
        className="p-3 border-b border-white/10 bg-black/20 cursor-move flex justify-between items-center select-none group"
      >
        <div className="flex items-center gap-3">
            {/* Grip Handle */}
            <div className="flex flex-col gap-0.5 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-px bg-white/20"></div>
                <div className="w-8 h-px bg-white/20"></div>
                <div className="w-8 h-px bg-white/20"></div>
            </div>
            <h2 className="text-xs font-black text-slate-200 uppercase tracking-widest">Resource Manager</h2>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Simulation Controls */}
      <div className="p-4 border-b border-white/10 bg-white/5 space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                Simulation Stress Test
            </label>
            <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 rounded border border-amber-500/20">
                {Math.round(popMultiplier * 100)}%
            </span>
        </div>
        <input 
            type="range" 
            min="0.5" 
            max="2.0" 
            step="0.1" 
            value={popMultiplier}
            onChange={(e) => setPopMultiplier(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5 min-h-[200px]">
        {balances.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-600 space-y-2">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                <p className="text-[10px] uppercase font-bold tracking-wide">No Production Data</p>
            </div>
        ) : (
            balances.map((res) => {
                const target = surplusTargets[res.id] || 0;
                const netAfterTarget = res.net - target;
                const isDeficit = netAfterTarget < -0.01;

                return (
                    <div key={res.id} className="bg-[#0f172a]/80 rounded-lg border border-white/5 overflow-hidden transition-all hover:border-white/10 group">
                        <div 
                            className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => setExpandedRes(expandedRes === res.id ? null : res.id)}
                        >
                            <div className="flex items-center gap-3">
                                <span className={`w-2 h-2 rounded-full ring-2 ring-black/20 ${isDeficit ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
                                <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{res.name}</span>
                            </div>
                            <div className={`text-xs font-mono font-bold ${isDeficit ? 'text-red-400' : 'text-emerald-400'}`}>
                                {res.net > 0 ? '+' : ''}{res.net.toFixed(1)}
                            </div>
                        </div>

                        {/* Details Panel */}
                        {expandedRes === res.id && (
                            <div className="bg-black/20 p-3 text-xs border-t border-white/5 space-y-3 shadow-inner">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-wide">Production</p>
                                        <p className="font-mono text-emerald-400">{res.produced.toFixed(1)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] text-slate-500 uppercase tracking-wide">Consumption</p>
                                        <p className="font-mono text-red-400">{res.consumed.toFixed(1)}</p>
                                    </div>
                                </div>

                                {/* Surplus Target Input */}
                                <div className="pt-2 border-t border-white/5 flex items-center justify-between bg-white/5 -mx-3 -mb-3 p-3">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Safety Buffer</label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] text-slate-500">REQ:</span>
                                        <input 
                                            type="number" 
                                            className="w-14 bg-black/40 border border-white/10 rounded px-1.5 py-1 text-right text-white text-[10px] font-mono focus:border-amber-500 outline-none transition-colors"
                                            value={surplusTargets[res.id] || ''}
                                            placeholder="0"
                                            onChange={(e) => handleTargetChange(res.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
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

  const balances = useMemo(() => {
    return calculateResourceBalance(buildings, config, popMultiplier);
  }, [buildings, config, popMultiplier]);

  const handleTargetChange = (resId: string, val: string) => {
      const num = parseFloat(val) || 0;
      setSurplusTargets(prev => ({...prev, [resId]: num}));
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-30 flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-yellow-500">Resource Manager</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* Simulation Controls */}
      <div className="p-4 border-b border-gray-700 bg-gray-800/50">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
            Population Simulation
        </label>
        <div className="flex items-center gap-3">
            <input 
                type="range" 
                min="0.5" 
                max="2.0" 
                step="0.1" 
                value={popMultiplier}
                onChange={(e) => setPopMultiplier(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
            <span className="text-sm font-mono text-yellow-500 w-12 text-right">
                {Math.round(popMultiplier * 100)}%
            </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
            Simulate resource strain if population grows to {Math.round(popMultiplier * 100)}% of current capacity.
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {balances.length === 0 ? (
            <div className="text-center text-gray-500 mt-10 italic">
                No active resources. Place production buildings or residences.
            </div>
        ) : (
            balances.map((res) => {
                const target = surplusTargets[res.id] || 0;
                const netAfterTarget = res.net - target;
                const isDeficit = netAfterTarget < -0.01;
                const isSurplus = netAfterTarget > 0.01;

                return (
                    <div key={res.id} className="bg-gray-800 rounded border border-gray-700 overflow-hidden">
                        <div 
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750 transition-colors"
                            onClick={() => setExpandedRes(expandedRes === res.id ? null : res.id)}
                        >
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${isDeficit ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                <span className="font-bold text-gray-200">{res.name}</span>
                            </div>
                            <div className={`font-mono font-bold ${isDeficit ? 'text-red-400' : 'text-green-400'}`}>
                                {res.net > 0 ? '+' : ''}{res.net.toFixed(1)}
                            </div>
                        </div>

                        {/* Details Panel */}
                        {expandedRes === res.id && (
                            <div className="bg-gray-900/50 p-3 text-sm border-t border-gray-700 space-y-3">
                                <div className="grid grid-cols-2 gap-4 text-gray-400 text-xs uppercase tracking-wide">
                                    <div>Production</div>
                                    <div className="text-right">Consumption</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 font-mono">
                                    <div className="text-green-400">{res.produced.toFixed(1)} / min</div>
                                    <div className="text-right text-red-400">{res.consumed.toFixed(1)} / min</div>
                                </div>

                                {/* Chain Viz */}
                                <div className="pt-2 border-t border-gray-700/50">
                                    <div className="text-xs text-gray-500 mb-1">Sources</div>
                                    <div className="flex flex-wrap gap-1">
                                        {res.producers.map(p => (
                                            <span key={p} className="px-2 py-0.5 bg-green-900/30 text-green-300 rounded text-xs border border-green-800">{p}</span>
                                        ))}
                                        {res.producers.length === 0 && <span className="text-gray-600 text-xs">-</span>}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Used By</div>
                                    <div className="flex flex-wrap gap-1">
                                        {res.consumers.map(p => (
                                            <span key={p} className="px-2 py-0.5 bg-red-900/30 text-red-300 rounded text-xs border border-red-800">{p}</span>
                                        ))}
                                         {res.consumers.length === 0 && <span className="text-gray-600 text-xs">-</span>}
                                    </div>
                                </div>

                                {/* Surplus Target Input */}
                                <div className="pt-2 mt-2 border-t border-gray-700/50 flex items-center justify-between">
                                    <label className="text-xs text-gray-400">Desired Surplus</label>
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            className="w-16 bg-gray-900 border border-gray-600 rounded px-1 py-0.5 text-right text-white text-xs"
                                            value={surplusTargets[res.id] || ''}
                                            placeholder="0"
                                            onChange={(e) => handleTargetChange(res.id, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className="text-xs text-gray-500">/min</span>
                                    </div>
                                </div>
                                {target > 0 && (
                                    <div className="text-right text-xs">
                                        Status vs Target: <span className={netAfterTarget >= 0 ? "text-green-500" : "text-red-500"}>
                                            {netAfterTarget >= 0 ? "Met" : "Shortfall"} ({netAfterTarget.toFixed(1)})
                                        </span>
                                    </div>
                                )}
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

import React, { useState, useMemo } from 'react';
import { PopulationTarget } from '../data/populationCalculator';
import { calculateOptimizedRequirements, getTradeableGoods } from '../data/advancedPopulationCalculator';
import { loadBuildingDefinitions, mapTargetCountsToIds } from '../data/buildingAdapter';

interface PopulationInputProps {
  onGenerate: (targetCountsById: Record<string, number>, summary: string) => void;
  onCancel: () => void;
}

const TIER_NAMES = ['Farmers', 'Workers', 'Artisans', 'Engineers', 'Investors'];
const TIER_COLORS: Record<string, string> = {
  'Farmers': '#8b7355',
  'Workers': '#dc2626',
  'Artisans': '#2563eb',
  'Engineers': '#facc15',
  'Investors': '#10b981'
};

export const PopulationInput: React.FC<PopulationInputProps> = ({ onGenerate, onCancel }) => {
  const [population, setPopulation] = useState<Record<string, number>>({
    'Farmers': 500,
    'Workers': 1000,
    'Artisans': 0,
    'Engineers': 0,
    'Investors': 0
  });
  
  const [includeElectricity, setIncludeElectricity] = useState(false);
  const [tradingGoods, setTradingGoods] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Get available tradeable goods
  const availableGoods = useMemo(() => {
    const popTargets: PopulationTarget[] = Object.entries(population)
      .filter(([, count]) => (count as number) > 0)
      .map(([tier, count]) => ({ tier, count: count as number }));
    
    if (popTargets.length === 0) return [];
    return getTradeableGoods(popTargets);
  }, [population]);

  // Calculate requirements in real-time
  const requirements = useMemo(() => {
    const popTargets: PopulationTarget[] = Object.entries(population)
      .filter(([, count]) => (count as number) > 0)
      .map(([tier, count]) => ({ tier, count: count as number }));
    
    if (popTargets.length === 0) return null;
    
    return calculateOptimizedRequirements(popTargets, {
      includeElectricity,
      tradeGoods: tradingGoods
    });
  }, [population, includeElectricity, tradingGoods]);

  const handleGenerate = () => {
    if (!requirements) return;
    
    const definitions = loadBuildingDefinitions();
    const targetCountsById = mapTargetCountsToIds(requirements, definitions);
    
    const totalPop = Object.values(population).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
    const totalBuildings = Object.values(requirements).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
    
    const summary = `Population: ${totalPop} (${Object.entries(population).filter(([, v]) => (v as number) > 0).map(([k, v]) => `${v} ${k}`).join(', ')}) | Buildings: ${totalBuildings}`;
    
    onGenerate(targetCountsById, summary);
  };

  const handleSliderChange = (tier: string, value: number) => {
    setPopulation(prev => ({ ...prev, [tier]: value }));
  };

  const totalPop = Object.values(population).reduce((sum: number, val) => sum + (Number(val) || 0), 0);
  const totalBuildings = requirements ? Object.values(requirements).reduce((sum: number, val) => sum + (Number(val) || 0), 0) : 0;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 ring-1 ring-black/40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] w-full max-w-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="text-center space-y-2 border-b border-white/10 pb-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-widest">Population Layout Generator</h2>
          <p className="text-slate-400 text-sm">Set population targets and automatically calculate building requirements</p>
        </div>

        {/* Population Sliders */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Population Targets</h3>
            <span className="text-xs text-slate-500 font-mono">Total: {totalPop.toLocaleString()}</span>
          </div>
          
          {TIER_NAMES.map(tier => (
            <div key={tier} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: TIER_COLORS[tier] }} />
                  <span className="text-sm font-medium text-slate-200">{tier}</span>
                </div>
                <input
                  type="number"
                  value={population[tier]}
                  onChange={(e) => handleSliderChange(tier, Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 px-2 py-1 bg-slate-900 border border-white/10 rounded text-right text-sm text-white font-mono"
                  min="0"
                  step="50"
                />
              </div>
              <input
                type="range"
                min="0"
                max="5000"
                step="50"
                value={population[tier]}
                onChange={(e) => handleSliderChange(tier, parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${TIER_COLORS[tier]} 0%, ${TIER_COLORS[tier]} ${(population[tier] / 5000) * 100}%, #1e293b ${(population[tier] / 5000) * 100}%, #1e293b 100%)`
                }}
              />
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="space-y-3 border-t border-white/10 pt-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Advanced Options</span>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showAdvanced && (
            <div className="space-y-3 pl-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={includeElectricity}
                  onChange={(e) => setIncludeElectricity(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-slate-600 checked:bg-amber-500 checked:border-amber-500 transition-colors"
                />
                <div className="flex-1">
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">Include Electricity</span>
                  <p className="text-xs text-slate-500">Doubles production efficiency (requires power plants)</p>
                </div>
              </label>
              
              {availableGoods.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Import via Trade Routes</label>
                  <div className="max-h-40 overflow-y-auto custom-scrollbar bg-black/20 rounded-lg p-2 space-y-1">
                    {availableGoods.map(good => (
                      <label key={good} className="flex items-center gap-2 cursor-pointer group py-1 px-2 rounded hover:bg-white/5">
                        <input
                          type="checkbox"
                          checked={tradingGoods.has(good)}
                          onChange={(e) => {
                            const next = new Set(tradingGoods);
                            if (e.target.checked) {
                              next.add(good);
                            } else {
                              next.delete(good);
                            }
                            setTradingGoods(next);
                          }}
                          className="w-3 h-3 rounded border border-slate-600 checked:bg-emerald-500 checked:border-emerald-500"
                        />
                        <span className="text-xs text-slate-300 group-hover:text-white">{good}</span>
                      </label>
                    ))}
                  </div>
                  {tradingGoods.size > 0 && (
                    <p className="text-xs text-emerald-400 italic">✓ Trading {tradingGoods.size} good{tradingGoods.size !== 1 ? 's' : ''} (production buildings reduced)</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Requirements Preview */}
        {requirements && (
          <div className="bg-black/40 rounded-lg border border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Calculated Requirements</h3>
              <span className="text-xs text-slate-500 font-mono">{totalBuildings} Buildings</span>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 max-h-48 overflow-y-auto custom-scrollbar text-xs">
              {Object.entries(requirements)
                .sort((a, b) => (b[1] as number) - (a[1] as number))
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-slate-300 truncate">{name}</span>
                    <span className="text-slate-400 font-mono ml-2">×{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={totalPop === 0}
            className="flex-1 py-3 rounded-lg text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-900 uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-500 shadow-lg shadow-amber-500/20"
          >
            Generate Layout
          </button>
        </div>
      </div>
    </div>
  );
};

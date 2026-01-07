import React, { useMemo, useState } from 'react';
import { useAppState, Manifest } from '../state/AppState';
import { PRODUCTION_CHAINS } from '../data/industryData';
import { calculateOptimizedRequirements } from '../data/advancedPopulationCalculator';
import { mapTargetCountsToIds } from '../data/buildingAdapter';
import { ANNO_GAMES } from '../data/annoData';

export const CalculatorView: React.FC = () => {
  const { selectedGame, region, setManifest, setMode } = useAppState();
  const [populationTargets, setPopulationTargets] = useState<Record<string, number>>({
    Farmers: 0,
    Workers: 0,
    Artisans: 0,
    Engineers: 0,
    Investors: 0,
  });

  // Show available chains from our simplified industry data, filtered by region when applicable
  const chainsForRegion = useMemo(() => {
    const all = Object.values(PRODUCTION_CHAINS);
    if (region === 'Old World' || region === 'New World') {
      return all.filter(c => c.region === region);
    }
    return all; // fallback for regions we don't model yet
  }, [region]);

  // Calculate requirements using the advanced calculator (goods + services + residences)
  const requirements = useMemo<Record<string, number> | null>(() => {
    const pop = Object.entries(populationTargets)
      .filter(([, count]) => (count as number) > 0)
      .map(([tier, count]) => ({ tier, count: count as number }));
    if (pop.length === 0) return null;
    return calculateOptimizedRequirements(pop);
  }, [populationTargets]);

  const totalBuildings = useMemo(() => {
    if (!requirements) return 0;
    const vals = Object.values(requirements) as number[];
    return vals.reduce((a: number, b: number) => a + (b || 0), 0);
  }, [requirements]);

  if (!selectedGame) return <div className="p-6 text-slate-300">Select a game to use the calculator.</div>;

  const exportManifest = (dest: 'sandbox' | 'solver') => {
    if (!requirements || !selectedGame) return;
    const gameCfg = ANNO_GAMES[selectedGame];
    const mapped = mapTargetCountsToIds(requirements, gameCfg.buildings);
    const items = Object.entries(mapped)
      .filter(([, count]) => (count as number) > 0)
      .map(([id, count]) => ({ id, count: count as number }));
    const manifest: Manifest = {
      title: `${selectedGame} Requirements (${region})`,
      items
    };
    setManifest(manifest);
    setMode(dest);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pt-16 md:pt-20 pb-8 px-3 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-4xl font-black text-white mb-2">Resource Calculator</h2>
          <p className="text-xs md:text-base text-slate-400">Calculate building requirements from population targets and production chains.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Population Targets Card */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl">
            <h3 className="text-[10px] md:text-xs uppercase font-black text-amber-500 tracking-widest mb-3 md:mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Population Targets
            </h3>
            <div className="space-y-2 md:space-y-3">
              {['Farmers','Workers','Artisans','Engineers','Investors'].map(tier => (
                <div key={tier} className="flex items-center justify-between bg-black/30 backdrop-blur-sm p-2 md:p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all group">
                  <span className="text-xs md:text-sm font-bold text-slate-300 group-hover:text-white uppercase tracking-wide">{tier}</span>
                  <input 
                    type="number" 
                    min={0} 
                    className="w-20 md:w-28 bg-black/40 border border-white/10 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-right text-xs md:text-sm font-mono text-white outline-none focus:border-amber-500 transition-all" 
                    value={populationTargets[tier] || 0} 
                    onChange={e => setPopulationTargets(prev => ({ ...prev, [tier]: Math.max(0, parseInt(e.target.value) || 0) }))} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Available Chains Card */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl">
            <h3 className="text-[10px] md:text-xs uppercase font-black text-emerald-500 tracking-widest mb-3 md:mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Available Chains ({region})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {chainsForRegion.map(def => (
                <div key={def.id} className="p-3 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-white/5 hover:border-amber-500/30 transition-all group cursor-default">
                  <div className="text-sm font-bold text-slate-200 group-hover:text-white">{def.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{def.region}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="mt-4 md:mt-6 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 md:mb-4 gap-2">
            <h3 className="text-[10px] md:text-xs uppercase font-black text-blue-500 tracking-widest flex items-center gap-2">
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculated Requirements
            </h3>
            <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 tracking-wider">
              {totalBuildings} Total Buildings
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
            {(Object.entries(populationTargets) as [string, number][]).map(([tier, count]) => (
              count > 0 && (
                <div key={tier} className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-white/5">
                  <div className="text-[9px] md:text-xs font-bold text-slate-200">{tier}</div>
                  <div className="text-base md:text-lg font-black text-white mt-1">{count}</div>
                  <div className="text-[8px] md:text-[10px] text-slate-500 uppercase tracking-wider">Target Population</div>
                </div>
              )
            ))}
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-end gap-2 md:gap-3">
            <button 
              onClick={() => exportManifest('sandbox')} 
              className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 text-xs md:text-sm font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span className="hidden sm:inline">Export to Sandbox</span>
              <span className="inline sm:hidden">Sandbox</span>
            </button>
            <button 
              onClick={() => exportManifest('solver')} 
              className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-900 text-xs md:text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="hidden sm:inline">Export to Solver</span>
              <span className="inline sm:hidden">Solver</span>
            </button>
          </div>
          {requirements && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[320px] overflow-y-auto custom-scrollbar">
              {(Object.entries(requirements) as [string, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                    <span className="text-xs text-slate-300">{name}</span>
                    <span className="text-xs font-mono text-slate-400">×{count}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

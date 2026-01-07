import React, { useMemo, useState } from 'react';
import { useAppState, Manifest } from '../state/AppState';
import { getChainsByRegion } from '../data/chainIntegration';
import { PRODUCTION_CHAINS } from '../data/industryData';

export const CalculatorView: React.FC = () => {
  const { selectedGame, region, setManifest, setMode } = useAppState();
  const [populationTargets, setPopulationTargets] = useState<Record<string, number>>({});

  const chains = useMemo(() => getChainsByRegion(region), [region]);
  const chainKeys = Object.keys(chains);

  const totalBuildings = useMemo(() => {
    // Simple placeholder aggregation: count 1 per chain selected via population targets mapping (mock)
    return Object.values(populationTargets).reduce((a, b) => a + (b || 0), 0);
  }, [populationTargets]);

  if (!selectedGame) return <div className="p-6 text-slate-300">Select a game to use the calculator.</div>;

  const exportManifest = (dest: 'sandbox' | 'solver') => {
    const manifest: Manifest = {
      title: `${selectedGame} Requirements (${region})`,
      items: Object.entries(populationTargets).map(([id, count]) => ({ id, count }))
    };
    setManifest(manifest);
    setMode(dest);
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-black text-white mb-2">Resource Calculator</h2>
          <p className="text-slate-400">Calculate building requirements from population targets and production chains.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Population Targets Card */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xs uppercase font-black text-amber-500 tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Population Targets
            </h3>
            <div className="space-y-3">
              {['Farmer','Worker','Artisan','Engineer','Investor'].map(tier => (
                <div key={tier} className="flex items-center justify-between bg-black/30 backdrop-blur-sm p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all group">
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white uppercase tracking-wide">{tier}</span>
                  <input 
                    type="number" 
                    min={0} 
                    className="w-28 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-right text-sm font-mono text-white outline-none focus:border-amber-500 transition-all" 
                    value={populationTargets[tier] || 0} 
                    onChange={e => setPopulationTargets(prev => ({ ...prev, [tier]: parseInt(e.target.value) || 0 }))} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Available Chains Card */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xs uppercase font-black text-emerald-500 tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Available Chains ({region})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {chainKeys.map(key => (
                <div key={key} className="p-3 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-white/5 hover:border-amber-500/30 transition-all group cursor-default">
                  <div className="text-sm font-bold text-slate-200 group-hover:text-white">{key}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{chains[key].region}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="mt-6 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase font-black text-blue-500 tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculated Requirements
            </h3>
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 tracking-wider">
              {totalBuildings} Total Items
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(populationTargets).map(([tier, count]) => (
              count > 0 && (
                <div key={tier} className="p-3 rounded-lg bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-white/5">
                  <div className="text-xs font-bold text-slate-200">{tier}</div>
                  <div className="text-lg font-black text-white mt-1">{count}</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">Target Population</div>
                </div>
              )
            ))}
          </div>
          
          <div className="flex items-center justify-end gap-3">
            <button 
              onClick={() => exportManifest('sandbox')} 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 text-sm font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Export to Sandbox
            </button>
            <button 
              onClick={() => exportManifest('solver')} 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-900 text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Export to Solver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

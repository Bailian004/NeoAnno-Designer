import React, { useState } from 'react';
import { useAppState } from '../state/AppState';

interface ChainTab { id: string; title: string; }

export const SolverView: React.FC = () => {
  const { selectedGame, manifest } = useAppState();
  const [solverMode, setSolverMode] = useState<'city' | 'industry'>('city');
  const [tabs, setTabs] = useState<ChainTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  if (!selectedGame) return <div className="p-6 text-slate-300">Select a game to use the solver.</div>;

  const addTab = () => {
    const id = Math.random().toString(36).slice(2,9);
    const title = `Canvas ${tabs.length + 1}`;
    const tab = { id, title };
    setTabs(prev => [...prev, tab]);
    setActiveTabId(id);
  };
  const removeTab = (id: string) => setTabs(prev => prev.filter(t => t.id !== id));

  return (
    <div className="p-4 text-slate-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => setSolverMode('city')} className={`px-3 py-1 rounded text-xs font-bold uppercase ${solverMode==='city'?'bg-amber-500 text-slate-900':'bg-black/30 text-slate-300 border border-white/10'}`}>City Mode</button>
          <button onClick={() => setSolverMode('industry')} className={`px-3 py-1 rounded text-xs font-bold uppercase ${solverMode==='industry'?'bg-emerald-500 text-slate-900':'bg-black/30 text-slate-300 border border-white/10'}`}>Industrial Mode</button>
        </div>

        {solverMode === 'city' ? (
          <div className="bg-[#0f172a]/80 border border-white/10 rounded p-3">
            <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">Preloaded Manifest</h3>
            {manifest ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {manifest.items.map(i => (
                  <div key={i.id} className="p-2 rounded bg-slate-800/50 border border-white/10"><div className="text-xs font-bold text-slate-200">{i.id}</div><div className="text-[10px] text-slate-500 uppercase">{i.count}</div></div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No manifest loaded. Export from Calculator or add manually.</p>
            )}
            <div className="mt-3"><button className="px-3 py-1 rounded bg-blue-500 text-slate-900 text-xs font-bold">Run Solver</button></div>
          </div>
        ) : (
          <div className="bg-[#0f172a]/80 border border-white/10 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={addTab} className="px-3 py-1 rounded bg-amber-500 text-slate-900 text-xs font-bold">+ New Chain</button>
              <span className="text-[10px] text-slate-500 uppercase">Independent grid sizes per tab</span>
            </div>
            <div className="flex items-center gap-2 mb-3 overflow-x-auto">
              {tabs.map(t => (
                <div key={t.id} className={`px-3 py-1 rounded-full text-xs border ${activeTabId===t.id?'bg-emerald-500 text-slate-900 border-emerald-400':'bg-black/30 text-slate-300 border-white/10'}`}>
                  <button onClick={() => setActiveTabId(t.id)}>{t.title}</button>
                  <button className="ml-2" onClick={() => removeTab(t.id)}>×</button>
                </div>
              ))}
            </div>
            {tabs.length===0 && <p className="text-xs text-slate-500">Create tabs for each compatible chain. Incompatible options will be greyed out.</p>}
            {/* TODO: Integrate GridCanvas for each tab and compatibility logic */}
          </div>
        )}
      </div>
    </div>
  );
};

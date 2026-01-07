import React from 'react';
import { useAppState, RegionKey, AppMode } from '../state/AppState';
import { AnnoTitle } from '../types';

const games: { key: AnnoTitle; label: string; sub?: string }[] = [
  { key: AnnoTitle.ANNO_1800, label: 'Anno 1800', sub: 'Industrial Age' },
  { key: AnnoTitle.ANNO_1404, label: 'Anno 1404', sub: 'Orient/Occident' },
  { key: AnnoTitle.ANNO_2070, label: 'Anno 2070', sub: 'Ecobalance' },
  { key: AnnoTitle.ANNO_2205, label: 'Anno 2205', sub: 'Lunar Era' },
  { key: AnnoTitle.ANNO_117, label: 'Anno 117', sub: 'Pax Romana' }
];

const regionsByGame: Record<AnnoTitle, RegionKey[]> = {
  [AnnoTitle.ANNO_1800]: ['Old World','New World','Arctic','Enbesa','Cape Trelawney'] as RegionKey[],
  [AnnoTitle.ANNO_1404]: ['Occident','Orient'] as RegionKey[],
  [AnnoTitle.ANNO_2070]: ['Global'] as RegionKey[],
  [AnnoTitle.ANNO_2205]: ['Global'] as RegionKey[],
  [AnnoTitle.ANNO_117]: ['Global'] as RegionKey[],
};

export const Navbar: React.FC = () => {
  const { mode, setMode, selectedGame, setSelectedGame, region, setRegion, navCollapsed, setNavCollapsed } = useAppState();

  const modes: { id: AppMode; label: string; icon: string }[] = [
    { id: 'sandbox', label: 'Sandbox', icon: '🏗️' },
    { id: 'calculator', label: 'Calculator', icon: '📊' },
    { id: 'solver', label: 'Solver', icon: '🧬' },
  ];

  const utilLinks: { id: AppMode; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'settings', label: 'Settings' },
    { id: 'updates', label: 'Updates' },
    { id: 'about', label: 'About' },
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'bug', label: 'Report Bug' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 bg-[#0b0f19]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${navCollapsed ? 'h-12' : 'h-16'}`}>
      <div className="max-w-full mx-auto px-6 h-full flex items-center justify-between gap-6">
        {/* Left: Logo + Game Chips */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMode('home')} 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
          >
            <div className="w-8 h-8 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-lg flex items-center justify-center font-black text-slate-900 text-xs shadow-lg shadow-amber-500/20">
              NA
            </div>
            {!navCollapsed && <span className="font-bold tracking-wider text-sm uppercase text-white">NeoAnno</span>}
          </button>
          
          {!navCollapsed && (
            <>
              <div className="h-6 w-px bg-white/10"></div>
              <div className="flex items-center gap-2 overflow-x-auto max-w-[640px] custom-scrollbar">
                {games.map(g => (
                  <button
                    key={g.key}
                    onClick={() => {
                      setSelectedGame(g.key);
                      const regions = regionsByGame[g.key];
                      if (regions && regions.length > 0) setRegion(regions[0]);
                      setMode('sandbox');
                    }}
                    className={`relative px-4 py-2 rounded-xl border text-left transition-all duration-200 backdrop-blur-sm min-w-[140px] shadow-lg ${
                      selectedGame === g.key
                        ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 border-amber-400 shadow-amber-500/20'
                        : 'bg-white/5 border-white/10 text-slate-200 hover:border-amber-500/40 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-sm font-black leading-tight">{g.label}</div>
                    {g.sub && <div className="text-[10px] uppercase tracking-widest text-slate-400">{g.sub}</div>}
                  </button>
                ))}
              </div>
              {selectedGame && regionsByGame[selectedGame] && (
                <div className="flex items-center gap-2 ml-4 overflow-x-auto max-w-[360px] custom-scrollbar">
                  {regionsByGame[selectedGame].map(r => (
                    <button
                      key={r}
                      onClick={() => setRegion(r)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${
                        region === r
                          ? 'bg-emerald-500 text-slate-900 border-emerald-300 shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-slate-200 border-white/10 hover:border-emerald-400/40 hover:bg-white/10'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Center: Mode Tabs */}
        {!navCollapsed && (
          <div className="flex items-center gap-2">
            {modes.map(m => (
              <button 
                key={m.id} 
                onClick={() => setMode(m.id)} 
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all duration-200 ${
                  mode === m.id 
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' 
                    : 'bg-black/20 text-slate-400 hover:bg-black/30 hover:text-slate-200 border border-white/5'
                }`}
              >
                <span className="mr-1.5">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Right: Utility Menu + Collapse */}
        <div className="flex items-center gap-3">
          {!navCollapsed && (
            <div className="relative group">
              <button className="p-2 rounded-lg bg-black/20 border border-white/5 hover:bg-black/30 transition-all text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 overflow-hidden">
                {utilLinks.map(l => (
                  <button 
                    key={l.id} 
                    onClick={() => setMode(l.id)} 
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors border-b border-white/5 last:border-0"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <button 
            onClick={() => setNavCollapsed(!navCollapsed)} 
            title="Toggle Navigation" 
            className="p-2 rounded-lg bg-black/20 border border-white/5 hover:bg-black/30 transition-all text-slate-400 hover:text-white"
          >
            <svg className={`w-4 h-4 transition-transform duration-300 ${navCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

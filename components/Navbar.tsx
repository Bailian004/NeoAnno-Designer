import React, { useState } from 'react';
import { useAppState, RegionKey, AppMode } from '../state/AppState';
import { AnnoTitle } from '../types';
import { ANNO_TITLES_META } from '../constants';

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
  const BASE_URL = import.meta.env.BASE_URL;
  const { mode, setMode, selectedGame, setSelectedGame, region, setRegion, navCollapsed, setNavCollapsed } = useAppState();
  const [mobileGamesOpen, setMobileGamesOpen] = useState(false);
  const [mobileRegionsOpen, setMobileRegionsOpen] = useState(false);

  const gameLogoSlug: Record<AnnoTitle, string> = {
    [AnnoTitle.ANNO_1800]: 'anno-1800',
    [AnnoTitle.ANNO_1404]: 'anno-1404',
    [AnnoTitle.ANNO_2070]: 'anno-2070',
    [AnnoTitle.ANNO_2205]: 'anno-2205',
    [AnnoTitle.ANNO_117]: 'anno-117',
  };

  const regionLogoSlug: Record<RegionKey, string> = {
    'Old World': 'old-world',
    'New World': 'new-world',
    'Arctic': 'arctic',
    'Enbesa': 'enbesa',
    'Cape Trelawney': 'cape-trelawney',
    'Orient': 'orient',
    'Occident': 'occident',
    'Global': 'global',
  };

  const modes: { id: AppMode; label: string; icon: React.ReactNode }[] = [
    { 
      id: 'sandbox', 
      label: 'Sandbox', 
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
    },
    { 
      id: 'calculator', 
      label: 'Calculator', 
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    },
    { 
      id: 'solver', 
      label: 'Solver', 
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
    },
  ];

  const utilLinks: { id: AppMode; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'settings', label: 'Settings' },
    { id: 'updates', label: 'Updates' },
    { id: 'about', label: 'About' },
    { id: 'tutorial', label: 'Tutorial' },
    { id: 'bug', label: 'Report Bug' },
  ];

  const closeMobileDropdowns = () => {
    setMobileGamesOpen(false);
    setMobileRegionsOpen(false);
  };

  const showOverlay = mobileGamesOpen || mobileRegionsOpen;

  return (
    <>
      {showOverlay && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-150"
          onClick={closeMobileDropdowns}
        />
      )}

      <nav className={`fixed top-0 w-full z-50 bg-[#0b0f19]/80 backdrop-blur-md border-b border-white/5 transition-all duration-300 ${navCollapsed ? 'h-12' : 'md:h-16 h-14'}`}>
      <div className="max-w-full mx-auto px-3 md:px-6 h-full flex items-center justify-between gap-2 md:gap-6">
        {/* Left: Logo + Game Chips */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMode('home')} 
            className="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity group"
          >
            <div className="w-6 md:w-8 h-6 md:h-8 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-lg flex items-center justify-center font-black text-slate-900 text-[10px] md:text-xs shadow-lg shadow-amber-500/20">
              NA
            </div>
            {!navCollapsed && <span className="hidden sm:inline font-bold tracking-wider text-sm uppercase text-white">NeoAnno</span>}
          </button>
          
          {!navCollapsed && (
            <>
              <div className="hidden md:block h-6 w-px bg-white/10"></div>

              {/* Desktop chips */}
              <div className="hidden md:flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-nowrap overflow-x-auto custom-scrollbar">
                  {games.map(g => (
                    <button
                      key={g.key}
                      onClick={() => {
                        setSelectedGame(g.key);
                        const regions = regionsByGame[g.key];
                        if (regions && regions.length > 0) setRegion(regions[0]);
                        setMode('sandbox');
                      }}
                      className={`relative px-1.5 md:px-2 py-1.5 md:py-2 rounded-xl border transition-all duration-200 backdrop-blur-sm w-16 shadow-lg ${
                        selectedGame === g.key
                          ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 border-amber-400 shadow-amber-500/20'
                          : 'bg-white/5 border-white/10 text-slate-200 hover:border-amber-500/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <GameLogoImg 
                          slug={gameLogoSlug[g.key]}
                          alt={`${g.label} logo`}
                          className="w-8 h-8 rounded-md object-contain bg-black/30 border border-white/10"
                        />
                        <div className="text-[9px] uppercase tracking-wider leading-none text-slate-300">Anno</div>
                        <div className="text-xs font-black leading-none text-white">{ANNO_TITLES_META[g.key].year}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {selectedGame && regionsByGame[selectedGame] && (
                  <div className="flex items-center gap-2 ml-4 flex-nowrap overflow-x-auto custom-scrollbar">
                    {regionsByGame[selectedGame].map(r => (
                      <button
                        key={r}
                        onClick={() => setRegion(region === r ? null : r)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-widest transition-all ${
                          region === r
                            ? 'bg-emerald-500 text-slate-900 border-emerald-300 shadow-lg shadow-emerald-500/20'
                            : 'bg-white/5 text-slate-200 border-white/10 hover:border-emerald-400/40 hover:bg-white/10'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <LogoImg 
                            slug={regionLogoSlug[r]}
                            alt={`${r} logo`}
                            className={`w-4 h-4 object-contain transition-all ${region === r ? 'brightness-0' : 'brightness-0 invert'}`}
                          />
                          <span>{r}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile accordions */}
              <div className="md:hidden flex flex-row flex-nowrap items-center gap-2 max-w-full relative z-40 overflow-x-auto custom-scrollbar">
                {/* Games accordion */}
                <div className="rounded-lg border border-white/10 bg-white/5">
                  <button onClick={() => setMobileGamesOpen(o => !o)} className="w-full flex items-center justify-between px-2 py-1.5">
                    <span className="flex items-center gap-2">
                      {selectedGame ? (
                        <>
                          <GameLogoImg slug={gameLogoSlug[selectedGame]} alt="selected game" className="w-6 h-6 rounded-md object-contain bg-black/30 border border-white/10" />
                          <span className="text-xs font-bold text-white">{ANNO_TITLES_META[selectedGame].year}</span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300">Select Game</span>
                      )}
                    </span>
                    <svg className={`w-4 h-4 text-slate-300 transition-transform ${mobileGamesOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  {mobileGamesOpen && (
                    <div className="fixed left-2 right-2 top-14 z-50 px-2 animate-[fadeIn_120ms_ease-out]">
                      <div className="bg-[#0f172a]/95 border border-white/10 rounded-xl shadow-2xl p-2 max-h-[60vh] overflow-x-auto custom-scrollbar flex items-center gap-2">
                        {games.map(g => (
                          <button
                            key={g.key}
                            onClick={() => {
                              setSelectedGame(g.key);
                              const regions = regionsByGame[g.key];
                              if (regions && regions.length > 0) setRegion(regions[0]);
                              setMode('sandbox');
                              setMobileGamesOpen(false);
                            }}
                            className={`relative px-2 py-1.5 rounded-xl border transition-all duration-200 backdrop-blur-sm w-16 shadow ${
                              selectedGame === g.key ? 'bg-amber-500 text-slate-900 border-amber-400' : 'bg-white/5 border-white/10 text-slate-200'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <GameLogoImg slug={gameLogoSlug[g.key]} alt={`${g.label} logo`} className="w-8 h-8 rounded-md object-contain bg-black/30 border border-white/10" />
                              <div className="text-[9px] uppercase tracking-wider leading-none text-slate-300">{ANNO_TITLES_META[g.key].year}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Regions accordion */}
                {selectedGame && regionsByGame[selectedGame] && (
                  <div className="rounded-lg border border-white/10 bg-white/5">
                    <button onClick={() => setMobileRegionsOpen(o => !o)} className="w-full flex items-center justify-between px-2 py-1.5">
                      <span className="flex items-center gap-2">
                        <LogoImg slug={regionLogoSlug[region as RegionKey]} alt="region" className="w-5 h-5 object-contain brightness-0 invert" />
                        <span className="text-xs font-bold text-white">{region}</span>
                      </span>
                      <svg className={`w-4 h-4 text-slate-300 transition-transform ${mobileRegionsOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    {mobileRegionsOpen && (
                      <div className="fixed left-2 right-2 top-14 z-50 px-2 animate-[fadeIn_120ms_ease-out]">
                        <div className="bg-[#0f172a]/95 border border-white/10 rounded-xl shadow-2xl p-2 max-h-[60vh] overflow-x-auto custom-scrollbar flex items-center gap-2">
                          {regionsByGame[selectedGame].map(r => (
                            <button
                              key={r}
                              onClick={() => { setRegion(region === r ? null : r); setMobileRegionsOpen(false); }}
                              className={`px-2 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
                                region === r ? 'bg-emerald-500 text-slate-900 border-emerald-300' : 'bg-white/5 text-slate-200 border-white/10'
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <LogoImg slug={regionLogoSlug[r]} alt={`${r} logo`} className={`w-4 h-4 object-contain transition-all ${region === r ? 'brightness-0' : 'brightness-0 invert'}`} />
                                <span>{r}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Center: Mode Tabs */}
        {!navCollapsed && (
          <>
            <div className="hidden md:flex items-center gap-2">
              {modes.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setMode(m.id)} 
                  className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-200 flex items-center gap-1.5 ${
                    mode === m.id 
                      ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' 
                      : 'bg-black/20 text-slate-400 hover:bg-black/30 hover:text-slate-200 border border-white/5'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            {/* Mobile mode selector */}
            <div className="md:hidden flex items-center gap-2 flex-nowrap overflow-x-auto custom-scrollbar">
              {modes.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-all flex items-center gap-1 ${
                    mode === m.id
                      ? 'bg-amber-500 text-slate-900 border-amber-300 shadow-amber-500/20'
                      : 'bg-black/20 text-slate-300 border-white/10 hover:bg-black/30'
                  }`}
                  aria-label={m.label}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Right: Utility Menu + Collapse */}
        <div className="flex items-center gap-1 md:gap-3">
          {!navCollapsed && (
            <div className="relative group">
              <button className="p-1.5 md:p-2 rounded-lg bg-black/20 border border-white/5 hover:bg-black/30 transition-all text-slate-400 hover:text-white">
                <svg className="w-4 md:w-5 h-4 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            className="p-1.5 md:p-2 rounded-lg bg-black/20 border border-white/5 hover:bg-black/30 transition-all text-slate-400 hover:text-white"
          >
            <svg className={`w-3 md:w-4 h-3 md:h-4 transition-transform duration-300 ${navCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
};

// Game logos (PNG only)
const GameLogoImg: React.FC<{ slug: string; alt: string; className?: string }> = ({ slug, alt, className }) => {
  const [failed, setFailed] = useState(false);
  const initial = (alt?.trim()?.charAt(0) || 'A').toUpperCase();
  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className} bg-white/5 text-slate-300 font-black`}> {initial} </div>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}logos/${slug}.png`}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

// Region logos (SVG preferred for better styling)
const LogoImg: React.FC<{ slug: string; alt: string; className?: string }> = ({ slug, alt, className }) => {
  const [failed, setFailed] = useState(false);
  const initial = (alt?.trim()?.charAt(0) || 'A').toUpperCase();
  if (failed) {
    return (
      <div className={`flex items-center justify-center ${className}`}> {initial} </div>
    );
  }
  return (
    <img
      src={`${import.meta.env.BASE_URL}logos/${slug}.svg`}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

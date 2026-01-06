import React from 'react';
import { AnnoTitle } from '../types';
import { ANNO_TITLES_META } from '../constants';

interface HomePageProps {
  onSelectGame: (game: AnnoTitle) => void;
}

const FeatureCard: React.FC<{title: string, desc: string, icon: React.ReactNode}> = ({title, desc, icon}) => (
    <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm hover:bg-slate-800 hover:border-amber-500/30 transition-all duration-300 group">
        <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-black/20">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
);

const NewsItem: React.FC<{date: string, title: string, tag: string}> = ({date, title, tag}) => (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-default">
        <div className="flex flex-col items-center min-w-[50px]">
            <span className="text-[10px] font-black uppercase text-slate-500">{date}</span>
        </div>
        <div className="flex-1">
            <h4 className="text-sm font-medium text-slate-200">{title}</h4>
        </div>
        <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">{tag}</span>
    </div>
);

export const HomePage: React.FC<HomePageProps> = ({ onSelectGame }) => {
  
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      const element = document.getElementById(id);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
      }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-200 overflow-x-hidden selection:bg-amber-500/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0b0f19]/80 backdrop-blur-md border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={scrollTo('top')}>
                  <div className="w-8 h-8 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-lg flex items-center justify-center font-black text-slate-900 text-xs shadow-lg shadow-amber-500/20">NA</div>
                  <span className="font-bold tracking-wider text-sm uppercase">NeoAnno</span>
              </div>
              <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-400">
                  <button onClick={scrollTo('games')} className="hover:text-amber-500 transition-colors">Select Era</button>
                  <button onClick={scrollTo('features')} className="hover:text-amber-500 transition-colors">Technology</button>
                  <button onClick={scrollTo('updates')} className="hover:text-amber-500 transition-colors">Updates</button>
              </div>
              <div className="flex items-center gap-3">
                 <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">v2.1.0</span>
              </div>
          </div>
      </nav>

      {/* Hero Section */}
      <section id="top" className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
          {/* Background FX */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-7xl mx-auto text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-md mb-6 animate-fade-in-up">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span className="text-amber-500 text-[10px] font-bold tracking-[0.2em] uppercase">The Next-Gen Layout Tool</span>
              </div>
              
              <h1 className="text-5xl md:text-8xl font-black text-white mb-6 tracking-tight drop-shadow-2xl leading-none">
                BUILD YOUR <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-500 to-amber-700">DYNASTY</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed mb-10">
                A powerful, mathematically driven city architect for the Anno series. 
                Featuring genetic algorithms for optimal layout solving and recursive production chain calculation.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={scrollTo('games')} className="px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105">
                      Select Era
                  </button>
                  <button onClick={scrollTo('features')} className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all">
                      How It Works
                  </button>
              </div>
          </div>
      </section>

      {/* Game Selector Grid */}
      <section id="games" className="py-20 bg-slate-900/50 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-end justify-between mb-12">
                  <div>
                      <h2 className="text-3xl font-black text-white mb-2">Select Your Era</h2>
                      <p className="text-slate-400 text-sm">Choose a title to launch the design environment.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {(Object.keys(ANNO_TITLES_META) as AnnoTitle[]).map((title) => {
                  const meta = ANNO_TITLES_META[title];
                  return (
                    <button
                      key={title}
                      onClick={() => onSelectGame(title)}
                      className="group relative h-96 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-amber-900/20"
                    >
                      <div className="absolute inset-0">
                        <img 
                          src={meta.image} 
                          alt={title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-40 transition-opacity duration-500" />
                      </div>
                      
                      <div className="absolute inset-0 p-6 flex flex-col justify-end items-start text-left">
                        <div className="transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0">
                          <p className="text-amber-500 text-[10px] font-black tracking-[0.2em] mb-2 opacity-80 group-hover:opacity-100 uppercase">
                            Anno {meta.year}
                          </p>
                          <h3 className="text-2xl font-bold text-white leading-none mb-4 group-hover:text-amber-400 transition-colors">
                            {title.replace('Anno ', '')}
                          </h3>
                          <div className="inline-flex items-center gap-2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity delay-100">
                              <span>Launch Designer</span>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                          </div>
                        </div>
                      </div>
                      <div className={`absolute inset-0 border-2 border-transparent transition-colors duration-300 pointer-events-none rounded-2xl ${meta.theme.replace('shadow-', '').split(' ')[0]}`} />
                    </button>
                  );
                })}
              </div>
          </div>
      </section>

      {/* Features & Updates Split */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 grid lg:grid-cols-3 gap-12">
          
          {/* Left: Features */}
          <div className="lg:col-span-2 space-y-8">
              <div>
                  <h2 className="text-2xl font-black text-white mb-2">Core Technologies</h2>
                  <p className="text-slate-400 text-sm max-w-lg">NeoAnno replaces guesswork with deterministic algorithms to solve complex layout problems.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                  <FeatureCard 
                    title="Genetic Layout Solver" 
                    desc="A non-AI, constructive heuristic algorithm that 'prints' optimal housing blocks based on road access and service coverage radius."
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                  />
                  <FeatureCard 
                    title="Recursive Production" 
                    desc="Input your population target (e.g., 5000 Engineers) and the engine recursively calculates the entire supply chain down to the raw iron mine."
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
                  />
                  <FeatureCard 
                    title="Cross-Era Library" 
                    desc="Support for Anno 1800, 1404, 2070, 2205, and the upcoming Anno 117: Pax Romana with accurate building footprints."
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  />
                  <FeatureCard 
                    title="Glassmorphic HUD" 
                    desc="A modern, draggable, non-intrusive interface designed for high-resolution displays, replacing the legacy Windows Forms look."
                    icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>}
                  />
              </div>
          </div>

          {/* Right: Updates / Changelog */}
          <div id="updates" className="bg-[#0f172a] rounded-2xl border border-white/5 p-6 h-fit">
              <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white">Latest Activity</h3>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              </div>
              
              <div className="space-y-1">
                  <NewsItem date="Jan 06" title="Global Influence Overlay" tag="UI/UX" />
                  <NewsItem date="Jan 05" title="Navigation System Fixes" tag="Patch" />
                  <NewsItem date="Jan 04" title="Genetic Solver Optimization" tag="Core" />
                  <NewsItem date="Jan 03" title="Draggable HUD Implementation" tag="UI/UX" />
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/5">
                  <p className="text-xs text-slate-500 mb-4">
                      NeoAnno is an open-source project inspired by the original Anno Designer.
                  </p>
                  <div className="flex gap-4">
                      <a href="#" className="text-slate-400 hover:text-white transition-colors"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg></a>
                  </div>
              </div>
          </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#080b12] py-8 text-center">
          <p className="text-xs text-slate-600 font-mono">
              © 2026 NEOANNO DESIGNER. NOT AFFILIATED WITH UBISOFT BLUE BYTE.
          </p>
      </footer>
    </div>
  );
};
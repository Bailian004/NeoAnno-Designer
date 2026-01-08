import React, { useEffect, useMemo, useState } from 'react';
import { useAppState, Manifest } from '../state/AppState';
import { PRODUCTION_CHAINS_FULL as PRODUCTION_CHAINS } from '../data/industryData';
import { calculateOptimizedRequirementsDetailed, OptimizedRequirementsDetail } from '../data/advancedPopulationCalculator';
import { mapTargetCountsToIds } from '../data/buildingAdapter';
import { ANNO_GAMES } from '../data/annoData';
import { productionChains } from '../data/generatedProductionChains';
import { residenceBuildings } from '../data/generatedResidences';
import { serviceBuildings } from '../data/generatedServiceBuildings';
import { getBuildingIcon, getProductIcon, getIconSrc } from '../utils/iconResolver';
import { ChainModal } from './ChainModal';
import { RegionLogo } from './RegionLogo';
import { validateData } from '../data/validators';

export const CalculatorView: React.FC = () => {
  const { selectedGame, region, setManifest, setMode } = useAppState();
  const baseUrl = import.meta.env.BASE_URL || '/';
  const [sectionOpen, setSectionOpen] = useState<{ residences: boolean; production: boolean; services: boolean }>({
    residences: true,
    production: true,
    services: true,
  });
  const [openProducts, setOpenProducts] = useState<Record<string, boolean>>({});
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [populationTargets, setPopulationTargets] = useState<Record<string, number>>({
    Farmers: 0,
    Workers: 0,
    Artisans: 0,
    Engineers: 0,
    Investors: 0,
  });

  // Dev-only data validation to catch naming/icon/workforce regressions early
  useEffect(() => {
    if (import.meta.env.DEV) {
      const issues = validateData();
      if (issues.length) {
        console.warn('[Data Validation] Issues found:', issues);
      }
    }
  }, []);

  // Show available chains from our simplified industry data, filtered by region when applicable
  const chainsForRegion = useMemo(() => {
    const all = Object.values(PRODUCTION_CHAINS);
    if (region) {
      // Filter to chains that include the selected region
      return all.filter(c => c.regions.includes(region));
    }
    return all;
  }, [region]);

  // Map regions to logo slugs in /public/logos
  const regionSlugMap: Record<string, string> = {
    'Old World': 'old-world',
    'New World': 'new-world',
    'Arctic': 'arctic',
    'Enbesa': 'enbesa',
    'Cape Trelawney': 'cape-trelawney',
  };

  // Population tiers by region
  const populationTiersByRegion: Record<string, { tier: string; icon: string }[]> = {
    'Old World': [
      { tier: 'Farmer', icon: 'A7_resident_farmer.png' },
      { tier: 'Worker', icon: 'A7_resident_worker.png' },
      { tier: 'Artisan', icon: 'A7_resident_artisan.png' },
      { tier: 'Engineer', icon: 'A7_resident_engineer.png' },
      { tier: 'Investor', icon: 'A7_resident_investor.png' },
      { tier: 'Scholar', icon: 'A7_resident_scholars.png' }
    ],
    'Cape Trelawney': [
      { tier: 'Farmer', icon: 'A7_resident_farmer.png' },
      { tier: 'Worker', icon: 'A7_resident_worker.png' },
      { tier: 'Artisan', icon: 'A7_resident_artisan.png' },
      { tier: 'Engineer', icon: 'A7_resident_engineer.png' },
      { tier: 'Investor', icon: 'A7_resident_investor.png' },
      { tier: 'Scholar', icon: 'A7_resident_scholars.png' }
    ],
    'New World': [
      { tier: 'Jornalero', icon: 'A7_resident_jornalero.png' },
      { tier: 'Obrero', icon: 'A7_resident_obrera.png' }
    ],
    'Arctic': [
      { tier: 'Explorer', icon: 'A7_resident_Explorers.png' },
      { tier: 'Technician', icon: 'A7_resident_Technicians.png' }
    ],
    'Enbesa': [
      { tier: 'Shepherd', icon: 'A7_resident_sheperd.png' },
      { tier: 'Elder', icon: 'A7_resident_elder.png' }
    ]
  };

  // Get all tiers for global/null, or specific region tiers
  const tiersForRegion = useMemo(() => {
    if (!region || region === 'Global') {
      // Show all tiers from all regions
      return [
        ...populationTiersByRegion['Old World'],
        ...populationTiersByRegion['New World'],
        ...populationTiersByRegion['Arctic'],
        ...populationTiersByRegion['Enbesa']
      ];
    }
    return populationTiersByRegion[region] || [];
  }, [region]);

  // Calculate requirements using the advanced calculator (goods + services + residences)
  const requirements = useMemo<OptimizedRequirementsDetail | null>(() => {
    const pop = Object.entries(populationTargets)
      .filter(([, count]) => (count as number) > 0)
      .map(([tier, count]) => ({ tier, count: count as number }));
    if (pop.length === 0) return null;
    return calculateOptimizedRequirementsDetailed(pop);
  }, [populationTargets]);

  const totalBuildings = useMemo(() => {
    if (!requirements) return 0;
    const vals = Object.values(requirements.buildings) as number[];
    return vals.reduce((a: number, b: number) => a + (b || 0), 0);
  }, [requirements]);

  // Build fuzzy matcher to map building names -> product chain names
  const productChainIndex = useMemo(() => {
    const normalize = (s: string) => s
      .toLowerCase()
      .replace(/knitters|knitter/g, 'knit')
      .replace(/distillery|distiller|distill\./g, 'distill')
      .replace(/factory/g, '')
      .replace(/\s+|[^a-z0-9]/g, '');

    const index: Array<{ product: string; buildings: string[] }> = [];
    const collect = (links: any[] | undefined, acc: string[]) => {
      if (!links) return;
      for (const l of links) {
        if (l?.buildingId) acc.push(l.buildingId);
        if (Array.isArray(l?.inputs)) collect(l.inputs, acc);
      }
    };
    const defs = Object.values(PRODUCTION_CHAINS);
    for (const d of defs) {
      const b: string[] = [];
      if ((d as any).buildingId) b.push((d as any).buildingId);
      collect((d as any).chain, b);
      index.push({ product: (d as any).name || (d as any).id, buildings: b.map(normalize) });
    }
    return { index, normalize };
  }, []);

  if (!selectedGame) return <div className="p-6 text-slate-300">Select a game to use the calculator.</div>;

  const exportManifest = (dest: 'sandbox' | 'solver') => {
    if (!requirements || !selectedGame) return;
    const gameCfg = ANNO_GAMES[selectedGame];
    const mapped = mapTargetCountsToIds(requirements.buildings, gameCfg.buildings);
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
              {tiersForRegion.map(({ tier, icon }) => {
                const iconSrc = `${baseUrl}icons/${icon}`;
                
                return (
                  <div key={tier} className="flex items-center justify-between bg-black/30 backdrop-blur-sm p-2 md:p-3 rounded-lg border border-white/5 hover:border-white/10 transition-all group">
                    <div className="flex items-center gap-2">
                      <img src={iconSrc} alt={tier} className="w-5 h-5 md:w-6 md:h-6 object-contain" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                      <span className="text-xs md:text-sm font-bold text-slate-300 group-hover:text-white uppercase tracking-wide">{tier}</span>
                    </div>
                    <input 
                      type="number" 
                      min={0} 
                      className="w-20 md:w-28 bg-black/40 border border-white/10 rounded-lg px-2 md:px-3 py-1 md:py-1.5 text-right text-xs md:text-sm font-mono text-white outline-none focus:border-amber-500 transition-all" 
                      value={populationTargets[tier] || 0} 
                      onChange={e => setPopulationTargets(prev => ({ ...prev, [tier]: Math.max(0, parseInt(e.target.value) || 0) }))} 
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Chains Card */}
          <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col">
            <h3 className="text-[10px] md:text-xs uppercase font-black text-emerald-500 tracking-widest mb-3 md:mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="flex items-center gap-1">
                <span>Available Chains</span>
                <span className="opacity-80">(</span>
                {region && regionSlugMap[region] ? (
                  <RegionLogo slug={regionSlugMap[region]} alt={region} className="w-3.5 h-3.5" baseUrl={baseUrl} />
                ) : (
                  // Globe icon for Global/null region
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12h19" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5c3 3 3 15 0 19" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5c-3 3-3 15 0 19" />
                  </svg>
                )}
                <span>{region || 'Global'}</span>
                <span className="opacity-80">)</span>
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto custom-scrollbar flex-1">
              {chainsForRegion.map(def => {
                const icon = getProductIcon(def.id);
                const iconSrc = getIconSrc(icon, baseUrl);
                
                return (
                  <button
                    key={def.id}
                    onClick={() => setSelectedChain(def.id)}
                    className="p-3 rounded-lg bg-slate-800/40 backdrop-blur-sm border border-white/5 hover:border-amber-500/30 transition-all group cursor-pointer text-left hover:bg-slate-800/60"
                  >
                    <div className="flex items-center gap-2">
                      {iconSrc && <img src={iconSrc} alt={def.name} className="w-5 h-5 object-contain flex-shrink-0" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />}
                      <div className="text-sm font-bold text-slate-200 group-hover:text-white">{def.name}</div>
                    </div>
                    <div className="text-sm text-slate-500 uppercase tracking-wider mt-1 flex items-center gap-1 flex-wrap">
                      {def.regions.map((r, idx) => (
                        <React.Fragment key={r}>
                          {idx > 0 && <span className="text-slate-600">•</span>}
                          <span className="flex items-center gap-1">
                            {regionSlugMap[r] ? (
                              <RegionLogo slug={regionSlugMap[r]} alt={r} className="w-3 h-3" baseUrl={baseUrl} />
                            ) : null}
                            <span>{r}</span>
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="mt-4 md:mt-6 bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl">
          {/* Header row now includes export actions to avoid squashing */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-4 gap-2">
            <h3 className="text-[10px] md:text-xs uppercase font-black text-blue-500 tracking-widest flex items-center gap-2">
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculated Requirements
            </h3>
            <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
              <span className="px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[9px] md:text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 tracking-wider">
                {totalBuildings} Total Buildings
              </span>
              <button 
                onClick={() => exportManifest('sandbox')} 
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <span>Export Sandbox</span>
              </button>
              <button 
                onClick={() => exportManifest('solver')} 
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-slate-900 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Export Solver</span>
              </button>
            </div>
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
          
          {/* Buttons moved to header above to free space here */}
          {requirements && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              {/* Buildings grouped: Residences, Production, Services */}
              <div className="lg:col-span-2 space-y-4 max-h+[420px] lg:max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                {(() => {
                  const entries = Object.entries(requirements.buildings) as [string, number][];
                  // Categorize by source dataset
                  const residences = entries.filter(([name]) => residenceBuildings.some(r => r.name === name));
                  const services = entries.filter(([name]) => serviceBuildings.some(s => s.name === name));
                  
                  // Everything not a residence or service is production
                  const productions = entries.filter(([name]) => 
                    !residenceBuildings.some(r => r.name === name) && 
                    !serviceBuildings.some(s => s.name === name)
                  );

                  // Group productions by product chain using fuzzy matcher
                  const groupedProductions = (() => {
                    const groups = new Map<string, [string, number][]>();
                    for (const item of productions) {
                      const [name] = item;
                      const n = productChainIndex.normalize(name);
                      let match: string | undefined;
                      for (const rec of productChainIndex.index) {
                        if (rec.buildings.some(bn => bn === n || bn.includes(n) || n.includes(bn))) {
                          match = rec.product;
                          break;
                        }
                      }
                      const key = match || 'Other Production';
                      if (!groups.has(key)) groups.set(key, []);
                      groups.get(key)!.push(item);
                    }
                    return groups;
                  })();

                  const renderSection = (title: string, key: keyof typeof sectionOpen, items: [string, number][]) => (
                    items.length > 0 && (
                      <div key={title}>
                        <button
                          type="button"
                          onClick={() => setSectionOpen(prev => ({ ...prev, [key]: !prev[key] }))}
                          className="sticky top-0 z-10 -mx-2 w-full px-2 py-1.5 rounded bg-[#0f172a]/90 backdrop-blur border border-white/5 text-[10px] uppercase tracking-wider font-black text-slate-300 mb-2 flex items-center justify-between"
                        >
                          <span>{title}</span>
                          <svg
                            className={`w-3 h-3 transition-transform ${sectionOpen[key] ? 'rotate-0' : '-rotate-90'}`}
                            viewBox="0 0 20 20" fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M10.293 14.707a1 1 0 010-1.414L13.586 10 10.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                        {sectionOpen[key] && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                          {items
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, count]) => {
                              const icon = getBuildingIcon(name);
                              const src = getIconSrc(icon, baseUrl);

                              return (
                                <div key={name} className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5 hover:border-white/10 transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {src && (
                                      <img src={src} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                    )}
                                    <span className="text-xs text-slate-300 truncate">{name}</span>
                                  </div>
                                  <span className="ml-3 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">×{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )
                  );

                  return (
                    <>
                      {renderSection('Residences', 'residences', residences)}
                      {(() => {
                        if (productions.length === 0) return null;
                        return (
                          <div>
                            <button
                              type="button"
                              onClick={() => setSectionOpen(prev => ({ ...prev, production: !prev.production }))}
                              className="sticky top-0 z-10 -mx-2 w-full px-2 py-1.5 rounded bg-[#0f172a]/90 backdrop-blur border border-white/5 text-[10px] uppercase tracking-wider font-black text-slate-300 mb-2 flex items-center justify-between"
                            >
                              <span>Production Chains</span>
                              <svg className={`w-3 h-3 transition-transform ${sectionOpen.production ? 'rotate-0' : '-rotate-90'}`} viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 14.707a1 1 0 010-1.414L13.586 10 10.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                            {sectionOpen.production && (
                            <div className="space-y-3">
                              {Array.from(groupedProductions.entries()).sort((a,b)=>{
                                const sum = (arr:[string,number][])=>arr.reduce((t,[_n,c])=>t+c,0);
                                return sum(b[1]) - sum(a[1]);
                              }).map(([product, items]) => (
                                <div key={product}>
                                  <button
                                    type="button"
                                    onClick={() => setOpenProducts(prev => ({ ...prev, [product]: !(prev[product] ?? true) }))}
                                    className="w-full px-2 py-1 rounded bg-black/20 border border-white/5 text-[10px] uppercase tracking-wider font-bold text-slate-300 mb-1 flex items-center justify-between"
                                  >
                                    <span className="flex items-center gap-2">
                                      {/* Group header product icon */}
                                      {(() => {
                                        const prodIcon = getProductIcon(product);
                                        const src = getIconSrc(prodIcon, baseUrl);
                                        return src ? (
                                          <img src={src} alt="" className="w-4 h-4 object-contain" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}} />
                                        ) : null;
                                      })()}
                                      <span>{product}</span>
                                    </span>
                                    <svg className={`w-3 h-3 transition-transform ${(openProducts[product] ?? true) ? 'rotate-0' : '-rotate-90'}`} viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10.293 14.707a1 1 0 010-1.414L13.586 10 10.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                  {(openProducts[product] ?? true) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                    {items.sort((a,b)=>b[1]-a[1]).map(([name, count]) => {
                                      const icon = getBuildingIcon(name);
                                      const src = getIconSrc(icon, baseUrl);
                                      return (
                                        <div key={name} className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5 hover:border-white/10 transition-colors">
                                          <div className="flex items-center gap-2 min-w-0">
                                            {src && <img src={src} alt="" className="w-5 h-5 object-contain flex-shrink-0" onError={(e)=>{(e.target as HTMLImageElement).style.display='none';}}/>}
                                            <span className="text-xs text-slate-300 truncate">{name}</span>
                                          </div>
                                          <span className="ml-3 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">×{count}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            )}
                          </div>
                        );
                      })()}
                      {renderSection('Services', 'services', services)}
                    </>
                  );
                })()}
              </div>

              {/* Total Population (Target + Workforce) */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider font-black text-emerald-400">Total Population</div>
                <div className="text-[9px] text-slate-500 -mt-1 mb-2">Target + Workforce + Dependencies</div>
                {(Object.entries(requirements.workforce) as [string, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([tier, amount]) => (
                    <div key={tier} className="flex items-center justify-between p-2 rounded bg-black/20 border border-emerald-500/20">
                      <span className="text-xs text-slate-200">{tier}</span>
                      <span className="text-xs font-mono text-emerald-300">{amount}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chain Detail Modal */}
      {selectedChain && (
        <ChainModal
          chainId={selectedChain}
          onClose={() => setSelectedChain(null)}
          baseUrl={baseUrl}
        />
      )}
    </div>
  );
};

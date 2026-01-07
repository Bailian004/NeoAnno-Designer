import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnnoTitle, Layout, PlacedBuilding, GameConfig } from '../types';
import { ANNO_GAMES } from '../data/annoData';
import { GridCanvas } from './GridCanvas';
import { PopulationManager, GenerationResult } from '../services/PopulationManager';
import { SolverMode } from '../services/geneticSolver';
import { ResourcePanel } from './ResourcePanel';
import { PopulationInput } from './PopulationInput';
import { calculateBuildingsForPopulation, PopulationGoal } from '../utils/productionCalculator';
import { calculateIndustryNeeds, getAvailableGoods, getCompatibleGoods } from '../utils/chainCalculator';
import { PRODUCTION_CHAINS } from '../data/industryData';

const generateId = () => Math.random().toString(36).substring(2, 9);

interface DesignerProps {
  gameTitle: AnnoTitle;
  onBack: () => void;
}

// --- CONFIG TYPES ---
interface GenerationConfig {
    id: 'sketch' | 'standard' | 'elite';
    name: string;
    description: string;
    popSize: number;
    generations: number;
    estTime: string;
}

const GEN_OPTIONS: GenerationConfig[] = [
    { 
        id: 'sketch', 
        name: 'Rapid Sketch', 
        description: 'Quickly visualize layout ideas. Good for small villages.', 
        popSize: 20, 
        generations: 25, 
        estTime: '~5-10s' 
    },
    { 
        id: 'standard', 
        name: 'Standard Blueprint', 
        description: 'Balanced optimization. The default for most cities.', 
        popSize: 40, 
        generations: 50, 
        estTime: '~30s' 
    },
    { 
        id: 'elite', 
        name: 'Imperial Masterpiece', 
        description: 'Brute-force optimization for massive metropolises.', 
        popSize: 80, 
        generations: 100, 
        estTime: '~2m+' 
    }
];

// --- UI COMPONENTS ---

const Panel: React.FC<{children: React.ReactNode, className?: string, onMouseDown?: (e: React.MouseEvent) => void}> = ({children, className="", onMouseDown}) => (
  <div 
    onMouseDown={onMouseDown} 
    className={`bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 ring-1 ring-black/40 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-all duration-300 ${className}`}
  >
    {children}
  </div>
);

const IconButton: React.FC<{onClick: () => void, icon: React.ReactNode, active?: boolean, title?: string, className?: string}> = ({onClick, icon, active, title, className=""}) => (
  <button 
    onClick={onClick} 
    title={title}
    onMouseDown={(e) => e.stopPropagation()} 
    className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center relative overflow-hidden group ${active ? 'bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:bg-white/10 hover:text-white'} ${className}`}
  >
    {active && <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />}
    {icon}
  </button>
);

const CategoryTab: React.FC<{label: string, active: boolean, onClick: () => void}> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-3 text-[10px] uppercase font-black tracking-wider transition-all border-b-2 ${
            active 
            ? 'border-amber-500 text-amber-500 bg-amber-500/5' 
            : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
        }`}
    >
        {label}
    </button>
);

const BuildingIcon: React.FC<{icon?: string, color: string, name: string}> = ({ icon, color, name }) => {
  const [currentSrc, setCurrentSrc] = useState(icon);
  const [failed, setFailed] = useState(false);
  const [attemptedFallback, setAttemptedFallback] = useState(false);

  useEffect(() => { setCurrentSrc(icon); setFailed(false); setAttemptedFallback(false); }, [icon]);

  const handleError = () => {
      if (currentSrc && currentSrc.includes('/icons/') && !attemptedFallback) {
          const fileName = currentSrc.split('/').pop();
          if (fileName) { 
              setCurrentSrc(`./${fileName}`); 
              setAttemptedFallback(true);
              return; 
          }
      }
      setFailed(true);
  };
  
  if (currentSrc && !failed) {
    return <img src={currentSrc} alt={name} className="w-6 h-6 object-contain drop-shadow-md" onError={handleError} />;
  }
  
  // Fallback: show first letter of building name with color background
  return (
      <div 
          className="w-6 h-6 rounded-sm flex items-center justify-center text-white text-xs font-bold shadow-sm ring-1 ring-white/20" 
          style={{ backgroundColor: color }}
          title={`Icon missing: ${name}`}
      >
          {name.charAt(0).toUpperCase()}
      </div>
  );
};

// --- MODALS ---

const GenerationOptionsModal: React.FC<{recommendedId: string, onSelect: (c: GenerationConfig) => void, onCancel: () => void}> = ({ recommendedId, onSelect, onCancel }) => (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <Panel className="w-full max-w-lg p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">Select Solver Algorithm</h2>
                <p className="text-slate-400 text-xs">Choose the complexity of the genetic evolution.</p>
            </div>
            <div className="grid gap-3">
                {GEN_OPTIONS.map(opt => {
                    const isRec = opt.id === recommendedId;
                    return (
                        <button key={opt.id} onClick={() => onSelect(opt)} className={`relative flex items-center p-4 rounded-xl border transition-all text-left group ${isRec ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50' : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/20'}`}>
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 text-xl ${isRec ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-slate-700 text-slate-400'}`}>
                                {opt.id === 'sketch' ? '⚡' : opt.id === 'standard' ? '⚙️' : '🧠'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`font-bold uppercase tracking-wider text-sm ${isRec ? 'text-amber-500' : 'text-slate-200'}`}>{opt.name}</span>
                                    <span className="text-[10px] font-mono text-slate-500 bg-black/30 px-2 py-1 rounded">{opt.estTime}</span>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">{opt.description}</p>
                            </div>
                            {isRec && <div className="absolute top-2 right-2 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span></div>}
                        </button>
                    );
                })}
            </div>
            <button onClick={onCancel} className="w-full py-3 rounded-lg text-xs font-bold text-slate-500 hover:text-white hover:bg-white/5 uppercase tracking-widest transition-colors">Cancel</button>
        </Panel>
    </div>
);

const ProgressOverlay: React.FC<{progress: number, generation: number, maxGenerations: number, eta: number, onCancel: () => void}> = ({ progress, generation, maxGenerations, eta, onCancel }) => {
    const formatEta = (seconds: number) => {
        if (!seconds || seconds <= 0) return '...';
        if (seconds < 60) return `${Math.ceil(seconds)}s`;
        if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`;
        return `${(seconds / 3600).toFixed(1)}h`;
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-64 space-y-4 text-center">
                <div className="relative w-16 h-16 mx-auto">
                    <svg className="w-full h-full transform -rotate-90"><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" /><circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 - (progress / 100) * 175.9} className="text-emerald-500 transition-all duration-300 ease-out" /></svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black text-white text-sm">{Math.round(progress)}%</div>
                </div>
                <div>
                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Evolving Layout</h3>
                    <p className="text-slate-500 text-xs mt-1">Generation {generation} / {maxGenerations}</p>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                    <span>Optimization Phase</span>
                    <span>~{formatEta(eta)} Remaining</span>
                </div>
                <button onClick={onCancel} className="px-6 py-2 rounded-full border border-red-500/50 text-red-400 text-xs font-bold hover:bg-red-500/10 transition-colors">ABORT</button>
            </div>
        </div>
    );
};

const AnalysisView: React.FC<{title: string, score?: number, metrics: {efficiency: number, wastedSpace: number}, counts: Record<string, number>, config: GameConfig, emptyMessage: string}> = ({ title, score, metrics, counts, config, emptyMessage }) => {
    const totalBuildings = Object.values(counts).reduce((a: number, b: number) => a+b, 0);
    if (totalBuildings === 0) return <div className="flex-1 flex items-center justify-center text-slate-600 text-xs italic">{emptyMessage}</div>;
    return (
        <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 space-y-4 border-b border-white/5 bg-white/5">
                <div className="flex justify-between items-end mb-2">
                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{title}</span>
                     {score !== undefined && (
                         <div className="flex items-center gap-2">
                             <span className="text-3xl font-black text-white leading-none">{Math.floor(score)}</span>
                             <button 
                                 className="text-slate-500 hover:text-white transition-colors"
                                 title="Fitness Score = (Completion × 500) + (Efficiency × 200) + (Compactness × 300)\n\nCompletion: % of requested buildings placed\nEfficiency: % of area filled\nCompactness: How tightly buildings are grouped"
                             >
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                             </button>
                         </div>
                     )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Efficiency</div>
                        <div className={`text-xl font-mono ${metrics.efficiency > 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>{(metrics.efficiency * 100).toFixed(1)}%</div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-emerald-500" style={{width: `${Math.min(100, metrics.efficiency * 100)}%`}}></div>
                        </div>
                    </div>
                    <div className="bg-black/40 p-2 rounded border border-white/5">
                        <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Used Area</div>
                        <div className="text-xl font-mono text-blue-400">{(100 - metrics.wastedSpace * 100).toFixed(1)}%</div>
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-blue-500" style={{width: `${Math.min(100, (1 - metrics.wastedSpace) * 100)}%`}}></div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                <table className="w-full text-xs text-left border-collapse">
                    <thead><tr><th className="py-2 text-slate-500 font-bold uppercase border-b border-white/10">Building</th><th className="py-2 text-right text-slate-500 font-bold uppercase border-b border-white/10">Qty</th></tr></thead>
                    <tbody>
                        {Object.entries(counts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).map(([id, count]) => {
                            const def = config.buildings.find(b => b.id === id);
                            if (!def || def.category === 'Decoration') return null;
                            return (
                                <tr key={id} className="group hover:bg-white/5 transition-colors">
                                    <td className="py-2 border-b border-white/5 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{background: def?.color || '#666'}}/>
                                        <span className="text-slate-300 group-hover:text-white truncate max-w-[120px]">{def?.name || id}</span>
                                    </td>
                                    <td className="py-2 text-right border-b border-white/5 font-mono text-slate-400 group-hover:text-white">{count}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- MAIN DESIGNER COMPONENT ---

export const Designer: React.FC<DesignerProps> = ({ gameTitle, onBack }) => {
    const config = ANNO_GAMES[gameTitle];
    if (!config) {
        return (
            <div className="h-screen w-screen bg-[#0b0f19] text-slate-100 flex items-center justify-center">
                <div className="bg-[#0f172a] border border-white/10 rounded p-4">
                    <p className="text-sm">Configuration missing for selected game.</p>
                    <button className="mt-3 px-3 py-1 rounded bg-amber-500 text-slate-900 text-xs font-bold" onClick={onBack}>Back</button>
                </div>
            </div>
        );
    }
  
  // Grid size validation (Anno 1800 max: 200x200 realistic limit)
  const MAX_GRID_SIZE = 200;
  const initialWidth = Math.min(120, MAX_GRID_SIZE);
  const initialHeight = Math.min(120, MAX_GRID_SIZE);
  
  const [layout, setLayout] = useState<Layout>({ 
      width: initialWidth, 
      height: initialHeight, 
      buildings: [], 
      blockedCells: [] 
  });
  
  const [activeTool, setActiveTool] = useState<string | null>(null); 
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
    const [terrainMode, setTerrainMode] = useState(false);
    const [showAllRadii, setShowAllRadii] = useState(false);
  const [solverMode, setSolverMode] = useState<SolverMode>('city');
  const [activeCategory, setActiveCategory] = useState('Residence');
  const [activeLeftTab, setActiveLeftTab] = useState<'specs' | 'generated' | 'live'>('specs');

  const [selectedBuildingUid, setSelectedBuildingUid] = useState<string | null>(null);
  const [solverCounts, setSolverCounts] = useState<Record<string, number>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showPopModal, setShowPopModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<GenerationConfig | null>(null);
  
  const [solverProgress, setSolverProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  const [currentFitness, setCurrentFitness] = useState(0);
  
  const managerRef = useRef<PopulationManager | null>(null);
  const solverInterval = useRef<number | null>(null);
    const etaRef = useRef<number>(0);

  const [popGoals, setPopGoals] = useState<PopulationGoal[]>([]);
  const [newGoalTier, setNewGoalTier] = useState<string>('');
  const [newGoalCount, setNewGoalCount] = useState<number>(100);
  
  const [industryPop, setIndustryPop] = useState<Record<string, number>>({ 'Farmer': 0, 'Worker': 0, 'Artisan': 0, 'Jornalero': 0 });
  const [selectedGoods, setSelectedGoods] = useState<Set<string>>(new Set());
  
  const availableIndustryGoods = useMemo(() => {
      return getAvailableGoods(industryPop);
  }, [industryPop]);

  const compatibleGoods = useMemo(() => {
      const popTiers = Object.keys(industryPop).filter(tier => industryPop[tier] > 0);
      return getCompatibleGoods(Array.from(selectedGoods), availableIndustryGoods, popTiers);
  }, [selectedGoods, availableIndustryGoods, industryPop]);

  // --- LIVE INDUSTRY CALCULATION ---
  useEffect(() => {
      if (solverMode === 'industry') {
          // 1. Get raw needs based on generic names ("Sawmill": 5)
          const rawNeeds = calculateIndustryNeeds({
              population: industryPop,
              selectedGoods: Array.from(selectedGoods)
          });

          // 2. TRANSLATE TO REAL IDs
          const realNeeds: Record<string, number> = {};
          let totalProdBuildings = 0;
          
          Object.entries(rawNeeds).forEach(([genericName, count]) => {
             // Try strict then fuzzy match against Anno Data
             let match = config.buildings.find(b => b.name === genericName);
             if (!match) {
                 match = config.buildings.find(b => b.name.toLowerCase().includes(genericName.toLowerCase()));
             }
             
             if (match) {
                 realNeeds[match.id] = count;
                 totalProdBuildings += count;
             } else {
                 console.warn(`[Designer] Could not resolve building ID for: ${genericName}`);
             }
          });

          // 3. INJECT WAREHOUSES (Anno 1800 logistics mechanics)
          // Warehouses needed based on actual Anno logistics:
          // - Each warehouse covers radius of ~40 tiles
          // - Production buildings need warehouse access for goods storage/transport
          // - Rule: 1 warehouse per 50 tiles of built area (approx 5-8 production buildings)
          const warehousesNeeded = Math.max(1, Math.ceil(totalProdBuildings / 6));
          if (warehousesNeeded > 0) {
              const wh = config.buildings.find(b => b.name === 'Warehouse' || b.name.includes('Warehouse'));
              if (wh) {
                  realNeeds[wh.id] = warehousesNeeded;
              }
          }

          setSolverCounts(realNeeds);
      }
  }, [industryPop, selectedGoods, solverMode, config.buildings]);

    const [resourcePanelOpen, setResourcePanelOpen] = useState(false);
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [dockPos, setDockPos] = useState({ x: 0, y: 0 });
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const dockDragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setDockPos({ x: window.innerWidth / 2 - 140, y: window.innerHeight - 90 });
  }, []);

    // Default-close side panels on mobile to maximize canvas
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            setLeftPanelOpen(false);
            setRightPanelOpen(false);
        }
    }, []);

    const workforceStatus = useMemo(() => {
            const supply: Record<string, number> = {};
            const demand: Record<string, number> = {};

            layout.buildings.forEach(b => {
                    const def = config.buildings.find(d => d.id === b.definitionId);
                    if (!def) return;

                    if (def.residence?.populationType && def.residence.maxPopulation) {
                            const tier = def.residence.populationType;
                            supply[tier] = (supply[tier] || 0) + def.residence.maxPopulation;
                    }

                    if (def.production?.workforce) {
                            const wf = def.production.workforce;
                            demand[wf.type] = (demand[wf.type] || 0) + wf.amount;
                    }
            });

            const deficits = Object.entries(demand)
                .filter(([tier, need]) => need > (supply[tier] || 0))
                .map(([tier, need]) => ({ tier, need, have: supply[tier] || 0, deficit: need - (supply[tier] || 0) }))
                .sort((a, b) => b.deficit - a.deficit);

            return { deficits, hasDeficit: deficits.length > 0 };
    }, [layout.buildings, config.buildings]);

  const liveAnalysis = useMemo(() => {
      const buildings = layout.buildings;
      const totalArea = layout.width * layout.height;
      let builtArea = 0;
      const counts: Record<string, number> = {};
      buildings.forEach(b => {
          const def = config.buildings.find(d => d.id === b.definitionId);
          if (def) {
              builtArea += def.width * def.height;
              counts[def.id] = (counts[def.id] || 0) + 1;
          }
      });
      return {
          metrics: {
              efficiency: totalArea > 0 ? builtArea / totalArea : 0,
              wastedSpace: totalArea > 0 ? (totalArea - builtArea) / totalArea : 0
          },
          counts
      };
  }, [layout.buildings, layout.width, layout.height, config.buildings]);

  const handleDockMouseDown = (e: React.MouseEvent) => {
    setIsDraggingDock(true);
    dockDragOffset.current = { x: e.clientX - dockPos.x, y: e.clientY - dockPos.y };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
        if (isDraggingDock) {
            setDockPos({ x: e.clientX - dockDragOffset.current.x, y: e.clientY - dockDragOffset.current.y });
        }
    };
    const handleUp = () => setIsDraggingDock(false);
    if (isDraggingDock) {
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
    };
  }, [isDraggingDock]);

  // Handle Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { setActiveTool(null); setSelectedBuildingUid(null); }
        if (e.key === 'r' || e.key === 'R') setRotation(prev => (prev + 90) % 360 as any);
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (selectedBuildingUid) handleRemoveBuilding(selectedBuildingUid);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBuildingUid]);

  // Init Pop Goal
  useEffect(() => {
    const residences = config.buildings.filter(b => b.category === 'Residence');
    if (residences.length > 0) {
        setNewGoalTier(residences[0].residence?.populationType || '');
    }
  }, [config]);

  const handlePlaceBuilding = (x: number, y: number) => {
      if (!activeTool) return;
      const def = config.buildings.find(d => d.id === activeTool)!;
      const isRotated = rotation === 90 || rotation === 270;
      const w = isRotated ? def.height : def.width;
      const h = isRotated ? def.width : def.height;
      if (x < 0 || y < 0 || x + w > layout.width || y + h > layout.height) return;
      const collides = layout.buildings.some(b => {
          const bd = config.buildings.find(d => d.id === b.definitionId)!;
          const isBRotated = b.rotation === 90 || b.rotation === 270;
          const bw = isBRotated ? bd.height : bd.width;
          const bh = isBRotated ? bd.width : bd.height;
          return !(x >= b.x + bw || x + w <= b.x || y >= b.y + bh || y + h <= b.y);
      });
      if (!collides) {
          setLayout(prev => ({
              ...prev,
              buildings: [...prev.buildings, { uid: generateId(), definitionId: activeTool, x, y, rotation }]
          }));
      }
  };

  const handleRemoveBuilding = (uid: string) => {
      setLayout(prev => ({ ...prev, buildings: prev.buildings.filter(b => b.uid !== uid) }));
      if (selectedBuildingUid === uid) setSelectedBuildingUid(null);
  };

  const handleToggleTerrain = (x: number, y: number) => {
      const key = `${x},${y}`;
      setLayout(prev => {
          const blocked = new Set(prev.blockedCells);
          if (blocked.has(key)) blocked.delete(key);
          else blocked.add(key);
          return { ...prev, blockedCells: Array.from(blocked) };
      });
  };

  const handleUpdatePopGoal = () => {
      const existing = popGoals.find(g => g.tierId === newGoalTier);
      if (existing) {
          // Update existing tier instead of creating duplicate
          const newGoals = popGoals.map(g => g.tierId === newGoalTier ? { ...g, count: newGoalCount } : g);
          setPopGoals(newGoals);
      } else {
          // Add new tier
          setPopGoals([...popGoals, { tierId: newGoalTier, count: newGoalCount }]);
      }
      setSolverCounts(calculateBuildingsForPopulation(
          existing ? popGoals.map(g => g.tierId === newGoalTier ? { ...g, count: newGoalCount } : g) : [...popGoals, { tierId: newGoalTier, count: newGoalCount }], 
          config
      ));
  };

  const handleDeleteGoal = (tierId: string) => {
      const newGoals = popGoals.filter(g => g.tierId !== tierId);
      setPopGoals(newGoals);
      setSolverCounts(calculateBuildingsForPopulation(newGoals, config));
  };

  const handleUpdateIndustryPop = (tier: string, count: number) => {
      setIndustryPop(prev => ({ ...prev, [tier]: count }));
  };

  const toggleGoodSelection = (goodId: string) => {
      const next = new Set(selectedGoods);
      if (next.has(goodId)) next.delete(goodId);
      else next.add(goodId);
      setSelectedGoods(next);
  };

  // Save/Load functionality
  const handleSaveLayout = () => {
      const saveData = {
          version: '1.0',
          gameTitle,
          layout,
          solverMode,
          popGoals,
          timestamp: new Date().toISOString()
      };
      
      const jsonStr = JSON.stringify(saveData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anno-layout-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const handleLoadLayout = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e: Event) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                  try {
                      const data = JSON.parse(e.target?.result as string);
                      if (data.layout) setLayout(data.layout);
                      if (data.solverMode) setSolverMode(data.solverMode);
                      if (data.popGoals) setPopGoals(data.popGoals);
                  } catch (err) {
                      console.error('Failed to load layout:', err);
                      alert('Failed to load layout file. Please check the file format.');
                  }
              };
              reader.readAsText(file);
          }
      };
      input.click();
  };

  const handleClearLayout = () => {
      if (confirm('Are you sure you want to clear the entire layout?')) {
          setLayout({ width: 120, height: 120, buildings: [], blockedCells: [] });
          setSolverCounts({});
          setLastResult(null);
      }
  };

  const handleOpenSolver = () => {
      // If in city mode and using the new calculator, show popup first
      if (solverMode === 'city' && popGoals.length === 0) {
          setShowPopModal(true);
      } else {
          setShowGenModal(true);
      }
  };

  const handlePopulationGenerate = (targetCountsById: Record<string, number>, summary: string) => {
      setSolverCounts(targetCountsById);
      setShowPopModal(false);
      setShowGenModal(true);
  };

  const getRecommendedMode = (): string => {
      const totalBuildings = (Object.values(solverCounts) as number[]).reduce((a, b) => a + b, 0);
      const tiers = popGoals.map(g => g.tierId.toLowerCase());
      const hasElite = tiers.some(t => t.includes('investor') || t.includes('engineer') || t.includes('scholar'));
      if (totalBuildings > 1500 || (hasElite && totalBuildings > 800)) return 'elite';
      if (totalBuildings < 300 && !hasElite) return 'sketch';
      return 'standard';
  };

  const confirmSolver = (genConfig: GenerationConfig) => {
      setShowGenModal(false);
      setSelectedConfig(genConfig);
      if (solverInterval.current) clearInterval(solverInterval.current);
      
      const manager = new PopulationManager({
          areaWidth: layout.width,
          areaHeight: layout.height,
          populationSize: genConfig.popSize, 
          generations: genConfig.generations,
          targetCounts: solverCounts, 
          blockedCells: new Set(layout.blockedCells)
      }, config.buildings, solverMode);
      
      manager.initPopulation();
      managerRef.current = manager;
      
      setIsSolving(true);
      setSolverProgress(0);
      setCurrentGeneration(0);
    setStartTime(Date.now());
    setLastResult(null);
    setEta(0);
    etaRef.current = 0;

      solverInterval.current = window.setInterval(() => {
          if (!managerRef.current) return;
          managerRef.current.stepGeneration();
          
          const bestIndividual = managerRef.current.getBest();
          const gen = managerRef.current.generationCount;
          
          // ETA Calculation
          const elapsed = (Date.now() - startTime) / 1000;
          const gensPerSec = gen / Math.max(elapsed, 0.001);
          const remainingGens = genConfig.generations - gen;
          const rawEta = remainingGens / Math.max(gensPerSec, 0.001);
          const smoothedEta = etaRef.current ? (etaRef.current * 0.7 + rawEta * 0.3) : rawEta;
          etaRef.current = smoothedEta;
          setEta(smoothedEta);

          const prog = Math.min((gen / genConfig.generations) * 100, 100);
          setSolverProgress(prog);
          setCurrentGeneration(gen);

          if (gen % 5 === 0 && bestIndividual && bestIndividual.layout) {
              setLayout(prev => ({ ...prev, buildings: bestIndividual.layout }));
              setCurrentFitness(Math.floor(bestIndividual.fitness));
          }

          if (gen >= genConfig.generations) {
              setIsSolving(false);
              if (solverInterval.current) clearInterval(solverInterval.current);
              if (bestIndividual) {
                  setLastResult({
                      fitness: bestIndividual.fitness,
                      metrics: bestIndividual.metrics,
                      counts: bestIndividual.layout.reduce((acc, b) => {
                          acc[b.definitionId] = (acc[b.definitionId] || 0) + 1;
                          return acc;
                      }, {} as Record<string, number>)
                  });
                  setActiveLeftTab('generated'); 
              }
          }
      }, 50);
  };

  return (
    <div className="relative h-screen w-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans select-none">
      <div className="absolute inset-0 z-0">
          <GridCanvas 
            gameConfig={config} buildings={layout.buildings} blockedCells={new Set(layout.blockedCells)}
            width={layout.width} height={layout.height}
            onPlaceBuilding={handlePlaceBuilding} onRemoveBuilding={handleRemoveBuilding}
            onSelectBuilding={setSelectedBuildingUid} onToggleTerrain={handleToggleTerrain}
                        activeBuildingId={activeTool} activeRotation={rotation} selectedBuilding={layout.buildings.find(b => b.uid === selectedBuildingUid) || null}
                        readOnly={isSolving} terrainMode={terrainMode} showAllRadii={showAllRadii}
         />
      </div>
      {showPopModal && <PopulationInput onGenerate={handlePopulationGenerate} onCancel={() => setShowPopModal(false)} />}
      {showGenModal && <GenerationOptionsModal recommendedId={getRecommendedMode()} onSelect={confirmSolver} onCancel={() => setShowGenModal(false)} />}
      {isSolving && selectedConfig && (
          <ProgressOverlay 
            progress={solverProgress} 
            generation={currentGeneration} 
            maxGenerations={selectedConfig.generations}
            eta={eta} 
            onCancel={() => { setIsSolving(false); if (solverInterval.current) clearInterval(solverInterval.current); }} 
          />
      )}
      
            <div className="absolute left-0 right-0 z-20 pointer-events-none p-4 flex justify-center top-16 md:top-0">
                <Panel className="pointer-events-auto w-full flex-row items-center justify-between px-2 md:px-4 py-2.5 md:py-3 gap-3 md:gap-6 shadow-2xl bg-[#0f172a]/95">
            <div className="flex items-center gap-5">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors group">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="h-8 w-px bg-white/10"></div>
                <div>
                   <h1 className="font-black text-amber-500 tracking-[0.2em] uppercase text-sm">{config.title}</h1>
                   <div className="text-[10px] text-slate-500 font-mono tracking-widest hidden sm:block">LAYOUT ARCHITECT V5.8</div>
                </div>
            </div>
                        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto custom-scrollbar flex-nowrap">
                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${workforceStatus.hasDeficit ? 'bg-red-500/10 text-red-300 border-red-500/40' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'}`} title={workforceStatus.hasDeficit ? 'Add more residences or reduce workforce demand.' : 'All workforce demands are covered.'}>
                    {workforceStatus.hasDeficit ? `Workforce deficit: ${workforceStatus.deficits.slice(0,2).map(d => `${d.tier} -${Math.ceil(d.deficit)}`).join(' · ')}` : 'Workforce balanced'}
                </div>
                {/* Blueprint + Resource toggles integrated into title bar */}
                <IconButton 
                    active={leftPanelOpen} 
                    onClick={() => setLeftPanelOpen(!leftPanelOpen)} 
                    title="Blueprints" 
                                        className="flex"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
                />
                                <IconButton 
                                        active={rightPanelOpen} 
                                        onClick={() => setRightPanelOpen(!rightPanelOpen)} 
                                        title="Buildings" 
                                        className="flex"
                                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" /></svg>} 
                                />
                <IconButton 
                    active={resourcePanelOpen} 
                    onClick={() => setResourcePanelOpen(!resourcePanelOpen)} 
                    title="Resource Monitor" 
                                        className="flex"
                    icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>} 
                />

                                {/* Canvas interaction controls */}
                                <div className="flex items-center gap-1 ml-1">
                                    <IconButton 
                                        active={activeTool === null && !terrainMode}
                                        onClick={() => { setActiveTool(null); setTerrainMode(false); }}
                                        title="Select / Move"
                                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2m0 0l5 5" /></svg>}
                                    />
                                    <IconButton 
                                        active={terrainMode}
                                        onClick={() => { setTerrainMode(prev => !prev); if (!terrainMode) setActiveTool(null); }}
                                        title="Terrain Blocker"
                                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                                    />
                                    <IconButton 
                                        active={showAllRadii}
                                        onClick={() => setShowAllRadii(prev => !prev)}
                                        title="Show All Service Radii"
                                        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                                    />
                                </div>
                <button onClick={handleSaveLayout} title="Save Layout" className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                </button>
                <button onClick={handleLoadLayout} title="Load Layout" className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-blue-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </button>
                <button onClick={handleClearLayout} title="Clear Layout" className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
                                {/* Mobile now uses the same icon buttons; no separate text buttons */}
            </div>
        </Panel>
      </div>
      
        {/* Removed floating toggle panel; switches are in the title bar */}

    <div className={`fixed md:absolute left-0 md:left-4 right-0 md:right-auto top-28 md:top-24 bottom-24 md:bottom-4 w-auto md:w-80 mx-2 md:mx-0 z-20 transition-transform duration-300 flex flex-col gap-3 ${leftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
         <Panel className="flex-1 p-0 gap-0">
             {/* Mobile header with close */}
             <div className="md:hidden flex items-center justify-between p-2 border-b border-white/10 bg-black/20">
                 <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Blueprints</span>
                 <button onClick={() => setLeftPanelOpen(false)} className="p-1.5 rounded-lg bg-black/30 border border-white/10 text-slate-400 hover:text-white hover:bg-black/40">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
             </div>
             <div className="flex border-b border-white/10 bg-black/20">
                 <button onClick={() => setActiveLeftTab('specs')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors ${activeLeftTab === 'specs' ? 'text-amber-500 bg-white/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}>Specs</button>
                 <button onClick={() => setActiveLeftTab('generated')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors ${activeLeftTab === 'generated' ? 'text-emerald-500 bg-white/5 border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300'}`}>Generated</button>
                 <button onClick={() => setActiveLeftTab('live')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors ${activeLeftTab === 'live' ? 'text-blue-500 bg-white/5 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}>Live Data</button>
             </div>
             {activeLeftTab === 'specs' ? (
                 <>
                     <div className="p-3 bg-black/20 border-b border-white/10 flex gap-2">
                        <button onClick={() => setSolverMode('city')} className={`flex-1 py-2 text-[10px] font-bold rounded uppercase tracking-wider border border-transparent transition-all ${solverMode === 'city' ? 'bg-slate-700 text-white shadow' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>City Mode</button>
                        <button onClick={() => setSolverMode('industry')} className={`flex-1 py-2 text-[10px] font-bold rounded uppercase tracking-wider border border-transparent transition-all ${solverMode === 'industry' ? 'bg-slate-700 text-white shadow' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>Industry</button>
                     </div>
                     {solverMode === 'city' ? (
                         <div className="p-4 bg-white/5 space-y-3 border-b border-white/5">
                             <button onClick={() => setShowPopModal(true)} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black rounded-lg uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2">
                                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                 Population Calculator
                             </button>
                             <div className="relative flex items-center gap-2">
                                 <div className="flex-1 h-px bg-white/10"></div>
                                 <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Or Manual Entry</span>
                                 <div className="flex-1 h-px bg-white/10"></div>
                             </div>
                             <div className="flex gap-2">
                                <select className="flex-1 bg-black/30 border border-white/10 rounded-md p-2 text-xs font-bold text-slate-200 outline-none focus:border-amber-500" value={newGoalTier} onChange={e => setNewGoalTier(e.target.value)}>
                                   {config.buildings.filter(b => b.category === 'Residence').map(b => <option key={b.id} value={b.residence?.populationType}>{b.residence?.populationType}</option>)}
                                </select>
                                <input type="number" className="w-20 bg-black/30 border border-white/10 rounded-md p-2 text-xs font-mono text-center outline-none focus:border-amber-500" value={newGoalCount} onChange={e => setNewGoalCount(parseInt(e.target.value) || 0)} />
                             </div>
                             <button onClick={handleUpdatePopGoal} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-md text-amber-500 uppercase tracking-widest shadow-sm border border-white/10 hover:border-amber-500/50 transition-all">+ Add To Manifest</button>
                             <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                                 {popGoals.length === 0 && (
                                     <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl p-6">
                                         <p className="text-[10px] font-bold uppercase tracking-wide">Manifest Empty</p>
                                     </div>
                                 )}
                                 {popGoals.map(goal => (
                                    <div key={goal.tierId} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center border border-white/10 text-amber-500 font-bold text-xs">{goal.tierId.charAt(0)}</div>
                                           <div>
                                               <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{goal.tierId}</p>
                                               <p className="text-sm font-bold text-white leading-none mt-0.5">{goal.count}</p>
                                           </div>
                                        </div>
                                        <button onClick={() => handleDeleteGoal(goal.tierId)} className="p-1.5 text-slate-600 hover:text-red-400">
                                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                 ))}
                             </div>
                         </div>
                     ) : (
                         <div className="flex-1 flex flex-col">
                             <div className="p-4 bg-white/5 space-y-3 border-b border-white/5">
                                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Target Population</label>
                                 <div className="grid grid-cols-2 gap-2">
                                     {['Farmer', 'Worker', 'Artisan', 'Jornalero'].map(tier => (
                                         <div key={tier} className="bg-black/30 rounded-md p-2 border border-white/10 flex items-center justify-between">
                                             <span className="text-[10px] font-bold text-slate-400 uppercase">{tier}</span>
                                             <input type="number" className="w-12 bg-transparent text-right text-xs font-mono font-bold text-white outline-none" value={industryPop[tier] || 0} onChange={e => handleUpdateIndustryPop(tier, parseInt(e.target.value) || 0)} />
                                         </div>
                                     ))}
                                 </div>
                             </div>
                             <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                                 <div className="flex justify-between items-center mb-2 px-1">
                                     <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Required Supply Chains</label>
                                     <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">{Object.values(solverCounts).reduce((a: number, b: number) => a+b, 0)} Buildings</span>
                                 </div>
                                 {availableIndustryGoods.length === 0 ? (
                                     <div className="text-center p-6 text-slate-600 border-2 border-dashed border-slate-800 rounded-lg">
                                         <p className="text-[10px] font-bold">No Demands</p>
                                         <p className="text-[9px]">Add population above</p>
                                     </div>
                                 ) : (
                                     availableIndustryGoods.map(goodId => {
                                         const isSelected = selectedGoods.has(goodId);
                                         const isCompatible = compatibleGoods.includes(goodId);
                                         const def = PRODUCTION_CHAINS[goodId];
                                         if (!def) return null;
                                         return (
                                             <button key={goodId} onClick={() => isCompatible && toggleGoodSelection(goodId)} disabled={!isCompatible} className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all ${isSelected ? 'bg-amber-500/10 border-amber-500/50' : isCompatible ? 'bg-slate-800/40 border-white/5 hover:border-white/20 cursor-pointer' : 'bg-black/20 border-transparent opacity-40 cursor-not-allowed grayscale'}`}>
                                                 <div className="flex items-center gap-3">
                                                     <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                                                         {isSelected && <svg className="w-3 h-3 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                                                     </div>
                                                     <div>
                                                         <span className={`text-xs font-bold block text-left ${isSelected ? 'text-amber-400' : 'text-slate-300'}`}>{goodId}</span>
                                                         <span className="text-[9px] text-slate-500 uppercase tracking-wider block text-left">{def.region}</span>
                                                     </div>
                                                 </div>
                                                 {!isCompatible && <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Incompatible</span>}
                                             </button>
                                         );
                                     })
                                 )}
                             </div>
                         </div>
                     )}
                     <div className="p-4 bg-black/20 border-t border-white/10">
                         <button onClick={handleOpenSolver} disabled={solverMode === 'city' ? (popGoals.length === 0 && Object.keys(solverCounts).length === 0) : selectedGoods.size === 0} className={`w-full py-3.5 rounded-lg font-black tracking-widest text-xs uppercase shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${(solverMode === 'city' ? (popGoals.length === 0 && Object.keys(solverCounts).length === 0) : selectedGoods.size === 0) ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}>Generate Layout</button>
                     </div>
                 </>
             ) : (
                 <div className="flex-1 flex flex-col overflow-hidden">
                     {activeLeftTab === 'generated' 
                        ? <AnalysisView title="Generation Report" score={lastResult?.fitness} metrics={lastResult?.metrics || {efficiency:0, wastedSpace:0}} counts={lastResult?.counts || {}} config={config} emptyMessage={!lastResult ? "No generation data.\nRun the solver first." : "Result Empty"} />
                        : <AnalysisView title="Live Canvas Analysis" metrics={liveAnalysis.metrics} counts={liveAnalysis.counts} config={config} emptyMessage="Canvas Empty" />
                     }
                 </div>
             )}
         </Panel>
      </div>

    <div className={`fixed md:absolute right-0 md:right-4 left-0 md:left-auto top-44 md:top-40 bottom-24 md:bottom-20 w-auto md:w-72 mx-2 md:mx-0 z-20 transition-transform duration-300 flex flex-col ${rightPanelOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}> 
         <Panel className="flex-1">
                {/* Mobile header with close */}
                <div className="md:hidden flex items-center justify-between p-2 border-b border-white/10 bg-black/20">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">Assets</span>
                    <button onClick={() => setRightPanelOpen(false)} className="p-1.5 rounded-lg bg-black/30 border border-white/10 text-slate-400 hover:text-white hover:bg-black/40">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
            <div className="flex border-b border-white/10 bg-black/20">
               {['Residence', 'Public', 'Production', 'Decoration'].map(cat => (
                   <CategoryTab key={cat} label={cat === 'Decoration' ? 'Deco' : cat === 'Production' ? 'Prod' : cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />
               ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
               <div className="grid grid-cols-4 gap-2">
                   {config.buildings.filter(b => b.category === activeCategory).map(b => (
                       <button key={b.id} onClick={() => { setActiveTool(b.id); setTerrainMode(false); }} title={b.name} className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border transition-all relative group ${activeTool === b.id ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-lg scale-105 z-10' : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-white'}`}>
                           <BuildingIcon icon={b.icon} color={b.color} name={b.name} />
                       </button>
                   ))}
               </div>
            </div>
         </Panel>
      </div>

      <div style={{ left: dockPos.x, top: dockPos.y }} className="fixed z-50 flex gap-2">
          <Panel onMouseDown={handleDockMouseDown} className="flex-row p-1.5 gap-1 select-none cursor-move items-stretch">
             <div className="flex flex-col items-center justify-center px-1.5 gap-0.5 border-r border-white/5 bg-black/10 text-slate-600 cursor-move">
                <div className="w-1 h-1 rounded-full bg-slate-600"></div><div className="w-1 h-1 rounded-full bg-slate-600"></div><div className="w-1 h-1 rounded-full bg-slate-600"></div>
             </div>
             <IconButton active={activeTool === null && !terrainMode} onClick={() => { setActiveTool(null); setTerrainMode(false); }} title="Select / Move" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>} />
             <IconButton active={terrainMode} onClick={() => { setTerrainMode(true); setActiveTool(null); }} title="Terrain Blocker" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
             <IconButton active={showAllRadii} onClick={() => setShowAllRadii(prev => !prev)} title="Show All Service Radii" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
             <div className="px-4 flex items-center justify-center min-w-[140px] bg-black/40 rounded mx-1 border border-white/5 border-b-white/10 shadow-inner">
                <span className={`text-[10px] font-mono tracking-widest uppercase ${activeTool ? 'text-amber-400' : terrainMode ? 'text-red-400' : 'text-slate-400'}`}>
                    {activeTool ? (config.buildings.find(b => b.id === activeTool)?.name.substring(0, 18) || 'Unknown Asset') : terrainMode ? 'TERRAIN EDITOR' : 'CURSOR MODE'}
                </span>
             </div>
             {activeTool && (
                 <div className="flex items-center gap-1 px-2 border-l border-white/5">
                     <span className="text-[9px] text-slate-500 uppercase font-bold mr-1">Rotation</span>
                     <button 
                         onClick={() => setRotation(prev => (prev + 90) % 360 as any)}
                         className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 transition-colors border border-white/5"
                         title="Rotate (R key)"
                     >
                         <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ transform: `rotate(${rotation}deg)` }}>
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                         </svg>
                     </button>
                     <span className="text-xs font-mono text-amber-400 font-bold min-w-[32px]">{rotation}°</span>
                 </div>
             )}
          </Panel>
      </div>
      <ResourcePanel isOpen={resourcePanelOpen} onClose={() => setResourcePanelOpen(false)} buildings={layout.buildings} config={config} />
    </div>
  );
};
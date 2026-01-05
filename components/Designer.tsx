import React, { useState, useEffect, useRef } from 'react';
import { AnnoTitle, Layout, PlacedBuilding } from '../types';
import { ANNO_GAMES } from '../data/annoData';
import { GridCanvas } from './GridCanvas';
import { PopulationManager, GenerationResult } from '../services/PopulationManager';
import { SolverMode } from '../services/geneticSolver';
import { ResourcePanel } from './ResourcePanel';
import { calculateBuildingsForPopulation, PopulationGoal } from '../utils/productionCalculator';

const generateId = () => Math.random().toString(36).substring(2, 9);
const MAX_GENERATIONS = 40; 

interface DesignerProps {
  gameTitle: AnnoTitle;
  onBack: () => void;
}

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

  useEffect(() => {
      setCurrentSrc(icon);
      setFailed(false);
  }, [icon]);

  const handleError = () => {
      if (currentSrc && currentSrc.includes('/icons/')) {
          const fileName = currentSrc.split('/').pop();
          if (fileName) {
              setCurrentSrc(`./${fileName}`);
              return;
          }
      }
      setFailed(true);
  };
  
  if (currentSrc && !failed) {
    return (
      <img 
        src={currentSrc} 
        alt={name} 
        className="w-6 h-6 object-contain drop-shadow-md" 
        onError={handleError} 
      />
    );
  }
  return <div className="w-5 h-5 rounded-sm flex-shrink-0 shadow-sm ring-1 ring-white/20" style={{ backgroundColor: color }}></div>;
};

// --- PROGRESS OVERLAY ---
const ProgressOverlay: React.FC<{
    progress: number; 
    generation: number; 
    eta: number; 
    onCancel: () => void;
}> = ({ progress, generation, eta, onCancel }) => (
    <div className="absolute inset-0 z-50 bg-[#0b0f19]/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in">
        <div className="w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 mb-6 relative">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center font-black text-amber-500 text-sm">
                    {Math.round(progress)}%
                </div>
            </div>
            
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">DESIGNING LAYOUT</h2>
            <p className="text-slate-400 text-sm mb-8">Evolving generation {generation} of {MAX_GENERATIONS}...</p>
            
            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
                <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
            
            <div className="flex justify-between w-full text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">
                <span>Optimization Phase</span>
                <span>~{eta > 0 ? eta.toFixed(0) : '...'}s Remaining</span>
            </div>
            
            <button 
                onClick={onCancel}
                className="px-6 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
                Cancel Generation
            </button>
        </div>
    </div>
);

// --- MAIN DESIGNER ---

export const Designer: React.FC<DesignerProps> = ({ gameTitle, onBack }) => {
  const config = ANNO_GAMES[gameTitle];
  const [layout, setLayout] = useState<Layout>({ width: 120, height: 120, buildings: [], blockedCells: [] });
  
  // Tools & Modes
  const [activeTool, setActiveTool] = useState<string | null>(null); 
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [terrainMode, setTerrainMode] = useState(false);
  const [solverMode, setSolverMode] = useState<SolverMode>('city');
  const [activeCategory, setActiveCategory] = useState('Residence');
  const [activeLeftTab, setActiveLeftTab] = useState<'specs' | 'results'>('specs');

  // Selection
  const [selectedBuildingUid, setSelectedBuildingUid] = useState<string | null>(null);
  
  // Solver State
  const [solverCounts, setSolverCounts] = useState<Record<string, number>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [eta, setEta] = useState<number>(0);
  const [lastResult, setLastResult] = useState<GenerationResult | null>(null);
  
  // Use the Population Manager
  const managerRef = useRef<PopulationManager | null>(null);
  const solverInterval = useRef<number | null>(null);

  // UI State
  const [popGoals, setPopGoals] = useState<PopulationGoal[]>([]);
  const [newGoalTier, setNewGoalTier] = useState<string>('');
  const [newGoalCount, setNewGoalCount] = useState<number>(100);
  
  const [resourcePanelOpen, setResourcePanelOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Draggable Dock
  const [dockPos, setDockPos] = useState({ x: 0, y: 0 });
  const [isDraggingDock, setIsDraggingDock] = useState(false);
  const dockDragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setDockPos({ x: window.innerWidth / 2 - 140, y: window.innerHeight - 90 });
  }, []);

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

  // Keyboard Shortcuts
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

  // Init default goal tier
  useEffect(() => {
    const residences = config.buildings.filter(b => b.category === 'Residence');
    if (residences.length > 0) {
        setNewGoalTier(residences[0].residence?.populationType || '');
    }
  }, [config]);

  // --- ACTIONS ---

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
      let newGoals = existing 
        ? popGoals.map(g => g.tierId === newGoalTier ? { ...g, count: newGoalCount } : g)
        : [...popGoals, { tierId: newGoalTier, count: newGoalCount }];
      setPopGoals(newGoals);
      setSolverCounts(calculateBuildingsForPopulation(newGoals, config));
  };

  const handleDeleteGoal = (tierId: string) => {
      const newGoals = popGoals.filter(g => g.tierId !== tierId);
      setPopGoals(newGoals);
      setSolverCounts(calculateBuildingsForPopulation(newGoals, config));
  };

  const runSolver = () => {
      if (isSolving) {
          if (solverInterval.current) clearInterval(solverInterval.current);
          setIsSolving(false);
          return;
      }
      
      const manager = new PopulationManager({
          areaWidth: layout.width,
          areaHeight: layout.height,
          populationSize: 40, 
          generations: MAX_GENERATIONS,
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

      // Evolution Loop
      solverInterval.current = window.setInterval(() => {
          if (!managerRef.current) return;
          
          managerRef.current.stepGeneration();
          
          const bestIndividual = managerRef.current.getBest();
          const gen = managerRef.current.generationCount;
          
          // Estimate Time
          const elapsed = (Date.now() - startTime) / 1000;
          const gensPerSec = gen / elapsed;
          const remainingGens = MAX_GENERATIONS - gen;
          setEta(remainingGens / (gensPerSec || 1));

          // Visualize (Throttle visualization to every 5 gens for performance, or last gen)
          if (gen % 5 === 0 || gen >= MAX_GENERATIONS) {
              if (bestIndividual && bestIndividual.layout) {
                  setLayout(prev => ({ ...prev, buildings: bestIndividual.layout }));
                  setCurrentFitness(Math.floor(bestIndividual.fitness));
              }
          }
          
          const prog = Math.min((gen / MAX_GENERATIONS) * 100, 100);
          setSolverProgress(prog);
          setCurrentGeneration(gen);

          if (gen >= MAX_GENERATIONS) {
              setIsSolving(false);
              if (solverInterval.current) clearInterval(solverInterval.current);
              
              // Save final result for analysis
              if (bestIndividual) {
                  setLastResult({
                      fitness: bestIndividual.fitness,
                      metrics: bestIndividual.metrics,
                      counts: bestIndividual.layout.reduce((acc, b) => {
                          acc[b.definitionId] = (acc[b.definitionId] || 0) + 1;
                          return acc;
                      }, {} as Record<string, number>)
                  });
                  setActiveLeftTab('results'); // Switch to results tab
              }
          }
      }, 50); // Fast cycle
  };

  return (
    <div className="relative h-screen w-screen bg-[#0b0f19] text-slate-100 overflow-hidden font-sans select-none">
      
      {/* 1. Full Screen Canvas */}
      <div className="absolute inset-0 z-0">
          <GridCanvas 
            gameConfig={config} buildings={layout.buildings} blockedCells={new Set(layout.blockedCells)}
            width={layout.width} height={layout.height}
            onPlaceBuilding={handlePlaceBuilding} onRemoveBuilding={handleRemoveBuilding}
            onSelectBuilding={setSelectedBuildingUid} onToggleTerrain={handleToggleTerrain}
            activeBuildingId={activeTool} activeRotation={rotation} selectedBuilding={layout.buildings.find(b => b.uid === selectedBuildingUid) || null}
            readOnly={isSolving} terrainMode={terrainMode}
         />
      </div>

      {/* Progress Overlay */}
      {isSolving && (
          <ProgressOverlay 
            progress={solverProgress} 
            generation={currentGeneration} 
            eta={eta} 
            onCancel={() => {
                setIsSolving(false);
                if (solverInterval.current) clearInterval(solverInterval.current);
            }} 
          />
      )}

      {/* 2. Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 flex justify-center">
        <Panel className="pointer-events-auto w-full flex-row items-center justify-between px-4 py-3 gap-6 shadow-2xl bg-[#0f172a]/95">
            <div className="flex items-center gap-5">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors group">
                   <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="h-8 w-px bg-white/10"></div>
                <div>
                   <h1 className="font-black text-amber-500 tracking-[0.2em] uppercase text-sm">{config.title}</h1>
                   <div className="text-[10px] text-slate-500 font-mono tracking-widest hidden sm:block">LAYOUT ARCHITECT V5.1</div>
                </div>
            </div>
        </Panel>
      </div>

      {/* 2.5 Top-Right Toggles */}
      <div className="absolute top-24 right-4 z-20 flex gap-2">
         <Panel className="flex-row p-1 gap-1">
            <IconButton 
                active={leftPanelOpen}
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                title="Toggle Blueprints"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            />
            <IconButton 
                active={resourcePanelOpen} 
                onClick={() => setResourcePanelOpen(!resourcePanelOpen)} 
                title="Resource Monitor"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
            />
         </Panel>
      </div>

      {/* 3. Left Panel: Specs & Results */}
      <div className={`absolute left-4 top-24 bottom-4 w-80 z-10 transition-transform duration-300 flex flex-col gap-3 ${leftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
         <Panel className="flex-1 p-0 gap-0">
             {/* Header Tabs */}
             <div className="flex border-b border-white/10 bg-black/20">
                 <button 
                    onClick={() => setActiveLeftTab('specs')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors ${activeLeftTab === 'specs' ? 'text-amber-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    Specifications
                 </button>
                 <button 
                    onClick={() => setActiveLeftTab('results')}
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors ${activeLeftTab === 'results' ? 'text-emerald-500 bg-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                    Results
                 </button>
             </div>

             {activeLeftTab === 'specs' ? (
                 <>
                     {/* Add Target Form */}
                     <div className="p-4 bg-white/5 space-y-3 border-b border-white/5">
                         <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Add Requirement</label>
                         <div className="flex gap-2">
                            <select 
                                className="flex-1 bg-black/30 border border-white/10 rounded-md p-2 text-xs font-bold text-slate-200 outline-none focus:border-amber-500" 
                                value={newGoalTier} 
                                onChange={e => setNewGoalTier(e.target.value)}
                            >
                               {config.buildings.filter(b => b.category === 'Residence').map(b => (
                                  <option key={b.id} value={b.residence?.populationType}>{b.residence?.populationType}</option>
                               ))}
                            </select>
                            <input 
                                type="number" 
                                className="w-20 bg-black/30 border border-white/10 rounded-md p-2 text-xs font-mono text-center outline-none focus:border-amber-500" 
                                value={newGoalCount} 
                                onChange={e => setNewGoalCount(parseInt(e.target.value) || 0)} 
                            />
                         </div>
                         <button onClick={handleUpdatePopGoal} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-md text-amber-500 uppercase tracking-widest shadow-sm border border-white/10 hover:border-amber-500/50 transition-all">
                            + Add To Manifest
                         </button>
                     </div>

                     {/* Goal List */}
                     <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                         {popGoals.length === 0 && (
                             <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl p-6">
                                 <p className="text-[10px] font-bold uppercase tracking-wide">Manifest Empty</p>
                             </div>
                         )}
                         {popGoals.map(goal => (
                            <div key={goal.tierId} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-white/5">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center border border-white/10 text-amber-500 font-bold text-xs">
                                     {goal.tierId.charAt(0)}
                                  </div>
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

                     {/* Action Button */}
                     <div className="p-4 bg-black/20 border-t border-white/10">
                         <div className="flex gap-2 mb-3">
                            <button onClick={() => setSolverMode('city')} className={`flex-1 py-2 text-[10px] font-bold rounded uppercase tracking-wider border border-transparent ${solverMode === 'city' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>City Mode</button>
                            <button onClick={() => setSolverMode('industry')} className={`flex-1 py-2 text-[10px] font-bold rounded uppercase tracking-wider border border-transparent ${solverMode === 'industry' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}>Industry</button>
                         </div>
                         <button 
                            onClick={runSolver} 
                            disabled={popGoals.length === 0}
                            className={`w-full py-3.5 rounded-lg font-black tracking-widest text-xs uppercase shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${popGoals.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'}`}
                         >
                            Generate Layout
                         </button>
                     </div>
                 </>
             ) : (
                 // --- RESULTS TAB ---
                 <div className="flex-1 flex flex-col overflow-hidden">
                     {!lastResult ? (
                         <div className="flex-1 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase tracking-wider p-8 text-center">
                             No analysis available.<br/>Run generation first.
                         </div>
                     ) : (
                         <div className="flex-1 overflow-y-auto custom-scrollbar">
                             {/* Score Card */}
                             <div className="p-4 bg-emerald-900/10 border-b border-emerald-500/20">
                                 <div className="flex justify-between items-end mb-2">
                                     <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Fitness Score</span>
                                     <span className="text-3xl font-black text-white leading-none">{Math.floor(lastResult.fitness)}</span>
                                 </div>
                                 
                                 <div className="space-y-2 mt-4">
                                     <div className="flex justify-between text-xs">
                                         <span className="text-slate-400">Space Efficiency</span>
                                         <span className="font-mono text-white">{(lastResult.metrics.efficiency * 100).toFixed(1)}%</span>
                                     </div>
                                     <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                         <div className="h-full bg-emerald-500" style={{width: `${lastResult.metrics.efficiency * 100}%`}}></div>
                                     </div>
                                     
                                     <div className="flex justify-between text-xs pt-1">
                                         <span className="text-slate-400">Wasted Space</span>
                                         <span className={`font-mono ${lastResult.metrics.wastedSpace > 0.3 ? 'text-red-400' : 'text-slate-200'}`}>{(lastResult.metrics.wastedSpace * 100).toFixed(1)}%</span>
                                     </div>
                                     <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                         <div className="h-full bg-red-500" style={{width: `${lastResult.metrics.wastedSpace * 100}%`}}></div>
                                     </div>
                                 </div>
                             </div>

                             {/* Building Manifest Breakdown */}
                             <div className="p-4 space-y-4">
                                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2">Building Breakdown</h3>
                                 
                                 {Object.entries(lastResult.counts).sort((a,b) => b[1] - a[1]).map(([id, count]) => {
                                     const def = config.buildings.find(d => d.id === id);
                                     if (!def || def.category === 'Decoration') return null;
                                     return (
                                         <div key={id} className="flex items-center justify-between text-xs">
                                             <div className="flex items-center gap-2">
                                                 <div className="w-2 h-2 rounded-full" style={{backgroundColor: def.color}}></div>
                                                 <span className="text-slate-300">{def.name}</span>
                                             </div>
                                             <span className="font-mono font-bold text-white">{count}</span>
                                         </div>
                                     );
                                 })}
                             </div>
                         </div>
                     )}
                 </div>
             )}
         </Panel>
      </div>

      {/* 4. Right Panel: Asset Browser */}
      <div className={`absolute right-4 top-40 bottom-20 w-72 z-10 transition-transform duration-300 flex flex-col ${rightPanelOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
         <Panel className="flex-1">
            <div className="flex border-b border-white/10 bg-black/20">
               {['Residence', 'Public', 'Production', 'Decoration'].map(cat => (
                   <CategoryTab 
                     key={cat} 
                     label={cat === 'Decoration' ? 'Deco' : cat === 'Production' ? 'Prod' : cat} 
                     active={activeCategory === cat} 
                     onClick={() => setActiveCategory(cat)} 
                   />
               ))}
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
               <div className="grid grid-cols-4 gap-2">
                   {config.buildings
                     .filter(b => b.category === activeCategory)
                     .map(b => (
                       <button 
                          key={b.id}
                          onClick={() => { setActiveTool(b.id); setTerrainMode(false); }}
                          title={b.name}
                          className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border transition-all relative group ${
                              activeTool === b.id 
                              ? 'bg-amber-500 border-amber-400 text-slate-900 shadow-lg scale-105 z-10' 
                              : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-700 hover:border-slate-500 hover:text-white'
                          }`}
                       >
                           <BuildingIcon icon={b.icon} color={b.color} name={b.name} />
                       </button>
                   ))}
               </div>
            </div>
         </Panel>
      </div>

      {/* 5. Bottom Control Dock */}
      <div 
        style={{ left: dockPos.x, top: dockPos.y }}
        className="fixed z-50 flex gap-2"
      >
          <Panel onMouseDown={handleDockMouseDown} className="flex-row p-1.5 gap-1 select-none cursor-move items-stretch">
             <div className="flex flex-col items-center justify-center px-1.5 gap-0.5 border-r border-white/5 bg-black/10 text-slate-600 cursor-move">
               <div className="w-1 h-1 rounded-full bg-slate-600"></div>
               <div className="w-1 h-1 rounded-full bg-slate-600"></div>
               <div className="w-1 h-1 rounded-full bg-slate-600"></div>
             </div>
             
             <IconButton 
                active={activeTool === null && !terrainMode}
                onClick={() => { setActiveTool(null); setTerrainMode(false); }}
                title="Select / Move"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>}
             />
             <IconButton 
                active={terrainMode}
                onClick={() => { setTerrainMode(true); setActiveTool(null); }}
                title="Terrain Blocker"
                icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
             />
             
             <div className="px-4 flex items-center justify-center min-w-[140px] bg-black/40 rounded mx-1 border border-white/5 border-b-white/10 shadow-inner">
                <span className={`text-[10px] font-mono tracking-widest uppercase ${activeTool ? 'text-amber-400' : terrainMode ? 'text-red-400' : 'text-slate-400'}`}>
                    {activeTool 
                        ? (config.buildings.find(b => b.id === activeTool)?.name.substring(0, 18) || 'Unknown Asset') 
                        : terrainMode ? 'TERRAIN EDITOR' : 'CURSOR MODE'
                    }
                </span>
             </div>
          </Panel>
      </div>

      <ResourcePanel isOpen={resourcePanelOpen} onClose={() => setResourcePanelOpen(false)} buildings={layout.buildings} config={config} />
    </div>
  );
};
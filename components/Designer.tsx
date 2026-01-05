import React, { useState, useEffect, useRef } from 'react';
import { AnnoTitle, Layout, PlacedBuilding } from '../types';
import { ANNO_GAMES } from '../data/annoData';
import { GridCanvas } from './GridCanvas';
import { GeneticSolver, SolverMode } from '../services/geneticSolver';
import { ResourcePanel } from './ResourcePanel';
import { calculateBuildingsForPopulation, PopulationGoal } from '../utils/productionCalculator';

const generateId = () => Math.random().toString(36).substring(2, 9);
const MAX_STEPS = 500; 

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

// --- MAIN DESIGNER ---

export const Designer: React.FC<DesignerProps> = ({ gameTitle, onBack }) => {
  const config = ANNO_GAMES[gameTitle];
  const [layout, setLayout] = useState<Layout>({ width: 100, height: 100, buildings: [], blockedCells: [] });
  
  // Tools & Modes
  const [activeTool, setActiveTool] = useState<string | null>(null); 
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [terrainMode, setTerrainMode] = useState(false);
  const [solverMode, setSolverMode] = useState<SolverMode>('city');
  const [activeCategory, setActiveCategory] = useState('Residence');

  // Selection
  const [selectedBuildingUid, setSelectedBuildingUid] = useState<string | null>(null);
  
  // Solver State
  const [solverCounts, setSolverCounts] = useState<Record<string, number>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [currentFitness, setCurrentFitness] = useState(0);
  
  const solverRef = useRef<GeneticSolver | null>(null);
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
      setLayout(l => ({ ...l, buildings: [] }));

      const solver = new GeneticSolver({
          areaWidth: layout.width,
          areaHeight: layout.height,
          populationSize: 1, 
          generations: MAX_STEPS,
          targetCounts: solverCounts,
          blockedCells: new Set(layout.blockedCells)
      }, config.buildings, solverMode);
      
      solver.init();
      solverRef.current = solver;
      setIsSolving(true);
      setSolverProgress(0);

      solverInterval.current = window.setInterval(() => {
          if (!solverRef.current) return;
          solverRef.current.step();
          const best = solverRef.current.getBest();
          const gen = solverRef.current.getGeneration();
          if (best) {
              setLayout(prev => ({ ...prev, buildings: best.genome }));
              setCurrentFitness(Math.floor(best.fitness));
          }
          const prog = Math.min((gen / MAX_STEPS) * 100, 100);
          setSolverProgress(prog);
          if (gen >= MAX_STEPS || (solverRef as any).current.isFinished) {
              setIsSolving(false);
              if (solverInterval.current) clearInterval(solverInterval.current);
          }
      }, 30);
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

      {/* 2. Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none p-4 flex justify-center">
        <Panel className="pointer-events-auto w-full flex-row items-center justify-between px-4 py-3 gap-6 shadow-2xl bg-[#0f172a]/95">
            {/* Left */}
            <div className="flex items-center gap-5">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors group">
                   <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div className="h-8 w-px bg-white/10"></div>
                <div>
                   <h1 className="font-black text-amber-500 tracking-[0.2em] uppercase text-sm">{config.title}</h1>
                   <div className="text-[10px] text-slate-500 font-mono tracking-widest hidden sm:block">LAYOUT ARCHITECT V2.0</div>
                </div>
            </div>

            {/* Right Status */}
            <div className="flex items-center gap-4">
                {isSolving && (
                    <div className="hidden md:flex flex-row items-center px-4 py-1.5 gap-3 rounded-md border border-emerald-500/30 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <div className="text-xs font-bold text-emerald-400 whitespace-nowrap tracking-wider">GENERATING {Math.round(solverProgress)}%</div>
                    </div>
                )}
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

      {/* 3. Left Panel: Blueprint Specs */}
      <div className={`absolute left-4 top-24 bottom-4 w-80 z-10 transition-transform duration-300 flex flex-col gap-3 ${leftPanelOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
         <Panel className="flex-1 p-0 gap-0">
             {/* Header */}
             <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    Blueprint Specs
                 </h2>
                 <div className="flex bg-slate-900/50 rounded p-1 ring-1 ring-white/5">
                    <button onClick={() => setSolverMode('city')} className={`px-3 py-1 text-[9px] font-bold rounded uppercase tracking-wider transition-all ${solverMode === 'city' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>City</button>
                    <button onClick={() => setSolverMode('industry')} className={`px-3 py-1 text-[9px] font-bold rounded uppercase tracking-wider transition-all ${solverMode === 'industry' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Ind</button>
                 </div>
             </div>

             {/* Add Target Form */}
             <div className="p-4 bg-white/5 space-y-3 border-b border-white/5">
                 <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Add Requirement</label>
                 <div className="flex gap-2">
                    <select 
                        className="flex-1 bg-black/30 border border-white/10 rounded-md p-2 text-xs font-bold text-slate-200 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer" 
                        value={newGoalTier} 
                        onChange={e => setNewGoalTier(e.target.value)}
                    >
                       {config.buildings.filter(b => b.category === 'Residence').map(b => (
                          <option key={b.id} value={b.residence?.populationType}>{b.residence?.populationType}</option>
                       ))}
                    </select>
                    <input 
                        type="number" 
                        className="w-20 bg-black/30 border border-white/10 rounded-md p-2 text-xs font-mono text-center outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500" 
                        value={newGoalCount} 
                        onChange={e => setNewGoalCount(parseInt(e.target.value) || 0)} 
                    />
                 </div>
                 <button 
                    onClick={handleUpdatePopGoal} 
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 hover:border-amber-500/50 text-xs font-bold rounded-md transition-all text-amber-500 uppercase tracking-widest shadow-sm"
                 >
                    + Add To Manifest
                 </button>
             </div>

             {/* Goal List */}
             <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                 {popGoals.length === 0 && (
                     <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl p-6">
                         <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                         <p className="text-[10px] font-bold uppercase tracking-wide">Manifest Empty</p>
                     </div>
                 )}
                 {popGoals.map(goal => (
                    <div key={goal.tierId} className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-900 flex items-center justify-center border border-white/10 text-amber-500 font-bold text-xs">
                             {goal.tierId.charAt(0)}
                          </div>
                          <div>
                              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">{goal.tierId}</p>
                              <p className="text-sm font-bold text-white leading-none mt-0.5">{goal.count}</p>
                          </div>
                       </div>
                       <button onClick={() => handleDeleteGoal(goal.tierId)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-all">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                 ))}
             </div>

             {/* Action Button */}
             <div className="p-4 bg-black/20 border-t border-white/10">
                 <button 
                    onClick={runSolver} 
                    disabled={popGoals.length === 0}
                    className={`w-full py-3.5 rounded-lg font-black tracking-widest text-xs uppercase shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                        isSolving 
                        ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-900/20' 
                        : popGoals.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                    }`}
                 >
                    {isSolving ? (
                        <><span className="animate-spin text-lg">⟳</span> Halt Printer</>
                    ) : (
                        <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> Generate Layout</>
                    )}
                 </button>
             </div>
         </Panel>
      </div>

      {/* 4. Right Panel: Asset Browser (Tabbed) */}
      <div className={`absolute right-4 top-40 bottom-20 w-72 z-10 transition-transform duration-300 flex flex-col ${rightPanelOpen ? 'translate-x-0' : 'translate-x-[120%]'}`}>
         <Panel className="flex-1">
             {/* Tabs */}
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
            
            {/* Grid */}
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
               {config.buildings.filter(b => b.category === activeCategory).length === 0 && (
                   <div className="text-center mt-10 text-slate-600 text-[10px] uppercase font-bold tracking-widest">No Assets Found</div>
               )}
            </div>
         </Panel>
      </div>

      {/* 5. Bottom Control Dock (Draggable) */}
      <div 
        style={{ left: dockPos.x, top: dockPos.y }}
        className="fixed z-50 flex gap-2"
      >
          <Panel onMouseDown={handleDockMouseDown} className="flex-row p-1.5 gap-1 select-none cursor-move items-stretch">
             {/* Drag Handle */}
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
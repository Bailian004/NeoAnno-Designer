import React, { useState, useEffect, useRef } from 'react';
import { AnnoTitle, GameConfig, Layout, PlacedBuilding, BuildingDefinition } from '../types';
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

export const Designer: React.FC<DesignerProps> = ({ gameTitle, onBack }) => {
  const config = ANNO_GAMES[gameTitle];
  const [layout, setLayout] = useState<Layout>({ width: 100, height: 100, buildings: [], blockedCells: [] });
  const [activeTool, setActiveTool] = useState<string | null>(null); 
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [terrainMode, setTerrainMode] = useState(false);
  // Fix: Changed 'residential' to 'city' to match SolverMode type
  const [solverMode, setSolverMode] = useState<SolverMode>('city');
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [selectedBuildingUid, setSelectedBuildingUid] = useState<string | null>(null);
  
  const [solverCounts, setSolverCounts] = useState<Record<string, number>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [currentFitness, setCurrentFitness] = useState(0);
  
  const solverRef = useRef<GeneticSolver | null>(null);
  const solverInterval = useRef<number | null>(null);

  const [popGoals, setPopGoals] = useState<PopulationGoal[]>([]);
  const [newGoalTier, setNewGoalTier] = useState<string>('');
  const [newGoalCount, setNewGoalCount] = useState<number>(100);
  const [resourcePanelOpen, setResourcePanelOpen] = useState(false);

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

      // Prepare canvas
      setLayout(l => ({ ...l, buildings: [] }));

      const solver = new GeneticSolver({
          areaWidth: layout.width,
          areaHeight: layout.height,
          populationSize: 1, // Deterministic doesn't need pop
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
      }, 50); 
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <div className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-slate-900 border-r border-slate-800 transition-transform duration-300 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
         <div className="flex flex-col h-full">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors">←</button>
                  <h2 className="font-black text-amber-500 tracking-tighter text-lg uppercase italic">{config.title}</h2>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
               <section className="bg-slate-800/30 p-1 rounded-xl flex gap-1 border border-slate-700">
                  {/* Fix: Changed 'residential' to 'city' and 'industrial' to 'industry' to match SolverMode type */}
                  <button onClick={() => setSolverMode('city')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${solverMode === 'city' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Residential</button>
                  <button onClick={() => setSolverMode('industry')} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${solverMode === 'industry' ? 'bg-amber-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-white'}`}>Industrial</button>
               </section>

               <section className="bg-slate-800/50 p-4 rounded-xl border border-amber-500/20 shadow-xl">
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Building Manifest</h3>
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto custom-scrollbar">
                     {popGoals.map(goal => (
                        <div key={goal.tierId} className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800 group transition-all hover:border-amber-500/30">
                           <div>
                              <p className="text-[9px] text-slate-500 uppercase font-black">{goal.tierId}</p>
                              <p className="text-sm font-bold text-white">{goal.count} Houses</p>
                           </div>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setNewGoalTier(goal.tierId); setNewGoalCount(goal.count); }} className="p-1 text-blue-400 hover:bg-blue-900/30 rounded">✎</button>
                              <button onClick={() => handleDeleteGoal(goal.tierId)} className="p-1 text-red-400 hover:bg-red-900/30 rounded">✕</button>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="space-y-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                     <div className="flex gap-2">
                        <select className="flex-1 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs font-bold text-slate-200" value={newGoalTier} onChange={e => setNewGoalTier(e.target.value)}>
                           {config.buildings.filter(b => b.category === 'Residence').map(b => (
                              <option key={b.id} value={b.residence?.populationType}>{b.residence?.populationType}</option>
                           ))}
                        </select>
                        <input type="number" className="w-16 bg-slate-900 border border-slate-700 rounded p-1.5 text-xs font-mono text-center" value={newGoalCount} onChange={e => setNewGoalCount(parseInt(e.target.value) || 0)} />
                     </div>
                     <button onClick={handleUpdatePopGoal} className="w-full py-2 bg-amber-500 text-slate-950 font-black text-[10px] uppercase rounded-lg hover:bg-amber-400 transition-all shadow-lg active:scale-95">Update Blueprint</button>
                  </div>
               </section>

               <section className="bg-slate-800/20 p-4 rounded-xl border border-slate-700/50">
                  <button onClick={runSolver} disabled={popGoals.length === 0} className={`w-full py-4 rounded-xl font-black tracking-widest text-sm transition-all shadow-2xl ${popGoals.length === 0 ? 'opacity-30 cursor-not-allowed' : ''} ${isSolving ? 'bg-red-600 animate-pulse' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:scale-[1.02]'}`}>
                     {isSolving ? 'HALT CONSTRUCTION' : 'AUTO-PRINT GRID'}
                  </button>
               </section>

               <section className="space-y-2">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Construction Depot</h3>
                  <div className="grid grid-cols-2 gap-2">
                     {config.buildings.map(b => (
                        <button key={b.id} onClick={() => setActiveTool(b.id)} className={`p-2 rounded border text-[10px] uppercase font-bold truncate transition-all ${activeTool === b.id ? 'bg-amber-500 border-amber-500 text-slate-950 shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                           <div className="flex items-center gap-2 overflow-hidden">
                              {b.icon ? (
                                <img src={b.icon} alt={b.name} className="w-4 h-4 object-contain" />
                              ) : (
                                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }}></div>
                              )}
                              <span className="truncate">{b.name}</span>
                           </div>
                        </button>
                     ))}
                  </div>
               </section>
               
               <section className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[9px] text-slate-500 leading-relaxed font-mono">
                  <p className="mb-2 text-amber-500 font-black uppercase">Shortcuts</p>
                  <p>[R] Rotate Building</p>
                  <p>[ESC] Clear Tool</p>
                  <p>[DEL] Remove Selection</p>
                  <p>[Right Click] Pan Camera</p>
                  <p>[Click Building] Show Influence</p>
               </section>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2">
               <button onClick={() => setResourcePanelOpen(true)} className="flex-1 py-3 bg-slate-800 rounded-lg text-[10px] font-black hover:bg-slate-700 transition-colors uppercase">Data Hub</button>
               <button onClick={() => setTerrainMode(!terrainMode)} className={`flex-1 py-3 rounded-lg text-[10px] font-black border transition-all uppercase ${terrainMode ? 'bg-cyan-600 border-cyan-400 shadow-lg shadow-cyan-900/40' : 'bg-slate-800 border-slate-700'}`}>Terrain</button>
            </div>
         </div>
      </div>

      <div className="flex-1 relative bg-slate-950">
         <GridCanvas 
            gameConfig={config} buildings={layout.buildings} blockedCells={new Set(layout.blockedCells)}
            width={layout.width} height={layout.height}
            onPlaceBuilding={handlePlaceBuilding} onRemoveBuilding={handleRemoveBuilding}
            onSelectBuilding={setSelectedBuildingUid} onToggleTerrain={handleToggleTerrain}
            activeBuildingId={activeTool} activeRotation={rotation} selectedBuilding={layout.buildings.find(b => b.uid === selectedBuildingUid) || null}
            readOnly={isSolving} terrainMode={terrainMode}
         />

         {isSolving && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[440px] bg-slate-900/95 backdrop-blur-xl p-8 rounded-3xl border border-emerald-500/30 shadow-2xl z-50 animate-pulse">
               <div className="flex justify-between items-end mb-6">
                  <div>
                     <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">Titan V21 Constructor</p>
                     <h4 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">Printing Grid...</h4>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Efficiency Score</p>
                     <p className="text-2xl font-mono text-amber-400 font-black">{currentFitness.toLocaleString()}</p>
                  </div>
               </div>
               <div className="relative h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden shadow-inner">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300 shadow-[0_0_15px_#10b981]" style={{width: `${solverProgress}%`}} />
               </div>
            </div>
         )}
         <ResourcePanel isOpen={resourcePanelOpen} onClose={() => setResourcePanelOpen(false)} buildings={layout.buildings} config={config} />
      </div>
    </div>
  );
};
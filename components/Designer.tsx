import React, { useState, useEffect, useRef } from 'react';
import { AnnoTitle, GameConfig, Layout, PlacedBuilding, BuildingDefinition } from '../types';
import { ANNO_GAMES } from '../data/annoData';
import { GridCanvas } from './GridCanvas';
import { GeneticSolver, SolverMode } from '../services/geneticSolver';
import { ResourcePanel } from './ResourcePanel';
import { calculateBuildingsForPopulation, PopulationGoal } from '../utils/productionCalculator';

const generateId = () => Math.random().toString(36).substring(2, 9);
const MAX_GENERATIONS = 200; 

interface DesignerProps {
  gameTitle: AnnoTitle;
  onBack: () => void;
}

export const Designer: React.FC<DesignerProps> = ({ gameTitle, onBack }) => {
  const config = ANNO_GAMES[gameTitle];
  const [layout, setLayout] = useState<Layout>({ width: 50, height: 50, buildings: [], blockedCells: [] });
  const [activeTool, setActiveTool] = useState<string | null>(null); 
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [terrainMode, setTerrainMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); 
  const [selectedBuildingUid, setSelectedBuildingUid] = useState<string | null>(null);
  
  // Solver State
  const [solverOpen, setSolverOpen] = useState(false);
  const [solverMode, setSolverMode] = useState<SolverMode>('city');
  const [solverCounts, setSolverCounts] = useState<Record<string, number>>({});
  const [isSolving, setIsSolving] = useState(false);
  const [solverProgress, setSolverProgress] = useState(0);
  const [currentFitness, setCurrentFitness] = useState(0);
  const solverRef = useRef<GeneticSolver | null>(null);
  const solverInterval = useRef<number | null>(null);

  // Auto-Calc State
  const [popGoals, setPopGoals] = useState<PopulationGoal[]>([]);
  const [newGoalTier, setNewGoalTier] = useState<string>('');
  const [newGoalCount, setNewGoalCount] = useState<number>(100);

  // Resource Panel State
  const [resourcePanelOpen, setResourcePanelOpen] = useState(false);

  // Derive selected building object
  const selectedBuilding = layout.buildings.find(b => b.uid === selectedBuildingUid) || null;

  // Handle Resize (Responsive Sidebar)
  useEffect(() => {
    // Initial check
    if (window.innerWidth < 768) {
        setSidebarOpen(false); 
    } else {
        setSidebarOpen(true);
    }

    let lastWidth = window.innerWidth;

    const handleResize = () => {
        const currentWidth = window.innerWidth;
        if (currentWidth !== lastWidth) {
            if (currentWidth < 768 && lastWidth >= 768) {
                setSidebarOpen(false);
            } else if (currentWidth >= 768 && lastWidth < 768) {
                setSidebarOpen(true);
            }
            lastWidth = currentWidth;
        }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
      const initialCounts: Record<string, number> = {};
      config.buildings.forEach(b => initialCounts[b.id] = 0);
      setSolverCounts(initialCounts);

      const firstRes = config.buildings.find(b => b.category === 'Residence');
      if (firstRes && firstRes.residence) {
          setNewGoalTier(firstRes.residence.populationType);
      }
  }, [config]);

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'r' || e.key === 'R') {
              setRotation(prev => (prev === 270 ? 0 : prev + 90) as any);
          }
          if (e.key === 'Escape') {
              setActiveTool(null);
              setTerrainMode(false);
              setSelectedBuildingUid(null);
          }
          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (selectedBuildingUid) {
                  handleRemoveBuilding(selectedBuildingUid);
                  setSelectedBuildingUid(null);
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBuildingUid]); 

  const handlePlaceBuilding = (x: number, y: number) => {
      if (!activeTool) return;
      
      const newBuilding: PlacedBuilding = {
          uid: generateId(),
          definitionId: activeTool,
          x,
          y,
          rotation
      };

      setLayout(prev => ({
          ...prev,
          buildings: [...prev.buildings, newBuilding]
      }));
  };

  const handleRemoveBuilding = (uid: string) => {
      setLayout(prev => ({
          ...prev,
          buildings: prev.buildings.filter(b => b.uid !== uid)
      }));
      if (selectedBuildingUid === uid) setSelectedBuildingUid(null);
  };

  const handleSelectBuilding = (uid: string | null) => {
      setSelectedBuildingUid(uid);
  };

  const handleToggleTerrain = (x: number, y: number) => {
      const key = `${x},${y}`;
      setLayout(prev => {
          const newBlocked = [...prev.blockedCells];
          const idx = newBlocked.indexOf(key);
          if (idx >= 0) {
              newBlocked.splice(idx, 1); 
          } else {
              newBlocked.push(key); 
          }
          return { ...prev, blockedCells: newBlocked };
      });
  };

  const applyMapPreset = (type: string) => {
      let blocked: string[] = [];
      const w = layout.width;
      const h = layout.height;
      const cx = w / 2;
      const cy = h / 2;

      if (type === 'River') {
          for(let x=0; x<w; x++) {
              blocked.push(`${x},${Math.floor(cy + Math.sin(x/5)*3)}`);
              blocked.push(`${x},${Math.floor(cy + Math.sin(x/5)*3)+1}`);
              blocked.push(`${x},${Math.floor(cy + Math.sin(x/5)*3)+2}`);
          }
      } else if (type === 'Archipelago') {
          for(let x=0; x<w; x++) {
              for(let y=0; y<h; y++) {
                  const d1 = Math.sqrt((x-w*0.3)**2 + (y-h*0.3)**2);
                  const d2 = Math.sqrt((x-w*0.7)**2 + (y-h*0.7)**2);
                  if (d1 > 12 && d2 > 10) {
                      blocked.push(`${x},${y}`);
                  }
              }
          }
      } else if (type === 'Coastline') {
          for(let x=0; x<w; x++) {
              for(let y=0; y<h; y++) {
                  if (x > w/2 + Math.sin(y/4)*5) {
                      blocked.push(`${x},${y}`);
                  }
              }
          }
      }

      setLayout(prev => ({...prev, blockedCells: blocked, buildings: [] }));
      if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const addPopGoal = () => {
      if (!newGoalTier || newGoalCount <= 0) return;
      const updatedGoals = [...popGoals, { tierId: newGoalTier, count: newGoalCount }];
      setPopGoals(updatedGoals);
      
      const requirements = calculateBuildingsForPopulation(updatedGoals, config);
      const newCounts: Record<string, number> = {};
      config.buildings.forEach(b => newCounts[b.id] = 0);
      Object.entries(requirements).forEach(([id, count]) => {
          newCounts[id] = count;
      });
      setSolverCounts(newCounts);
  };

  const removeGoal = (index: number) => {
      const updatedGoals = popGoals.filter((_, i) => i !== index);
      setPopGoals(updatedGoals);
      const requirements = calculateBuildingsForPopulation(updatedGoals, config);
      const newCounts: Record<string, number> = {};
      config.buildings.forEach(b => newCounts[b.id] = 0);
      Object.entries(requirements).forEach(([id, count]) => {
          newCounts[id] = count;
      });
      setSolverCounts(newCounts);
  };

  // Check if a building definition should be included in the current solver mode
  const isIncludedInMode = (def: BuildingDefinition, mode: SolverMode) => {
      // Always include roads/infrastructure
      if (def.id === 'road' || def.name.toLowerCase().includes('road') || (def.width === 1 && def.height === 1 && def.category === 'Decoration')) {
          return true;
      }
      
      if (mode === 'city') {
          // City: Residences, Public Services, Decorations
          return ['Residence', 'Public', 'Decoration'].includes(def.category);
      } else {
          // Industry: Production chains
          return ['Production'].includes(def.category);
      }
  };

  const runSolver = () => {
      if (isSolving) {
          if (solverInterval.current) clearInterval(solverInterval.current);
          setIsSolving(false);
          setSolverProgress(0);
          return;
      }

      // Filter the counts based on the active mode (City vs Industry)
      const filteredCounts: Record<string, number> = {};
      
      Object.entries(solverCounts).forEach(([id, val]) => {
          const count = val as number;
          if (count <= 0) return;
          const def = config.buildings.find(b => b.id === id);
          if (!def) return;

          if (isIncludedInMode(def, solverMode)) {
              filteredCounts[id] = count;
          }
      });

      // --- AUTO-SIZE GRID LOGIC ---
      let totalBuildingArea = 0;
      Object.entries(filteredCounts).forEach(([id, count]) => {
          const def = config.buildings.find(b => b.id === id);
          if (def) {
              totalBuildingArea += (def.width * def.height) * count;
          }
      });

      // Factor: 1.0 (Buildings) + ~0.8 (Roads, Spacing, Inefficiency)
      const requiredArea = totalBuildingArea * 1.8;
      const currentArea = layout.width * layout.height;
      
      let solverW = layout.width;
      let solverH = layout.height;

      // Expand if needed (only grow, never shrink automatically)
      if (requiredArea > currentArea) {
          const neededSide = Math.ceil(Math.sqrt(requiredArea));
          // Round up to nearest 10, add a buffer of 10
          const newSide = Math.ceil((neededSide + 10) / 10) * 10;
          
          solverW = Math.max(layout.width, newSide);
          solverH = Math.max(layout.height, newSide);

          setLayout(prev => ({
              ...prev,
              width: solverW,
              height: solverH
          }));
      }
      // ----------------------------

      const solver = new GeneticSolver({
          areaWidth: solverW,
          areaHeight: solverH,
          populationSize: 40,
          generations: MAX_GENERATIONS,
          targetCounts: filteredCounts,
          blockedCells: new Set(layout.blockedCells)
      }, config.buildings, solverMode);
      
      solver.init();
      solverRef.current = solver;
      setIsSolving(true);
      setSolverProgress(0);
      setCurrentFitness(0);
      if (window.innerWidth < 768) setSidebarOpen(false);

      solverInterval.current = window.setInterval(() => {
          if (solverRef.current) {
              solverRef.current.step();
              const best = solverRef.current.getBest();
              const gen = solverRef.current.getGeneration();
              
              if (best) {
                  setLayout(prev => ({ ...prev, buildings: best.genome }));
                  setCurrentFitness(Math.floor(best.fitness));
              }
              
              const progress = Math.min((gen / MAX_GENERATIONS) * 100, 100);
              setSolverProgress(progress);

              if (gen >= MAX_GENERATIONS) {
                  setIsSolving(false);
                  if (solverInterval.current) clearInterval(solverInterval.current);
              }
          }
      }, 50); 
  };

  const selectTool = (toolId: string | null) => {
      setActiveTool(toolId);
      setTerrainMode(false);
      setSelectedBuildingUid(null); // Clear selection when changing tool
      if (toolId && window.innerWidth < 768) {
          setSidebarOpen(false);
      }
  };

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden relative">
      
      {/* Mobile Top Header (Overlay) */}
      <div className="md:hidden absolute top-4 left-4 z-40 flex items-center gap-2 pointer-events-none">
          <button 
            onClick={onBack} 
            className="bg-gray-800/80 backdrop-blur text-white p-2 rounded-full shadow-lg pointer-events-auto border border-gray-600 active:scale-95 transition-transform"
          >
             ←
          </button>
          <div className="bg-gray-800/80 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-gray-600">
             <span className="font-bold text-yellow-500 text-sm">{config.title}</span>
          </div>
      </div>

      {/* Sidebar */}
      <div className={`
          absolute md:static top-0 left-0 h-full z-30 flex flex-col
          bg-gray-800 border-r border-gray-700 shadow-2xl transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0 w-full md:w-80' : '-translate-x-full md:translate-x-0 md:w-80'}
      `}>
         {/* Sidebar Header */}
         <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-900 shrink-0">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hidden md:block text-gray-400 hover:text-white transition-colors">
                  ←
              </button>
              <h2 className="hidden md:block font-bold text-yellow-500 truncate">{config.title}</h2>
              <h2 className="md:hidden font-bold text-yellow-500">Designer Tools</h2>
            </div>
            <div className="flex gap-2">
                <button 
                   onClick={() => {
                       setResourcePanelOpen(true);
                       if (window.innerWidth < 768) setSidebarOpen(false);
                   }}
                   className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-gray-200 transition-colors border border-gray-600"
                >
                   📊 Stats
                </button>
                <button 
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden text-gray-400 hover:text-white"
                >
                    ✕
                </button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {/* Auto Solver / Smart Design */}
            <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">Smart City Designer</h3>
                    <button 
                        onClick={() => setSolverOpen(!solverOpen)}
                        className="text-xs text-gray-400 hover:text-white underline"
                    >
                        {solverOpen ? 'Collapse' : 'Expand'}
                    </button>
                </div>
                
                {solverOpen && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Layout Mode Toggle */}
                        <div className="flex bg-gray-800 p-1 rounded border border-gray-700">
                             <button 
                                onClick={() => setSolverMode('city')}
                                className={`flex-1 text-xs py-1.5 rounded transition-all ${solverMode === 'city' ? 'bg-yellow-600 text-white font-bold shadow' : 'text-gray-400 hover:text-white'}`}
                             >
                                 Residential
                             </button>
                             <button 
                                onClick={() => setSolverMode('industry')}
                                className={`flex-1 text-xs py-1.5 rounded transition-all ${solverMode === 'industry' ? 'bg-blue-600 text-white font-bold shadow' : 'text-gray-400 hover:text-white'}`}
                             >
                                 Industrial
                             </button>
                        </div>

                        {/* 1. Goal Input */}
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400 font-bold block">1. Set Population Goal</label>
                            <div className="flex gap-2">
                                <select 
                                    className="bg-gray-800 text-sm border border-gray-600 rounded px-2 py-1 flex-1 text-white"
                                    value={newGoalTier}
                                    onChange={(e) => setNewGoalTier(e.target.value)}
                                >
                                    {config.buildings
                                        .filter(b => b.category === 'Residence' && b.residence)
                                        .map(b => (
                                            <option key={b.id} value={b.residence!.populationType}>
                                                {b.residence!.populationType}
                                            </option>
                                    ))}
                                </select>
                                <input 
                                    type="number" 
                                    className="w-16 bg-gray-800 text-sm border border-gray-600 rounded px-2 py-1 text-white"
                                    value={newGoalCount}
                                    onChange={(e) => setNewGoalCount(parseInt(e.target.value) || 0)}
                                    placeholder="Qty"
                                />
                                <button 
                                    onClick={addPopGoal}
                                    className="bg-yellow-600 hover:bg-yellow-500 text-black px-2 rounded font-bold"
                                >
                                    +
                                </button>
                            </div>
                            {/* Goal List */}
                            {popGoals.length > 0 && (
                                <div className="space-y-1 mt-2">
                                    {popGoals.map((g, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs bg-gray-800 p-1 rounded px-2">
                                            <span>{g.count} {g.tierId}s</span>
                                            <button onClick={() => removeGoal(i)} className="text-red-400 hover:text-red-300">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 2. Calculated Needs Preview */}
                        <details className="group">
                            <summary className="text-xs font-bold text-gray-500 cursor-pointer hover:text-gray-300 list-none flex justify-between">
                                <span>2. Calculated Buildings</span>
                                <span className="group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pl-2 border-l-2 border-gray-800">
                                {Object.entries(solverCounts).map(([id, count]) => {
                                    if (count === 0) return null;
                                    const def = config.buildings.find(b => b.id === id);
                                    if (!def) return null;
                                    
                                    const isIncluded = isIncludedInMode(def, solverMode);
                                    
                                    return (
                                        <div key={id} className={`flex justify-between text-xs ${isIncluded ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                                            <span>{def.name}</span>
                                            <span className="font-mono">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>

                        {/* 3. Run */}
                        <div className="pt-2 border-t border-gray-800 space-y-2">
                             <button
                                onClick={runSolver}
                                disabled={Object.values(solverCounts).every(c => c === 0)}
                                className={`w-full py-3 rounded text-sm font-bold transition-all shadow-lg flex flex-col items-center justify-center border-2
                                    ${isSolving 
                                        ? 'bg-red-900/50 border-red-600 text-red-100 hover:bg-red-800/50' 
                                        : 'bg-green-700/80 border-green-600 text-white hover:bg-green-600 disabled:bg-gray-700 disabled:border-gray-600 disabled:text-gray-500'}`}
                             >
                                <span>{isSolving ? 'Stop Generation' : `Generate ${solverMode === 'city' ? 'City' : 'Industry'} Layout`}</span>
                             </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Selection Info Panel */}
            {selectedBuilding && !activeTool && (
                <div className="bg-gray-800 border-l-4 border-yellow-500 p-3 rounded shadow-lg animate-fade-in">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="text-sm font-bold text-yellow-500">
                                {config.buildings.find(d => d.id === selectedBuilding.definitionId)?.name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                                {selectedBuilding.x}, {selectedBuilding.y}
                            </p>
                        </div>
                        <button 
                            onClick={() => handleRemoveBuilding(selectedBuilding.uid)}
                            className="text-red-400 hover:text-red-300 p-1"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            )}

            {/* Map & Terrain Tools */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Island Terrain</h3>
                <button
                    onClick={() => {
                        setTerrainMode(!terrainMode);
                        setActiveTool(null);
                        setSelectedBuildingUid(null);
                        if(window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full p-2 mb-2 rounded border text-sm font-bold text-center transition-all
                        ${terrainMode 
                            ? 'bg-blue-600 border-blue-400 text-white' 
                            : 'bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700'}`}
                >
                    {terrainMode ? 'Painting Terrain...' : '✏️ Edit Island Shape'}
                </button>
                <div className="grid grid-cols-3 gap-1">
                    <button onClick={() => applyMapPreset('Rectangular')} className="text-[10px] bg-gray-800 border border-gray-700 p-1 rounded hover:bg-gray-700">Empty</button>
                    <button onClick={() => applyMapPreset('River')} className="text-[10px] bg-gray-800 border border-gray-700 p-1 rounded hover:bg-gray-700">River</button>
                    <button onClick={() => applyMapPreset('Coastline')} className="text-[10px] bg-gray-800 border border-gray-700 p-1 rounded hover:bg-gray-700">Coast</button>
                    <button onClick={() => applyMapPreset('Archipelago')} className="text-[10px] bg-gray-800 border border-gray-700 p-1 rounded hover:bg-gray-700 col-span-3">Archipelago</button>
                </div>
            </div>

            {/* Manual Build Tools */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Buildings</h3>
                <div className="grid grid-cols-2 gap-2">
                    {config.buildings.map(b => (
                        <button
                            key={b.id}
                            onClick={() => selectTool(b.id)}
                            className={`p-2 rounded border text-sm text-left flex items-center gap-2 transition-all
                                ${activeTool === b.id 
                                    ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
                                    : 'border-gray-700 hover:bg-gray-700 text-gray-300'}`}
                        >
                            <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }}></div>
                            <span className="truncate">{b.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Grid Settings */}
            <div className="border-t border-gray-700 pt-4">
                 <div className="flex gap-4">
                    <div className="flex-1">
                       <label className="text-xs text-gray-400 block mb-1">Grid W</label>
                       <input 
                            type="number" 
                            value={layout.width} 
                            onChange={(e) => setLayout(prev => ({...prev, width: parseInt(e.target.value) || 10 }))}
                            className="bg-gray-900 border border-gray-700 rounded p-1 text-sm w-full"
                        />
                    </div>
                    <div className="flex-1">
                       <label className="text-xs text-gray-400 block mb-1">Grid H</label>
                       <input 
                            type="number" 
                            value={layout.height} 
                            onChange={(e) => setLayout(prev => ({...prev, height: parseInt(e.target.value) || 10 }))}
                            className="bg-gray-900 border border-gray-700 rounded p-1 text-sm w-full"
                        />
                    </div>
                 </div>
            </div>
         </div>
         <div className="p-3 bg-gray-900 border-t border-gray-700 text-xs text-center text-gray-500 shrink-0">
             NeoAnno Designer v1.3
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 relative h-full bg-black">
         <GridCanvas 
            gameConfig={config}
            buildings={layout.buildings}
            blockedCells={new Set(layout.blockedCells)}
            width={layout.width}
            height={layout.height}
            onPlaceBuilding={handlePlaceBuilding}
            onRemoveBuilding={handleRemoveBuilding}
            onSelectBuilding={handleSelectBuilding}
            onToggleTerrain={handleToggleTerrain}
            activeBuildingId={activeTool}
            activeRotation={rotation}
            selectedBuilding={selectedBuilding}
            readOnly={isSolving}
            terrainMode={terrainMode}
         />

         {/* Floating Progress Overlay (Fixed Position & Z-Index) */}
         {isSolving && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 w-11/12 md:w-96 bg-gray-900/95 backdrop-blur-md border border-yellow-500/50 rounded-lg p-4 shadow-2xl z-50 animate-fade-in ring-1 ring-black/50">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Optimizing City...</span>
                    </div>
                    <span className="text-sm font-mono text-white font-bold">{Math.round(solverProgress)}%</span>
                </div>
                
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden mb-3 border border-gray-700 shadow-inner">
                    <div 
                        className="bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-300 h-full transition-all duration-200 ease-out shadow-[0_0_10px_rgba(234,179,8,0.5)]" 
                        style={{ width: `${solverProgress}%` }}
                    ></div>
                </div>
                
                <div className="flex justify-between text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                     <span>Gen: {Math.floor((solverProgress/100) * MAX_GENERATIONS)}</span>
                     <span>Fitness: {currentFitness}</span>
                </div>
            </div>
         )}

         {/* Mobile FAB to open tools */}
         {!sidebarOpen && (
             <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden absolute bottom-6 left-6 z-40 bg-yellow-600 text-white p-4 rounded-full shadow-2xl border-2 border-yellow-400 active:scale-95 transition-all hover:bg-yellow-500 hover:scale-105"
             >
                <span className="text-xl">🛠️</span>
             </button>
         )}

         {/* Mobile Rotate Button (only if tool active) */}
         {activeTool && !sidebarOpen && (
             <button 
                onClick={() => setRotation(prev => (prev === 270 ? 0 : prev + 90) as any)}
                className="md:hidden absolute bottom-6 left-24 z-40 bg-gray-700 text-white p-4 rounded-full shadow-2xl border border-gray-500 active:scale-95 transition-all hover:bg-gray-600"
             >
                <span className="text-xl">🔄</span>
             </button>
         )}
         
         {/* Resource Panel Overlay */}
         <ResourcePanel 
            isOpen={resourcePanelOpen} 
            onClose={() => setResourcePanelOpen(false)} 
            buildings={layout.buildings}
            config={config}
         />
      </div>
    </div>
  );
};
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { PlacedBuilding, GameConfig, BuildingDefinition } from '../types';
import { CELL_SIZE } from '../constants';

interface GridCanvasProps {
  gameConfig: GameConfig;
  buildings: PlacedBuilding[];
  blockedCells: Set<string>; 
  width: number;
  height: number;
  onPlaceBuilding: (x: number, y: number) => void;
  onRemoveBuilding: (uid: string) => void;
  onSelectBuilding: (uid: string | null) => void;
  onToggleTerrain?: (x: number, y: number) => void;
  activeBuildingId: string | null;
  activeRotation: number;
  selectedBuilding: PlacedBuilding | null;
  readOnly?: boolean;
  terrainMode?: boolean;
  showAllRadii?: boolean;
}

const isRoad = (def: BuildingDefinition) => def.id === 'Street_1x1' || def.name.toLowerCase().includes('road');

// Helper to lighten hex color (mix with white)
const lightenColor = (hex: string, percent: number) => {
    // Strip hash
    const num = parseInt(hex.replace('#', ''), 16);
    // Bitwise split
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = (num >> 8 & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));
    
    // Clamp
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);

    // Reassemble
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

export const GridCanvas: React.FC<GridCanvasProps> = ({
  gameConfig,
  buildings,
  blockedCells,
  width,
  height,
  onPlaceBuilding,
  onRemoveBuilding,
  onSelectBuilding,
  onToggleTerrain,
  activeBuildingId,
  activeRotation,
  selectedBuilding,
  readOnly = false,
  terrainMode = false,
  showAllRadii = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reachabilityCacheRef = useRef<Map<string, { signature: string, results: {x: number, y: number, dist: number}[] }>>(new Map());
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 100, y: 100 });
  
  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hoverPos, setHoverPos] = useState({ x: -1, y: -1 });

  // Touch State
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);
  const [startPinchScale, setStartPinchScale] = useState<number>(1);
  const [hasTouchMoved, setHasTouchMoved] = useState(false);

  // Image Cache
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});

  // Road Cache
  const roadSet = useMemo(() => {
    const roads = new Set<string>();
    buildings.forEach(b => {
      const def = gameConfig.buildings.find(d => d.id === b.definitionId);
      if (def && isRoad(def)) roads.add(`${b.x},${b.y}`);
    });
    return roads;
  }, [buildings, gameConfig.buildings]);

  const roadSignature = useMemo(() => Array.from(roadSet).sort().join('|'), [roadSet]);

  useEffect(() => {
    reachabilityCacheRef.current.clear();
  }, [roadSignature]);

  useEffect(() => {
    const loadedImages: Record<string, HTMLImageElement> = {};
    gameConfig.buildings.forEach(b => {
      if (b.icon) {
        const img = new Image();
        img.src = b.icon;
        img.onerror = () => {
           if (img.src.includes('/icons/')) {
               const fileName = img.src.split('/').pop();
               if (fileName) {
                   img.src = `./${fileName}`;
               }
           }
        };
        loadedImages[b.id] = img; 
      }
    });
    setImages(loadedImages);
  }, [gameConfig]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeHandler = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    window.addEventListener('resize', resizeHandler);
    const observer = new ResizeObserver(resizeHandler);
    observer.observe(container);
    resizeHandler();

    return () => {
      window.removeEventListener('resize', resizeHandler);
      observer.disconnect();
    };
  }, []);

    // --- PATHFINDING FOR STREET DISTANCE ---
    const getReachableRoads = useCallback((startX: number, startY: number, range: number) => {
      const cacheKey = `${startX},${startY},${range}`;
      const cached = reachabilityCacheRef.current.get(cacheKey);
      if (cached && cached.signature === roadSignature) return cached.results;

      const queue: {x: number, y: number, dist: number}[] = [{ x: startX, y: startY, dist: 0 }];
      const visited = new Set<string>([`${startX},${startY}`]);
      const results: {x: number, y: number, dist: number}[] = [];

      while(queue.length > 0) {
        const {x, y, dist} = queue.shift()!;
        if (dist > range) continue;
        if (dist > 0 && roadSet.has(`${x},${y}`)) results.push({x, y, dist});

        const neighbors: [number, number][] = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
        for(const [nx, ny] of neighbors) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            if (roadSet.has(key) || dist === 0) {
              visited.add(key);
              queue.push({x: nx, y: ny, dist: dist + 1});
            }
          }
        }
      }

      reachabilityCacheRef.current.set(cacheKey, { signature: roadSignature, results });
      return results;
    }, [roadSet, roadSignature]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.fillStyle = '#020617'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.scale(dpr, dpr);
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    const fullWidth = width * CELL_SIZE;
    const fullHeight = height * CELL_SIZE;

    // Board Area
    ctx.fillStyle = gameConfig.backgroundColor || '#0f172a';
    ctx.fillRect(0, 0, fullWidth, fullHeight);

    // Grid Lines
    ctx.beginPath();
    ctx.lineWidth = 1 / scale;
    for (let x = 0; x <= width; x++) {
      ctx.strokeStyle = x % 10 === 0 ? '#334155' : '#1e293b';
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, fullHeight);
    }
    for (let y = 0; y <= height; y++) {
      ctx.strokeStyle = y % 10 === 0 ? '#334155' : '#1e293b';
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(fullWidth, y * CELL_SIZE);
    }
    ctx.stroke();

    // Road Layer
    const roadDefId = gameConfig.buildings.find(d => d.name.toLowerCase().includes('road'))?.id;
    buildings.filter(b => b.definitionId === roadDefId).forEach(r => {
      ctx.fillStyle = '#64748b'; 
      ctx.fillRect(r.x * CELL_SIZE, r.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Building Layer
    buildings.filter(b => b.definitionId !== roadDefId).forEach(b => {
      const def = gameConfig.buildings.find(d => d.id === b.definitionId);
      if (!def) return;
      const isRotated = b.rotation === 90 || b.rotation === 270;
      const bw = isRotated ? def.height : def.width;
      const bh = isRotated ? def.width : def.height;
      const px = b.x * CELL_SIZE;
      const py = b.y * CELL_SIZE;
      const pw = bw * CELL_SIZE;
      const ph = bh * CELL_SIZE;
      const isSelected = selectedBuilding?.uid === b.uid;

      ctx.save();
      
      // COLOR LOGIC: 50% lighter if module, no alpha
      let fillColor = def.color;
      if (b.isModule) {
          fillColor = lightenColor(def.color, 30); // 30-50% mix with white
      }

      const img = images[b.definitionId];

      if (img && img.complete && img.naturalWidth !== 0 && scale > 0.3) {
         ctx.fillStyle = fillColor + (b.isModule ? '' : '88'); 
         ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);
         if (!b.isModule) ctx.drawImage(img, px + 1, py + 1, pw - 2, ph - 2);
      } else {
         ctx.fillStyle = fillColor;
         ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);
      }
      
      ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = isSelected ? 4 / scale : 1 / scale;
      ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

      if (scale > 0.6 && (!b.isModule) && (!img || !img.complete || img.naturalWidth === 0)) {
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)';
        ctx.font = `${isSelected ? 'black' : 'bold'} ${Math.max(8, 10 / scale)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(def.name.substring(0, 10), px + pw/2, py + ph/2 + 4);
      }

      ctx.restore();
    });

    // Blocked Terrain
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; 
    blockedCells.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // OVERLAY LOGIC
    const drawInfluence = (b: PlacedBuilding, def: BuildingDefinition) => {
        const range = def.influenceRange || 0;
        const radius = def.influenceRadius || def.impactRadius || 0;
        
        if (range > 0) {
            const roads = getReachableRoads(b.x, b.y, range);
            roads.forEach(r => {
                const px = r.x * CELL_SIZE;
                const py = r.y * CELL_SIZE;
                const percent = 1 - (r.dist / range);
                ctx.fillStyle = `rgba(0, 180, 0, ${0.2 + (percent * 0.4)})`;
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                ctx.fillStyle = '#FFD700';
                ctx.fillRect(px + CELL_SIZE/2 - 2, py + CELL_SIZE/2 - 2, 4, 4);
            });
        }
        
        if (radius > 0) {
            const cx = (b.x + def.width / 2) * CELL_SIZE;
            const cy = (b.y + def.height / 2) * CELL_SIZE;
            const rPx = radius * CELL_SIZE;

            ctx.beginPath();
            ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
            ctx.fillStyle = `${def.color}44`; 
            ctx.fill();
            ctx.strokeStyle = `${def.color}AA`;
            ctx.lineWidth = 2 / scale;
            ctx.stroke();
        }
    };

    if (showAllRadii) {
        buildings.forEach(b => {
             const def = gameConfig.buildings.find(d => d.id === b.definitionId);
             if (def && (def.influenceRadius || def.influenceRange || def.impactRadius)) {
                 drawInfluence(b, def);
             }
        });
    } else if (selectedBuilding) {
      const def = gameConfig.buildings.find(d => d.id === selectedBuilding.definitionId);
      if (def && (def.influenceRadius || def.influenceRange || def.impactRadius)) {
        const similarBuildings = buildings.filter(b => b.definitionId === selectedBuilding.definitionId);
        similarBuildings.forEach(b => drawInfluence(b, def));
      }
    }

    if (!readOnly && activeBuildingId && hoverPos.x !== -1) {
      const def = gameConfig.buildings.find(d => d.id === activeBuildingId);
      if (def) {
        const isRotated = activeRotation === 90 || activeRotation === 270;
        const w = (isRotated ? def.height : def.width) * CELL_SIZE;
        const h = (isRotated ? def.width : def.height) * CELL_SIZE;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(hoverPos.x * CELL_SIZE, hoverPos.y * CELL_SIZE, w, h);
      }
    }
    if (terrainMode && hoverPos.x !== -1) {
      const cellKey = `${hoverPos.x},${hoverPos.y}`;
      const fill = blockedCells.has(cellKey) ? 'rgba(248, 113, 113, 0.25)' : 'rgba(34, 197, 94, 0.2)';
      ctx.fillStyle = fill;
      ctx.fillRect(hoverPos.x * CELL_SIZE, hoverPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1 / scale;
      ctx.strokeRect(hoverPos.x * CELL_SIZE + 0.5, hoverPos.y * CELL_SIZE + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    }
  }, [width, height, offset, scale, gameConfig, buildings, blockedCells, activeBuildingId, activeRotation, hoverPos, readOnly, selectedBuilding, images, showAllRadii, terrainMode, roadSignature, roadSet, getReachableRoads]);

  useEffect(() => {
    let frame: number;
    const loop = () => { render(); frame = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [render]);

  const handleInteraction = (clientX: number, clientY: number) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left - offset.x) / scale;
    const my = (clientY - rect.top - offset.y) / scale;
    const gx = Math.floor(mx / CELL_SIZE);
    const gy = Math.floor(my / CELL_SIZE);
    if (terrainMode && onToggleTerrain) onToggleTerrain(gx, gy);
    else if (activeBuildingId) onPlaceBuilding(gx, gy);
    else {
        const clicked = buildings.find(b => {
          const def = gameConfig.buildings.find(d => d.id === b.definitionId)!;
          const isRotated = b.rotation === 90 || b.rotation === 270;
          const w = isRotated ? def.height : def.width;
          const h = isRotated ? def.width : def.height;
          return gx >= b.x && gx < b.x + w && gy >= b.y && gy < b.y + h;
        });
        onSelectBuilding(clicked ? clicked.uid : null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) { setIsDragging(true); setLastPos({ x: e.clientX, y: e.clientY }); e.preventDefault(); return; }
    if (e.button === 0) handleInteraction(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / scale;
    const my = (e.clientY - rect.top - offset.y) / scale;
    setHoverPos({ x: Math.floor(mx / CELL_SIZE), y: Math.floor(my / CELL_SIZE) });
    if (isDragging) { setOffset(prev => ({ x: prev.x + (e.clientX - lastPos.x), y: prev.y + (e.clientY - lastPos.y) })); setLastPos({ x: e.clientX, y: e.clientY }); }
  };
  const getTouchDist = (t1: React.Touch, t2: React.Touch) => { const dx = t1.clientX - t2.clientX; const dy = t1.clientY - t2.clientY; return Math.hypot(dx, dy); };
  const handleTouchStart = (e: React.TouchEvent) => { if (e.touches.length === 1) { setIsDragging(true); setHasTouchMoved(false); setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY }); } else if (e.touches.length === 2) { const dist = getTouchDist(e.touches[0], e.touches[1]); setTouchStartDist(dist); setStartPinchScale(scale); } };
  const handleTouchMove = (e: React.TouchEvent) => { if (e.touches.length === 1 && isDragging) { const dx = e.touches[0].clientX - lastPos.x; const dy = e.touches[0].clientY - lastPos.y; if (!hasTouchMoved && Math.hypot(dx, dy) > 5) setHasTouchMoved(true); if (hasTouchMoved) { setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy })); setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY }); } } else if (e.touches.length === 2 && touchStartDist !== null) { setHasTouchMoved(true); const dist = getTouchDist(e.touches[0], e.touches[1]); const zoomFactor = dist / touchStartDist; const newScale = Math.min(Math.max(0.1, startPinchScale * zoomFactor), 5); setScale(newScale); } };
  const handleTouchEnd = (e: React.TouchEvent) => { if (!hasTouchMoved && isDragging && e.changedTouches.length > 0 && e.touches.length === 0) { const touch = e.changedTouches[0]; handleInteraction(touch.clientX, touch.clientY); } if (e.touches.length === 0) { setIsDragging(false); setTouchStartDist(null); setHasTouchMoved(false); } };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 relative overflow-hidden cursor-crosshair touch-none">
      <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => setIsDragging(false)} onContextMenu={e => e.preventDefault()} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onWheel={(e) => { e.preventDefault(); const zoom = e.deltaY > 0 ? 0.9 : 1.1; setScale(s => Math.min(Math.max(0.1, s * zoom), 5)); }} className="block touch-none" />
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur text-[10px] text-slate-400 p-2 rounded border border-slate-800 pointer-events-none">
        <p className="hidden md:block">Right Click / Shift+Click: Pan</p>
        <p className="md:hidden">1 Finger: Pan/Click, 2 Fingers: Zoom</p>
        <p>Zoom: {Math.round(scale * 100)}%</p>
      </div>
    </div>
  );
};
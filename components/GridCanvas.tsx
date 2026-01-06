import React, { useRef, useEffect, useState, useCallback } from 'react';
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

  useEffect(() => {
    const loadedImages: Record<string, HTMLImageElement> = {};
    gameConfig.buildings.forEach(b => {
      if (b.icon) {
        const img = new Image();
        img.src = b.icon;
        
        // Fallback logic
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

      const img = images[b.definitionId];

      if (img && img.complete && img.naturalWidth !== 0 && scale > 0.3) {
         ctx.fillStyle = def.color + '88'; 
         ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);
         ctx.drawImage(img, px + 1, py + 1, pw - 2, ph - 2);
      } else {
         ctx.fillStyle = def.color;
         ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);
      }
      
      ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = isSelected ? 4 / scale : 1 / scale;
      ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

      if (scale > 0.6 && (!img || !img.complete || img.naturalWidth === 0)) {
        ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)';
        ctx.font = `${isSelected ? 'black' : 'bold'} ${Math.max(8, 10 / scale)}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(def.name.substring(0, 10), px + pw/2, py + ph/2 + 4);
      }
    });

    // Blocked Terrain
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)'; 
    blockedCells.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    // Influence Areas
    const drawInfluence = (b: PlacedBuilding, def: BuildingDefinition) => {
        const radius = def.influenceRadius || def.impactRadius || 0;
        if (radius <= 0) return;
        
        const color = def.color; 
        
        const cx = (b.x + def.width / 2) * CELL_SIZE;
        const cy = (b.y + def.height / 2) * CELL_SIZE;
        const rPx = radius * CELL_SIZE;

        ctx.beginPath();
        ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
        ctx.fillStyle = `${color}44`; 
        ctx.fill();
        ctx.strokeStyle = `${color}AA`;
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
    };

    if (showAllRadii) {
        buildings.forEach(b => {
             const def = gameConfig.buildings.find(d => d.id === b.definitionId);
             if (def && (def.influenceRadius || def.impactRadius)) {
                 drawInfluence(b, def);
             }
        });
    } else if (selectedBuilding) {
      const def = gameConfig.buildings.find(d => d.id === selectedBuilding.definitionId);
      if (def && (def.influenceRadius || def.impactRadius)) {
        const similarBuildings = buildings.filter(b => b.definitionId === selectedBuilding.definitionId);
        similarBuildings.forEach(b => drawInfluence(b, def));
      }
    }

    // Hover Ghost (Desktop)
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
  }, [width, height, offset, scale, gameConfig, buildings, blockedCells, activeBuildingId, activeRotation, hoverPos, readOnly, selectedBuilding, images, showAllRadii]);

  useEffect(() => {
    let frame: number;
    const loop = () => { render(); frame = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [render]);

  // --- Interaction Logic (Shared between Mouse and Touch) ---
  const handleInteraction = (clientX: number, clientY: number) => {
    if (readOnly) return;
    const canvas = canvasRef.current;
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    const mx = (clientX - rect.left - offset.x) / scale;
    const my = (clientY - rect.top - offset.y) / scale;
    const gx = Math.floor(mx / CELL_SIZE);
    const gy = Math.floor(my / CELL_SIZE);

    if (terrainMode && onToggleTerrain) {
        onToggleTerrain(gx, gy);
    } else if (activeBuildingId) {
        onPlaceBuilding(gx, gy);
    } else {
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

  // --- Mouse Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
        e.preventDefault();
        return;
    }
    if (e.button === 0) {
        handleInteraction(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    
    // Update Hover Pos
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / scale;
    const my = (e.clientY - rect.top - offset.y) / scale;
    setHoverPos({ x: Math.floor(mx / CELL_SIZE), y: Math.floor(my / CELL_SIZE) });

    if (isDragging) {
      setOffset(prev => ({ x: prev.x + (e.clientX - lastPos.x), y: prev.y + (e.clientY - lastPos.y) }));
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  // --- Touch Handlers ---
  const getTouchDist = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
        // Prepare for Pan or Click
        setIsDragging(true); // Treat as drag start
        setHasTouchMoved(false);
        setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
        // Pinch Start
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        setTouchStartDist(dist);
        setStartPinchScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default browser scrolling
    // Note: Touch events on canvas usually need CSS touch-action: none for full control
    if (e.touches.length === 1 && isDragging) {
       const dx = e.touches[0].clientX - lastPos.x;
       const dy = e.touches[0].clientY - lastPos.y;
       
       // Sensitivity check to distinguish tap from drag
       if (!hasTouchMoved && Math.hypot(dx, dy) > 5) {
           setHasTouchMoved(true);
       }

       if (hasTouchMoved) {
          setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          setLastPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
       }
    } else if (e.touches.length === 2 && touchStartDist !== null) {
       setHasTouchMoved(true);
       const dist = getTouchDist(e.touches[0], e.touches[1]);
       const zoomFactor = dist / touchStartDist;
       const newScale = Math.min(Math.max(0.1, startPinchScale * zoomFactor), 5);
       setScale(newScale);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // If it was a single touch and we didn't move significantly, treat as tap
    if (!hasTouchMoved && isDragging && e.changedTouches.length > 0 && e.touches.length === 0) {
        const touch = e.changedTouches[0];
        handleInteraction(touch.clientX, touch.clientY);
    }

    // Reset interaction states if no fingers left
    if (e.touches.length === 0) {
        setIsDragging(false);
        setTouchStartDist(null);
        setHasTouchMoved(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); 
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 relative overflow-hidden cursor-crosshair touch-none">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={() => setIsDragging(false)} 
        onContextMenu={handleContextMenu}
        
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}

        onWheel={(e) => {
          e.preventDefault();
          const zoom = e.deltaY > 0 ? 0.9 : 1.1;
          setScale(s => Math.min(Math.max(0.1, s * zoom), 5));
        }} 
        className="block touch-none" 
      />
      {/* Zoom / Pan Help Overlay */}
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur text-[10px] text-slate-400 p-2 rounded border border-slate-800 pointer-events-none">
        <p className="hidden md:block">Right Click / Shift+Click: Pan</p>
        <p className="md:hidden">1 Finger: Pan/Click, 2 Fingers: Zoom</p>
        <p>Zoom: {Math.round(scale * 100)}%</p>
      </div>
    </div>
  );
};
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
  terrainMode = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [offset, setOffset] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hoverPos, setHoverPos] = useState({ x: -1, y: -1 });

  // Image Cache
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const loadedImages: Record<string, HTMLImageElement> = {};
    gameConfig.buildings.forEach(b => {
      if (b.icon) {
        const img = new Image();
        img.src = b.icon;
        // We set it immediately, though it might take a moment to load.
        // The canvas loop will pick it up when complete.
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
         // Draw Image if loaded and zoomed in enough
         // We might want to draw a background color still if the image has transparency
         ctx.fillStyle = def.color + '88'; // Add some transparency
         ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);
         ctx.drawImage(img, px + 1, py + 1, pw - 2, ph - 2);
      } else {
         // Fallback to pure color
         ctx.fillStyle = def.color;
         ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);
      }
      
      ctx.strokeStyle = isSelected ? '#f59e0b' : 'rgba(0,0,0,0.5)';
      ctx.lineWidth = isSelected ? 4 / scale : 1 / scale;
      ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);

      // Text label (only if not drawing image or zoomed in very close)
      if (scale > 0.6 && (!img || !img.complete)) {
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

    // Influence Areas (Moved to Overlay position: top of everything)
    if (selectedBuilding) {
      const def = gameConfig.buildings.find(d => d.id === selectedBuilding.definitionId);
      if (def && (def.influenceRadius || def.impactRadius)) {
        const radius = def.influenceRadius || def.impactRadius || 0;
        const color = def.influenceRadius ? '#facc15' : (def.impactType === 'Negative' ? '#ef4444' : '#4ade80');
        
        // Find all buildings of same type
        const similarBuildings = buildings.filter(b => b.definitionId === selectedBuilding.definitionId);
        
        similarBuildings.forEach(b => {
          const cx = (b.x + def.width / 2) * CELL_SIZE;
          const cy = (b.y + def.height / 2) * CELL_SIZE;
          const rPx = radius * CELL_SIZE;

          ctx.beginPath();
          ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
          ctx.fillStyle = `${color}44`; // Slightly increased alpha for overlay visibility
          ctx.fill();
          ctx.strokeStyle = `${color}88`;
          ctx.lineWidth = 3 / scale;
          ctx.stroke();
        });
      }
    }

    // Hover Ghost
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
  }, [width, height, offset, scale, gameConfig, buildings, blockedCells, activeBuildingId, activeRotation, hoverPos, readOnly, selectedBuilding, images]);

  useEffect(() => {
    let frame: number;
    const loop = () => { render(); frame = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(frame);
  }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Pan with Middle Mouse (1), Right Mouse (2), or Shift+Left
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
        e.preventDefault();
        return;
    }
    
    if (e.button === 0 && !readOnly) {
      if (terrainMode && onToggleTerrain) {
          onToggleTerrain(hoverPos.x, hoverPos.y);
      } else if (activeBuildingId) {
          onPlaceBuilding(hoverPos.x, hoverPos.y);
      } else {
        const clicked = buildings.find(b => {
          const def = gameConfig.buildings.find(d => d.id === b.definitionId)!;
          const isRotated = b.rotation === 90 || b.rotation === 270;
          const w = isRotated ? def.height : def.width;
          const h = isRotated ? def.width : def.height;
          return hoverPos.x >= b.x && hoverPos.x < b.x + w && hoverPos.y >= b.y && hoverPos.y < b.y + h;
        });
        onSelectBuilding(clicked ? clicked.uid : null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - offset.x) / scale;
    const my = (e.clientY - rect.top - offset.y) / scale;
    setHoverPos({ x: Math.floor(mx / CELL_SIZE), y: Math.floor(my / CELL_SIZE) });

    if (isDragging) {
      setOffset(prev => ({ x: prev.x + (e.clientX - lastPos.x), y: prev.y + (e.clientY - lastPos.y) }));
      setLastPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // Disable context menu for right-click panning
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-slate-950 relative overflow-hidden cursor-crosshair">
      <canvas 
        ref={canvasRef} 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={() => setIsDragging(false)} 
        onContextMenu={handleContextMenu}
        onWheel={(e) => {
          e.preventDefault();
          const zoom = e.deltaY > 0 ? 0.9 : 1.1;
          setScale(s => Math.min(Math.max(0.1, s * zoom), 5));
        }} 
        className="block" 
      />
      {/* Zoom / Pan Help Overlay */}
      <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur text-[10px] text-slate-400 p-2 rounded border border-slate-800 pointer-events-none">
        <p>Right Click / Shift+Click: Pan</p>
        <p>Scroll: Zoom ({Math.round(scale * 100)}%)</p>
      </div>
    </div>
  );
};
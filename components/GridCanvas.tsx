import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlacedBuilding, GameConfig, BuildingDefinition } from '../types';
import { CELL_SIZE, GRID_LINE_COLOR, GRID_MAJOR_LINE_COLOR, CANVAS_BG_COLOR } from '../constants';

interface GridCanvasProps {
  gameConfig: GameConfig;
  buildings: PlacedBuilding[];
  blockedCells: Set<string>; // "x,y"
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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [hoverPos, setHoverPos] = useState({ x: -1, y: -1 });

  // Touch handling state
  const touchRef = useRef<{
    lastDist: number | null;
    startPan: { x: number, y: number } | null;
    isPinching: boolean;
    startTouchTime: number;
  }>({ lastDist: null, startPan: null, isPinching: false, startTouchTime: 0 });

  // Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = CANVAS_BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply Transform
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);

    // Draw Grid
    const gridSize = width * CELL_SIZE;
    const gridHeight = height * CELL_SIZE;

    // Background for play area
    ctx.fillStyle = gameConfig.backgroundColor;
    ctx.fillRect(0, 0, gridSize, gridHeight);

    // Draw Terrain (Water/Blocked)
    ctx.fillStyle = '#1e3a8a'; // Dark Blue for water/blocked
    blockedCells.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    });

    ctx.lineWidth = 1;
    
    // Vertical lines
    ctx.beginPath();
    for (let x = 0; x <= width; x++) {
      ctx.strokeStyle = x % 10 === 0 ? GRID_MAJOR_LINE_COLOR : GRID_LINE_COLOR;
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, gridHeight);
    }
    ctx.stroke();

    // Horizontal lines
    ctx.beginPath();
    for (let y = 0; y <= height; y++) {
      ctx.strokeStyle = y % 10 === 0 ? GRID_MAJOR_LINE_COLOR : GRID_LINE_COLOR;
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(gridSize, y * CELL_SIZE);
    }
    ctx.stroke();

    // Separate roads and buildings
    const roadRenderList: {b: PlacedBuilding, def: BuildingDefinition}[] = [];
    const buildingRenderList: {b: PlacedBuilding, def: BuildingDefinition}[] = [];

    buildings.forEach(b => {
        const def = gameConfig.buildings.find(d => d.id === b.definitionId);
        if(!def) return;
        // Check if it's a road based on ID or name convention
        if (def.name.toLowerCase().includes('road') || def.id.includes('road')) {
            roadRenderList.push({b, def});
        } else {
            buildingRenderList.push({b, def});
        }
    });

    // 1. Draw Roads (Flat Network Layer)
    // We draw them flat to look like a connected pavement
    roadRenderList.forEach(({b, def}) => {
        const px = b.x * CELL_SIZE;
        const py = b.y * CELL_SIZE;
        // Roads are typically 1x1, but handle generic size just in case
        const w = (b.rotation % 180 === 0) ? def.width : def.height;
        const h = (b.rotation % 180 === 0) ? def.height : def.width;
        const pw = w * CELL_SIZE;
        const ph = h * CELL_SIZE;

        // Draw road base
        ctx.fillStyle = '#6b7280'; // Neutral grey for roads
        ctx.fillRect(px, py, pw, ph);

        // Optional: Very subtle lighter center to distinguish from terrain
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(px + 2, py + 2, pw - 4, ph - 4);
    });

    // 2. Draw Buildings (3D Box Layer)
    buildingRenderList.forEach(({b, def}) => {
      // Handle Rotation Dimensions
      const isRotated = b.rotation === 90 || b.rotation === 270;
      const w = isRotated ? def.height : def.width;
      const h = isRotated ? def.width : def.height;

      const px = b.x * CELL_SIZE;
      const py = b.y * CELL_SIZE;
      const pw = w * CELL_SIZE;
      const ph = h * CELL_SIZE;

      // Highlight Selection
      const isSelected = selectedBuilding?.uid === b.uid;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(px + 3, py + 3, pw, ph);

      // Body
      ctx.fillStyle = def.color;
      ctx.fillRect(px + 1, py + 1, pw - 2, ph - 2);

      // Top Highlight (Bevel effect)
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(px + 1, py + 1, pw - 2, (ph - 2) / 2);

      // Border
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(0,0,0,0.2)';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
      
      if (isSelected) {
          ctx.strokeStyle = '#facc15'; // Yellow selection glow
          ctx.lineWidth = 2;
          ctx.strokeRect(px - 1, py - 1, pw + 2, ph + 2);
      }

      // Text/Icon (Only if zoomed in)
      if (scale > 0.4) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Truncate name if too long
        let label = def.name;
        if (def.width === 1 && def.height === 1) label = ''; // No text for tiny things
        else if (label.length > 8) label = label.substring(0, 7) + '..';
        
        if (label) {
            ctx.fillText(label, px + pw/2, py + ph/2);
        }
      }
    });

    // Draw Radius Visualization (Influence / Impact)
    // Priority: Placing > Selected > Hover
    let radiusDef: BuildingDefinition | undefined;
    let rX = 0, rY = 0, rRot = 0;
    let shouldDraw = false;

    if (!readOnly && activeBuildingId && !terrainMode) {
         // PLACING
         const def = gameConfig.buildings.find(d => d.id === activeBuildingId);
         if (def && hoverPos.x !== -1) {
             radiusDef = def;
             rX = hoverPos.x;
             rY = hoverPos.y;
             rRot = activeRotation;
             shouldDraw = true;
         }
    } else if (selectedBuilding) {
         // SELECTED
         const def = gameConfig.buildings.find(d => d.id === selectedBuilding.definitionId);
         if (def) {
             radiusDef = def;
             rX = selectedBuilding.x;
             rY = selectedBuilding.y;
             rRot = selectedBuilding.rotation;
             shouldDraw = true;
         }
    } else if (!activeBuildingId && !terrainMode && hoverPos.x !== -1) {
         // HOVER (Fallback)
         const hovered = buildings.find(b => {
             const def = gameConfig.buildings.find(d => d.id === b.definitionId);
             if (!def) return false;
             const isRotated = b.rotation === 90 || b.rotation === 270;
             const w = isRotated ? def.height : def.width;
             const h = isRotated ? def.width : def.height;
             return hoverPos.x >= b.x && hoverPos.x < b.x + w &&
                    hoverPos.y >= b.y && hoverPos.y < b.y + h;
         });
         
         if (hovered) {
             radiusDef = gameConfig.buildings.find(d => d.id === hovered.definitionId);
             rX = hovered.x;
             rY = hovered.y;
             rRot = hovered.rotation;
             shouldDraw = true;
         }
    }

    // Draw multiple radii if applicable
    if (shouldDraw && radiusDef) {
        const isRotated = rRot === 90 || rRot === 270;
        const w = isRotated ? radiusDef.height : radiusDef.width;
        const h = isRotated ? radiusDef.width : radiusDef.height;
        const cx = (rX + w/2) * CELL_SIZE;
        const cy = (rY + h/2) * CELL_SIZE;

        // 1. Service/Influence Radius (Green)
        if (radiusDef.influenceRadius) {
            const rPx = radiusDef.influenceRadius * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(cx, cy, rPx, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'; 
            ctx.fill();
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 10]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // 2. Impact Radius (Red/Teal)
        if (radiusDef.impactRadius && radiusDef.impactType) {
            const rPx = radiusDef.impactRadius * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(cx, cy, rPx, 0, 2 * Math.PI);
            
            if (radiusDef.impactType === 'Negative') {
                // Pollution/Noise
                ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; 
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
            } else {
                // Positive/Beauty
                ctx.fillStyle = 'rgba(20, 184, 166, 0.15)'; 
                ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
            }
            
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    

    // Terrain Mode Cursor
    if (terrainMode && hoverPos.x >= 0 && hoverPos.x < width && hoverPos.y >= 0 && hoverPos.y < height) {
        ctx.fillStyle = 'rgba(30, 58, 138, 0.5)';
        ctx.fillRect(hoverPos.x * CELL_SIZE, hoverPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#60a5fa';
        ctx.strokeRect(hoverPos.x * CELL_SIZE, hoverPos.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    }

    // Ghost Building (if placing)
    if (!readOnly && !terrainMode && activeBuildingId && hoverPos.x >= 0 && hoverPos.x < width && hoverPos.y >= 0 && hoverPos.y < height) {
      const def = gameConfig.buildings.find(d => d.id === activeBuildingId);
      if (def) {
        const isRotated = activeRotation === 90 || activeRotation === 270;
        const w = isRotated ? def.height : def.width;
        const h = isRotated ? def.width : def.height;
        const isRoad = def.name.toLowerCase().includes('road') || def.id.includes('road');

        if (isRoad) {
             ctx.fillStyle = 'rgba(156, 163, 175, 0.7)'; // Ghost road
             ctx.fillRect(hoverPos.x * CELL_SIZE, hoverPos.y * CELL_SIZE, w * CELL_SIZE, h * CELL_SIZE);
        } else {
             ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
             ctx.fillRect(hoverPos.x * CELL_SIZE, hoverPos.y * CELL_SIZE, w * CELL_SIZE, h * CELL_SIZE);
             ctx.strokeStyle = '#fff';
             ctx.lineWidth = 2;
             ctx.strokeRect(hoverPos.x * CELL_SIZE, hoverPos.y * CELL_SIZE, w * CELL_SIZE, h * CELL_SIZE);
        }
      }
    }

    ctx.restore();
  }, [width, height, offset, scale, gameConfig, buildings, blockedCells, activeBuildingId, activeRotation, hoverPos, readOnly, terrainMode, selectedBuilding]);

  useEffect(() => {
    let animationFrameId: number;
    const loop = () => {
      render();
      animationFrameId = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, [render]);

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle click or shift+click or right click to pan
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.shiftKey)) {
        setIsDragging(true);
        setLastPos({ x: e.clientX, y: e.clientY });
        e.preventDefault();
        return;
    }

    if (e.button === 0 && !readOnly) {
        handleInteraction(hoverPos.x, hoverPos.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if(!canvas) return;

    if (isDragging) {
      const dx = e.clientX - lastPos.x;
      const dy = e.clientY - lastPos.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setLastPos({ x: e.clientX, y: e.clientY });
    } else {
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left - offset.x) / scale;
        const my = (e.clientY - rect.top - offset.y) / scale;
        
        const gridX = Math.floor(mx / CELL_SIZE);
        const gridY = Math.floor(my / CELL_SIZE);

        setHoverPos({ x: gridX, y: gridY });
        
        // Drag-to-paint terrain
        if (terrainMode && e.buttons === 1 && onToggleTerrain && !readOnly) {
             if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                 onToggleTerrain(gridX, gridY);
             }
        }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -Math.sign(e.deltaY) * 0.1;
    setScale(s => Math.min(Math.max(0.2, s + delta), 4));
  };

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
      touchRef.current.startTouchTime = Date.now();

      if (e.touches.length === 2) {
          // Pinch Start
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          touchRef.current.lastDist = dist;
          touchRef.current.isPinching = true;
      } else if (e.touches.length === 1) {
          // Pan/Interact Start
          touchRef.current.startPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          touchRef.current.isPinching = false;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      e.preventDefault(); // Stop scrolling

      if (touchRef.current.isPinching && e.touches.length === 2) {
          // Pinch Zoom
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          
          if (touchRef.current.lastDist) {
              const delta = dist - touchRef.current.lastDist;
              const zoomFactor = delta * 0.005; 
              setScale(s => Math.min(Math.max(0.2, s + zoomFactor), 4));
          }
          touchRef.current.lastDist = dist;
      } 
      else if (!touchRef.current.isPinching && e.touches.length === 1 && touchRef.current.startPan) {
          // Pan
          const dx = e.touches[0].clientX - touchRef.current.startPan.x;
          const dy = e.touches[0].clientY - touchRef.current.startPan.y;
          
          setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          touchRef.current.startPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };

          // If in terrain mode, paint while dragging
          if (terrainMode && !readOnly) {
              const canvas = canvasRef.current;
              if (canvas) {
                  const rect = canvas.getBoundingClientRect();
                  const mx = (e.touches[0].clientX - rect.left - offset.x) / scale;
                  const my = (e.touches[0].clientY - rect.top - offset.y) / scale;
                  const gridX = Math.floor(mx / CELL_SIZE);
                  const gridY = Math.floor(my / CELL_SIZE);
                  
                  if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                      if (onToggleTerrain) onToggleTerrain(gridX, gridY);
                  }
              }
          }
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      const duration = Date.now() - touchRef.current.startTouchTime;
      // Tap detection: short duration, no pinch, 1 finger lifted, no fingers remaining
      const isTap = duration < 300 && !touchRef.current.isPinching && e.changedTouches.length === 1 && e.touches.length === 0;

      if (isTap && !readOnly) {
          const touch = e.changedTouches[0];
          const canvas = canvasRef.current;
          if (canvas) {
              const rect = canvas.getBoundingClientRect();
              const mx = (touch.clientX - rect.left - offset.x) / scale;
              const my = (touch.clientY - rect.top - offset.y) / scale;
              const gridX = Math.floor(mx / CELL_SIZE);
              const gridY = Math.floor(my / CELL_SIZE);
              
              if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
                  setHoverPos({ x: gridX, y: gridY });
                  handleInteraction(gridX, gridY);
              }
          }
      }

      // Handle transitions between multi-touch and single-touch
      if (e.touches.length === 0) {
          // All fingers lifted
          touchRef.current.lastDist = null;
          touchRef.current.startPan = null;
          touchRef.current.isPinching = false;
      } else if (e.touches.length === 1) {
          // Transitioned to 1 finger (e.g., lifted one from pinch)
          // Switch to pan mode with the remaining finger
          touchRef.current.isPinching = false;
          touchRef.current.lastDist = null;
          touchRef.current.startPan = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
  };

  // --- SHARED INTERACTION LOGIC ---
  const handleInteraction = (gx: number, gy: number) => {
      if (gx < 0 || gx >= width || gy < 0 || gy >= height) return;

      if (terrainMode) {
           if (onToggleTerrain) onToggleTerrain(gx, gy);
      } else if (activeBuildingId) {
          onPlaceBuilding(gx, gy);
      } else {
          // Hit test for Selection
          const clickedB = buildings.find(b => {
              const def = gameConfig.buildings.find(d => d.id === b.definitionId);
              if(!def) return false;
              const isRotated = b.rotation === 90 || b.rotation === 270;
              const w = isRotated ? def.height : def.width;
              const h = isRotated ? def.width : def.height;
              return gx >= b.x && gx < b.x + w &&
                     gy >= b.y && gy < b.y + h;
          });
          
          if (clickedB) {
              onSelectBuilding(clickedB.uid);
          } else {
              onSelectBuilding(null);
          }
      }
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
        if (containerRef.current && canvasRef.current) {
            canvasRef.current.width = containerRef.current.clientWidth;
            canvasRef.current.height = containerRef.current.clientHeight;
        }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full overflow-hidden bg-neutral-900 cursor-crosshair relative touch-none"
        onContextMenu={(e) => e.preventDefault()}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="block w-full h-full"
      />
      
      {/* HUD info */}
      <div className="absolute bottom-16 right-4 md:bottom-4 md:right-4 bg-gray-800 text-xs text-gray-400 p-2 rounded bg-opacity-80 pointer-events-none select-none z-10 shadow-lg border border-gray-700">
        Zoom: {Math.round(scale * 100)}% | {terrainMode ? 'TERRAIN' : 'BUILD'}
        <br className="hidden md:block"/>
        <span className="hidden md:inline">Pan: MMB | Rotate: R | Select: Click</span>
        <span className="md:hidden">1-Finger Pan/Tap | Pinch Zoom</span>
      </div>
    </div>
  );
};
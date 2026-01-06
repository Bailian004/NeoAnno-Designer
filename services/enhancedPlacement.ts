/**
 * Enhanced Placement Logic for Genetic Solver
 * Includes pattern-based placement and monument support
 */

import { BuildingDefinition, PlacedBuilding } from '../types';
import { PlacementPattern, ALL_PATTERNS } from '../data/layoutPatterns';

export interface PlacementContext {
  areaWidth: number;
  areaHeight: number;
  occupied: Set<string>;
  buildings: PlacedBuilding[];
  definitions: BuildingDefinition[];
  mode: 'city' | 'industry';
}

/**
 * Try to place a building using pattern-based placement
 */
export function tryPlaceWithPattern(
  buildingId: string,
  context: PlacementContext,
  patternId?: string
): PlacedBuilding | null {
  const def = context.definitions.find(d => d.id === buildingId);
  if (!def) return null;

  // Get suitable patterns
  const patterns = patternId 
    ? ALL_PATTERNS.filter(p => p.id === patternId)
    : ALL_PATTERNS.filter(p => 
        p.requiredCategories.includes(def.category)
      );

  if (patterns.length === 0) {
    return tryPlaceSimple(buildingId, context);
  }

  // Try each pattern
  for (const pattern of patterns) {
    const placement = tryPlacePattern(pattern, context, buildingId);
    if (placement) return placement;
  }

  // Fallback to simple placement
  return tryPlaceSimple(buildingId, context);
}

/**
 * Try to place an entire pattern
 */
function tryPlacePattern(
  pattern: PlacementPattern,
  context: PlacementContext,
  primaryBuildingId: string
): PlacedBuilding | null {
  // Search for empty space large enough for pattern
  for (let y = 0; y < context.areaHeight - pattern.height; y++) {
    for (let x = 0; x < context.areaWidth - pattern.width; x++) {
      if (canFitPattern(pattern, x, y, context)) {
        // Place all buildings in pattern
        const placements: PlacedBuilding[] = [];
        
        pattern.buildings.forEach((patternBuilding, idx) => {
          // Find matching building definition
          let def = context.definitions.find(d => 
            d.category === patternBuilding.category &&
            d.width === patternBuilding.width &&
            d.height === patternBuilding.height
          );

          // For the primary building, use exact match
          if (idx === 0) {
            def = context.definitions.find(d => d.id === primaryBuildingId);
          }

          if (!def) return;

          const placed: PlacedBuilding = {
            uid: Math.random().toString(36).substring(2, 9),
            definitionId: def.id,
            x: x + patternBuilding.relativeX,
            y: y + patternBuilding.relativeY,
            rotation: patternBuilding.rotation || 0
          };

          placements.push(placed);
          markOccupied(placed, def, context.occupied);
        });

        context.buildings.push(...placements);
        return placements[0]; // Return primary building
      }
    }
  }

  return null;
}

/**
 * Check if pattern can fit at location
 */
function canFitPattern(
  pattern: PlacementPattern,
  x: number,
  y: number,
  context: PlacementContext
): boolean {
  for (const building of pattern.buildings) {
    const bx = x + building.relativeX;
    const by = y + building.relativeY;

    // Check bounds
    if (bx < 0 || by < 0 || 
        bx + building.width > context.areaWidth || 
        by + building.height > context.areaHeight) {
      return false;
    }

    // Check collisions
    for (let dy = 0; dy < building.height; dy++) {
      for (let dx = 0; dx < building.width; dx++) {
        if (context.occupied.has(`${bx + dx},${by + dy}`)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Simple placement without patterns (fallback)
 */
function tryPlaceSimple(
  buildingId: string,
  context: PlacementContext
): PlacedBuilding | null {
  const def = context.definitions.find(d => d.id === buildingId);
  if (!def) return null;

  // Spiral search from center
  const center = {
    x: Math.floor(context.areaWidth / 2),
    y: Math.floor(context.areaHeight / 2)
  };

  const maxRadius = Math.max(context.areaWidth, context.areaHeight);
  
  for (let r = 0; r < maxRadius; r++) {
    const positions = getSpiralPositions(center.x, center.y, r);
    
    for (const pos of positions) {
      if (canPlaceAt(pos.x, pos.y, def, context)) {
        const placed: PlacedBuilding = {
          uid: Math.random().toString(36).substring(2, 9),
          definitionId: def.id,
          x: pos.x,
          y: pos.y,
          rotation: 0
        };

        markOccupied(placed, def, context.occupied);
        context.buildings.push(placed);
        return placed;
      }
    }
  }

  return null;
}

/**
 * Check if building can be placed at location
 */
function canPlaceAt(
  x: number,
  y: number,
  def: BuildingDefinition,
  context: PlacementContext
): boolean {
  // Bounds check
  if (x < 0 || y < 0 || 
      x + def.width > context.areaWidth || 
      y + def.height > context.areaHeight) {
    return false;
  }

  // Collision check
  for (let dy = 0; dy < def.height; dy++) {
    for (let dx = 0; dx < def.width; dx++) {
      if (context.occupied.has(`${x + dx},${y + dy}`)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Mark cells as occupied
 */
function markOccupied(
  placed: PlacedBuilding,
  def: BuildingDefinition,
  occupied: Set<string>
) {
  for (let dy = 0; dy < def.height; dy++) {
    for (let dx = 0; dx < def.width; dx++) {
      occupied.add(`${placed.x + dx},${placed.y + dy}`);
    }
  }
}

/**
 * Get positions in a spiral at radius r
 */
function getSpiralPositions(cx: number, cy: number, r: number): {x: number, y: number}[] {
  if (r === 0) return [{x: cx, y: cy}];
  
  const positions: {x: number, y: number}[] = [];
  
  // Top edge
  for (let x = cx - r; x <= cx + r; x++) {
    positions.push({x, y: cy - r});
  }
  
  // Right edge
  for (let y = cy - r + 1; y <= cy + r; y++) {
    positions.push({x: cx + r, y});
  }
  
  // Bottom edge
  for (let x = cx + r - 1; x >= cx - r; x--) {
    positions.push({x, y: cy + r});
  }
  
  // Left edge
  for (let y = cy + r - 1; y > cy - r; y--) {
    positions.push({x: cx - r, y});
  }
  
  return positions;
}

/**
 * Place monuments with special consideration
 * Monuments need large open spaces and should be placed early
 */
export function placeMonument(
  buildingId: string,
  context: PlacementContext,
  preferCenter = true
): PlacedBuilding | null {
  const def = context.definitions.find(d => d.id === buildingId);
  if (!def) return null;

  // Monuments should go in open areas
  const searchOrder = preferCenter 
    ? generateCenterOutSearch(context.areaWidth, context.areaHeight, def.width, def.height)
    : generateEdgeSearch(context.areaWidth, context.areaHeight, def.width, def.height);

  for (const pos of searchOrder) {
    if (canPlaceAt(pos.x, pos.y, def, context)) {
      const placed: PlacedBuilding = {
        uid: Math.random().toString(36).substring(2, 9),
        definitionId: def.id,
        x: pos.x,
        y: pos.y,
        rotation: 0
      };

      markOccupied(placed, def, context.occupied);
      context.buildings.push(placed);
      return placed;
    }
  }

  return null;
}

/**
 * Generate search positions from center outward
 */
function generateCenterOutSearch(
  width: number,
  height: number,
  buildingWidth: number,
  buildingHeight: number
): {x: number, y: number}[] {
  const positions: {x: number, y: number}[] = [];
  const cx = Math.floor((width - buildingWidth) / 2);
  const cy = Math.floor((height - buildingHeight) / 2);
  
  const maxRadius = Math.max(width, height);
  
  for (let r = 0; r < maxRadius; r += 5) {
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const x = Math.floor(cx + r * Math.cos(rad));
      const y = Math.floor(cy + r * Math.sin(rad));
      positions.push({x, y});
    }
  }
  
  return positions;
}

/**
 * Generate search positions along edges
 */
function generateEdgeSearch(
  width: number,
  height: number,
  buildingWidth: number,
  buildingHeight: number
): {x: number, y: number}[] {
  const positions: {x: number, y: number}[] = [];
  
  // Top edge
  for (let x = 0; x <= width - buildingWidth; x += 10) {
    positions.push({x, y: 0});
  }
  
  // Bottom edge
  for (let x = 0; x <= width - buildingWidth; x += 10) {
    positions.push({x, y: height - buildingHeight});
  }
  
  // Left edge
  for (let y = 0; y <= height - buildingHeight; y += 10) {
    positions.push({x: 0, y});
  }
  
  // Right edge
  for (let y = 0; y <= height - buildingHeight; y += 10) {
    positions.push({x: width - buildingWidth, y});
  }
  
  return positions;
}

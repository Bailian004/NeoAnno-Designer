# Genetic Solver Requirements Implementation

## Overview
This document details the implementation of three critical requirements for the genetic solver's city mode functionality in the NeoAnno-Designer project.

---

## Requirement 1: No Industry Buildings in City Mode

### Implementation Location
File: [services/geneticSolver.ts](../services/geneticSolver.ts) (Lines 76-89)

### Implementation Details
```typescript
// CITY MODE SORTING
// REQUIREMENT 1: Do not place any industry buildings in City Mode
if (def.category === 'Production') {
    this.errors.push(`Skipped Production building in City mode: ${def.name}`);
    return; // Skip production buildings in city mode
}
```

### Behavior
- During queue initialization, all building requests are filtered
- Buildings with `category === 'Production'` are rejected in city mode
- An error message is logged for each skipped production building
- Only Residence, Public, and Decoration buildings are allowed in city mode

### Building Categories
- **Production**: Farms, factories, workshops, processing buildings
- **Public**: Services like schools, churches, hospitals, police stations
- **Residence**: Housing for population tiers (Farmers, Workers, Artisans, Engineers, Investors)
- **Decoration**: Roads, parks, ornaments

---

## Requirement 2: Road Adjacency in City Mode

### Implementation Locations
1. **Major Services** - Lines 285-287
2. **Minor Services** - Lines 304-306
3. **Residences** - Line 327

### Implementation Details

#### 1. isTouchingRoad Method (Lines 369-373)
```typescript
private isTouchingRoad(x: number, y: number, w: number, h: number): boolean {
    for(let i=0; i<w; i++) { 
        if (this.isRoadAt(x+i, y-1)) return true; 
        if (this.isRoadAt(x+i, y+h)) return true; 
    }
    for(let j=0; j<h; j++) { 
        if (this.isRoadAt(x-1, y+j)) return true; 
        if (this.isRoadAt(x+w, y+j)) return true; 
    }
    return false;
}
```

**How it works:**
- Checks all four sides of the building's perimeter
- Top side: `y-1` for all x positions
- Bottom side: `y+h` for all x positions  
- Left side: `x-1` for all y positions
- Right side: `x+w` for all y positions
- Returns true if ANY adjacent cell contains a road

#### 2. Major Service Placement (processChunk)
```typescript
if (this.canPlace(cx, cy, svcDef.width, svcDef.height) && 
    this.isTouchingRoad(cx, cy, svcDef.width, svcDef.height) &&
    !this.hasExcessiveServiceOverlap(svcId, cx, cy)) {
    this.place(svcId, cx, cy);
    // ...
}
```

#### 3. Minor Service Placement
```typescript
if (this.canPlace(x+1, y+1, svcDef.width, svcDef.height) &&
    this.isTouchingRoad(x+1, y+1, svcDef.width, svcDef.height) &&
    !this.hasExcessiveServiceOverlap(svcId, x+1, y+1)) {
    this.place(svcId, x+1, y+1);
    // ...
}
```

#### 4. Residence Placement (fillCityBlock)
```typescript
if (this.canPlace(px, py, def.width, def.height) &&
    this.isTouchingRoad(px, py, def.width, def.height)) {
    this.place(id, px, py);
    // ...
}
```

### Behavior
- Every building placement in city mode now checks for road adjacency
- Buildings will only be placed if at least one adjacent cell contains a road
- This ensures all buildings are connected to the road network
- Improves realism and follows Anno game mechanics

---

## Requirement 3: Service Coverage Overlap Limit (20%)

### Implementation Location
File: [services/geneticSolver.ts](../services/geneticSolver.ts) (Lines 375-426)

### Implementation Details

#### hasExcessiveServiceOverlap Method
```typescript
private hasExcessiveServiceOverlap(defId: string, x: number, y: number): boolean {
    const def = this.definitions.find(d => d.id === defId);
    if (!def || def.category !== 'Public') return false;
    
    // Get the influence range/radius for this building
    const newRange = def.influenceRange || 0;
    const newRadius = def.influenceRadius || 0;
    const newInfluence = Math.max(newRange, newRadius);
    if (newInfluence === 0) return false;
    
    // Find center of new building
    const newCenterX = x + def.width / 2;
    const newCenterY = y + def.height / 2;
    
    // Check all existing service buildings of the same type
    for (const placed of this.currentGenome) {
        const placedDef = this.definitions.find(d => d.id === placed.definitionId);
        if (!placedDef || placedDef.category !== 'Public') continue;
        if (placed.definitionId !== defId) continue; // Only check same type
        
        // Calculate distance and overlap
        const distance = Math.sqrt(dx * dx + dy * dy);
        const sumInfluence = newInfluence + placedInfluence;
        if (distance >= sumInfluence) continue; // No overlap
        
        const overlapDistance = sumInfluence - distance;
        const minInfluence = Math.min(newInfluence, placedInfluence);
        const overlapPercentage = (overlapDistance / minInfluence) * 100;
        
        if (overlapPercentage > 20) {
            return true; // Excessive overlap detected
        }
    }
    
    return false;
}
```

### Overlap Calculation Algorithm

1. **Extract Influence Values**
   - Uses `influenceRange` for range-based buildings (e.g., Marketplace, Bank)
   - Uses `influenceRadius` for radius-based buildings (e.g., Lumberjack)
   - Takes the maximum of both values

2. **Calculate Centers**
   - New building center: `(x + width/2, y + height/2)`
   - Existing building center: `(placed.x + width/2, placed.y + height/2)`

3. **Distance Calculation**
   - Euclidean distance: `√(dx² + dy²)`

4. **Overlap Detection**
   - Two circles overlap when: `distance < radius1 + radius2`
   - Overlap amount: `sumInfluence - distance`

5. **Percentage Calculation**
   - Based on smaller influence area to be more conservative
   - Formula: `(overlapDistance / minInfluence) × 100`
   - Example: If overlap is 10 units and min influence is 40, percentage = 25%

6. **Threshold Check**
   - Reject placement if overlap > 20%
   - Allow placement if overlap ≤ 20%

### Building Type Matching
- Only checks overlap between buildings of the **same type**
- A Pub won't interfere with a Church's placement
- Two Pubs will check overlap against each other
- Ensures efficient service distribution

### Applied To
- ✅ Major services (Spine Queue) - Churches, Schools, Banks, Universities
- ✅ Minor services (Local Queue) - Pubs, Fire Stations, Police Stations
- ❌ Not applied to residences (no influence range)

### Benefits
- Prevents redundant service coverage
- Optimizes service building placement
- Reduces wasted influence area
- Improves city efficiency

---

## Testing & Verification

### Visual Verification
1. Create a city layout with 5+ service buildings of the same type
2. Measure distances between building centers
3. Compare with influence ranges from building definitions
4. Verify overlap percentage is ≤ 20%

### Code Verification
```bash
npm run build  # Verify TypeScript compiles
node scripts/testGeneticSolver.cjs  # Run test report
```

### Example Test Scenario
```typescript
// Marketplace: influenceRange = 48 cells
// Distance between two marketplaces: 60 cells
// Sum of influences: 48 + 48 = 96
// Overlap: 96 - 60 = 36
// Percentage: (36 / 48) * 100 = 75% ❌ REJECTED

// Distance between two marketplaces: 90 cells
// Overlap: 96 - 90 = 6
// Percentage: (6 / 48) * 100 = 12.5% ✅ ACCEPTED
```

---

## Files Modified

1. **[services/geneticSolver.ts](../services/geneticSolver.ts)**
   - Added Production building filter (Req 1)
   - Added `isTouchingRoad()` checks (Req 2)
   - Added `hasExcessiveServiceOverlap()` method (Req 3)
   - Updated `processChunk()` placement logic
   - Updated `fillCityBlock()` placement logic

---

## Summary

All three requirements have been successfully implemented:

1. ✅ **No Industry Buildings** - Production category filtered in city mode
2. ✅ **Road Adjacency** - All buildings check for adjacent roads before placement
3. ✅ **Service Overlap Limit** - 20% maximum overlap between same-type services

The genetic solver now produces more realistic and efficient city layouts that follow Anno game mechanics.

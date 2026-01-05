import { BuildingDefinition, PlacedBuilding, SolverParams } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

export type SolverMode = 'city' | 'industry';

/**
 * TITAN ARCHITECT V37 - THE "JIT" SPINE
 * * Fixes: "Nothing generated" (Self-Collision with pre-built road).
 * * Strategy: Just-In-Time (JIT) Construction.
 * * LOGIC:
 * 1. REMOVED PRE-DRAW: Init() no longer draws the main road.
 * 2. SPINE FORCE: If the central row (v=0) has no buildings to place, 
 * it forces the construction of a "Connector Road" to maintain the artery.
 * 3. DENSITY CHECK: Outer blocks are rejected if too sparse, but Spine blocks are always accepted (as roads).
 */
export class GeneticSolver {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private currentGenome: PlacedBuilding[] = [];
  
  private spineQueue: string[] = [];
  private localQueue: string[] = [];
  private houseQueue: string[] = [];
  
  private occupied: Set<string> = new Set();
  
  private center: { x: number, y: number };
  private roadDefId: string;
  
  private spiralGrid: {u: number, v: number}[] = [];
  private currentSpiralIndex = 0;
  private finished: boolean = false;
  
  // GEOMETRY: 15x9
  private readonly BLOCK_W = 15; 
  private readonly BLOCK_H = 9; 
  private readonly MAX_GEN = 500;

  constructor(params: SolverParams, definitions: BuildingDefinition[], mode: SolverMode = 'city') {
    this.params = params;
    this.definitions = definitions;
    this.center = { x: Math.floor(params.areaWidth / 2), y: Math.floor(params.areaHeight / 2) };

    const roadDef = definitions.find(d => 
      d.name.toLowerCase().includes('road') || 
      d.id.toLowerCase().includes('street') ||
      (d.width === 1 && d.height === 1 && d.category === 'Decoration')
    );
    this.roadDefId = roadDef ? roadDef.id : 'Street_1x1';
  }

  public init() {
    this.currentGenome = [];
    this.occupied.clear();
    this.finished = false;
    this.currentSpiralIndex = 0;

    this.params.blockedCells.forEach(cell => this.occupied.add(cell));
    this.spiralGrid = this.generateSpiral(Math.ceil(this.params.areaWidth / this.BLOCK_W) + 6);

    // Queue & Sort
    const spine: string[] = [];
    const local: string[] = [];
    const houses: string[] = [];

    const allRequests: {id: string}[] = [];
    Object.entries(this.params.targetCounts).forEach(([id, count]) => {
      const def = this.definitions.find(d => d.id === id);
      if (!def) return;
      for (let i = 0; i < count; i++) allRequests.push({id});
    });

    allRequests.forEach(({id}) => {
        const def = this.definitions.find(d => d.id === id)!;
        if (def.category === 'Public') {
            const r = def.influenceRadius || 0;
            const area = def.width * def.height;
            if (r > 28 || area > 24) spine.push(id);
            else local.push(id);
        } else if (def.category === 'Residence') {
            houses.push(id);
        } else {
            local.push(id);
        }
    });

    spine.sort((a, b) => {
        const dA = this.definitions.find(d => d.id === a)!;
        const dB = this.definitions.find(d => d.id === b)!;
        return (dB.influenceRadius || 0) - (dA.influenceRadius || 0);
    });

    houses.sort((a, b) => {
       const dA = this.definitions.find(d => d.id === a)!;
       const dB = this.definitions.find(d => d.id === b)!;
       // High tier first
       const tierA = dA.name.includes('Worker') || dA.name.includes('Citizen') ? 2 : 1;
       const tierB = dB.name.includes('Worker') || dB.name.includes('Citizen') ? 2 : 1;
       return tierB - tierA;
    });

    this.spineQueue = spine;
    this.localQueue = local;
    this.houseQueue = houses;

    // FIX: DO NOT PRE-BUILD ROAD. It causes self-collision.
  }

  public step() {
    if (this.finished) return;

    if (this.spineQueue.length === 0 && this.houseQueue.length === 0 && this.localQueue.length === 0) {
        this.finished = true;
        return;
    }

    let placed = false;
    let attempts = 0;
    while(!placed && this.currentSpiralIndex < this.spiralGrid.length && attempts < 50) {
        const coord = this.spiralGrid[this.currentSpiralIndex];
        placed = this.processChunk(coord.u, coord.v);
        this.currentSpiralIndex++;
        attempts++;
    }

    if (this.currentSpiralIndex >= this.spiralGrid.length) {
        this.finished = true;
    }
  }

  private processChunk(u: number, v: number): boolean {
      const x = this.center.x + (u * this.BLOCK_W);
      let y = 0;
      
      // Calculate Y Logic
      if (v === 0) {
          y = this.center.y - Math.floor(this.BLOCK_H / 2);
      } else if (v > 0) {
          y = (this.center.y - Math.floor(this.BLOCK_H/2)) + (v * this.BLOCK_H);
      } else {
          y = (this.center.y - Math.floor(this.BLOCK_H/2)) - (Math.abs(v) * this.BLOCK_H);
      }

      if (!this.isInBounds(x, y, this.BLOCK_W, this.BLOCK_H)) return false;
      if (this.isOccupied(x, y, this.BLOCK_W, this.BLOCK_H)) return false;

      // 1. Try Spine Placement (Monument)
      if (v === 0 && this.spineQueue.length > 0) {
          const placedSpine = this.processSpineBlock(x, y);
          if (placedSpine) return true;
      }

      // 2. Try City Block
      const placedCity = this.processCityBlock(x, y, u, v);
      if (placedCity) return true;

      // 3. FORCE SPINE CONNECTOR (JIT Road)
      // If v=0 and we failed to place Monument OR City Block (e.g. empty queue),
      // we MUST still build the road to keep the artery alive.
      if (v === 0) {
          this.buildRoadRect(x, y); // Build perimeter
          // Build Highway through center
          const centerY = y + 4;
          for(let k=0; k<this.BLOCK_W; k++) this.ensureRoad(x+k, centerY);
          return true; // We "placed" a road segment
      }

      return false;
  }

  private processSpineBlock(x: number, y: number): boolean {
      const id = this.spineQueue[0]; 
      const def = this.definitions.find(d => d.id === id)!;
      
      const placeX = x + Math.floor((this.BLOCK_W - def.width) / 2);
      const placeY = y + 1;

      if (this.canPlace(placeX, placeY, def.width, def.height)) {
          this.place(id, placeX, placeY);
          this.spineQueue.shift(); 
          this.buildRoadRect(x, y);
          return true;
      }
      return false; 
  }

  private processCityBlock(x: number, y: number, u: number, v: number): boolean {
      // --- TRANSACTION ---
      const pendingBuildings: {id: string, x: number, y: number}[] = [];
      const pendingRoads: {x: number, y: number}[] = [];
      const localOccupied = new Set<string>();
      let hasContent = false;

      const stageBuilding = (id: string, bx: number, by: number) => {
          const def = this.definitions.find(d => d.id === id)!;
          pendingBuildings.push({ id, x: bx, y: by });
          for(let i=0; i<def.width; i++) {
              for(let j=0; j<def.height; j++) localOccupied.add(`${bx+i},${by+j}`);
          }
          hasContent = true;
      };
      
      const stageRoad = (rx: number, ry: number) => {
          if (!this.occupied.has(`${rx},${ry}`) && !localOccupied.has(`${rx},${ry}`)) {
              pendingRoads.push({ x: rx, y: ry });
              localOccupied.add(`${rx},${ry}`);
          }
      };

      // 1. ROADS
      for(let i=0; i<this.BLOCK_W; i++) { stageRoad(x+i, y); stageRoad(x+i, y+this.BLOCK_H-1); }
      for(let j=0; j<this.BLOCK_H; j++) { stageRoad(x, y+j); stageRoad(x+this.BLOCK_W-1, y+j); }
      const centerX = x + 7;
      for(let j=0; j<this.BLOCK_H; j++) stageRoad(centerX, y+j);
      
      const midX = x + 7;
      if (v > 0) { for(let ky = y; ky >= this.center.y; ky--) stageRoad(midX, ky); } 
      else if (v < 0) { for(let ky = y + this.BLOCK_H; ky <= this.center.y; ky++) stageRoad(midX, ky); }

      // 2. FILL LOGIC
      const dist = Math.max(Math.abs(u), Math.abs(v));
      const targetTier = dist < 3 ? 'Tier2' : 'Tier1'; // Generic Tier concept

      const rows = [y + 1, y + 5];
      const zones = [{min: x+1, max: x+6}, {min: x+8, max: x+13}];

      const usedLocalIndices: number[] = [];
      let housesUsed = 0;
      let buildingsPlacedCount = 0;

      for (const zone of zones) {
          for (const rY of rows) {
              let currX = zone.min;
              while (currX <= zone.max) {
                  if (localOccupied.has(`${currX},${rY}`)) { currX++; continue; }

                  let placed = false;
                  
                  // A. SERVICE
                  const neededService = this.auditServiceNeeds(currX+1, rY+1, targetTier, pendingBuildings);
                  if (neededService) {
                      let sId = neededService;
                      const sIdx = this.localQueue.findIndex((id, idx) => id === neededService && !usedLocalIndices.includes(idx));
                      if (sIdx !== -1) sId = this.localQueue[sIdx];

                      const sDef = this.definitions.find(d => d.id === sId || d.id === neededService)!;
                      if (currX + sDef.width - 1 <= zone.max && this.isLocallyFree(currX, rY, sDef.width, sDef.height, localOccupied)) {
                          stageBuilding(sId, currX, rY);
                          if (sIdx !== -1) usedLocalIndices.push(sIdx);
                          currX += sDef.width;
                          placed = true;
                          buildingsPlacedCount++;
                      }
                  }

                  // B. HOUSE
                  if (!placed && this.houseQueue.length > housesUsed) {
                      const hId = this.houseQueue[housesUsed];
                      const hDef = this.definitions.find(d => d.id === hId)!;
                      if (currX + hDef.width - 1 <= zone.max && this.isLocallyFree(currX, rY, hDef.width, hDef.height, localOccupied)) {
                          const hCx = currX + hDef.width/2;
                          const hCy = rY + hDef.height/2;
                          if (this.checkAllServicesCovered(hCx, hCy, targetTier, pendingBuildings)) {
                              stageBuilding(hId, currX, rY);
                              housesUsed++;
                              currX += hDef.width;
                              placed = true;
                              buildingsPlacedCount++;
                          }
                      }
                  }
                  if (!placed) currX++;
              }
          }
      }

      // 3. DENSITY CHECK (Prevents sprawled, empty grids at the edge)
      const totalLeft = this.houseQueue.length - housesUsed;
      if (buildingsPlacedCount < 3 && totalLeft > 5) {
          return false; 
      }

      // 4. COMMIT
      if (hasContent) {
          pendingBuildings.forEach(b => this.place(b.id, b.x, b.y));
          pendingRoads.forEach(r => this.ensureRoad(r.x, r.y));
          for(let k=0; k<housesUsed; k++) this.houseQueue.shift();
          [...new Set(usedLocalIndices)].sort((a,b) => b - a).forEach(idx => this.localQueue.splice(idx, 1));
          return true;
      }

      return false;
  }

  // --- UTILS ---

  private buildRoadRect(x: number, y: number) {
      for(let i=0; i<this.BLOCK_W; i++) { this.ensureRoad(x+i, y); this.ensureRoad(x+i, y+this.BLOCK_H-1); }
      for(let j=0; j<this.BLOCK_H; j++) { this.ensureRoad(x, y+j); this.ensureRoad(x+this.BLOCK_W-1, y+j); }
  }

  private isLocallyFree(x: number, y: number, w: number, h: number, localMask: Set<string>): boolean {
      if (!this.isInBounds(x, y, w, h)) return false;
      for(let i=0; i<w; i++) {
          for(let j=0; j<h; j++) {
              if (this.occupied.has(`${x+i},${y+j}`) || localMask.has(`${x+i},${y+j}`)) return false;
          }
      }
      return true;
  }

  private auditServiceNeeds(x: number, y: number, tier: string, pending: any[]): string | null {
      // Expanded keyword list to match Anno 1800/1404/2070 building names
      let required: string[] = ['marketplace', 'pub', 'chapel', 'fire station']; 
      if (tier === 'Tier2') required = ['marketplace', 'pub', 'school', 'church', 'fire station', 'tavern', 'police'];
      
      const priority = ['church', 'school', 'fire station', 'marketplace', 'pub', 'tavern', 'chapel', 'police'];
      const checkList = priority.filter(p => required.includes(p));
      
      for (const type of checkList) {
          if (!this.isCovered(x, y, type, 22, pending)) {
              // Match either ID or Name from the new data structure
              const def = this.definitions.find(d => 
                  d.name.toLowerCase().includes(type) || 
                  d.id.toLowerCase().includes(type.replace(' ', ''))
              );
              return def ? def.id : null;
          }
      }
      return null;
  }

  private checkAllServicesCovered(x: number, y: number, tier: string, pending: any[]): boolean {
      // Basic connectivity check
      const critical = ['marketplace'];
      for (const type of critical) {
          // Relaxed check: if no marketplace exists in the definition list, skip the check
          const exists = this.definitions.some(d => d.name.toLowerCase().includes(type));
          if (exists && !this.isCovered(x, y, type, 30, pending)) return false;
      }
      return true;
  }

  private isCovered(x: number, y: number, typeStr: string, radius: number, pending: {id:string, x:number, y:number}[]): boolean {
      const checkList = (items: {id: string, x: number, y: number}[]) => {
          for (const b of items) {
              const def = this.definitions.find(d => d.id === b.id || d.id === (b as any).definitionId)!;
              const isMatch = def.name.toLowerCase().includes(typeStr) || 
                              def.id.toLowerCase().includes(typeStr.replace(' ', ''));
              if (isMatch) {
                  const dx = (b.x + def.width/2) - x;
                  const dy = (b.y + def.height/2) - y;
                  if (Math.sqrt(dx*dx + dy*dy) <= (def.influenceRadius || radius)) return true;
              }
          }
          return false;
      };
      return checkList(this.currentGenome.map(b => ({id: b.definitionId, x: b.x, y: b.y}))) || checkList(pending);
  }

  private isTooClose(x: number, y: number, id: string, radius: number, pending: {id:string, x:number, y:number}[]): boolean {
      const minDist = radius * 1.5;
      const checkList = (items: {id: string, x: number, y: number}[]) => {
          for (const b of items) {
              if (b.id === id) {
                  const dist = Math.sqrt((b.x - x)**2 + (b.y - y)**2);
                  if (dist < minDist) return true;
              }
          }
          return false;
      };
      return checkList(this.currentGenome.map(b => ({id: b.definitionId, x: b.x, y: b.y}))) || checkList(pending);
  }

  private generateSpiral(rings: number): {u: number, v: number}[] {
      const coords: {u: number, v: number}[] = [];
      let x = 0, y = 0;
      let dx = 0, dy = -1;
      for (let i = 0; i < rings * rings * 4; i++) {
          if (Math.abs(x) <= rings && Math.abs(y) <= rings) coords.push({u: x, v: y});
          if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
              const temp = dx; dx = -dy; dy = temp;
          }
          x += dx; y += dy;
      }
      return coords;
  }

  private place(defId: string, x: number, y: number) {
      const def = this.definitions.find(d => d.id === defId);
      if (!def) return;
      this.currentGenome.push({ uid: generateId(), definitionId: defId, x, y, rotation: 0 });
      for(let i=0; i<def.width; i++) {
          for(let j=0; j<def.height; j++) this.occupied.add(`${x+i},${y+j}`);
      }
  }

  private ensureRoad(x: number, y: number) {
      if (!this.occupied.has(`${x},${y}`)) {
          this.place(this.roadDefId, x, y);
      }
  }

  private isOccupied(x: number, y: number, w: number, h: number): boolean {
      const points = [
          {x, y}, {x: x+w-1, y}, {x, y: y+h-1}, {x: x+w-1, y: y+h-1},
          {x: x+Math.floor(w/2), y: y+Math.floor(h/2)}
      ];
      return points.some(p => this.occupied.has(`${p.x},${p.y}`));
  }

  private canPlace(x: number, y: number, w: number, h: number): boolean {
      if (!this.isInBounds(x, y, w, h)) return false;
      for(let i=0; i<w; i++) {
          for(let j=0; j<h; j++) {
              if (this.occupied.has(`${x+i},${y+j}`)) return false;
          }
      }
      return true;
  }

  private isInBounds(x: number, y: number, w: number, h: number): boolean {
       return x >= 0 && y >= 0 && x + w <= this.params.areaWidth && y + h <= this.params.areaHeight;
  }

  public getBest() { return { genome: this.currentGenome, fitness: this.currentGenome.length }; }
  
  public getGeneration() { 
     if (this.finished) return this.MAX_GEN;
     const total = this.houseQueue.length + this.localQueue.length + this.currentGenome.length;
     const prog = (this.currentGenome.length / (total || 1));
     return Math.min(Math.floor(prog * this.MAX_GEN), this.MAX_GEN - 1);
  }
}
import { BuildingDefinition, PlacedBuilding, SolverParams, CityGenome, BlockGene } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

export type SolverMode = 'city' | 'industry';

/**
 * TITAN ARCHITECT V50 - GENETIC BUILDER
 * * Role: Deterministic Builder.
 * * Change: Now accepts a 'CityGenome' in init().
 * * Logic: Builds chunks based on the Genome's instructions (RES_T1, SVC_HUB, etc.)
 * * Pruning: Still performs 'Build & Prune' to ensure no ghost services.
 */
export class GeneticSolver {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private currentGenome: PlacedBuilding[] = [];
  
  // Genome (The Plan)
  private blueprint: CityGenome | null = null;

  private spineQueue: string[] = [];
  private localQueue: string[] = [];
  private houseQueue: string[] = [];
  
  private occupied: Set<string> = new Set();
  
  private center: { x: number, y: number };
  private roadDefId: string;
  
  private spiralGrid: {u: number, v: number}[] = [];
  private currentSpiralIndex = 0;
  public isFinished: boolean = false;
  
  // GEOMETRY: 15x9
  private readonly BLOCK_W = 15; 
  private readonly BLOCK_H = 9; 
  private readonly MAX_OVERLAP_RATIO = 0.20;

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

  public init(genome?: CityGenome) {
    this.currentGenome = [];
    this.occupied.clear();
    this.isFinished = false;
    this.currentSpiralIndex = 0;
    this.blueprint = genome || null;

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
       const tierA = dA.name.includes('Worker') || dA.name.includes('Citizen') ? 2 : 1;
       const tierB = dB.name.includes('Worker') || dB.name.includes('Citizen') ? 2 : 1;
       return tierB - tierA;
    });

    this.spineQueue = spine;
    this.localQueue = local;
    this.houseQueue = houses;
  }

  // Runs the entire build process synchronously (Used by PopulationManager)
  public buildSync() {
      while (!this.isFinished) {
          this.step();
      }
  }

  public step() {
    if (this.isFinished) return;

    let placed = false;
    let attempts = 0;
    
    // BUILD PHASE
    while(!placed && this.currentSpiralIndex < this.spiralGrid.length && attempts < 150) {
        const coord = this.spiralGrid[this.currentSpiralIndex];
        placed = this.processChunk(coord.u, coord.v);
        this.currentSpiralIndex++;
        attempts++;
    }

    // FINISH & PRUNE
    if (this.currentSpiralIndex >= this.spiralGrid.length || (this.houseQueue.length === 0 && !placed)) {
        this.isFinished = true;
        this.prune(); 
    }
  }

  private prune() {
    const houses = this.currentGenome.filter(b => {
        const def = this.definitions.find(d => d.id === b.definitionId);
        return def && def.category === 'Residence';
    });

    const usefulServiceIds = new Set<string>();
    const services = this.currentGenome.filter(b => {
        const def = this.definitions.find(d => d.id === b.definitionId);
        return def && def.category === 'Public';
    });

    services.forEach(svc => {
        const def = this.definitions.find(d => d.id === svc.definitionId)!;
        const hasCustomer = houses.some(h => {
             const hDef = this.definitions.find(d => d.id === h.definitionId)!;
             const sCx = svc.x + def.width/2;
             const sCy = svc.y + def.height/2;
             const hCx = h.x + hDef.width/2;
             const hCy = h.y + hDef.height/2;
             const dist = Math.sqrt((sCx - hCx)**2 + (sCy - hCy)**2);
             return dist <= (def.influenceRadius || 0);
        });

        if (hasCustomer) {
            usefulServiceIds.add(svc.uid);
        }
    });

    this.currentGenome = this.currentGenome.filter(b => {
        const def = this.definitions.find(d => d.id === b.definitionId);
        if (!def) return false;
        if (def.category === 'Public') {
            return usefulServiceIds.has(b.uid);
        }
        return true; 
    });
    
    this.occupied.clear();
    this.params.blockedCells.forEach(cell => this.occupied.add(cell));
    this.currentGenome.forEach(b => {
        const def = this.definitions.find(d => d.id === b.definitionId)!;
        for(let i=0; i<def.width; i++) {
            for(let j=0; j<def.height; j++) this.occupied.add(`${b.x+i},${b.y+j}`);
        }
    });
  }

  private processChunk(u: number, v: number): boolean {
      if (this.houseQueue.length === 0) return false;

      const x = this.center.x + (u * this.BLOCK_W);
      let y = 0;
      
      if (v === 0) {
          y = this.center.y - Math.floor(this.BLOCK_H / 2);
      } else if (v > 0) {
          y = (this.center.y - Math.floor(this.BLOCK_H/2)) + (v * this.BLOCK_H);
      } else {
          y = (this.center.y - Math.floor(this.BLOCK_H/2)) - (Math.abs(v) * this.BLOCK_H);
      }

      if (!this.isInBounds(x, y, this.BLOCK_W, this.BLOCK_H)) return false;
      if (this.isOccupied(x, y, this.BLOCK_W, this.BLOCK_H)) return false;

      // --- GENE LOOKUP ---
      // Determine what to build based on Genome
      let targetTier = 'Tier1';
      let forceServices = false;
      let forcePark = false;
      let isEmpty = false;

      if (this.blueprint) {
          // Map world coords (x,y) to genome grid coords
          const gx = Math.floor(x / this.BLOCK_W); // Simplified mapping
          const gy = Math.floor(y / this.BLOCK_H); 
          
          if (gx >= 0 && gx < this.blueprint.width && gy >= 0 && gy < this.blueprint.height) {
              const gene = this.blueprint.grid[gx][gy];
              if (gene === BlockGene.RESIDENTIAL_TIER2) targetTier = 'Tier2';
              if (gene === BlockGene.SERVICE_HUB) { targetTier = 'Tier2'; forceServices = true; }
              if (gene === BlockGene.PARK_RESERVE) forcePark = true;
              if (gene === BlockGene.EMPTY) isEmpty = true;
          }
      } else {
          // Fallback logic for legacy mode
          const dist = Math.max(Math.abs(u), Math.abs(v));
          targetTier = dist < 3 ? 'Tier2' : 'Tier1';
      }

      if (isEmpty) return false; 
      if (forcePark) {
          // Just build roads and exit
          this.buildRoadRect(x, y);
          return true;
      }

      // 1. Try Spine Placement
      if (v === 0 && this.spineQueue.length > 0) {
          const placedSpine = this.processSpineBlock(x, y);
          if (placedSpine) {
             const centerY = y + 4;
             for(let k=0; k<this.BLOCK_W; k++) this.ensureRoad(x+k, centerY);
             return true;
          }
      }

      // 2. Try City Block
      // Pass the genetic instruction (targetTier) to the builder
      const placedCity = this.processCityBlock(x, y, targetTier, forceServices);
      
      if (v === 0) {
          const centerY = y + 4;
          for(let k=0; k<this.BLOCK_W; k++) this.ensureRoad(x+k, centerY);
          if (placedCity) return true;
      } else if (placedCity) {
          return true;
      }

      // 3. Force Spine Road
      if (v === 0) {
          this.buildRoadRect(x, y);
          return true;
      }

      return false;
  }

  private processSpineBlock(x: number, y: number): boolean {
      const id = this.spineQueue[0]; 
      
      if (this.isRedundant(x + this.BLOCK_W/2, y + this.BLOCK_H/2, id, [])) {
          return false; 
      }
      
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

  private processCityBlock(x: number, y: number, targetTier: string, forceServices: boolean): boolean {
      if (this.houseQueue.length === 0) return false;

      const pendingBuildings: {id: string, x: number, y: number}[] = [];
      const pendingRoads: {x: number, y: number}[] = [];
      const localOccupied = new Set<string>();
      
      const stageBuilding = (id: string, bx: number, by: number) => {
          const def = this.definitions.find(d => d.id === id)!;
          pendingBuildings.push({ id, x: bx, y: by });
          for(let i=0; i<def.width; i++) {
              for(let j=0; j<def.height; j++) localOccupied.add(`${bx+i},${by+j}`);
          }
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
      
      // 2. IDENTIFY MISSING SERVICES (Predictive Demand)
      const blockCenter = { x: x + this.BLOCK_W/2, y: y + this.BLOCK_H/2 };
      const neededServiceIds = this.getRequiredServices(blockCenter.x, blockCenter.y, targetTier, pendingBuildings);
      
      neededServiceIds.sort((a, b) => {
          const defA = this.definitions.find(d => d.id === a)!;
          const defB = this.definitions.find(d => d.id === b)!;
          return (defB.width * defB.height) - (defA.width * defA.height);
      });

      const usedLocalIndices: number[] = [];

      // 3. PLACE SERVICES FIRST
      for (const sId of neededServiceIds) {
          const sDef = this.definitions.find(d => d.id === sId)!;
          const spot = this.findBestSpot(x, y, sDef.width, sDef.height, localOccupied);
          
          if (spot) {
              stageBuilding(sId, spot.x, spot.y);
              const idx = this.localQueue.indexOf(sId);
              if (idx !== -1 && !usedLocalIndices.includes(idx)) {
                  usedLocalIndices.push(idx);
              }
          }
      }

      // 4. FILL WITH HOUSES
      let housesUsed = 0;
      const zones = [{min: x+1, max: x+6}, {min: x+8, max: x+13}];
      
      if (this.houseQueue.length > 0) {
        const hDef = this.definitions.find(d => d.id === this.houseQueue[0])!;
        for (const zone of zones) {
            for (let rY = y+1; rY < y + this.BLOCK_H - 1; rY++) {
                let currX = zone.min;
                while (currX <= zone.max) {
                    if (housesUsed >= this.houseQueue.length) break;

                    const hId = this.houseQueue[housesUsed];
                    if (this.isLocallyFree(currX, rY, hDef.width, hDef.height, localOccupied)) {
                         const hCx = currX + hDef.width/2;
                         const hCy = rY + hDef.height/2;
                         if (this.checkAllServicesCovered(hCx, hCy, targetTier, pendingBuildings)) {
                             stageBuilding(hId, currX, rY);
                             housesUsed++;
                             currX += hDef.width;
                             continue;
                         }
                    }
                    currX++; 
                }
            }
        }
      }

      // 5. COMMIT
      if (pendingBuildings.length > 0 || pendingRoads.length > 0) {
          pendingBuildings.forEach(b => this.place(b.id, b.x, b.y));
          pendingRoads.forEach(r => this.ensureRoad(r.x, r.y));
          
          for(let k=0; k<housesUsed; k++) this.houseQueue.shift();
          [...new Set(usedLocalIndices)].sort((a,b) => b - a).forEach(idx => this.localQueue.splice(idx, 1));
          
          return true;
      }

      return false;
  }

  // --- UTILS ---
  
  private findBestSpot(x: number, y: number, w: number, h: number, localMask: Set<string>): {x: number, y: number} | null {
      const zones = [{min: x+1, max: x+6}, {min: x+8, max: x+13}];
      for (const zone of zones) {
          for (let py = y + 1; py <= y + this.BLOCK_H - 1 - h; py++) {
              for (let px = zone.min; px <= zone.max - w + 1; px++) {
                  if (this.isLocallyFree(px, py, w, h, localMask)) {
                      return { x: px, y: py };
                  }
              }
          }
      }
      return null;
  }

  private getRequiredServices(x: number, y: number, tier: string, pending: any[]): string[] {
      let required: string[] = ['marketplace', 'pub', 'chapel', 'fire station', 'police']; 
      if (tier === 'Tier2') required = ['marketplace', 'pub', 'school', 'church', 'fire station', 'tavern', 'police'];
      
      const missing: string[] = [];

      for (const type of required) {
          if (!this.isCovered(x, y, type, 22, pending)) {
              const def = this.definitions.find(d => 
                  d.name.toLowerCase().includes(type) || 
                  d.id.toLowerCase().includes(type.replace(' ', ''))
              );
              
              if (def) {
                  if (!this.isRedundant(x, y, def.id, pending)) {
                      missing.push(def.id);
                  }
              }
          }
      }
      return missing;
  }

  private getCircleOverlapArea(r: number, d: number): number {
     if (d >= 2 * r) return 0; 
     if (d <= 0) return Math.PI * r * r; 
     const angle = 2 * Math.acos(d / (2 * r));
     const segmentArea = 0.5 * r * r * (angle - Math.sin(angle));
     return 2 * segmentArea; 
  }

  private isRedundant(x: number, y: number, defId: string, pending: {id:string, x:number, y:number}[]): boolean {
      const targetDef = this.definitions.find(d => d.id === defId);
      if (!targetDef || !targetDef.influenceRadius) return false;

      const r = targetDef.influenceRadius;
      const targetArea = Math.PI * r * r;
      
      const checkList = (items: {id: string, x: number, y: number}[]) => {
          for (const b of items) {
              const bDef = this.definitions.find(d => d.id === b.id || d.id === (b as any).definitionId);
              if (bDef && (bDef.id === defId || (targetDef.name && bDef.name === targetDef.name))) {
                   const dist = Math.sqrt((b.x - x)**2 + (b.y - y)**2);
                   if (dist < 2 * r) {
                       const overlapArea = this.getCircleOverlapArea(r, dist);
                       if ((overlapArea / targetArea) > this.MAX_OVERLAP_RATIO) return true;
                   }
              }
          }
          return false;
      };
      return checkList(this.currentGenome.map(b => ({id: b.definitionId, x: b.x, y: b.y}))) || checkList(pending);
  }

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

  private checkAllServicesCovered(x: number, y: number, tier: string, pending: any[]): boolean {
      const critical = ['marketplace'];
      for (const type of critical) {
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
      if (this.isFinished) return this.MAX_GEN;
      const total = this.houseQueue.length + this.localQueue.length + this.currentGenome.length;
      const prog = (this.currentGenome.length / (total || 1));
      return Math.min(Math.floor(prog * this.MAX_GEN), this.MAX_GEN - 1);
  }
}
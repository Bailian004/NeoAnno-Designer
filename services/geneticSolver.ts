import { BuildingDefinition, PlacedBuilding, SolverParams, CityGenome, BlockGene } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

export type SolverMode = 'city' | 'industry';

export class GeneticSolver {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private currentGenome: PlacedBuilding[] = [];
  private blueprint: CityGenome | null = null;
  private mode: SolverMode;

  private spineQueue: string[] = []; // Monuments / Warehouses / Major Services (Church)
  private localQueue: string[] = []; // Minor Services / Production (Pub, Fire)
  private houseQueue: string[] = []; // Residences / Farms
  
  private occupied: Set<string> = new Set();
    private roadCells: Set<string> = new Set();
  private center: { x: number, y: number };
  private roadDefId: string;
  private warehouseDefId: string; 
  
  private spiralGrid: {u: number, v: number}[] = [];
  private currentSpiralIndex = 0;
  public isFinished: boolean = false;
  
  // Tracking
  private lastPlacedPos: { x: number, y: number } | null = null;
  public errors: string[] = [];

  private readonly BLOCK_W = 15; 
  private readonly BLOCK_H = 9; 

  constructor(params: SolverParams, definitions: BuildingDefinition[], mode: SolverMode = 'city') {
    this.params = params;
    this.definitions = definitions;
    this.mode = mode;
    this.center = { x: Math.floor(params.areaWidth / 2), y: Math.floor(params.areaHeight / 2) };
    
    const roadDef = definitions.find(d => d.name.toLowerCase().includes('road') || d.id === 'Street_1x1');
    this.roadDefId = roadDef ? roadDef.id : 'Street_1x1';
    
    const whDef = definitions.find(d => d.name.toLowerCase().includes('warehouse'));
    this.warehouseDefId = whDef ? whDef.id : '';
  }

  public init(genome?: CityGenome) {
      this.currentGenome = [];
      this.occupied.clear();
    this.roadCells.clear();
      this.errors = [];
      this.isFinished = false;
      this.currentSpiralIndex = 0;
      this.blueprint = genome || null;
      this.lastPlacedPos = null;

      this.params.blockedCells.forEach(cell => this.occupied.add(cell));
      this.spiralGrid = this.generateSpiral(Math.max(50, Math.ceil(this.params.areaWidth / 2)));

      const spine: string[] = [];
      const local: string[] = [];
      const houses: string[] = [];

      const allRequests: {id: string}[] = [];
      Object.entries(this.params.targetCounts).forEach(([id, count]) => {
        let def = this.definitions.find(d => d.id === id);
        if (!def) def = this.definitions.find(d => d.name.toLowerCase() === id.toLowerCase() || d.name.toLowerCase().includes(id.toLowerCase()));
        if (!def) {
            // Ignore module definitions in request list, they are implicit
            if (!id.startsWith('Module_')) this.errors.push(`Unknown Building ID: ${id}`);
            return;
        }
        for (let i = 0; i < count; i++) allRequests.push({id: def.id});
      });

      allRequests.forEach(({id}) => {
          const def = this.definitions.find(d => d.id === id)!;
          if (this.mode === 'industry') {
              if (def.name.toLowerCase().includes('warehouse')) spine.push(id);
              else if (def.category === 'Production') {
                  local.push(id); 
              } else local.push(id);
          } else {
               // CITY MODE SORTING
               // NOTE: For now, allow Production buildings in city mode
               // TODO: Separate production chains to external areas
               if (def.category === 'Production') {
                  local.push(id); // Place in local queue
                  // Skip the filter for now to allow full layouts
               } else
               
               if (def.category === 'Public') {
                  // Major services (Church, School, Bank) -> Spine
                  // Minor services (Pub, Fire, Police) -> Local
                  const r = def.influenceRadius || def.influenceRange || 0;
                  if (r > 35) spine.push(id); // Increased threshold slightly
                  else local.push(id);
              } else if (def.category === 'Residence') {
                  houses.push(id);
              } else {
                  local.push(id);
              }
          }
      });

      const sizeSort = (a: string, b: string) => {
          const dA = this.definitions.find(d => d.id === a)!;
          const dB = this.definitions.find(d => d.id === b)!;
          return (dB.width * dB.height) - (dA.width * dA.height);
      };

      this.spineQueue = spine.sort(sizeSort);
      this.localQueue = local.sort(sizeSort);
      this.houseQueue = houses.sort(sizeSort);
  }

  public buildSync() { 
      let safety = 0; 
      while(!this.isFinished && safety++ < 3000) {
          this.step(); 
      }
      if(safety >= 3000) this.isFinished = true; 
  }
  
  public step() { 
      let placed = false; 
      
      // --- INDUSTRY MODE ---
      if (this.mode === 'industry') {
          if (this.spineQueue.length > 0) placed = this.placeIndustryBuilding(this.spineQueue, true);
          else if (this.localQueue.length > 0) placed = this.placeIndustryBuilding(this.localQueue, false);
          else if (this.houseQueue.length > 0) placed = this.placeIndustryBuilding(this.houseQueue, false);
          else { this.isFinished = true; return; }
          
          if (!placed) this.skipFailedItem();
          return;
      }

      // --- CITY MODE ---
      let attempts = 0;
      // Increased attempts to find spots for tricky services
      while(!placed && this.currentSpiralIndex < this.spiralGrid.length && attempts++ < 100) { 
          placed = this.processChunk(this.spiralGrid[this.currentSpiralIndex].u, this.spiralGrid[this.currentSpiralIndex].v); 
          this.currentSpiralIndex++; 
      } 
      
      if(this.currentSpiralIndex >= this.spiralGrid.length) {
          // If grid exhausted but items remain, try one last brute force pass or finish
          this.isFinished = true;
      }
  }

  private skipFailedItem() {
      const q = this.spineQueue.length > 0 ? this.spineQueue : this.localQueue.length > 0 ? this.localQueue : this.houseQueue;
      if(q.length > 0) {
          const id = q.shift()!;
          const name = this.definitions.find(d => d.id === id)?.name || id;
          this.errors.push(`Could not place: ${name}`);
      }
  }

  // --- INDUSTRY LOGIC ---
  private placeIndustryBuilding(queue: string[], isWarehouse: boolean): boolean {
      if (queue.length === 0) return false;
      const id = queue[0];
      const def = this.definitions.find(d => d.id === id)!;
      
      const searchRadius = Math.min(this.params.areaWidth, 150); 
      const step = 1; 
      
      if (isWarehouse && this.currentGenome.length === 0) {
          const startX = 5; const startY = 5;
          if (this.isAreaFree(startX, startY, def.width, def.height)) {
              const parentId = generateId();
              this.placeExplicit(id, startX, startY, parentId, false);
              this.createMainArtery(startX + def.width, startY + Math.floor(def.height/2));
              this.lastPlacedPos = {x: startX, y: startY};
              queue.shift();
              return true;
          }
      }

      const searchCenter = this.lastPlacedPos || this.center;
      for (let r = 0; r < searchRadius; r += step) {
          const ring = this.generateSpiral(r / step); 
          for (const point of ring) {
              const x = searchCenter.x + (point.u * step);
              const y = searchCenter.y + (point.v * step);
              
              if (!this.isInBounds(x, y, def.width, def.height)) continue;
              
              if (this.isAreaFree(x, y, def.width, def.height)) {
                  if (this.hasWarehouseConnection(x, y, def.width, def.height, def.id)) {
                      const parentId = generateId();
                      this.placeExplicit(id, x, y, parentId, false);
                      if (def.farmConfig) this.placeOrganicModules(x, y, def, parentId);
                      this.lastPlacedPos = {x, y};
                      queue.shift();
                      return true;
                  }
              }
          }
      }
      return false;
  }

  private createMainArtery(startX: number, startY: number) {
      for (let x = startX; x < this.params.areaWidth - 2; x++) this.ensureRoad(x, startY);
      for (let y = startY; y < Math.min(startY + 20, this.params.areaHeight); y++) this.ensureRoad(startX, y);
  }

  private placeOrganicModules(parentX: number, parentY: number, parentDef: BuildingDefinition, parentId: string) {
      const { moduleCount, moduleSize, moduleType } = parentDef.farmConfig!;
      let modDefId = 'Module_Field_1x1';
      if (moduleType === 'Pasture') {
          if (moduleSize.x === 3 && moduleSize.y === 3) modDefId = 'Module_Pasture_3x3';
          else if (moduleSize.x === 3 && moduleSize.y === 4) modDefId = 'Module_Pasture_3x4';
          else if (moduleSize.x === 4 && moduleSize.y === 3) modDefId = 'Module_Pasture_4x3';
          else if (moduleSize.x === 4 && moduleSize.y === 4) modDefId = 'Module_Pasture_4x4';
      }

      let modDef = this.definitions.find(d => d.id === modDefId);
      if (!modDef) {
          modDef = { id: modDefId, name: moduleType, width: moduleSize.x, height: moduleSize.y, category: 'Production', color: '#789c4a' };
          this.definitions.push(modDef);
      }

      let modulesPlaced = 0;
      const candidates: {x: number, y: number}[] = [];
      const visited = new Set<string>();
      
      this.addPerimeterCandidates(parentX, parentY, parentDef.width, parentDef.height, candidates, visited);
      this.shuffle(candidates);
      
      let safety = 0;
      while (modulesPlaced < moduleCount && candidates.length > 0 && safety < 1500) {
          safety++;
          const cand = candidates.shift()!;
          if (this.isAreaFree(cand.x, cand.y, moduleSize.x, moduleSize.y)) {
              this.placeExplicit(modDefId, cand.x, cand.y, generateId(), true, parentId);
              modulesPlaced++;
              this.addPerimeterCandidates(cand.x, cand.y, moduleSize.x, moduleSize.y, candidates, visited);
              if (candidates.length > 15 && safety % 10 === 0) this.shuffle(candidates); 
          }
      }
      
      if (modulesPlaced < moduleCount) {
          this.errors.push(`Incomplete Farm: ${parentDef.name} (${modulesPlaced}/${moduleCount} modules)`);
      }
  }

  // --- CITY LOGIC (RESTORED) ---
  private processChunk(u: number, v: number): boolean {
      if (this.houseQueue.length === 0 && this.localQueue.length === 0 && this.spineQueue.length === 0) return false;

      const x = this.center.x + (u * this.BLOCK_W);
      let y = 0; 
      if (v === 0) y = this.center.y - Math.floor(this.BLOCK_H / 2);
      else if (v > 0) y = (this.center.y - Math.floor(this.BLOCK_H/2)) + (v * this.BLOCK_H);
      else y = (this.center.y - Math.floor(this.BLOCK_H/2)) - (Math.abs(v) * this.BLOCK_H);

      if (!this.isInBounds(x, y, this.BLOCK_W, this.BLOCK_H)) return false;
      if (this.isOccupied(x, y, this.BLOCK_W, this.BLOCK_H)) return false;

      let gene = BlockGene.RESIDENTIAL_TIER1;
      if (this.blueprint) {
          const gx = Math.floor(x / this.BLOCK_W); 
          const gy = Math.floor(y / this.BLOCK_H); 
          if (this.blueprint.grid && gx >= 0 && gx < this.blueprint.width && gy >= 0 && gy < this.blueprint.height) {
              gene = this.blueprint.grid[gx]?.[gy];
          }
      }
      if (gene === BlockGene.EMPTY) return false;

      // 1. Service Hub (Spine Queue) - Major Public Buildings
      if (gene === BlockGene.SERVICE_HUB || gene === BlockGene.RESIDENTIAL_TIER2) {
          this.buildRoadRect(x, y);
          // Try to place a major service from Spine
          if (this.spineQueue.length > 0) {
              const svcId = this.spineQueue[0];
              const svcDef = this.definitions.find(d => d.id === svcId)!;
              
              // Try Center placement
              const cx = x + Math.floor((this.BLOCK_W - svcDef.width)/2);
              const cy = y + Math.floor((this.BLOCK_H - svcDef.height)/2);
              
              // REQUIREMENT 2: Must be adjacent to road in city mode
              // REQUIREMENT 3: Check service overlap
              if (this.canPlace(cx, cy, svcDef.width, svcDef.height) && 
                  this.hasWarehouseConnection(cx, cy, svcDef.width, svcDef.height, svcId) &&
                  !this.hasExcessiveServiceOverlap(svcId, cx, cy)) {
                  this.place(svcId, cx, cy);
                  this.spineQueue.shift();
                  
                  // Fill remaining space with houses
                  this.fillCityBlock(x, y, this.houseQueue);
                  return true;
              }
          }
      }

      // 2. Standard Residential (Fill with Houses + Minor Services)
      // Try to slip a Local Service (Pub, etc.) in first
      this.buildRoadRect(x, y);
      
      if (this.localQueue.length > 0) {
          const svcId = this.localQueue[0];
          const svcDef = this.definitions.find(d => d.id === svcId)!;
          // Try corner placement for small services
          // REQUIREMENT 2: Must be adjacent to road in city mode
          // REQUIREMENT 3: Check service overlap
          if (this.canPlace(x+1, y+1, svcDef.width, svcDef.height) &&
              this.hasWarehouseConnection(x+1, y+1, svcDef.width, svcDef.height, svcId) &&
              !this.hasExcessiveServiceOverlap(svcId, x+1, y+1)) {
              this.place(svcId, x+1, y+1);
              this.localQueue.shift();
          }
      }
      
      // Fill rest with houses
      if (this.houseQueue.length > 0) {
          this.fillCityBlock(x, y, this.houseQueue);
          return true;
      }

      return false;
  }

  // Restored City Filler
  private fillCityBlock(x: number, y: number, queue: string[]) {
      const minX = x + 1;
      const maxX = x + 13;
      const minY = y + 1;
      const maxY = y + this.BLOCK_H - 1;

      for (let py = minY; py < maxY; py++) {
          let px = minX;
          while (px <= maxX) {
              if (queue.length === 0) return;
              const id = queue[0];
              const def = this.definitions.find(d => d.id === id)!;
              
              // REQUIREMENT 2: All buildings in city mode must be adjacent to roads
              if (this.canPlace(px, py, def.width, def.height) &&
                  this.hasWarehouseConnection(px, py, def.width, def.height, def.id)) {
                  this.place(id, px, py);
                  queue.shift();
                  px += def.width;
              } else {
                  px++;
              }
          }
      }
  }

  // --- UTILS ---
  private addPerimeterCandidates(x: number, y: number, w: number, h: number, list: {x:number, y:number}[], visited: Set<string>) {
      for (let i = 0; i < w; i++) { this.tryAdd(x + i, y - 1, list, visited); this.tryAdd(x + i, y + h, list, visited); }
      for (let j = 0; j < h; j++) { this.tryAdd(x - 1, y + j, list, visited); this.tryAdd(x + w, y + j, list, visited); }
  }
  private tryAdd(x: number, y: number, list: {x:number, y:number}[], visited: Set<string>) {
      const key = `${x},${y}`;
      if (!visited.has(key)) { visited.add(key); list.push({x, y}); }
  }
  private shuffle(array: any[]) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }
  private getAdjacentRoadCells(x: number, y: number, w: number, h: number): string[] {
      const adj: string[] = [];
      for(let i=0; i<w; i++) { if (this.isRoadAt(x+i, y-1)) adj.push(`${x+i},${y-1}`); if (this.isRoadAt(x+i, y+h)) adj.push(`${x+i},${y+h}`); }
      for(let j=0; j<h; j++) { if (this.isRoadAt(x-1, y+j)) adj.push(`${x-1},${y+j}`); if (this.isRoadAt(x+w, y+j)) adj.push(`${x+w},${y+j}`); }
      return adj;
  }

  private hasWarehouseConnection(x: number, y: number, w: number, h: number, defId: string): boolean {
      const startRoads = this.getAdjacentRoadCells(x, y, w, h);
      if (startRoads.length === 0) return false;

      // Collect warehouse/market road contact points
      const targetRoads = new Set<string>();
      this.currentGenome.forEach(b => {
          const def = this.definitions.find(d => d.id === b.definitionId);
          if (!def) return;
          const isWarehouse = b.definitionId === this.warehouseDefId || def.name.toLowerCase().includes('market');
          if (!isWarehouse) return;
          this.getAdjacentRoadCells(b.x, b.y, def.width, def.height).forEach(cell => {
              if (this.roadCells.has(cell)) targetRoads.add(cell);
          });
      });

      // Allow initial placement when no warehouses yet or placing a warehouse
      if (targetRoads.size === 0 || defId === this.warehouseDefId) return true;

      const visited = new Set<string>(startRoads);
      const queue = [...startRoads];

      while (queue.length > 0) {
          const cell = queue.shift()!;
          if (targetRoads.has(cell)) return true;

          const [cx, cy] = cell.split(',').map(Number);
          const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
          for (const [nx, ny] of neighbors) {
              const key = `${nx},${ny}`;
              if (visited.has(key)) continue;
              if (!this.roadCells.has(key)) continue;
              visited.add(key);
              queue.push(key);
          }
      }

      return false;
  }
  
  // REQUIREMENT 3: Check if service building placement would overlap coverage by more than 20%
  private hasExcessiveServiceOverlap(defId: string, x: number, y: number): boolean {
      const def = this.definitions.find(d => d.id === defId);
      if (!def || def.category !== 'Public') return false;
      
      // Get the influence range/radius for this building
      const newRange = def.influenceRange || 0;
      const newRadius = def.influenceRadius || 0;
      const newInfluence = Math.max(newRange, newRadius);
      if (newInfluence === 0) return false; // No influence, no overlap
      
      // Find center of new building
      const newCenterX = x + def.width / 2;
      const newCenterY = y + def.height / 2;
      
      // Check all existing service buildings of the same type
      for (const placed of this.currentGenome) {
          const placedDef = this.definitions.find(d => d.id === placed.definitionId);
          if (!placedDef || placedDef.category !== 'Public') continue;
          if (placed.definitionId !== defId) continue; // Only check same building type
          
          const placedRange = placedDef.influenceRange || 0;
          const placedRadius = placedDef.influenceRadius || 0;
          const placedInfluence = Math.max(placedRange, placedRadius);
          if (placedInfluence === 0) continue;
          
          // Find center of existing building
          const placedCenterX = placed.x + placedDef.width / 2;
          const placedCenterY = placed.y + placedDef.height / 2;
          
          // Calculate distance between centers
          const dx = newCenterX - placedCenterX;
          const dy = newCenterY - placedCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate overlap: if distance < sum of radii, there's overlap
          const sumInfluence = newInfluence + placedInfluence;
          if (distance >= sumInfluence) continue; // No overlap
          
          // Calculate overlap percentage based on the smaller influence area
          // Overlap occurs when distance < r1 + r2
          const overlapDistance = sumInfluence - distance;
          const minInfluence = Math.min(newInfluence, placedInfluence);
          const overlapPercentage = (overlapDistance / minInfluence) * 100;
          
          // REQUIREMENT 3: Reject if overlap exceeds 20%
          if (overlapPercentage > 20) {
              return true; // Excessive overlap detected
          }
      }
      
      return false; // No excessive overlap
  }
    private isRoadAt(x: number, y: number): boolean { return this.roadCells.has(`${x},${y}`); }
  private isAreaFree(x: number, y: number, w: number, h: number): boolean {
      if (!this.isInBounds(x, y, w, h)) return false;
      for(let i=0; i<w; i++) {
          for(let j=0; j<h; j++) {
              if (this.occupied.has(`${x+i},${y+j}`)) return false;
          }
      }
      return true;
  }
  private placeExplicit(defId: string, x: number, y: number, uid: string, isModule: boolean = false, parentId?: string) {
      const def = this.definitions.find(d => d.id === defId);
      if (!def) return;
      this.currentGenome.push({ uid, definitionId: defId, x, y, rotation: 0, isModule, parentId });
      for(let i=0; i<def.width; i++) {
          for(let j=0; j<def.height; j++) {
              const key = `${x+i},${y+j}`;
              this.occupied.add(key);
              if (defId === this.roadDefId) this.roadCells.add(key);
          }
      }
  }
  private place(defId: string, x: number, y: number) { this.placeExplicit(defId, x, y, generateId()); }
  private buildRoadRect(x: number, y: number) { 
      for(let i=0; i<this.BLOCK_W; i++) { this.ensureRoad(x+i, y); this.ensureRoad(x+i, y+this.BLOCK_H-1); } 
      for(let j=0; j<this.BLOCK_H; j++) { this.ensureRoad(x, y+j); this.ensureRoad(x+this.BLOCK_W-1, y+j); } 
  }
    private ensureRoad(x: number, y: number) { if (!this.occupied.has(`${x},${y}`)) { this.place(this.roadDefId, x, y); } }
  private isOccupied(x: number, y: number, w: number, h: number): boolean { return !this.isAreaFree(x, y, w, h); }
  private canPlace(x: number, y: number, w: number, h: number): boolean { return this.isAreaFree(x, y, w, h); }
  private isInBounds(x: number, y: number, w: number, h: number): boolean { return x >= 0 && y >= 0 && x + w <= this.params.areaWidth && y + h <= this.params.areaHeight; }
  private generateSpiral(rings: number): {u: number, v: number}[] { const coords: {u: number, v: number}[] = []; let x = 0, y = 0; let dx = 0, dy = -1; for (let i = 0; i < rings * rings * 4; i++) { if (Math.abs(x) <= rings && Math.abs(y) <= rings) coords.push({u: x, v: y}); if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) { const temp = dx; dx = -dy; dy = temp; } x += dx; y += dy; } return coords; }
  
  public getBest() { return { genome: this.currentGenome, fitness: this.currentGenome.length, errors: this.errors }; }
}
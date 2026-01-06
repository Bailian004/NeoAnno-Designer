import { BuildingDefinition, PlacedBuilding, SolverParams, CityGenome, BlockGene } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

export type SolverMode = 'city' | 'industry';

export class GeneticSolver {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private currentGenome: PlacedBuilding[] = [];
  private blueprint: CityGenome | null = null;
  private mode: SolverMode;

  private spineQueue: string[] = []; 
  private localQueue: string[] = []; 
  private houseQueue: string[] = []; 
  
  private occupied: Set<string> = new Set();
  private center: { x: number, y: number };
  private roadDefId: string;
  private warehouseDefId: string; 
  
  private spiralGrid: {u: number, v: number}[] = [];
  private currentSpiralIndex = 0;
  public isFinished: boolean = false;
  
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
      this.isFinished = false;
      this.currentSpiralIndex = 0;
      this.blueprint = genome || null;

      this.params.blockedCells.forEach(cell => this.occupied.add(cell));
      this.spiralGrid = this.generateSpiral(Math.ceil(this.params.areaWidth / this.BLOCK_W) + 12);

      const spine: string[] = [];
      const local: string[] = [];
      const houses: string[] = [];

      const allRequests: {id: string}[] = [];
      Object.entries(this.params.targetCounts).forEach(([id, count]) => {
        let def = this.definitions.find(d => d.id === id);
        if (!def) def = this.definitions.find(d => d.name.toLowerCase() === id.toLowerCase() || d.name.toLowerCase().includes(id.toLowerCase()));
        if (!def) return;
        for (let i = 0; i < count; i++) allRequests.push({id: def.id});
      });

      allRequests.forEach(({id}) => {
          const def = this.definitions.find(d => d.id === id)!;
          if (this.mode === 'industry') {
              if (def.name.toLowerCase().includes('warehouse')) spine.push(id);
              else if (def.category === 'Production') {
                  // Sort farms to local queue too, we want them mixed in tightly
                  local.push(id);
              } else local.push(id);
          } else {
               if (def.category === 'Public') {
                  const r = def.influenceRadius || def.influenceRange || 0;
                  if (r > 28) spine.push(id);
                  else local.push(id);
              } else if (def.category === 'Residence') houses.push(id);
              else local.push(id);
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

  public buildSync() { let safety = 0; while(!this.isFinished && safety++ < 5000) this.step(); if(safety>=5000) this.isFinished=true; }
  
  public step() { 
      let placed = false; let attempts = 0; 
      
      // INDUSTRY MODE: Use continuous packing logic
      if (this.mode === 'industry') {
          // Process one building at a time from queues
          if (this.spineQueue.length > 0) {
              placed = this.placeNextIndustryBuilding(this.spineQueue);
          } else if (this.localQueue.length > 0) {
              placed = this.placeNextIndustryBuilding(this.localQueue);
          } else if (this.houseQueue.length > 0) {
              placed = this.placeNextIndustryBuilding(this.houseQueue);
          } else {
              this.isFinished = true;
              return;
          }
          
          if (!placed) {
              // If we fail to place, discard the building to prevent infinite loop
              // In a real GA we might retry elsewhere, but for this deterministic pass we skip
              if (this.spineQueue.length > 0) this.spineQueue.shift();
              else if (this.localQueue.length > 0) this.localQueue.shift();
              else if (this.houseQueue.length > 0) this.houseQueue.shift();
          }
          return;
      }

      // CITY MODE: Legacy Chunk Logic
      while(!placed && this.currentSpiralIndex < this.spiralGrid.length && attempts++ < 150) { 
          placed = this.processChunk(this.spiralGrid[this.currentSpiralIndex].u, this.spiralGrid[this.currentSpiralIndex].v); 
          this.currentSpiralIndex++; 
      } 
      if(this.currentSpiralIndex >= this.spiralGrid.length) this.isFinished = true; 
  }

  // --- INDUSTRY: ORGANIC PLACEMENT ---
  private placeNextIndustryBuilding(queue: string[]): boolean {
      if (queue.length === 0) return false;
      const id = queue[0];
      const def = this.definitions.find(d => d.id === id)!;
      
      // 1. Find a spot using the Spiral Grid (Continuous Canvas Search)
      // We search for a valid spot that is FREE and (optionally) NEAR A ROAD/WAREHOUSE
      // Ideally, we want to cluster around existing buildings.
      
      // Heuristic: Start searching from center or last placed building
      // For now, reuse the spiral grid as a general search pattern across the whole map
      // but scaled to cell coordinates, not chunks.
      
      // Re-initialize spiral search for this building if needed, or just iterate a global cursor?
      // A global spiral is better for "growing" the city outwards.
      
      // Optimization: We scan a localized area around the center.
      const searchRadius = 150; // Cells
      const step = 2; // Performance skip
      
      for (let r = 0; r < searchRadius; r += step) {
          // Generate a ring of points
          const ring = this.generateSpiral(r / step); // reuse spiral logic but treat u/v as small steps
          
          for (const point of ring) {
              const x = this.center.x + (point.u * step);
              const y = this.center.y + (point.v * step);
              
              if (!this.isInBounds(x, y, def.width, def.height)) continue;
              
              if (this.isAreaFree(x, y, def.width, def.height)) {
                  // Found a spot for Parent!
                  
                  // CONNECTIVITY CHECK: Is it near a road or can we build a road to it?
                  // Simple check: Allow placement if we can place a road next to it
                  // For organic growth, we just place it and force a road connection.
                  
                  const parentId = generateId();
                  this.placeExplicit(id, x, y, parentId, false);
                  
                  // Ensure Road Access (Place a single road tile at bottom center)
                  this.ensureRoad(x + Math.floor(def.width/2), y + def.height);
                  
                  // --- MODULE LOGIC (ORGANIC GROW) ---
                  if (def.farmConfig) {
                      this.placeOrganicModules(x, y, def, parentId);
                  }
                  
                  queue.shift();
                  return true;
              }
          }
      }
      return false;
  }

  private placeOrganicModules(parentX: number, parentY: number, parentDef: BuildingDefinition, parentId: string) {
      const { moduleCount, moduleSize, moduleType } = parentDef.farmConfig!;
      
      // Resolve Module ID
      let modDefId = 'Module_Field_1x1';
      if (moduleType === 'Pasture') {
          if (moduleSize.x === 3 && moduleSize.y === 3) modDefId = 'Module_Pasture_3x3';
          else if (moduleSize.x === 3 && moduleSize.y === 4) modDefId = 'Module_Pasture_3x4';
          else if (moduleSize.x === 4 && moduleSize.y === 3) modDefId = 'Module_Pasture_4x3';
          else if (moduleSize.x === 4 && moduleSize.y === 4) modDefId = 'Module_Pasture_4x4';
      }

      let modulesPlaced = 0;
      
      // FLOOD FILL / ORGANIC GROWTH
      // We start with a list of "candidate seeds" (tiles adjacent to parent/existing modules)
      // and try to pick valid ones.
      
      const candidates: {x: number, y: number}[] = [];
      const visited = new Set<string>();
      
      // Initial seeds: Perimeter of Parent
      this.addPerimeterCandidates(parentX, parentY, parentDef.width, parentDef.height, candidates, visited);
      
      // Randomize candidates for organic look
      this.shuffle(candidates);
      
      while (modulesPlaced < moduleCount && candidates.length > 0) {
          // Pick a candidate
          // Re-sort candidates by distance to parent to keep it somewhat tight? 
          // Or strictly random for "sprawl"? Let's try random first.
          
          const cand = candidates.shift()!;
          
          // STRICT CHECK: Can we place the module here?
          if (this.isAreaFree(cand.x, cand.y, moduleSize.x, moduleSize.y)) {
              this.placeExplicit(modDefId, cand.x, cand.y, generateId(), true, parentId);
              modulesPlaced++;
              
              // Add NEW seeds around this module
              this.addPerimeterCandidates(cand.x, cand.y, moduleSize.x, moduleSize.y, candidates, visited);
              
              // Re-shuffle to maintain organic randomness
              if (candidates.length > 20) this.shuffle(candidates); 
          }
      }
  }

  private addPerimeterCandidates(x: number, y: number, w: number, h: number, list: {x:number, y:number}[], visited: Set<string>) {
      // Add adjacent tiles (Up, Down, Left, Right) relative to the rectangle
      // We scan the perimeter.
      const step = 1; // Assuming 1x1 placement grid for seeds
      
      // Top & Bottom Edges
      for (let i = 0; i < w; i++) {
          this.tryAddCandidate(x + i, y - 1, list, visited); // Top
          this.tryAddCandidate(x + i, y + h, list, visited); // Bottom
      }
      
      // Left & Right Edges
      for (let j = 0; j < h; j++) {
          this.tryAddCandidate(x - 1, y + j, list, visited); // Left
          this.tryAddCandidate(x + w, y + j, list, visited); // Right
      }
  }

  private tryAddCandidate(x: number, y: number, list: {x:number, y:number}[], visited: Set<string>) {
      const key = `${x},${y}`;
      if (!visited.has(key)) {
          visited.add(key);
          list.push({x, y});
      }
  }

  private shuffle(array: any[]) {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
  }

  // --- CITY LOGIC (Legacy Chunks) ---
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

      // CITY MODE FALLBACK
      return this.processCityBlockLegacy(x, y, u, v);
  }

  private processCityBlockLegacy(x: number, y: number, u: number, v: number): boolean { 
      this.buildRoadRect(x, y);
      if (this.houseQueue.length > 0) {
           for (let py = y + 1; py < y + this.BLOCK_H - 1; py++) {
              let px = x + 1;
               while (px <= x + 13) {
                   if (this.houseQueue.length === 0) return true;
                   const id = this.houseQueue[0];
                   const def = this.definitions.find(d => d.id === id)!;
                   if (this.canPlace(px, py, def.width, def.height)) {
                       this.place(id, px, py);
                       this.houseQueue.shift();
                       px += def.width;
                   } else px++;
               }
           }
          return true;
      }
      return false; 
  }

  // --- UTILS ---
  // Helper: Checks every single cell for occupancy (Strict Mode)
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
      if (!def) {
          console.warn("Missing definition for", defId);
          return;
      }
      
      this.currentGenome.push({ 
          uid, 
          definitionId: defId, 
          x, 
          y, 
          rotation: 0,
          isModule,
          parentId
      });

      for(let i=0; i<def.width; i++) {
          for(let j=0; j<def.height; j++) this.occupied.add(`${x+i},${y+j}`);
      }
  }

  private place(defId: string, x: number, y: number) { this.placeExplicit(defId, x, y, generateId()); }
  
  private buildRoadRect(x: number, y: number) { 
      for(let i=0; i<this.BLOCK_W; i++) { this.ensureRoad(x+i, y); this.ensureRoad(x+i, y+this.BLOCK_H-1); } 
      for(let j=0; j<this.BLOCK_H; j++) { this.ensureRoad(x, y+j); this.ensureRoad(x+this.BLOCK_W-1, y+j); } 
  }
  
  private ensureRoad(x: number, y: number) { 
      if (!this.occupied.has(`${x},${y}`)) { 
          this.place(this.roadDefId, x, y); 
      } 
  }
  
  private isOccupied(x: number, y: number, w: number, h: number): boolean { 
      return !this.isAreaFree(x, y, w, h);
  }
  
  private canPlace(x: number, y: number, w: number, h: number): boolean { 
      return this.isAreaFree(x, y, w, h);
  }
  
  private isInBounds(x: number, y: number, w: number, h: number): boolean { 
      return x >= 0 && y >= 0 && x + w <= this.params.areaWidth && y + h <= this.params.areaHeight; 
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
  
  public getBest() { return { genome: this.currentGenome, fitness: this.currentGenome.length }; }
}
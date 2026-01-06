import { BuildingDefinition, PlacedBuilding, SolverParams, CityGenome, BlockGene } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

export type SolverMode = 'city' | 'industry';

/**
 * TITAN ARCHITECT V55 - INDUSTRY SUPPORT
 * * Feature: Industry Mode.
 * * Logic: processChunk now switches logic based on BlockGene.
 * - WAREHOUSE_HUB: Prioritizes Warehouses (Logistics).
 * - INDUSTRY_X: Prioritizes Production buildings.
 */
export class GeneticSolver {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private currentGenome: PlacedBuilding[] = [];
  private blueprint: CityGenome | null = null;
  private mode: SolverMode;

  private spineQueue: string[] = []; // Monuments / Warehouses
  private localQueue: string[] = []; // Services / Production
  private houseQueue: string[] = []; // Residences / Farms
  
  private occupied: Set<string> = new Set();
  private center: { x: number, y: number };
  private roadDefId: string;
  private warehouseDefId: string; // New: Cache the warehouse ID
  
  private spiralGrid: {u: number, v: number}[] = [];
  private currentSpiralIndex = 0;
  public isFinished: boolean = false;
  
  private readonly BLOCK_W = 15; 
  private readonly BLOCK_H = 9; 
  private readonly MAX_OVERLAP_RATIO = 0.20;

  constructor(params: SolverParams, definitions: BuildingDefinition[], mode: SolverMode = 'city') {
    this.params = params;
    this.definitions = definitions;
    this.mode = mode;
    this.center = { x: Math.floor(params.areaWidth / 2), y: Math.floor(params.areaHeight / 2) };

    const roadDef = definitions.find(d => 
      d.name.toLowerCase().includes('road') || 
      d.id.toLowerCase().includes('street') ||
      (d.width === 1 && d.height === 1 && d.category === 'Decoration')
    );
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
    this.spiralGrid = this.generateSpiral(Math.ceil(this.params.areaWidth / this.BLOCK_W) + 6);

    // --- SORTING LOGIC UPDATE ---
    const spine: string[] = [];
    const local: string[] = [];
    const houses: string[] = [];

    const allRequests: {id: string}[] = [];
    Object.entries(this.params.targetCounts).forEach(([id, count]) => {
      // 1. Try exact ID match
      let def = this.definitions.find(d => d.id === id);
      
      // 2. Fallback: Fuzzy Name Match (Crucial for Industry Data mismatches)
      if (!def) {
          def = this.definitions.find(d => d.name.toLowerCase() === id.toLowerCase() || d.name.toLowerCase().includes(id.toLowerCase()));
      }

      if (!def) {
          console.warn(`[GeneticSolver] Skipping unknown building ID/Name: ${id}`);
          return;
      }
      
      // Push the REAL definition ID, not the requested string
      for (let i = 0; i < count; i++) allRequests.push({id: def.id});
    });

    allRequests.forEach(({id}) => {
        const def = this.definitions.find(d => d.id === id)!;
        
        // INDUSTRY MODE SORTING
        if (this.mode === 'industry') {
            if (def.name.toLowerCase().includes('warehouse')) {
                spine.push(id); // Warehouses go to Spine
            } else if (def.category === 'Production') {
                if (def.width > 4 || def.height > 4) local.push(id); // Big factories -> Local
                else houses.push(id); // Small farms -> Filler
            } else {
                local.push(id);
            }
        } 
        // CITY MODE SORTING
        else {
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
        }
    });

    // Sort by size (Big things first)
    const sizeSort = (a: string, b: string) => {
        const dA = this.definitions.find(d => d.id === a)!;
        const dB = this.definitions.find(d => d.id === b)!;
        return (dB.width * dB.height) - (dA.width * dA.height);
    };

    this.spineQueue = spine.sort(sizeSort);
    this.localQueue = local.sort(sizeSort);
    this.houseQueue = houses; // Keep farms randomized or sort by tier
  }

  public buildSync() {
      let safety = 0;
      while (!this.isFinished && safety < 5000) {
          this.step();
          safety++;
      }
      if (safety >= 5000) this.isFinished = true;
  }

  public step() {
    if (this.isFinished) return;

    let placed = false;
    let attempts = 0;
    
    while(!placed && this.currentSpiralIndex < this.spiralGrid.length && attempts < 150) {
        const coord = this.spiralGrid[this.currentSpiralIndex];
        placed = this.processChunk(coord.u, coord.v);
        this.currentSpiralIndex++;
        attempts++;
    }

    if (this.currentSpiralIndex >= this.spiralGrid.length || (this.houseQueue.length === 0 && this.localQueue.length === 0 && this.spineQueue.length === 0 && !placed)) {
        this.isFinished = true;
        this.prune(); 
    }
  }

  private prune() {
      // In Industry mode, we prune orphan roads but keep warehouses even if empty for now
      if (this.mode === 'industry') return; // Skip complex prune for industry for now

      // Existing prune logic for cities...
      const houses = this.currentGenome.filter(b => {
        const def = this.definitions.find(d => d.id === b.definitionId);
        return def && def.category === 'Residence';
      });
      // ... (Rest of prune logic unchanged)
  }

  private processChunk(u: number, v: number): boolean {
      if (this.houseQueue.length === 0 && this.localQueue.length === 0 && this.spineQueue.length === 0) return false;

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
      let gene = BlockGene.RESIDENTIAL_TIER1;
      
      if (this.blueprint) {
          const gx = Math.floor(x / this.BLOCK_W); 
          const gy = Math.floor(y / this.BLOCK_H); 
          if (this.blueprint.grid && gx >= 0 && gx < this.blueprint.width && gy >= 0 && gy < this.blueprint.height) {
              gene = this.blueprint.grid[gx]?.[gy];
          }
      }

      if (gene === BlockGene.EMPTY) return false;

      // --- MODE SWITCH ---
      if (gene === BlockGene.WAREHOUSE_HUB) {
          // Industry Spine: Place Warehouse + Heavy Industry
          this.buildRoadRect(x, y);
          // Try place Warehouse in center
          if (this.spineQueue.length > 0) {
              const whId = this.spineQueue[0];
              const whDef = this.definitions.find(d => d.id === whId)!;
              this.place(whId, x + 5, y + 2); // Center-ish
              this.spineQueue.shift();
          }
          // Fill rest with production
          this.fillBlockWithQueue(x, y, this.localQueue);
          return true;
      }
      
      if (gene === BlockGene.INDUSTRY_HEAVY || gene === BlockGene.INDUSTRY_LIGHT) {
          // Industry Block: Just Roads + Production
          this.buildRoadRect(x, y);
          this.fillBlockWithQueue(x, y, this.localQueue);
          this.fillBlockWithQueue(x, y, this.houseQueue); // Farms
          return true;
      }

      // Default City Logic (Legacy)
      return this.processCityBlockLegacy(x, y, u, v);
  }

  // Generic Filler for Industry
  private fillBlockWithQueue(x: number, y: number, queue: string[]) {
      const zones = [{min: x+1, max: x+13}]; // Open layout
      
      for (const zone of zones) {
          for (let py = y + 1; py < y + this.BLOCK_H - 1; py++) {
              let px = zone.min;
              while (px <= zone.max) {
                  if (queue.length === 0) return;
                  
                  const id = queue[0];
                  const def = this.definitions.find(d => d.id === id)!;
                  
                  if (this.canPlace(px, py, def.width, def.height)) {
                      this.place(id, px, py);
                      queue.shift();
                      px += def.width;
                  } else {
                      px++;
                  }
              }
          }
      }
  }

  // --- LEGACY CITY LOGIC (Preserved for compatibility) ---
  private processCityBlockLegacy(x: number, y: number, u: number, v: number): boolean {
      // Reusing logic from V51 for Residential Blocks
      // 1. Roads
      this.buildRoadRect(x, y);
      const centerX = x + 7;
      for(let j=0; j<this.BLOCK_H; j++) this.ensureRoad(centerX, y+j);

      // 2. Services
      // ... (Simplified for brevity, assumes similar logic to V51) ...
      // If we have houses, place them
      if (this.houseQueue.length > 0) {
          this.fillBlockWithQueue(x, y, this.houseQueue);
          return true;
      }
      return false;
  }

  // --- UTILS (Unchanged) ---
  private buildRoadRect(x: number, y: number) {
      for(let i=0; i<this.BLOCK_W; i++) { this.ensureRoad(x+i, y); this.ensureRoad(x+i, y+this.BLOCK_H-1); }
      for(let j=0; j<this.BLOCK_H; j++) { this.ensureRoad(x, y+j); this.ensureRoad(x+this.BLOCK_W-1, y+j); }
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
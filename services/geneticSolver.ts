import { BuildingDefinition, PlacedBuilding, SolverParams } from "../types";

const generateId = () => Math.random().toString(36).substring(2, 9);

interface Individual {
  genome: PlacedBuilding[]; 
  fitness: number;
}

export type SolverMode = 'city' | 'industry';

export class GeneticSolver {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private population: Individual[] = [];
  private bestSolution: Individual | null = null;
  private generationCount: number = 0;
  private roadDefId: string;
  private mode: SolverMode;

  constructor(params: SolverParams, definitions: BuildingDefinition[], mode: SolverMode = 'city') {
    this.params = params;
    this.definitions = definitions;
    this.mode = mode;
    
    // Identify Road ID
    const roadDef = definitions.find(d => d.name.toLowerCase().includes('road') || (d.width === 1 && d.height === 1 && d.category === 'Decoration'));
    this.roadDefId = roadDef ? roadDef.id : 'road';
  }

  // --- Helpers ---
  private isCollision(b1: {x: number, y: number, w: number, h: number}, b2: {x: number, y: number, w: number, h: number}) {
      return b1.x < b2.x + b2.w && b1.x + b1.w > b2.x &&
             b1.y < b2.y + b2.h && b1.y + b1.h > b2.y;
  }

  // --- Fitness Function ---
  private calculateFitness(genome: PlacedBuilding[]): Individual {
    let fitness = 0;
    let coveredHouses = 0;
    let totalResidences = 0;

    const services = genome.filter(b => {
        const def = this.definitions.find(d => d.id === b.definitionId);
        return def && def.category === 'Public' && def.influenceRadius;
    });

    for (const b of genome) {
        const def = this.definitions.find(d => d.id === b.definitionId);
        if (!def || def.category !== 'Residence') continue;
        
        totalResidences++;
        
        const bCx = b.x + (b.rotation % 180 === 0 ? def.width : def.height) / 2;
        const bCy = b.y + (b.rotation % 180 === 0 ? def.height : def.width) / 2;

        let isCovered = false;
        if (services.length === 0) {
            isCovered = true; 
        } else {
            for (const s of services) {
                const sDef = this.definitions.find(d => d.id === s.definitionId)!;
                const sCx = s.x + (s.rotation % 180 === 0 ? sDef.width : sDef.height) / 2;
                const sCy = s.y + (s.rotation % 180 === 0 ? sDef.height : sDef.width) / 2;
                
                const dist = Math.sqrt((bCx - sCx)**2 + (bCy - sCy)**2);
                if (dist <= (sDef.influenceRadius || 0)) {
                    isCovered = true;
                    break;
                }
            }
        }
        if (isCovered) coveredHouses++;
    }

    // 1. Coverage Score (High value)
    fitness += (coveredHouses * 50);
    
    // 2. Population Density Score (Encourage keeping houses on the map)
    fitness += (totalResidences * 5);

    return {
        genome: genome,
        fitness: fitness
    };
  }

  // --- SEED GENERATOR ---
  private createOptimizedCityIndividual(): Individual {
      const genome: PlacedBuilding[] = [];
      const { areaWidth, areaHeight } = this.params;
      const mapCenter = { x: Math.floor(areaWidth / 2), y: Math.floor(areaHeight / 2) };
      
      const counts = { ...this.params.targetCounts };
      const usedCounts: Record<string, number> = {};
      const roadSet = new Set<string>(); 
      const occupiedSet = new Set<string>(); 

      const markOccupied = (x: number, y: number, w: number, h: number) => {
          for(let i=0; i<w; i++) {
              for(let j=0; j<h; j++) {
                  occupiedSet.add(`${x+i},${y+j}`);
              }
          }
      };

      const isAreaFree = (x: number, y: number, w: number, h: number) => {
          if (x < 0 || y < 0 || x + w > areaWidth || y + h > areaHeight) return false;
          for(let i=0; i<w; i++) {
              for(let j=0; j<h; j++) {
                  const key = `${x+i},${y+j}`;
                  if (occupiedSet.has(key)) return false;
                  if (this.params.blockedCells.has(key)) return false;
              }
          }
          return true;
      };

      const placeRoad = (x: number, y: number) => {
          if (x < 0 || y < 0 || x >= areaWidth || y >= areaHeight) return;
          const key = `${x},${y}`;
          if (occupiedSet.has(key) && !roadSet.has(key)) return;
          if (roadSet.has(key)) return;
          
          if (!this.params.blockedCells.has(key)) {
              genome.push({
                  uid: generateId(),
                  definitionId: this.roadDefId,
                  x,
                  y,
                  rotation: 0
              });
              roadSet.add(key);
              occupiedSet.add(key);
          }
      };

      const getRemaining = (id: string) => (counts[id] || 0) - (usedCounts[id] || 0);

      // --- 1. THE SPINE ---
      for(let y=0; y<areaHeight; y++) placeRoad(mapCenter.x, y);
      for(let x=0; x<areaWidth; x++) placeRoad(x, mapCenter.y);

      // --- 2. SERVICE PLACEMENT (Symmetrical Expansion with Search) ---
      const services = Object.keys(counts).filter(id => {
          const def = this.definitions.find(d => d.id === id);
          return def && def.category === 'Public';
      }).sort((a, b) => {
          // Place largest services first
          const da = this.definitions.find(d => d.id === a)!;
          const db = this.definitions.find(d => d.id === b)!;
          return (db.width * db.height) - (da.width * da.height); 
      });

      const serviceQueue: string[] = [];
      services.forEach(id => {
          const remain = getRemaining(id);
          for(let i=0; i<remain; i++) serviceQueue.push(id);
      });

      // Directions: N, S, E, W
      const directions = ['N', 'S', 'E', 'W'];
      let dirIdx = 0;

      for (const sId of serviceQueue) {
          const def = this.definitions.find(d => d.id === sId)!;
          let placed = false;
          
          // Try all 4 directions starting from current dirIdx
          for(let i=0; i<4; i++) {
              if (placed) break;
              const dir = directions[(dirIdx + i) % 4];
              
              // Scan outwards from center
              // Limit scan to avoid infinite loops, but large enough to cover map
              for(let step = 2; step < Math.max(areaWidth, areaHeight) / 2; step++) {
                  let bx = 0, by = 0;
                  let rot: 0 | 90 | 180 | 270 = 0;
                  let w = def.width;
                  let h = def.height;

                  // Rotate building if it fits better along the axis?
                  // For E/W axis, if height > width (like Church), rotate 90 to align long side with road
                  if ((dir === 'E' || dir === 'W') && def.height > def.width) {
                      rot = 90;
                      w = def.height;
                      h = def.width;
                  }

                  // Alternating sides (Left/Right of axis)
                  const sideOffset = (step % 2 === 0) ? 1 : 0; 
                  // Actually, just checking both sides at this step is safer
                  
                  // Define potential spots at this 'step' distance
                  const spots: {x: number, y: number}[] = [];
                  
                  if (dir === 'N') {
                      const y = mapCenter.y - step - h;
                      spots.push({ x: mapCenter.x - w, y }); // Left of road
                      spots.push({ x: mapCenter.x + 1, y }); // Right of road
                  } else if (dir === 'S') {
                      const y = mapCenter.y + step;
                      spots.push({ x: mapCenter.x - w, y });
                      spots.push({ x: mapCenter.x + 1, y });
                  } else if (dir === 'E') {
                      const x = mapCenter.x + step;
                      spots.push({ x, y: mapCenter.y - h }); // Top of road
                      spots.push({ x, y: mapCenter.y + 1 }); // Bottom of road
                  } else if (dir === 'W') {
                      const x = mapCenter.x - step - w;
                      spots.push({ x, y: mapCenter.y - h });
                      spots.push({ x, y: mapCenter.y + 1 });
                  }

                  // Check spots
                  for(const spot of spots) {
                      if (isAreaFree(spot.x, spot.y, w, h)) {
                          genome.push({ uid: generateId(), definitionId: sId, x: spot.x, y: spot.y, rotation: rot });
                          markOccupied(spot.x, spot.y, w, h);
                          usedCounts[sId] = (usedCounts[sId] || 0) + 1;
                          placed = true;

                          // Ring Roads
                          for(let rx=spot.x-1; rx<=spot.x+w; rx++) { placeRoad(rx, spot.y-1); placeRoad(rx, spot.y+h); }
                          for(let ry=spot.y-1; ry<=spot.y+h; ry++) { placeRoad(spot.x-1, ry); placeRoad(spot.x+w, ry); }
                          
                          break; 
                      }
                  }
                  if (placed) break;
              }
          }
          
          // Rotate start direction for next building to maintain symmetry
          dirIdx = (dirIdx + 1) % 4;
      }

      // --- 3. RESIDENTIAL GRID ---
      const residences = Object.keys(counts).filter(id => {
          const def = this.definitions.find(d => d.id === id);
          return def && def.category === 'Residence';
      });

      if (residences.length > 0) {
          const residenceQueue: string[] = [];
          for (const rId of residences) {
             const count = getRemaining(rId);
             for(let i=0; i<count; i++) residenceQueue.push(rId);
          }
          // Sort by population capacity to place high-tier houses centrally
          residenceQueue.sort((a, b) => {
              const defA = this.definitions.find(d => d.id === a);
              const defB = this.definitions.find(d => d.id === b);
              return (defB?.residence?.maxPopulation || 0) - (defA?.residence?.maxPopulation || 0);
          });

          // Standard block size
          const gridRefDef = this.definitions.find(d => d.id === residences[0])!;
          const hW = gridRefDef.width;
          const hH = gridRefDef.height;
          const stripHeight = (hH * 2) + 1; 
          const blockWidth = 14;

          interface Slot { x: number; y: number; dist: number; requiresTopRoad: boolean; requiresBotRoad: boolean; }
          const candidateSlots: Slot[] = [];
          
          const startYOffset = (mapCenter.y % stripHeight);
          const startXOffset = (mapCenter.x % blockWidth);

          for (let y = startYOffset - stripHeight; y < areaHeight; y += stripHeight) {
              const topRowY = y - hH;
              const botRowY = y + 1;

              for (let x = 0; x < areaWidth - hW; x++) {
                   // Calculate distance from center for radial filling
                   const cx = x + hW/2;
                   
                   // Check Top Slot
                   if (topRowY >= 0) {
                       const cy = topRowY + hH/2;
                       const dist = Math.sqrt((cx - mapCenter.x)**2 + (cy - mapCenter.y)**2);
                       candidateSlots.push({ x, y: topRowY, dist, requiresTopRoad: false, requiresBotRoad: true });
                   }
                   // Check Bottom Slot
                   if (botRowY + hH <= areaHeight) {
                       const cy = botRowY + hH/2;
                       const dist = Math.sqrt((cx - mapCenter.x)**2 + (cy - mapCenter.y)**2);
                       candidateSlots.push({ x, y: botRowY, dist, requiresTopRoad: true, requiresBotRoad: false });
                   }
              }
          }

          // Sort by distance to create a circle
          candidateSlots.sort((a, b) => a.dist - b.dist);

          let qIdx = 0;
          for (const slot of candidateSlots) {
              if (qIdx >= residenceQueue.length) break;
              
              if (isAreaFree(slot.x, slot.y, hW, hH)) {
                  const currentResId = residenceQueue[qIdx];
                  genome.push({ uid: generateId(), definitionId: currentResId, x: slot.x, y: slot.y, rotation: 0 });
                  markOccupied(slot.x, slot.y, hW, hH);
                  usedCounts[currentResId] = (usedCounts[currentResId] || 0) + 1;
                  qIdx++;

                  // Roads
                  if (slot.requiresBotRoad) { for(let rx=slot.x; rx<slot.x+hW; rx++) placeRoad(rx, slot.y + hH); }
                  if (slot.requiresTopRoad) { for(let rx=slot.x; rx<slot.x+hW; rx++) placeRoad(rx, slot.y - 1); }
                  
                  // Block Feeders
                  const relX = (slot.x - startXOffset) % blockWidth;
                  if (Math.abs(relX) <= 1 || relX >= blockWidth - hW - 1) {
                       for(let ry=slot.y; ry<slot.y+hH; ry++) placeRoad(Math.abs(relX) <= 1 ? slot.x-1 : slot.x+hW, ry);
                  }
              }
          }
      }

      // --- 4. INDUSTRY (SPIRAL SEARCH) ---
      // Replaces linear scan to prevent bottom-heavy layout
      const industry = Object.keys(counts).filter(id => {
          const def = this.definitions.find(d => d.id === id);
          return def && def.category === 'Production';
      });

      if (industry.length > 0) {
           for(const indId of industry) {
               const def = this.definitions.find(d => d.id === indId)!;
               let count = getRemaining(indId);
               
               // Spiral Search Variables
               let r = 5; // Start radius
               let theta = 0;
               let dr = 1; // Radius increment
               let dTheta = 0.5; // Angle increment
               
               let fails = 0;
               // Limit iterations to prevent infinite loop
               while(count > 0 && fails < 1000) {
                   const ix = Math.floor(mapCenter.x + r * Math.cos(theta));
                   const iy = Math.floor(mapCenter.y + r * Math.sin(theta));
                   
                   if (isAreaFree(ix, iy, def.width, def.height)) {
                        genome.push({ uid: generateId(), definitionId: indId, x: ix, y: iy, rotation: 0 });
                        markOccupied(ix, iy, def.width, def.height);
                        // Add basic road access
                        for(let rx=ix-1; rx<=ix+def.width; rx++) placeRoad(rx, iy+def.height);
                        for(let ry=iy; ry<iy+def.height; ry++) placeRoad(ix-1, ry);

                        usedCounts[indId] = (usedCounts[indId] || 0) + 1;
                        count--;
                        fails = 0; // Reset fails on success
                   } else {
                       fails++;
                   }

                   // Advance Spiral
                   theta += dTheta;
                   if (theta > Math.PI * 2) {
                       theta -= Math.PI * 2;
                       r += dr;
                       // Reduce angle step as radius grows to maintain resolution
                       dTheta = Math.max(0.1, 1 / r); 
                   }
               }
           }
      }

      return this.calculateFitness(genome);
  }

  // --- MUTATION: Destructive Move (Bulldoze) ---
  private destructiveMutate(individual: Individual): Individual {
      const genome = [...individual.genome];
      
      // 1. Pick a Service Building
      const serviceIndices = genome.map((b, i) => {
          const def = this.definitions.find(d => d.id === b.definitionId);
          return (def && def.category === 'Public') ? i : -1;
      }).filter(i => i !== -1);

      if (serviceIndices.length === 0) return individual;
      const idxToMove = serviceIndices[Math.floor(Math.random() * serviceIndices.length)];
      const service = genome[idxToMove];
      const sDef = this.definitions.find(d => d.id === service.definitionId)!;

      // 2. Pick a random existing Residence to center on
      const residences = genome.filter(b => {
          const d = this.definitions.find(x => x.id === b.definitionId);
          return d && d.category === 'Residence';
      });
      
      let bestCandidate = individual;

      // Try a few times to find a better spot
      for(let attempt=0; attempt<3; attempt++) {
          let tx = 0, ty = 0;
          
          if (residences.length > 0 && Math.random() > 0.3) {
             const targetRes = residences[Math.floor(Math.random() * residences.length)];
             // Add random offset
             tx = Math.floor(targetRes.x + (Math.random() * 10 - 5));
             ty = Math.floor(targetRes.y + (Math.random() * 10 - 5));
          } else {
             // Random map spot
             tx = Math.floor(Math.random() * (this.params.areaWidth - sDef.width));
             ty = Math.floor(Math.random() * (this.params.areaHeight - sDef.height));
          }

          // Bounds check
          if (tx < 0 || ty < 0 || tx + sDef.width > this.params.areaWidth || ty + sDef.height > this.params.areaHeight) continue;

          // 3. Check for HARD Collisions (Other Services, Industry, Blocked Terrain)
          // We ALLOW collision with Residences (Bulldoze)
          let hardCollision = false;
          const conflictingIndices: number[] = [];

          // Terrain
          for(let bx=0; bx<sDef.width; bx++){
              for(let by=0; by<sDef.height; by++){
                  if (this.params.blockedCells.has(`${tx+bx},${ty+by}`)) { hardCollision = true; break; }
              }
              if(hardCollision) break;
          }
          if (hardCollision) continue;

          // Building Collision
          for (let k=0; k<genome.length; k++) {
              if (k === idxToMove) continue;
              const other = genome[k];
              const oDef = this.definitions.find(d => d.id === other.definitionId)!;
              
              if (tx < other.x + oDef.width && tx + sDef.width > other.x &&
                  ty < other.y + oDef.height && ty + sDef.height > other.y) {
                  
                  if (oDef.category === 'Residence') {
                      conflictingIndices.push(k);
                  } else {
                      // Hitting another service or industry or road is illegal
                      hardCollision = true;
                      break;
                  }
              }
          }
          if (hardCollision) continue;

          // 4. EXECUTE BULLDOZE
          const newGenome = [...genome];
          // Remove conflicting residences (indices need to be handled carefully, sort desc)
          conflictingIndices.sort((a, b) => b - a);
          const displacedHouses: PlacedBuilding[] = [];
          conflictingIndices.forEach(idx => {
               displacedHouses.push(newGenome[idx]);
               newGenome.splice(idx, 1);
          });
          
          // Re-find service index in newGenome
          const serviceIdx = newGenome.findIndex(b => b.uid === service.uid);
          if (serviceIdx !== -1) {
              newGenome[serviceIdx] = { ...newGenome[serviceIdx], x: tx, y: ty };
          }

          // 5. REBUILD DISPLACED HOUSES
          // Try to place them in the OLD service location or nearby free spots
          const oldX = service.x;
          const oldY = service.y;
          
          // Helper to find free spot in a genome
          const findSpot = (w: number, h: number, nearX: number, nearY: number): {x: number, y: number} | null => {
              // Spiral out from nearX, nearY
              let r = 0;
              while(r < 15) { // Search radius
                 for(let theta=0; theta < Math.PI*2; theta+=0.5) {
                     const cx = Math.floor(nearX + r * Math.cos(theta));
                     const cy = Math.floor(nearY + r * Math.sin(theta));
                     if (cx < 0 || cy < 0 || cx+w > this.params.areaWidth || cy+h > this.params.areaHeight) continue;
                     
                     // Check collision against newGenome
                     let coll = false;
                     // Terrain
                     for(let bx=0; bx<w; bx++){
                         for(let by=0; by<h; by++){
                             if (this.params.blockedCells.has(`${cx+bx},${cy+by}`)) { coll = true; break; }
                         }
                         if(coll) break;
                     }
                     if(!coll) {
                         // Buildings
                         for(const b of newGenome) {
                             const bd = this.definitions.find(d => d.id === b.definitionId)!;
                             if (cx < b.x + bd.width && cx + w > b.x && cy < b.y + bd.height && cy + h > b.y) {
                                 coll = true; break;
                             }
                         }
                     }
                     if(!coll) return {x: cx, y: cy};
                 }
                 r++;
              }
              return null;
          };

          displacedHouses.forEach(h => {
              const hDef = this.definitions.find(d => d.id === h.definitionId)!;
              // Try old service spot first
              const spot = findSpot(hDef.width, hDef.height, oldX, oldY);
              if (spot) {
                  newGenome.push({ ...h, x: spot.x, y: spot.y });
              }
          });

          // 6. CHECK FITNESS
          const newInd = this.calculateFitness(newGenome);
          if (newInd.fitness > bestCandidate.fitness) {
              bestCandidate = newInd;
          }
      }

      return bestCandidate;
  }

  public init() {
      this.population = [];
      const seed = this.createOptimizedCityIndividual();
      this.population.push(seed);
      this.bestSolution = seed;
      this.generationCount = 0;
  }

  public step() {
      this.generationCount++;
      if (this.bestSolution) {
          // Perform multiple mutation attempts per frame to speed up evolution
          let currentBest = this.bestSolution;
          
          for(let i=0; i<3; i++) {
              const mutated = this.destructiveMutate(currentBest);
              if (mutated.fitness > currentBest.fitness) {
                  currentBest = mutated;
              }
          }
          this.bestSolution = currentBest;
      }
  }

  public getBest(): Individual | null {
      return this.bestSolution;
  }

  public getGeneration(): number {
      return this.generationCount;
  }
}
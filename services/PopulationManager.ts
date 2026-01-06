import { BuildingDefinition, PlacedBuilding, SolverParams, CityGenome, BlockGene } from "../types";
import { GeneticSolver, SolverMode } from "./geneticSolver";

export interface GenerationResult {
    fitness: number;
    metrics: {
        coverage: number;
        efficiency: number;
        wastedSpace: number;
    };
    counts: Record<string, number>;
}

export interface Individual {
  genome: CityGenome;
  fitness: number;
  layout: PlacedBuilding[]; 
  metrics: {
    coverage: number;
    efficiency: number;
    wastedSpace: number;
  };
}

/**
 * TITAN POPULATION MANAGER V55 - INDUSTRY MODE ENABLED
 * * Feature: 'createRandomIndividual' now generates Industry DNA if mode === 'industry'.
 * * Logic: Industry layouts prioritize 'WAREHOUSE_HUB' spines and 'INDUSTRY' blocks.
 */
export class PopulationManager {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private mode: SolverMode;
  
  private population: Individual[] = [];
  public generationCount = 0;
  
  private readonly MUTATION_RATE = 0.08; 
  private readonly ELITISM_COUNT = 3;

  // Genome Grid Dimensions
  private gridW: number;
  private gridH: number;
  private readonly CHUNK_W = 15;
  private readonly CHUNK_H = 9;

  constructor(params: SolverParams, definitions: BuildingDefinition[], mode: SolverMode) {
    this.params = params;
    this.definitions = definitions;
    this.mode = mode;
    
    // Calculate how many chunks fit in the area
    this.gridW = Math.ceil(params.areaWidth / this.CHUNK_W) + 2;
    this.gridH = Math.ceil(params.areaHeight / this.CHUNK_H) + 2;
  }

  public initPopulation() {
    this.population = [];
    for (let i = 0; i < this.params.populationSize; i++) {
      this.population.push(this.createRandomIndividual());
    }
    this.evaluatePopulation();
  }

  public stepGeneration() {
    const newPop: Individual[] = [];
    
    this.population.sort((a, b) => b.fitness - a.fitness);

    for(let i=0; i<this.ELITISM_COUNT; i++) {
        if(this.population[i]) newPop.push(this.population[i]);
    }

    while (newPop.length < this.params.populationSize) {
      const parentA = this.tournamentSelect();
      const parentB = this.tournamentSelect();
      
      let childGenome = this.crossover(parentA.genome, parentB.genome);
      childGenome = this.mutate(childGenome);
      
      newPop.push({
        genome: childGenome,
        fitness: 0,
        layout: [],
        metrics: { coverage: 0, efficiency: 0, wastedSpace: 0 }
      });
    }

    this.population = newPop;
    this.evaluatePopulation();
    this.generationCount++;
  }

  // --- GENETIC OPERATORS ---

  private createRandomIndividual(): Individual {
    const grid: BlockGene[][] = [];
    
    for (let x = 0; x < this.gridW; x++) {
      const col: BlockGene[] = [];
      for (let y = 0; y < this.gridH; y++) {
        
        // --- INDUSTRY MODE LOGIC ---
        if (this.mode === 'industry') {
            // Central Spine = Warehouses (Logistics)
            const isSpine = (y === Math.floor(this.gridH / 2));
            if (isSpine) {
                col.push(Math.random() > 0.3 ? BlockGene.WAREHOUSE_HUB : BlockGene.INDUSTRY_HEAVY);
            } else {
                // Outer areas = Production Farms/Factories
                col.push(Math.random() > 0.5 ? BlockGene.INDUSTRY_LIGHT : BlockGene.INDUSTRY_HEAVY);
            }
        } 
        // --- CITY MODE LOGIC ---
        else {
            const dx = Math.abs(x - this.gridW/2);
            const dy = Math.abs(y - this.gridH/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 2) {
                col.push(Math.random() > 0.3 ? BlockGene.RESIDENTIAL_TIER2 : BlockGene.SERVICE_HUB);
            } else if (dist < 4) {
                col.push(BlockGene.RESIDENTIAL_TIER1);
            } else {
                col.push(Math.random() > 0.9 ? BlockGene.RESIDENTIAL_TIER1 : BlockGene.EMPTY);
            }
        }
      }
      grid.push(col);
    }
    
    return {
      genome: { id: Math.random().toString(36), grid, width: this.gridW, height: this.gridH },
      fitness: 0,
      layout: [],
      metrics: { coverage: 0, efficiency: 0, wastedSpace: 0 }
    };
  }

  private crossover(pA: CityGenome, pB: CityGenome): CityGenome {
    const childGrid: BlockGene[][] = [];
    const x1 = Math.floor(Math.random() * this.gridW);
    const x2 = Math.floor(Math.random() * (this.gridW - x1)) + x1;
    const y1 = Math.floor(Math.random() * this.gridH);
    const y2 = Math.floor(Math.random() * (this.gridH - y1)) + y1;

    for (let x = 0; x < this.gridW; x++) {
      const col: BlockGene[] = [];
      for (let y = 0; y < this.gridH; y++) {
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
           col.push(pA.grid[x][y]);
        } else {
           col.push(pB.grid[x][y]);
        }
      }
      childGrid.push(col);
    }

    return { id: Math.random().toString(), grid: childGrid, width: this.gridW, height: this.gridH };
  }

  private mutate(genome: CityGenome): CityGenome {
    const newGrid = genome.grid.map(col => [...col]); 
    const genes = Object.values(BlockGene);

    for (let x = 0; x < this.gridW; x++) {
      for (let y = 0; y < this.gridH; y++) {
        if (Math.random() < this.MUTATION_RATE) {
          if (Math.random() > 0.7) {
              newGrid[x][y] = BlockGene.EMPTY;
          } else {
              newGrid[x][y] = genes[Math.floor(Math.random() * genes.length)];
          }
        }
      }
    }
    return { ...genome, grid: newGrid };
  }

  private tournamentSelect(): Individual {
    const k = 4;
    let best = this.population[Math.floor(Math.random() * this.population.length)];
    for (let i = 0; i < k - 1; i++) {
      const candidate = this.population[Math.floor(Math.random() * this.population.length)];
      if (candidate && best && candidate.fitness > best.fitness) best = candidate;
    }
    return best || this.population[0];
  }

  private evaluatePopulation() {
    this.population.forEach(ind => {
        if (ind.fitness > 0 && ind.layout.length > 0) return;

        try {
            const builder = new GeneticSolver(this.params, this.definitions, this.mode);
            builder.init(ind.genome); 
            builder.buildSync();      
            
            const result = builder.getBest();
            ind.layout = result.genome;
            
            // Calculate Fitness
            const metrics = this.calculateMetrics(ind.layout, this.params);
            ind.metrics = metrics;
            
            // --- FITNESS FUNCTION ---
            // 1. Completion Score (Did we build everything?)
            const totalTarget = Object.values(this.params.targetCounts).reduce((a,b) => a+b, 0);
            const totalBuilt = ind.layout.length;
            const completionScore = Math.min(totalBuilt / (totalTarget || 1), 1.2); 
            
            // 2. Compactness
            let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
            if (ind.layout.length > 0) {
                ind.layout.forEach(b => {
                    if (b.x < minX) minX = b.x;
                    if (b.x > maxX) maxX = b.x;
                    if (b.y < minY) minY = b.y;
                    if (b.y > maxY) maxY = b.y;
                });
            } else {
                minX = 0; maxX = 0; minY = 0; maxY = 0;
            }
            
            const bboxWidth = Math.max(0, maxX - minX);
            const bboxHeight = Math.max(0, maxY - minY);
            const bboxArea = bboxWidth * bboxHeight;
            const builtArea = ind.layout.length * 9; 
            const compactness = bboxArea > 0 ? builtArea / bboxArea : 0; 

            ind.fitness = (completionScore * 500) + (metrics.efficiency * 200) + (compactness * 300);
        } catch (e) {
            console.error("Layout generation failed for individual:", e);
            ind.fitness = 0; 
        }
    });
  }

  private calculateMetrics(layout: PlacedBuilding[], params: SolverParams) {
     const totalArea = params.areaWidth * params.areaHeight;
     let builtArea = 0;
     
     layout.forEach(b => {
         const def = this.definitions.find(d => d.id === b.definitionId);
         if(def) builtArea += (def.width * def.height);
     });
     
     return {
        coverage: 0,
        efficiency: builtArea / (totalArea || 1),
        wastedSpace: (totalArea - builtArea) / (totalArea || 1)
     };
  }

  public getBest(): Individual {
      return this.population.sort((a,b) => b.fitness - a.fitness)[0];
  }
}
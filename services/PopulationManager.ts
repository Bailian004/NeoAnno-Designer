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
 * TITAN POPULATION MANAGER V52 - COMPACTNESS FIX
 * * Fix: 'Dead Space' issue.
 * * Change: Added Bounding Box penalty. Cities that sprawl are punished.
 */
export class PopulationManager {
  private params: SolverParams;
  private definitions: BuildingDefinition[];
  private mode: SolverMode;
  
  private population: Individual[] = [];
  public generationCount = 0;
  
  // GA Constants
  private readonly POPULATION_SIZE = 40; 
  private readonly MUTATION_RATE = 0.08; 
  private readonly ELITISM_COUNT = 4;

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
    for (let i = 0; i < this.POPULATION_SIZE; i++) {
      this.population.push(this.createRandomIndividual());
    }
    // Initial Evaluate
    this.evaluatePopulation();
  }

  public stepGeneration() {
    // 1. Selection & Breeding
    const newPop: Individual[] = [];
    
    // Sort by fitness descending
    this.population.sort((a, b) => b.fitness - a.fitness);

    // Elitism: Keep the titans
    for(let i=0; i<this.ELITISM_COUNT; i++) {
        if(this.population[i]) newPop.push(this.population[i]);
    }

    // Breed the rest
    while (newPop.length < this.POPULATION_SIZE) {
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
    
    // 2. Build & Score
    this.evaluatePopulation();
    
    this.generationCount++;
  }

  // --- GENETIC OPERATORS ---

  private createRandomIndividual(): Individual {
    const grid: BlockGene[][] = [];
    // Bias towards CENTER start to prevent sprawl
    for (let x = 0; x < this.gridW; x++) {
      const col: BlockGene[] = [];
      for (let y = 0; y < this.gridH; y++) {
        const rand = Math.random();
        
        // Distance from center
        const dx = Math.abs(x - this.gridW/2);
        const dy = Math.abs(y - this.gridH/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Probability of being a building drops off with distance
        if (dist < 2) {
            col.push(Math.random() > 0.3 ? BlockGene.RESIDENTIAL_TIER2 : BlockGene.SERVICE_HUB);
        } else if (dist < 4) {
            col.push(BlockGene.RESIDENTIAL_TIER1);
        } else {
            // High chance of being empty far away
            col.push(rand > 0.9 ? BlockGene.RESIDENTIAL_TIER1 : BlockGene.EMPTY);
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
          // Weighted mutation: Bias towards EMPTY to clean up edges
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
      if (candidate.fitness > best.fitness) best = candidate;
    }
    return best;
  }

  // --- EVALUATION ---

  private evaluatePopulation() {
    this.population.forEach(ind => {
        if (ind.fitness > 0 && ind.layout.length > 0) return;

        const builder = new GeneticSolver(this.params, this.definitions, this.mode);
        builder.init(ind.genome); 
        builder.buildSync();      
        
        const result = builder.getBest();
        ind.layout = result.genome;
        
        // Calculate Fitness
        const metrics = this.calculateMetrics(ind.layout, this.params);
        ind.metrics = metrics;
        
        // 1. Completion Score (Did we build everything?)
        const targetHouseCount = Object.values(this.params.targetCounts).reduce((a,b) => a+b, 0);
        const actualHouseCount = ind.layout.filter(b => {
             const def = this.definitions.find(d => d.id === b.definitionId);
             return def?.category === 'Residence';
        }).length;
        const completionScore = Math.min(actualHouseCount / (targetHouseCount || 1), 1.2); 
        
        // 2. Bounding Box Penalty (Prevents Sprawl)
        // We calculate the area of the bounding box around all buildings.
        // If BBox Area >> Actual Built Area, it means lots of empty space -> High Penalty.
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
        const builtArea = ind.layout.length * 9; // Approx 3x3 avg
        
        // Ratio of "Used Space" inside the "City Limits"
        // 1.0 = Perfect rectangle of buildings. 0.1 = Scattered villages.
        const compactness = bboxArea > 0 ? builtArea / bboxArea : 0; 

        // Weighted Final Score
        ind.fitness = (completionScore * 500) + (metrics.efficiency * 200) + (compactness * 300);
    });
  }

  private calculateMetrics(layout: PlacedBuilding[], params: SolverParams) {
     const totalArea = params.areaWidth * params.areaHeight;
     let builtArea = 0;
     
     layout.forEach(b => {
         const def = this.definitions.find(d => d.id === b.definitionId);
         if(def) builtArea += (def.width * def.height);
     });
     
     // Bounding Box Waste
     // ... logic repeated for specific metric display ...
     
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
export enum AnnoTitle {
  ANNO_1800 = 'Anno 1800',
  ANNO_1404 = 'Anno 1404',
  ANNO_2070 = 'Anno 2070',
  ANNO_2205 = 'Anno 2205',
  ANNO_117 = 'Anno 117: Pax Romana'
}

// --- GENETIC ALGORITHM TYPES ---
export enum BlockGene {
  // CITY GENES
  RESIDENTIAL_TIER1 = 'RES_T1', // Farmers/Workers
  RESIDENTIAL_TIER2 = 'RES_T2', // Artisans+
  SERVICE_HUB = 'SVC_HUB',      // Public Services
  PARK_RESERVE = 'PARK',        // Decoration
  
  // INDUSTRY GENES (NEW)
  INDUSTRY_LIGHT = 'IND_L',     // Farms/Simple Processing (Potato, Sheep)
  INDUSTRY_HEAVY = 'IND_H',     // Factories/Smelters (Steel, Weapons)
  WAREHOUSE_HUB = 'WH_HUB',     // Logistics Center (Warehouses)
  
  EMPTY = 'EMPTY'               
}

export interface CityGenome {
  id: string;
  grid: BlockGene[][];
  width: number;
  height: number;
}

export interface ResourceRate {
  resourceId: string;
  amount: number; // units per minute
}

export interface BuildingDefinition {
  id: string;
  name: string;
  width: number; // in grid cells
  height: number; // in grid cells
  color: string;
  icon?: string; // Optional emoji or icon code
  category: 'Residence' | 'Production' | 'Public' | 'Decoration';
  
  // Service coverage (Markets, etc.)
  influenceRadius?: number; 

  // Attractiveness / Pollution system
  impactType?: 'Positive' | 'Negative'; 
  impactRadius?: number;

  production?: {
      inputs?: ResourceRate[];
      outputs?: ResourceRate[];
      workforce?: { type: string; amount: number }; // Workforce needed to operate
  };
  residence?: {
      populationType: string; // e.g. 'Farmer'
      maxPopulation: number;
      consumption?: ResourceRate[]; // per house at max population
  };
}

export interface PlacedBuilding {
  uid: string;
  definitionId: string;
  x: number; // Grid x
  y: number; // Grid y
  rotation: 0 | 90 | 180 | 270;
}

export interface Layout {
  width: number;
  height: number;
  buildings: PlacedBuilding[];
  blockedCells: string[]; // Set of "x,y" strings representing water/mountains
}

export interface GameConfig {
  title: AnnoTitle;
  gridColor: string;
  backgroundColor: string;
  buildings: BuildingDefinition[];
  resources?: Record<string, { name: string, icon?: string }>;
}

export interface SolverParams {
  areaWidth: number;
  areaHeight: number;
  populationSize: number;
  generations: number;
  targetCounts: Record<string, number>; // Building Definition ID -> Count
  blockedCells: Set<string>;
}
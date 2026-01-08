import { AnnoTitle, GameConfig, BuildingDefinition, ResourceRate } from "../types";
import { ANNO_117_BUILDINGS_RAW } from "./anno117Buildings";
import { loadBuildingDefinitions } from "./buildingAdapter";
import { getBuildingIcon, getIconSrc } from "../utils/iconResolver";

// --- Types for Raw JSON Data ---
interface RawBuilding {
  Header: string;
  Faction: string;
  Group: string | null;
  Identifier: string;
  IconFileName: string | null;
  BuildBlocker: { x: number; z: number } | null;
  Template: string;
  InfluenceRange: number;
  InfluenceRadius: number;
  Road: boolean;
  Borderless: boolean;
  Guid: number;
  Localization: { eng: string; ger?: string; [key: string]: string | undefined };
}

// --- COLOR PRESETS ---
const PRESET_COLOR_MAP: Record<string, string> = {
  // --- Infrastructure ---
  "Road": "#A9A9A9",
  "Street_1x1": "#A9A9A9",
  "Blocker": "#000000",
  "HarbourSystem": "#A9A9A9",

  // --- Production: Heavy / Mining (Orchid / SaddleBrown) ---
  "ToolmakerWorkshop": "#BA55D3", "OreSmelter": "#BA55D3", "CopperSmelter": "#BA55D3", "steelwork": "#BA55D3", 
  "coalpowerplant": "#BA55D3", "oil_refinery": "#BA55D3", "Factory_04 (Brick Factory)": "#BA55D3", 
  "Factory_01 (Concrete Factory)": "#BA55D3", "Heavy_02 (Steel Heavy Industry)": "#BA55D3", 
  "Heavy_01 (Beams Heavy Industry)": "#BA55D3", "Heavy_10 (Oil Heavy Industry)": "#8B4513",
  "Claypit": "#8B4513", "Clay Pit": "#8B4513", "Factory_11 (Clay Pit)": "#8B4513", 
  "CoalMine": "#8B4513", "Mining_01 (Coal Mine)": "#8B4513", "Iron Mine": "#8B4513", 
  "Mining_02 (Iron Mine)": "#8B4513", "GoldMine": "#8B4513", "Mining_08 (Gold Ore Mine)": "#8B4513",
  "Mining_05 (Copper Mine)": "#8B4513", "Mining_06 (Cement Mine)": "#8B4513", "Mining_04 (Zinc Mine)": "#8B4513",

  // --- Production: Light / High Tech (SlateBlue) ---
  "Tannery": "#6A5ACD", "Weaverhut": "#6A5ACD", "Framework Knitters": "#6A5ACD", 
  "Processing_04 (Weavery)": "#6A5ACD", "Factory_09 (Sailcloth Factory)": "#6A5ACD",
  "Papermill": "#6A5ACD", "FurrierWorkshop": "#6A5ACD", "SilkWeavingMill": "#6A5ACD",
  "Factory_03 (Timber Factory)": "#BA55D3", // Wood processing is often purple in AD
  "Factory_02 (Soap Factory)": "#BA55D3", 
  "Factory_07 (Window Factory)": "#BA55D3", "Factory_06 (Light Bulb Factory)": "#BA55D3",
  "Factory_10 (Chassis Factory)": "#BA55D3",

  // --- Production: Food (Green) ---
  "Bakery": "#008000", "Food_01 (Bread Maker)": "#008000", "Brewery": "#008000", 
  "Food_02 (Beer Maker)": "#008000", "Food_06 (Schnapps Maker)": "#008000", 
  "Food_07 (Sausage Maker)": "#008000", "Food_05 (Canned Food Factory)": "#008000",
  "CiderFarm": "#65A30D", // Exception from default map for variation
  "Slaughterhouse": "#008000", "Flour Mill": "#FFA500", "Processing_02 (Flour Processing)": "#FFA500",

  // --- Farm: Plantation (Orange) ---
  "SpiceFarm": "#FFA500", "Potato Farm": "#FFA500", "Agriculture_04 (Potato Farm)": "#FFA500", 
  "Agriculture_01 (Grain Farm)": "#FFA500", "Grain Farm": "#FFA500", "Hop Farm": "#FFA500", 
  "Agriculture_03 (Hop Farm)": "#FFA500", "Agriculture_10 (Vineyard)": "#FFA500",
  "Agriculture_11 (Bell Pepper Farm)": "#FFA500", "Agriculture_colony01_01 (Sugar Cane Farm)": "#FFA500",
  "Agriculture_colony01_02 (Tobacco Farm)": "#FFA500", "Agriculture_colony01_03 (Cotton Farm)": "#FFA500",
  "Agriculture_colony01_04 (Cocoa Farm)": "#FFA500", "Agriculture_colony01_05 (Caoutchouc Farm)": "#FFA500",
  "Agriculture_colony01_07 (Coffee Beans Farm)": "#FFA500", "Agriculture_colony01_08 (Banana Farm)": "#FFA500",
  "Agriculture_colony01_10 (Corn Farm)": "#FFA500",

  // --- Farm: Forestry (Olive) ---
  "LumberHut": "#808000", "Lumberjack Hut": "#808000", "Agriculture_05 (Timber Yard)": "#808000", 
  "Agriculture_colony01_06 (Timber Yard)": "#808000", "Agriculture_arctic_01 (Timber Yard)": "#808000",

  // --- Farm: Animal (GreenYellow) ---
  "Pigfarm": "#ADFF2F", "Pig Farm": "#ADFF2F", "Agriculture_08 (Pig Farm)": "#ADFF2F", 
  "Sheep Farm": "#ADFF2F", "Agriculture_06 (Sheep Farm)": "#ADFF2F", 
  "Cattle Farm": "#ADFF2F", "Agriculture_02 (Cattle Farm)": "#ADFF2F",
  "Agriculture_colony01_09 (Cattle Farm)": "#ADFF2F", "Agriculture_colony01_11 (Alpaca Farm)": "#ADFF2F",
  "Agriculture_arctic_03 (Goose Farm)": "#ADFF2F", "Agriculture_arctic_05 (Husky Farm)": "#ADFF2F",

  // --- Farm: Water (SteelBlue) ---
  "FishermanHut": "#4682B4", "Fishery": "#4682B4", "Coastal_01 (Fish Coast Building)": "#4682B4",
  "Coastal_colony01_02 (Fish Coast Building)": "#4682B4", "PearlFisherHut": "#4682B4",

  // --- Public: Services (PeachPuff) ---
  "Marketplace": "#FFDAB9", "Logistic_01 (Marketplace)": "#FFDAB9", 
  "Pub": "#FFDAB9", "Service_01 (Pub)": "#FFDAB9", 
  "Church": "#FFDAB9", "Service_04 (Church)": "#FFDAB9", 
  "Chapel": "#FFDAB9", "Service_colony01_02 (Chapel)": "#FFDAB9",
  "School": "#FFDAB9", "Service_02 (School)": "#FFDAB9", 
  "University": "#FFDAB9", "Service_07 (University)": "#FFDAB9", 
  "Bank": "#FFDAB9", "Service_03 (Bank)": "#FFDAB9", 
  "Members Club": "#FFDAB9", "Service_09 (Club House)": "#FFDAB9",
  "Service_05 (Cabaret)": "#DEB887", // Leisure - BurlyWood
  "Town hall": "#FFDAB9", "Guild_house": "#FF69B4", // Trade union is Pink in list

  // --- Public: Emergency/Health ---
  "FireStation": "#FF0000", "Institution_02 (Fire Department)": "#FF0000", "Institution_colony01_02 (Fire Department)": "#FF0000",
  "Police Station": "#1E90FF", "Institution_01 (Police)": "#1E90FF", "Institution_colony01_01 (Police)": "#1E90FF",
  "Hospital": "#9ACD32", "Institution_03 (Hospital)": "#9ACD32", "Institution_colony01_03 (Hospital)": "#9ACD32", // YellowGreen

  // --- Storage (DarkSeaGreen) ---
  "StoreHouse": "#8FBC8F", "Warehouse01": "#8FBC8F", "Logistic_02 (Warehouse I)": "#8FBC8F", "Warehouse": "#8FBC8F",

  // --- Residences (Teals & Blues) ---
  "PeasantHouse": "#A1EAEA", "Residence_Old_World": "#A1EAEA",
  "CitizenHouse": "#69C4C4", "Residence_tier02": "#69C4C4",
  "PatricianHouse": "#44A6A6", "Residence_tier03": "#44A6A6",
  "NoblemanHouse": "#008080", "Residence_tier04": "#008080",
  "Residence_tier05": "#035E5E", // Investors
  "Residence_New_World": "#FF9A67", // Jornalero
  "Residence_colony01_tier02": "#FF6517", // Obrero
  "Residence_Arctic_World": "#85B9FF", // Explorer
  "Residence_arctic_tier02": "#0096FF", // Technician
  "Residence_Africa_World": "#FFE885", // Shepherd
  "Residence_colony02_tier02": "#FFD106", // Elder
  "Residence_tier05b": "#2F4F4F", // Scholar
  "residence tier01 earth": "#A1EAEA", // 2205 Workers
  
  // --- Other Games ---
  "tycoon_worker_residence": "#D14C4C",
  "ecos_pioneer_residence": "#A1EAEA",
  "public earth 01": "#FFDAB9",

  // --- MODULE COLORS (Generic) ---
  "Module_Field": "#789c4a", 
  "Module_Pasture": "#a3bd63"
};

// --- LOGIC INJECTION MAP ---
const GAME_LOGIC_OVERRIDES: Record<string, Partial<BuildingDefinition>> = {
  // --- INFRASTRUCTURE ---
  "Street_1x1": { category: 'Decoration', name: 'Road' },
  "Logistic_02 (Warehouse I)": { name: 'Warehouse', category: 'Public' },

  // --- FARMERS ---
  "Residence_Old_World": {
    category: 'Residence',
    residence: {
      populationType: 'Farmer', maxPopulation: 10,
      consumption: [
        { resourceId: 'fish', amount: 0.025 }, 
        { resourceId: 'work_clothes', amount: 0.030 }, 
        { resourceId: 'schnapps', amount: 0.033 }
      ]
    }
  },
  // UPDATED RANGES & MODULES
  "Logistic_01 (Marketplace)": { category: 'Public', influenceRange: 48 }, 
  "Service_01 (Pub)": { category: 'Public', influenceRange: 48 },
  "Institution_02 (Fire Department)": { category: 'Public', influenceRange: 15 },

  "Agriculture_01 (Grain Farm)": {
    name: 'Grain Farm',
    category: 'Production',
    farmConfig: { moduleType: 'Field', moduleCount: 144, moduleSize: { x: 1, y: 1 } },
    production: { outputs: [{ resourceId: 'grain', amount: 1 }], workforce: { type: 'Farmer', amount: 20 }, cycleTime: 60 }
  },
  "Agriculture_04 (Potato Farm)": {
    name: 'Potato Farm',
    category: 'Production',
    farmConfig: { moduleType: 'Field', moduleCount: 72, moduleSize: { x: 1, y: 1 } },
    production: { outputs: [{ resourceId: 'potatoes', amount: 1 }], workforce: { type: 'Farmer', amount: 20 }, cycleTime: 30 }
  },
  "Agriculture_06 (Sheep Farm)": {
    name: 'Sheep Farm',
    category: 'Production',
    farmConfig: { moduleType: 'Pasture', moduleCount: 3, moduleSize: { x: 3, y: 3 } },
    production: { outputs: [{ resourceId: 'wool', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 }
  },
  "Agriculture_05 (Timber Yard)": {
    name: "Lumberjack's Hut",
    category: 'Production',
    influenceRadius: 7, 
    production: { outputs: [{ resourceId: 'wood', amount: 1 }], workforce: { type: 'Farmer', amount: 5 }, cycleTime: 15 }
  },
  "Factory_03 (Timber Factory)": {
    name: 'Sawmill',
    category: 'Production',
    production: { inputs: [{ resourceId: 'wood', amount: 4 }], outputs: [{ resourceId: 'timber', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 }
  },
  "Coastal_01 (Fish Coast Building)": {
    name: 'Fishery',
    category: 'Production',
    production: { outputs: [{ resourceId: 'fish', amount: 1 }], workforce: { type: 'Farmer', amount: 25 }, cycleTime: 30 }
  },
  "Processing_04 (Weavery)": {
    name: 'Framework Knitters',
    category: 'Production',
    production: { inputs: [{ resourceId: 'wool', amount: 2 }], outputs: [{ resourceId: 'work_clothes', amount: 1 }], workforce: { type: 'Farmer', amount: 50 }, cycleTime: 30 }
  },
  "Food_06 (Schnapps Maker)": {
    name: 'Schnapps Distillery',
    category: 'Production',
    impactType: 'Negative', impactRadius: 10,
    production: { inputs: [{ resourceId: 'potatoes', amount: 2 }], outputs: [{ resourceId: 'schnapps', amount: 1 }], workforce: { type: 'Farmer', amount: 50 }, cycleTime: 30 }
  },

  // --- WORKERS ---
  "Residence_tier02": {
    category: 'Residence',
    residence: {
      populationType: 'Worker', maxPopulation: 20,
      consumption: [
        { resourceId: 'fish', amount: 0.020 }, 
        { resourceId: 'work_clothes', amount: 0.0225 }, 
        { resourceId: 'schnapps', amount: 0.024 },
        { resourceId: 'sausages', amount: 0.020 }, 
        { resourceId: 'bread', amount: 0.018 }, 
        { resourceId: 'soap', amount: 0.008 },
        { resourceId: 'beer', amount: 0.026 }
      ]
    }
  },
  "Service_02 (School)": { category: 'Public', influenceRange: 72 },
  "Service_04 (Church)": { category: 'Public', influenceRange: 72 },
  "Institution_01 (Police)": { category: 'Public', influenceRange: 26 },

  "Agriculture_08 (Pig Farm)": {
    name: 'Pig Farm',
    category: 'Production', impactType: 'Negative', impactRadius: 12,
    farmConfig: { moduleType: 'Pasture', moduleCount: 5, moduleSize: { x: 3, y: 4 } },
    production: { outputs: [{ resourceId: 'pigs', amount: 1 }], workforce: { type: 'Farmer', amount: 5 }, cycleTime: 60 }
  },
  "Food_07 (Sausage Maker)": {
    name: 'Slaughterhouse',
    category: 'Production', impactType: 'Negative', impactRadius: 12,
    production: { inputs: [{ resourceId: 'pigs', amount: 1 }], outputs: [{ resourceId: 'sausages', amount: 1 }], workforce: { type: 'Worker', amount: 30 }, cycleTime: 60 }
  },
  "Processing_02 (Flour Processing)": {
    name: 'Flour Mill',
    category: 'Production',
    production: { inputs: [{ resourceId: 'grain', amount: 2 }], outputs: [{ resourceId: 'flour', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 }
  },
  "Food_01 (Bread Maker)": {
    name: 'Bakery',
    category: 'Production',
    production: { inputs: [{ resourceId: 'flour', amount: 1 }], outputs: [{ resourceId: 'bread', amount: 1 }], workforce: { type: 'Worker', amount: 50 }, cycleTime: 60 }
  },
  "Factory_02 (Soap Factory)": {
    category: 'Production', impactType: 'Negative', impactRadius: 15,
    production: { outputs: [{ resourceId: 'soap', amount: 1 }], workforce: { type: 'Worker', amount: 50 }, cycleTime: 30 }
  },
  "Factory_04 (Brick Factory)": {
    category: 'Production',
    production: { outputs: [{ resourceId: 'bricks', amount: 2 }], workforce: { type: 'Worker', amount: 10 } }
  },
  "Heavy_02 (Steel Heavy Industry)": {
    name: 'Furnace',
    category: 'Production', impactType: 'Negative', impactRadius: 15,
    production: { outputs: [{ resourceId: 'steel', amount: 1 }], workforce: { type: 'Worker', amount: 100 }, cycleTime: 30 }
  },
  "Heavy_01 (Beams Heavy Industry)": {
    name: 'Steelworks',
    category: 'Production',
    production: { outputs: [{ resourceId: 'steel_beams', amount: 1 }], cycleTime: 45 }
  },

  // --- ARTISANS ---
  "Residence_tier03": { 
    category: 'Residence', 
    residence: { 
      populationType: 'Artisan', 
      maxPopulation: 30,
      consumption: [
        { resourceId: 'sausages', amount: 0.030 },
        { resourceId: 'bread', amount: 0.027 },
        { resourceId: 'soap', amount: 0.012 },
        { resourceId: 'canned_food', amount: 0.0174 },
        { resourceId: 'sewing_machines', amount: 0.0141 },
        { resourceId: 'fur_coats', amount: 0.0141 },
        { resourceId: 'rum', amount: 0.033 },
        { resourceId: 'beer', amount: 0.039 }
      ]
    }
  },
  
  // --- ENGINEERS ---
  "Residence_tier04": { 
    category: 'Residence', 
    residence: { 
      populationType: 'Engineer', 
      maxPopulation: 40,
      consumption: [
        { resourceId: 'canned_food', amount: 0.0232 },
        { resourceId: 'sewing_machines', amount: 0.0188 },
        { resourceId: 'fur_coats', amount: 0.0188 },
        { resourceId: 'glasses', amount: 0.0092 },
        { resourceId: 'coffee', amount: 0.068 },
        { resourceId: 'light_bulbs', amount: 0.014 },
        { resourceId: 'rum', amount: 0.044 },
        { resourceId: 'beer', amount: 0.052 },
        { resourceId: 'bicycles', amount: 0.0092 },
        { resourceId: 'pocket_watches', amount: 0.0092 }
      ]
    }
  },
  
  // --- INVESTORS ---
  "Residence_tier05": { 
    category: 'Residence', 
    residence: { 
      populationType: 'Investor', 
      maxPopulation: 50,
      consumption: [
        { resourceId: 'canned_food', amount: 0.029 },
        { resourceId: 'sewing_machines', amount: 0.0235 },
        { resourceId: 'fur_coats', amount: 0.0235 },
        { resourceId: 'glasses', amount: 0.0115 },
        { resourceId: 'coffee', amount: 0.085 },
        { resourceId: 'light_bulbs', amount: 0.0175 },
        { resourceId: 'champagne', amount: 0.055 },
        { resourceId: 'cigars', amount: 0.02 },
        { resourceId: 'chocolate', amount: 0.02 },
        { resourceId: 'steam_carriages', amount: 0.0115 },
        { resourceId: 'pocket_watches', amount: 0.0115 },
        { resourceId: 'jewelry', amount: 0.0115 },
        { resourceId: 'gramophones', amount: 0.0115 }
      ]
    }
  },
  
  // --- NEW WORLD RESIDENCES ---
  "Residence_New_World": {
    category: 'Residence',
    residence: {
      populationType: 'Jornalero',
      maxPopulation: 10,
      consumption: [
        { resourceId: 'fried_plantains', amount: 0.020 },
        { resourceId: 'ponchos', amount: 0.020 },
        { resourceId: 'rum', amount: 0.024 }
      ]
    }
  },
  
  "Residence_colony01_tier02": {
    category: 'Residence',
    residence: {
      populationType: 'Obrero',
      maxPopulation: 20,
      consumption: [
        { resourceId: 'fried_plantains', amount: 0.020 },
        { resourceId: 'ponchos', amount: 0.020 },
        { resourceId: 'tortillas', amount: 0.014 },
        { resourceId: 'coffee', amount: 0.020 },
        { resourceId: 'bowler_hats', amount: 0.008 },
        { resourceId: 'cigars', amount: 0.008 },
        { resourceId: 'rum', amount: 0.024 }
      ]
    }
  },
  
  "Service_05 (Cabaret)": { name: 'Variety Theatre', category: 'Public', influenceRange: 96 },
  "Service_07 (University)": { category: 'Public', influenceRange: 96 },
  "Institution_03 (Hospital)": { category: 'Public', influenceRange: 26 },
  "Service_09 (Club House)": { category: 'Public', influenceRange: 96 },
  "Service_03 (Bank)": { category: 'Public', influenceRange: 96 },

  // NEW WORLD & OTHERS
  "Agriculture_colony01_11 (Alpaca Farm)": { 
      category: 'Production',
      farmConfig: { moduleType: 'Pasture', moduleCount: 4, moduleSize: { x: 4, y: 3 } }
  },
  "Agriculture_colony01_08 (Banana Farm)": { 
      category: 'Production',
      farmConfig: { moduleType: 'Field', moduleCount: 128, moduleSize: { x: 1, y: 1 } }
  },
  "Agriculture_colony01_07 (Coffee Beans Farm)": { 
      category: 'Production',
      farmConfig: { moduleType: 'Field', moduleCount: 168, moduleSize: { x: 1, y: 1 } }
  },

  // --- ROADS & SPECIALS ---
  "Town hall": { category: 'Public', influenceRadius: 20 },
  "Guild_house": { category: 'Public', influenceRadius: 15 },
  
  // --- ANNO 2205 ---
  "residence tier01 earth": { category: 'Residence', residence: { populationType: 'Workers', maxPopulation: 50 } },
  "public earth 01": { category: 'Public' },
  "production energy earth facility 01 t": { category: 'Production' },

  // --- EXPLICIT MODULE DEFINITIONS ---
  "Module_Field_1x1": {
      name: 'Field', width: 1, height: 1, color: '#789c4a', category: 'Production', id: "Module_Field_1x1"
  },
  "Module_Pasture_3x3": {
      name: 'Pasture', width: 3, height: 3, color: '#a3bd63', category: 'Production', id: "Module_Pasture_3x3"
  },
  "Module_Pasture_3x4": {
      name: 'Pasture', width: 3, height: 4, color: '#a3bd63', category: 'Production', id: "Module_Pasture_3x4"
  },
  "Module_Pasture_4x3": {
      name: 'Pasture', width: 4, height: 3, color: '#a3bd63', category: 'Production', id: "Module_Pasture_4x3"
  },
  "Module_Pasture_4x4": {
      name: 'Pasture', width: 4, height: 4, color: '#a3bd63', category: 'Production', id: "Module_Pasture_4x4"
  },

  // --- AUTO-GENERATED: 121 MISSING PRODUCERS FROM ANNO-1800-CALCULATOR ---
  // Last updated: generated from reference producers.json to ensure full coverage
  // These definitions provide baseline production specs for all reference buildings
  "Oil Power Plant": { name: 'Oil Power Plant', category: 'Production', production: { outputs: [{ resourceId: 'electricity', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: -1 } },
  "Coal Power Plant": { name: 'Coal Power Plant', category: 'Production', production: { outputs: [{ resourceId: 'electricity', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: -1 } },
  "Lumberjack Hut": { name: 'Lumberjack Hut', category: 'Production', production: { outputs: [{ resourceId: 'wood', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Iron Mine": { name: 'Iron Mine', category: 'Production', production: { outputs: [{ resourceId: 'iron', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Coal Mine": { name: 'Coal Mine', category: 'Production', production: { outputs: [{ resourceId: 'coal', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Oil Refinery": { name: 'Oil Refinery', category: 'Production', production: { outputs: [{ resourceId: 'oil', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Oil Well": { name: 'Oil Well', category: 'Production', production: { outputs: [{ resourceId: 'oil', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Clay Harvester": { name: 'Clay Harvester', category: 'Production', production: { outputs: [{ resourceId: 'clay', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Pipe Maker": { name: 'Pipe Maker', category: 'Production', production: { outputs: [{ resourceId: 'claypipes', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Paper Mill": { name: 'Paper Mill', category: 'Production', production: { outputs: [{ resourceId: 'paper', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Luminer": { name: 'Luminer', category: 'Production', production: { outputs: [{ resourceId: 'illuminatedscripts', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Fuel Station": { name: 'Fuel Station', category: 'Production', production: { outputs: [{ resourceId: 'fuel', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Pristine Hunting Cabin": { name: 'Pristine Hunting Cabin', category: 'Production', production: { outputs: [{ resourceId: 'furs', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Wanza Woodcutter": { name: 'Wanza Woodcutter', category: 'Production', production: { outputs: [{ resourceId: 'wanzatimber', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 15 } },
  "Clay Pit": { name: 'Clay Pit', category: 'Production', production: { outputs: [{ resourceId: 'clay', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Sailmakers": { name: 'Sailmakers', category: 'Production', production: { outputs: [{ resourceId: 'sails', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Soap Factory": { name: 'Soap Factory', category: 'Production', production: { outputs: [{ resourceId: 'soap', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Charcoal Kiln": { name: 'Charcoal Kiln', category: 'Production', production: { outputs: [{ resourceId: 'coal', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Malthouse": { name: 'Malthouse', category: 'Production', production: { outputs: [{ resourceId: 'malt', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Sand Mine": { name: 'Sand Mine', category: 'Production', production: { outputs: [{ resourceId: 'quartzsand', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Glassmakers": { name: 'Glassmakers', category: 'Production', production: { outputs: [{ resourceId: 'glass', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Sewing Machine Factory": { name: 'Sewing Machine Factory', category: 'Production', production: { outputs: [{ resourceId: 'sewingmachines', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Sugar Cane Plantation": { name: 'Sugar Cane Plantation', category: 'Production', production: { outputs: [{ resourceId: 'sugarcane', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Rum Distillery": { name: 'Rum Distillery', category: 'Production', production: { outputs: [{ resourceId: 'rum', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Fur Dealer": { name: 'Fur Dealer', category: 'Production', production: { outputs: [{ resourceId: 'furcoats', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Limestone Quarry": { name: 'Limestone Quarry', category: 'Production', production: { outputs: [{ resourceId: 'cement', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Zinc Mine": { name: 'Zinc Mine', category: 'Production', production: { outputs: [{ resourceId: 'zinc', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Copper Mine": { name: 'Copper Mine', category: 'Production', production: { outputs: [{ resourceId: 'copper', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Bicycle Factory": { name: 'Bicycle Factory', category: 'Production', production: { outputs: [{ resourceId: 'pennyfarthingss', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Champagne Cellar": { name: 'Champagne Cellar', category: 'Production', production: { outputs: [{ resourceId: 'champagne', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Jewellers": { name: 'Jewellers', category: 'Production', production: { outputs: [{ resourceId: 'jewelry', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Fish Oil Factory": { name: 'Fish Oil Factory', category: 'Production', production: { outputs: [{ resourceId: 'fishoil', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Plantain Plantation": { name: 'Plantain Plantation', category: 'Production', production: { outputs: [{ resourceId: 'plantains', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Fried Plantain Kitchen": { name: 'Fried Plantain Kitchen', category: 'Production', production: { outputs: [{ resourceId: 'friedplantains', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Cotton Mill": { name: 'Cotton Mill', category: 'Production', production: { outputs: [{ resourceId: 'cottonfabric', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Alpaca Farm": { name: 'Alpaca Farm', category: 'Production', production: { outputs: [{ resourceId: 'alpacawool', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Poncho Darner": { name: 'Poncho Darner', category: 'Production', production: { outputs: [{ resourceId: 'ponchos', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Tortilla Maker": { name: 'Tortilla Maker', category: 'Production', production: { outputs: [{ resourceId: 'tortillas', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Coffee Roaster": { name: 'Coffee Roaster', category: 'Production', production: { outputs: [{ resourceId: 'coffee', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Felt Producer": { name: 'Felt Producer', category: 'Production', production: { outputs: [{ resourceId: 'felt', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Bombin Weaver": { name: 'Bombin Weaver', category: 'Production', production: { outputs: [{ resourceId: 'bowlerhats', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Cigar Factory": { name: 'Cigar Factory', category: 'Production', production: { outputs: [{ resourceId: 'cigars', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Sugar Refinery": { name: 'Sugar Refinery', category: 'Production', production: { outputs: [{ resourceId: 'sugar', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Chocolate Factory": { name: 'Chocolate Factory', category: 'Production', production: { outputs: [{ resourceId: 'chocolate', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Advanced Coffee Roaster": { name: 'Advanced Coffee Roaster', category: 'Production', production: { outputs: [{ resourceId: 'advancedcoffee', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Advanced Rum Distillery": { name: 'Advanced Rum Distillery', category: 'Production', production: { outputs: [{ resourceId: 'advancedrum', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Advanced Cotton Mill": { name: 'Advanced Cotton Mill', category: 'Production', production: { outputs: [{ resourceId: 'advancedcottonfabric', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Seal Hunting Docks": { name: 'Seal Hunting Docks', category: 'Production', production: { outputs: [{ resourceId: 'sealskin', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Tapestry Looms": { name: 'Tapestry Looms', category: 'Production', production: { outputs: [{ resourceId: 'tapestries', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Wat Kitchen": { name: 'Wat Kitchen', category: 'Production', production: { outputs: [{ resourceId: 'seafoodstew', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Oil Storage": { name: 'Oil Storage', category: 'Production', production: { outputs: [{ resourceId: 'oilstorage', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Small Oil Harbour": { name: 'Small Oil Harbour', category: 'Production', production: { outputs: [{ resourceId: 'oilstorage', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Linen Mill": { name: 'Linen Mill', category: 'Production', production: { outputs: [{ resourceId: 'linen', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Salt Works": { name: 'Salt Works', category: 'Production', production: { outputs: [{ resourceId: 'salt', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Dry-House": { name: 'Dry-House', category: 'Production', production: { outputs: [{ resourceId: 'driedmeat', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Ceramics Workshop": { name: 'Ceramics Workshop', category: 'Production', production: { outputs: [{ resourceId: 'ceramics', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Teff Mill": { name: 'Teff Mill', category: 'Production', production: { outputs: [{ resourceId: 'spicedflour', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Apiary": { name: 'Apiary', category: 'Production', production: { outputs: [{ resourceId: 'beeswax', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Chandler": { name: 'Chandler', category: 'Production', production: { outputs: [{ resourceId: 'ornatecandles', amount: 1 }], workforce: { type: 'Farmer', amount: 10 }, cycleTime: 30 } },
  "Telephone Manufacturer": { name: 'Telephone Manufacturer', category: 'Production', production: { outputs: [{ resourceId: 'telephones', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 45 } },
  "Brick Factory": { name: 'Brick Factory', category: 'Production', production: { outputs: [{ resourceId: 'bricks', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Rendering Works": { name: 'Rendering Works', category: 'Production', production: { outputs: [{ resourceId: 'tallow', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Brewery": { name: 'Brewery', category: 'Production', production: { outputs: [{ resourceId: 'beer', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Window Makers": { name: 'Window Makers', category: 'Production', production: { outputs: [{ resourceId: 'windows', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Hunting Cabin": { name: 'Hunting Cabin', category: 'Production', production: { outputs: [{ resourceId: 'furs', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Concrete Factory": { name: 'Concrete Factory', category: 'Production', production: { outputs: [{ resourceId: 'reinforcedconcrete', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Brass Smeltery": { name: 'Brass Smeltery', category: 'Production', production: { outputs: [{ resourceId: 'brass', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Goldsmiths": { name: 'Goldsmiths', category: 'Production', production: { outputs: [{ resourceId: 'gold', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Filament Factory": { name: 'Filament Factory', category: 'Production', production: { outputs: [{ resourceId: 'filament', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Light Bulb Factory": { name: 'Light Bulb Factory', category: 'Production', production: { outputs: [{ resourceId: 'lightbulbs', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Dynamite Factory": { name: 'Dynamite Factory', category: 'Production', production: { outputs: [{ resourceId: 'dynamite', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Marquetry Workshop": { name: 'Marquetry Workshop', category: 'Production', production: { outputs: [{ resourceId: 'woodveneers', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Gramophone Factory": { name: 'Gramophone Factory', category: 'Production', production: { outputs: [{ resourceId: 'gramophones', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Cab Assembly Line": { name: 'Cab Assembly Line', category: 'Production', production: { outputs: [{ resourceId: 'steamcarriages', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Cotton Plantation": { name: 'Cotton Plantation', category: 'Production', production: { outputs: [{ resourceId: 'cotton', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Caoutchouc Plantation": { name: 'Caoutchouc Plantation', category: 'Production', production: { outputs: [{ resourceId: 'caoutchouc', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Corn Farm": { name: 'Corn Farm', category: 'Production', production: { outputs: [{ resourceId: 'corn', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Coffee Plantation": { name: 'Coffee Plantation', category: 'Production', production: { outputs: [{ resourceId: 'coffeebeans', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Cocoa Plantation": { name: 'Cocoa Plantation', category: 'Production', production: { outputs: [{ resourceId: 'cocoa', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Bootmakers": { name: 'Bootmakers', category: 'Production', production: { outputs: [{ resourceId: 'leatherboots', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Tailors Shop": { name: 'Tailors Shop', category: 'Production', production: { outputs: [{ resourceId: 'tailoredsuits', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Whaling Station": { name: 'Whaling Station', category: 'Production', production: { outputs: [{ resourceId: 'whaleoil', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Caribou Hunting Cabin": { name: 'Caribou Hunting Cabin', category: 'Production', production: { outputs: [{ resourceId: 'cariboumeat', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Pemmican Cookhouse": { name: 'Pemmican Cookhouse', category: 'Production', production: { outputs: [{ resourceId: 'pemmican', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Sleeping Bag Factory": { name: 'Sleeping Bag Factory', category: 'Production', production: { outputs: [{ resourceId: 'sleepingbags', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Oil Lamps Factory": { name: 'Oil Lamps Factory', category: 'Production', production: { outputs: [{ resourceId: 'oillamps', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Sled Frame Factory": { name: 'Sled Frame Factory', category: 'Production', production: { outputs: [{ resourceId: 'sleds', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Husky Sled Factory": { name: 'Husky Sled Factory', category: 'Production', production: { outputs: [{ resourceId: 'huskysleds', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Deep Gold Mine": { name: 'Deep Gold Mine', category: 'Production', production: { outputs: [{ resourceId: 'gold', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Goat Farm": { name: 'Goat Farm', category: 'Production', production: { outputs: [{ resourceId: 'goatmilk', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Linseed Farm": { name: 'Linseed Farm', category: 'Production', production: { outputs: [{ resourceId: 'linseed', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Embroiderer": { name: 'Embroiderer', category: 'Production', production: { outputs: [{ resourceId: 'finery', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Sanga Farm": { name: 'Sanga Farm', category: 'Production', production: { outputs: [{ resourceId: 'sangacows', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Hibiscus Farm": { name: 'Hibiscus Farm', category: 'Production', production: { outputs: [{ resourceId: 'hibiscus', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Teff Farm": { name: 'Teff Farm', category: 'Production', production: { outputs: [{ resourceId: 'teff', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Brick Dry-House": { name: 'Brick Dry-House', category: 'Production', production: { outputs: [{ resourceId: 'mudbricks', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Indigo Farm": { name: 'Indigo Farm', category: 'Production', production: { outputs: [{ resourceId: 'indigo', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Spice Farm": { name: 'Spice Farm', category: 'Production', production: { outputs: [{ resourceId: 'spices', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Lobster Fishery": { name: 'Lobster Fishery', category: 'Production', production: { outputs: [{ resourceId: 'lobsters', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Lanternsmith": { name: 'Lanternsmith', category: 'Production', production: { outputs: [{ resourceId: 'lanterns', amount: 1 }], workforce: { type: 'Worker', amount: 10 }, cycleTime: 60 } },
  "Weapon Factory": { name: 'Weapon Factory', category: 'Production', production: { outputs: [{ resourceId: 'weapons', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Hop Farm": { name: 'Hop Farm', category: 'Production', production: { outputs: [{ resourceId: 'hop', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Cannery": { name: 'Cannery', category: 'Production', production: { outputs: [{ resourceId: 'cannedfood', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Spectacle Factory": { name: 'Spectacle Factory', category: 'Production', production: { outputs: [{ resourceId: 'glasses', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Motor Assembly Line": { name: 'Motor Assembly Line', category: 'Production', production: { outputs: [{ resourceId: 'steammotors', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Clockmakers": { name: 'Clockmakers', category: 'Production', production: { outputs: [{ resourceId: 'pocketwatches', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Pearl Farm": { name: 'Pearl Farm', category: 'Production', production: { outputs: [{ resourceId: 'pearls', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Tea Spicer": { name: 'Tea Spicer', category: 'Production', production: { outputs: [{ resourceId: 'hibiscustea', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Bear Hunting Cabin": { name: 'Bear Hunting Cabin', category: 'Production', production: { outputs: [{ resourceId: 'bearfurs', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Parka Factory": { name: 'Parka Factory', category: 'Production', production: { outputs: [{ resourceId: 'parkas', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 90 } },
  "Cattle Farm": { name: 'Cattle Farm', category: 'Production', production: { outputs: [{ resourceId: 'beef', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Red Pepper Farm": { name: 'Red Pepper Farm', category: 'Production', production: { outputs: [{ resourceId: 'redpeppers', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Artisanal Kitchen": { name: 'Artisanal Kitchen', category: 'Production', production: { outputs: [{ resourceId: 'goulash', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Saltpeter Works": { name: 'Saltpeter Works', category: 'Production', production: { outputs: [{ resourceId: 'saltpeter', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Heavy Weapons Factory": { name: 'Heavy Weapons Factory', category: 'Production', production: { outputs: [{ resourceId: 'advancedweapons', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Vineyard": { name: 'Vineyard', category: 'Production', production: { outputs: [{ resourceId: 'grapes', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Coachmakers": { name: 'Coachmakers', category: 'Production', production: { outputs: [{ resourceId: 'chassis', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Tobacco Plantation": { name: 'Tobacco Plantation', category: 'Production', production: { outputs: [{ resourceId: 'tobacco', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Goose Farm": { name: 'Goose Farm', category: 'Production', production: { outputs: [{ resourceId: 'goosefeathers', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Husky Farm": { name: 'Husky Farm', category: 'Production', production: { outputs: [{ resourceId: 'huskies', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 120 } },
  "Gold Mine": { name: 'Gold Mine', category: 'Production', production: { outputs: [{ resourceId: 'goldore', amount: 1 }], workforce: { type: 'Engineer', amount: 10 }, cycleTime: 150 } },

  // --- NON-RAW PUBLIC/INFRASTRUCTURE/RESIDENCE (names only for audit/lookup) ---
  "Harbor_03 (Steam Shipyard)": { name: 'Steam Shipyard', category: 'Public' },
  "Harbor_01 (Depot)": { name: 'Depot', category: 'Public' },
  "Harbor_04 (Tower 01, Puckle Gun)": { name: 'Mounted Guns', category: 'Public' },
  "Harbor_05 (Tower 02, Cannon Tower)": { name: 'Cannon Tower', category: 'Public' },
  "Harbor_07 (Repair Crane)": { name: 'Repair Crane', category: 'Public' },
  "Harbor_08 (Pier)": { name: 'Pier', category: 'Public' },
  "Harbor_09 (tourism_pier_01)": { name: 'Public Mooring', category: 'Public' },
  "Service_colony01_03 (Boxing Arena)": { name: 'Boxing Arena', category: 'Public' },
  "Service_moderate_LoL_01 (Radio Station)": { name: 'Radio Tower', category: 'Public' },
  "Institution_arctic_01 (Ranger Station)": { name: 'Ranger Station', category: 'Public' },
  "River_colony02_03 (Water Pump)": { name: 'Water Pump', category: 'Public' },
  "Service_colony02_03 (Monastery)": { name: 'Monastery', category: 'Public' },
  "Residence_Arctic_World": { name: 'Explorer Shelter', category: 'Residence' },
  "Residence_arctic_tier02": { name: 'Technician Shelter', category: 'Residence' },
  "Street_Dirt": { name: 'Dirt Road', category: 'Decoration' },
  "Street_Paved": { name: 'Paved Street', category: 'Decoration' },
  "Street_Desert": { name: 'Desert Road', category: 'Decoration' },
  "Small Warehouse": { name: 'Small Warehouse', category: 'Public' },
  "Worlds_Fair_Foundations": { name: "World's Fair: Foundations", category: 'Public' },
  "Research_Institute_Foundations": { name: 'Research Institute: Foundations', category: 'Public' },
  "Heater_Arctic": { name: 'Heater', category: 'Public' },
  "Post_Office": { name: 'Post Office', category: 'Public' },
  "Musicians_Court": { name: 'Musicians Court', category: 'Public' },
  "Shepherd_Residence": { name: 'Shepherd Residence', category: 'Residence' },
  "Generic_Residence": { name: 'Residence', category: 'Residence' },
  "Tier_Farmers": { name: 'Farmers', category: 'Residence' },
  "Tier_Workers": { name: 'Workers', category: 'Residence' },
  "Tier_Artisans": { name: 'Artisans', category: 'Residence' },
  "Tier_Engineers": { name: 'Engineers', category: 'Residence' },
  "Tier_Investors": { name: 'Investors', category: 'Residence' },
  "Tier_Scholars": { name: 'Scholars', category: 'Residence' },
  "Tier_Jornaleros": { name: 'Jornaleros', category: 'Residence' },
  "Tier_Obreros": { name: 'Obreros', category: 'Residence' },
  "Tier_Explorers": { name: 'Explorers', category: 'Residence' },
  "Tier_Technicians": { name: 'Technicians', category: 'Residence' },
  "Tier_Shepherds": { name: 'Shepherds', category: 'Residence' },
  "Tier_Elders": { name: 'Elders', category: 'Residence' },
};

// Non-raw Anno 1800 infrastructure/public/residence entries (sourced from presets.json)
const EXTRA_1800_NONRAW: BuildingDefinition[] = [
  { id: 'Service_05 (Cabaret)', name: 'Variety Theatre', width: 4, height: 5, color: '#DEB887', category: 'Public', influenceRange: 40 },
  { id: 'Harbor_03 (Steam Shipyard)', name: 'Steam Shipyard', width: 17, height: 7, color: '#FFDAB9', category: 'Public' },
  { id: 'Harbor_01 (Depot)', name: 'Depot', width: 10, height: 4, color: '#FFDAB9', category: 'Public' },
  { id: 'Harbor_04 (Tower 01, Puckle Gun)', name: 'Mounted Guns', width: 4, height: 4, color: '#FFDAB9', category: 'Public' },
  { id: 'Harbor_05 (Tower 02, Cannon Tower)', name: 'Cannon Tower', width: 4, height: 4, color: '#FFDAB9', category: 'Public' },
  { id: 'Harbor_07 (Repair Crane)', name: 'Repair Crane', width: 5, height: 5, color: '#FFDAB9', category: 'Public', influenceRadius: 20 },
  { id: 'Harbor_08 (Pier)', name: 'Pier', width: 6, height: 7, color: '#FFDAB9', category: 'Public' },
  { id: 'Harbor_09 (tourism_pier_01)', name: 'Public Mooring', width: 25, height: 8, color: '#FFDAB9', category: 'Public' },
  { id: 'Service_colony01_03 (Boxing Arena)', name: 'Boxing Arena', width: 6, height: 5, color: '#FFDAB9', category: 'Public', influenceRange: 30 },
  { id: 'Service_moderate_LoL_01 (Radio Station)', name: 'Radio Tower', width: 5, height: 5, color: '#FFDAB9', category: 'Public', influenceRange: 25 },
  { id: 'Institution_arctic_01 (Ranger Station)', name: 'Ranger Station', width: 4, height: 4, color: '#FFDAB9', category: 'Public' },
  { id: 'River_colony02_03 (Water Pump)', name: 'Water Pump', width: 5, height: 4, color: '#FFDAB9', category: 'Public' },
  { id: 'Service_colony02_03 (Monastery)', name: 'Monastery', width: 7, height: 6, color: '#FFDAB9', category: 'Public', influenceRange: 30 },
  { id: 'Residence_Arctic_World', name: 'Explorer Shelter', width: 3, height: 3, color: '#85B9FF', category: 'Residence', residence: { populationType: 'Explorer', maxPopulation: 10 } },
  { id: 'Residence_arctic_tier02', name: 'Technician Shelter', width: 3, height: 3, color: '#0096FF', category: 'Residence', residence: { populationType: 'Technician', maxPopulation: 10 } },
  { id: 'Street_Dirt', name: 'Dirt Road', width: 1, height: 1, color: '#9CA3AF', category: 'Decoration' },
  { id: 'Street_Paved', name: 'Paved Street', width: 1, height: 1, color: '#9CA3AF', category: 'Decoration' },
  { id: 'Street_Desert', name: 'Desert Road', width: 1, height: 1, color: '#D6B370', category: 'Decoration' },
  { id: 'Small Warehouse', name: 'Small Warehouse', width: 4, height: 4, color: '#FFDAB9', category: 'Public' },
  { id: 'Worlds_Fair_Foundations', name: "World's Fair: Foundations", width: 10, height: 10, color: '#FFDAB9', category: 'Public' },
  { id: 'Research_Institute_Foundations', name: 'Research Institute: Foundations', width: 10, height: 10, color: '#FFDAB9', category: 'Public' },
  { id: 'Heater_Arctic', name: 'Heater', width: 3, height: 3, color: '#FFDAB9', category: 'Public' },
  { id: 'Post_Office', name: 'Post Office', width: 5, height: 5, color: '#FFDAB9', category: 'Public' },
  { id: 'Musicians_Court', name: 'Musicians Court', width: 6, height: 6, color: '#FFDAB9', category: 'Public' },
  { id: 'Shepherd_Residence', name: 'Shepherd Residence', width: 3, height: 3, color: '#FFE885', category: 'Residence', residence: { populationType: 'Shepherd', maxPopulation: 10 } },
  { id: 'Generic_Residence', name: 'Residence', width: 3, height: 3, color: '#22c55e', category: 'Residence', residence: { populationType: 'Generic', maxPopulation: 10 } },
  { id: 'Tier_Farmers', name: 'Farmers', width: 1, height: 1, color: '#A1EAEA', category: 'Residence', residence: { populationType: 'Farmer', maxPopulation: 1 } },
  { id: 'Tier_Workers', name: 'Workers', width: 1, height: 1, color: '#69C4C4', category: 'Residence', residence: { populationType: 'Worker', maxPopulation: 1 } },
  { id: 'Tier_Artisans', name: 'Artisans', width: 1, height: 1, color: '#44A6A6', category: 'Residence', residence: { populationType: 'Artisan', maxPopulation: 1 } },
  { id: 'Tier_Engineers', name: 'Engineers', width: 1, height: 1, color: '#008080', category: 'Residence', residence: { populationType: 'Engineer', maxPopulation: 1 } },
  { id: 'Tier_Investors', name: 'Investors', width: 1, height: 1, color: '#035E5E', category: 'Residence', residence: { populationType: 'Investor', maxPopulation: 1 } },
  { id: 'Tier_Scholars', name: 'Scholars', width: 1, height: 1, color: '#2F4F4F', category: 'Residence', residence: { populationType: 'Scholar', maxPopulation: 1 } },
  { id: 'Tier_Jornaleros', name: 'Jornaleros', width: 1, height: 1, color: '#FF9A67', category: 'Residence', residence: { populationType: 'Jornalero', maxPopulation: 1 } },
  { id: 'Tier_Obreros', name: 'Obreros', width: 1, height: 1, color: '#FF6517', category: 'Residence', residence: { populationType: 'Obrero', maxPopulation: 1 } },
  { id: 'Tier_Explorers', name: 'Explorers', width: 1, height: 1, color: '#85B9FF', category: 'Residence', residence: { populationType: 'Explorer', maxPopulation: 1 } },
  { id: 'Tier_Technicians', name: 'Technicians', width: 1, height: 1, color: '#0096FF', category: 'Residence', residence: { populationType: 'Technician', maxPopulation: 1 } },
  { id: 'Tier_Shepherds', name: 'Shepherds', width: 1, height: 1, color: '#FFE885', category: 'Residence', residence: { populationType: 'Shepherd', maxPopulation: 1 } },
  { id: 'Tier_Elders', name: 'Elders', width: 1, height: 1, color: '#FFD106', category: 'Residence', residence: { populationType: 'Elder', maxPopulation: 1 } }
];

// --- DATA PROCESSING HELPER ---

const determineCategory = (b: RawBuilding): BuildingDefinition['category'] => {
  if (b.Template.includes('Residence')) return 'Residence';
  if (b.Template.includes('Factory') || b.Template.includes('Farm') || b.Group?.includes('Production')) return 'Production';
  if (b.Template.includes('Public') || b.Template.includes('Institution') || b.Group?.includes('Public')) return 'Public';
  if (b.Template.includes('Ornament') || b.Group?.includes('Ornament') || b.Group?.includes('Decorations')) return 'Decoration';
  if (b.Identifier.toLowerCase().includes('road') || b.Identifier.toLowerCase().includes('street')) return 'Decoration';
  return 'Public'; // Default fallback
};

const determineColor = (b: RawBuilding, category: string): string => {
  // 1. Check Exact ID Match
  if (PRESET_COLOR_MAP[b.Identifier]) return PRESET_COLOR_MAP[b.Identifier];
  // 2. Fuzzy Match
  for (const [key, color] of Object.entries(PRESET_COLOR_MAP)) {
      if (b.Localization.eng?.includes(key) || b.Identifier.includes(key)) return color;
  }

  // 3. Fallbacks
  if (category === 'Residence') {
    if (b.Identifier.includes('tier01')) return PRESET_COLOR_MAP["Residence_Old_World"];
    if (b.Identifier.includes('tier02')) return PRESET_COLOR_MAP["Residence_tier02"];
    if (b.Identifier.includes('tier03')) return PRESET_COLOR_MAP["Residence_tier03"];
    return "#22c55e";
  }
  if (category === 'Public') return '#FFDAB9'; 
  if (category === 'Production') return '#A16207';
  if (category === 'Decoration') return '#EC4899';
  return '#64748B'; 
};

const mapRawToDefinition = (raw: RawBuilding): BuildingDefinition => {
  const overrides = GAME_LOGIC_OVERRIDES[raw.Identifier] || {};
  const category = overrides.category || determineCategory(raw);
  const iconPath = raw.IconFileName ? `${import.meta.env.BASE_URL}icons/${raw.IconFileName}` : undefined;

  return {
    id: raw.Identifier,
    name: raw.Localization.eng || raw.Identifier,
    width: raw.BuildBlocker ? raw.BuildBlocker.x : 1,
    height: raw.BuildBlocker ? raw.BuildBlocker.z : 1,
    color: determineColor(raw, category),
    icon: iconPath,
    category: category,
    influenceRadius: overrides.influenceRadius !== undefined ? overrides.influenceRadius : (raw.InfluenceRadius > 0 ? raw.InfluenceRadius : undefined),
    influenceRange: overrides.influenceRange, 
    ...overrides
  };
};

// Build a richer Anno 1800 building catalog by merging raw definitions with
// generated production/residence/service data and backfilling icons.
const buildAnno1800Buildings = (): BuildingDefinition[] => {
  const rawAndExtras: BuildingDefinition[] = [
    ...RAW_BUILDINGS
      .filter(b => b.Header.includes('1800') || b.Identifier === 'Street_1x1' || b.Identifier.includes('Warehouse'))
      .map(mapRawToDefinition),
    // Modules that are only present as overrides
    ...(Object.entries(GAME_LOGIC_OVERRIDES)
      .filter(([id]) => id.startsWith('Module_'))
      .map(([id, def]) => ({ id, ...def } as BuildingDefinition))),
    // Non-raw infrastructure/public/residence entries
    ...EXTRA_1800_NONRAW
  ];

  // Fill gaps with generated data (production/residence/service). We only add
  // entries that are missing to preserve richer logic from the raw set.
  const mergedById = new Map<string, BuildingDefinition>();
  rawAndExtras.forEach(def => mergedById.set(def.id, def));
  loadBuildingDefinitions().forEach(def => {
    if (!mergedById.has(def.id)) {
      mergedById.set(def.id, def);
    }
  });

  const resolveIcon = (def: BuildingDefinition): string | undefined => {
    // If an icon already points to /icons/ or an absolute URL, keep it.
    if (def.icon && (def.icon.includes('/icons/') || def.icon.startsWith('http'))) {
      return def.icon;
    }
    // If the icon is a bare filename, prefix with the public base URL.
    if (def.icon) {
      return getIconSrc(def.icon, import.meta.env.BASE_URL);
    }
    // Otherwise, try resolving via the central icon resolver.
    const fromResolver = getBuildingIcon(def.name) || getBuildingIcon(def.id);
    return fromResolver ? getIconSrc(fromResolver, import.meta.env.BASE_URL) : undefined;
  };

  return Array.from(mergedById.values()).map(def => ({ ...def, icon: resolveIcon(def) }));
};

// --- RAW DATA LOADER ---
const RAW_BUILDINGS: RawBuilding[] = [
  // --- ANNO 1800 RESIDENCES ---
  {Header:"(A7) Anno 1800",Faction:"Residences",Group:"(1) Old World",Identifier:"Residence_Old_World",IconFileName:"A7_resident.png",BuildBlocker:{x:3,z:3},Template:"DefColDef",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010343,Localization:{eng:"(1) Farmer Residence"}},
  {Header:"(A7) Anno 1800",Faction:"Residences",Group:"(1) Old World",Identifier:"Residence_tier02",IconFileName:"A7_resident.png",BuildBlocker:{x:3,z:3},Template:"DefColDef",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010344,Localization:{eng:"(2) Worker Residence"}},
  {Header:"(A7) Anno 1800",Faction:"Residences",Group:"(1) Old World",Identifier:"Residence_tier03",IconFileName:"A7_resident.png",BuildBlocker:{x:3,z:3},Template:"DefColDef",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010345,Localization:{eng:"(3) Artisan Residence"}},
  {Header:"(A7) Anno 1800",Faction:"Residences",Group:"(1) Old World",Identifier:"Residence_tier04",IconFileName:"A7_resident.png",BuildBlocker:{x:3,z:3},Template:"DefColDef",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010346,Localization:{eng:"(4) Engineer Residence"}},
  {Header:"(A7) Anno 1800",Faction:"Residences",Group:"(1) Old World",Identifier:"Residence_tier05",IconFileName:"A7_resident.png",BuildBlocker:{x:3,z:3},Template:"DefColDef",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010347,Localization:{eng:"(5) Investor Residence"}},
  {Header:"(A7) Anno 1800",Faction:"Residences",Group:"(2) New World",Identifier:"Residence_New_World",IconFileName:"A7_resident.png",BuildBlocker:{x:3,z:3},Template:"DefColDef",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:101254,Localization:{eng:"(1) Jornalero Residence"}},
  {Header:"(A7) Anno 1800",Faction:"Residences",Group:"(2) New World",Identifier:"Residence_colony01_tier02",IconFileName:"A7_resident.png",BuildBlocker:{x:3,z:3},Template:"DefColDef",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:101255,Localization:{eng:"(2) Obrero Residence"}},

  // --- ANNO 1800 PUBLIC ---
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Public Buildings",Identifier:"Logistic_01 (Marketplace)",IconFileName:"A7_market.png",BuildBlocker:{x:5,z:6},Template:"Market",InfluenceRange:35.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010372,Localization:{eng:"Marketplace"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Public Buildings",Identifier:"Service_01 (Pub)",IconFileName:"A7_Pub.png",BuildBlocker:{x:6,z:4},Template:"PublicServiceBuilding",InfluenceRange:30.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010358,Localization:{eng:"Pub"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Public Buildings",Identifier:"Service_02 (School)",IconFileName:"A7_School.png",BuildBlocker:{x:5,z:6},Template:"PublicServiceBuilding",InfluenceRange:35.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010360,Localization:{eng:"School"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Public Buildings",Identifier:"Service_04 (Church)",IconFileName:"A7_Church.png",BuildBlocker:{x:8,z:6},Template:"PublicServiceBuilding",InfluenceRange:40.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010359,Localization:{eng:"Church"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Public Buildings",Identifier:"Institution_02 (Fire Department)",IconFileName:"A7_fire_house.png",BuildBlocker:{x:5,z:3},Template:"CityInstitutionBuilding",InfluenceRange:26.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010463,Localization:{eng:"Fire Station"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Public Buildings",Identifier:"Institution_01 (Police)",IconFileName:"A7_police.png",BuildBlocker:{x:4,z:6},Template:"CityInstitutionBuilding",InfluenceRange:26.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010462,Localization:{eng:"Police Station"}},
  {Header:"(A7) Anno 1800",Faction:"(03) Artisans",Group:"Public Buildings",Identifier:"Institution_03 (Hospital)",IconFileName:"A7_Hospital.png",BuildBlocker:{x:6,z:6},Template:"CityInstitutionBuilding",InfluenceRange:26.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010464,Localization:{eng:"Hospital"}},
  {Header:"(A7) Anno 1800",Faction:"(03) Artisans",Group:"Public Buildings",Identifier:"Service_07 (University)",IconFileName:"A7_University.png",BuildBlocker:{x:9,z:6},Template:"PublicServiceBuilding",InfluenceRange:45.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010362,Localization:{eng:"University"}},
  {Header:"(A7) Anno 1800",Faction:"(04) Engineers",Group:"Public Buildings",Identifier:"Service_03 (Bank)",IconFileName:"A7_Bank.png",BuildBlocker:{x:12,z:10},Template:"PublicServiceBuilding",InfluenceRange:45.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010365,Localization:{eng:"Bank"}},
  {Header:"(A7) Anno 1800",Faction:"(05) Investors",Group:"Public Buildings",Identifier:"Service_09 (Club House)",IconFileName:"A7_club_house.png",BuildBlocker:{x:6,z:6},Template:"PublicServiceBuilding",InfluenceRange:35.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010364,Localization:{eng:"Members Club"}},
  {Header:"(A7) Anno 1800",Faction:"All Worlds",Group:"Special Buildings",Identifier:"Town hall",IconFileName:"A7_townhall.png",BuildBlocker:{x:4,z:4},Template:"Guildhouse",InfluenceRange:0.0,InfluenceRadius:20.0,Road:false,Borderless:false,Guid:100415,Localization:{eng:"Town Hall"}},
  {Header:"(A7) Anno 1800",Faction:"All Worlds",Group:"Special Buildings",Identifier:"Guild_house",IconFileName:"A7_guildhouse.png",BuildBlocker:{x:4,z:4},Template:"Guildhouse",InfluenceRange:0.0,InfluenceRadius:15.0,Road:false,Borderless:false,Guid:1010516,Localization:{eng:"Trade Union"}},

  // --- ANNO 1800 PRODUCTION ---
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Farm Buildings",Identifier:"Agriculture_01 (Grain Farm)",IconFileName:"A7_cereals_2.png",BuildBlocker:{x:4,z:3},Template:"FarmBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010262,Localization:{eng:"Grain Farm - (144)"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Farm Buildings",Identifier:"Agriculture_04 (Potato Farm)",IconFileName:"A7_Potatoes.png",BuildBlocker:{x:3,z:3},Template:"FarmBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010265,Localization:{eng:"Potato Farm - (72)"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Agriculture_05 (Timber Yard)",IconFileName:"A7_wood_log.png",BuildBlocker:{x:4,z:4},Template:"FreeAreaBuilding",InfluenceRange:0.0,InfluenceRadius:9.0,Road:false,Borderless:false,Guid:1010266,Localization:{eng:"Lumberjack's Hut"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Factory_03 (Timber Factory)",IconFileName:"A7_wooden_planks.png",BuildBlocker:{x:4,z:3},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:100451,Localization:{eng:"Sawmill"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Farm Buildings",Identifier:"Agriculture_06 (Sheep Farm)",IconFileName:"A7_Wool.png",BuildBlocker:{x:3,z:3},Template:"FarmBuilding",InfluenceRange:0.0,InfluenceRadius:7.0,Road:false,Borderless:false,Guid:1010267,Localization:{eng:"Sheep Farm - (3)"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Processing_04 (Weavery)",IconFileName:"A7_working_cloth.png",BuildBlocker:{x:4,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010315,Localization:{eng:"Framework Knitters"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Food_06 (Schnapps Maker)",IconFileName:"A7_schnapps_4.png",BuildBlocker:{x:3,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010294,Localization:{eng:"Schnapps Distillery"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Factory_04 (Brick Factory)",IconFileName:"A7_Bricks.png",BuildBlocker:{x:5,z:5},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010283,Localization:{eng:"Brick Factory"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Heavy_02 (Steel Heavy Industry)",IconFileName:"A7_Steel.png",BuildBlocker:{x:7,z:4},Template:"HeavyFactoryBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010297,Localization:{eng:"Furnace"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Heavy_01 (Beams Heavy Industry)",IconFileName:"A7_beams.png",BuildBlocker:{x:10,z:5},Template:"HeavyFactoryBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010296,Localization:{eng:"Steelworks"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Processing_02 (Flour Processing)",IconFileName:"A7_Flour.png",BuildBlocker:{x:3,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010269,Localization:{eng:"Flour Mill"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Food_01 (Bread Maker)",IconFileName:"A7_Bread.png",BuildBlocker:{x:3,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010291,Localization:{eng:"Bakery"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Factory_02 (Soap Factory)",IconFileName:"A7_soap_2.png",BuildBlocker:{x:4,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010304,Localization:{eng:"Soap Factory"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Farm Buildings",Identifier:"Agriculture_08 (Pig Farm)",IconFileName:"A7_Pigs.png",BuildBlocker:{x:3,z:4},Template:"FarmBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010275,Localization:{eng:"Pig Farm - (5)"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Food_07 (Sausage Maker)",IconFileName:"A7_meat_sausage.png",BuildBlocker:{x:3,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010293,Localization:{eng:"Slaughterhouse"}},

  // --- ANNO 1800 ROADS & ORNAMENTS ---
  {Header:"- Road Presets",Faction:"Roads (x3)",Group:null,Identifier:"Street_1x1",IconFileName:null,BuildBlocker:{x:1,z:1},Template:"Road",InfluenceRange:0.0,InfluenceRadius:0.0,Road:true,Borderless:true,Guid:0,Localization:{eng:"Road"}},
  {Header:"(A7) Anno 1800",Faction:"Ornaments",Group:"03 Park Vegetation",Identifier:"Park_1x1_grass",IconFileName:"A7_park_props_1x1_01.png",BuildBlocker:{x:1,z:1},Template:"OrnamentalBuilding_Park",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:102083,Localization:{eng:"Grass"}},
  {Header:"(A7) Anno 1800",Faction:"Ornaments",Group:"01 Park Paths",Identifier:"Park_1x1_path",IconFileName:"A7_park_props_1x1_27.png",BuildBlocker:{x:1,z:1},Template:"OrnamentalBuilding_Park",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:102099,Localization:{eng:"Path"}},
  {Header:"(A7) Anno 1800",Faction:"All Worlds",Group:"Special Buildings",Identifier:"Logistic_02 (Warehouse I)",IconFileName:"A7_Warehouse.png",BuildBlocker:{x:5,z:5},Template:"Warehouse",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010372,Localization:{eng:"Warehouse I"}},

  // --- ANNO 1404 ---
  {Header:"(A4) Anno 1404",Faction:"PlayerBuildings",Group:"Residence",Identifier:"PeasantHouse",IconFileName:"A4_icon_116_132.png",BuildBlocker:{x:3,z:3},Template:"ResidenceBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"Peasant house"}},
  {Header:"(A4) Anno 1404",Faction:"PlayerBuildings",Group:"Residence",Identifier:"CitizenHouse",IconFileName:"A4_icon_116_133.png",BuildBlocker:{x:3,z:3},Template:"ResidenceBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"Citizen house"}},
  {Header:"(A4) Anno 1404",Faction:"Public",Group:"Demand",Identifier:"Marketplace",IconFileName:"A4_icon_116_140.png",BuildBlocker:{x:6,z:5},Template:"PublicBuilding",InfluenceRange:0.0,InfluenceRadius:20.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"Marketplace"}},
  {Header:"(A4) Anno 1404",Faction:"Public",Group:"Demand",Identifier:"Chapel",IconFileName:"A4_icon_116_142.png",BuildBlocker:{x:5,z:3},Template:"PublicBuilding",InfluenceRange:0.0,InfluenceRadius:16.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"Chapel"}},

  // --- ANNO 2070 ---
  {Header:"(A5) Anno 2070",Faction:"(2) Tycoons",Group:"Residence",Identifier:"tycoon_worker_residence",IconFileName:"icon_27_71.png",BuildBlocker:{x:3,z:3},Template:"ResidenceBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"(1) Worker Barracks"}},
  {Header:"(A5) Anno 2070",Faction:"(1) Ecos",Group:"Residence",Identifier:"ecos_pioneer_residence",IconFileName:"icon_27_70.png",BuildBlocker:{x:3,z:3},Template:"ResidenceBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"(1) Worker Barracks"}},
  {Header:"(A5) Anno 2070",Faction:"(2) Tycoons",Group:"Public",Identifier:"town_center_tycoons",IconFileName:"icon_27_216.png",BuildBlocker:{x:8,z:6},Template:"PublicBuilding",InfluenceRange:0.0,InfluenceRadius:25.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"City Center"}},

  // --- ANNO 2205 ---
  {Header:"(A6) Anno 2205",Faction:"(1) Earth",Group:"Residence",Identifier:"residence tier01 earth",IconFileName:"A6_residence_earth.png",BuildBlocker:{x:3,z:3},Template:"ResidenceBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"(1) Workers (3x3)"}},
  {Header:"(A6) Anno 2205",Faction:"(1) Earth",Group:"Public",Identifier:"public earth 01",IconFileName:"A6_information.png",BuildBlocker:{x:7,z:7},Template:"StorageBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"Infodrome"}},
  {Header:"(A6) Anno 2205",Faction:"(1) Earth",Group:"Energy",Identifier:"production energy earth facility 01 t",IconFileName:"A6_windpark.png",BuildBlocker:{x:8,z:4},Template:"EnergyBuilding",InfluenceRange:0.0,InfluenceRadius:15.0,Road:false,Borderless:false,Guid:0,Localization:{eng:"Windpark"}},
];

// --- RESOURCES ---
const resources1800: Record<string, {name: string, icon?: string}> = {
  wood: { name: 'Wood' },
  timber: { name: 'Timber' },
  wool: { name: 'Wool' },
  work_clothes: { name: 'Work Clothes' },
  potatoes: { name: 'Potatoes' },
  schnapps: { name: 'Schnapps' },
  grain: { name: 'Grain' },
  flour: { name: 'Flour' },
  bread: { name: 'Bread' },
  pigs: { name: 'Pigs' },
  sausages: { name: 'Sausages' },
  fish: { name: 'Fish' },
  bricks: { name: 'Bricks' },
  steel: { name: 'Steel' },
  steel_beams: { name: 'Steel Beams' }
};

// --- CONFIG EXPORT ---
export const ANNO_GAMES: Record<AnnoTitle, GameConfig> = {
  [AnnoTitle.ANNO_1800]: {
    title: AnnoTitle.ANNO_1800,
    gridColor: '#333',
    backgroundColor: '#1f2937',
    buildings: buildAnno1800Buildings(),
    resources: resources1800
  },
  [AnnoTitle.ANNO_1404]: {
    title: AnnoTitle.ANNO_1404,
    gridColor: '#444',
    backgroundColor: '#373026',
    buildings: RAW_BUILDINGS.filter(b => b.Header.includes('1404') || b.Identifier === 'Street_1x1').map(mapRawToDefinition)
  },
  [AnnoTitle.ANNO_2070]: {
    title: AnnoTitle.ANNO_2070,
    gridColor: '#004444',
    backgroundColor: '#0f172a',
    buildings: RAW_BUILDINGS.filter(b => b.Header.includes('2070') || b.Identifier === 'Street_1x1').map(mapRawToDefinition)
  },
  [AnnoTitle.ANNO_2205]: {
    title: AnnoTitle.ANNO_2205,
    gridColor: '#003366',
    backgroundColor: '#001122',
    buildings: RAW_BUILDINGS.filter(b => b.Header.includes('2205') || b.Identifier === 'Street_1x1').map(mapRawToDefinition)
  },
  [AnnoTitle.ANNO_117]: {
    title: AnnoTitle.ANNO_117,
    gridColor: '#44403c',
    backgroundColor: '#292524',
    buildings: ANNO_117_BUILDINGS_RAW.map(mapRawToDefinition)
  }
};
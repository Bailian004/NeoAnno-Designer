import { AnnoTitle, GameConfig, BuildingDefinition, ResourceRate } from "../types";

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

// --- COLOR PRESETS (Restored from Anno Designer) ---
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
  "StoreHouse": "#8FBC8F", "Warehouse01": "#8FBC8F", "Logistic_02 (Warehouse I)": "#8FBC8F",

  // --- Residences (Teals & Blues) ---
  "PeasantHouse": "#A1EAEA", "Residence_Old_World": "#A1EAEA",
  "CitizenHouse": "#69C4C4", "Residence_tier02": "#69C4C4",
  "PatricianHouse": "#44A6A6", "Residence_tier03": "#44A6A6",
  "NoblemanHouse": "#008080", "Residence_tier04": "#008080",
  "Residence_tier05": "#035E5E",
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
};

// --- LOGIC INJECTION MAP ---
const GAME_LOGIC_OVERRIDES: Record<string, Partial<BuildingDefinition>> = {
  // --- ANNO 1800: FARMERS ---
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
  "Logistic_01 (Marketplace)": { category: 'Public', influenceRadius: 35 },
  "Service_01 (Pub)": { category: 'Public', influenceRadius: 30 },
  "Agriculture_01 (Grain Farm)": {
    category: 'Production',
    production: { outputs: [{ resourceId: 'grain', amount: 1 }], workforce: { type: 'Farmer', amount: 20 } }
  },
  "Agriculture_04 (Potato Farm)": {
    category: 'Production',
    production: { outputs: [{ resourceId: 'potatoes', amount: 2 }], workforce: { type: 'Farmer', amount: 20 } }
  },
  "Agriculture_06 (Sheep Farm)": {
    category: 'Production',
    production: { outputs: [{ resourceId: 'wool', amount: 2 }], workforce: { type: 'Farmer', amount: 10 } }
  },
  "Agriculture_05 (Timber Yard)": {
    category: 'Production',
    production: { outputs: [{ resourceId: 'wood', amount: 4 }], workforce: { type: 'Farmer', amount: 5 } }
  },
  "Factory_03 (Timber Factory)": {
    category: 'Production',
    production: { inputs: [{ resourceId: 'wood', amount: 4 }], outputs: [{ resourceId: 'timber', amount: 4 }], workforce: { type: 'Farmer', amount: 10 } }
  },
  "Coastal_01 (Fish Coast Building)": {
    category: 'Production',
    production: { outputs: [{ resourceId: 'fish', amount: 2 }], workforce: { type: 'Farmer', amount: 25 } }
  },
  "Processing_04 (Weavery)": {
    category: 'Production',
    production: { inputs: [{ resourceId: 'wool', amount: 2 }], outputs: [{ resourceId: 'work_clothes', amount: 2 }], workforce: { type: 'Farmer', amount: 50 } }
  },
  "Food_06 (Schnapps Maker)": {
    category: 'Production',
    impactType: 'Negative', impactRadius: 10,
    production: { inputs: [{ resourceId: 'potatoes', amount: 2 }], outputs: [{ resourceId: 'schnapps', amount: 2 }], workforce: { type: 'Farmer', amount: 50 } }
  },

  // --- ANNO 1800: WORKERS ---
  "Residence_tier02": {
    category: 'Residence',
    residence: {
      populationType: 'Worker', maxPopulation: 20,
      consumption: [
        { resourceId: 'fish', amount: 0.1 }, { resourceId: 'work_clothes', amount: 0.123 }, { resourceId: 'schnapps', amount: 0.133 },
        { resourceId: 'sausages', amount: 0.08 }, { resourceId: 'bread', amount: 0.08 }, { resourceId: 'soap', amount: 0.04 }
      ]
    }
  },
  "Service_02 (School)": { category: 'Public', influenceRadius: 35 },
  "Service_04 (Church)": { category: 'Public', influenceRadius: 40 },
  "Institution_02 (Fire Department)": { category: 'Public', influenceRadius: 26 },
  "Institution_01 (Police)": { category: 'Public', influenceRadius: 26 },
  "Agriculture_08 (Pig Farm)": {
    category: 'Production', impactType: 'Negative', impactRadius: 12,
    production: { outputs: [{ resourceId: 'pigs', amount: 1 }], workforce: { type: 'Farmer', amount: 5 } }
  },
  "Food_07 (Sausage Maker)": {
    category: 'Production', impactType: 'Negative', impactRadius: 12,
    production: { inputs: [{ resourceId: 'pigs', amount: 1 }], outputs: [{ resourceId: 'sausages', amount: 1 }], workforce: { type: 'Worker', amount: 30 } }
  },
  "Processing_02 (Flour Processing)": {
    category: 'Production',
    production: { inputs: [{ resourceId: 'grain', amount: 2 }], outputs: [{ resourceId: 'flour', amount: 2 }], workforce: { type: 'Farmer', amount: 10 } }
  },
  "Food_01 (Bread Maker)": {
    category: 'Production',
    production: { inputs: [{ resourceId: 'flour', amount: 1 }], outputs: [{ resourceId: 'bread', amount: 1 }], workforce: { type: 'Worker', amount: 50 } }
  },
  "Factory_02 (Soap Factory)": {
    category: 'Production', impactType: 'Negative', impactRadius: 15,
    production: { outputs: [{ resourceId: 'soap', amount: 1 }], workforce: { type: 'Worker', amount: 50 } }
  },
  "Factory_04 (Brick Factory)": {
    category: 'Production',
    production: { outputs: [{ resourceId: 'bricks', amount: 2 }], workforce: { type: 'Worker', amount: 10 } }
  },
  "Heavy_02 (Steel Heavy Industry)": {
    category: 'Production', impactType: 'Negative', impactRadius: 15,
    production: { outputs: [{ resourceId: 'steel', amount: 1 }], workforce: { type: 'Worker', amount: 100 } }
  },

  // --- ANNO 1800: ARTISANS & ABOVE ---
  "Residence_tier03": { category: 'Residence', residence: { populationType: 'Artisan', maxPopulation: 30 } },
  "Residence_tier04": { category: 'Residence', residence: { populationType: 'Engineer', maxPopulation: 40 } },
  "Residence_tier05": { category: 'Residence', residence: { populationType: 'Investor', maxPopulation: 50 } },
  "Service_05 (Cabaret)": { category: 'Public', influenceRadius: 40 },
  "Service_07 (University)": { category: 'Public', influenceRadius: 45 },
  "Institution_03 (Hospital)": { category: 'Public', influenceRadius: 26 },
  "Service_09 (Club House)": { category: 'Public', influenceRadius: 35 },
  "Service_03 (Bank)": { category: 'Public', influenceRadius: 45 },
  
  // --- ROADS & SPECIALS ---
  "Street_1x1": { category: 'Decoration', name: 'Road' },
  "Logistic_02 (Warehouse I)": { category: 'Public' },
  "Town hall": { category: 'Public', influenceRadius: 20 },
  "Guild_house": { category: 'Public', influenceRadius: 15 },
  
  // --- ANNO 2205 MAPPINGS ---
  "residence tier01 earth": { category: 'Residence', residence: { populationType: 'Workers', maxPopulation: 50 } },
  "public earth 01": { category: 'Public' },
  "production energy earth facility 01 t": { category: 'Production' },
};

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

  // 2. Check Name/Template Heuristics (Fallbacks)
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
  
  // Assuming the user creates a "public/icons" folder and places the png files there.
  const iconPath = raw.IconFileName ? `/icons/${raw.IconFileName}` : undefined;

  return {
    id: raw.Identifier,
    name: raw.Localization.eng || raw.Identifier,
    width: raw.BuildBlocker ? raw.BuildBlocker.x : 1,
    height: raw.BuildBlocker ? raw.BuildBlocker.z : 1,
    color: determineColor(raw, category),
    icon: iconPath,
    category: category,
    influenceRadius: raw.InfluenceRadius > 0 ? raw.InfluenceRadius : undefined,
    ...overrides
  };
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
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Public Buildings",Identifier:"Service_01 (Pub)",IconFileName:"A7_pub.png",BuildBlocker:{x:6,z:4},Template:"PublicServiceBuilding",InfluenceRange:30.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010358,Localization:{eng:"Pub"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Public Buildings",Identifier:"Service_02 (School)",IconFileName:"A7_school.png",BuildBlocker:{x:5,z:6},Template:"PublicServiceBuilding",InfluenceRange:35.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010360,Localization:{eng:"School"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Public Buildings",Identifier:"Service_04 (Church)",IconFileName:"A7_church.png",BuildBlocker:{x:8,z:6},Template:"PublicServiceBuilding",InfluenceRange:40.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010359,Localization:{eng:"Church"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Public Buildings",Identifier:"Institution_02 (Fire Department)",IconFileName:"A7_fire_house.png",BuildBlocker:{x:5,z:3},Template:"CityInstitutionBuilding",InfluenceRange:26.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010463,Localization:{eng:"Fire Station"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Public Buildings",Identifier:"Institution_01 (Police)",IconFileName:"A7_police.png",BuildBlocker:{x:4,z:6},Template:"CityInstitutionBuilding",InfluenceRange:26.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010462,Localization:{eng:"Police Station"}},
  {Header:"(A7) Anno 1800",Faction:"(03) Artisans",Group:"Public Buildings",Identifier:"Institution_03 (Hospital)",IconFileName:"A7_hospital.png",BuildBlocker:{x:6,z:6},Template:"CityInstitutionBuilding",InfluenceRange:26.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010464,Localization:{eng:"Hospital"}},
  {Header:"(A7) Anno 1800",Faction:"(03) Artisans",Group:"Public Buildings",Identifier:"Service_07 (University)",IconFileName:"A7_university.png",BuildBlocker:{x:9,z:6},Template:"PublicServiceBuilding",InfluenceRange:45.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010362,Localization:{eng:"University"}},
  {Header:"(A7) Anno 1800",Faction:"(04) Engineers",Group:"Public Buildings",Identifier:"Service_03 (Bank)",IconFileName:"A7_bank.png",BuildBlocker:{x:12,z:10},Template:"PublicServiceBuilding",InfluenceRange:45.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010365,Localization:{eng:"Bank"}},
  {Header:"(A7) Anno 1800",Faction:"(05) Investors",Group:"Public Buildings",Identifier:"Service_09 (Club House)",IconFileName:"A7_club_house.png",BuildBlocker:{x:6,z:6},Template:"PublicServiceBuilding",InfluenceRange:35.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010364,Localization:{eng:"Members Club"}},
  {Header:"(A7) Anno 1800",Faction:"All Worlds",Group:"Special Buildings",Identifier:"Town hall",IconFileName:"A7_townhall.png",BuildBlocker:{x:4,z:4},Template:"Guildhouse",InfluenceRange:0.0,InfluenceRadius:20.0,Road:false,Borderless:false,Guid:100415,Localization:{eng:"Town Hall"}},
  {Header:"(A7) Anno 1800",Faction:"All Worlds",Group:"Special Buildings",Identifier:"Guild_house",IconFileName:"A7_guildhouse.png",BuildBlocker:{x:4,z:4},Template:"Guildhouse",InfluenceRange:0.0,InfluenceRadius:15.0,Road:false,Borderless:false,Guid:1010516,Localization:{eng:"Trade Union"}},

  // --- ANNO 1800 PRODUCTION ---
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Farm Buildings",Identifier:"Agriculture_01 (Grain Farm)",IconFileName:"A7_cereals_2.png",BuildBlocker:{x:4,z:3},Template:"FarmBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010262,Localization:{eng:"Grain Farm - (144)"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Farm Buildings",Identifier:"Agriculture_04 (Potato Farm)",IconFileName:"A7_potatoes.png",BuildBlocker:{x:3,z:3},Template:"FarmBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010265,Localization:{eng:"Potato Farm - (72)"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Agriculture_05 (Timber Yard)",IconFileName:"A7_wood_log.png",BuildBlocker:{x:4,z:4},Template:"FreeAreaBuilding",InfluenceRange:0.0,InfluenceRadius:9.0,Road:false,Borderless:false,Guid:1010266,Localization:{eng:"Lumberjack's Hut"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Factory_03 (Timber Factory)",IconFileName:"A7_wooden_planks.png",BuildBlocker:{x:4,z:3},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:100451,Localization:{eng:"Sawmill"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Farm Buildings",Identifier:"Agriculture_06 (Sheep Farm)",IconFileName:"A7_wool.png",BuildBlocker:{x:3,z:3},Template:"FarmBuilding",InfluenceRange:0.0,InfluenceRadius:7.0,Road:false,Borderless:false,Guid:1010267,Localization:{eng:"Sheep Farm - (3)"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Processing_04 (Weavery)",IconFileName:"A7_working_cloth.png",BuildBlocker:{x:4,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010315,Localization:{eng:"Framework Knitters"}},
  {Header:"(A7) Anno 1800",Faction:"(01) Farmers",Group:"Production Buildings",Identifier:"Food_06 (Schnapps Maker)",IconFileName:"A7_schnapps_4.png",BuildBlocker:{x:3,z:4},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010294,Localization:{eng:"Schnapps Distillery"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Factory_04 (Brick Factory)",IconFileName:"A7_bricks.png",BuildBlocker:{x:5,z:5},Template:"FactoryBuilding7",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010283,Localization:{eng:"Brick Factory"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Heavy_02 (Steel Heavy Industry)",IconFileName:"A7_steel.png",BuildBlocker:{x:7,z:4},Template:"HeavyFactoryBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010297,Localization:{eng:"Furnace"}},
  {Header:"(A7) Anno 1800",Faction:"(02) Workers",Group:"Production Buildings",Identifier:"Heavy_01 (Beams Heavy Industry)",IconFileName:"A7_beams.png",BuildBlocker:{x:10,z:5},Template:"HeavyFactoryBuilding",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:1010296,Localization:{eng:"Steelworks"}},

  // --- ANNO 1800 ROADS & ORNAMENTS ---
  {Header:"- Road Presets",Faction:"Roads (x3)",Group:null,Identifier:"Street_1x1",IconFileName:null,BuildBlocker:{x:1,z:1},Template:"Road",InfluenceRange:0.0,InfluenceRadius:0.0,Road:true,Borderless:true,Guid:0,Localization:{eng:"Road"}},
  {Header:"(A7) Anno 1800",Faction:"Ornaments",Group:"03 Park Vegetation",Identifier:"Park_1x1_grass",IconFileName:"A7_park_props_1x1_01.png",BuildBlocker:{x:1,z:1},Template:"OrnamentalBuilding_Park",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:102083,Localization:{eng:"Grass"}},
  {Header:"(A7) Anno 1800",Faction:"Ornaments",Group:"01 Park Paths",Identifier:"Park_1x1_path",IconFileName:"A7_park_props_1x1_27.png",BuildBlocker:{x:1,z:1},Template:"OrnamentalBuilding_Park",InfluenceRange:0.0,InfluenceRadius:0.0,Road:false,Borderless:false,Guid:102099,Localization:{eng:"Path"}},

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
  fish: { name: 'Fish' },
  pigs: { name: 'Pigs' },
  sausages: { name: 'Sausages' },
  bread: { name: 'Bread' },
  soap: { name: 'Soap' },
  grain: { name: 'Grain' },
  flour: { name: 'Flour' },
  bricks: { name: 'Bricks' },
  steel: { name: 'Steel Beams' }
};

// --- CONFIG EXPORT ---
export const ANNO_GAMES: Record<AnnoTitle, GameConfig> = {
  [AnnoTitle.ANNO_1800]: {
    title: AnnoTitle.ANNO_1800,
    gridColor: '#333',
    backgroundColor: '#1f2937',
    buildings: RAW_BUILDINGS.filter(b => b.Header.includes('1800') || b.Identifier === 'Street_1x1').map(mapRawToDefinition),
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
    buildings: [
        { id: 'res_pleb', name: 'Insula (Plebeian)', width: 3, height: 3, color: '#d6c0b0', category: 'Residence', residence: { populationType: 'Plebeian', maxPopulation: 10, consumption: [] } },
        { id: 'forum', name: 'Forum', width: 6, height: 6, color: '#FFDAB9', category: 'Public', influenceRadius: 25 },
        { id: 'Street_1x1', name: 'Roman Road', width: 1, height: 1, color: '#A9A9A9', category: 'Decoration' }
    ]
  }
};
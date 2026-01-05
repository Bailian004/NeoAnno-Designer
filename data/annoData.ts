
import { AnnoTitle, GameConfig, BuildingDefinition } from "../types";

const buildings1800: BuildingDefinition[] = [
  // --- RESIDENCES ---
  { 
    id: 'res_farmer', 
    name: 'Farmer Residence', 
    width: 3, 
    height: 3, 
    color: '#4ade80', 
    category: 'Residence',
    residence: {
      populationType: 'Farmer',
      maxPopulation: 10,
      consumption: [
        { resourceId: 'fish', amount: 0.025 },        // 1 Fishery (2t/min) supports ~80 residences
        { resourceId: 'work_clothes', amount: 0.030 }, // 1 Knitter (2t/min) supports ~65 residences
        { resourceId: 'schnapps', amount: 0.033 }      // 1 Distillery (2t/min) supports ~60 residences
      ]
    }
  },
  { 
    id: 'res_worker', 
    name: 'Worker Residence', 
    width: 3, 
    height: 3, 
    color: '#60a5fa', 
    category: 'Residence',
    residence: {
      populationType: 'Worker',
      maxPopulation: 20,
      consumption: [
        { resourceId: 'fish', amount: 0.1 },          // 1 Fishery (2t/min) supports 20 residences
        { resourceId: 'work_clothes', amount: 0.123 }, // 1 Knitter (2t/min) supports ~16 residences
        { resourceId: 'schnapps', amount: 0.133 },     // 1 Distillery (2t/min) supports ~15 residences
        { resourceId: 'sausages', amount: 0.08 },      // 1 Slaughterhouse (1t/min) supports 12.5 residences
        { resourceId: 'bread', amount: 0.08 }          // 1 Bakery (1t/min) supports ~12.5 residences
      ]
    }
  },

  // --- PUBLIC SERVICES ---
  { id: 'mkt', name: 'Marketplace', width: 5, height: 5, color: '#facc15', category: 'Public', influenceRadius: 28 }, 
  { id: 'pub', name: 'Pub', width: 4, height: 4, color: '#fb923c', category: 'Public', influenceRadius: 22 },
  { id: 'fire', name: 'Fire Station', width: 3, height: 6, color: '#ef4444', category: 'Public', influenceRadius: 20 },
  { id: 'church', name: 'Church', width: 6, height: 9, color: '#d97706', category: 'Public', influenceRadius: 35 },
  { id: 'school', name: 'School', width: 6, height: 5, color: '#3b82f6', category: 'Public', influenceRadius: 28 },

  // --- WAREHOUSE ---
  { id: 'warehouse_sm', name: 'Small Warehouse', width: 4, height: 4, color: '#78716c', category: 'Public' },

  // --- PRODUCTION: WOOD ---
  { 
    id: 'lumberjack', 
    name: 'Lumberjack', 
    width: 3, 
    height: 3, 
    color: '#166534', 
    category: 'Production',
    production: {
      outputs: [{ resourceId: 'wood', amount: 4 }],
      workforce: { type: 'Farmer', amount: 5 }
    }
  },
  { 
    id: 'sawmill', 
    name: 'Sawmill', 
    width: 3, 
    height: 3, 
    color: '#854d0e', 
    category: 'Production',
    production: {
      inputs: [{ resourceId: 'wood', amount: 4 }],
      outputs: [{ resourceId: 'timber', amount: 4 }],
      workforce: { type: 'Farmer', amount: 10 }
    }
  },

  // --- PRODUCTION: CLOTHES ---
  {
    id: 'sheep_farm',
    name: 'Sheep Farm',
    width: 3, 
    height: 3,
    color: '#bef264',
    category: 'Production',
    production: {
      outputs: [{ resourceId: 'wool', amount: 2 }],
      workforce: { type: 'Farmer', amount: 10 }
    }
  },
  {
    id: 'knitter',
    name: 'Framework Knitters',
    width: 3, 
    height: 3,
    color: '#a3e635',
    category: 'Production',
    production: {
      inputs: [{ resourceId: 'wool', amount: 2 }],
      outputs: [{ resourceId: 'work_clothes', amount: 2 }],
      workforce: { type: 'Farmer', amount: 50 }
    }
  },

  // --- PRODUCTION: SCHNAPPS ---
  {
    id: 'potato_farm',
    name: 'Potato Farm',
    width: 3, 
    height: 3,
    color: '#a16207',
    category: 'Production',
    production: {
      outputs: [{ resourceId: 'potatoes', amount: 2 }],
      workforce: { type: 'Farmer', amount: 20 }
    }
  },
  {
    id: 'distillery',
    name: 'Schnapps Distillery',
    width: 3, 
    height: 3, 
    color: '#ca8a04',
    category: 'Production',
    production: {
      inputs: [{ resourceId: 'potatoes', amount: 2 }],
      outputs: [{ resourceId: 'schnapps', amount: 2 }],
      workforce: { type: 'Farmer', amount: 50 }
    }
  },

  // --- PRODUCTION: FOOD (Fish) ---
  {
    id: 'fishery',
    name: 'Fishery',
    width: 3,
    height: 5, 
    color: '#3b82f6',
    category: 'Production',
    production: {
      outputs: [{ resourceId: 'fish', amount: 2 }],
      workforce: { type: 'Farmer', amount: 25 }
    }
  },

  // --- PRODUCTION: SAUSAGES ---
  {
    id: 'pig_farm',
    name: 'Pig Farm',
    width: 4,
    height: 4,
    color: '#fca5a5',
    category: 'Production',
    impactType: 'Negative',
    impactRadius: 15,
    production: {
      outputs: [{ resourceId: 'pigs', amount: 1 }], // 60s cycle
      workforce: { type: 'Farmer', amount: 5 }
    }
  },
  {
    id: 'slaughterhouse',
    name: 'Slaughterhouse',
    width: 4,
    height: 4,
    color: '#f87171',
    category: 'Production',
    impactType: 'Negative',
    impactRadius: 15,
    production: {
      inputs: [{ resourceId: 'pigs', amount: 1 }],
      outputs: [{ resourceId: 'sausages', amount: 1 }], // 60s cycle
      workforce: { type: 'Worker', amount: 30 }
    }
  },

  // --- PRODUCTION: BREAD ---
  {
    id: 'grain_farm',
    name: 'Grain Farm',
    width: 4, 
    height: 4, 
    color: '#fde047',
    category: 'Production',
    production: {
      outputs: [{ resourceId: 'grain', amount: 1 }], // 60s cycle
      workforce: { type: 'Farmer', amount: 20 }
    }
  },
  {
    id: 'flour_mill',
    name: 'Flour Mill',
    width: 4, 
    height: 5, 
    color: '#fcd34d',
    category: 'Production',
    production: {
      inputs: [{ resourceId: 'grain', amount: 2 }],
      outputs: [{ resourceId: 'flour', amount: 2 }], // 30s cycle
      workforce: { type: 'Farmer', amount: 10 }
    }
  },
  {
    id: 'bakery',
    name: 'Bakery',
    width: 5, 
    height: 5, 
    color: '#d97706',
    category: 'Production',
    production: {
      inputs: [{ resourceId: 'flour', amount: 1 }],
      outputs: [{ resourceId: 'bread', amount: 1 }], // 60s cycle
      workforce: { type: 'Worker', amount: 50 }
    }
  },

  // Decoration
  { id: 'park', name: 'City Park', width: 3, height: 3, color: '#059669', category: 'Decoration', impactType: 'Positive', impactRadius: 10 },
  { id: 'road', name: 'Road', width: 1, height: 1, color: '#737373', category: 'Decoration' },
];

const buildings1404: BuildingDefinition[] = [
  { id: 'peasant', name: 'Peasant House', width: 3, height: 3, color: '#a3e635', category: 'Residence' },
  { id: 'citizen', name: 'Citizen House', width: 3, height: 3, color: '#38bdf8', category: 'Residence' },
  { id: 'market_sm', name: 'Small Market', width: 4, height: 5, color: '#eab308', category: 'Public', influenceRadius: 15 },
  { id: 'chapel', name: 'Chapel', width: 3, height: 5, color: '#d97706', category: 'Public', influenceRadius: 20 },
  { id: 'cider', name: 'Cider Farm', width: 4, height: 5, color: '#65a30d', category: 'Production' },
];

const buildingsGeneric: BuildingDefinition[] = [
    { id: 'res_gen', name: 'Residence', width: 3, height: 3, color: '#9ca3af', category: 'Residence' },
    { id: 'fac_gen', name: 'Factory', width: 4, height: 6, color: '#4b5563', category: 'Production', impactType: 'Negative', impactRadius: 10 },
    { id: 'park_gen', name: 'Park', width: 2, height: 2, color: '#10b981', category: 'Decoration', impactType: 'Positive', impactRadius: 8 },
];

const buildings117: BuildingDefinition[] = [
    { id: 'res_pleb', name: 'Insula (Plebeian)', width: 3, height: 3, color: '#d6c0b0', category: 'Residence', residence: { populationType: 'Plebeian', maxPopulation: 10, consumption: [] } },
    { id: 'forum', name: 'Forum', width: 6, height: 6, color: '#f59e0b', category: 'Public', influenceRadius: 25 },
    { id: 'road_roman', name: 'Roman Road', width: 1, height: 1, color: '#78716c', category: 'Decoration' }
];

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
  flour: { name: 'Flour' }
};

const resources117: Record<string, {name: string, icon?: string}> = {
    grain: { name: 'Grain' },
    fish: { name: 'Fish' }
};

export const ANNO_GAMES: Record<AnnoTitle, GameConfig> = {
  [AnnoTitle.ANNO_1800]: {
    title: AnnoTitle.ANNO_1800,
    gridColor: '#333',
    backgroundColor: '#1f2937',
    buildings: buildings1800,
    resources: resources1800
  },
  [AnnoTitle.ANNO_1404]: {
    title: AnnoTitle.ANNO_1404,
    gridColor: '#444',
    backgroundColor: '#373026',
    buildings: buildings1404
  },
  [AnnoTitle.ANNO_2070]: {
    title: AnnoTitle.ANNO_2070,
    gridColor: '#004444',
    backgroundColor: '#0f172a',
    buildings: buildingsGeneric
  },
  [AnnoTitle.ANNO_2205]: {
    title: AnnoTitle.ANNO_2205,
    gridColor: '#003366',
    backgroundColor: '#001122',
    buildings: buildingsGeneric
  },
  [AnnoTitle.ANNO_117]: {
    title: AnnoTitle.ANNO_117,
    gridColor: '#44403c',
    backgroundColor: '#292524',
    buildings: buildings117,
    resources: resources117
  }
};

/**
 * Building ID Mapping Table
 * Maps generic/friendly building names to actual Anno building IDs
 * This prevents fuzzy matching errors and ensures correct building resolution
 */

export const BUILDING_ID_MAP: Record<string, string> = {
  // === RESIDENCES ===
  'Farmers': 'Residence_Old_World',
  'Farmer Residence': 'Residence_Old_World',
  'Farmer House': 'Residence_Old_World',
  'Workers': 'Residence_tier02',
  'Worker Residence': 'Residence_tier02',
  'Worker House': 'Residence_tier02',
  'Artisans': 'Residence_tier03',
  'Artisan Residence': 'Residence_tier03',
  'Artisan House': 'Residence_tier03',
  'Engineers': 'Residence_tier04',
  'Engineer Residence': 'Residence_tier04',
  'Engineer House': 'Residence_tier04',
  'Investors': 'Residence_tier05',
  'Investor Residence': 'Residence_tier05',
  'Investor House': 'Residence_tier05',
  'Jornaleros': 'Residence_New_World',
  'Jornalero Residence': 'Residence_New_World',
  'Obreros': 'Residence_colony01_tier02',
  'Obrero Residence': 'Residence_colony01_tier02',

  // === INFRASTRUCTURE ===
  'Road': 'Street_1x1',
  'Street': 'Street_1x1',
  'Warehouse': 'Logistic_02 (Warehouse I)',
  'Warehouse I': 'Logistic_02 (Warehouse I)',

  // === PUBLIC SERVICES ===
  'Marketplace': 'Logistic_01 (Marketplace)',
  'Pub': 'Service_01 (Pub)',
  'Church': 'Service_04 (Church)',
  'School': 'Service_02 (School)',
  'Fire Station': 'Institution_02 (Fire Department)',
  'Fire Department': 'Institution_02 (Fire Department)',
  'Police Station': 'Institution_01 (Police)',
  'Police': 'Institution_01 (Police)',
  'Hospital': 'Institution_03 (Hospital)',
  'University': 'Service_07 (University)',
  'Bank': 'Service_03 (Bank)',
  'Variety Theatre': 'Service_05 (Cabaret)',
  'Theatre': 'Service_05 (Cabaret)',
  'Cabaret': 'Service_05 (Cabaret)',
  'Members Club': 'Service_09 (Club House)',
  'Club House': 'Service_09 (Club House)',
  'Chapel': 'Service_colony01_02 (Chapel)',

  // === FARMER PRODUCTION ===
  'Lumberjack Hut': 'Agriculture_05 (Timber Yard)',
  "Lumberjack's Hut": 'Agriculture_05 (Timber Yard)',
  'Timber Yard': 'Agriculture_05 (Timber Yard)',
  'Sawmill': 'Factory_03 (Timber Factory)',
  'Fishery': 'Coastal_01 (Fish Coast Building)',
  'Fish Coast Building': 'Coastal_01 (Fish Coast Building)',
  'Grain Farm': 'Agriculture_01 (Grain Farm)',
  'Potato Farm': 'Agriculture_04 (Potato Farm)',
  'Sheep Farm': 'Agriculture_06 (Sheep Farm)',
  'Framework Knitters': 'Processing_04 (Weavery)',
  'Weavery': 'Processing_04 (Weavery)',
  'Schnapps Distillery': 'Food_06 (Schnapps Maker)',
  'Schnapps Maker': 'Food_06 (Schnapps Maker)',

  // === WORKER PRODUCTION ===
  'Pig Farm': 'Agriculture_08 (Pig Farm)',
  'Slaughterhouse': 'Food_07 (Sausage Maker)',
  'Sausage Maker': 'Food_07 (Sausage Maker)',
  'Flour Mill': 'Processing_02 (Flour Processing)',
  'Flour Processing': 'Processing_02 (Flour Processing)',
  'Bakery': 'Food_01 (Bread Maker)',
  'Bread Maker': 'Food_01 (Bread Maker)',
  'Brewery': 'Food_02 (Beer Maker)',
  'Beer Maker': 'Food_02 (Beer Maker)',
  'Soap Factory': 'Factory_02 (Soap Factory)',
  'Brick Factory': 'Factory_04 (Brick Factory)',
  'Furnace': 'Heavy_02 (Steel Heavy Industry)',
  'Steel Heavy Industry': 'Heavy_02 (Steel Heavy Industry)',
  'Steelworks': 'Heavy_01 (Beams Heavy Industry)',
  'Beams Heavy Industry': 'Heavy_01 (Beams Heavy Industry)',
  'Clay Pit': 'Factory_11 (Clay Pit)',
  'Coal Mine': 'Mining_01 (Coal Mine)',
  'Iron Mine': 'Mining_02 (Iron Mine)',

  // === ARTISAN PRODUCTION ===
  'Sewing Machine Factory': 'Factory_05 (Sewing Machine Factory)',
  'Fur Dealer': 'Processing_05 (Fur Dealer)',
  'Cannery': 'Food_05 (Canned Food Factory)',
  'Canned Food Factory': 'Food_05 (Canned Food Factory)',
  'Cattle Farm': 'Agriculture_02 (Cattle Farm)',

  // === ENGINEER PRODUCTION ===
  'Glass Factory': 'Factory_08 (Glass Factory)',
  'Window Factory': 'Factory_07 (Window Factory)',
  'Light Bulb Factory': 'Factory_06 (Light Bulb Factory)',
  'Bicycle Factory': 'Factory_12 (Bicycle Factory)',
  'Pocket Watch Factory': 'Factory_13 (Pocket Watch Factory)',
  'Gold Mine': 'Mining_08 (Gold Ore Mine)',
  'Copper Mine': 'Mining_05 (Copper Mine)',

  // === NEW WORLD PRODUCTION ===
  'Sugar Cane Farm': 'Agriculture_colony01_01 (Sugar Cane Farm)',
  'Rum Distillery': 'Food_colony01_01 (Rum Distillery)',
  'Poncho Maker': 'Processing_colony01_01 (Poncho Maker)',
  'Fried Plantain Kitchen': 'Food_colony01_02 (Fried Plantain Kitchen)',
  'Coffee Plantation': 'Agriculture_colony01_07 (Coffee Beans Farm)',
  'Coffee Roaster': 'Processing_colony01_02 (Coffee Roaster)',
  'Tobacco Plantation': 'Agriculture_colony01_02 (Tobacco Farm)',
  'Cigar Factory': 'Factory_colony01_01 (Cigar Factory)',
  'Bowler Hat Factory': 'Factory_colony01_02 (Bowler Hat Factory)',
  'Tortilla Maker': 'Food_colony01_03 (Tortilla Maker)',
  'Corn Farm': 'Agriculture_colony01_10 (Corn Farm)',
  'Banana Plantation': 'Agriculture_colony01_08 (Banana Farm)',
  'Alpaca Farm': 'Agriculture_colony01_11 (Alpaca Farm)',
  'Cotton Plantation': 'Agriculture_colony01_03 (Cotton Farm)',
  'Cocoa Plantation': 'Agriculture_colony01_04 (Cocoa Farm)',
  'Caoutchouc Plantation': 'Agriculture_colony01_05 (Caoutchouc Farm)'
};

/**
 * Reverse map for looking up generic names from IDs
 */
export const ID_TO_NAME_MAP: Record<string, string> = {};
Object.entries(BUILDING_ID_MAP).forEach(([name, id]) => {
  if (!ID_TO_NAME_MAP[id]) {
    ID_TO_NAME_MAP[id] = name;
  }
});

/**
 * Normalize building name for lookup
 */
export function normalizeBuildingName(name: string): string {
  return name.toLowerCase().trim().replace(/['\s-]/g, '');
}

/**
 * Get building ID from name using the mapping table
 */
export function getBuildingIdFromName(name: string): string | undefined {
  // Try exact match first (case-insensitive)
  const exactMatch = BUILDING_ID_MAP[name];
  if (exactMatch) return exactMatch;

  // Try normalized match
  const normalized = normalizeBuildingName(name);
  for (const [key, id] of Object.entries(BUILDING_ID_MAP)) {
    if (normalizeBuildingName(key) === normalized) {
      return id;
    }
  }

  // Last resort: partial match
  for (const [key, id] of Object.entries(BUILDING_ID_MAP)) {
    if (normalizeBuildingName(key).includes(normalized) || 
        normalized.includes(normalizeBuildingName(key))) {
      return id;
    }
  }

  return undefined;
}

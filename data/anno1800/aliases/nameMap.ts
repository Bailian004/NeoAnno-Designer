import { AliasMapEntry } from '../types';

// Common name aliases for buildings, goods, and tiers
// Helps map abbreviated/alternate names to canonical IDs
export const aliasMap: AliasMapEntry[] = [
  // Building aliases
  { alias: "Lumberjack's Hut", canonicalId: "Lumberjack Hut", kind: 'building' },
  { alias: "Schnapps Distill.", canonicalId: "Schnapps Distillery", kind: 'building' },
  { alias: "Framework Knit.", canonicalId: "Framework Knitters", kind: 'building' },
  { alias: "Artisanal Kit.", canonicalId: "Artisanal Kitchen", kind: 'building' },
  { alias: "Sewing M. Fac.", canonicalId: "Sewing Machine Factory", kind: 'building' },
  { alias: "Spectacle Fac.", canonicalId: "Spectacle Factory", kind: 'building' },
  { alias: "Heavy Weapons", canonicalId: "Heavy Weapons Factory", kind: 'building' },
  { alias: "Motor Assembly", canonicalId: "Motor Assembly Line", kind: 'building' },
  { alias: "Light Bulb Fac.", canonicalId: "Light Bulb Factory", kind: 'building' },
  { alias: "Plantain Plant.", canonicalId: "Plantain Plantation", kind: 'building' },
  { alias: "Sugar Cane Plt.", canonicalId: "Sugar Cane Plantation", kind: 'building' },
  { alias: "Cotton Plant.", canonicalId: "Cotton Plantation", kind: 'building' },
  { alias: "Coffee Plant.", canonicalId: "Coffee Plantation", kind: 'building' },
  { alias: "Bowler Hat Mkr.", canonicalId: "Felt Producer", kind: 'building' },
  { alias: "Tobacco Plant.", canonicalId: "Tobacco Plantation", kind: 'building' },
  { alias: "Cocoa Plant.", canonicalId: "Cocoa Plantation", kind: 'building' },
  { alias: "Chocolate Fac.", canonicalId: "Chocolate Factory", kind: 'building' },
  { alias: "Caribou Hunting", canonicalId: "Caribou Hunting Cabin", kind: 'building' },
  { alias: "Pemmican Cook.", canonicalId: "Pemmican Cookhouse", kind: 'building' },
  { alias: "Sleeping Bag", canonicalId: "Sleeping Bag Factory", kind: 'building' },
  { alias: "Oil Lamp Fac.", canonicalId: "Oil Lamps Factory", kind: 'building' },
  { alias: "Husky Sled Fac.", canonicalId: "Husky Sled Factory", kind: 'building' },
  { alias: "Sangha Cow Farm", canonicalId: "Sanga Farm", kind: 'building' },
  { alias: "Dried Meat Fac.", canonicalId: "Dry-House", kind: 'building' },
  { alias: "Finery", canonicalId: "Embroiderer", kind: 'building' },
  { alias: "Tea Spice Blend", canonicalId: "Tea Spicer", kind: 'building' },
  { alias: "Mud Brick Fac.", canonicalId: "Brick Dry-House", kind: 'building' },
  { alias: "Tapestry Loom", canonicalId: "Tapestry Looms", kind: 'building' },
  { alias: "Ceramics Wkshp", canonicalId: "Ceramics Workshop", kind: 'building' },
  { alias: "Lanternmaker", canonicalId: "Luminer", kind: 'building' },
  
  // Tier aliases
  { alias: "Farmer", canonicalId: "Farmers", kind: 'tier' },
  { alias: "Worker", canonicalId: "Workers", kind: 'tier' },
  { alias: "Artisan", canonicalId: "Artisans", kind: 'tier' },
  { alias: "Engineer", canonicalId: "Engineers", kind: 'tier' },
  { alias: "Investor", canonicalId: "Investors", kind: 'tier' },
  { alias: "Jornalero", canonicalId: "Jornaleros", kind: 'tier' },
  { alias: "Obrero", canonicalId: "Obreros", kind: 'tier' },
  { alias: "Explorer", canonicalId: "Explorers", kind: 'tier' },
  { alias: "Technician", canonicalId: "Technicians", kind: 'tier' },
  { alias: "Shepherd", canonicalId: "Shepherds", kind: 'tier' },
  { alias: "Elder", canonicalId: "Elders", kind: 'tier' },
];


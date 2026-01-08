import { productionChains, ProductionChain } from './generatedProductionChains';

// Map building name -> correct product name (canonical good ID)
const OUTPUT_PRODUCT_MAP: Record<string, string> = {
  // Old World - Farmers
  "Lumberjack's Hut": 'Wood',
  'Sawmill': 'Timber',
  'Fishery': 'Fish',
  'Potato Farm': 'Potato',
  'Schnapps Distill.': 'Schnapps',
  'Sheep Farm': 'Wool',
  'Framework Knit.': 'Work Clothes',

  // Workers
  'Clay Pit': 'Clay',
  'Brick Factory': 'Bricks',
  'Pig Farm': 'Pig',
  'Slaughterhouse': 'Sausages',
  'Grain Farm': 'Grain',
  'Flour Mill': 'Flour',
  'Bakery': 'Bread',
  'Sailmakers': 'Sails',
  'Iron Mine': 'Iron',
  'Charcoal Kiln': 'Coal',
  'Furnace': 'Steel',
  'Steelworks': 'Steel Beams',
  'Rendering Works': 'Tallow',
  'Soap Factory': 'Soap',
  'Weapon Factory': 'Weapons',
  'Malthouse': 'Malt',
  'Hop Farm': 'Hops',
  'Brewery': 'Beer',
  'Sand Mine': 'Quartz Sand',
  'Glassmakers': 'Glass',
  'Window Makers': 'Windows',

  // Artisans
  'Cattle Farm': 'Beef',
  'Red Pepper Farm': 'Pepper',
  'Artisanal Kit.': 'Goulash',
  'Cannery': 'Canned Food',
  'Sewing M. Fac.': 'Sewing Machines',
  'Hunting Cabin': 'Furs',
  'Fur Dealer': 'Fur Coats',

  // Engineers
  'Limestone Quarry': 'Lime',
  'Concrete Factory': 'Reinforced Concrete',
  'Spectacle Fac.': 'Glasses',
  'Bicycle Factory': 'Penny Farthings',
  'Heavy Weapons': 'Heavy Weapons',
  'Motor Assembly': 'Motors',
  'Clockmakers': 'Pocket Watches',
  'Light Bulb Fac.': 'Light Bulbs',
  'Filament Fac.': 'Filament',

  // Investors / Advanced Old World
  'Vineyard': 'Grapes',
  'Champagne Cel.': 'Champagne',
  'Gold Mine': 'Gold Ore',
  'Goldsmiths': 'Gold',
  'Jewellers': 'Jewelry',
  'Gramophone Fac.': 'Gramophones',
  'Coachmakers': 'Steam Carriages',

  // New World - Jornaleros
  'Plantain Plant.': 'Plantains',
  'Fried Plantain': 'Fried Plantains',
  'Fish Oil Factory': 'Fish Oil',
  'Sugar Cane Plt.': 'Sugar Cane',
  'Rum Distillery': 'Rum',
  'Alpaca Farm': 'Alpaca Wool',
  'Poncho Darner': 'Ponchos',
  'Cotton Plant.': 'Cotton',
  'Cotton Mill': 'Cotton Fabric',

  // New World - Obreros
  'Corn Farm': 'Corn',
  'Tortilla Maker': 'Tortillas',
  'Coffee Plant.': 'Coffee Beans',
  'Coffee Roaster': 'Coffee',
  'Felt Producer': 'Felt',
  'Bowler Hat Mkr.': 'Bowler Hats',
  'Tobacco Plant.': 'Tobacco',
  'Cigar Factory': 'Cigars',
  'Cocoa Plant.': 'Cocoa',
  'Chocolate Fac.': 'Chocolate',
  'Pearl Farm': 'Pearls',

  // Arctic
  'Whaling Station': 'Whale Oil',
  'Caribou Hunting': 'Meat',
  'Pemmican Cook.': 'Pemmican',
  'Sleeping Bag': 'Sleeping Bags',
  'Oil Lamp Fac.': 'Oil Lamps',
  'Parka Factory': 'Parkas',
  'Husky Sled Fac.': 'Husky Sleds',

  // Enbesa
  'Dried Meat Fac.': 'Dried Meat',
  'Finery': 'Finery',
  'Hibiscus Farm': 'Hibiscus',
  'Tea Spice Blend': 'Hibiscus Tea',
  'Mud Brick Fac.': 'Mud Bricks',
  'Tapestry Loom': 'Tapestries',
  'Ceramics Wkshp': 'Ceramics',
  'Illuminated Scr.': 'Scriptures',
  'Lanternmaker': 'Lanterns',
};

export const productionChainsFixed: ProductionChain[] = productionChains.map(pc => ({
  ...pc,
  outputProduct: OUTPUT_PRODUCT_MAP[pc.name] || pc.outputProduct,
}));

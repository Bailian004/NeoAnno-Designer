import icons from '../Helpful_info/icons.json';
import presets from '../Helpful_info/presets.json';
import { productionChains } from './generatedProductionChains';

// Build a mapping from known building names to icon filenames using Helpful_info/icons.json and presets.json
// The JSON items have Localizations.eng values; we normalize and match

const normalize = (s: string) => s
  .toLowerCase()
  .replace(/^a[0-9]{1,2}_/, '')
  .replace(/_/g, ' ')
  .replace(/\./g, '')
  .replace(/\s+/g, ' ')
  .trim();

// Precompute a set of candidate building names from productionChains
const buildingNames = new Set<string>(productionChains.map(c => c.name));

// Additional synonym mapping for names that differ slightly
const synonyms: Record<string, string[]> = {
  'Schnapps Distill.': ['distillery', 'schnapps distillery', 'schnapps'],
  'Framework Knit.': ['framework knitters', 'framework knitter', 'work clothes', 'working clothes'],
  'Flour Mill': ['flour mill', 'mill'],
  'Grain Farm': ['grain farm', 'wheat farm'],
  'Pig Farm': ['pig farm', 'pigs'],
  'Steelworks': ['steelworks', 'steel works'],
  'Weapon Factory': ['weapon factory', 'weapons'],
  'Fishery': ['fishery', 'fish factory', 'fishing wharf'],
  'Sawmill': ['sawmill', 'timber yard'],
  'Hop Farm': ['hop farm', 'hops farm'],
  'Brewery': ['brewery', 'beer brewery'],
  'Bakery': ['bakery', 'bread bakery'],
  'Malthouse': ['malthouse', 'malt house'],
  'Clay Pit': ['clay pit', 'claypit'],
  'Brick Factory': ['brick factory', 'brickworks', 'brick works'],
  'Iron Mine': ['iron mine', 'iron ore mine'],
  'Sand Mine': ['sand mine', 'quartz quarry', 'quartz sand mine'],
  'Potato Farm': ['potato farm', 'potatoes farm'],
  'Sheep Farm': ['sheep farm', 'sheep pasture'],
  'Soap Factory': ['soap factory', 'soap works'],
  'Rendering Works': ['rendering works', 'tallow works', 'rendering factory'],
  'Lumberjack\'s Hut': ['lumberjacks hut', 'woodcutter', 'foresters hut', 'lumber hut', 'lumberjack hut'],
  'Fur Dealer': ['fur dealer', 'fur trade'],
  'Heavy Weapons': ['heavy weapons factory', 'weapon factory', 'weapons factory', 'heavy weapon factory'],
  'Cannery': ['cannery', 'canning factory'],
  'Slaughterhouse': ['slaughterhouse', 'butcher'],
  'Sewing M. Fac.': ['sewing machine factory', 'sewing machines factory'],
  'Bicycle Factory': ['bicycle factory', 'bikes factory', 'penny farthing'],
  'Spectacle Fac.': ['spectacle factory', 'glasses factory', 'spectacles factory'],
  'Clockmakers': ['clockmakers', 'pocket watch factory', 'watches factory'],
  'Light Bulb Fac.': ['light bulb factory', 'light bulbs factory', 'electric lamp'],
  'Filament Fac.': ['filament factory', 'carbon filament factory'],
  'Oil Lamp Fac.': ['oil lamp factory', 'oil lamps factory'],
  'Coachmakers': ['coachmakers', 'coach maker', 'carriages factory'],
  'Sailmakers': ['sailmakers', 'sail maker', 'sails factory'],
  'Glassmakers': ['glassmakers', 'glass maker', 'windows factory'],
  'Goldsmiths': ['goldsmiths', 'gold smith', 'jewelry manufactory'],
  'Jewellers': ['jewellers', 'jeweler', 'jewelry'],
  'Coffee Roaster': ['coffee roaster', 'coffee roasting house'],
  'Chocolate Fac.': ['chocolate factory', 'chocolate works'],
  'Cigar Factory': ['cigar factory', 'cigars factory'],
  'Caribou Hunting': ['caribou hunting cabin', 'caribou hunt'],
  'Hunting Cabin': ['hunting cabin', 'hunters cabin', 'bear hunting cabin'],
  'Whaling Station': ['whaling station', 'whale oil'],
  'Fish Oil Factory': ['fish oil factory', 'seal hunting'],
  'Parka Factory': ['parka factory', 'parkas factory'],
  'Sleeping Bag': ['sleeping bag factory', 'sleeping bags'],
  'Husky Sled Fac.': ['husky sled factory', 'sleds factory', 'sled frame factory'],
  'Alpaca Farm': ['alpaca farm', 'alpaca wool', 'alpacas'],
  'Pearl Farm': ['pearl farm', 'pearls fishery', 'pearl fisher'],
  'Cotton Plant.': ['cotton plantation', 'cotton farm'],
  'Cocoa Plant.': ['cocoa plantation', 'cocoa farm'],
  'Tobacco Plant.': ['tobacco plantation', 'tobacco farm'],
  'Sugar Cane Plt.': ['sugar cane plantation', 'sugar cane farm', 'cane sugar'],
  'Plantain Plant.': ['plantain plantation', 'plantains farm'],
  'Hibiscus Farm': ['hibiscus farm', 'hibiscus tea'],
  'Red Pepper Farm': ['red pepper farm', 'peppers farm', 'hot sauce'],
  'Felt Producer': ['felt producer', 'felt factory'],
  'Bowler Hat Mkr.': ['bowler hat maker', 'bowler hats factory', 'hats'],
  'Poncho Darner': ['poncho darner', 'ponchos factory'],
  'Tapestry Loom': ['tapestry loom', 'tapestries factory'],
  'Ceramics Wkshp': ['ceramics workshop', 'ceramics factory'],
  'Mud Brick Fac.': ['mud brick factory', 'mud bricks', 'brick dry-house'],
  'Dried Meat Fac.': ['dried meat factory', 'dry-house', 'dried meat'],
  'Fried Plantain': ['fried plantain kitchen', 'fried plantains'],
  'Tortilla Maker': ['tortilla maker', 'tortillas kitchen'],
  'Pemmican Cook.': ['pemmican cookhouse', 'pemmican factory'],
  'Artisanal Kit.': ['artisanal kitchen', 'wat kitchen', 'jalea kitchen'],
  'Illuminated Scr.': ['illuminated script workshop', 'luminer', 'scriptures'],
  'Lanternmaker': ['lanternmaker', 'lanternsmith', 'lanterns factory'],
  'Farmer Residence': ['farmer house', 'farmers residence'],
  'Worker Residence': ['worker house', 'workers residence'],
  'Artisan Res.': ['artisan house', 'artisans residence'],
  'Engineer Res.': ['engineer house', 'engineers residence'],
  'Investor Res.': ['investor house', 'investors residence', 'investor villa'],
  'Jornalero Res.': ['jornalero house', 'jornaleros residence'],
  'Obrero Res.': ['obrero house', 'obreros residence'],
  'Bank': ['bank', 'investors bank'],
  'School': ['school', 'elementary school'],
  'University': ['university', 'engineers university'],
  'Variety Theatre': ['variety theatre', 'variety theater', 'theater'],
  'Boxing Arena': ['boxing arena', 'boxing club'],
  'Members Club': ['members club', "member's club", 'club house'],
};

// Build reverse lookup of normalized helpful labels -> icon filename
const helpfulLabelToIcon = new Map<string, string>();

// 1. Load from icons.json
(icons as Array<{ IconFilename: string; Localizations?: any }>).forEach(item => {
  const eng = item?.Localizations?.eng as string | undefined;
  if (!eng) return;
  const label = normalize(eng);
  helpfulLabelToIcon.set(label, item.IconFilename);
});

// 2. Load from presets.json A7 buildings (Anno 1800)
interface PresetBuilding {
  Header?: string;
  IconFileName?: string;
  Localization?: { eng?: string };
}
const presetsData = presets as { Buildings?: PresetBuilding[] };
const a7Buildings = (presetsData.Buildings || []).filter(b => 
  b?.Header?.includes('(A7)') && b?.IconFileName && b?.Localization?.eng
);
a7Buildings.forEach(b => {
  const eng = b.Localization!.eng!;
  const label = normalize(eng);
  // Presets is authoritative for A7, so overwrite if present
  if (b.IconFileName) {
    helpfulLabelToIcon.set(label, b.IconFileName);
  }
});

// Map building names to matched icon filenames
const buildingToHelpfulIcon = new Map<string, string>();
for (const name of buildingNames) {
  const n = normalize(name);
  // direct match
  if (helpfulLabelToIcon.has(n)) {
    buildingToHelpfulIcon.set(name, helpfulLabelToIcon.get(n)!);
    continue;
  }
  // synonyms
  const syns = synonyms[name];
  if (syns) {
    for (const s of syns) {
      const sn = normalize(s);
      // try exact
      if (helpfulLabelToIcon.has(sn)) {
        buildingToHelpfulIcon.set(name, helpfulLabelToIcon.get(sn)!);
        break;
      }
      // try contains
      for (const [label, file] of helpfulLabelToIcon.entries()) {
        if (label.includes(sn) || sn.includes(label)) {
          buildingToHelpfulIcon.set(name, file);
          break;
        }
      }
      if (buildingToHelpfulIcon.has(name)) break;
    }
  }
}

export function getHelpfulBuildingIcon(buildingName: string): string | undefined {
  return buildingToHelpfulIcon.get(buildingName);
}

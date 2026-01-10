import fs from 'fs';
import path from 'path';

const root = process.cwd();

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// Load production rates from data/productionRates.ts via eval-safe conversion
const prodRatesText = read('data/productionRates.ts');
const ratesMatch = prodRatesText.match(/\{[\s\S]*\}\s*;/);
if (!ratesMatch) throw new Error('productionRates not found');
const productionRates = new Function(`return (${ratesMatch[0].replace(/;$/, '')});`)();

// Load reference production chains
const refChains = JSON.parse(read('data/reference/production-chains.json')).Production_Chain;

const regionMap = {
  1: 'Old World',
  2: 'New World',
  4: 'Arctic',
  5: 'Enbesa',
  3: 'Cape Trelawney'
};

const buildChainNode = (child) => ({
  buildingId: child.name,
  count: 1,
  alternatives: child.alternative ? [child.alternative] : undefined,
  inputs: child.children ? child.children.map(buildChainNode) : undefined,
});

const productionBuckets = { 'Old World': [], 'New World': [], 'Arctic': [], 'Enbesa': [], 'Cape Trelawney': [] };

Object.values(refChains).forEach(rc => {
  const region = regionMap[rc.regionID] || 'Old World';
  const outputPerMinute = productionRates[rc.name] ?? 1;
  productionBuckets[region].push({
    productId: rc.finalProduct,
    productName: rc.finalProduct,
    region,
    buildingId: rc.name,
    outputPerMinute,
    workforceType: undefined,
    workforceAmount: undefined,
    electricityBoost: false,
    chain: rc.children ? rc.children.map(buildChainNode) : [],
  });
});

// Load consumption from data/goodConsumption.ts (object literal JSON)
const consText = read('data/goodConsumption.ts');
const consMatch = consText.match(/export const GOOD_CONSUMPTION:[^=]*=\s*(\{[\s\S]*?\});/);
if (!consMatch) throw new Error('goodConsumption object not found');
const goodConsumption = new Function(`return (${consMatch[1]});`)();

const consumptionBuckets = { 'Old World': [], 'New World': [], 'Arctic': [], 'Enbesa': [] };
const tierRegion = {
  Farmers: 'Old World', Workers: 'Old World', Artisans: 'Old World', Engineers: 'Old World', Investors: 'Old World', Scholars: 'Old World',
  Jornaleros: 'New World', Obreros: 'New World',
  Explorers: 'Arctic', Technicians: 'Arctic',
  Shepherds: 'Enbesa', Elders: 'Enbesa'
};
Object.entries(goodConsumption).forEach(([tier, needs]) => {
  const region = tierRegion[tier];
  if (!region) return;
  consumptionBuckets[region].push({ tierId: tier, region, needs: needs.map(n => ({ goodId: n.good, amountPer1000: n.tonsPer1000PerMinute })) });
});

// Load residents from generatedResidences.ts using eval
const residencesText = read('data/generatedResidences.ts');
const arrMatch = residencesText.match(/export const residenceBuildings: ResidenceBuilding\[] = ([\s\S]*?);\n/);
let residences = [];
if (arrMatch) {
  const js = arrMatch[1];
  const fn = new Function(`return (${js});`);
  residences = fn();
}
const residentBuckets = { 'Old World': [], 'New World': [], 'Arctic': [], 'Enbesa': [] };
residences.forEach(r => {
  const regionMapName = {
    'The Old World': 'Old World',
    'The New World': 'New World',
    'The Arctic': 'Arctic',
    'Enbesa': 'Enbesa'
  };
  const region = regionMapName[r.region] || 'Old World';
  const tierId = r.tier;
  residentBuckets[region].push({
    tierId,
    region,
    capacityPerHouse: 0,
    houseIds: r.identifier ? [r.identifier] : [],
    icon: r.icon
  });
});

// Goods catalog (from production rates keys and consumption goods)
const goodsSet = new Set();
Object.values(productionBuckets).flat().forEach(p => goodsSet.add(p.productName));
Object.values(consumptionBuckets).flat().forEach(c => c.needs.forEach(n => goodsSet.add(n.goodId)));
const goodsCatalog = Array.from(goodsSet).map(name => ({ goodId: name, name, regions: [] }));

// Write helpers
const writeTS = (p, exportName, data) => {
  const content = `import { ${exportName.includes('production') ? 'ProductionChain' : exportName.includes('consumption') ? 'ConsumptionTier' : exportName.includes('buildings') ? 'BuildingInfo' : exportName.includes('residents') ? 'ResidentTier' : 'GoodInfo'} } from '../types';\n\nexport const ${exportName}: any = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(path.join(root, p), content, 'utf8');
};

writeTS('data/anno1800/productionChains/old-world.ts', 'productionChainsOldWorld', productionBuckets['Old World']);
writeTS('data/anno1800/productionChains/new-world.ts', 'productionChainsNewWorld', productionBuckets['New World']);
writeTS('data/anno1800/productionChains/arctic.ts', 'productionChainsArctic', productionBuckets['Arctic']);
writeTS('data/anno1800/productionChains/enbesa.ts', 'productionChainsEnbesa', productionBuckets['Enbesa']);

writeTS('data/anno1800/consumption/old-world.ts', 'consumptionOldWorld', consumptionBuckets['Old World']);
writeTS('data/anno1800/consumption/new-world.ts', 'consumptionNewWorld', consumptionBuckets['New World']);
writeTS('data/anno1800/consumption/arctic.ts', 'consumptionArctic', consumptionBuckets['Arctic']);
writeTS('data/anno1800/consumption/enbesa.ts', 'consumptionEnbesa', consumptionBuckets['Enbesa']);

writeTS('data/anno1800/residents/old-world.ts', 'residentsOldWorld', residentBuckets['Old World']);
writeTS('data/anno1800/residents/new-world.ts', 'residentsNewWorld', residentBuckets['New World']);
writeTS('data/anno1800/residents/arctic.ts', 'residentsArctic', residentBuckets['Arctic']);
writeTS('data/anno1800/residents/enbesa.ts', 'residentsEnbesa', residentBuckets['Enbesa']);

// Goods catalog
const goodsContent = `import { GoodInfo } from '../types';\n\nexport const goodsCatalog: GoodInfo[] = ${JSON.stringify(goodsCatalog, null, 2)};\n`;
fs.writeFileSync(path.join(root, 'data/anno1800/goods/catalog.ts'), goodsContent, 'utf8');

console.log('Migration completed.');

import fs from 'fs';

const regions = ['old-world','new-world','arctic','enbesa'];

const renameMaps = {
  'old-world': {
    "Lumberjack's Hut": 'Lumberjack Hut',
    'Schnapps Distill.': 'Schnapps Distillery',
    'Framework Knit.': 'Framework Knitters',
    'Artisanal Kit.': 'Artisanal Kitchen',
    'Sewing M. Fac.': 'Sewing Machine Factory',
    'Spectacle Fac.': 'Spectacle Factory',
    'Heavy Weapons': 'Heavy Weapons Factory',
    'Motor Assembly': 'Motor Assembly Line',
    'Light Bulb Fac.': 'Light Bulb Factory'
  },
  'new-world': {
    'Plantain Plant.': 'Plantain Plantation',
    'Fried Plantain': 'Fried Plantain Kitchen',
    'Sugar Cane Plt.': 'Sugar Cane Plantation',
    'Cotton Plant.': 'Cotton Plantation',
    'Coffee Plant.': 'Coffee Plantation',
    'Bowler Hat Mkr.': 'Felt Producer',
    'Tobacco Plant.': 'Tobacco Plantation',
    'Cocoa Plant.': 'Cocoa Plantation',
    'Chocolate Fac.': 'Chocolate Factory'
  },
  'arctic': {
    'Caribou Hunting': 'Caribou Hunting Cabin',
    'Pemmican Cook.': 'Pemmican Cookhouse',
    'Sleeping Bag': 'Sleeping Bag Factory',
    'Oil Lamp Fac.': 'Oil Lamps Factory',
    'Husky Sled Fac.': 'Husky Sled Factory'
  },
  'enbesa': {
    'Sangha Cow Farm': 'Sanga Farm',
    'Dried Meat Fac.': 'Dry-House',
    'Finery': 'Embroiderer',
    'Tea Spice Blend': 'Tea Spicer',
    'Mud Brick Fac.': 'Brick Dry-House',
    'Tapestry Loom': 'Tapestry Looms',
    'Ceramics Wkshp': 'Ceramics Workshop',
    'Lanternmaker': 'Luminer'
  }
};

function collectIds(node, target){
  if(!node || typeof node !== 'object') return;
  if(node.buildingId) target.add(node.buildingId);
  if(Array.isArray(node.inputs)) node.inputs.forEach(child=>collectIds(child, target));
  if(Array.isArray(node.chain)) node.chain.forEach(child=>collectIds(child, target));
}

function loadArray(file){
  const txt=fs.readFileSync(file,'utf8');
  const m=txt.match(/export const [^=]+ = ([\s\S]*);/);
  if(!m) return [];
  return JSON.parse(m[1]);
}

function saveArray(file, exportName, arr){
  const content = `import { BuildingInfo } from '../types';\n\nexport const ${exportName}: BuildingInfo[] = ${JSON.stringify(arr, null, 2)};\n`;
  fs.writeFileSync(file, content, 'utf8');
}

regions.forEach(region=>{
  const file = `data/anno1800/buildings/${region}.ts`;
  const exportName = `buildings${region.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join('')}`;
  const regionName = region.split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
  const arr = loadArray(file);
  const rename = renameMaps[region] || {};
  arr.forEach(b => {
    const newName = rename[b.buildingId];
    if (newName) {
      b.buildingId = newName;
      b.name = newName;
    }
  });
  const chains = loadArray(`data/anno1800/productionChains/${region}.ts`);
  const required = new Set();
  chains.forEach(chain=>collectIds(chain, required));

  const deduped = [];
  const seen = new Set();
  arr.forEach(b=>{
    if(!required.has(b.buildingId) || seen.has(b.buildingId)) return;
    deduped.push(b);
    seen.add(b.buildingId);
  });

  required.forEach(id=>{
    if(!seen.has(id)){
      deduped.push({ buildingId:id, name:id, region: regionName, type:'Production' });
    }
  });

  saveArray(file, exportName, deduped);
  console.log(`Processed ${region}, total ${deduped.length}`);
});

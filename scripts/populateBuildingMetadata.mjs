import fs from 'fs';
import path from 'path';

const summary = JSON.parse(fs.readFileSync('./data/generatedSummary.json', 'utf8'));
const workforce = JSON.parse(fs.readFileSync('./data/extracted/buildingWorkforce.json', 'utf8'));

const regionMap = {
  'The Old World': 'Old World',
  'The New World': 'New World',
  'The Arctic': 'Arctic',
  'Enbesa': 'Enbesa'
};

const buildingBuckets = {
  'Old World': [],
  'New World': [],
  'Arctic': [],
  'Enbesa': []
};

summary.buildings.forEach(b => {
  const region = regionMap[b.region];
  if (!region) return;
  
  // Only include production and public service buildings (residences already handled)
  if (b.type === 'Residence') return;
  
  const building = {
    buildingId: b.name,
    name: b.name,
    region,
    type: b.type,
    size: { width: b.size?.x || 3, height: b.size?.z || 3 },
    radius: b.range?.range || undefined,
    workforceType: b.workforce?.type || (b.workforce?.amount ? 'Workers' : undefined),
    workforceAmount: b.workforce?.amount || undefined,
    maintenance: undefined, // Could extract from params if needed
    icon: b.icon,
    identifier: b.identifier
  };
  
  buildingBuckets[region].push(building);
});

// Write to files
const writeTS = (regionFile, exportName, data) => {
  const content = `import { BuildingInfo } from '../types';\n\nexport const ${exportName}: any = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(`./data/anno1800/buildings/${regionFile}.ts`, content, 'utf8');
};

writeTS('old-world', 'buildingsOldWorld', buildingBuckets['Old World']);
writeTS('new-world', 'buildingsNewWorld', buildingBuckets['New World']);
writeTS('arctic', 'buildingsArctic', buildingBuckets['Arctic']);
writeTS('enbesa', 'buildingsEnbesa', buildingBuckets['Enbesa']);

console.log('Building metadata populated:');
Object.entries(buildingBuckets).forEach(([region, buildings]) => {
  console.log(`  ${region}: ${buildings.length} buildings`);
});

console.log('\nSample Arctic buildings:');
buildingBuckets['Arctic'].slice(0, 5).forEach(b => {
  console.log(`  ${b.name.padEnd(25)} | ${b.size.width}x${b.size.height} | Workforce: ${b.workforceAmount || 'N/A'}`);
});

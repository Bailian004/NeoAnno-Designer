import fs from 'fs';
import path from 'path';

const summaryPath = './data/generatedSummary.json';
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

const regionMap = {
  'The Old World': 'Old World',
  'The New World': 'New World',
  'The Arctic': 'Arctic',
  'Enbesa': 'Enbesa',
};

const buckets = {
  'Old World': [],
  'New World': [],
  'Arctic': [],
  'Enbesa': [],
};

summary.buildings.forEach(b => {
  const region = regionMap[b.region];
  if (!region) return;
  const size = b.size ? { width: b.size.x, height: b.size.z } : undefined;
  const radius = b.range && b.range.range ? b.range.range : undefined;
  const workforceType = b.workforce ? b.workforce.type : undefined;
  const workforceAmount = b.workforce ? b.workforce.amount : undefined;
  const maintenance = b.maintenances || b.maintenance || null; // not present in summary
  buckets[region].push({
    buildingId: b.name,
    name: b.name,
    region,
    type: b.type,
    size,
    radius,
    workforceType,
    workforceAmount,
    maintenance: maintenance || undefined,
    icon: b.icon,
    identifier: b.identifier,
  });
});

const fileName = (region) => region.toLowerCase().replace(/\s+/g, '-');

const writeRegion = (region, exportName) => {
  const outPath = `./data/anno1800/buildings/${fileName(region)}.ts`;
  const data = buckets[region];
  const content = `import { BuildingInfo } from '../types';\n\nexport const ${exportName}: BuildingInfo[] = ${JSON.stringify(data, null, 2)};\n`;
  fs.writeFileSync(outPath, content, 'utf8');
};

writeRegion('Old World', 'buildingsOldWorld');
writeRegion('New World', 'buildingsNewWorld');
writeRegion('Arctic', 'buildingsArctic');
writeRegion('Enbesa', 'buildingsEnbesa');

console.log('Buildings migrated from generatedSummary.json');

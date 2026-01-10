import fs from 'fs';
import path from 'path';

const capacities = JSON.parse(fs.readFileSync('./data/extracted/residenceCapacities.json', 'utf8'));

const regionMap = {
  1: 'Old World',
  5000000: 'Old World',
  5000001: 'New World',
  160001: 'Arctic',
  114327: 'Enbesa'
};

const tierMapping = {
  'Farmer Residence': { tierId: 'Farmers', region: 'Old World' },
  'Worker Residence': { tierId: 'Workers', region: 'Old World' },
  'Artisan Residence': { tierId: 'Artisans', region: 'Old World' },
  'Engineer Residence': { tierId: 'Engineers', region: 'Old World' },
  'Investor Residence': { tierId: 'Investors', region: 'Old World' },
  'Jornalero Residence': { tierId: 'Jornaleros', region: 'New World' },
  'Obrero Residence': { tierId: 'Obreros', region: 'New World' },
  'Explorer Shelter': { tierId: 'Explorers', region: 'Arctic' },
  'Technician Shelter': { tierId: 'Technicians', region: 'Arctic' },
  'Shepherd Residence': { tierId: 'Shepherds', region: 'Enbesa' },
  'Elder Residence': { tierId: 'Elders', region: 'Enbesa' },
  'Scholar Residence': { tierId: 'Scholars', region: 'Old World' }
};

// Load existing residents files
const loadResidents = (region) => {
  const filePath = `./data/anno1800/residents/${region}.ts`;
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/export const residents\w+: any = (\[[\s\S]*\]);/);
  if (!match) return [];
  return JSON.parse(match[1]);
};

['old-world', 'new-world', 'arctic', 'enbesa'].forEach(regionFile => {
  const residents = loadResidents(regionFile);
  
  residents.forEach(r => {
    // Find capacity in extracted data
    const residenceEntry = Object.entries(capacities).find(([name]) => {
      const mapped = tierMapping[name];
      return mapped && mapped.tierId === r.tierId && mapped.region === r.region;
    });
    
    if (residenceEntry) {
      r.capacityPerHouse = residenceEntry[1].capacity;
      console.log(`Updated ${r.tierId} (${r.region}): capacity = ${r.capacityPerHouse}`);
    }
  });
  
  // Write back
  const exportName = `residents${regionFile.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`;
  const content = `import { ResidentTier } from '../types';\n\nexport const ${exportName}: any = ${JSON.stringify(residents, null, 2)};\n`;
  fs.writeFileSync(`./data/anno1800/residents/${regionFile}.ts`, content, 'utf8');
});

console.log('\nResident capacities updated!');

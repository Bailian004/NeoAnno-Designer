import fs from 'fs';
import path from 'path';

const paramsPath = './Helpful_info/Anno1800Calculator-master/js/params.js';
const content = fs.readFileSync(paramsPath, 'utf8');

// Extract residence capacity data
const residenceData = [];
const residenceRegex = /"name"\s*:\s*"([^"]+)"[\s\S]*?"residentMax"\s*:\s*(\d+)[\s\S]*?"guid"\s*:\s*(\d+)/g;
let match;

while ((match = residenceRegex.exec(content)) !== null) {
  const [, name, capacity, guid] = match;
  residenceData.push({ name, capacity: parseInt(capacity), guid: parseInt(guid) });
}

console.log('=== RESIDENCE CAPACITIES ===\n');
residenceData.forEach(r => {
  if (r.name.includes('Farmer') || r.name.includes('Worker') || r.name.includes('Artisan') || 
      r.name.includes('Engineer') || r.name.includes('Investor') || r.name.includes('Jornalero') || 
      r.name.includes('Obrero') || r.name.includes('Explorer') || r.name.includes('Technician') ||
      r.name.includes('Shepherd') || r.name.includes('Elder') || r.name.includes('Scholar')) {
    console.log(`${r.name.padEnd(30)} | Capacity: ${String(r.capacity).padStart(3)} | GUID: ${r.guid}`);
  }
});

// Extract building dimensions and workforce
const buildingData = [];
const buildingRegex = /"name"\s*:\s*"([^"]+)"[\s\S]{0,2000}?"BlockWidth"\s*:\s*(\d+)[\s\S]{0,100}?"BlockHeight"\s*:\s*(\d+)/g;

while ((match = buildingRegex.exec(content)) !== null) {
  const [, name, width, height] = match;
  buildingData.push({ name, width: parseInt(width), height: parseInt(height) });
}

console.log('\n=== BUILDING DIMENSIONS (Sample) ===\n');
buildingData.slice(0, 20).forEach(b => {
  console.log(`${b.name.padEnd(35)} | ${b.width}x${b.height}`);
});

console.log(`\nTotal residences found: ${residenceData.length}`);
console.log(`Total buildings with dimensions: ${buildingData.length}`);

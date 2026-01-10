import fs from 'fs';
import path from 'path';

const paramsPath = './Helpful_info/Anno1800Calculator-master/js/params.js';
const content = fs.readFileSync(paramsPath, 'utf8');

// Split into building objects
const blocks = content.split('"guid"').map((b, i) => ({ i, txt: '"guid"' + b })).slice(1);

const residenceCapacities = {};
const buildingDimensions = {};
const buildingWorkforce = {};
const buildingMaintenance = {};

blocks.forEach(({ txt }) => {
  const nameMatch = txt.match(/"name"\s*:\s*"([^"]+)"/);
  const guidMatch = txt.match(/"guid"\s*:\s*(\d+)/);
  const residentMaxMatch = txt.match(/"residentMax"\s*:\s*(\d+)/);
  const regionMatch = txt.match(/"region"\s*:\s*(\d+)/);
  
  if (!nameMatch || !guidMatch) return;
  
  const name = nameMatch[1];
  const guid = parseInt(guidMatch[1]);
  const region = regionMatch ? parseInt(regionMatch[1]) : null;
  
  // Residence capacities
  if (residentMaxMatch) {
    residenceCapacities[name] = {
      capacity: parseInt(residentMaxMatch[1]),
      guid,
      region
    };
  }
  
  // Dimensions (BlockWidth/BlockHeight)
  const widthMatch = txt.match(/"BlockWidth"\s*:\s*(\d+)/);
  const heightMatch = txt.match(/"BlockHeight"\s*:\s*(\d+)/);
  if (widthMatch && heightMatch) {
    buildingDimensions[name] = {
      width: parseInt(widthMatch[1]),
      height: parseInt(heightMatch[1]),
      guid,
      region
    };
  }
  
  // Workforce (maintenances with Product: 1010017)
  const maintenancesMatch = txt.match(/"maintenances"\s*:\s*\[([\s\S]*?)\]/);
  if (maintenancesMatch) {
    const maint = maintenancesMatch[1];
    const workforceMatch = maint.match(/"Product"\s*:\s*1010017[\s\S]*?"Amount"\s*:\s*(\d+)/);
    if (workforceMatch) {
      buildingWorkforce[name] = {
        amount: parseInt(workforceMatch[1]),
        guid,
        region
      };
    }
  }
});

// Write JSON outputs
fs.writeFileSync('./data/extracted/residenceCapacities.json', JSON.stringify(residenceCapacities, null, 2));
fs.writeFileSync('./data/extracted/buildingDimensions.json', JSON.stringify(buildingDimensions, null, 2));
fs.writeFileSync('./data/extracted/buildingWorkforce.json', JSON.stringify(buildingWorkforce, null, 2));

console.log('Extracted:');
console.log(`  ${Object.keys(residenceCapacities).length} residence capacities`);
console.log(`  ${Object.keys(buildingDimensions).length} building dimensions`);
console.log(`  ${Object.keys(buildingWorkforce).length} building workforce requirements`);

// Show samples
console.log('\n=== Residence Capacity Samples ===');
Object.entries(residenceCapacities).filter(([name]) => 
  name.includes('Explorer') || name.includes('Technician') || name.includes('Shepherd') || name.includes('Elder')
).forEach(([name, data]) => {
  console.log(`${name.padEnd(30)} | Capacity: ${data.capacity} | Region: ${data.region}`);
});

console.log('\n=== Production Building Dimension Samples ===');
Object.entries(buildingDimensions).filter(([name]) => 
  name.includes('Factory') || name.includes('Cookhouse') || name.includes('Workshop')
).slice(0, 10).forEach(([name, data]) => {
  console.log(`${name.padEnd(35)} | ${data.width}x${data.height} | Region: ${data.region}`);
});

/**
 * Generate missing building definitions from reference producers.json
 * Creates TypeScript code to append to GAME_LOGIC_OVERRIDES in annoData.ts
 */
const fs = require('fs');
const normalize=str=>(str||'').toLowerCase().replace(/[^a-z0-9]/g,'');

const producers = JSON.parse(fs.readFileSync('Anno-1800-Calculator-main/src/data/producers.json','utf8'));
const src = fs.readFileSync('data/annoData.ts','utf8');

const our = new Set();
for(const m of src.matchAll(/Identifier:"([^"]+)"/g)) our.add(normalize(m[1]));
for(const m of src.matchAll(/Localization:\{eng:"([^"]+)"/g)) our.add(normalize(m[1]));

const categoryMap = {
  'Electricity': 'Production',
  'Wood': 'Production',
  'Iron': 'Production',
  'Coal': 'Production',
  'Oil': 'Production',
  'Furs': 'Production',
  'Clay': 'Production',
  'Pipes': 'Production',
  'Paper': 'Production',
  'Fuel': 'Production',
  'Fish': 'Production',
  'Potatoes': 'Production',
  'Wool': 'Production',
  'Sails': 'Production',
  'Malt': 'Production',
  'Sand': 'Production',
  'Glass': 'Production',
  'Sewing Machines': 'Production',
  'Sugar Cane': 'Production',
  'Rum': 'Production',
  'Fur Coats': 'Production',
  'Cement': 'Production',
  'Zinc': 'Production',
  'Copper': 'Production',
  'Penny Farthingss': 'Production',
  'Champagne': 'Production',
  'Jewelry': 'Production',
  'Fish Oil': 'Production',
  'Plantains': 'Production',
  'Fried Plantains': 'Production',
  'Cotton Fabric': 'Production',
  'Alpaca Wool': 'Production',
  'Ponchos': 'Production',
  'Tortillas': 'Production',
  'Coffee': 'Production',
  'Felt': 'Production',
  'Bowler Hats': 'Production',
  'Cigars': 'Production',
  'Sugar': 'Production'
};

function guessWorkforceType(cycle, product) {
  // Heuristic: higher cycle times suggest higher tier workers
  if(cycle > 60) return 'Engineer';
  if(cycle > 30) return 'Worker';
  return 'Farmer';
}

const missing = [];
for(const [k, p] of Object.entries(producers)) {
  if(!our.has(normalize(p.building))) {
    missing.push(p);
  }
}

// Generate TypeScript code
let output = '// Auto-generated missing building overrides from Anno-1800-Calculator reference\n';
output += '// Generated: ' + new Date().toISOString() + '\n';
output += '// These supplement the main GAME_LOGIC_OVERRIDES\n\n';
output += 'export const MISSING_BUILDING_OVERRIDES: Record<string, any> = {\n';

missing.forEach((p, idx) => {
  const cycle = p.productionTime || 30;
  const workforce = guessWorkforceType(cycle, p.product);
  const category = categoryMap[p.product] || 'Production';
  
  output += `  "${p.building}": {\n`;
  output += `    name: '${p.building}',\n`;
  output += `    category: '${category}',\n`;
  if(cycle > 0) {
    output += `    production: { outputs: [{ resourceId: '${normalize(p.product)}', amount: 1 }], workforce: { type: '${workforce}', amount: 10 }, cycleTime: ${cycle} }\n`;
  }
  output += `  },\n`;
});

output += '};\n';
console.log(output);
console.log(`\n// Total generated: ${missing.length} missing producers`);

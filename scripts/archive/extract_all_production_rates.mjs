import fs from 'fs';

// Load params.js and extract all tpmin values
const paramsContent = fs.readFileSync('./Helpful_info/Anno1800Calculator-master/js/params.js', 'utf-8');

// Extract all factory objects with tpmin
// Match factory blocks: find tpmin first, then look backwards/forwards for name
const factoryBlocks = paramsContent.match(/\{[^}]*"tpmin":[^}]*\}/g) || [];
const productionRates = {};

factoryBlocks.forEach(block => {
  const tpminMatch = block.match(/"tpmin":\s*([\d.]+)/);
  const nameMatch = block.match(/"name":\s*"([^"]+)"/);
  
  if (tpminMatch && nameMatch) {
    const tpmin = parseFloat(tpminMatch[1]);
    const name = nameMatch[1];
    productionRates[name] = tpmin;
  }
});

console.log('=== EXTRACTED PRODUCTION RATES FROM PARAMS.JS ===\n');
console.log(`Found ${Object.keys(productionRates).length} buildings with production rates\n`);

// Load industryData.ts to find current rates
const industryContent = fs.readFileSync('./data/industryData.ts', 'utf-8');

// Extract from PRODUCTION_CHAINS (legacy)
const legacyRegex = /id:\s*'([^']+)',\s*name:\s*'[^']+',\s*buildingId:\s*'([^']+)',\s*outputPerMinute:\s*([\d.]+)/g;
const currentRates = {};
let legacyMatch;

while ((legacyMatch = legacyRegex.exec(industryContent)) !== null) {
  const [, id, buildingId, outputPerMinute] = legacyMatch;
  currentRates[id] = {
    buildingId,
    currentRate: parseFloat(outputPerMinute)
  };
}

console.log(`Found ${Object.keys(currentRates).length} production chains in industryData.ts\n`);
console.log('=== RATE COMPARISON ===\n');
console.log('Product'.padEnd(30) + ' | Building'.padEnd(35) + ' | Current | Reference | Status');
console.log('-'.repeat(110));

let mismatches = 0;
let matches = 0;
let missing = 0;

Object.entries(currentRates).forEach(([product, data]) => {
  const refRate = productionRates[data.buildingId];
  const status = refRate === undefined ? '?' : 
                 refRate === data.currentRate ? '✓' : '✗';
  
  if (status === '✗') mismatches++;
  if (status === '✓') matches++;
  if (status === '?') missing++;
  
  const refDisplay = refRate === undefined ? 'NOT FOUND' : refRate.toString().padStart(9);
  
  console.log(
    product.padEnd(30) + ' | ' +
    data.buildingId.padEnd(35) + ' | ' +
    data.currentRate.toString().padStart(7) + ' | ' +
    refDisplay + ' | ' +
    status
  );
});

console.log('\n=== SUMMARY ===');
console.log(`✓ Matches: ${matches}`);
console.log(`✗ Mismatches: ${mismatches}`);
console.log(`? Reference not found: ${missing}`);
console.log(`\nTotal: ${Object.keys(currentRates).length}`);

// Show some critical ones
console.log('\n=== CRITICAL ARCTIC/ENBESA BUILDINGS ===');
const critical = ['Pemmican Cookhouse', 'Oil Lamp Factory', 'Sleeping Bag Factory', 
                  'Husky Sled Factory', 'Parka Embroiderer', 'Canning Factory',
                  'Goat Milk Factory', 'Dried Meat Factory', 'Finery Factory'];

critical.forEach(building => {
  const rate = productionRates[building];
  if (rate !== undefined) {
    console.log(`${building.padEnd(30)} : ${rate} t/min`);
  } else {
    console.log(`${building.padEnd(30)} : NOT FOUND`);
  }
});

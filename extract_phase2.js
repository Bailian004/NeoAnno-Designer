// Extract remaining buildings and workforce tiers
const fs = require('fs');
const path = require('path');

// Read the reference file
const filePath = path.join('/workspaces/NeoAnno-Designer/Helpful_info/Anno1800Calculator-master/js/params.js');
const content = fs.readFileSync(filePath, 'utf-8');

// Extract using regex to find the factories object
const match = content.match(/factories\s*=\s*\{([^]*?)\n\}/);
if (!match) {
  console.error('Could not find factories object');
  process.exit(1);
}

// Create a scope with window object
const scope = { window: {} };
eval('window.' + match[0].substring(0, match[0].length) + ';\n');

const factories = scope.window.factories;
const allBuildings = Object.values(factories);

console.log(`Total buildings in reference: ${allBuildings.length}`);

// Get the already added buildings (Phase 1)
const phase1Buildings = [
  'Aluminium Smelter', 'Chocolate Factory', 'Clockmakers', 'Fur Dealer',
  'Artisan\'s Workshop: Billiard Tables', 'Artisan\'s Workshop: Cognac',
  'Artisan\'s Workshop: Toys', 'Artisan\'s Workshop: Violins',
  'Assembly Line: Biscuits', 'Assembly Line: Elevators', 'Assembly Line: Typewriters',
  'Bomb Factory', 'Care Package Factory', 'Chemical Plant: Lacquer', 'Concrete Factory',
  'Dynamite Factory', 'Heavy Weapons Factory', 'Oil Refinery',
  'Arsenal: Police Equipment', 'Ball Manufactory', 'Bauxite Mine', 'Cable Factory',
  'Chemical Plant: Celluloid', 'Chemical Plant: Chewing Gum', 'Chemical Plant: Ethanol',
  'Ice Cream Factory', 'Laboratory: Medicine',
  'Arctic Gas Mine', 'Bear Hunter', 'Caribou Hunter'
];

// Filter remaining buildings
const remaining = allBuildings.filter(b => !phase1Buildings.includes(b.building));
console.log(`Remaining buildings (not in Phase 1): ${remaining.length}`);

// Extract workforce tiers
const workforceTiers = {};
for (const factory of allBuildings) {
  if (factory.workforce && Array.isArray(factory.workforce)) {
    for (const tier of factory.workforce) {
      if (tier && tier[0]) {
        workforceTiers[tier[0]] = true;
      }
    }
  }
}

console.log('\n=== WORKFORCE TIERS ===');
Object.keys(workforceTiers).forEach(tier => {
  console.log(`• ${tier}`);
});

// Save remaining buildings
fs.writeFileSync('/tmp/phase2_buildings.json', JSON.stringify(remaining.map(b => ({
  building: b.building,
  regionCode: b.region,
  type: b.type,
  buildhausclass: b.buildhausclass,
  buildingsize: b.buildingsize,
  workforce: b.workforce,
  production: b.production
})), null, 2));

console.log(`\nPhase 2 buildings saved to /tmp/phase2_buildings.json`);

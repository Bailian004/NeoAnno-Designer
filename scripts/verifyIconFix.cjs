const fs = require('fs');

// Read overrides
const overridesContent = fs.readFileSync('data/buildingIcons.ts', 'utf8');
const overridesMatch = overridesContent.match(/export const BUILDING_ICON_OVERRIDES[^{]*{([^}]+)}/s);
const overrides = {};
if (overridesMatch) {
  const entries = overridesMatch[1].match(/"([^"]+)":\s*"([^"]+)"/g);
  if (entries) {
    entries.forEach(entry => {
      const match = entry.match(/"([^"]+)":\s*"([^"]+)"/);
      if (match) overrides[match[1]] = match[2];
    });
  }
}

// Simulate new priority order (overrides first)
const testBuildings = [
  "Flour Mill",
  "Hop Farm",
  "Brewery",
  "Malthouse",
  "Bakery",
  "Grain Farm"
];

console.log('\n=== Icon Resolution with Override Priority ===\n');

testBuildings.forEach(name => {
  const override = overrides[name];
  const exists = override ? fs.existsSync(`public/icons/${override}`) : false;
  
  console.log(`${name}:`);
  console.log(`  Override: ${override || 'NONE'}`);
  console.log(`  Status: ${exists ? '✅ Will load correctly' : '❌ Problem'}`);
});

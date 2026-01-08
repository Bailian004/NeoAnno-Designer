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

// Buildings that appear to be missing icons in the UI
const testBuildings = [
  "Grain Farm",
  "Bakery", 
  "Flour Mill",
  "Schnapps Distill.",
  "Potato Farm",
  "Hop Farm",
  "Brewery",
  "Malthouse",
  "Fishery",
  "Slaughterhouse",
  "Pig Farm"
];

console.log('\n=== Debug: Buildings from Screenshot ===\n');

testBuildings.forEach(name => {
  const override = overrides[name];
  const iconPath = override ? `public/icons/${override}` : 'NO OVERRIDE';
  const exists = override ? fs.existsSync(iconPath) : false;
  
  console.log(`${name}:`);
  console.log(`  Override: ${override || 'NONE'}`);
  console.log(`  File exists: ${exists ? '✓' : '✗'}`);
  if (!exists && override) {
    console.log(`  ❌ PROBLEM: Icon file missing!`);
  }
  console.log('');
});

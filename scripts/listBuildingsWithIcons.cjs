const fs = require('fs');
const path = require('path');

const annoDataPath = path.join(__dirname, '..', 'data', 'annoData.ts');
const annoDataContent = fs.readFileSync(annoDataPath, 'utf8');

// Extract building definitions
const buildingPattern = /\{[^}]*Identifier:\s*"([^"]+)"[^}]*IconFileName:\s*([^,]+)[^}]*Localization:\s*\{\s*eng:\s*"([^"]+)"/g;
const buildings = [];

for (const match of annoDataContent.matchAll(buildingPattern)) {
  const identifier = match[1];
  const iconFileName = match[2].trim();
  const englishName = match[3];
  buildings.push({ identifier, iconFileName, englishName });
}

console.log('=== ALL BUILDINGS WITH ICON MAPPINGS ===\n');
console.log(`Total buildings: ${buildings.length}\n`);

// Group by icon status
const withIcons = buildings.filter(b => b.iconFileName !== 'null');
const withoutIcons = buildings.filter(b => b.iconFileName === 'null');

console.log(`✅ Buildings with icons: ${withIcons.length}`);
console.log(`❌ Buildings without icons: ${withoutIcons.length}\n`);

if (withoutIcons.length > 0) {
  console.log('=== Buildings Missing Icons ===');
  withoutIcons.forEach(b => {
    console.log(`  - ${b.englishName} (${b.identifier})`);
  });
  console.log('');
}

console.log('=== Recently Fixed Icon Mappings ===');
const recentlyFixed = [
  'Pub', 'School', 'Church', 'Hospital', 'University', 'Bank',
  'Potato Farm', 'Sheep Farm', 'Brick Factory', 'Furnace',
  'Flour Mill', 'Bakery', 'Soap Factory', 'Pig Farm', 'Slaughterhouse', 'Warehouse I'
];

withIcons.filter(b => recentlyFixed.some(name => b.englishName.includes(name)))
  .forEach(b => {
    console.log(`  ✓ ${b.englishName.padEnd(25)} → ${b.iconFileName}`);
  });

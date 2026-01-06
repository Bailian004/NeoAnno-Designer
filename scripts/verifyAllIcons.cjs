const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'icons');
const annoDataPath = path.join(__dirname, '..', 'data', 'annoData.ts');
const annoDataContent = fs.readFileSync(annoDataPath, 'utf8');

// Get all icon files
const iconFiles = new Set(fs.readdirSync(iconsDir).filter(f => f.endsWith('.png')));

// Extract all IconFileName references
const matches = annoDataContent.matchAll(/IconFileName:"([^"]+)"/g);
const referencedIcons = new Set();
for (const match of matches) {
  referencedIcons.add(match[1]);
}

console.log('=== ICON MAPPING VERIFICATION ===\n');
console.log(`Total icon files available: ${iconFiles.size}`);
console.log(`Total icons referenced: ${referencedIcons.size}\n`);

let allExist = true;
const iconsList = Array.from(referencedIcons).sort();

console.log('Checking all referenced icons...\n');
iconsList.forEach(icon => {
  const exists = iconFiles.has(icon);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${icon}`);
  if (!exists) allExist = false;
});

console.log('\n' + '='.repeat(50));
if (allExist) {
  console.log('✅ SUCCESS: All icon mappings are correct!');
} else {
  console.log('❌ FAILURE: Some icons are still missing');
}
console.log('='.repeat(50));

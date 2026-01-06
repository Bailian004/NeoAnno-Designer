const fs = require('fs');
const path = require('path');

// Read all icon files
const iconsDir = path.join(__dirname, '..', 'icons');
const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));

console.log(`Found ${iconFiles.length} icon files in /icons directory\n`);

// Read annoData.ts file
const annoDataPath = path.join(__dirname, '..', 'data', 'annoData.ts');
const annoDataContent = fs.readFileSync(annoDataPath, 'utf8');

// Extract building definitions - find all IconFileName references
const iconFileNamePattern = /IconFileName:\s*"([^"]+)"/g;
const nullIconPattern = /IconFileName:\s*null/g;

const usedIcons = new Set();
const matches = annoDataContent.matchAll(iconFileNamePattern);
for (const match of matches) {
  usedIcons.add(match[1]);
}

const nullIconMatches = Array.from(annoDataContent.matchAll(nullIconPattern));

console.log(`=== ICON MAPPING AUDIT ===\n`);
console.log(`Total unique icons referenced in annoData.ts: ${usedIcons.size}`);
console.log(`Buildings with null IconFileName: ${nullIconMatches.length}\n`);

// Find icons that are referenced but don't exist
console.log(`=== MISSING ICON FILES ===`);
const missingIcons = [];
for (const iconName of usedIcons) {
  if (!iconFiles.includes(iconName)) {
    missingIcons.push(iconName);
  }
}

if (missingIcons.length > 0) {
  console.log(`Found ${missingIcons.length} referenced icons that don't exist:`);
  missingIcons.forEach(icon => console.log(`  - ${icon}`));
} else {
  console.log(`✓ All referenced icons exist`);
}

// Find unused icons (files that exist but aren't referenced)
console.log(`\n=== UNUSED ICON FILES ===`);
const unusedIcons = iconFiles.filter(icon => !usedIcons.has(icon));
if (unusedIcons.length > 0) {
  console.log(`Found ${unusedIcons.length} icon files not referenced in annoData.ts:`);
  // Group by prefix (A4, A6, A7, A8, icon_)
  const byPrefix = {};
  unusedIcons.forEach(icon => {
    const prefix = icon.split('_')[0];
    if (!byPrefix[prefix]) byPrefix[prefix] = [];
    byPrefix[prefix].push(icon);
  });
  
  Object.keys(byPrefix).sort().forEach(prefix => {
    console.log(`\n  ${prefix}* (${byPrefix[prefix].length} files):`);
    byPrefix[prefix].slice(0, 10).forEach(icon => console.log(`    - ${icon}`));
    if (byPrefix[prefix].length > 10) {
      console.log(`    ... and ${byPrefix[prefix].length - 10} more`);
    }
  });
} else {
  console.log(`✓ All icon files are referenced`);
}

// Find similar icon names for potential matches
console.log(`\n=== POTENTIAL ICON MAPPING SUGGESTIONS ===`);
console.log(`Analyzing building identifiers vs available icons...\n`);

// Extract building identifiers and their current icon mappings
const buildingPattern = /\{[^}]*Identifier:\s*"([^"]+)"[^}]*IconFileName:\s*([^,]+)[^}]*Localization:\s*\{\s*eng:\s*"([^"]+)"/g;
const buildings = [];
for (const match of annoDataContent.matchAll(buildingPattern)) {
  const identifier = match[1];
  const iconFileName = match[2].trim();
  const englishName = match[3];
  buildings.push({ identifier, iconFileName, englishName });
}

const buildingsWithNullIcon = buildings.filter(b => b.iconFileName === 'null');
console.log(`Buildings with null IconFileName (${buildingsWithNullIcon.length}):`);
buildingsWithNullIcon.forEach(b => {
  console.log(`  - ${b.englishName} (${b.identifier})`);
});

console.log(`\n=== SUMMARY ===`);
console.log(`Total icon files: ${iconFiles.length}`);
console.log(`Used icons: ${usedIcons.size}`);
console.log(`Unused icons: ${unusedIcons.length}`);
console.log(`Missing icons: ${missingIcons.length}`);
console.log(`Buildings with null icon: ${buildingsWithNullIcon.length}`);

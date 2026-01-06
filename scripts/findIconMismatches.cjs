const fs = require('fs');
const path = require('path');

// Read all icon files
const iconsDir = path.join(__dirname, '..', 'icons');
const iconFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));

// Create a lowercase map for case-insensitive lookup
const iconMap = new Map();
iconFiles.forEach(icon => {
  iconMap.set(icon.toLowerCase(), icon);
});

// Read annoData.ts file
const annoDataPath = path.join(__dirname, '..', 'data', 'annoData.ts');
const annoDataContent = fs.readFileSync(annoDataPath, 'utf8');

// Extract all IconFileName references
const iconFileNamePattern = /IconFileName:\s*"([^"]+)"/g;
const usedIcons = new Set();
const matches = annoDataContent.matchAll(iconFileNamePattern);
for (const match of matches) {
  usedIcons.add(match[1]);
}

console.log(`=== ICON FILENAME CASE MISMATCH FINDER ===\n`);

// Find icons that are referenced but don't exist (case-sensitive)
const missingIcons = [];
const fixableIcons = [];

for (const iconName of usedIcons) {
  if (!iconFiles.includes(iconName)) {
    missingIcons.push(iconName);
    
    // Check if a case-insensitive match exists
    const lowerIconName = iconName.toLowerCase();
    if (iconMap.has(lowerIconName)) {
      const correctName = iconMap.get(lowerIconName);
      fixableIcons.push({
        wrong: iconName,
        correct: correctName
      });
    }
  }
}

console.log(`Found ${missingIcons.length} missing icon references:\n`);

if (fixableIcons.length > 0) {
  console.log(`=== FIXABLE CASE MISMATCHES (${fixableIcons.length}) ===\n`);
  fixableIcons.forEach(({ wrong, correct }) => {
    console.log(`  "${wrong}" → "${correct}"`);
  });
  
  console.log(`\n=== SUGGESTED FIXES ===\n`);
  console.log(`Run the following replacements in annoData.ts:\n`);
  fixableIcons.forEach(({ wrong, correct }) => {
    console.log(`  IconFileName:"${wrong}" → IconFileName:"${correct}"`);
  });
} else {
  console.log(`✓ No case mismatches found`);
}

const unfixableIcons = missingIcons.filter(icon => {
  return !iconMap.has(icon.toLowerCase());
});

if (unfixableIcons.length > 0) {
  console.log(`\n=== TRULY MISSING ICONS (${unfixableIcons.length}) ===\n`);
  unfixableIcons.forEach(icon => {
    console.log(`  - ${icon}`);
    
    // Try to find similar names
    const baseName = icon.replace(/^A\d+_/, '').replace(/\.png$/, '').toLowerCase();
    const similar = iconFiles.filter(f => {
      const fBaseName = f.replace(/^A\d+_/, '').replace(/\.png$/, '').toLowerCase();
      return fBaseName.includes(baseName) || baseName.includes(fBaseName);
    }).slice(0, 5);
    
    if (similar.length > 0) {
      console.log(`    Possible matches:`);
      similar.forEach(s => console.log(`      - ${s}`));
    }
  });
}

console.log(`\n=== GENERATING AUTO-FIX SCRIPT ===\n`);

// Generate a fix script
const fixScriptPath = path.join(__dirname, 'fixIconNames.cjs');
const fixScript = `const fs = require('fs');
const path = require('path');

const annoDataPath = path.join(__dirname, '..', 'data', 'annoData.ts');
let content = fs.readFileSync(annoDataPath, 'utf8');

const fixes = ${JSON.stringify(fixableIcons, null, 2)};

console.log('Applying icon name fixes...');
let changeCount = 0;

fixes.forEach(({ wrong, correct }) => {
  const searchStr = 'IconFileName:"' + wrong + '"';
  const replaceStr = 'IconFileName:"' + correct + '"';
  const beforeLength = content.length;
  content = content.split(searchStr).join(replaceStr);
  const afterLength = content.length;
  if (beforeLength !== afterLength) {
    const occurrences = (beforeLength - afterLength) / (searchStr.length - replaceStr.length);
    console.log('  ✓ Fixed: ' + wrong + ' → ' + correct + ' (' + occurrences + ' occurrence' + (occurrences > 1 ? 's' : '') + ')');
    changeCount += occurrences;
  }
});

fs.writeFileSync(annoDataPath, content, 'utf8');
console.log('\\nSuccessfully applied ' + changeCount + ' fixes to annoData.ts');
`;

fs.writeFileSync(fixScriptPath, fixScript, 'utf8');
console.log(`Generated fix script at: ${fixScriptPath}`);
console.log(`\nRun: node scripts/fixIconNames.cjs`);

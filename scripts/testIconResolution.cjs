const fs = require('fs');

// Read helpful icons
const iconsData = JSON.parse(fs.readFileSync('Helpful_info/icons.json', 'utf8'));
const helpfulLabelToIcon = new Map();
iconsData.forEach(item => {
  if (item.IconFilename && item.Localization?.eng) {
    const labels = [
      item.Localization.eng,
      item.Localization.eng.toLowerCase(),
      item.Localization.eng.replace(/'/g, ''),
      item.Localization.eng.replace(/\./g, ''),
      item.Localization.eng.replace(/\s+/g, ''),
    ];
    labels.forEach(label => helpfulLabelToIcon.set(label, item.IconFilename));
  }
});

// Read presets
const presetsData = JSON.parse(fs.readFileSync('Helpful_info/presets.json', 'utf8'));
if (presetsData?.Buildings) {
  presetsData.Buildings.forEach(b => {
    if (b?.Header?.includes('(A7)') && b?.IconFileName && b?.Localization?.eng) {
      const label = b.Localization.eng;
      const labels = [label, label.toLowerCase(), label.replace(/'/g, ''), label.replace(/\./g, ''), label.replace(/\s+/g, '')];
      labels.forEach(l => helpfulLabelToIcon.set(l, b.IconFileName));
    }
  });
}

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

function getHelpfulIcon(name) {
  const variations = [
    name,
    name.toLowerCase(),
    name.replace(/'/g, ''),
    name.replace(/\./g, ''),
    name.replace(/\s+/g, ''),
    name.replace(/\s+/g, '').toLowerCase(),
  ];
  for (const v of variations) {
    if (helpfulLabelToIcon.has(v)) return helpfulLabelToIcon.get(v);
  }
  return null;
}

const testBuildings = [
  "Flour Mill",
  "Hop Farm",
  "Brewery",
  "Malthouse"
];

console.log('\n=== Icon Resolution Priority Check ===\n');

testBuildings.forEach(name => {
  const helpful = getHelpfulIcon(name);
  const override = overrides[name];
  const finalIcon = helpful || override;
  const helpfulExists = helpful ? fs.existsSync(`public/icons/${helpful}`) : false;
  const overrideExists = override ? fs.existsSync(`public/icons/${override}`) : false;
  
  console.log(`\n${name}:`);
  console.log(`  1. Helpful: ${helpful || 'NONE'}${helpful ? (helpfulExists ? ' ✓' : ' ✗ MISSING') : ''}`);
  console.log(`  2. Override: ${override || 'NONE'}${override ? (overrideExists ? ' ✓' : ' ✗ MISSING') : ''}`);
  console.log(`  → Final: ${finalIcon} ${finalIcon && fs.existsSync(`public/icons/${finalIcon}`) ? '✓' : '✗ PROBLEM!'}`);
});

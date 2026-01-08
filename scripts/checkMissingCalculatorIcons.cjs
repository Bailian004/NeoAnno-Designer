const fs = require('fs');
const path = require('path');

// Read helpful icons
const iconsData = JSON.parse(fs.readFileSync('Helpful_info/icons.json', 'utf8'));
const helpfulLabelToIcon = new Map();
iconsData.forEach(item => {
  if (item.IconFilename && item.Localization?.eng) {
    const labels = [
      item.Localization.eng,
      item.Localization.eng.toLowerCase(),
      item.Localization.eng.replace(/'/g, ''),
      item.Localization.eng.replace(/\s+/g, ''),
    ];
    labels.forEach(label => helpfulLabelToIcon.set(label, item.IconFilename));
  }
});

// Read presets (A7 buildings)
const presetsData = JSON.parse(fs.readFileSync('Helpful_info/presets.json', 'utf8'));
if (presetsData?.Buildings) {
  presetsData.Buildings.forEach(b => {
    if (b?.Header?.includes('(A7)') && b?.IconFileName && b?.Localization?.eng) {
      const label = b.Localization.eng;
      const labels = [label, label.toLowerCase(), label.replace(/'/g, ''), label.replace(/\s+/g, '')];
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

// Get all production chains
const prodChainsContent = fs.readFileSync('data/generatedProductionChains.ts', 'utf8');
const prodChainNames = [...prodChainsContent.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);

// Get all residences
const residencesContent = fs.readFileSync('data/generatedResidences.ts', 'utf8');
const residenceNames = [...residencesContent.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);

// Get all services
const servicesContent = fs.readFileSync('data/generatedServiceBuildings.ts', 'utf8');
const serviceNames = [...servicesContent.matchAll(/name:\s*"([^"]+)"/g)].map(m => m[1]);

// Helper function to check helpful icon
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

// Check each building
const missingIcons = {
  production: [],
  residences: [],
  services: []
};

console.log('\n=== Calculator Icon Coverage Report ===\n');

// Check production chains
console.log('Production Buildings:');
prodChainNames.forEach(name => {
  const helpful = getHelpfulIcon(name);
  const override = overrides[name];
  const hasIcon = helpful || override;
  
  if (!hasIcon) {
    missingIcons.production.push(name);
    console.log(`  ❌ ${name}`);
  }
});

// Check residences
console.log('\nResidence Buildings:');
residenceNames.forEach(name => {
  const helpful = getHelpfulIcon(name);
  const override = overrides[name];
  const hasIcon = helpful || override;
  
  if (!hasIcon) {
    missingIcons.residences.push(name);
    console.log(`  ❌ ${name}`);
  }
});

// Check services
console.log('\nService Buildings:');
serviceNames.forEach(name => {
  const helpful = getHelpfulIcon(name);
  const override = overrides[name];
  const hasIcon = helpful || override;
  
  if (!hasIcon) {
    missingIcons.services.push(name);
    console.log(`  ❌ ${name}`);
  }
});

// Summary
const totalMissing = missingIcons.production.length + missingIcons.residences.length + missingIcons.services.length;
const totalBuildings = prodChainNames.length + residenceNames.length + serviceNames.length;

console.log('\n=== Summary ===');
console.log(`Total Buildings: ${totalBuildings}`);
console.log(`Missing Icons: ${totalMissing}`);
console.log(`  - Production: ${missingIcons.production.length}/${prodChainNames.length}`);
console.log(`  - Residences: ${missingIcons.residences.length}/${residenceNames.length}`);
console.log(`  - Services: ${missingIcons.services.length}/${serviceNames.length}`);

if (totalMissing === 0) {
  console.log('\n✅ All buildings have icon mappings!');
} else {
  console.log('\n⚠️  Some buildings are missing icon mappings');
  console.log('\nBuildings without icons:');
  [...missingIcons.production, ...missingIcons.residences, ...missingIcons.services].forEach(name => {
    console.log(`  - ${name}`);
  });
}

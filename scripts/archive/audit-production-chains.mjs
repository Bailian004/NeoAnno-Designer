#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('=' .repeat(80));
console.log('DATA AUDIT: Production Chain Data Comparison');
console.log('Reference: Anno1800Calculator-master');
console.log('App: NeoAnno-Designer');
console.log('=' .repeat(80));
console.log('');

// Read our app's production chains
const appChainsFile = '/workspaces/NeoAnno-Designer/data/generatedProductionChains.ts';
const appContent = fs.readFileSync(appChainsFile, 'utf-8');

// ===== PARSE APP DATA =====

// Extract all chain definitions
const chainRegex = /\{\s*name:\s*"([^"]*)"[\s\S]*?\},/g;
const chains = [];
let match;
while ((match = chainRegex.exec(appContent)) !== null) {
  const startIdx = match.index;
  const chainStr = match[0];
  
  // Extract properties
  const nameMatch = chainStr.match(/name:\s*"([^"]*)"/);
  const identifierMatch = chainStr.match(/identifier:\s*"([^"]*)"/);
  const iconMatch = chainStr.match(/icon:\s*"([^"]*)"/);
  const regionMatch = chainStr.match(/region:\s*"([^"]*)"/);
  const tierMatch = chainStr.match(/tier:\s*"([^"]*)"/);
  const cycleMatch = chainStr.match(/cycleTime:\s*(\d+)/);
  const workforceMatch = chainStr.match(/workforce:\s*\{[\s\S]*?type:\s*"([^"]*)"\s*,\s*amount:\s*(\d+)/);
  const inputsMatch = chainStr.match(/inputs:\s*\[([\s\S]*?)\]/);
  const outputMatch = chainStr.match(/outputProduct:\s*"([^"]*)"/);
  const sizeMatch = chainStr.match(/size:\s*\{\s*x:\s*(\d+)\s*,\s*z:\s*(\d+)/);
  const modulesMatch = chainStr.match(/modules:\s*\{[^}]*type:\s*"([^"]*)"[^}]*count:\s*(\d+)/);
  
  const chain = {
    name: nameMatch ? nameMatch[1] : '',
    identifier: identifierMatch ? identifierMatch[1] : '',
    icon: iconMatch ? iconMatch[1] : '',
    region: regionMatch ? regionMatch[1] : '',
    tier: tierMatch ? tierMatch[1] : '',
    cycleTime: cycleMatch ? parseInt(cycleMatch[1]) : null,
    workforce: workforceMatch ? { type: workforceMatch[1], amount: parseInt(workforceMatch[2]) } : null,
    outputProduct: outputMatch ? outputMatch[1] : '',
    size: sizeMatch ? { x: parseInt(sizeMatch[1]), z: parseInt(sizeMatch[2]) } : null,
    modules: modulesMatch ? { type: modulesMatch[1], count: parseInt(modulesMatch[2]) } : null,
    hasInputs: inputsMatch && inputsMatch[1].trim().length > 0
  };
  
  chains.push(chain);
}

console.log('1. PRODUCTION CHAIN INVENTORY');
console.log('-'.repeat(80));
console.log(`Total Chains in App: ${chains.length}`);
console.log('');

// Count by region
const byRegion = {};
const byTier = {};
const byWorkforceType = {};

for (const chain of chains) {
  if (!byRegion[chain.region]) byRegion[chain.region] = [];
  byRegion[chain.region].push(chain);
  
  if (!byTier[chain.tier]) byTier[chain.tier] = [];
  byTier[chain.tier].push(chain);
  
  if (chain.workforce) {
    if (!byWorkforceType[chain.workforce.type]) byWorkforceType[chain.workforce.type] = [];
    byWorkforceType[chain.workforce.type].push(chain.workforce.amount);
  }
}

console.log('2. REGIONAL DISTRIBUTION');
console.log('-'.repeat(80));
for (const [region, regionChains] of Object.entries(byRegion).sort()) {
  console.log(`${region.padEnd(30)}: ${regionChains.length.toString().padStart(3)} chains`);
}
console.log('');

console.log('3. TIER/POPULATION LEVEL DISTRIBUTION');
console.log('-'.repeat(80));
for (const [tier, tierChains] of Object.entries(byTier).sort()) {
  console.log(`${tier.padEnd(30)}: ${tierChains.length.toString().padStart(3)} chains`);
}
console.log('');

console.log('4. WORKFORCE ANALYSIS');
console.log('-'.repeat(80));
const workforceStats = [];
for (const [wfType, amounts] of Object.entries(byWorkforceType).sort()) {
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const avg = Math.round(amounts.reduce((a, b) => a + b) / amounts.length);
  workforceStats.push({
    type: wfType,
    count: amounts.length,
    min,
    avg,
    max
  });
  console.log(
    `${wfType.padEnd(20)}: min=${String(min).padStart(4)}, ` +
    `avg=${String(avg).padStart(4)}, max=${String(max).padStart(4)}, ` +
    `chains=${amounts.length}`
  );
}
console.log('');

// Check for missing workforce
const chainsWithoutWorkforce = chains.filter(c => !c.workforce);
console.log(`Chains WITHOUT Workforce: ${chainsWithoutWorkforce.length}`);
if (chainsWithoutWorkforce.length > 0 && chainsWithoutWorkforce.length <= 10) {
  chainsWithoutWorkforce.forEach(c => {
    console.log(`  - ${c.name} (${c.region})`);
  });
}
console.log('');

console.log('5. PRODUCTION CHAIN STRUCTURE');
console.log('-'.repeat(80));

// Cycle times
const cycleTimes = chains.map(c => c.cycleTime).filter(ct => ct !== null);
const uniqueCycleTimes = [...new Set(cycleTimes)].sort((a, b) => a - b);
console.log(`Unique Cycle Times: ${uniqueCycleTimes.join(', ')}`);
console.log(`  Range: ${Math.min(...cycleTimes)}s to ${Math.max(...cycleTimes)}s`);
console.log('');

// Chains with inputs/outputs
const chainsWithInputs = chains.filter(c => c.hasInputs);
console.log(`Chains with Inputs: ${chainsWithInputs.length} / ${chains.length}`);
console.log(`Chains without Inputs (Raw Materials): ${chains.length - chainsWithInputs.length}`);
console.log('');

// Extract unique output products
const outputProducts = new Set();
const inputProducts = new Set();
const sizeDistribution = {};

const inputRegex = /product:\s*"([^"]*)"/g;
let inputMatch;

for (const chain of chains) {
  outputProducts.add(chain.outputProduct);
  
  // Parse size distribution
  if (chain.size) {
    const sizeKey = `${chain.size.x}x${chain.size.z}`;
    if (!sizeDistribution[sizeKey]) sizeDistribution[sizeKey] = 0;
    sizeDistribution[sizeKey]++;
  }
}

console.log(`6. OUTPUT PRODUCTS`);
console.log('-'.repeat(80));
console.log(`Unique Output Products: ${outputProducts.size}`);
const outputArray = Array.from(outputProducts).sort();
for (let i = 0; i < Math.min(30, outputArray.length); i++) {
  console.log(`  ${outputArray[i]}`);
}
if (outputArray.length > 30) {
  console.log(`  ... and ${outputArray.length - 30} more`);
}
console.log('');

console.log('7. SIZE DISTRIBUTION');
console.log('-'.repeat(80));
const sortedSizes = Object.entries(sizeDistribution).sort((a, b) => b[1] - a[1]);
for (const [size, count] of sortedSizes.slice(0, 15)) {
  console.log(`${size.padEnd(8)}: ${count.toString().padStart(3)} chains`);
}
console.log('');

console.log('8. ICON COVERAGE');
console.log('-'.repeat(80));
const chainsWithIcons = chains.filter(c => c.icon && c.icon.length > 0);
console.log(`Chains with Icons: ${chainsWithIcons.length} / ${chains.length} (${(100 * chainsWithIcons.length / chains.length).toFixed(1)}%)`);
console.log(`Chains without Icons: ${chains.length - chainsWithIcons.length}`);
if (chains.length - chainsWithIcons.length > 0 && chains.length - chainsWithIcons.length <= 15) {
  console.log('\n  Chains without icons:');
  chains.filter(c => !c.icon || c.icon.length === 0).forEach(c => {
    console.log(`    - ${c.name} (${c.region})`);
  });
}
console.log('');

console.log('9. IDENTIFIER COVERAGE');
console.log('-'.repeat(80));
const chainsWithIdentifiers = chains.filter(c => c.identifier && c.identifier.length > 0);
console.log(`Chains with Identifiers: ${chainsWithIdentifiers.length} / ${chains.length} (${(100 * chainsWithIdentifiers.length / chains.length).toFixed(1)}%)`);
console.log(`Chains without Identifiers: ${chains.length - chainsWithIdentifiers.length}`);
if (chains.length - chainsWithIdentifiers.length > 0 && chains.length - chainsWithIdentifiers.length <= 15) {
  console.log('\n  Chains without identifiers:');
  chains.filter(c => !c.identifier || c.identifier.length === 0).forEach(c => {
    console.log(`    - ${c.name} (${c.region})`);
  });
}
console.log('');

console.log('10. MODULE CONFIGURATIONS');
console.log('-'.repeat(80));
const chainsWithModules = chains.filter(c => c.modules);
console.log(`Chains with Modules: ${chainsWithModules.length}`);
const moduleTypes = {};
chainsWithModules.forEach(c => {
  if (!moduleTypes[c.modules.type]) moduleTypes[c.modules.type] = [];
  moduleTypes[c.modules.type].push(c.modules.count);
});

for (const [modType, counts] of Object.entries(moduleTypes).sort()) {
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  console.log(`  ${modType.padEnd(20)}: min=${min}, max=${max}, chains=${counts.length}`);
}
console.log('');

console.log('11. CONSUMPTION RATES & INDUSTRY DATA');
console.log('-'.repeat(80));

const industryFile = '/workspaces/NeoAnno-Designer/data/industryData.ts';
const industryContent = fs.readFileSync(industryFile, 'utf-8');

// Extract population types from consumption rates
const populationTypePattern = /'(Farmer|Worker|Artisan|Engineer|Investor|Jornalero|Obrero|Explorer|Technician|Shepherd|Elder|Scientist)'/g;
const populationTypes = new Set();
let popMatch;
while ((popMatch = populationTypePattern.exec(industryContent)) !== null) {
  populationTypes.add(popMatch[1]);
}

console.log(`Population Types with Consumption: ${Array.from(populationTypes).sort().join(', ')}`);
console.log('');

console.log('12. DATA QUALITY CHECKS');
console.log('-'.repeat(80));

// Check for duplicates
const names = chains.map(c => c.name);
const duplicateNames = names.filter((item, index) => names.indexOf(item) !== index);
if (duplicateNames.length === 0) {
  console.log('✓ No duplicate chain names');
} else {
  console.log(`✗ Found ${new Set(duplicateNames).size} duplicate chain names:`);
  new Set(duplicateNames).forEach(name => {
    const count = names.filter(n => n === name).length;
    console.log(`  - "${name}" appears ${count} times`);
  });
}
console.log('');

// Check for missing core fields
let issueCount = 0;
const missingFields = {
  region: [],
  tier: [],
  cycleTime: [],
  outputProduct: [],
  size: [],
  icon: [],
  workforce: []
};

for (const chain of chains) {
  if (!chain.region) missingFields.region.push(chain.name);
  if (!chain.tier) missingFields.tier.push(chain.name);
  if (chain.cycleTime === null) missingFields.cycleTime.push(chain.name);
  if (!chain.outputProduct) missingFields.outputProduct.push(chain.name);
  if (!chain.size) missingFields.size.push(chain.name);
  if (!chain.icon) missingFields.icon.push(chain.name);
  if (!chain.workforce) missingFields.workforce.push(chain.name);
}

for (const [field, items] of Object.entries(missingFields)) {
  if (items.length > 0) {
    issueCount += items.length;
    console.log(`⚠ Missing ${field}: ${items.length} chains`);
    if (items.length <= 5) {
      items.forEach(name => console.log(`    - ${name}`));
    }
  }
}

if (issueCount === 0) {
  console.log('✓ All chains have required fields');
}
console.log('');

console.log('=' .repeat(80));
console.log('SUMMARY & RECOMMENDATIONS');
console.log('=' .repeat(80));
console.log('');

console.log('COVERAGE SUMMARY:');
console.log(`  • Total Production Chains: ${chains.length}`);
console.log(`  • Regions Covered: ${Object.keys(byRegion).length}`);
console.log(`  • Population Tiers: ${Object.keys(byTier).length}`);
console.log(`  • Workforce Types: ${Object.keys(byWorkforceType).length}`);
console.log(`  • Icon Coverage: ${(100 * chainsWithIcons.length / chains.length).toFixed(1)}%`);
console.log(`  • Data Completeness: ${(100 * (chains.length - issueCount) / (chains.length * 7)).toFixed(1)}%`);
console.log('');

console.log('PRIORITY ACTIONS:');
let priority = 1;

if (chains.length - chainsWithIcons.length > 0) {
  console.log(`${priority}. Add icons to ${chains.length - chainsWithIcons.length} chains without icons`);
  priority++;
}

if (chainsWithoutWorkforce.length > 0) {
  console.log(`${priority}. Define workforce for ${chainsWithoutWorkforce.length} chains`);
  priority++;
}

if (chains.length - chainsWithIdentifiers.length > 0) {
  console.log(`${priority}. Add building identifiers to ${chains.length - chainsWithIdentifiers.length} chains`);
  priority++;
}

console.log(`${priority}. Cross-validate cycle times against reference params.js`);
priority++;

console.log(`${priority}. Validate workforce amounts against reference maintenances array`);
priority++;

console.log('');

// Write JSON report for further analysis
const report = {
  timestamp: new Date().toISOString(),
  totalChains: chains.length,
  byRegion: Object.fromEntries(
    Object.entries(byRegion).map(([region, rc]) => [region, rc.length])
  ),
  byTier: Object.fromEntries(
    Object.entries(byTier).map(([tier, tc]) => [tier, tc.length])
  ),
  workforceStats,
  iconCoverage: chainsWithIcons.length,
  identifierCoverage: chainsWithIdentifiers.length,
  moduleCoverage: chainsWithModules.length,
  chainsWithoutWorkforce: chainsWithoutWorkforce.map(c => c.name),
  dataQualityScore: (100 * (chains.length - issueCount) / (chains.length * 7))
};

fs.writeFileSync(
  '/workspaces/NeoAnno-Designer/audit-report.json',
  JSON.stringify(report, null, 2)
);

console.log('Report saved to audit-report.json');

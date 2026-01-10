#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

console.log('=' .repeat(80));
console.log('COMPREHENSIVE DATA AUDIT REPORT');
console.log('Production Chain Data Validation');
console.log('Reference: Anno1800Calculator-master vs NeoAnno-Designer');
console.log('=' .repeat(80));
console.log('');

// Read the generated production chains file
const appChainsFile = '/workspaces/NeoAnno-Designer/data/generatedProductionChains.ts';
const content = fs.readFileSync(appChainsFile, 'utf-8');

// Split into individual chain definitions
// Each chain starts with { and ends with },
const chainLines = content.split('\n');
let currentChain = '';
let inChain = false;
let braceCount = 0;
const rawChains = [];

for (const line of chainLines) {
  if (line.trim().startsWith('{') && !inChain) {
    inChain = true;
    braceCount = 0;
    currentChain = '';
  }
  
  if (inChain) {
    currentChain += line + '\n';
    braceCount += (line.match(/{/g) || []).length;
    braceCount -= (line.match(/}/g) || []).length;
    
    if (braceCount === 0 && currentChain.includes('{') && line.includes('}')) {
      rawChains.push(currentChain);
      currentChain = '';
      inChain = false;
    }
  }
}

// Parse each chain
const chains = rawChains.map(chainStr => {
  const extractField = (regex) => {
    const match = chainStr.match(regex);
    return match ? match[1] : null;
  };
  
  const extractJson = (fieldName) => {
    const regex = new RegExp(`${fieldName}:\\s*({[^}]*}|\\[[^\\]]*\\])`, 's');
    const match = chainStr.match(regex);
    return match ? match[1] : null;
  };
  
  const name = extractField(/name:\s*"([^"]*)"/);
  const identifier = extractField(/identifier:\s*"([^"]*)"/);
  const icon = extractField(/icon:\s*"([^"]*)"/);
  const region = extractField(/region:\s*"([^"]*)"/);
  const tier = extractField(/tier:\s*"([^"]*)"/);
  const cycleTime = extractField(/cycleTime:\s*(\d+)/);
  const outputAmount = extractField(/outputAmount:\s*(\d+)/);
  const outputProduct = extractField(/outputProduct:\s*"([^"]*)"/);
  
  // Parse workforce
  let workforce = null;
  const wfMatch = chainStr.match(/workforce:\s*\{([^}]*)\}/);
  if (wfMatch) {
    const typeMatch = wfMatch[1].match(/type:\s*"([^"]*)"/);
    const amountMatch = wfMatch[1].match(/amount:\s*(\d+)/);
    if (typeMatch && amountMatch) {
      workforce = {
        type: typeMatch[1],
        amount: parseInt(amountMatch[1])
      };
    }
  }
  
  // Parse size
  let size = null;
  const sizeMatch = chainStr.match(/size:\s*{\s*x:\s*(\d+)\s*,\s*z:\s*(\d+)\s*}/);
  if (sizeMatch) {
    size = {
      x: parseInt(sizeMatch[1]),
      z: parseInt(sizeMatch[2])
    };
  }
  
  // Parse inputs
  const inputsStr = extractJson('inputs');
  let hasInputs = false;
  if (inputsStr && inputsStr !== '[]') {
    hasInputs = true;
  }
  
  // Parse modules
  let modules = null;
  const modMatch = chainStr.match(/modules:\s*{\s*type:\s*"([^"]*)"\s*,\s*count:\s*(\d+)/);
  if (modMatch) {
    modules = {
      type: modMatch[1],
      count: parseInt(modMatch[2])
    };
  }
  
  return {
    name: name || '',
    identifier: identifier || '',
    icon: icon || '',
    region: region || '',
    tier: tier || '',
    cycleTime: cycleTime ? parseInt(cycleTime) : null,
    outputAmount: outputAmount ? parseInt(outputAmount) : null,
    outputProduct: outputProduct || '',
    workforce,
    size,
    modules,
    hasInputs
  };
});

console.log('1. PRODUCTION CHAIN INVENTORY');
console.log('-'.repeat(80));
console.log(`Total Chains Extracted: ${chains.length}`);
console.log('');

// Verify parsing
const validChains = chains.filter(c => c.name && c.region && c.tier);
console.log(`Valid Chains (name + region + tier): ${validChains.length}`);
console.log('');

// Count by region
const byRegion = {};
const byTier = {};
const byWorkforceType = {};

for (const chain of chains) {
  if (chain.region) {
    if (!byRegion[chain.region]) byRegion[chain.region] = [];
    byRegion[chain.region].push(chain);
  }
  
  if (chain.tier) {
    if (!byTier[chain.tier]) byTier[chain.tier] = [];
    byTier[chain.tier].push(chain);
  }
  
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

console.log('4. WORKFORCE REQUIREMENTS ANALYSIS');
console.log('-'.repeat(80));
const chainsWithWorkforce = chains.filter(c => c.workforce);
console.log(`Chains with Workforce Data: ${chainsWithWorkforce.length} / ${chains.length}`);
console.log('');

console.log('Workforce Type Distribution:');
for (const [wfType, amounts] of Object.entries(byWorkforceType).sort()) {
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const avg = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
  const total = amounts.reduce((a, b) => a + b, 0);
  console.log(
    `  ${wfType.padEnd(20)}: count=${amounts.length.toString().padStart(2)}, ` +
    `min=${String(min).padStart(4)}, avg=${String(avg).padStart(4)}, ` +
    `max=${String(max).padStart(4)}, total=${String(total).padStart(5)}`
  );
}
console.log('');

// Check for missing workforce
const chainsWithoutWorkforce = chains.filter(c => !c.workforce);
console.log(`⚠ Chains WITHOUT Workforce Data: ${chainsWithoutWorkforce.length}`);
if (chainsWithoutWorkforce.length > 0 && chainsWithoutWorkforce.length <= 15) {
  chainsWithoutWorkforce.forEach(c => {
    console.log(`    - ${c.name} (${c.region}/${c.tier})`);
  });
} else if (chainsWithoutWorkforce.length > 15) {
  chainsWithoutWorkforce.slice(0, 10).forEach(c => {
    console.log(`    - ${c.name} (${c.region}/${c.tier})`);
  });
  console.log(`    ... and ${chainsWithoutWorkforce.length - 10} more`);
}
console.log('');

console.log('5. PRODUCTION CYCLE TIME ANALYSIS');
console.log('-'.repeat(80));
const cycleTimes = chains.map(c => c.cycleTime).filter(ct => ct !== null);
const uniqueCycleTimes = [...new Set(cycleTimes)].sort((a, b) => a - b);
console.log(`Unique Cycle Times: ${uniqueCycleTimes.join(', ')}`);
console.log(`Range: ${Math.min(...cycleTimes)}s to ${Math.max(...cycleTimes)}s`);
console.log('');

// Cycle time frequency
const cycleTimeFreq = {};
for (const ct of cycleTimes) {
  cycleTimeFreq[ct] = (cycleTimeFreq[ct] || 0) + 1;
}

console.log('Cycle Time Distribution:');
for (const [time, count] of Object.entries(cycleTimeFreq).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
  const pct = (100 * count / cycleTimes.length).toFixed(1);
  console.log(`  ${String(time).padStart(4)}s: ${count.toString().padStart(2)} chains (${pct.padStart(5)}%)`);
}
console.log('');

console.log('6. INPUT/OUTPUT ANALYSIS');
console.log('-'.repeat(80));
const chainsWithInputs = chains.filter(c => c.hasInputs);
console.log(`Chains WITH Inputs (Processing/Manufacturing): ${chainsWithInputs.length}`);
console.log(`Chains WITHOUT Inputs (Raw Materials/Extraction): ${chains.length - chainsWithInputs.length}`);
console.log('');

const outputProducts = new Set(chains.filter(c => c.outputProduct).map(c => c.outputProduct));
console.log(`Unique Output Products: ${outputProducts.size}`);
const outputArray = Array.from(outputProducts).sort();
for (let i = 0; i < Math.min(20, outputArray.length); i++) {
  console.log(`  ${outputArray[i]}`);
}
if (outputArray.length > 20) {
  console.log(`  ... and ${outputArray.length - 20} more`);
}
console.log('');

console.log('7. SIZE & LAYOUT');
console.log('-'.repeat(80));
const sizeDistribution = {};
for (const chain of chains.filter(c => c.size)) {
  const sizeKey = `${chain.size.x}x${chain.size.z}`;
  if (!sizeDistribution[sizeKey]) sizeDistribution[sizeKey] = 0;
  sizeDistribution[sizeKey]++;
}

const sortedSizes = Object.entries(sizeDistribution).sort((a, b) => b[1] - a[1]);
for (const [size, count] of sortedSizes) {
  console.log(`  ${size.padEnd(8)}: ${count.toString().padStart(2)} chains`);
}
console.log('');

console.log('8. ICON COVERAGE');
console.log('-'.repeat(80));
const chainsWithIcons = chains.filter(c => c.icon && c.icon.length > 0);
const pctWithIcons = (100 * chainsWithIcons.length / chains.length).toFixed(1);
console.log(`Chains with Icons: ${chainsWithIcons.length} / ${chains.length} (${pctWithIcons}%)`);
console.log(`Chains without Icons: ${chains.length - chainsWithIcons.length}`);

if (chains.length - chainsWithIcons.length > 0) {
  console.log('\nChains missing icons:');
  chains.filter(c => !c.icon || c.icon.length === 0).forEach(c => {
    console.log(`  - ${c.name} (${c.region})`);
  });
}
console.log('');

console.log('9. IDENTIFIER (GUID) COVERAGE');
console.log('-'.repeat(80));
const chainsWithIdentifiers = chains.filter(c => c.identifier && c.identifier.length > 0);
const pctWithId = (100 * chainsWithIdentifiers.length / chains.length).toFixed(1);
console.log(`Chains with Identifiers: ${chainsWithIdentifiers.length} / ${chains.length} (${pctWithId}%)`);
console.log(`Chains without Identifiers: ${chains.length - chainsWithIdentifiers.length}`);

if (chains.length - chainsWithIdentifiers.length > 0 && chains.length - chainsWithIdentifiers.length <= 20) {
  console.log('\nChains missing identifiers:');
  chains.filter(c => !c.identifier || c.identifier.length === 0).forEach(c => {
    console.log(`  - ${c.name} (${c.region}/${c.tier})`);
  });
}
console.log('');

console.log('10. MODULE CONFIGURATIONS');
console.log('-'.repeat(80));
const chainsWithModules = chains.filter(c => c.modules);
console.log(`Chains with Module Configs: ${chainsWithModules.length}`);

const moduleTypes = {};
chainsWithModules.forEach(c => {
  if (!moduleTypes[c.modules.type]) moduleTypes[c.modules.type] = [];
  moduleTypes[c.modules.type].push(c.modules.count);
});

for (const [modType, counts] of Object.entries(moduleTypes).sort()) {
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const avg = Math.round(counts.reduce((a, b) => a + b) / counts.length);
  console.log(
    `  ${modType.padEnd(15)}: min=${String(min).padStart(3)}, ` +
    `avg=${String(avg).padStart(3)}, max=${String(max).padStart(3)}`
  );
}
console.log('');

console.log('11. DATA QUALITY ASSESSMENT');
console.log('-'.repeat(80));

const checks = {
  'Has Name': chains.filter(c => c.name && c.name.length > 0).length,
  'Has Region': chains.filter(c => c.region && c.region.length > 0).length,
  'Has Tier': chains.filter(c => c.tier && c.tier.length > 0).length,
  'Has Cycle Time': chains.filter(c => c.cycleTime !== null).length,
  'Has Output Product': chains.filter(c => c.outputProduct && c.outputProduct.length > 0).length,
  'Has Workforce': chains.filter(c => c.workforce !== null).length,
  'Has Size': chains.filter(c => c.size !== null).length,
  'Has Icon': chains.filter(c => c.icon && c.icon.length > 0).length,
  'Has Identifier': chains.filter(c => c.identifier && c.identifier.length > 0).length
};

let issueCount = 0;
for (const [check, count] of Object.entries(checks)) {
  const pct = (100 * count / chains.length).toFixed(1);
  const status = count === chains.length ? '✓' : '✗';
  console.log(`${status} ${check.padEnd(25)}: ${count.toString().padStart(2)} / ${chains.length} (${pct.padStart(5)}%)`);
  if (count < chains.length) issueCount++;
}
console.log('');

console.log('12. REGIONAL COMPLETENESS');
console.log('-'.repeat(80));
const regionStats = {};
for (const region of Object.keys(byRegion)) {
  const regionChains = byRegion[region];
  const withWorkforce = regionChains.filter(c => c.workforce).length;
  const withIcon = regionChains.filter(c => c.icon).length;
  const withId = regionChains.filter(c => c.identifier).length;
  
  console.log(`${region}`);
  console.log(`  Chains: ${regionChains.length}`);
  console.log(`  With Workforce: ${withWorkforce} (${(100 * withWorkforce / regionChains.length).toFixed(1)}%)`);
  console.log(`  With Icons: ${withIcon} (${(100 * withIcon / regionChains.length).toFixed(1)}%)`);
  console.log(`  With Identifiers: ${withId} (${(100 * withId / regionChains.length).toFixed(1)}%)`);
}
console.log('');

// Calculate overall quality score
const totalFields = Object.values(checks).reduce((a, b) => a + b, 0);
const maxFields = chains.length * Object.keys(checks).length;
const qualityScore = (100 * totalFields / maxFields).toFixed(1);

console.log('=' .repeat(80));
console.log('SUMMARY');
console.log('=' .repeat(80));
console.log('');
console.log(`Total Production Chains: ${chains.length}`);
console.log(`Regions: ${Object.keys(byRegion).length}`);
console.log(`Population Tiers: ${Object.keys(byTier).length}`);
console.log(`Workforce Types: ${Object.keys(byWorkforceType).length}`);
console.log(`Data Quality Score: ${qualityScore}%`);
console.log('');

console.log('CRITICAL GAPS:');
let criticalCount = 1;
if (chainsWithoutWorkforce.length > 0) {
  console.log(`${criticalCount}. WORKFORCE DATA MISSING: ${chainsWithoutWorkforce.length} chains (${(100 * chainsWithoutWorkforce.length / chains.length).toFixed(1)}%)`);
  criticalCount++;
}

const chainsWithoutIcon = chains.filter(c => !c.icon || !c.icon.length);
if (chainsWithoutIcon.length > 0) {
  console.log(`${criticalCount}. ICON COVERAGE: ${chainsWithoutIcon.length} chains (${(100 * chainsWithoutIcon.length / chains.length).toFixed(1)}%)`);
  criticalCount++;
}

const chainsWithoutId = chains.filter(c => !c.identifier || !c.identifier.length);
if (chainsWithoutId.length > 0) {
  console.log(`${criticalCount}. IDENTIFIER COVERAGE: ${chainsWithoutId.length} chains (${(100 * chainsWithoutId.length / chains.length).toFixed(1)}%)`);
  criticalCount++;
}

console.log('');

// Write JSON report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalChains: chains.length,
    regions: Object.keys(byRegion).length,
    tiers: Object.keys(byTier).length,
    workforceTypes: Object.keys(byWorkforceType).length,
    dataQualityScore: parseFloat(qualityScore)
  },
  byRegion: Object.fromEntries(
    Object.entries(byRegion).map(([region, rc]) => [region, rc.length])
  ),
  byTier: Object.fromEntries(
    Object.entries(byTier).map(([tier, tc]) => [tier, tc.length])
  ),
  workforceStats: Object.fromEntries(
    Object.entries(byWorkforceType).map(([type, amounts]) => [
      type,
      {
        chains: amounts.length,
        min: Math.min(...amounts),
        avg: Math.round(amounts.reduce((a, b) => a + b) / amounts.length),
        max: Math.max(...amounts),
        total: amounts.reduce((a, b) => a + b)
      }
    ])
  ),
  coverage: {
    withIcon: chainsWithIcons.length,
    withIdentifier: chainsWithIdentifiers.length,
    withWorkforce: chainsWithWorkforce.length,
    withSize: chains.filter(c => c.size).length,
    withModules: chainsWithModules.length
  },
  gaps: {
    chainsWithoutWorkforce: chainsWithoutWorkforce.map(c => c.name),
    chainsWithoutIcon: chainsWithoutIcon.slice(0, 20).map(c => c.name)
  }
};

fs.writeFileSync(
  '/workspaces/NeoAnno-Designer/comprehensive-audit-report.json',
  JSON.stringify(report, null, 2)
);

console.log('Detailed report saved to: comprehensive-audit-report.json');

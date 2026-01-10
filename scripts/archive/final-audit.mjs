#!/usr/bin/env node

import fs from 'fs';

console.log('=' .repeat(90));
console.log('COMPREHENSIVE DATA AUDIT REPORT - PRODUCTION CHAINS');
console.log('Reference: Anno1800Calculator-master | Target: NeoAnno-Designer');
console.log('=' .repeat(90));
console.log('');

// Read the production chains file
const content = fs.readFileSync('/workspaces/NeoAnno-Designer/data/generatedProductionChains.ts', 'utf-8');

// Parse using simpler approach - split by chain objects
const chainMatches = content.match(/\{\s*name:\s*"[^"]*"[\s\S]*?\},/g) || [];
console.log(`Total Chains Found: ${chainMatches.length}`);
console.log('');

// Parse each chain
const chains = chainMatches.map((chainStr, idx) => {
  const extractField = (regex) => {
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
  
  // Parse workforce - handle JSON format
  let workforce = null;
  const wfMatch = chainStr.match(/workforce:\s*\{([^}]+)\}/);
  if (wfMatch) {
    const typeMatch = wfMatch[1].match(/"type"\s*:\s*"([^"]*)"/);
    const amountMatch = wfMatch[1].match(/"amount"\s*:\s*(\d+)/);
    if (typeMatch && amountMatch) {
      workforce = {
        type: typeMatch[1],
        amount: parseInt(amountMatch[1])
      };
    }
  }
  
  // Parse size
  let size = null;
  const sizeMatch = chainStr.match(/size:\s*\{([^}]*)\}/);
  if (sizeMatch) {
    const xMatch = sizeMatch[1].match(/"x"\s*:\s*(\d+)/);
    const zMatch = sizeMatch[1].match(/"z"\s*:\s*(\d+)/);
    if (xMatch && zMatch) {
      size = {
        x: parseInt(xMatch[1]),
        z: parseInt(zMatch[1])
      };
    }
  }
  
  // Check for inputs
  const hasInputs = chainStr.includes('inputs: [') && !chainStr.match(/inputs:\s*\[\s*\]/);
  
  // Parse modules
  let modules = null;
  const modMatch = chainStr.match(/modules:\s*\{([^}]*)\}/);
  if (modMatch) {
    const typeMatch = modMatch[1].match(/"type"\s*:\s*"([^"]*)"/);
    const countMatch = modMatch[1].match(/"count"\s*:\s*(\d+)/);
    if (typeMatch && countMatch) {
      modules = {
        type: typeMatch[1],
        count: parseInt(countMatch[1])
      };
    }
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
    hasInputs,
    index: idx
  };
});

console.log('1. INVENTORY SUMMARY');
console.log('-'.repeat(90));

// Regional breakdown
const byRegion = {};
for (const chain of chains) {
  if (!byRegion[chain.region]) byRegion[chain.region] = [];
  byRegion[chain.region].push(chain);
}

console.log('Regional Distribution:');
const regionSummary = [];
for (const [region, regionChains] of Object.entries(byRegion).sort()) {
  console.log(`  ${region.padEnd(25)}: ${regionChains.length.toString().padStart(2)} chains`);
  regionSummary.push([region, regionChains.length]);
}
console.log('');

// Tier breakdown
const byTier = {};
for (const chain of chains) {
  if (!byTier[chain.tier]) byTier[chain.tier] = [];
  byTier[chain.tier].push(chain);
}

console.log('Tier/Population Distribution:');
for (const [tier, tierChains] of Object.entries(byTier).sort()) {
  console.log(`  ${tier.padEnd(25)}: ${tierChains.length.toString().padStart(2)} chains`);
}
console.log('');

console.log('2. WORKFORCE ANALYSIS');
console.log('-'.repeat(90));

const byWorkforce = {};
for (const chain of chains) {
  if (chain.workforce) {
    if (!byWorkforce[chain.workforce.type]) byWorkforce[chain.workforce.type] = [];
    byWorkforce[chain.workforce.type].push(chain.workforce.amount);
  }
}

const chainsWithWorkforce = chains.filter(c => c.workforce);
const chainsWithoutWorkforce = chains.filter(c => !c.workforce);

console.log(`Chains WITH Workforce Data: ${chainsWithWorkforce.length} / ${chains.length} (${(100 * chainsWithWorkforce.length / chains.length).toFixed(1)}%)`);
console.log(`Chains WITHOUT Workforce Data: ${chainsWithoutWorkforce.length} / ${chains.length}`);
console.log('');

console.log('Workforce Type Summary:');
for (const [wfType, amounts] of Object.entries(byWorkforce).sort()) {
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const avg = Math.round(amounts.reduce((a, b) => a + b) / amounts.length);
  const total = amounts.reduce((a, b) => a + b);
  console.log(
    `  ${wfType.padEnd(20)}: chains=${amounts.length.toString().padStart(2)}, ` +
    `min=${String(min).padStart(4)}, avg=${String(avg).padStart(4)}, ` +
    `max=${String(max).padStart(4)}, total=${String(total).padStart(5)}`
  );
}
console.log('');

if (chainsWithoutWorkforce.length > 0) {
  console.log(`⚠ Missing Workforce in ${chainsWithoutWorkforce.length} Chains:`);
  chainsWithoutWorkforce.forEach(c => {
    console.log(`  - "${c.name}" (${c.region} / ${c.tier})`);
  });
  console.log('');
}

console.log('3. PRODUCTION CHAIN STRUCTURE');
console.log('-'.repeat(90));

const cycleTimes = chains.map(c => c.cycleTime).filter(ct => ct !== null);
const uniqueCycleTimes = [...new Set(cycleTimes)].sort((a, b) => a - b);

console.log(`Cycle Times Found: ${uniqueCycleTimes.join(', ')}`);
console.log(`Range: ${Math.min(...cycleTimes)}s to ${Math.max(...cycleTimes)}s`);
console.log('');

const cycleFreq = {};
for (const ct of cycleTimes) {
  cycleFreq[ct] = (cycleFreq[ct] || 0) + 1;
}

console.log('Cycle Time Distribution:');
for (const [time, count] of Object.entries(cycleFreq).sort((a, b) => parseInt(a) - parseInt(b))) {
  const pct = (100 * count / cycleTimes.length).toFixed(1);
  const bar = '█'.repeat(Math.ceil(count / 2));
  console.log(`  ${String(time).padStart(4)}s: ${bar.padEnd(20)} ${count.toString().padStart(2)} (${pct.padStart(5)}%)`);
}
console.log('');

console.log('4. INPUT/OUTPUT ANALYSIS');
console.log('-'.repeat(90));

const chainsWithInputs = chains.filter(c => c.hasInputs);
const chainsNoInputs = chains.length - chainsWithInputs.length;

console.log(`Chains WITH Inputs (Manufacturing/Processing): ${chainsWithInputs.length}`);
console.log(`Chains WITHOUT Inputs (Raw Material/Extraction): ${chainsNoInputs}`);
console.log('');

const outputProducts = new Set(chains.filter(c => c.outputProduct).map(c => c.outputProduct));
console.log(`Unique Output Products: ${outputProducts.size}`);
const outputArray = Array.from(outputProducts).sort();
console.log('Sample outputs: ' + outputArray.slice(0, 15).join(', '));
if (outputArray.length > 15) {
  console.log(`... and ${outputArray.length - 15} more`);
}
console.log('');

console.log('5. SIZE & LAYOUT ANALYSIS');
console.log('-'.repeat(90));

const sizeDistribution = {};
const chainsWithSize = chains.filter(c => c.size);
for (const chain of chainsWithSize) {
  const sizeKey = `${chain.size.x}x${chain.size.z}`;
  if (!sizeDistribution[sizeKey]) sizeDistribution[sizeKey] = 0;
  sizeDistribution[sizeKey]++;
}

console.log(`Chains with Size Data: ${chainsWithSize.length} / ${chains.length}`);
console.log('');

const sortedSizes = Object.entries(sizeDistribution).sort((a, b) => b[1] - a[1]);
console.log('Most Common Sizes:');
for (const [size, count] of sortedSizes.slice(0, 15)) {
  console.log(`  ${size.padEnd(8)}: ${count.toString().padStart(2)} chains`);
}
if (sortedSizes.length > 15) {
  console.log(`  ... ${sortedSizes.length - 15} more size variants`);
}
console.log('');

console.log('6. ICON COVERAGE');
console.log('-'.repeat(90));

const withIcons = chains.filter(c => c.icon && c.icon.length > 0);
const iconPct = (100 * withIcons.length / chains.length).toFixed(1);

console.log(`Chains with Icons: ${withIcons.length} / ${chains.length} (${iconPct}%)`);
console.log(`Chains WITHOUT Icons: ${chains.length - withIcons.length}`);
console.log('');

if (chains.length - withIcons.length > 0) {
  console.log('Chains Missing Icons:');
  chains.filter(c => !c.icon || !c.icon.length).forEach((c, idx) => {
    if (idx < 25) {
      console.log(`  - "${c.name}" (${c.region})`);
    }
  });
  if (chains.length - withIcons.length > 25) {
    console.log(`  ... and ${chains.length - withIcons.length - 25} more`);
  }
}
console.log('');

console.log('7. IDENTIFIER (GUID) COVERAGE');
console.log('-'.repeat(90));

const withIds = chains.filter(c => c.identifier && c.identifier.length > 0);
const idPct = (100 * withIds.length / chains.length).toFixed(1);

console.log(`Chains with Identifiers: ${withIds.length} / ${chains.length} (${idPct}%)`);
console.log(`Chains WITHOUT Identifiers: ${chains.length - withIds.length}`);
console.log('');

console.log('8. MODULE CONFIGURATIONS');
console.log('-'.repeat(90));

const withModules = chains.filter(c => c.modules);
console.log(`Chains with Module Configs: ${withModules.length}`);

if (withModules.length > 0) {
  const moduleTypes = {};
  for (const chain of withModules) {
    if (!moduleTypes[chain.modules.type]) moduleTypes[chain.modules.type] = [];
    moduleTypes[chain.modules.type].push(chain.modules.count);
  }
  
  console.log('Module Types:');
  for (const [modType, counts] of Object.entries(moduleTypes).sort()) {
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = Math.round(counts.reduce((a, b) => a + b) / counts.length);
    console.log(
      `  ${modType.padEnd(15)}: min=${String(min).padStart(3)}, ` +
      `avg=${String(avg).padStart(3)}, max=${String(max).padStart(3)}`
    );
  }
}
console.log('');

console.log('9. DATA COMPLETENESS CHECK');
console.log('-'.repeat(90));

const dataChecks = {
  'Name': chains.filter(c => c.name && c.name.length > 0),
  'Region': chains.filter(c => c.region && c.region.length > 0),
  'Tier': chains.filter(c => c.tier && c.tier.length > 0),
  'Cycle Time': chains.filter(c => c.cycleTime !== null),
  'Output Product': chains.filter(c => c.outputProduct && c.outputProduct.length > 0),
  'Workforce': chains.filter(c => c.workforce),
  'Size': chains.filter(c => c.size),
  'Icon': chains.filter(c => c.icon && c.icon.length > 0),
  'Identifier': chains.filter(c => c.identifier && c.identifier.length > 0),
  'Output Amount': chains.filter(c => c.outputAmount !== null)
};

let totalFieldsComplete = 0;
for (const [check, matching] of Object.entries(dataChecks)) {
  const pct = (100 * matching.length / chains.length).toFixed(1);
  const icon = matching.length === chains.length ? '✓' : '✗';
  console.log(
    `${icon} ${check.padEnd(18)}: ${matching.length.toString().padStart(2)} / ${chains.length} (${pct.padStart(5)}%)`
  );
  totalFieldsComplete += matching.length;
}

const qualityScore = (100 * totalFieldsComplete / (chains.length * Object.keys(dataChecks).length)).toFixed(1);
console.log('');
console.log(`Overall Data Quality Score: ${qualityScore}%`);
console.log('');

console.log('10. REGIONAL COMPLETENESS');
console.log('-'.repeat(90));

for (const [region, regionChains] of Object.entries(byRegion).sort()) {
  const withWf = regionChains.filter(c => c.workforce).length;
  const withIcon = regionChains.filter(c => c.icon).length;
  const withId = regionChains.filter(c => c.identifier).length;
  
  console.log(`${region}`);
  console.log(`  Total: ${regionChains.length} chains`);
  console.log(`  Workforce: ${withWf} (${(100 * withWf / regionChains.length).toFixed(1)}%)`);
  console.log(`  Icons: ${withIcon} (${(100 * withIcon / regionChains.length).toFixed(1)}%)`);
  console.log(`  Identifiers: ${withId} (${(100 * withId / regionChains.length).toFixed(1)}%)`);
}
console.log('');

console.log('=' .repeat(90));
console.log('SUMMARY & RECOMMENDATIONS');
console.log('=' .repeat(90));
console.log('');

console.log('OVERALL STATISTICS:');
console.log(`  • Total Production Chains: ${chains.length}`);
console.log(`  • Regions Covered: ${Object.keys(byRegion).length}`);
console.log(`  • Population Tiers: ${Object.keys(byTier).length}`);
console.log(`  • Workforce Types: ${Object.keys(byWorkforce).length}`);
console.log(`  • Data Quality Score: ${qualityScore}%`);
console.log('');

console.log('CRITICAL GAPS:');
let priority = 1;

if (chainsWithoutWorkforce.length > 0) {
  console.log(`${priority}. WORKFORCE DATA MISSING: ${chainsWithoutWorkforce.length} chains (${(100 * chainsWithoutWorkforce.length / chains.length).toFixed(1)}%)`);
  priority++;
}

const missingIcons = chains.length - withIcons.length;
if (missingIcons > 0) {
  console.log(`${priority}. ICON FILES MISSING: ${missingIcons} chains (${(100 * missingIcons / chains.length).toFixed(1)}%)`);
  priority++;
}

const missingIds = chains.length - withIds.length;
if (missingIds > 0) {
  console.log(`${priority}. IDENTIFIER MISSING: ${missingIds} chains (${(100 * missingIds / chains.length).toFixed(1)}%)`);
  priority++;
}

const missingSize = chains.length - chainsWithSize.length;
if (missingSize > 0) {
  console.log(`${priority}. SIZE DATA MISSING: ${missingSize} chains (${(100 * missingSize / chains.length).toFixed(1)}%)`);
  priority++;
}

const enbesaNoIcons = byRegion['Enbesa'] ? byRegion['Enbesa'].filter(c => !c.icon).length : 0;
if (enbesaNoIcons > 0) {
  console.log(`${priority}. ENBESA REGION: Complete lack of icons (${enbesaNoIcons} chains)`);
  priority++;
}

console.log('');
console.log('PRIORITY ACTIONS:');
console.log('');
console.log('1. ADD WORKFORCE DATA');
console.log(`   - ${chainsWithoutWorkforce.length} chains need workforce_type and amounts`);
console.log('   - Cross-reference with reference params.js maintenances array');
console.log('   - Workforce codes: Unskilled(1010017), Skilled(1010115), Scientists(1010116), Technicians(1010117)');
console.log('');

console.log('2. ADD MISSING ICONS');
console.log(`   - ${missingIcons} chains need icon file references`);
console.log('   - Enbesa region completely missing (9 chains)');
console.log('   - Arctic region at 28.6% coverage (2/7 chains)');console.log('');

console.log('3. ADD BUILDING IDENTIFIERS');
console.log(`   - ${missingIds} chains need building identifiers (GUIDs)`);
console.log('   - Use identifier field from reference params.js');
console.log('');

console.log('4. VALIDATE AGAINST REFERENCE');
console.log('   - Cross-check cycle times (tpmin) with reference factories.js');
console.log('   - Verify workforce amounts match reference maintenances');
console.log('   - Check production inputs/outputs match reference');
console.log('');

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  totalChains: chains.length,
  summary: {
    regions: Object.keys(byRegion).length,
    tiers: Object.keys(byTier).length,
    workforceTypes: Object.keys(byWorkforce).length,
    qualityScore: parseFloat(qualityScore)
  },
  coverage: {
    workforce: chainsWithWorkforce.length,
    icons: withIcons.length,
    identifiers: withIds.length,
    sizes: chainsWithSize.length,
    modules: withModules.length
  },
  gaps: {
    workforceMissing: chainsWithoutWorkforce.map(c => ({ name: c.name, region: c.region, tier: c.tier })),
    iconsMissing: chains.filter(c => !c.icon).length,
    identifiersMissing: chains.filter(c => !c.identifier).length,
    sizesMissing: chains.filter(c => !c.size).length
  },
  regionalBreakdown: Object.fromEntries(
    Object.entries(byRegion).map(([region, rc]) => [region, rc.length])
  ),
  tierBreakdown: Object.fromEntries(
    Object.entries(byTier).map(([tier, tc]) => [tier, tc.length])
  ),
  workforceStats: Object.fromEntries(
    Object.entries(byWorkforce).map(([type, amounts]) => [
      type,
      {
        chains: amounts.length,
        min: Math.min(...amounts),
        avg: Math.round(amounts.reduce((a, b) => a + b) / amounts.length),
        max: Math.max(...amounts),
        total: amounts.reduce((a, b) => a + b)
      }
    ])
  )
};

fs.writeFileSync('/workspaces/NeoAnno-Designer/AUDIT_REPORT.json', JSON.stringify(report, null, 2));
console.log('Full report saved to: AUDIT_REPORT.json');

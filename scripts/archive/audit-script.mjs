#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Parse params.js to extract factory data
const paramsFile = '/workspaces/NeoAnno-Designer/Helpful_info/Anno1800Calculator-master/js/params.js';
const paramsContent = fs.readFileSync(paramsFile, 'utf-8');

// Extract the factories array from params
const factoriesMatch = paramsContent.match(/factories\s*:\s*\[[\s\S]*?\]\s*,/);
if (!factoriesMatch) {
  console.error('Could not find factories array in params.js');
  process.exit(1);
}

// Parse JSON-like structure from params
// We'll use a simple regex-based approach to extract key factory properties
const factoryPattern = /\{[^}]*?guid\s*:\s*(\d+)[^}]*?(?:name|locaText)\s*:\s*"([^"]+)"[^}]*?(?:maintenances\s*:\s*\[([\d,\s]*)\])?[^}]*?(?:inputs\s*:\s*\[([\d,\s]*)\])?[^}]*?(?:outputs\s*:\s*\[([\d,\s]*)\])?[^}]*?(?:tpmin\s*:\s*([0-9.]+))?[^}]*?\}/g;

let match;
const referenceFactories = new Map();

// More comprehensive extraction - let's manually parse the structure
// First, let's look at the structure of factories.js more carefully
console.log('=== AUDIT: Reference Data vs App Production Chains ===\n');

// Read our app's production chains
const appChainsFile = '/workspaces/NeoAnno-Designer/data/generatedProductionChains.ts';
const appContent = fs.readFileSync(appChainsFile, 'utf-8');

// Extract production chains array from TypeScript
const chainArrayMatch = appContent.match(/export const productionChains: ProductionChain\[\]\s*=\s*\[([\s\S]*)\];/);
if (!chainArrayMatch) {
  console.error('Could not find productionChains array');
  process.exit(1);
}

// Parse the array by looking for individual chain objects
const chainObjectPattern = /\{\s*name:\s*"([^"]+)"[^}]*?\}/g;
const appChainNames = new Set();
let appMatch;
while ((appMatch = chainObjectPattern.exec(appContent)) !== null) {
  appChainNames.add(appMatch[1]);
}

// Count chains in app
const appChainCount = appChainNames.size;
console.log(`App Production Chains: ${appChainCount}`);
console.log(`Sample chains in app: ${Array.from(appChainNames).slice(0, 10).join(', ')}\n`);

// For reference, let's count from our generated file structure
const lines = appContent.split('\n');
let productionChainCount = 0;
for (const line of lines) {
  if (line.includes('name:') && line.includes('"') && lines[lines.indexOf(line) + 10]?.includes('outputs')) {
    productionChainCount++;
  }
}

// Manual count of chains by looking for opening braces at chain level
let openCount = 0;
let inChainArray = false;
let chainCount = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('productionChains:')) inChainArray = true;
  if (inChainArray && line.trim().startsWith('{')) {
    // Check if it's a chain definition (has name and icon)
    let isChain = false;
    for (let j = i; j < Math.min(i + 15, lines.length); j++) {
      if (lines[j].includes('name:') && lines[j].includes('"')) {
        isChain = true;
        break;
      }
    }
    if (isChain) chainCount++;
  }
}

console.log(`Calculated chain count: ${chainCount}`);

// Read industry data for consumption rates
const industryFile = '/workspaces/NeoAnno-Designer/data/industryData.ts';
const industryContent = fs.readFileSync(industryFile, 'utf-8');

// Extract consumption rate entries
const consumptionMatch = industryContent.match(/CONSUMPTION_RATES[\s\S]*?}[\s\S]*?};/);
const consumptionPopulationTypes = consumptionMatch 
  ? (consumptionMatch[0].match(/'[^']+'\s*:/g) || []).map(s => s.replace(/[':]/g, '')).filter(s => s.length > 0)
  : [];

console.log(`Consumption Rate Groups in App: ${consumptionPopulationTypes.length}`);
console.log(`Groups: ${consumptionPopulationTypes.join(', ')}\n`);

// Now let's examine the reference params structure more carefully
// Extract some known factories to map
const knownFactories = [
  'Lumberjack',
  'Sawmill',
  'Fishery',
  'Potato Farm',
  'Schnapps',
  'Sheep Farm',
  'Clay Pit',
  'Brick Factory',
  'Iron Mine',
  'Gold Mine'
];

console.log('=== WORKFORCE ANALYSIS ===\n');

// Parse workforce from our app chains
const workforcePattern = /workforce:\s*\{\s*type:\s*"([^"]+)"\s*,\s*amount:\s*(\d+)\s*\}/g;
const appWorkforceData = new Map();
let wfMatch;
while ((wfMatch = workforcePattern.exec(appContent)) !== null) {
  const type = wfMatch[1];
  const amount = parseInt(wfMatch[2]);
  if (!appWorkforceData.has(type)) {
    appWorkforceData.set(type, []);
  }
  appWorkforceData.get(type).push(amount);
}

console.log('Workforce Types in App:');
for (const [type, amounts] of appWorkforceData.entries()) {
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const avg = Math.round(amounts.reduce((a, b) => a + b) / amounts.length);
  console.log(`  ${type}: min=${min}, avg=${avg}, max=${max}, count=${amounts.length}`);
}

console.log('\n=== PRODUCTION CHAIN ANALYSIS ===\n');

// Extract cycle times
const cycleTimePattern = /cycleTime:\s*(\d+)/g;
const cycleTimes = [];
let ctMatch;
while ((ctMatch = cycleTimePattern.exec(appContent)) !== null) {
  cycleTimes.push(parseInt(ctMatch[1]));
}

const uniqueCycleTimes = new Set(cycleTimes);
console.log(`Unique Cycle Times: ${Array.from(uniqueCycleTimes).sort((a, b) => a - b).join(', ')}`);

// Extract regions
const regionPattern = /region:\s*"([^"]+)"/g;
const regions = new Set();
let rMatch;
while ((rMatch = regionPattern.exec(appContent)) !== null) {
  regions.add(rMatch[1]);
}

console.log(`Regions in App: ${Array.from(regions).join(', ')}\n`);

// Extract tiers
const tierPattern = /tier:\s*"([^"]+)"/g;
const tiers = new Set();
let tMatch;
while ((tMatch = tierPattern.exec(appContent)) !== null) {
  tiers.add(tMatch[1]);
}

console.log(`Tiers in App: ${Array.from(tiers).join(', ')}\n`);

// Analyze inputs - what products are consumed
const inputPattern = /inputs:\s*\[\s*({[^}]*}(?:\s*,\s*{[^}]*})*)\s*\]/g;
const products = new Set();
let inMatch;
while ((inMatch = inputPattern.exec(appContent)) !== null) {
  const inputStr = inMatch[1];
  const productMatches = inputStr.match(/product:\s*"([^"]+)"/g);
  if (productMatches) {
    productMatches.forEach(pm => {
      const product = pm.replace(/product:\s*"|"/g, '');
      products.add(product);
    });
  }
}

console.log(`=== PRODUCTION ANALYSIS ===\n`);
console.log(`Unique Input Products: ${products.size}`);
console.log(`Products: ${Array.from(products).sort().join(', ')}\n`);

// Extract output products
const outputPattern = /outputProduct:\s*"([^"]+)"/g;
const outputProducts = new Set();
let oMatch;
while ((oMatch = outputPattern.exec(appContent)) !== null) {
  outputProducts.add(oMatch[1]);
}

console.log(`Unique Output Products: ${outputProducts.size}`);
console.log(`Outputs: ${Array.from(outputProducts).sort().join(', ')}\n`);

// Check for missing modules
const modulePattern = /modules:\s*\{[^}]*\}/g;
const chainsWithModules = (appContent.match(modulePattern) || []).length;
console.log(`Chains with Modules: ${chainsWithModules}\n`);

// Now let's check building identifiers
const identifierPattern = /identifier:\s*"([^"]+)"/g;
const identifiers = new Set();
let idMatch;
while ((idMatch = identifierPattern.exec(appContent)) !== null) {
  identifiers.add(idMatch[1]);
}

console.log(`=== IDENTIFIER ANALYSIS ===\n`);
console.log(`Buildings with Identifiers: ${identifiers.size}`);
console.log(`Buildings without Identifiers: ${chainCount - identifiers.size}`);

// Check for icons
const iconPattern = /icon:\s*"([^"]+)"/g;
const icons = new Set();
let icMatch;
while ((icMatch = iconPattern.exec(appContent)) !== null) {
  icons.add(icMatch[1]);
}

console.log(`\n=== ICON ANALYSIS ===\n`);
console.log(`Buildings with Icons: ${icons.size}`);
console.log(`Buildings without Icons: ${chainCount - icons.size}`);
console.log(`Unique Icon Files: ${icons.size}`);

// Detailed breakdown by region
console.log(`\n=== CHAINS BY REGION ===\n`);
const regionChains = {};
const buildingsByRegion = {};

// Parse the file more carefully to get region info per chain
const lines2 = appContent.split('\n');
for (let i = 0; i < lines2.length; i++) {
  const line = lines2[i];
  if (line.includes('name:') && line.includes('"')) {
    // Found a chain, now find its region
    let chainName = '';
    let region = '';
    for (let j = i; j < Math.min(i + 20, lines2.length); j++) {
      const l = lines2[j];
      if (l.includes('name:') && !chainName) {
        chainName = l.match(/"([^"]+)"/)?.[1] || '';
      }
      if (l.includes('region:')) {
        region = l.match(/"([^"]+)"/)?.[1] || '';
        break;
      }
    }
    if (region) {
      if (!regionChains[region]) regionChains[region] = 0;
      regionChains[region]++;
    }
  }
}

for (const [region, count] of Object.entries(regionChains).sort()) {
  console.log(`  ${region}: ${count} chains`);
}

console.log(`\n=== SUMMARY ===\n`);
console.log(`Total Production Chains in App: ~${chainCount}`);
console.log(`Unique Output Products: ${outputProducts.size}`);
console.log(`Unique Input Products: ${products.size}`);
console.log(`Workforce Types: ${appWorkforceData.size}`);
console.log(`Regions: ${regions.size}`);
console.log(`Tiers: ${tiers.size}`);
console.log(`Buildings with Full Icons: ${icons.size}`);
console.log(`Buildings with Identifiers: ${identifiers.size}`);
console.log(`Chains with Module Configs: ${chainsWithModules}`);

// Check for common issues
console.log(`\n=== POTENTIAL ISSUES ===\n`);

// Check for duplicate names
const lines3 = appContent.split('\n');
const names = [];
for (const line of lines3) {
  const m = line.match(/name:\s*"([^"]+)"/);
  if (m) names.push(m[1]);
}

const duplicates = names.filter((item, index) => names.indexOf(item) !== index);
if (duplicates.length > 0) {
  console.log(`⚠ Duplicate chain names: ${new Set(duplicates).size}`);
}

// Check for missing workforce
const allLines = appContent.split('\n');
let inChain = false;
let chainName = '';
let hasWorkforce = false;
let chainsWithoutWorkforce = 0;

for (let i = 0; i < allLines.length; i++) {
  const line = allLines[i];
  
  if (line.includes('name:') && line.includes('"')) {
    if (inChain && !hasWorkforce) {
      chainsWithoutWorkforce++;
    }
    inChain = true;
    hasWorkforce = false;
    chainName = line.match(/"([^"]+)"/)?.[1] || '';
  }
  
  if (inChain && line.includes('workforce:')) {
    hasWorkforce = true;
  }
  
  if (line.includes('},') && inChain) {
    if (!hasWorkforce) {
      chainsWithoutWorkforce++;
    }
    inChain = false;
  }
}

console.log(`Chains without Workforce Definition: ${chainsWithoutWorkforce}`);

// Check for chains without inputs that should have them
console.log(`\nChains with No Inputs (should be raw materials): ${(appContent.match(/inputs:\s*\[\s*\]/g) || []).length}`);

console.log('\n=== NEXT STEPS ===\n');
console.log('1. Compare with reference params.js for missing factories');
console.log('2. Validate workforce amounts against reference maintenances array');
console.log('3. Check production cycle times against reference tpmin values');
console.log('4. Verify consumption rates match reference consumption.js');
console.log('5. Cross-reference regional availability from reference');

// Test script to verify PRODUCTION_CHAINS_FULL has correct regions
import { PRODUCTION_CHAINS_FULL } from '../data/industryData.js';

const regionCounts = {};

Object.entries(PRODUCTION_CHAINS_FULL).forEach(([key, chain]) => {
    const region = chain.region;
    if (!regionCounts[region]) regionCounts[region] = [];
    regionCounts[region].push(chain.name);
});

console.log('\n=== PRODUCTION_CHAINS_FULL Region Distribution ===\n');

Object.entries(regionCounts).sort((a, b) => b[1].length - a[1].length).forEach(([region, products]) => {
    console.log(`${region}: ${products.length} chains`);
    console.log(`  Sample products: ${products.slice(0, 5).join(', ')}${products.length > 5 ? '...' : ''}`);
    console.log();
});

console.log('Total chains:', Object.keys(PRODUCTION_CHAINS_FULL).length);

// Show some specific Arctic and Enbesa examples
console.log('\n=== Arctic Chains Sample ===');
const arctic = regionCounts['Arctic'] || [];
arctic.slice(0, 10).forEach(p => {
    const chain = Object.values(PRODUCTION_CHAINS_FULL).find(c => c.name === p);
    console.log(`  ${chain.name} (${chain.buildingId}) - ${chain.outputPerMinute} per min`);
});

console.log('\n=== Enbesa Chains Sample ===');
const enbesa = regionCounts['Enbesa'] || [];
enbesa.slice(0, 10).forEach(p => {
    const chain = Object.values(PRODUCTION_CHAINS_FULL).find(c => c.name === p);
    console.log(`  ${chain.name} (${chain.buildingId}) - ${chain.outputPerMinute} per min`);
});

// Quick verification script to check chain region mapping
const fs = require('fs');
const path = require('path');

// Read the reference data
const refData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reference/production-chains.json'), 'utf8'));

const regionIdToName = (id) => {
    switch (id) {
        case 1: return 'Old World';
        case 2: return 'New World';
        case 4: return 'Arctic';
        case 5: return 'Enbesa';
        case 3: return 'Cape Trelawney';
        default: return 'Unknown';
    }
};

const chains = refData.Production_Chain;
const regionCounts = {};

console.log('\n=== Chain Region Distribution ===\n');

Object.entries(chains).forEach(([key, chain]) => {
    const region = regionIdToName(chain.regionID);
    if (!regionCounts[region]) regionCounts[region] = [];
    regionCounts[region].push(chain.finalProduct);
});

Object.entries(regionCounts).sort((a, b) => b[1].length - a[1].length).forEach(([region, products]) => {
    console.log(`${region}: ${products.length} chains`);
    console.log(`  Examples: ${products.slice(0, 5).join(', ')}${products.length > 5 ? '...' : ''}`);
    console.log();
});

console.log('Total chains:', Object.keys(chains).length);

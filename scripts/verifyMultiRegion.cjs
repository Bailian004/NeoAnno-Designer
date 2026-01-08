// Verify the multi-region approach works correctly
const fs = require('fs');
const path = require('path');

const refData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reference/production-chains.json'), 'utf8'));

const regionIdToName = (id) => {
    switch (id) {
        case 1: return 'Old World';
        case 2: return 'New World';
        case 4: return 'Arctic';
        case 5: return 'Enbesa';
        case 3: return 'Cape Trelawney';
        default: return 'Old World';
    }
};

const chains = refData.Production_Chain;
const out = {};

Object.entries(chains).forEach(([refKey, chain]) => {
    const region = regionIdToName(chain.regionID);
    const key = chain.finalProduct;
    
    if (!out[key]) {
        out[key] = {
            name: chain.finalProduct,
            regions: [region],
            buildingId: chain.name
        };
    } else {
        if (!out[key].regions.includes(region)) {
            out[key].regions.push(region);
        }
    }
});

console.log('\n=== Multi-Region Chain Results ===\n');
console.log(`Total unique products: ${Object.keys(out).length}`);
console.log(`Total chains in reference: ${Object.keys(chains).length}`);

const multiRegion = Object.values(out).filter(c => c.regions.length > 1);
console.log(`\nProducts in multiple regions: ${multiRegion.length}`);

multiRegion.forEach(c => {
    console.log(`\n${c.name}:`);
    console.log(`  Regions: ${c.regions.join(', ')}`);
    console.log(`  Building: ${c.buildingId}`);
});

// Show region distribution
console.log('\n=== Chains per Region (with duplicates for multi-region) ===\n');
const regionCounts = {};
Object.values(out).forEach(c => {
    c.regions.forEach(r => {
        if (!regionCounts[r]) regionCounts[r] = 0;
        regionCounts[r]++;
    });
});

Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
    console.log(`${region}: ${count} chains`);
});

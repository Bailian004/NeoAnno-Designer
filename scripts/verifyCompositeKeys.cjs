// Verify the composite key approach keeps all chains
const fs = require('fs');
const path = require('path');

console.log('\n=== Verifying Composite Key Solution ===\n');

// Simulate the new logic
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
    const key = `${chain.finalProduct}::${region}`;
    out[key] = {
        id: key,
        name: chain.finalProduct,
        region: region,
        buildingId: chain.name
    };
});

console.log(`Total chains with composite keys: ${Object.keys(out).length}`);
console.log(`Original chains in reference: ${Object.keys(chains).length}`);
console.log(`Match: ${Object.keys(out).length === Object.keys(chains).length ? '✓' : '✗'}`);

// Show examples of composite keys
console.log('\n=== Sample Composite Keys ===\n');
Object.keys(out).slice(0, 10).forEach(key => {
    const chain = out[key];
    console.log(`${key}`);
    console.log(`  -> ${chain.name} in ${chain.region} (${chain.buildingId})`);
});

// Show regional variants
console.log('\n=== Regional Variants ===\n');
['Timber', 'Bricks', 'Sails'].forEach(product => {
    console.log(`${product}:`);
    Object.keys(out).filter(k => k.startsWith(product + '::')).forEach(k => {
        console.log(`  - ${out[k].region}`);
    });
});

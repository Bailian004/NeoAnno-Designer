// Check for duplicate product names across regions in reference data
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
        default: return 'Unknown';
    }
};

const chains = refData.Production_Chain;
const productsByName = {};

Object.entries(chains).forEach(([key, chain]) => {
    const product = chain.finalProduct;
    if (!productsByName[product]) {
        productsByName[product] = [];
    }
    productsByName[product].push({
        key: key,
        region: regionIdToName(chain.regionID),
        building: chain.name
    });
});

console.log('\n=== Products Appearing in Multiple Regions ===\n');

const duplicates = Object.entries(productsByName).filter(([name, entries]) => entries.length > 1);

duplicates.forEach(([product, entries]) => {
    console.log(`${product}: ${entries.length} variants`);
    entries.forEach(e => {
        console.log(`  - ${e.region} (${e.key}) via ${e.building}`);
    });
    console.log();
});

console.log(`\nTotal products: ${Object.keys(productsByName).length}`);
console.log(`Products with regional variants: ${duplicates.length}`);
console.log(`Total chains in file: ${Object.keys(chains).length}`);
console.log(`Chains lost to deduplication: ${Object.keys(chains).length - Object.keys(productsByName).length}`);

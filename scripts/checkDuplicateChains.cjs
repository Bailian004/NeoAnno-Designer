// Check for duplicate final products across regions
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
    const name = chain.finalProduct;
    if (!productsByName[name]) {
        productsByName[name] = [];
    }
    productsByName[name].push({
        key,
        region: regionIdToName(chain.regionID),
        building: chain.name
    });
});

console.log('\n=== Products appearing in multiple regions ===\n');

const duplicates = Object.entries(productsByName).filter(([_, variants]) => variants.length > 1);

duplicates.forEach(([product, variants]) => {
    console.log(`${product}:`);
    variants.forEach(v => {
        console.log(`  - ${v.region} (key: "${v.key}", building: "${v.building}")`);
    });
    console.log();
});

console.log(`Total products: ${Object.keys(productsByName).length}`);
console.log(`Products with regional variants: ${duplicates.length}`);
console.log(`Total chains in reference: ${Object.keys(chains).length}`);
console.log(`Chains being lost to deduplication: ${Object.keys(chains).length - Object.keys(productsByName).length}`);

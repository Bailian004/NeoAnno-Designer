// Compare our current output with the expected table
const fs = require('fs');
const path = require('path');

// Expected data from user's table
const expectedRegions = {
    'Sawmill': ['Old World', 'Cape Trelawney', 'New World', 'Arctic'],
    'Schnapps Distillery': ['Old World', 'Cape Trelawney'],
    'Framework Knitters': ['Old World', 'Cape Trelawney'],
    'Brick Factory': ['Old World', 'Cape Trelawney', 'New World'],
    'Slaughterhouse': ['Old World', 'Cape Trelawney'],
    'Flour Mill': ['Old World', 'Cape Trelawney'],
    'Bakery': ['Old World', 'Cape Trelawney'],
    'Sailmakers': ['Old World', 'Cape Trelawney', 'New World'],
    'Furnace': ['Old World', 'Cape Trelawney'],
    'Steelworks': ['Old World', 'Cape Trelawney'],
    'Rendering Works': ['Old World', 'Cape Trelawney'],
    'Soap Factory': ['Old World', 'Cape Trelawney'],
    'Weapon Factory': ['Old World', 'Cape Trelawney'],
    'Malthouse': ['Old World', 'Cape Trelawney'],
    'Brewery': ['Old World', 'Cape Trelawney'],
    'Glassmakers': ['Old World', 'Cape Trelawney'],
    'Window Makers': ['Old World', 'Cape Trelawney'],
    'Artisanal Kitchen': ['Old World', 'Cape Trelawney'],
    'Cannery': ['Old World', 'Cape Trelawney'],
    'Sewing Machine Factory': ['Old World', 'Cape Trelawney'],
    'Fur Dealer': ['Old World', 'Cape Trelawney'],
    'Concrete Factory': ['Old World', 'Cape Trelawney'],
    'Brass Smeltery': ['Old World', 'Cape Trelawney'],
    'Spectacle Factory': ['Old World', 'Cape Trelawney'],
    'Dynamite Factory': ['Old World', 'Cape Trelawney'],
    'Heavy Weapons Factory': ['Old World', 'Cape Trelawney'],
    'Bicycle Factory': ['Old World', 'Cape Trelawney'],
    'Motor Assembly Line': ['Old World', 'Cape Trelawney'],
    'Fuel Station': ['Old World', 'Cape Trelawney'],
    'Goldsmiths': ['Old World', 'Cape Trelawney'],
    'Clockmakers': ['Old World', 'Cape Trelawney'],
    'Filament Factory': ['Old World', 'Cape Trelawney'],
    'Light Bulb Factory': ['Old World', 'Cape Trelawney'],
    'Champagne Cellar': ['Old World', 'Cape Trelawney'],
    'Marquetry Workshop': ['Old World', 'Cape Trelawney'],
    'Jewellers': ['Old World', 'Cape Trelawney'],
    'Gramophone Factory': ['Old World', 'Cape Trelawney'],
    'Coachmakers': ['Old World', 'Cape Trelawney'],
    'Cab Assembly Line': ['Old World', 'Cape Trelawney'],
    'Bootmakers': ['Old World', 'Cape Trelawney'],
    'Tailor\'s Shop': ['Old World', 'Cape Trelawney'],
    'Telephone Manufacturer': ['Old World', 'Cape Trelawney'],
    'Advanced Coffee Roaster': ['Enbesa'],
    'Advanced Rum Distillery': ['Enbesa'],
    'Advanced Cotton Mill': ['Enbesa'],
    'Fried Plantain Kitchen': ['Enbesa'],
    'Rum Distillery': ['New World'],
    'Cotton Mill': ['New World'],
    'Poncho Darner': ['New World'],
    'Tortilla Maker': ['New World'],
    'Coffee Roaster': ['New World'],
    'Felt Producer': ['New World'],
    'Bombín Weaver': ['New World'],
    'Cigar Factory': ['New World'],
    'Sugar Refinery': ['New World'],
    'Chocolate Factory': ['New World'],
    'Linen Mill': ['Enbesa'],
    'Embroiderer': ['Enbesa'],
    'Dry-House': ['Enbesa'],
    'Tea Spicer': ['Enbesa'],
    'Brick Dry-House': ['Enbesa'],
    'Ceramics Workshop': ['Enbesa'],
    'Tapestry Looms': ['Enbesa'],
    'Teff Mill': ['Enbesa'],
    'Wat Kitchen': ['Enbesa'],
    'Pipe Maker': ['Enbesa'],
    'Luminer': ['Arctic'],
    'Chandler': ['Arctic'],
    'Lanternsmith': ['Arctic'],
    'Pemmican Cookhouse': ['Arctic'],
    'Sleeping Bag Factory': ['Arctic'],
    'Oil Lamp Factory': ['Arctic'],
    'Parka Factory': ['Arctic'],
    'Sled Frame Factory': ['Arctic'],
    'Husky Sled Factory': ['Arctic'],
};

// Read reference data to see what we're actually getting
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
const actualFromRef = {};

// Build what we get from reference data
Object.entries(chains).forEach(([key, chain]) => {
    const region = regionIdToName(chain.regionID);
    const building = chain.name;
    
    if (!actualFromRef[building]) {
        actualFromRef[building] = [];
    }
    if (!actualFromRef[building].includes(region)) {
        actualFromRef[building].push(region);
    }
});

console.log('\n=== Comparing Reference Data vs Expected ===\n');

// Check what's in expected but not in reference
console.log('Buildings in expected table but NOT in reference data:');
Object.keys(expectedRegions).forEach(building => {
    if (!actualFromRef[building]) {
        console.log(`  ❌ ${building}: Expected ${expectedRegions[building].join(', ')}`);
    }
});

console.log('\n\nBuildings with WRONG regions in reference data:');
Object.keys(expectedRegions).forEach(building => {
    if (actualFromRef[building]) {
        const expected = expectedRegions[building].sort().join(', ');
        const actual = actualFromRef[building].sort().join(', ');
        if (expected !== actual) {
            console.log(`\n  ${building}:`);
            console.log(`    Expected: ${expected}`);
            console.log(`    Actual:   ${actual}`);
        }
    }
});

console.log('\n\nBuildings in reference data but NOT in expected table:');
Object.keys(actualFromRef).forEach(building => {
    if (!expectedRegions[building]) {
        console.log(`  ℹ️  ${building}: ${actualFromRef[building].join(', ')}`);
    }
});

console.log('\n\n=== Summary ===');
console.log(`Expected buildings: ${Object.keys(expectedRegions).length}`);
console.log(`Actual buildings: ${Object.keys(actualFromRef).length}`);

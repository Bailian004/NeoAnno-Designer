import fs from 'fs';

// Load params rates
const paramsRates = JSON.parse(fs.readFileSync('/tmp/params_rates.json', 'utf8'));

// Read industryData.ts
const industryData = fs.readFileSync('./data/industryData.ts', 'utf8');

// Parse all buildings from PRODUCTION_CHAINS_FULL by matching the outputPerMinute pattern
const buildingMatches = [...industryData.matchAll(/(?:id|name):\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*buildingId:\s*['"]([^'"]+)['"]\s*,\s*outputPerMinute:\s*([\d.]+)/g)];

// Also parse PRODUCTION_CHAINS entries
const legacyMatches = [...industryData.matchAll(/['"]([^'"]+)['"]:\s*{\s*id:\s*['"]([^'"]+)['"]\s*,\s*name:\s*['"]([^'"]+)['"]\s*,\s*buildingId:\s*['"]([^'"]+)['"]\s*,\s*outputPerMinute:\s*([\d.]+)/g)];

const buildings = [];

// Process PRODUCTION_CHAINS_FULL matches
buildingMatches.forEach(match => {
    const [_, id, name, buildingId, outputPerMinute] = match;
    buildings.push({ id, name, buildingId, outputPerMinute: parseFloat(outputPerMinute), source: 'PRODUCTION_CHAINS_FULL' });
});

// Process legacy PRODUCTION_CHAINS matches
legacyMatches.forEach(match => {
    const [_, key, id, name, buildingId, outputPerMinute] = match;
    buildings.push({ id, name, buildingId, outputPerMinute: parseFloat(outputPerMinute), source: 'PRODUCTION_CHAINS' });
});

// Create a map of buildingId to best matching params name
const buildingNameMap = {
    'Sawmill': 'Sawmill',
    'Lumberjack Hut': "Lumberjack's Hut",
    'Fishery': 'Fishery',
    'Schnapps Distillery': 'Schnapps Distillery',
    'Framework Knitters': 'Framework Knitters',
    'Brick Factory': 'Brick Factory',
    'Clay Pit': 'Clay Pit',
    'Slaughterhouse': "Butcher's",
    'Soap Factory': 'Soap Factory',
    'Bakery': 'Bakery',
    'Brewery': 'Brewery',
    'Sailmakers': 'Sailmakers',
    'Steelworks': 'Steelworks',
    'Weapon Factory': 'Weapon Factory',
    'Window Makers': 'Window-Makers',
    'Cannery': 'Cannery',
    'Sewing Machine Factory': 'Sewing Machine Factory',
    'Fur Dealer': 'Fur Dealer',
    'Concrete Factory': 'Concrete Factory',
    'Bicycle Factory': 'Bicycle Factory',
    'Brass Smeltery': 'Brass Smeltery',
    'Spectacle Factory': 'Spectacle Factory',
    'Fried Plantain Kitchen': 'Fried Plantain Kitchen',
    'Rum Distillery': 'Rum Distillery',
    'Poncho Darner': 'Poncho Darner',
    'Tortilla Maker': 'Tortilla Maker',
    'Coffee Roaster': 'Coffee Roaster',
    'Felt Producer': 'Felt Producer',
    // Arctic buildings
    'Caribou Hunter': 'Caribou Hunter',
    'Goose Farm': 'Goose Farm',
    'Bear Hunter': 'Bear Hunter',
    'Husky Farm': 'Husky Farm',
    'Whale Hunter': 'Whale Hunter',
    'Sleeping Bag Factory': 'Sleeping Bag Factory',
    'Oil Lamp Factory': 'Oil Lamp Factory',
    'Sled Frame Factory': 'Sled Frame Factory',
    'Husky Sled Factory': 'Husky Sled Factory',
    'Pemmican Factory': 'Pemmican Factory',
    'Parka Embroiderer': 'Parka Embroiderer',
    // Enbesa buildings
    'Wanza Woodcutter': 'Wanza Woodcutter',
    'Hibiscus Farm': 'Hibiscus Farm',
    'Indigo Farm': 'Indigo Farm',
    'Spice Farm': 'Spice Farm',
    'Goat Farm': 'Goat Farm',
    'Linen Mill': 'Linen Mill',
    'Tea Spicer': 'Tea Spicer',
    'Ceramics Workshop': 'Ceramics Workshop',
    'Tapestry Looms': 'Tapestry Looms',
    'Lanternsmith': 'Lanternsmith',
    'Clay Pipe Maker': 'Clay Pipe Maker',
    'Dried Meat Kitchen': 'Dried Meat Kitchen',
    'Seafood Stew Kitchen': 'Seafood Stew Kitchen',
    'Scriptorium': 'Scriptorium',
    'Finery Weaver': 'Finery Weaver',
};

// Normalize building name for matching
const normalize = (name) => name.toLowerCase().replace(/['\-\s]/g, '');

// Create reverse map for fuzzy matching
const paramsKeyMap = {};
Object.keys(paramsRates).forEach(key => {
    paramsKeyMap[normalize(key)] = key;
});

// Compare and output results
const results = [];

buildings.forEach(building => {
    const mappedName = buildingNameMap[building.buildingId];
    let paramsName = mappedName;
    let paramsRate = mappedName ? paramsRates[mappedName] : undefined;
    
    // If no direct match, try fuzzy matching
    if (paramsRate === undefined) {
        const normalized = normalize(building.buildingId);
        const fuzzyMatch = paramsKeyMap[normalized];
        if (fuzzyMatch) {
            paramsName = fuzzyMatch;
            paramsRate = paramsRates[fuzzyMatch];
        }
    }
    
    const match = paramsRate !== undefined && Math.abs(paramsRate - building.outputPerMinute) < 0.01;
    
    results.push({
        productName: building.name,
        buildingId: building.buildingId,
        industryDataRate: building.outputPerMinute,
        paramsRate: paramsRate !== undefined ? paramsRate : 'NOT FOUND',
        paramsName: paramsName || building.buildingId,
        match: paramsRate !== undefined ? (match ? '✓' : '✗') : '?',
        source: building.source
    });
});

// Sort by match status (errors first), then by name
results.sort((a, b) => {
    if (a.match === '✗' && b.match !== '✗') return -1;
    if (a.match !== '✗' && b.match === '✗') return 1;
    if (a.match === '?' && b.match !== '?') return -1;
    if (a.match !== '?' && b.match === '?') return 1;
    return a.productName.localeCompare(b.productName);
});

// Output as markdown table
console.log('# Production Rate Comparison');
console.log();
console.log('| Product Name | Building ID | industryData.ts Rate | params.js Rate | Match |');
console.log('|--------------|-------------|---------------------|----------------|-------|');

results.forEach(r => {
    const rateDisplay = r.paramsRate === 'NOT FOUND' ? 'NOT FOUND' : r.paramsRate.toString();
    console.log(`| ${r.productName} | ${r.buildingId} | ${r.industryDataRate} | ${rateDisplay} | ${r.match} |`);
});

// Summary
const errors = results.filter(r => r.match === '✗');
const notFound = results.filter(r => r.match === '?');
const correct = results.filter(r => r.match === '✓');

console.log();
console.log('## Summary');
console.log();
console.log(`- ✓ Correct: ${correct.length}`);
console.log(`- ✗ Incorrect: ${errors.length}`);
console.log(`- ? Not Found in params.js: ${notFound.length}`);
console.log(`- Total: ${results.length}`);

if (errors.length > 0) {
    console.log();
    console.log('## Errors to Fix:');
    console.log();
    errors.forEach(r => {
        console.log(`- **${r.productName}** (${r.buildingId}): ${r.industryDataRate} → ${r.paramsRate}`);
    });
}

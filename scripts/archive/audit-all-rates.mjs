import fs from 'fs';

// Load params rates
const paramsRates = JSON.parse(fs.readFileSync('/tmp/params_rates.json', 'utf8'));

// Read generatedProductionChains
const genChainsContent = fs.readFileSync('./data/generatedProductionChains.ts', 'utf8');

// Extract production chains from the file
const chainsMatch = genChainsContent.match(/export const productionChains = (\[[\s\S]*?\]);/);
if (!chainsMatch) {
    console.error('Could not find productionChains export');
    process.exit(1);
}

const chains = eval(chainsMatch[1]); // Parse the JavaScript array

// Calculate outputPerMinute for each chain
const results = [];

chains.forEach(chain => {
    if (!chain.name || !chain.cycleTime) return;
    
    const outputAmount = chain.outputAmount || 1;
    const outputPerMinute = chain.cycleTime > 0 ? (60 / chain.cycleTime) * outputAmount : 0;
    
    // Try to match with params.js
    const normalizedName = chain.name.toLowerCase().replace(/['\-\s.]/g, '');
    
    // Find closest match in params
    let paramsMatch = null;
    let paramsRate = null;
    
    for (const [paramsName, rate] of Object.entries(paramsRates)) {
        const normalizedParams = paramsName.toLowerCase().replace(/['\-\s.]/g, '');
        if (normalizedParams.includes(normalizedName) || normalizedName.includes(normalizedParams)) {
            paramsMatch = paramsName;
            paramsRate = rate;
            break;
        }
    }
    
    // Special matching for some buildings
    const specialMatches = {
        'caribouhunting': 'Caribou Hunter',
        'goosefarm': 'Goose Farm',
        'bearhunting': 'Bear Hunter',
        'huskyfarm': 'Husky Farm',
        'whalehunter': 'Whale Hunter',
        'sleepingbag': 'Sleeping Bag Factory',
        'oillampfac': 'Oil Lamp Factory',
        'sledframefac': 'Sled Frame Factory',
        'huskysledfac': 'Husky Sled Factory',
        'pemmicanfac': 'Pemmican Factory',
        'parkaembroid': 'Parka Embroiderer',
        'wanzawoodcutter': 'Wanza Woodcutter',
        'hibiscusfarm': 'Hibiscus Farm',
        'indigofarm': 'Indigo Farm',
        'spicefarm': 'Spice Farm',
        'goatfarm': 'Goat Farm',
        'linenmill': 'Linen Mill',
        'teaspiceblend': 'Tea Spicer',
        'ceramicsworkshop': 'Ceramics Workshop',
        'tapestryloom': 'Tapestry Looms',
        'lanternsmith': 'Lanternsmith',
        'claypipemaker': 'Clay Pipe Maker',
        'driedmeatfac': 'Dried Meat Kitchen',
        'seafoodstewkitchen': 'Seafood Stew Kitchen',
        'illuminatedscript': 'Scriptorium',
        'finery': 'Finery Weaver',
    };
    
    if (!paramsMatch && specialMatches[normalizedName]) {
        paramsMatch = specialMatches[normalizedName];
        paramsRate = paramsRates[paramsMatch];
    }
    
    const match = paramsRate !== null && Math.abs(paramsRate - outputPerMinute) < 0.01;
    
    results.push({
        name: chain.name,
        identifier: chain.identifier || '',
        region: chain.region || 'Unknown',
        calculatedRate: Number(outputPerMinute.toFixed(3)),
        paramsRate: paramsRate !== null ? paramsRate : 'NOT FOUND',
        paramsName: paramsMatch || 'NOT FOUND',
        match: paramsRate !== null ? (match ? '✓' : '✗') : '?',
    });
});

// Filter for Arctic and Enbesa primarily, but show all mismatches
const arcticEnbesa = results.filter(r => r.region.includes('Arctic') || r.region.includes('Enbesa'));
const other = results.filter(r => !r.region.includes('Arctic') && !r.region.includes('Enbesa'));

// Sort by match status
const sortByMatch = (a, b) => {
    if (a.match === '✗' && b.match !== '✗') return -1;
    if (a.match !== '✗' && b.match === '✗') return 1;
    if (a.match === '?' && b.match !== '?') return -1;
    if (a.match !== '?' && b.match === '?') return 1;
    return a.name.localeCompare(b.name);
};

arcticEnbesa.sort(sortByMatch);
other.sort(sortByMatch);

// Output
console.log('# Complete Production Rate Audit\n');

console.log('## Arctic Buildings\n');
console.log('| Building Name | Region | Calculated Rate | params.js Rate | Match |');
console.log('|---------------|--------|----------------|----------------|-------|');
arcticEnbesa.filter(r => r.region.includes('Arctic')).forEach(r => {
    console.log(`| ${r.name} | ${r.region} | ${r.calculatedRate} | ${r.paramsRate} | ${r.match} |`);
});

console.log('\n## Enbesa Buildings\n');
console.log('| Building Name | Region | Calculated Rate | params.js Rate | Match |');
console.log('|---------------|--------|----------------|----------------|-------|');
arcticEnbesa.filter(r => r.region.includes('Enbesa')).forEach(r => {
    console.log(`| ${r.name} | ${r.region} | ${r.calculatedRate} | ${r.paramsRate} | ${r.match} |`);
});

console.log('\n## All Buildings with Errors\n');
console.log('| Building Name | Region | Calculated Rate | params.js Rate | Match |');
console.log('|---------------|--------|----------------|----------------|-------|');
[...arcticEnbesa, ...other].filter(r => r.match === '✗').forEach(r => {
    console.log(`| ${r.name} | ${r.region} | ${r.calculatedRate} | ${r.paramsRate} | ${r.match} |`);
});

// Summary stats
const totalArctic = arcticEnbesa.filter(r => r.region.includes('Arctic')).length;
const totalEnbesa = arcticEnbesa.filter(r => r.region.includes('Enbesa')).length;
const errorsArctic = arcticEnbesa.filter(r => r.region.includes('Arctic') && r.match === '✗').length;
const errorsEnbesa = arcticEnbesa.filter(r => r.region.includes('Enbesa') && r.match === '✗').length;
const totalErrors = results.filter(r => r.match === '✗').length;
const notFound = results.filter(r => r.match === '?').length;

console.log('\n## Summary\n');
console.log(`- **Arctic Buildings**: ${totalArctic} total, ${errorsArctic} errors`);
console.log(`- **Enbesa Buildings**: ${totalEnbesa} total, ${errorsEnbesa} errors`);
console.log(`- **Total Buildings**: ${results.length}`);
console.log(`- **Total Errors**: ${totalErrors}`);
console.log(`- **Not Found in params.js**: ${notFound}`);

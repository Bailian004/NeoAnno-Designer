/**
 * Advanced building coverage audit: fuzzy matching to find renames vs truly missing
 * Uses Levenshtein distance to detect similar building names
 */
const fs = require('fs');
const normalize=str=>(str||'').toLowerCase().replace(/[^a-z0-9]/g,'');

function levenshteinDistance(a, b) {
  const alen = a.length, blen = b.length;
  const matrix = Array(alen + 1).fill(null).map(() => Array(blen + 1).fill(0));
  for(let i = 0; i <= alen; i++) matrix[i][0] = i;
  for(let j = 0; j <= blen; j++) matrix[0][j] = j;
  for(let i = 1; i <= alen; i++) {
    for(let j = 1; j <= blen; j++) {
      const cost = a[i-1] === b[j-1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i-1][j] + 1,
        matrix[i][j-1] + 1,
        matrix[i-1][j-1] + cost
      );
    }
  }
  return matrix[alen][blen];
}

// Load reference data
const producers = JSON.parse(fs.readFileSync('Anno-1800-Calculator-main/src/data/producers.json','utf8'));
const nonProducers = JSON.parse(fs.readFileSync('Anno-1800-Calculator-main/src/data/non-producers.json','utf8'));
const population = JSON.parse(fs.readFileSync('Anno-1800-Calculator-main/src/data/population.json','utf8'));

const ref = new Map();
const refList = [];
for(const [k,v] of Object.entries(producers)){
  const name = v.building || k;
  if(!ref.has(normalize(name))) {
    ref.set(normalize(name), name);
    refList.push(name);
  }
}
for(const v of Object.values(nonProducers)){
  const name = v.name;
  if(!ref.has(normalize(name))) {
    ref.set(normalize(name), name);
    refList.push(name);
  }
}
for(const v of Object.values(population)){
  if(!ref.has(normalize(v.name))) {
    ref.set(normalize(v.name), v.name);
    refList.push(v.name);
  }
}

// Load our data
const src = fs.readFileSync('data/annoData.ts','utf8');
const our = new Map();
const ourList = [];
for(const m of src.matchAll(/Identifier:"([^"]+)".*?Localization:\{eng:"([^"]+)"/g)){
  const id = m[1];
  const eng = m[2];
  our.set(normalize(id), id);
  our.set(normalize(eng), eng);
  ourList.push(eng);
}
const overridesMatch = src.match(/const\s+GAME_LOGIC_OVERRIDES[^=]*=\s*(\{[\s\S]*?\n\});/);
if(overridesMatch){
  const objText = overridesMatch[1];
  for(const m of objText.matchAll(/"([^"]+)"\s*:\s*\{[^}]*?name:\s*'([^']+)'/g)){
    const id = m[1];
    const name = m[2];
    our.set(normalize(id), id);
    our.set(normalize(name), name);
    ourList.push(name);
  }
  for(const m of objText.matchAll(/"([^"]+)"\s*:/g)){
    const id = m[1];
    our.set(normalize(id), id);
    ourList.push(id);
  }
}

// Find missing with fuzzy matching
const FUZZY_THRESHOLD = 3; // max edit distance to consider a match
const trulyMissing = [];
const possibleRenames = [];

for(const refName of refList){
  const norm = normalize(refName);
  if(our.has(norm)){
    continue; // exact match
  }
  
  // fuzzy match: find closest in our list
  let bestDistance = Infinity;
  let bestOurName = null;
  for(const ourName of ourList){
    const dist = levenshteinDistance(norm, normalize(ourName));
    if(dist < bestDistance){
      bestDistance = dist;
      bestOurName = ourName;
    }
  }
  
  if(bestDistance <= FUZZY_THRESHOLD){
    possibleRenames.push({ ref: refName, our: bestOurName, distance: bestDistance });
  } else {
    trulyMissing.push(refName);
  }
}

console.log('=== BUILDING COVERAGE AUDIT ===\n');
console.log(`Reference (producers + non-producers + population): ${ref.size}`);
console.log(`Our identifiers/names: ${our.size}`);
console.log(`Exact matches: ${refList.length - trulyMissing.length - possibleRenames.length}`);
console.log(`Possible renames (fuzzy distance ≤${FUZZY_THRESHOLD}): ${possibleRenames.length}`);
console.log(`Truly missing: ${trulyMissing.length}`);

if(possibleRenames.length > 0){
  console.log(`\n=== POSSIBLE RENAMES (verify these are not duplicates) ===`);
  possibleRenames.sort((a,b)=>a.distance-b.distance);
  possibleRenames.slice(0,30).forEach(r=>{
    console.log(`  "ref: ${r.ref.padEnd(30)} → our: ${r.our}" (distance: ${r.distance})`);
  });
}

if(trulyMissing.length > 0){
  console.log(`\n=== TRULY MISSING (${trulyMissing.length} buildings) ===`);
  trulyMissing.slice(0,50).forEach(name=>{
    console.log(`  - ${name}`);
  });
  if(trulyMissing.length > 50){
    console.log(`  ... and ${trulyMissing.length - 50} more`);
  }
}

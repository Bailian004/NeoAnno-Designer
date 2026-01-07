/**
 * Audit production rates: compare our overrides vs Anno-1800-Calculator producers.json
 * Output per-building per-minute production rates and deltas.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = __dirname + '/..';
const annoDataPath = path.join(repoRoot, 'data', 'annoData.ts');
const producersPath = path.join(repoRoot, 'Anno-1800-Calculator-main', 'src', 'data', 'producers.json');

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Load reference producers
const producers = JSON.parse(fs.readFileSync(producersPath, 'utf-8'));
const refByName = new Map();
for (const [key, val] of Object.entries(producers)) {
  const norm = normalize(val.building || key || '');
  refByName.set(norm, val);
}

// Extract our GAME_LOGIC_OVERRIDES object literal from annoData.ts
const annoDataSource = fs.readFileSync(annoDataPath, 'utf-8');
const match = annoDataSource.match(/const\s+GAME_LOGIC_OVERRIDES[^=]*=\s*(\{[\s\S]*?\n\});/);
if (!match) {
  console.error('Could not find GAME_LOGIC_OVERRIDES in annoData.ts');
  process.exit(1);
}
const literal = match[1];
let overrides;
try {
  overrides = vm.runInNewContext('(' + literal + ')');
} catch (err) {
  console.error('Failed to parse overrides:', err);
  process.exit(1);
}

function calcOurRate(prod) {
  if (!prod?.outputs?.length) return 0;
  const out = prod.outputs[0];
  const amount = out.amount ?? 1;
  const cycle = prod.cycleTime || 30; // assume 30s if missing
  return (amount / cycle) * 60;
}

function calcRefRate(ref) {
  const cycle = ref.productionTime || 30;
  const amount = 1; // reference implies 1 unit per cycle
  return (amount / cycle) * 60;
}

const results = [];
for (const [id, def] of Object.entries(overrides)) {
  if (!def.production || !def.production.outputs || !def.production.outputs.length) continue;
  const name = def.name || id;
  const norm = normalize(name);
  const ref = refByName.get(norm);
  const ourRate = calcOurRate(def.production);
  const refRate = ref ? calcRefRate(ref) : null;
  results.push({ id, name, ourRate, refRate, refName: ref?.building, refProduct: ref?.product });
}

results.sort((a, b) => (b.ourRate || 0) - (a.ourRate || 0));

const header = ['ID', 'Our t/min', 'Ref t/min', 'Ref building', 'Product'];
console.log(header.join('\t'));
results.forEach(r => {
  const delta = r.refRate != null ? ((r.ourRate - r.refRate) / (r.refRate || 1)) : null;
  const deltaStr = r.refRate != null ? delta.toFixed(2) : 'N/A';
  console.log(`${r.id}\t${r.ourRate.toFixed(3)}\t${r.refRate != null ? r.refRate.toFixed(3) : 'N/A'}\t${r.refName || ''}\t${r.refProduct || ''}\tΔ:${deltaStr}`);
});

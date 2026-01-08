#!/usr/bin/env node
/*
  Reports Helpful_info A7 (Anno 1800) icons from presets.json that are NOT matched
  to any building in our app (production chains + residences + services).
  Uses normalized English labels from presets and fuzzy containment checks.
*/
const fs = require('fs');
const path = require('path');

const root = '/workspaces/NeoAnno-Designer';
const helpfulIconsPath = path.join(root, 'Helpful_info', 'icons.json');
const presetsPath = path.join(root, 'Helpful_info', 'presets.json');
const prodPath = path.join(root, 'data', 'generatedProductionChains.ts');
const resPath = path.join(root, 'data', 'generatedResidences.ts');
const svcPath = path.join(root, 'data', 'generatedServiceBuildings.ts');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
function readText(p) { return fs.readFileSync(p, 'utf-8'); }

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/^a[0-9]{1,2}_/, '')
    .replace(/_/g, ' ')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractNames(tsText) {
  const names = new Set();
  const regex = /name:\s*"([^"]+)"/g;
  let m;
  while ((m = regex.exec(tsText)) !== null) names.add(m[1]);
  return Array.from(names);
}

// Load presets and filter to A7 entries with IconFileName
const presets = readJSON(presetsPath);
const buildings = Array.isArray(presets?.Buildings) ? presets.Buildings : [];
const a7Entries = buildings.filter(b => typeof b?.Header === 'string' && b.Header.includes('(A7)'));
const a7IconMap = new Map(); // iconFileName -> label
for (const b of a7Entries) {
  const file = b?.IconFileName;
  const eng = b?.Localization?.eng;
  if (!file || !eng) continue;
  const label = normalize(eng);
  a7IconMap.set(file, label);
}

// Also load icons.json to enrich label lookup if needed (by filename)
const helpfulIcons = readJSON(helpfulIconsPath);
const filenameToIconsLabel = new Map();
for (const item of helpfulIcons) {
  const file = item?.IconFilename;
  const eng = item?.Localizations?.eng;
  if (!file || !eng) continue;
  filenameToIconsLabel.set(file, normalize(eng));
}

// Merge in icons.json labels for A7 filenames missing labels in presets
for (const [file, label] of Array.from(a7IconMap.entries())) {
  if (!label || label.length === 0) {
    const fallback = filenameToIconsLabel.get(file);
    if (fallback) a7IconMap.set(file, fallback);
  }
}

const productionNames = extractNames(readText(prodPath));
const residenceNames = extractNames(readText(resPath));
const serviceNames = extractNames(readText(svcPath));
const allNames = Array.from(new Set([...productionNames, ...residenceNames, ...serviceNames]));

// Basic synonyms to bridge common naming gaps
const synonyms = {
  'Schnapps Distill.': ['schnapps distillery', 'schnapps'],
  'Framework Knit.': ['framework knitters', 'work clothes', 'framework knitter'],
  'Fishery': ['fishing wharf', 'fishery'],
  'Lumberjack’s Hut': ['lumberjacks hut', 'foresters hut', 'sawmill input'],
  'Grain Farm': ['wheat farm', 'grain farm'],
  'Cattle Farm': ['cattle ranch', 'cattle farm'],
  'Pig Farm': ['pig farm', 'pigs'],
  'Soap Factory': ['soap works', 'soap factory'],
  'Rendering Works': ['tallow works', 'rendering works'],
  'Malthouse': ['malthouse', 'malt house'],
  'Brewery': ['brewery', 'beer maker'],
  'Fur Dealer': ['fur dealer', 'fur trade'],
  'Weapons Factory': ['weapon factory', 'weapons factory'],
  'Steam Motors': ['steam motor factory', 'steam motors factory'],
  'Penny Farthings': ['penny farthing factory', 'penny farthings'],
};

// Build a search index of labels for A7 icons
const a7Index = Array.from(a7IconMap.entries()).map(([file, label]) => ({ file, label }));

// Building-like keyword filter to avoid ornaments/paths/props
const buildingKeyword = new RegExp(
  /(farm|fishery|wharf|mill|bakery|brewery|malthouse|factory|mine|smeltery|pit|kiln|works|hut|cabin|house|makers|workshop|station|plantation|plant|distillery|kitchen|roaster|loom|dealer|smith|smithy|foundry|furnace|forge|press|refinery|rendering|warehouse|dock|harbour|harbor|office|club|bank|school|university|theatre|theater|church|chapel|hospital|fire|police|post|clubhouse|arena|members|market|cannery|saltworks|glassworks|windmill|sawmill)/i
);

function findA7IconForName(name) {
  const n = normalize(name);
  // Exact label match
  for (const { file, label } of a7Index) if (label === n) return file;
  // Containment both ways
  for (const { file, label } of a7Index) if (label.includes(n) || n.includes(label)) return file;
  // Synonym expansion
  const syns = synonyms[name] || [];
  for (const s of syns) {
    const sn = normalize(s);
    for (const { file, label } of a7Index) if (label === sn || label.includes(sn) || sn.includes(label)) return file;
  }
  return undefined;
}

// Compute matched files
const used = new Set();
for (const name of allNames) {
  const file = findA7IconForName(name);
  if (file) used.add(file);
}

// A7 icon filenames universe (building-like only)
const a7Files = Array.from(a7IconMap.entries())
  .filter(([, label]) => buildingKeyword.test(label))
  .map(([file]) => file);
const unused = a7Files.filter(f => !used.has(f));

console.log(`A7 preset building-like icons: ${a7Files.length}`);
console.log(`Matched A7 icons in use: ${used.size}`);
console.log(`UNUSED A7 preset icons: ${unused.length}`);
for (const file of unused) {
  const label = a7IconMap.get(file) || filenameToIconsLabel.get(file) || '';
  console.log(`${file} | ${label}`);
}

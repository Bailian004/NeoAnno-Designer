#!/usr/bin/env node
/*
  Reports buildings (production + residences + services) that do not have a match in:
  1. Helpful_info/icons.json
  2. Helpful_info/presets.json (A7)
  3. data/buildingIcons.ts (BUILDING_ICON_OVERRIDES)
  Matching is based on normalized English labels and a small synonym list.
*/
const fs = require('fs');
const path = require('path');

const root = '/workspaces/NeoAnno-Designer';
const helpfulPath = path.join(root, 'Helpful_info', 'icons.json');
const presetsPath = path.join(root, 'Helpful_info', 'presets.json');
const overridesPath = path.join(root, 'data', 'buildingIcons.ts');
const prodPath = path.join(root, 'data', 'generatedProductionChains.ts');
const resPath = path.join(root, 'data', 'generatedResidences.ts');
const svcPath = path.join(root, 'data', 'generatedServiceBuildings.ts');

function readJSON(p) {
  const text = fs.readFileSync(p, 'utf-8');
  return JSON.parse(text);
}
function readText(p) { return fs.readFileSync(p, 'utf-8'); }

function normalize(s) {
  return s
    .toLowerCase()
    .replace(/^a[0-9]_/, '')
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
  while ((m = regex.exec(tsText)) !== null) {
    names.add(m[1]);
  }
  return Array.from(names);
}

const synonyms = {
  'Schnapps Distill.': ['distillery', 'schnapps distillery', 'schnapps'],
  'Framework Knit.': ['framework knitters', 'framework knitter', 'work clothes', 'framework knit'],
  'Flour Mill': ['flour mill', 'mill'],
  'Grain Farm': ['grain farm', 'wheat farm'],
  'Pig Farm': ['pig farm', 'pigs'],
  'Steelworks': ['steelworks', 'steel works'],
  'Weapon Factory': ['weapon factory', 'weapons', 'armory'],
  'Fishery': ['fishery', 'fish factory', 'fishing wharf'],
  'Sawmill': ['sawmill'],
  'Hop Farm': ['hop farm'],
  'Brewery': ['brewery', 'beer maker'],
};

// Build map of helpful labels -> icon from icons.json
const helpful = readJSON(helpfulPath);
const helpfulLabelToIcon = new Map();
for (const item of helpful) {
  const eng = item?.Localizations?.eng;
  if (!eng || !item.IconFilename) continue;
  const label = normalize(eng);
  helpfulLabelToIcon.set(label, item.IconFilename);
}

// Load presets.json A7 buildings
const presets = readJSON(presetsPath);
const a7Buildings = (presets.Buildings || []).filter(b => 
  b?.Header?.includes('(A7)') && b?.IconFileName && b?.Localization?.eng
);
for (const b of a7Buildings) {
  const label = normalize(b.Localization.eng);
  if (b.IconFileName) {
    helpfulLabelToIcon.set(label, b.IconFileName);
  }
}

// Load buildingIcons.ts overrides
const overridesText = readText(overridesPath);
const overridesMatch = overridesText.match(/BUILDING_ICON_OVERRIDES[^{]*\{([^}]+)\}/s);
const overrides = new Map();
if (overridesMatch) {
  const content = overridesMatch[1];
  const regex = /"([^"]+)":\s*"([^"]+)"/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    overrides.set(m[1], m[2]);
  }
}

function hasHelpfulMatch(name) {
  // Check override first
  if (overrides.has(name)) return true;
  
  const n = normalize(name);
  if (helpfulLabelToIcon.has(n)) return true;
  // direct contains
  for (const key of helpfulLabelToIcon.keys()) {
    if (key.includes(n) || n.includes(key)) return true;
  }
  // synonyms
  const syns = synonyms[name] || [];
  for (const s of syns) {
    const sn = normalize(s);
    if (helpfulLabelToIcon.has(sn)) return true;
    for (const key of helpfulLabelToIcon.keys()) {
      if (key.includes(sn) || sn.includes(key)) return true;
    }
  }
  return false;
}

// Collect building names
const productionNames = extractNames(readText(prodPath));
const residenceNames = extractNames(readText(resPath));
const serviceNames = extractNames(readText(svcPath));

function diff(names, label) {
  const unmatched = names.filter(n => !hasHelpfulMatch(n)).sort();
  return { label, unmatched };
}

const report = [
  diff(productionNames, 'Production Chains'),
  diff(residenceNames, 'Residences'),
  diff(serviceNames, 'Services'),
];

// Print report
for (const section of report) {
  console.log(`\n=== ${section.label} (unmatched) ===`);
  if (section.unmatched.length === 0) {
    console.log('All matched.');
  } else {
    for (const n of section.unmatched) console.log(`- ${n}`);
    console.log(`Total: ${section.unmatched.length}`);
  }
}

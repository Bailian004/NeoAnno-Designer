#!/usr/bin/env node
/*
  Reports Helpful_info icons that look like building icons but are NOT matched to any building
  (production chains + residences + services) using our normalization + synonyms matching.
*/
const fs = require('fs');
const path = require('path');

const root = '/workspaces/NeoAnno-Designer';
const helpfulPath = path.join(root, 'Helpful_info', 'icons.json');
const prodPath = path.join(root, 'data', 'generatedProductionChains.ts');
const resPath = path.join(root, 'data', 'generatedResidences.ts');
const svcPath = path.join(root, 'data', 'generatedServiceBuildings.ts');

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
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
  while ((m = regex.exec(tsText)) !== null) names.add(m[1]);
  return Array.from(names);
}

const buildingKeyword = new RegExp(
  // anything that looks like a building
  /(farm|fishery|mill|bakery|brewery|malthouse|factory|mine|smeltery|pit|kiln|works|hut|cabin|house|makers|workshop|station|plantation|plant|distillery|kitchen|roaster|loom|dealer|smith|smithy|foundry|furnace|forge|darner|loom|press|refinery|renderer)/i
);

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

const helpful = readJSON(helpfulPath);
const helpfulLabelToIcon = new Map();
const buildingLikeIcons = [];
for (const item of helpful) {
  const eng = item?.Localizations?.eng;
  const file = item?.IconFilename;
  if (!eng || !file) continue;
  const label = normalize(eng);
  helpfulLabelToIcon.set(label, file);
  if (buildingKeyword.test(eng)) buildingLikeIcons.push({ label, file });
}

function hasHelpfulMatch(name) {
  const n = normalize(name);
  if (helpfulLabelToIcon.has(n)) return helpfulLabelToIcon.get(n);
  for (const [label, file] of helpfulLabelToIcon.entries()) {
    if (label.includes(n) || n.includes(label)) return file;
  }
  const syns = synonyms[name] || [];
  for (const s of syns) {
    const sn = normalize(s);
    if (helpfulLabelToIcon.has(sn)) return helpfulLabelToIcon.get(sn);
    for (const [label, file] of helpfulLabelToIcon.entries()) {
      if (label.includes(sn) || sn.includes(label)) return file;
    }
  }
  return undefined;
}

const productionNames = extractNames(readText(prodPath));
const residenceNames = extractNames(readText(resPath));
const serviceNames = extractNames(readText(svcPath));
const allNames = new Set([...productionNames, ...residenceNames, ...serviceNames]);

const used = new Set();
for (const name of allNames) {
  const file = hasHelpfulMatch(name);
  if (file) used.add(file);
}

const unused = buildingLikeIcons.filter(x => !used.has(x.file));
console.log(`Total helpful icons: ${helpful.length}`);
console.log(`Building-like helpful icons: ${buildingLikeIcons.length}`);
console.log(`Matched helpful icons in use: ${used.size}`);
console.log(`UNUSED building-like helpful icons: ${unused.length}`);
for (const u of unused) {
  console.log(`${u.file} | ${u.label}`);
}

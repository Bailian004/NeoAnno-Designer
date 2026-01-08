import { PRODUCTION_CHAINS_FULL } from './industryData';
import { productionChains as GEN_CHAINS } from './generatedProductionChains';

// Canonicalization helpers and maps to unify names across data sources

const normalize = (s: string) => s
  .toLowerCase()
  .replace(/distill\.?|distillery/g, 'distillery')
  .replace(/knitters?|knit\.?/g, 'knitters')
  .replace(/factory|fac\.?/g, 'factory')
  .replace(/m\./g, 'machine')
  .replace(/\s+|[^a-z0-9]/g, '');

// Build canonical product and building sets from PRODUCTION_CHAINS_FULL
const CANONICAL_PRODUCTS = new Set<string>(Object.keys(PRODUCTION_CHAINS_FULL));
const CANONICAL_BUILDINGS = new Set<string>(Object.values(PRODUCTION_CHAINS_FULL).map(d => d.buildingId));

// Indexes for matching
const canonicalProductIndex: Array<{ key: string; norm: string }> = Array.from(CANONICAL_PRODUCTS).map(k => ({ key: k, norm: normalize(k) }));
const canonicalBuildingIndex: Array<{ key: string; norm: string }> = Array.from(CANONICAL_BUILDINGS).map(k => ({ key: k, norm: normalize(k) }));

// Generated names index (often truncated)
const genBuildingIndex: Array<{ key: string; norm: string }> = GEN_CHAINS.map(c => ({ key: c.name, norm: normalize(c.name) }));

function bestMatch(name: string, index: Array<{ key: string; norm: string }>): string | undefined {
  const n = normalize(name);
  // exact first
  let m = index.find(i => i.norm === n)?.key;
  if (m) return m;
  // contains either way
  m = index.find(i => i.norm.includes(n) || n.includes(i.norm))?.key;
  return m;
}

export function canonicalizeProduct(name: string): string {
  const m = bestMatch(name, canonicalProductIndex);
  return m || name;
}

export function canonicalizeBuilding(name: string): string {
  const m = bestMatch(name, canonicalBuildingIndex);
  return m || name;
}

// Map canonical building -> closest generated name (to access legacy icon/rate fields when needed)
const canonicalToGeneratedBuilding = new Map<string, string>();
for (const b of CANONICAL_BUILDINGS) {
  const m = bestMatch(b, genBuildingIndex);
  if (m) canonicalToGeneratedBuilding.set(b, m);
}

export function getGeneratedNameForBuilding(canonicalBuilding: string): string | undefined {
  const c = canonicalizeBuilding(canonicalBuilding);
  return canonicalToGeneratedBuilding.get(c);
}

export function normalizeName(value: string): string {
  return normalize(value);
}

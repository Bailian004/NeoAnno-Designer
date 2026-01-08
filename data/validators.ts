import { CONSUMPTION_RATES, PRODUCTION_CHAINS_FULL } from './industryData';
import { getBuildingIcon, getProductIcon } from '../utils/iconResolver';
import { productionChains } from './generatedProductionChains';
import { canonicalizeBuilding, canonicalizeProduct, getGeneratedNameForBuilding } from './naming';

export interface ValidationIssue { type: 'missing-product' | 'missing-icon' | 'missing-workforce'; details: string; }

export function validateData(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // 1) Each consumed good exists in production chains
  for (const [tier, rates] of Object.entries(CONSUMPTION_RATES)) {
    for (const r of rates) {
      const canonical = canonicalizeProduct(r.goodId);
      if (!PRODUCTION_CHAINS_FULL[r.goodId] && !PRODUCTION_CHAINS_FULL[canonical]) {
        issues.push({ type: 'missing-product', details: `Good ${r.goodId} consumed by ${tier} missing in PRODUCTION_CHAINS_FULL` });
      }
    }
  }

  // 2) Each main building has an icon
  for (const def of Object.values(PRODUCTION_CHAINS_FULL)) {
    const icon = getBuildingIcon(def.buildingId);
    if (!icon) {
      const productIcon = getProductIcon(def.id);
      if (!productIcon) {
        issues.push({ type: 'missing-icon', details: `No icon for building ${def.buildingId} (product ${def.id})` });
      }
    }
  }

  // 3) Each main building has workforce in generated data
  const genIndex = new Map(productionChains.map(p => [p.name, p] as const));
  for (const def of Object.values(PRODUCTION_CHAINS_FULL)) {
    const canonical = canonicalizeBuilding(def.buildingId);
    const genName = getGeneratedNameForBuilding(canonical) || canonical;
    const found = genIndex.get(genName) || genIndex.get(def.buildingId);
    if (!found || !found.workforce) {
      issues.push({ type: 'missing-workforce', details: `Missing workforce for ${def.buildingId} (mapped to ${genName})` });
    }
  }

  return issues;
}

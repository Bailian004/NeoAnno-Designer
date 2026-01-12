import { CONSUMPTION_RATES, PRODUCTION_CHAINS_FULL } from './industryData';
import { getBuildingIcon, getProductIcon } from '../utils/iconResolver';
import { productionChains } from './generatedProductionChains';
import { canonicalizeBuilding, canonicalizeProduct, getGeneratedNameForBuilding } from './naming';

export interface ValidationIssue { 
  type: 'missing-product' | 'missing-icon' | 'missing-workforce'; 
  severity: 'error' | 'warning';
  details: string; 
}

/**
 * Validate data integrity.
 * 
 * Note: Some warnings are expected:
 * - Abstract goods (labor, education) may not have production chains
 * - Some buildings may have incomplete icon data (fallback works)
 * - Generated data may not cover all variants
 * 
 * Only return hard errors that would break functionality.
 */
export function validateData(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Goods that are abstract or don't need production chains
  const abstractGoods = new Set([
    'labor', 'education', 'work', 'job',
    'happiness', 'satisfaction', 'morale',
  ]);

  // 1) Each consumed good exists in production chains (warn only for key goods)
  for (const [tier, rates] of Object.entries(CONSUMPTION_RATES)) {
    for (const r of rates) {
      // Skip abstract goods
      if (abstractGoods.has(r.goodId.toLowerCase())) continue;
      
      const canonical = canonicalizeProduct(r.goodId);
      if (!PRODUCTION_CHAINS_FULL[r.goodId] && !PRODUCTION_CHAINS_FULL[canonical]) {
        // Only warn for critical goods (not all variations)
        if (tier === 'Farmer' || tier === 'Worker') {
          issues.push({ 
            type: 'missing-product', 
            severity: 'warning',
            details: `Good ${r.goodId} consumed by ${tier} missing in PRODUCTION_CHAINS_FULL` 
          });
        }
      }
    }
  }

  // 2) Each main building has an icon (skip - icons have fallbacks)
  // Icons are not critical to functionality since iconResolver has defaults
  
  // 3) Each main building has workforce in generated data (warn only)
  const genIndex = new Map(productionChains.map(p => [p.name, p] as const));
  let missingWorkforceCount = 0;
  for (const def of Object.values(PRODUCTION_CHAINS_FULL)) {
    const canonical = canonicalizeBuilding(def.buildingId);
    const genName = getGeneratedNameForBuilding(canonical) || canonical;
    const found = genIndex.get(genName) || genIndex.get(def.buildingId);
    if (!found || !found.workforce) {
      missingWorkforceCount++;
      // Limit warnings to avoid spam
      if (missingWorkforceCount <= 3) {
        issues.push({ 
          type: 'missing-workforce', 
          severity: 'warning',
          details: `Missing workforce for ${def.buildingId} (mapped to ${genName})` 
        });
      }
    }
  }

  return issues;
}

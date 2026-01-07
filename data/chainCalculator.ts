/**
 * Production chain calculator using reference data
 * Replaces legacy chainCalculator.ts with reference-backed chain resolution
 */

import { PRODUCTION_CHAINS, ProductionChain, ProductionChainNode } from './productionChains';
import { GOOD_CONSUMPTION } from './goodConsumption';

export interface ChainCalculationResult {
  finalProduct: string;
  buildingsNeeded: Map<string, number>;
  totalWorkforce: Map<string, number>;
}

/**
 * Calculate buildings needed to satisfy a production rate for a given good
 */
export function calculateChainForGood(
  goodName: string,
  ratePerMinute: number
): ChainCalculationResult | null {
  const chain = PRODUCTION_CHAINS.find(
    c => c.finalProduct.toLowerCase() === goodName.toLowerCase()
  );

  if (!chain) {
    return null;
  }

  const buildingsNeeded = new Map<string, number>();
  const totalWorkforce = new Map<string, number>();

  // Calculate main building count
  // TODO: Get actual production rates from annoData or another source
  // For now, assume 1 unit per cycle
  const assumedRate = 2.0; // tons per minute (placeholder)
  const mainBuildingCount = Math.ceil(ratePerMinute / assumedRate);
  
  buildingsNeeded.set(chain.buildingName, mainBuildingCount);

  // Recursively calculate upstream buildings
  function processNode(node: ProductionChainNode, parentCount: number) {
    const current = buildingsNeeded.get(node.name) || 0;
    buildingsNeeded.set(node.name, current + parentCount);

    node.children.forEach(child => {
      processNode(child, parentCount);
    });
  }

  chain.children.forEach(child => {
    processNode(child, mainBuildingCount);
  });

  return {
    finalProduct: chain.finalProduct,
    buildingsNeeded,
    totalWorkforce
  };
}

/**
 * Calculate all chains needed for a population's consumption
 */
export function calculateChainsForPopulation(
  tierCounts: Record<string, number>
): Map<string, ChainCalculationResult> {
  const results = new Map<string, ChainCalculationResult>();

  // Get consumption demand
  Object.entries(tierCounts).forEach(([tier, count]) => {
    const consumption = GOOD_CONSUMPTION[tier];
    if (!consumption) return;

    consumption.forEach(item => {
      const ratePerMinute = (count / 1000) * item.tonsPer1000PerMinute;
      const result = calculateChainForGood(item.good, ratePerMinute);
      
      if (result) {
        // Merge with existing results
        const existing = results.get(result.finalProduct);
        if (existing) {
          result.buildingsNeeded.forEach((count, building) => {
            const existingCount = existing.buildingsNeeded.get(building) || 0;
            existing.buildingsNeeded.set(building, existingCount + count);
          });
        } else {
          results.set(result.finalProduct, result);
        }
      }
    });
  });

  return results;
}

/**
 * Get a simplified building count summary
 */
export function getBuildingSummary(
  chainResults: Map<string, ChainCalculationResult>
): Record<string, number> {
  const summary: Record<string, number> = {};

  chainResults.forEach(result => {
    result.buildingsNeeded.forEach((count, building) => {
      summary[building] = (summary[building] || 0) + count;
    });
  });

  return summary;
}

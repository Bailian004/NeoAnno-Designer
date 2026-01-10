import { productionChains } from './index';
import type { ProductionChain, ProductionChainNode, Region } from './types';

// Minimal ProductionDefinition shape to match consumers (CalculatorView, iconResolver)
export interface ChainLink {
  buildingId: string;
  count: number;
  alternatives?: string[];
  inputs?: ChainLink[];
}

export interface ProductionDefinition {
  id: string;
  name: string;
  buildingId: string;
  outputPerMinute: number;
  regions: Region[];
  tier?: 'Basic' | 'Mid' | 'High';
  chain: ChainLink[];
}

function mapChainNode(node: ProductionChainNode): ChainLink {
  return {
    buildingId: node.buildingId,
    count: node.count,
    alternatives: node.alternatives,
    inputs: node.inputs?.map(mapChainNode)
  };
}

// Build unified ProductionDefinition map from per-region productionChains
export const PRODUCTION_CHAINS_FULL: Record<string, ProductionDefinition> = (() => {
  const out: Record<string, ProductionDefinition> = {};
  const regions: Region[] = ['Old World','New World','Arctic','Enbesa'];
  regions.forEach(region => {
    const chains: ProductionChain[] = (productionChains as any)[region] || [];
    chains.forEach(ch => {
      const key = ch.productName || ch.productId;
      if (!key) return;
      const def = out[key];
      if (!def) {
        out[key] = {
          id: ch.productName || ch.productId,
          name: ch.productName || ch.productId,
          buildingId: ch.buildingId,
          outputPerMinute: ch.outputPerMinute,
          regions: [region],
          chain: ch.chain?.map(mapChainNode) || []
        };
      } else {
        if (!def.regions.includes(region)) def.regions.push(region);
        // Prefer higher outputPerMinute if region differs; otherwise keep existing
        if (typeof ch.outputPerMinute === 'number' && ch.outputPerMinute !== def.outputPerMinute) {
          // If different, keep the max to be conservative for UI cards
          def.outputPerMinute = Math.max(def.outputPerMinute || 0, ch.outputPerMinute || 0);
        }
      }
    });
  });
  return out;
})();

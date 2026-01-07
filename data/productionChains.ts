import rawProductionChains from "./reference/production-chains.json";

/**
 * Reference production chains sourced from Anno-1800-Calculator (local copy in data/reference).
 * Captures region + population gating along with the upstream ingredient tree.
 */

interface RawProductionChild {
  name: string;
  regionID: number;
  alternative: string;
  children: RawProductionChild[] | null;
}

interface RawProductionChain {
  id: number;
  regionID: number;
  img?: string;
  chain: string;
  populationID: number;
  finalProduct: string;
  name: string;
  alternative: string;
  children: RawProductionChild[] | null;
}

interface RawProductionChainsFile {
  Version: string;
  Production_Chain: Record<string, RawProductionChain>;
}

export interface ProductionChainNode {
  name: string;
  regionId: number;
  alternative?: string;
  children: ProductionChainNode[];
}

export interface ProductionChain {
  key: string; // JSON key (e.g., "timber")
  id: number;
  regionId: number;
  populationId: number;
  finalProduct: string;
  buildingName: string;
  chainName: string;
  alternative?: string;
  image?: string;
  children: ProductionChainNode[];
}

const normalizeChildren = (children: RawProductionChild[] | null): ProductionChainNode[] => {
  if (!children) return [];
  return children.map((child) => ({
    name: child.name,
    regionId: child.regionID,
    alternative: child.alternative || undefined,
    children: normalizeChildren(child.children),
  }));
};

const rawFile = rawProductionChains as unknown as RawProductionChainsFile;

export const PRODUCTION_CHAINS: ProductionChain[] = Object.entries(
  rawFile.Production_Chain
).map(([key, raw]) => ({
  key,
  id: raw.id,
  regionId: raw.regionID,
  populationId: raw.populationID,
  finalProduct: raw.finalProduct,
  buildingName: raw.name,
  chainName: raw.chain,
  alternative: raw.alternative || undefined,
  image: raw.img,
  children: normalizeChildren(raw.children),
}));

const chainsByProduct = new Map<string, ProductionChain>();
const chainsByBuilding = new Map<string, ProductionChain>();

PRODUCTION_CHAINS.forEach((chain) => {
  chainsByProduct.set(chain.finalProduct.toLowerCase(), chain);
  chainsByBuilding.set(chain.buildingName.toLowerCase(), chain);
});

export const getChainByFinalProduct = (
  product: string
): ProductionChain | undefined => {
  return chainsByProduct.get(product.toLowerCase());
};

export const getChainByBuilding = (
  buildingName: string
): ProductionChain | undefined => {
  return chainsByBuilding.get(buildingName.toLowerCase());
};

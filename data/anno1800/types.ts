// Shared types for Anno 1800 data packs
export type Region = 'Old World' | 'New World' | 'Arctic' | 'Enbesa' | 'Cape Trelawney';

export interface ProductionChainNode {
  buildingId: string;
  count: number;
  inputs?: ProductionChainNode[];
  alternatives?: string[];
}

export interface ProductionChain {
  productId: string;
  productName: string;
  region: Region;
  buildingId: string;
  outputPerMinute: number;
  workforceType?: string;
  workforceAmount?: number;
  electricityBoost?: boolean;
  chain: ProductionChainNode[];
}

export interface ConsumptionNeed {
  goodId: string;
  amountPer1000: number; // tons per minute per 1000 population
  amountPer1000Electric?: number;
}

export interface ConsumptionTier {
  tierId: string;
  region: Region;
  needs: ConsumptionNeed[];
}

export interface BuildingInfo {
  buildingId: string;
  name: string;
  region: Region;
  type: string; // e.g., production, farm, residence, public service
  size?: { width: number; height: number }; // optional, not all buildings have size data
  radius?: number; // optional service radius
  workforceType?: string;
  workforceAmount?: number;
  maintenance?: { productId: string; amount: number }[];
  icon?: string;
  identifier?: string; // preset/guid reference
}

export interface ResidentTier {
  tierId: string;
  region: Region;
  capacityPerHouse: number;
  houseIds: string[];
  icon?: string;
}

export interface GoodInfo {
  goodId: string;
  name: string;
  regions: Region[];
  icon?: string;
  weight?: number;
}

export interface AliasMapEntry {
  alias: string;
  canonicalId: string;
  kind: 'good' | 'building' | 'tier';
}

export interface ServiceBuilding {
  name: string;
  identifier?: string;
  icon?: string;
  region: string;
  tier: string;
  size: { x: number; z: number };
  service: string;
  range?: { type: 'street' | 'radius'; range: number; maxRange?: number };
  supplyInfo?: any;
}

export interface ResidenceBuilding {
  name: string;
  identifier?: string;
  icon?: string;
  region: string;
  tier: string;
  size: { x: number; z: number };
}

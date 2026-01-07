/**
 * Integration layer between reference production chains and annoData buildings.
 * Maps chain building names to annoData identifiers and enriches with region/DLC metadata.
 */

import { PRODUCTION_CHAINS, ProductionChain, getChainByBuilding, getChainByFinalProduct } from './productionChains';
import { REGIONS, REGIONS_BY_ID } from './regions';
import { DLCS, DLC_BY_ID } from './dlcs';
import { BuildingDefinition } from '../types';

export interface EnrichedProductionChain extends ProductionChain {
  regionName?: string;
  dlcName?: string;
  requiresDLC: boolean;
}

/**
 * Enriches production chains with region and DLC metadata
 */
export function enrichProductionChain(chain: ProductionChain): EnrichedProductionChain {
  const region = REGIONS_BY_ID.get(chain.regionId);
  const dlcId = region?.dlcId ?? 0;
  const dlc = dlcId > 0 ? DLC_BY_ID.get(dlcId) : undefined;

  return {
    ...chain,
    regionName: region?.name,
    dlcName: dlc?.name,
    requiresDLC: dlcId > 0
  };
}

/**
 * Get all enriched chains
 */
export function getAllEnrichedChains(): EnrichedProductionChain[] {
  return PRODUCTION_CHAINS.map(enrichProductionChain);
}

/**
 * Map production chain building names to annoData building IDs
 * Returns a mapping of chain building name -> annoData building ID
 */
export function createBuildingNameMapping(buildings: BuildingDefinition[]): Map<string, string> {
  const mapping = new Map<string, string>();
  
  // Build a normalized lookup from annoData
  const annoDataByName = new Map<string, BuildingDefinition>();
  buildings.forEach(b => {
    const normalized = b.name.toLowerCase().trim();
    annoDataByName.set(normalized, b);
  });

  // Map chain buildings to annoData IDs
  PRODUCTION_CHAINS.forEach(chain => {
    const chainBuildingName = chain.buildingName.toLowerCase().trim();
    
    // Try exact match first
    let match = annoDataByName.get(chainBuildingName);
    
    // Try partial match
    if (!match) {
      for (const [name, building] of annoDataByName) {
        if (name.includes(chainBuildingName) || chainBuildingName.includes(name)) {
          match = building;
          break;
        }
      }
    }
    
    if (match) {
      mapping.set(chain.buildingName, match.id);
    }
  });

  return mapping;
}

/**
 * Get all goods that can be produced (final products from chains)
 */
export function getAllProducibleGoods(): string[] {
  return Array.from(new Set(PRODUCTION_CHAINS.map(c => c.finalProduct)));
}

/**
 * Get chains by region
 */
export function getChainsByRegion(regionId: number): EnrichedProductionChain[] {
  return PRODUCTION_CHAINS
    .filter(c => c.regionId === regionId)
    .map(enrichProductionChain);
}

/**
 * Get chains by population tier
 */
export function getChainsByPopulation(populationId: number): EnrichedProductionChain[] {
  return PRODUCTION_CHAINS
    .filter(c => c.populationId === populationId)
    .map(enrichProductionChain);
}

/**
 * Check if a chain requires a specific DLC
 */
export function chainRequiresDLC(chain: ProductionChain, dlcId: number): boolean {
  const region = REGIONS_BY_ID.get(chain.regionId);
  return region?.dlcId === dlcId;
}

/**
 * Filter chains by available DLCs
 */
export function filterChainsByDLCs(availableDLCs: number[]): EnrichedProductionChain[] {
  const dlcSet = new Set(availableDLCs);
  dlcSet.add(0); // Base game always available
  
  return PRODUCTION_CHAINS
    .filter(chain => {
      const region = REGIONS_BY_ID.get(chain.regionId);
      return region && dlcSet.has(region.dlcId);
    })
    .map(enrichProductionChain);
}

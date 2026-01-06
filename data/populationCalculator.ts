/**
 * Population-to-Building Calculator
 * Derives targetCounts for genetic solver from population targets
 */

import { TIER_CONSUMPTION, ConsumptionRate } from './generatedConsumption';
import { productionChains } from './generatedProductionChains';
import { serviceBuildings } from './generatedServiceBuildings';
import { optimizeProductionChain } from './productionOptimizer';

export interface PopulationTarget {
  tier: string;
  count: number;
}

export interface BuildingRequirement {
  buildingName: string;
  count: number; // Exact count needed
  reason: string; // 'production' | 'service' | 'residence'
}

/**
 * Calculate production buildings needed for a given population
 */
export function calculateProductionNeeds(
  population: PopulationTarget[],
  hasElectricity = false
): BuildingRequirement[] {
  const requirements: Map<string, BuildingRequirement> = new Map();

  population.forEach(({ tier, count }) => {
    const consumptionRates = TIER_CONSUMPTION[tier];
    if (!consumptionRates) {
      console.warn(`No consumption data for tier: ${tier}`);
      return;
    }

    consumptionRates.forEach((rate: ConsumptionRate) => {
      const consumptionRate = hasElectricity && rate.tonsPer1000PerMinuteElectric
        ? rate.tonsPer1000PerMinuteElectric
        : rate.tonsPer1000PerMinute;

      const totalConsumption = (count / 1000) * consumptionRate;

      // Find production building
      const prodBuilding = productionChains.find(
        b => b.name.toLowerCase().includes(rate.building.toLowerCase())
      );

      if (!prodBuilding) {
        console.warn(`No production data for: ${rate.building}`);
        return;
      }

      const productionRate = (prodBuilding.outputAmount * 60) / prodBuilding.cycleTime;
      const buildingsNeeded = Math.ceil(totalConsumption / productionRate);

      const key = prodBuilding.name;
      const existing = requirements.get(key);
      
      if (existing) {
        existing.count += buildingsNeeded;
      } else {
        requirements.set(key, {
          buildingName: prodBuilding.name,
          count: buildingsNeeded,
          reason: 'production'
        });
      }
    });
  });

  return Array.from(requirements.values());
}

/**
 * Calculate service buildings needed for population
 * Uses simple heuristic: 1 service per ~300 residents in range
 */
export function calculateServiceNeeds(
  population: PopulationTarget[]
): BuildingRequirement[] {
  const totalPop = population.reduce((sum, p) => sum + p.count, 0);
  const requirements: BuildingRequirement[] = [];

  // Basic services for all populations
  if (totalPop > 0) {
    requirements.push({
      buildingName: 'Marketplace',
      count: Math.ceil(totalPop / 600),
      reason: 'service'
    });

    requirements.push({
      buildingName: 'Fire Station',
      count: Math.ceil(totalPop / 800),
      reason: 'service'
    });
  }

  // Tier-specific services
  const hasTier2 = population.some(p => ['Workers', 'Obreros'].includes(p.tier));
  const hasTier3 = population.some(p => ['Artisans', 'Engineers'].includes(p.tier));
  const hasTier4 = population.some(p => ['Engineers', 'Investors'].includes(p.tier));

  if (hasTier2) {
    const tier2Pop = population
      .filter(p => ['Workers', 'Artisans', 'Obreros'].includes(p.tier))
      .reduce((sum, p) => sum + p.count, 0);
    
    requirements.push({
      buildingName: 'Church',
      count: Math.ceil(tier2Pop / 1000),
      reason: 'service'
    });

    requirements.push({
      buildingName: 'School',
      count: Math.ceil(tier2Pop / 1000),
      reason: 'service'
    });
  }

  if (hasTier3) {
    const tier3Pop = population
      .filter(p => ['Artisans', 'Engineers', 'Investors'].includes(p.tier))
      .reduce((sum, p) => sum + p.count, 0);
    
    requirements.push({
      buildingName: 'Variety Theatre',
      count: Math.ceil(tier3Pop / 1200),
      reason: 'service'
    });

    requirements.push({
      buildingName: 'University',
      count: Math.ceil(tier3Pop / 1200),
      reason: 'service'
    });
  }

  if (hasTier4) {
    const tier4Pop = population
      .filter(p => ['Engineers', 'Investors'].includes(p.tier))
      .reduce((sum, p) => sum + p.count, 0);
    
    requirements.push({
      buildingName: 'Bank',
      count: Math.ceil(tier4Pop / 1500),
      reason: 'service'
    });
  }

  return requirements;
}

/**
 * Calculate residence buildings needed
 * Assumes 10 residents per house at base tier
 */
export function calculateResidenceNeeds(
  population: PopulationTarget[]
): BuildingRequirement[] {
  const requirements: BuildingRequirement[] = [];

  const residenceCapacity: Record<string, number> = {
    'Farmers': 10,
    'Workers': 20,
    'Artisans': 30,
    'Engineers': 40,
    'Investors': 50,
    'Jornaleros': 10,
    'Obreros': 20,
    'Explorers': 10,
    'Technicians': 20
  };

  population.forEach(({ tier, count }) => {
    const capacity = residenceCapacity[tier] || 10;
    const housesNeeded = Math.ceil(count / capacity);

    // Use specific residence names from the data
    const residenceNames: Record<string, string> = {
      'Farmers': 'Farmer Residence',
      'Workers': 'Worker Residence',
      'Artisans': 'Artisan Res.',
      'Engineers': 'Engineer Res.',
      'Investors': 'Investor Res.',
      'Jornaleros': 'Jornalero Residence',
      'Obreros': 'Obrero Residence'
    };

    requirements.push({
      buildingName: residenceNames[tier] || `${tier} Residence`,
      count: housesNeeded,
      reason: 'residence'
    });
  });

  return requirements;
}

/**
 * Master function: Calculate all building requirements
 */
export function calculateAllRequirements(
  population: PopulationTarget[],
  hasElectricity = false
): Record<string, number> {
  const production = calculateProductionNeeds(population, hasElectricity);
  const services = calculateServiceNeeds(population);
  const residences = calculateResidenceNeeds(population);

  const allRequirements = [...production, ...services, ...residences];
  const targetCounts: Record<string, number> = {};

  allRequirements.forEach(req => {
    targetCounts[req.buildingName] = (targetCounts[req.buildingName] || 0) + req.count;
  });

  return targetCounts;
}

/**
 * Example usage:
 * 
 * const population = [
 *   { tier: 'Farmers', count: 500 },
 *   { tier: 'Workers', count: 1000 }
 * ];
 * 
 * const targetCounts = calculateAllRequirements(population, false);
 * // Returns: { 'Bakery': 18, 'Brewery': 16, 'Fishery': 50, ... }
 */

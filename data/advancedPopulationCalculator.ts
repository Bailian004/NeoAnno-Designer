/**
 * Advanced Population Calculator with Production Optimization
 * Uses dependency graph to calculate upstream production automatically
 */

import { CONSUMPTION_RATES } from './industryData';
import {
  optimizeProductionChain,
  optimizeProductionChainWithWorkforce,
  computeWorkforceRequirements
} from './productionOptimizer';
import { residences, services } from './anno1800/index';
import { PopulationTarget } from './populationCalculator';

/**
 * Calculate all requirements with production chain optimization
 */
export function calculateOptimizedRequirements(
  population: PopulationTarget[],
  options: {
    includeElectricity?: boolean;
    tradeGoods?: Set<string>; // Goods to import instead of produce
    includeServices?: boolean;
    includeResidences?: boolean;
  } = {}
): Record<string, number> {
  const {
    includeElectricity = false,
    tradeGoods = new Set(),
    includeServices = true,
    includeResidences = true
  } = options;

  // 1. Calculate consumption rates (canonical goods)
  const consumption: Record<string, number> = {};
  population.forEach(({ tier, count }) => {
    const consumptionRates = CONSUMPTION_RATES[tier];
    if (!consumptionRates) return;

    consumptionRates.forEach(rate => {
      const totalConsumption = (count / 1000) * rate.amountPer1000;
      consumption[rate.goodId] = (consumption[rate.goodId] || 0) + totalConsumption;
    });
  });

  // 2. Optimize production chains (includes upstream dependencies)
  const production = optimizeProductionChain(consumption, includeElectricity, tradeGoods);

  // Workforce needed to run those production buildings
  const productionWorkforce = computeWorkforceRequirements(production);

  // 3. Add services
  const targetCounts: Record<string, number> = { ...production };
  
  if (includeServices) {
    const totalPop = population.reduce((sum, p) => sum + p.count, 0);
    
    if (totalPop > 0) {
      targetCounts['Marketplace'] = Math.ceil(totalPop / 600);
      targetCounts['Fire Station'] = Math.ceil(totalPop / 800);
    }

    const hasTier2 = population.some(p => ['Workers', 'Obreros'].includes(p.tier));
    if (hasTier2) {
      const tier2Pop = population
        .filter(p => ['Workers', 'Artisans', 'Obreros'].includes(p.tier))
        .reduce((sum, p) => sum + p.count, 0);
      
      targetCounts['Church'] = Math.ceil(tier2Pop / 1000);
      targetCounts['School'] = Math.ceil(tier2Pop / 1000);
    }

    const hasTier3 = population.some(p => ['Artisans', 'Engineers'].includes(p.tier));
    if (hasTier3) {
      const tier3Pop = population
        .filter(p => ['Artisans', 'Engineers', 'Investors'].includes(p.tier))
        .reduce((sum, p) => sum + p.count, 0);
      
      targetCounts['Variety Theatre'] = Math.ceil(tier3Pop / 1200);
      targetCounts['University'] = Math.ceil(tier3Pop / 1200);
    }

    const hasTier4 = population.some(p => ['Engineers', 'Investors'].includes(p.tier));
    if (hasTier4) {
      const tier4Pop = population
        .filter(p => ['Engineers', 'Investors'].includes(p.tier))
        .reduce((sum, p) => sum + p.count, 0);
      
      targetCounts['Bank'] = Math.ceil(tier4Pop / 1500);
    }
  }

  // 4. Add residences
  if (includeResidences) {
    const residenceCapacity: Record<string, number> = {
      'Farmers': 10,
      'Workers': 20,
      'Artisans': 30,
      'Engineers': 40,
      'Investors': 50,
      'Jornaleros': 10,
      'Obreros': 20
    };

    const residenceNames: Record<string, string> = {
      'Farmers': 'Farmer Residence',
      'Workers': 'Worker Residence',
      'Artisans': 'Artisan Res.',
      'Engineers': 'Engineer Res.',
      'Investors': 'Investor Res.',
      'Jornaleros': 'Jornalero Residence',
      'Obreros': 'Obrero Residence'
    };

    population.forEach(({ tier, count }) => {
      const capacity = residenceCapacity[tier] || 10;
      const housesNeeded = Math.ceil(count / capacity);
      const residenceName = residenceNames[tier] || `${tier} Residence`;
      
      targetCounts[residenceName] = housesNeeded;
    });
  }

  return targetCounts;
}

export interface OptimizedRequirementsDetail {
  buildings: Record<string, number>;
  workforce: Record<string, number>;
  residences: Record<string, number>;
}

/**
 * Detailed variant with FULL recursive workforce calculation
 * Returns complete manifest: all buildings, workforce housing, services, emergency services
 */
export function calculateOptimizedRequirementsDetailed(
  population: PopulationTarget[],
  region: string = 'Old World',
  options: {
    includeElectricity?: boolean;
    tradeGoods?: Set<string>;
    includeServices?: boolean;
    includeResidences?: boolean;
  } = {}
): OptimizedRequirementsDetail {
  const {
    includeElectricity = false,
    tradeGoods = new Set(),
    includeServices = true,
    includeResidences = true
  } = options;

  const residenceCapacity: Record<string, number> = {
    'Farmers': 10,
    'Workers': 20,
    'Artisans': 30,
    'Engineers': 40,
    'Investors': 50,
    'Jornaleros': 10,
    'Obreros': 20,
    'Explorers': 10,
    'Technicians': 15,
    'Shepherds': 10,
    'Elders': 20,
    'Scholars': 25,
  };

  // Get residence building names by tier from our data
  const getResidenceBuildingName = (tier: string, region: string = 'Old World'): string => {
    const regionKey = region as keyof typeof residences;
    const regionResidences = residences[regionKey] || [];
    
    // Try to find a residence for this tier
    const tiered = regionResidences.find((r: any) => 
      r.tier?.toLowerCase().includes(tier.toLowerCase()) ||
      r.name?.toLowerCase().includes(tier.toLowerCase())
    );
    
    if (tiered?.name) return tiered.name;
    
    // Fallback to tier-based names if not found in data
    const fallbackNames: Record<string, string> = {
      'Farmers': 'Farmer Residence',
      'Workers': 'Worker Residence',
      'Artisans': 'Artisan Residence',
      'Engineers': 'Engineer Residence',
      'Investors': 'Investor Residence',
      'Jornaleros': 'Jornalero Residence',
      'Obreros': 'Obrero Residence',
      'Explorers': 'Explorer Shelter',
      'Technicians': 'Technician Shelter',
      'Shepherds': 'Shepherd Hut',
      'Elders': 'Elder Dwelling',
      'Scholars': 'Scholar House',
    };
    
    return fallbackNames[tier] || `${tier} Residence`;
  };

  // Track total population (target + workforce) across iterations
  let totalPopulation: Record<string, number> = {};
  population.forEach(p => {
    totalPopulation[p.tier] = (totalPopulation[p.tier] || 0) + p.count;
  });

  let allBuildings: Record<string, number> = {};
  let previousWorkforce: Record<string, number> = {};
  let iterations = 0;
  const maxIterations = 10;

  // Recursive loop: calculate production → workforce → housing → consumption → repeat
  while (iterations < maxIterations) {
    iterations++;

    // Calculate consumption for current total population
    const consumption: Record<string, number> = {};
    Object.entries(totalPopulation).forEach(([tier, count]) => {
      const consumptionRates = CONSUMPTION_RATES[tier];
      if (!consumptionRates) return;

      consumptionRates.forEach(rate => {
        const totalConsumption = (count / 1000) * rate.amountPer1000;
        consumption[rate.goodId] = (consumption[rate.goodId] || 0) + totalConsumption;
      });
    });

    // Get production buildings + workforce
    const { buildings, workforce } = optimizeProductionChainWithWorkforce(consumption, includeElectricity, tradeGoods);
    allBuildings = { ...buildings };

    // Check convergence: if workforce hasn't changed significantly, we're done
    const workforceChanged = Object.keys(workforce).some(tier => {
      const prev = previousWorkforce[tier] || 0;
      const curr = workforce[tier] || 0;
      return Math.abs(curr - prev) > 1; // Allow 1-person tolerance
    });

    if (!workforceChanged && iterations > 1) {
      break; // Converged
    }

    // Add workforce to total population for next iteration
    Object.entries(workforce).forEach(([tier, amount]) => {
      if (!totalPopulation[tier]) totalPopulation[tier] = 0;
      // Only add the delta (new workforce beyond what we already counted)
      const previous = previousWorkforce[tier] || 0;
      totalPopulation[tier] += (amount - previous);
    });

    previousWorkforce = { ...workforce };
  }

  // Add housing for ALL population (target + workforce)
  const residences: Record<string, number> = {};
  if (includeResidences) {
    Object.entries(totalPopulation).forEach(([tier, count]) => {
      if (count <= 0) return;
      const capacity = residenceCapacity[tier] || 10;
      const housesNeeded = Math.ceil(count / capacity);
      const residenceName = getResidenceBuildingName(tier, region);
      allBuildings[residenceName] = housesNeeded;
    });
  }

  // Add services for ALL population
  if (includeServices && region) {
    const regionKey = region as keyof typeof services;
    const regionServices = services[regionKey] || [];
    const totalPop = Object.values(totalPopulation).reduce((sum, count) => sum + count, 0);
    
    if (totalPop > 0 && regionServices.length > 0) {
      // Create a map of service building names to calculate quantities
      regionServices.forEach((service: any) => {
        if (!service.name) return;
        
        // Only calculate for services that should be based on population
        const serviceName = service.name.toLowerCase();
        let quantity = 0;
        
        if (serviceName.includes('market')) {
          quantity = Math.ceil(totalPop / 600);
        } else if (serviceName.includes('fire')) {
          quantity = Math.ceil(totalPop / 800);
        } else if (serviceName.includes('police')) {
          quantity = Math.ceil(totalPop / 1000);
        } else if (serviceName.includes('doctor') || serviceName.includes('hospital')) {
          quantity = Math.ceil(totalPop / 1200);
        } else if (serviceName.includes('school') || serviceName.includes('university')) {
          quantity = Math.ceil(totalPop / 1500);
        } else if (serviceName.includes('church') || serviceName.includes('chapel') || serviceName.includes('mosque')) {
          quantity = Math.ceil(totalPop / 1000);
        } else if (serviceName.includes('tavern') || serviceName.includes('saloon') || serviceName.includes('bar')) {
          quantity = Math.ceil(totalPop / 1800);
        } else if (serviceName.includes('theatre') || serviceName.includes('theater')) {
          quantity = Math.ceil(totalPop / 1200);
        } else if (serviceName.includes('bank')) {
          quantity = Math.ceil(totalPop / 1500);
        } else if (serviceName.includes('library')) {
          quantity = Math.ceil(totalPop / 2500);
        } else {
          // Default coverage ratio for unknown service types
          quantity = Math.ceil(totalPop / 2000);
        }
        
        if (quantity > 0) {
          allBuildings[service.name] = quantity;
        }
      });
    }
  }

  return {
    buildings: allBuildings,
    workforce: totalPopulation, // Return TOTAL population (not just workforce)
    residences
  };
}

/**
 * Get list of goods that can be traded instead of produced
 */
export function getTradeableGoods(population: PopulationTarget[]): string[] {
  const consumption: Set<string> = new Set();
  
  population.forEach(({ tier }) => {
    const consumptionRates = CONSUMPTION_RATES[tier];
    if (!consumptionRates) return;
    
    consumptionRates.forEach(rate => {
      consumption.add(rate.goodId);
    });
  });

  return Array.from(consumption).sort();
}

/**
 * Calculate savings from trading goods
 */
export function calculateTradeSavings(
  population: PopulationTarget[],
  tradeGoods: Set<string>,
  includeElectricity = false
): {
  buildingsSaved: number;
  goodsTraded: string[];
} {
  const withoutTrade = calculateOptimizedRequirements(population, {
    includeElectricity,
    tradeGoods: new Set(),
    includeServices: false,
    includeResidences: false
  });

  const withTrade = calculateOptimizedRequirements(population, {
    includeElectricity,
    tradeGoods,
    includeServices: false,
    includeResidences: false
  });

  const countWithout = Object.values(withoutTrade).reduce((sum, v) => sum + v, 0);
  const countWith = Object.values(withTrade).reduce((sum, v) => sum + v, 0);

  return {
    buildingsSaved: countWithout - countWith,
    goodsTraded: Array.from(tradeGoods)
  };
}

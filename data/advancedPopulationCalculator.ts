/**
 * Advanced Population Calculator with Production Optimization
 * Uses dependency graph to calculate upstream production automatically
 */

import { TIER_CONSUMPTION } from './generatedConsumption';
import {
  optimizeProductionChain,
  optimizeProductionChainWithWorkforce,
  computeWorkforceRequirements
} from './productionOptimizer';
import { serviceBuildings } from './generatedServiceBuildings';
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

  // 1. Calculate consumption rates
  const consumption: Record<string, number> = {};
  
  population.forEach(({ tier, count }) => {
    const consumptionRates = TIER_CONSUMPTION[tier];
    if (!consumptionRates) return;

    consumptionRates.forEach(rate => {
      const rateValue = includeElectricity && rate.tonsPer1000PerMinuteElectric
        ? rate.tonsPer1000PerMinuteElectric
        : rate.tonsPer1000PerMinute;

      const totalConsumption = (count / 1000) * rateValue;
      consumption[rate.good] = (consumption[rate.good] || 0) + totalConsumption;
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
      const consumptionRates = TIER_CONSUMPTION[tier];
      if (!consumptionRates) return;

      consumptionRates.forEach(rate => {
        const rateValue = includeElectricity && rate.tonsPer1000PerMinuteElectric
          ? rate.tonsPer1000PerMinuteElectric
          : rate.tonsPer1000PerMinute;

        const totalConsumption = (count / 1000) * rateValue;
        consumption[rate.good] = (consumption[rate.good] || 0) + totalConsumption;
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
      const residenceName = residenceNames[tier] || `${tier} Residence`;
      residences[residenceName] = housesNeeded;
      allBuildings[residenceName] = housesNeeded;
    });
  }

  // Add services for ALL population
  if (includeServices) {
    const totalPop = Object.values(totalPopulation).reduce((sum, count) => sum + count, 0);
    
    if (totalPop > 0) {
      allBuildings['Marketplace'] = Math.ceil(totalPop / 600);
      allBuildings['Fire Station'] = Math.ceil(totalPop / 800);
      allBuildings['Police Station'] = Math.ceil(totalPop / 1000);
    }

    // Tier-specific services
    const tier2Pop = ['Workers', 'Artisans', 'Engineers', 'Investors', 'Obreros']
      .reduce((sum, tier) => sum + (totalPopulation[tier] || 0), 0);
    if (tier2Pop > 0) {
      allBuildings['Church'] = Math.ceil(tier2Pop / 1000);
      allBuildings['School'] = Math.ceil(tier2Pop / 1200);
    }

    const tier3Pop = ['Artisans', 'Engineers', 'Investors']
      .reduce((sum, tier) => sum + (totalPopulation[tier] || 0), 0);
    if (tier3Pop > 0) {
      allBuildings['Variety Theatre'] = Math.ceil(tier3Pop / 1200);
      allBuildings['University'] = Math.ceil(tier3Pop / 1500);
    }

    const tier4Pop = ['Engineers', 'Investors']
      .reduce((sum, tier) => sum + (totalPopulation[tier] || 0), 0);
    if (tier4Pop > 0) {
      allBuildings['Bank'] = Math.ceil(tier4Pop / 1500);
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
    const consumptionRates = TIER_CONSUMPTION[tier];
    if (!consumptionRates) return;
    
    consumptionRates.forEach(rate => {
      consumption.add(rate.good);
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

import { BuildingDefinition, GameConfig, ResourceRate } from "../types";
import { GOOD_CONSUMPTION, calculateGoodDemand } from "../data/goodConsumption";

export interface PopulationGoal {
  tierId: string; // e.g., 'Farmer'
  count: number;
}

/**
 * PRODUCTION CALCULATOR V3
 * Uses ground-truth consumption rates from Anno-1800-Calculator reference data.
 * Calculates production buildings needed to satisfy good demand.
 * Respects "Regional Purity" by only using buildings available in the current config.
 */
export const calculateBuildingsForPopulation = (
  initialGoals: PopulationGoal[],
  config: GameConfig
): Record<string, number> => {
  
  // Step 1: Calculate residences and services for population goals
  let counts: Record<string, number> = {};
  const tierCounts: Record<string, number> = {};

  initialGoals.forEach(goal => {
    tierCounts[goal.tierId] = goal.count;
    
    // Find residence building for this tier
    const resDef = config.buildings.find(b => 
      b.category === 'Residence' && b.residence?.populationType === goal.tierId
    );

    if (resDef && resDef.residence) {
      const houseCount = Math.ceil(goal.count / resDef.residence.maxPopulation);
      counts[resDef.id] = (counts[resDef.id] || 0) + houseCount;
    }
  });

  // Step 2: Calculate good demand from population (using ground-truth rates)
  const goodDemand = calculateGoodDemand(tierCounts);

  // Step 3: Resolve good demand to production buildings
  Object.entries(goodDemand).forEach(([good, demandTMin]) => {
    if (demandTMin <= 0) return;

    // Find producer for this good in config
    // Match by production output or building name
    const producer = config.buildings.find(b => {
      if (!b.production?.outputs) return false;
      return b.production.outputs.some(o => 
        o.resourceId.toLowerCase() === good.toLowerCase() ||
        o.resourceId.toLowerCase().includes(good.toLowerCase())
      );
    });

    if (producer && producer.production?.outputs) {
      // Get output rate from production definition
      const output = producer.production.outputs.find(o => 
        o.resourceId.toLowerCase() === good.toLowerCase() ||
        o.resourceId.toLowerCase().includes(good.toLowerCase())
      );

      if (output) {
        const outputAmount = output.amount ?? 1; // Default to 1 unit per cycle if unspecified
        const cycleSeconds = producer.production.cycleTime || 30;
        const productionTMin = outputAmount * (60 / cycleSeconds);
        const buildingsNeeded = Math.ceil(demandTMin / productionTMin);
        if (buildingsNeeded > 0) {
          counts[producer.id] = (counts[producer.id] || 0) + buildingsNeeded;
        }
      }
    }
  });

  // Step 4: Simple service coverage (1 service per X houses)
  const SERVICE_COVERAGE: Record<string, { housesPerService: number, serviceId?: string }> = {
    'Farmers': { housesPerService: 50 },
    'Workers': { housesPerService: 40 },
    'Artisans': { housesPerService: 30 },
    'Engineers': { housesPerService: 25 },
    'Investors': { housesPerService: 20 },
  };

  initialGoals.forEach(goal => {
    const resDef = config.buildings.find(b => 
      b.category === 'Residence' && b.residence?.populationType === goal.tierId
    );

    if (resDef?.residence && SERVICE_COVERAGE[goal.tierId]) {
      const houseCount = Math.ceil(goal.count / resDef.residence.maxPopulation);
      const coverage = SERVICE_COVERAGE[goal.tierId];
      const servicesNeeded = Math.ceil(houseCount / coverage.housesPerService);

      // Find marketplace (universal service)
      const market = config.buildings.find(b => 
        b.category === 'Public' && 
        (b.name.toLowerCase().includes('market') || b.name.toLowerCase().includes('marketplace'))
      );
      if (market) {
        counts[market.id] = (counts[market.id] || 0) + servicesNeeded;
      }
    }
  });

  // 5. Infrastructure: Roads
  // Look for new road identifier logic
  const roadId = config.buildings.find(b => 
    b.name.toLowerCase().includes('road') || 
    b.id.toLowerCase().includes('street')
  )?.id || 'Street_1x1';
  
  if (roadId) {
      // Genetic Solver will handle road density, we just ensure it's in the manifest
      counts[roadId] = 0; 
  }

  return counts;
};
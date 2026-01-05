
import { BuildingDefinition, GameConfig, ResourceRate } from "../types";

export interface PopulationGoal {
  tierId: string; // e.g., 'Farmer'
  count: number;
}

export const calculateBuildingsForPopulation = (
  initialGoals: PopulationGoal[],
  config: GameConfig
): Record<string, number> => {
  
  // Clone goals to avoid mutating the original prop during our iterative solving
  const currentGoals = initialGoals.map(g => ({ ...g }));

  let counts: Record<string, number> = {};
  let totalResourceDemand: Record<string, number> = {};
  
  // Safety: Limit iterations to prevent infinite loops if data is malformed
  let iterations = 0;
  const MAX_ITERATIONS = 10;
  
  while(iterations < MAX_ITERATIONS) {
      iterations++;
      counts = {};
      totalResourceDemand = {};
      
      const workforceSupply: Record<string, number> = {};
      const workforceDemand: Record<string, number> = {};

      // 1. Calculate Residences & Direct Consumption based on CURRENT goals
      currentGoals.forEach(goal => {
        const resDef = config.buildings.find(b => 
          b.category === 'Residence' && b.residence?.populationType === goal.tierId
        );

        if (!resDef || !resDef.residence) return;

        const houseCount = Math.ceil(goal.count / resDef.residence.maxPopulation);
        counts[resDef.id] = (counts[resDef.id] || 0) + houseCount;
        
        // Track Workforce Supply
        // We assume full occupancy for calculation to be safe
        workforceSupply[goal.tierId] = (workforceSupply[goal.tierId] || 0) + (houseCount * resDef.residence.maxPopulation);

        // --- SERVICES ---
        const PACKING_EFFICIENCY = 0.45; 
        const houseArea = resDef.width * resDef.height;

        const requiredServices: string[] = [];
        if (goal.tierId === 'Farmer') requiredServices.push('mkt', 'pub', 'fire');
        if (goal.tierId === 'Worker') requiredServices.push('mkt', 'pub', 'school', 'church', 'fire', 'police');
        if (goal.tierId === 'Plebeian') requiredServices.push('forum', 'bath');

        requiredServices.forEach(serviceType => {
            const serviceDef = config.buildings.find(b => b.id.includes(serviceType) || b.name.toLowerCase().includes(serviceType));
            if (serviceDef && serviceDef.category === 'Public') {
                let coverageCapacity = 50;
                if (serviceDef.influenceRadius) {
                    const radius = serviceDef.influenceRadius;
                    const circleArea = Math.PI * radius * radius;
                    coverageCapacity = Math.floor((circleArea * PACKING_EFFICIENCY) / houseArea);
                }
                const neededForThisBatch = Math.ceil(houseCount / coverageCapacity);
                // Use simple accumulation for now. 
                // A better approach would be to track total houses per tier and recalc, 
                // but this is consistent with the original implementation.
                counts[serviceDef.id] = (counts[serviceDef.id] || 0) + neededForThisBatch;
            }
        });

        // --- RESOURCE DEMAND ---
        if (resDef.residence.consumption) {
          resDef.residence.consumption.forEach(c => {
            const total = c.amount * houseCount;
            totalResourceDemand[c.resourceId] = (totalResourceDemand[c.resourceId] || 0) + total;
          });
        }
      });

      // 2. Calculate Production Buildings (Recursive Chain)
      let demandChanged = true;
      // Inner loop for resource chains
      while (demandChanged) {
        demandChanged = false;

        Object.keys(totalResourceDemand).forEach(resId => {
          const demand = totalResourceDemand[resId];
          if (demand <= 0) return;

          // Find producer
          const producer = config.buildings.find(b => 
            b.production?.outputs?.some(out => out.resourceId === resId)
          );

          if (producer && producer.production && producer.production.outputs) {
            const outputRate = producer.production.outputs.find(o => o.resourceId === resId)?.amount || 1;
            const currentCount = counts[producer.id] || 0;
            const currentProduction = currentCount * outputRate;

            if (currentProduction < demand) {
              const needed = Math.ceil((demand - currentProduction) / outputRate);
              if (needed > 0) {
                counts[producer.id] = currentCount + needed;
                
                // Add Inputs to demand
                if (producer.production.inputs) {
                  producer.production.inputs.forEach(input => {
                    const inputNeeded = input.amount * needed;
                    totalResourceDemand[input.resourceId] = (totalResourceDemand[input.resourceId] || 0) + inputNeeded;
                    demandChanged = true; 
                  });
                }
              }
            }
          }
        });
      }

      // 3. Calculate Workforce Demand from Production
      Object.entries(counts).forEach(([bId, count]) => {
          const def = config.buildings.find(b => b.id === bId);
          if (def && def.production && def.production.workforce) {
              const wf = def.production.workforce;
              workforceDemand[wf.type] = (workforceDemand[wf.type] || 0) + (wf.amount * count);
          }
      });

      // 4. Check for Deficits
      let needsRetry = false;
      
      // Iterate over demanded workforce types
      Object.entries(workforceDemand).forEach(([tier, demand]) => {
          const supply = workforceSupply[tier] || 0;
          if (demand > supply) {
              const deficit = demand - supply;
              // Find the goal entry for this tier
              const goalIdx = currentGoals.findIndex(g => g.tierId === tier);
              
              if (goalIdx >= 0) {
                  currentGoals[goalIdx].count += deficit;
              } else {
                  // Add new goal for this tier
                  currentGoals.push({ tierId: tier, count: deficit });
              }
              needsRetry = true;
          }
      });

      if (!needsRetry) {
          break; // Optimization complete
      }
  }

  // 5. Finalize Roads
  const roadId = config.buildings.find(b => b.name.includes('Road'))?.id || 'road';
  if (roadId) {
      counts[roadId] = 0; 
  }

  return counts;
};

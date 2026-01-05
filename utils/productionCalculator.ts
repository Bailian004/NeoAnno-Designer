import { BuildingDefinition, GameConfig, ResourceRate } from "../types";

export interface PopulationGoal {
  tierId: string; // e.g., 'Farmer'
  count: number;
}

/**
 * PRODUCTION CALCULATOR V2
 * Strictly recursive: Calculates supporting tiers (T-1) needed for requested tier (T).
 * Respects "Regional Purity" by only using buildings available in the current config.
 */
export const calculateBuildingsForPopulation = (
  initialGoals: PopulationGoal[],
  config: GameConfig
): Record<string, number> => {
  
  // Clone goals to iterate
  const currentGoals = initialGoals.map(g => ({ ...g }));

  let counts: Record<string, number> = {};
  let totalResourceDemand: Record<string, number> = {};
  
  // Recursive Solver: Runs multiple passes to ensure workforce for production is also housed
  let iterations = 0;
  const MAX_ITERATIONS = 8;
  
  while(iterations < MAX_ITERATIONS) {
      iterations++;
      counts = {};
      totalResourceDemand = {};
      
      const workforceSupply: Record<string, number> = {};
      const workforceDemand: Record<string, number> = {};

      // 1. Calculate Houses & Public Services for current goals
      currentGoals.forEach(goal => {
        const resDef = config.buildings.find(b => 
          b.category === 'Residence' && b.residence?.populationType === goal.tierId
        );

        if (!resDef || !resDef.residence) return;

        const houseCount = Math.ceil(goal.count / resDef.residence.maxPopulation);
        counts[resDef.id] = (counts[resDef.id] || 0) + houseCount;
        
        // Track Workforce Supply from these houses
        workforceSupply[goal.tierId] = (workforceSupply[goal.tierId] || 0) + (houseCount * resDef.residence.maxPopulation);

        // --- SERVICES (Updated for Anno Designer Data compatibility) ---
        // A single service building supports a batch of houses within its radius
        const PACKING_EFFICIENCY = 0.5; 
        const houseArea = resDef.width * resDef.height;

        const requiredServices: string[] = [];
        if (goal.tierId === 'Farmer' || goal.tierId === 'Peasant') requiredServices.push('marketplace', 'pub', 'chapel', 'fire station');
        if (goal.tierId === 'Worker' || goal.tierId === 'Citizen') requiredServices.push('marketplace', 'pub', 'tavern', 'school', 'church', 'fire station', 'police');
        if (goal.tierId === 'Artisan' || goal.tierId === 'Patrician') requiredServices.push('marketplace', 'school', 'church', 'university', 'hospital', 'fire station', 'police');
        if (goal.tierId === 'Engineer' || goal.tierId === 'Nobleman') requiredServices.push('university', 'bank', 'theatre', 'hospital');
        if (goal.tierId === 'Plebeian') requiredServices.push('forum', 'bath');

        requiredServices.forEach(serviceType => {
            const serviceDef = config.buildings.find(b => 
              (b.name.toLowerCase().includes(serviceType) || b.id.toLowerCase().includes(serviceType.replace(' ', ''))) && 
              b.category === 'Public'
            );
            if (serviceDef) {
                let coverageCapacity = 40; // Default fallback
                if (serviceDef.influenceRadius) {
                    const radius = serviceDef.influenceRadius;
                    const circleArea = Math.PI * radius * radius;
                    coverageCapacity = Math.floor((circleArea * PACKING_EFFICIENCY) / houseArea);
                }
                const neededCount = Math.ceil(houseCount / Math.max(1, coverageCapacity));
                counts[serviceDef.id] = (counts[serviceDef.id] || 0) + neededCount;
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

      // 2. Production Chain Solver
      let demandChanged = true;
      while (demandChanged) {
        demandChanged = false;

        Object.keys(totalResourceDemand).forEach(resId => {
          const demand = totalResourceDemand[resId];
          if (demand <= 0.001) return;

          // Find producer in this region
          const producer = config.buildings.find(b => 
            b.production?.outputs?.some(out => out.resourceId === resId)
          );

          if (producer && producer.production && producer.production.outputs) {
            const outputRate = producer.production.outputs.find(o => o.resourceId === resId)?.amount || 1;
            const currentCount = counts[producer.id] || 0;
            const currentProduction = currentCount * outputRate;

            if (currentProduction < demand) {
              const deficit = demand - currentProduction;
              const needed = Math.ceil(deficit / outputRate);
              if (needed > 0) {
                counts[producer.id] = currentCount + needed;
                
                // Propagate demand to inputs
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

      // 3. Workforce Demand Analysis
      Object.entries(counts).forEach(([bId, count]) => {
          const def = config.buildings.find(b => b.id === bId);
          if (def && def.production && def.production.workforce) {
              const wf = def.production.workforce;
              workforceDemand[wf.type] = (workforceDemand[wf.type] || 0) + (wf.amount * count);
          }
      });

      // 4. Balance: If demand > supply, add more lower tier residences
      let needsRetry = false;
      Object.entries(workforceDemand).forEach(([tier, demand]) => {
          const supply = workforceSupply[tier] || 0;
          if (demand > supply) {
              const deficitCount = Math.ceil((demand - supply) / 10); // Heuristic: avg 10 people per house
              const goalIdx = currentGoals.findIndex(g => g.tierId === tier);
              
              if (goalIdx >= 0) {
                  currentGoals[goalIdx].count += deficitCount * 10;
              } else {
                  currentGoals.push({ tierId: tier, count: deficitCount * 10 });
              }
              needsRetry = true;
          }
      });

      if (!needsRetry) break;
  }

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
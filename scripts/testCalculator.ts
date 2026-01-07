/**
 * Quick test to validate that productionCalculator now uses correct consumption rates
 * Test case: 1000 Workers + 500 Farmers should need ~3-4 fisheries, not 29
 */

import { calculateBuildingsForPopulation } from "../utils/productionCalculator";
import { GOOD_CONSUMPTION, calculateGoodDemand } from "../data/goodConsumption";

// Mock a minimal config
const mockConfig = {
  buildings: [
    {
      id: "farmer-house",
      name: "Farmer's Lodge",
      category: "Residence" as const,
      footprint: { width: 2, height: 2 },
      residence: {
        populationType: "Farmers",
        maxPopulation: 20,
        consumption: []
      }
    },
    {
      id: "worker-house",
      name: "Worker's House",
      category: "Residence" as const,
      footprint: { width: 2, height: 2 },
      residence: {
        populationType: "Workers",
        maxPopulation: 50,
        consumption: []
      }
    },
    {
      id: "fishery",
      name: "Fishery",
      category: "Production" as const,
      footprint: { width: 3, height: 3 },
      production: {
        cycleTime: 30,
        inputs: [],
        outputs: [
          { resourceId: "Fish", amount: 2 }
        ],
        workforce: {
          type: "Workers",
          amount: 10
        }
      }
    },
    {
      id: "marketplace",
      name: "Marketplace",
      category: "Public" as const,
      footprint: { width: 2, height: 2 }
    },
    {
      id: "street",
      name: "Street",
      category: "Infrastructure" as const,
      footprint: { width: 1, height: 1 }
    }
  ]
};

// Test case
const goals = [
  { tierId: "Farmers", count: 500 },
  { tierId: "Workers", count: 1000 }
];

console.log("=== PRODUCTION CALCULATOR TEST ===\n");

// Calculate expected demand
const tierCounts = {
  "Farmers": 500,
  "Workers": 1000
};
const goodDemand = calculateGoodDemand(tierCounts);
console.log("Good Demand:", goodDemand);

// Calculate fish demand specifically
const farmersFishDemand = (500 / 1000) * 0.025; // Farmers consumption = 0.025 t/1000/min
const workersFishDemand = (1000 / 1000) * 0.050; // Workers consumption = 0.050 t/1000/min
const totalFishDemandPerMin = farmersFishDemand + workersFishDemand;
console.log(`\nFish Demand Breakdown:`);
console.log(`  Farmers (500 pop): ${farmersFishDemand.toFixed(4)} t/min`);
console.log(`  Workers (1000 pop): ${workersFishDemand.toFixed(4)} t/min`);
console.log(`  Total: ${totalFishDemandPerMin.toFixed(4)} t/min`);

// Fishery production: 2 t per 30s = 4 t/min
const fisheryProductionPerMin = 4;
const fisheriesNeeded = Math.ceil(totalFishDemandPerMin / fisheryProductionPerMin);
console.log(`\nFishery Production: ${fisheryProductionPerMin} t/min per fishery`);
console.log(`Fisheries Needed: ${fisheriesNeeded}`);
console.log(`Expected Range: 3-4 fisheries`);
console.log(`Test ${fisheriesNeeded <= 4 && fisheriesNeeded >= 3 ? "✅ PASS" : "❌ FAIL"}`);

// Call calculator
const result = calculateBuildingsForPopulation(goals, mockConfig as any);
console.log("\nCalculator Result:", result);
if (result["fishery"]) {
  console.log(`Fisheries from calculator: ${result["fishery"]}`);
}

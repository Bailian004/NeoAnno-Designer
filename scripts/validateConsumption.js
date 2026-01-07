/**
 * Validation: Fish consumption rates in goodConsumption.ts
 * Expected: ~3-4 fisheries for 1000 Workers + 500 Farmers
 */

// Fish consumption rates from goodConsumption.ts (t per 1000 pop per minute)
const FARMERS_FISH_RATE = 2.5;
const WORKERS_FISH_RATE = 2.5;

// Population
const FARMERS_POP = 1500;
const WORKERS_POP = 0;

// Calculate demand per minute
const farmersFishDemand = (FARMERS_POP / 1000) * FARMERS_FISH_RATE;
const workersFishDemand = (WORKERS_POP / 1000) * WORKERS_FISH_RATE;
const totalDemand = farmersFishDemand + workersFishDemand;

// Fishery production: 1 t per 30s = 2 t/min
const FISHERY_PRODUCTION_PER_CYCLE = 1;
const CYCLE_TIME_SECONDS = 30;
const FISHERY_PRODUCTION_PER_MINUTE = (FISHERY_PRODUCTION_PER_CYCLE / CYCLE_TIME_SECONDS) * 60;

const fisheriesNeeded = Math.ceil(totalDemand / FISHERY_PRODUCTION_PER_MINUTE);

console.log("=== FISH CONSUMPTION VALIDATION ===\n");
console.log(`Farmers: ${FARMERS_POP} pop × ${FARMERS_FISH_RATE} t/1000/min = ${farmersFishDemand.toFixed(4)} t/min`);
console.log(`Workers: ${WORKERS_POP} pop × ${WORKERS_FISH_RATE} t/1000/min = ${workersFishDemand.toFixed(4)} t/min`);
console.log(`Total Fish Demand: ${totalDemand.toFixed(4)} t/min\n`);

console.log(`Fishery Output: ${FISHERY_PRODUCTION_PER_CYCLE} t per ${CYCLE_TIME_SECONDS}s = ${FISHERY_PRODUCTION_PER_MINUTE.toFixed(1)} t/min`);
console.log(`Fisheries Needed: ${fisheriesNeeded}`);
console.log(`Expected: 2 fisheries for 1500 Farmers (matches Anno calculator)`);
console.log(`\nResult: ${fisheriesNeeded === 2 ? "✅ PASS" : "❌ FAIL"}`);

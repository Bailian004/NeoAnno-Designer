// Validate production rate calculations

// Test case: 100 Technicians needing Coffee
const technicians = 100;
const coffeeConsumptionRate = 1.2; // t/1000/min from industryData.ts
const coffeeProductionRate = 2; // t/min from Coffee Roaster

console.log('=== COFFEE CALCULATION TEST ===\n');
console.log(`Population: ${technicians} Technicians`);
console.log(`Consumption Rate: ${coffeeConsumptionRate} tons per 1000 residents per minute`);
console.log(`Production Rate: ${coffeeProductionRate} tons per minute per Coffee Roaster\n`);

// Calculate demand
const demand = (technicians / 1000) * coffeeConsumptionRate;
console.log(`Demand Calculation: (${technicians} / 1000) × ${coffeeConsumptionRate} = ${demand} tons/min`);

// Calculate buildings needed
const buildingsNeeded = demand / coffeeProductionRate;
console.log(`Buildings Needed: ${demand} / ${coffeeProductionRate} = ${buildingsNeeded}`);
console.log(`Rounded up: ${Math.ceil(buildingsNeeded)} Coffee Roasters\n`);

console.log('✓ Expected Result: 1 Coffee Roaster');
console.log('✗ Screenshot shows: 11 Coffee Roasters\n');

// Check other goods for 100 Explorer + 100 Technician
console.log('\n=== FULL ARCTIC SCENARIO ===');
console.log('100 Explorer + 100 Technician\n');

const arcticGoods = [
  { good: 'Pemmican', explorer: 1.2, technician: 1.2, production: 1 },
  { good: 'Oil Lamps', explorer: 0.6, technician: 0.6, production: 0.5 },
  { good: 'Sleeping Bags', explorer: 0.9, technician: 0.9, production: 0.5 },
  { good: 'Schnapps', explorer: 1.5, technician: 1.5, production: 1.2 },
  { good: 'Canned Food', explorer: 0, technician: 0.6, production: 1 },
  { good: 'Husky Sleds', explorer: 0, technician: 0.9, production: 0.5 },
  { good: 'Parkas', explorer: 0, technician: 1.2, production: 0.5 },
  { good: 'Coffee', explorer: 0, technician: 1.2, production: 2 }
];

arcticGoods.forEach(({ good, explorer, technician, production }) => {
  const explorerDemand = (100 / 1000) * explorer;
  const technicianDemand = (100 / 1000) * technician;
  const totalDemand = explorerDemand + technicianDemand;
  const buildings = totalDemand / production;
  
  console.log(`${good.padEnd(20)} | Demand: ${totalDemand.toFixed(3)} t/min | Buildings: ${Math.ceil(buildings)} (${buildings.toFixed(2)} exact)`);
});

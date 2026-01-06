/**
 * Test the complete population → layout pipeline
 */

import { loadBuildingDefinitions, mapTargetCountsToIds } from '../data/buildingAdapter';
import { calculateAllRequirements } from '../data/populationCalculator';
import { GeneticSolver } from '../services/geneticSolver';

// Test with a simple population
const testPopulation = [
  { tier: 'Farmers', count: 500 },
  { tier: 'Workers', count: 1000 }
];

console.log('=== ANNO 1800 LAYOUT GENERATOR TEST ===\n');
console.log('Target Population:');
testPopulation.forEach(p => console.log(`  ${p.tier}: ${p.count}`));
console.log();

// Step 1: Calculate building requirements
console.log('Step 1: Calculating building requirements...');
const targetCounts = calculateAllRequirements(testPopulation, false);
console.log('Required buildings:');
Object.entries(targetCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([name, count]) => {
    console.log(`  ${count}x ${name}`);
  });
console.log();

// Step 2: Load building definitions
console.log('Step 2: Loading building definitions...');
const definitions = loadBuildingDefinitions();
console.log(`Loaded ${definitions.length} building types`);
console.log();

// Step 3: Map friendly names to building IDs
console.log('Step 3: Mapping building names to IDs...');
const targetCountsById = mapTargetCountsToIds(targetCounts, definitions);
console.log('Mapped target counts:');
Object.entries(targetCountsById).slice(0, 5).forEach(([id, count]) => {
  const def = definitions.find(d => d.id === id);
  console.log(`  ${count}x ${id} (${def?.name || 'Unknown'})`);
});
console.log(`  ... and ${Object.keys(targetCountsById).length - 5} more`);
console.log();

// Step 4: Run genetic solver
console.log('Step 4: Running genetic solver in CITY mode...');
const solver = new GeneticSolver(
  {
    areaWidth: 100,
    areaHeight: 100,
    populationSize: 40,
    generations: 50,
    targetCounts: targetCountsById,
    blockedCells: new Set()
  },
  definitions,
  'city'
);

solver.init();
let iterations = 0;
const maxIterations = 200;

while (!solver.isFinished && iterations < maxIterations) {
  solver.step();
  iterations++;
}

const bestResult = solver.getBest();
const result = bestResult.genome;
console.log(`Completed in ${iterations} iterations`);
console.log(`Buildings placed: ${result.length}`);
console.log(`Errors: ${solver.errors.length}`);

if (solver.errors.length > 0) {
  console.log('\nErrors encountered:');
  solver.errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
  if (solver.errors.length > 10) {
    console.log(`  ... and ${solver.errors.length - 10} more`);
  }
}

// Analyze placement
const byType: Record<string, number> = {};
result.forEach(building => {
  const def = definitions.find(d => d.id === building.definitionId);
  const category = def?.category || 'Unknown';
  byType[category] = (byType[category] || 0) + 1;
});

console.log('\nPlacement summary by category:');
Object.entries(byType).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}`);
});

console.log('\n=== TEST COMPLETE ===');

// Export for inspection
import fs from 'fs';
fs.writeFileSync(
  'test-output.json',
  JSON.stringify({
    population: testPopulation,
    targetCounts,
    definitions: definitions.slice(0, 10), // Sample
    result: result.slice(0, 20), // Sample placements
    byType,
    errors: solver.errors
  }, null, 2)
);
console.log('\nDetailed output saved to test-output.json');

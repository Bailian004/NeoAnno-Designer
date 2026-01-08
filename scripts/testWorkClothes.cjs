const { optimizeProductionChain } = require('../dist/data/productionOptimizer');

// Small harness to check that Work Clothes pulls Sheep Farms
const consumption = { 'Work Clothes': 1.0 };
const result = optimizeProductionChain(consumption, false);
console.log('Production for 1.0 t/min Work Clothes:');
console.log(result);

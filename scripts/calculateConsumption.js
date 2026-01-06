/**
 * Calculate consumption rates from wikiBuildingInfo.json SupplyInfos
 * and production data from Anno 1800 Building Reference Guide
 */

import fs from 'fs';

// Load data
const wikiRaw = fs.readFileSync('wikiBuildingInfo.json', 'utf-8');
const wiki = JSON.parse(wikiRaw.replace(/^\uFEFF/, ''));

const guideData = JSON.parse(fs.readFileSync('data/generatedSummary.json', 'utf-8'));

// Build production rate lookup from guide
const productionRates = new Map();
guideData.buildings.forEach(b => {
  if (b.production && b.name) {
    const ratePerMinute = (b.production.amount * 60) / b.production.time;
    productionRates.set(b.name.toLowerCase(), {
      name: b.name,
      rate: ratePerMinute,
      output: b.outputProduct
    });
  }
});

// Calculate consumption from SupplyInfos
const consumptionByTier = {};

wiki.Infos.forEach(info => {
  if (!info.SupplyInfos || !info.SupplyInfos.SupplyEntries) return;
  
  const buildingName = info.Name.split('|')[0].trim();
  const prodInfo = productionRates.get(buildingName.toLowerCase());
  
  if (!prodInfo) {
    console.log(`No production rate found for: ${buildingName}`);
    return;
  }
  
  info.SupplyInfos.SupplyEntries.forEach(entry => {
    const tier = entry.Type;
    const residentsSupplied = entry.Amount;
    const residentsWithElec = entry.AmountElectricity;
    
    // Calculate consumption per 1000 residents
    const consumptionPer1000 = (prodInfo.rate / residentsSupplied) * 1000;
    const consumptionPer1000Elec = residentsWithElec > 0 
      ? (prodInfo.rate / residentsWithElec) * 1000 
      : null;
    
    if (!consumptionByTier[tier]) {
      consumptionByTier[tier] = [];
    }
    
    consumptionByTier[tier].push({
      good: prodInfo.output,
      building: buildingName,
      productionRate: prodInfo.rate.toFixed(3),
      residentsSupplied,
      residentsWithElec,
      consumptionPer1000: consumptionPer1000.toFixed(3),
      consumptionPer1000Elec: consumptionPer1000Elec?.toFixed(3) || null
    });
  });
});

// Generate TypeScript output
let ts = `// Auto-generated consumption rates from wikiBuildingInfo.json\n`;
ts += `// Generated: ${new Date().toISOString()}\n\n`;

ts += `export interface ConsumptionRate {\n`;
ts += `  good: string;\n`;
ts += `  building: string;\n`;
ts += `  tonsPer1000PerMinute: number; // Without electricity\n`;
ts += `  tonsPer1000PerMinuteElectric?: number; // With electricity\n`;
ts += `}\n\n`;

ts += `export const TIER_CONSUMPTION: Record<string, ConsumptionRate[]> = {\n`;

Object.keys(consumptionByTier).sort().forEach(tier => {
  ts += `  '${tier}': [\n`;
  consumptionByTier[tier].forEach(item => {
    ts += `    {\n`;
    ts += `      good: ${JSON.stringify(item.good)},\n`;
    ts += `      building: ${JSON.stringify(item.building)},\n`;
    ts += `      tonsPer1000PerMinute: ${item.consumptionPer1000},\n`;
    if (item.consumptionPer1000Elec) {
      ts += `      tonsPer1000PerMinuteElectric: ${item.consumptionPer1000Elec},\n`;
    }
    ts += `    },\n`;
  });
  ts += `  ],\n`;
});

ts += `};\n\n`;

// Add helper function
ts += `/**\n`;
ts += ` * Calculate required production buildings for a population\n`;
ts += ` */\n`;
ts += `export function calculateRequiredBuildings(\n`;
ts += `  population: Record<string, number>,\n`;
ts += `  hasElectricity = false\n`;
ts += `): Record<string, number> {\n`;
ts += `  const required: Record<string, number> = {};\n`;
ts += `  \n`;
ts += `  Object.entries(population).forEach(([tier, count]) => {\n`;
ts += `    const rates = TIER_CONSUMPTION[tier];\n`;
ts += `    if (!rates) return;\n`;
ts += `    \n`;
ts += `    rates.forEach(rate => {\n`;
ts += `      const consumption = hasElectricity && rate.tonsPer1000PerMinuteElectric\n`;
ts += `        ? rate.tonsPer1000PerMinuteElectric\n`;
ts += `        : rate.tonsPer1000PerMinute;\n`;
ts += `      \n`;
ts += `      const totalConsumption = (count / 1000) * consumption;\n`;
ts += `      const buildingKey = rate.building;\n`;
ts += `      \n`;
ts += `      required[buildingKey] = (required[buildingKey] || 0) + totalConsumption;\n`;
ts += `    });\n`;
ts += `  });\n`;
ts += `  \n`;
ts += `  return required;\n`;
ts += `}\n`;

fs.writeFileSync('data/generatedConsumption.ts', ts);
console.log('Generated data/generatedConsumption.ts');

// Output summary
console.log('\nConsumption rates by tier:');
Object.entries(consumptionByTier).forEach(([tier, rates]) => {
  console.log(`\n${tier} (${rates.length} goods):`);
  rates.forEach(r => {
    console.log(`  ${r.good}: ${r.consumptionPer1000} t/min per 1000 residents (${r.building})`);
  });
});

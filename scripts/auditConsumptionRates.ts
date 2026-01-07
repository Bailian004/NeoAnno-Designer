/**
 * Consumption Rates Audit
 * Compares generatedConsumption.ts against Anno-1800-Calculator reference data
 * Identifies outliers and suggests corrections
 */

import * as fs from 'fs';

interface RefConsumption {
  [tier: string]: {
    basic?: Record<string, number>;
    luxury?: Record<string, number>;
  };
}

interface Producer {
  product: string;
  building: string;
  productionTime: number;
}

interface ConsumptionRate {
  good: string;
  building: string;
  tonsPer1000PerMinute: number;
}

// Load reference data
const refConsumptionPath = './Anno-1800-Calculator-main/src/data/consumption.json';
const refProducersPath = './Anno-1800-Calculator-main/src/data/producers.json';
const ourConsumptionPath = './data/generatedConsumption.ts';

// Map tier names (normalize case)
const tierMap: Record<string, string> = {
  'Farmers': 'farmers',
  'Workers': 'workers',
  'Artisans': 'artisans',
  'Engineers': 'engineers',
  'Investors': 'investors',
  'Jornaleros': 'jornaleros',
  'Jornalero': 'jornaleros',
  'Obreros': 'obreros',
  'Obrero': 'obreros',
};

function loadReferenceConsumption(): RefConsumption {
  try {
    const data = fs.readFileSync(refConsumptionPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to load reference consumption from ${refConsumptionPath}`);
    return {};
  }
}

function loadReferenceProducers(): Record<string, Producer> {
  try {
    const data = fs.readFileSync(refProducersPath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to load reference producers from ${refProducersPath}`);
    return {};
  }
}

function parseOurConsumption(): Record<string, ConsumptionRate[]> {
  try {
    const data = fs.readFileSync(ourConsumptionPath, 'utf8');
    
    // Use a simple regex-based extraction
    const obj: Record<string, ConsumptionRate[]> = {};
    const tierRegex = /'(\w+)':\s*\[([\s\S]*?)\]/g;
    let tierMatch;
    
    while ((tierMatch = tierRegex.exec(data)) !== null) {
      const tier = tierMatch[1];
      const content = tierMatch[2];
      const rates: ConsumptionRate[] = [];
      
      const rateRegex = /good:\s*"([^"]+)"[\s\S]*?building:\s*"([^"]+)"[\s\S]*?tonsPer1000PerMinute:\s*([\d.]+)/g;
      let rateMatch;
      
      while ((rateMatch = rateRegex.exec(content)) !== null) {
        rates.push({
          good: rateMatch[1],
          building: rateMatch[2],
          tonsPer1000PerMinute: parseFloat(rateMatch[3])
        });
      }
      
      if (rates.length > 0) obj[tier] = rates;
    }
    
    return obj;
  } catch (e) {
    console.error(`Failed to parse our consumption: ${e}`);
    return {};
  }
}

function audit() {
  const refConsumption = loadReferenceConsumption();
  const refProducers = loadReferenceProducers();
  const ourConsumption = parseOurConsumption();

  console.log('\n=== CONSUMPTION RATES AUDIT ===\n');
  console.log('Comparing against Anno-1800-Calculator reference data...\n');

  const issues: string[] = [];
  const suggestions: Array<{ tier: string; good: string; current: number; suggested: number; ratio: number }> = [];

  // For each tier in reference data
  for (const [refTier, refTierData] of Object.entries(refConsumption)) {
    const ourTier = ourConsumption[refTier] || [];
    
    // Combine basic + luxury consumptions
    const allRefGoods: Record<string, number> = {};
    if (refTierData.basic) Object.assign(allRefGoods, refTierData.basic);
    if (refTierData.luxury) Object.assign(allRefGoods, refTierData.luxury);

    for (const [refGood, refRate] of Object.entries(allRefGoods)) {
      if (refRate === '' || typeof refRate !== 'number') continue; // Skip service buildings
      
      // Skip if rate is 0 or very small
      if (refRate < 0.001) continue;

      const ourRate = ourTier.find(r => r.building.toLowerCase().includes(refGood.toLowerCase()));
      
      if (!ourRate) {
        issues.push(`⚠️  [${refTier}] Missing: ${refGood} (ref rate: ${refRate})`);
        continue;
      }

      const ratio = ourRate.tonsPer1000PerMinute / refRate;
      
      // Flag if ours is >2x or <0.5x the reference
      if (ratio > 2 || ratio < 0.5) {
        const direction = ratio > 2 ? '📈 OVERESTIMATED' : '📉 UNDERESTIMATED';
        issues.push(
          `${direction}: [${refTier}] ${refGood}\n` +
          `    Reference: ${refRate.toFixed(4)} t/1000/min\n` +
          `    Ours:      ${ourRate.tonsPer1000PerMinute.toFixed(4)} t/1000/min (ratio: ${ratio.toFixed(2)}x)`
        );
        
        suggestions.push({
          tier: refTier,
          good: refGood,
          current: ourRate.tonsPer1000PerMinute,
          suggested: refRate,
          ratio
        });
      }
    }
  }

  if (issues.length > 0) {
    console.log('🚨 OUTLIERS DETECTED:\n');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('✅ All rates within acceptable range (0.5x – 2.0x reference)\n');
  }

  if (suggestions.length > 0) {
    console.log('\n📋 SUGGESTED CORRECTIONS:\n');
    console.log('Replace these in generatedConsumption.ts:\n');
    
    suggestions.forEach(({ tier, good, current, suggested }) => {
      console.log(
        `  [${tier}] ${good}:\n` +
        `    FROM: ${current.toFixed(6)}\n` +
        `    TO:   ${suggested.toFixed(6)}\n`
      );
    });
  }

  console.log('\n=== END AUDIT ===\n');
}

audit();

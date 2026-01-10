// Extracted from params.js residentsPerNeed data
const data = {
  explorer: { 
    needs: {'1010213':2, '112701':0, '112702':3, '112705':3, '114890':4, '2524':4},
    residentMax: 10
  },
  technician: {
    needs: {'1010217':3, '1010222':3, '112693':3, '112700':0, '112701':0, '112702':3, '112703':4, '112705':3, '114890':4},
    residentMax: 20
  },
  shepherd: {
    needs: {'1010192':1, '1010217':3, '114356':1, '114359':2, '114371':3, '114401':2, '120020':3, '120043':2, '133183':1, '25506':2},
    residentMax: 10
  },
  elder: {
    needs: {'1010203':2, '1010206':2, '1010240':3, '112697':2, '114359':2, '114371':3, '114401':2, '114410':3, '117698':2, '117699':3, '118724':2, '120020':3, '5383':3, '5386':3},
    residentMax: 20
  }
};

// Good name mappings from params.js
const goods = {
  '1010213': 'Bread', '112701': 'Sleeping Bags', '112702': 'Oil Lamps', '112705': 'Pemmican',
  '114890': 'Schnapps', '2524': 'Sausages', '1010217': 'Soap', '1010222': 'Canned Food',
  '112693': 'Coffee', '112700': 'Parkas', '112703': 'Husky Sleds',
  '1010192': 'Goat Milk', '114356': 'Finery', '114359': 'Dried Meat', '114371': 'Hibiscus Tea',
  '114401': 'Tapestries', '120020': 'Pottery', '120043': 'Clay Pipes', '133183': 'Linen',
  '25506': 'Beer', '1010203': 'Ceramics', '1010206': 'Seafood Stew', '1010240': 'Illuminated Scripts',
  '112697': 'Lanterns', '114410': 'Mud Bricks', '117698': 'Glasses', '117699': 'Coffee Beans',
  '118724': 'Soap', '5383': 'Bread', '5386': 'Sausages'
};

// Current implementation from industryData.ts
const currentRates = {
  'Explorer': [
    { goodId: 'Pemmican', amountPer1000: 1.2 },
    { goodId: 'Oil Lamps', amountPer1000: 0.6 },
    { goodId: 'Sleeping Bags', amountPer1000: 0.9 },
    { goodId: 'Schnapps', amountPer1000: 1.5 }
  ],
  'Technician': [
    { goodId: 'Pemmican', amountPer1000: 1.2 },
    { goodId: 'Oil Lamps', amountPer1000: 0.6 },
    { goodId: 'Canned Food', amountPer1000: 0.6 },
    { goodId: 'Husky Sleds', amountPer1000: 0.9 },
    { goodId: 'Sleeping Bags', amountPer1000: 0.9 },
    { goodId: 'Schnapps', amountPer1000: 1.5 },
    { goodId: 'Parkas', amountPer1000: 1.2 },
    { goodId: 'Coffee', amountPer1000: 1.2 }
  ],
  'Shepherd': [
    { goodId: 'Goat Milk', amountPer1000: 3.0 },
    { goodId: 'Finery', amountPer1000: 1.5 },
    { goodId: 'Dried Meat', amountPer1000: 2.1 },
    { goodId: 'Hibiscus Tea', amountPer1000: 1.2 }
  ],
  'Elder': [
    { goodId: 'Goat Milk', amountPer1000: 3.0 },
    { goodId: 'Finery', amountPer1000: 1.5 },
    { goodId: 'Dried Meat', amountPer1000: 2.1 },
    { goodId: 'Ceramics', amountPer1000: 1.2 },
    { goodId: 'Seafood Stew', amountPer1000: 1.11 },
    { goodId: 'Illuminated Scripts', amountPer1000: 0.54 },
    { goodId: 'Lanterns', amountPer1000: 0.9 },
    { goodId: 'Hibiscus Tea', amountPer1000: 1.2 },
    { goodId: 'Tapestries', amountPer1000: 1.05 },
    { goodId: 'Clay Pipes', amountPer1000: 0.45 },
    { goodId: 'Glasses', amountPer1000: 0.36 }
  ]
};

console.log('=== CONSUMPTION RATE VALIDATION ===\n');

Object.entries(data).forEach(([tier, info]) => {
  const tierName = tier.charAt(0).toUpperCase() + tier.slice(1);
  console.log(`\n${tierName.toUpperCase()} (Max: ${info.residentMax} per house):`);
  console.log('-'.repeat(80));
  
  const currentTier = currentRates[tierName] || [];
  
  Object.entries(info.needs).forEach(([id, residentsPerNeed]) => {
    if (residentsPerNeed === 0) return; // Skip optional/luxury goods
    
    const goodName = goods[id] || `Unknown(${id})`;
    const tonsPerMin = info.residentMax / residentsPerNeed / 60;
    const tonsPer1000 = (tonsPerMin * 1000).toFixed(3);
    
    const current = currentTier.find(r => r.goodId === goodName);
    const currentRate = current ? current.amountPer1000 : 'MISSING';
    const match = current && Math.abs(current.amountPer1000 - parseFloat(tonsPer1000)) < 0.01 ? '✓' : '✗';
    
    console.log(`  ${goodName.padEnd(25)} | Expected: ${tonsPer1000.padStart(8)} | Current: ${String(currentRate).padStart(8)} | ${match}`);
  });
});

console.log('\n\n=== SUMMARY ===');
console.log('Expected rates are calculated as: (residentsPerHouse / residentsPerNeed / 60) * 1000');
console.log('This gives tons per 1000 residents per minute.');

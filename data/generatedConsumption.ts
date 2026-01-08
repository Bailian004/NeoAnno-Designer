// Auto-generated consumption rates from wikiBuildingInfo.json
// Generated: 2026-01-06T23:05:48.512Z

export interface ConsumptionRate {
  good: string;
  building: string;
  tonsPer1000PerMinute: number; // Without electricity
  tonsPer1000PerMinuteElectric?: number; // With electricity
}

export const TIER_CONSUMPTION: Record<string, ConsumptionRate[]> = {
  'Artisans': [
    {
      good: "Bakery",
      building: "Bakery",
      // Bread demand ~1.21 t/min per 1000 Artisans
      tonsPer1000PerMinute: 1.212,
      tonsPer1000PerMinuteElectric: 1.212,
    },
    {
      good: "Brewery",
      building: "Brewery",
      // Beer demand ~1.03 t/min per 1000 Artisans
      tonsPer1000PerMinute: 1.026,
      tonsPer1000PerMinuteElectric: 1.026,
    },
    {
      good: "Cannery",
      building: "Cannery",
      // Canned Food ~0.342 t/min per 1000 Artisans
      tonsPer1000PerMinute: 0.342,
      tonsPer1000PerMinuteElectric: 0.342,
    },
    {
      good: "Dealer",
      building: "Fur Dealer",
      // Fur Coats ~0.889 t/min per 1000 Artisans
      tonsPer1000PerMinute: 0.889,
      tonsPer1000PerMinuteElectric: 0.889,
    },
    {
      good: "Distillery",
      building: "Rum Distillery",
      // Rum ~1.905 t/min per 1000 Artisans
      tonsPer1000PerMinute: 1.905,
    },
    {
      good: "Slaughterhouse",
      building: "Slaughterhouse",
      // Sausages ~1.333 t/min per 1000 Artisans
      tonsPer1000PerMinute: 1.333,
      tonsPer1000PerMinuteElectric: 1.333,
    },
    {
      good: "Factory",
      building: "Soap Factory",
      // Soap ~0.556 t/min per 1000 Artisans
      tonsPer1000PerMinute: 0.556,
      tonsPer1000PerMinuteElectric: 0.556,
    },
  ],
  'Engineers': [
    {
      good: "Factory",
      building: "Bicycle Factory",
      // Penny Farthings ~0.625 t/min per 1000 Engineers
      tonsPer1000PerMinute: 0.625,
      tonsPer1000PerMinuteElectric: 0.625,
    },
    {
      good: "Cannery",
      building: "Cannery",
      // Canned Food ~0.513 t/min per 1000 Engineers
      tonsPer1000PerMinute: 0.513,
      tonsPer1000PerMinuteElectric: 0.513,
    },
    {
      good: "Clockmakers",
      building: "Clockmakers",
      // Pocket Watches ~0.196 t/min per 1000 Engineers
      tonsPer1000PerMinute: 0.196,
      tonsPer1000PerMinuteElectric: 0.196,
    },
    {
      good: "Roaster",
      building: "Coffee Roaster",
      // Coffee ~1.176 t/min per 1000 Engineers
      tonsPer1000PerMinute: 1.176,
    },
    {
      good: "Dealer",
      building: "Fur Dealer",
      // Fur Coats ~1.333 t/min per 1000 Engineers
      tonsPer1000PerMinute: 1.333,
      tonsPer1000PerMinuteElectric: 1.333,
    },
    {
      good: "Distillery",
      building: "Rum Distillery",
      // Rum ~2.857 t/min per 1000 Engineers
      tonsPer1000PerMinute: 2.857,
    },
  ],
  'Farmers': [
    {
      good: "Fishery",
      building: "Fishery",
      // Corrected to match in-game rate: ~1 Fishery per 500 Farmers/Workers
      // (2 t/min output → 4 t/1000/min consumption)
      tonsPer1000PerMinute: 4.000,
    },
    {
      good: "Knit.",
      building: "Framework Knit.",
      // Work Clothes ~3.077 t/min per 1000 Farmers
      tonsPer1000PerMinute: 3.077,
    },
    {
      good: "Distill.",
      building: "Schnapps Distill.",
      // Schnapps ~3.333 t/min per 1000 Farmers
      tonsPer1000PerMinute: 3.333,
    },
  ],
  'Investors': [
    {
      good: "Factory",
      building: "Bicycle Factory",
      // Penny Farthings ~1.0 t/min per 1000 Investors
      tonsPer1000PerMinute: 1.000,
      tonsPer1000PerMinuteElectric: 1.000,
    },
    {
      good: "Factory",
      building: "Cigar Factory",
      // Cigars ~0.444 t/min per 1000 Investors
      tonsPer1000PerMinute: 0.444,
    },
    {
      good: "Clockmakers",
      building: "Clockmakers",
      // Pocket Watches ~0.314 t/min per 1000 Investors
      tonsPer1000PerMinute: 0.314,
      tonsPer1000PerMinuteElectric: 0.314,
    },
    {
      good: "Roaster",
      building: "Coffee Roaster",
      // Coffee ~1.882 t/min per 1000 Investors
      tonsPer1000PerMinute: 1.882,
    },
    {
      good: "Jewellers",
      building: "Jewellers",
      // Jewelry ~0.421 t/min per 1000 Investors
      tonsPer1000PerMinute: 0.421,
      tonsPer1000PerMinuteElectric: 0.421,
    },
  ],
  'Jornaleros': [
    {
      good: "Darner",
      building: "Poncho Darner",
      // Ponchos ~2.5 t/min per 1000 Jornaleros
      tonsPer1000PerMinute: 2.500,
    },
    {
      good: "Distillery",
      building: "Rum Distillery",
      // Rum ~1.429 t/min per 1000 Jornaleros
      tonsPer1000PerMinute: 1.429,
    },
    {
      good: "Plantain",
      building: "Fried Plantain",
      // Fried Plantains ~2.857 t/min per 1000 Jornaleros
      tonsPer1000PerMinute: 2.857,
    },
  ],
  'Obreros': [
    {
      good: "Factory",
      building: "Cigar Factory",
      // Cigars ~0.4 t/min per 1000 Obreros
      tonsPer1000PerMinute: 0.400,
    },
    {
      good: "Roaster",
      building: "Coffee Roaster",
      // Coffee ~0.588 t/min per 1000 Obreros
      tonsPer1000PerMinute: 0.588,
    },
    {
      good: "Darner",
      building: "Poncho Darner",
      // Ponchos ~2.5 t/min per 1000 Obreros
      tonsPer1000PerMinute: 2.500,
    },
    {
      good: "Maker",
      building: "Tortilla Maker",
      // Tortillas ~1.429 t/min per 1000 Obreros
      tonsPer1000PerMinute: 1.429,
    },
    {
      good: "Plantain",
      building: "Fried Plantain",
      // Fried Plantains ~2.857 t/min per 1000 Obreros
      tonsPer1000PerMinute: 2.857,
    },
    {
      good: "Mkr.",
      building: "Bowler Hat Mkr.",
      // Bowler Hats ~1.333 t/min per 1000 Obreros
      tonsPer1000PerMinute: 1.333,
    },
  ],
  'Workers': [
    {
      good: "Bakery",
      building: "Bakery",
      // Bread demand ~0.909 t/min per 1000 Workers
      tonsPer1000PerMinute: 0.909,
      tonsPer1000PerMinuteElectric: 0.909,
    },
    {
      good: "Brewery",
      building: "Brewery",
      // Beer demand ~0.769 t/min per 1000 Workers
      tonsPer1000PerMinute: 0.769,
      tonsPer1000PerMinuteElectric: 0.769,
    },
    {
      good: "Fishery",
      building: "Fishery",
      // Corrected to match in-game rate: ~1 Fishery per 500 Farmers/Workers
      // (2 t/min output → 4 t/1000/min consumption)
      tonsPer1000PerMinute: 4.000,
    },
    {
      good: "Slaughterhouse",
      building: "Slaughterhouse",
      // Sausages ~1.0 t/min per 1000 Workers
      tonsPer1000PerMinute: 1.000,
      tonsPer1000PerMinuteElectric: 1.000,
    },
    {
      good: "Factory",
      building: "Soap Factory",
      // Soap ~0.417 t/min per 1000 Workers
      tonsPer1000PerMinute: 0.417,
      tonsPer1000PerMinuteElectric: 0.417,
    },
    {
      good: "Knit.",
      building: "Framework Knit.",
      // Work Clothes ~3.077 t/min per 1000 Workers
      tonsPer1000PerMinute: 3.077,
      tonsPer1000PerMinuteElectric: 3.077,
    },
    {
      good: "Distill.",
      building: "Schnapps Distill.",
      // Schnapps ~3.333 t/min per 1000 Workers
      tonsPer1000PerMinute: 3.333,
      tonsPer1000PerMinuteElectric: 3.333,
    },
  ],
};

/**
 * Calculate required production buildings for a population
 */
export function calculateRequiredBuildings(
  population: Record<string, number>,
  hasElectricity = false
): Record<string, number> {
  const required: Record<string, number> = {};
  
  Object.entries(population).forEach(([tier, count]) => {
    const rates = TIER_CONSUMPTION[tier];
    if (!rates) return;
    
    rates.forEach(rate => {
      const consumption = hasElectricity && rate.tonsPer1000PerMinuteElectric
        ? rate.tonsPer1000PerMinuteElectric
        : rate.tonsPer1000PerMinute;
      
      const totalConsumption = (count / 1000) * consumption;
      const buildingKey = rate.building;
      
      required[buildingKey] = (required[buildingKey] || 0) + totalConsumption;
    });
  });
  
  return required;
}

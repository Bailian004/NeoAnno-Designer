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
      tonsPer1000PerMinute: 36.364,
      tonsPer1000PerMinuteElectric: 18.182,
    },
    {
      good: "Brewery",
      building: "Brewery",
      tonsPer1000PerMinute: 30.769,
      tonsPer1000PerMinuteElectric: 15.385,
    },
    {
      good: "Cannery",
      building: "Cannery",
      tonsPer1000PerMinute: 10.256,
      tonsPer1000PerMinuteElectric: 5.128,
    },
    {
      good: "Dealer",
      building: "Fur Dealer",
      tonsPer1000PerMinute: 26.667,
      tonsPer1000PerMinuteElectric: 13.333,
    },
    {
      good: "Distillery",
      building: "Rum Distillery",
      tonsPer1000PerMinute: 57.143,
    },
    {
      good: "Slaughterhouse",
      building: "Slaughterhouse",
      tonsPer1000PerMinute: 40.000,
      tonsPer1000PerMinuteElectric: 20.000,
    },
    {
      good: "Factory",
      building: "Soap Factory",
      tonsPer1000PerMinute: 16.667,
      tonsPer1000PerMinuteElectric: 8.333,
    },
  ],
  'Engineers': [
    {
      good: "Factory",
      building: "Bicycle Factory",
      tonsPer1000PerMinute: 8.333,
      tonsPer1000PerMinuteElectric: 4.167,
    },
    {
      good: "Cannery",
      building: "Cannery",
      tonsPer1000PerMinute: 20.513,
      tonsPer1000PerMinuteElectric: 10.256,
    },
    {
      good: "Clockmakers",
      building: "Clockmakers",
      tonsPer1000PerMinute: 7.843,
      tonsPer1000PerMinuteElectric: 3.922,
    },
    {
      good: "Roaster",
      building: "Coffee Roaster",
      tonsPer1000PerMinute: 23.529,
    },
    {
      good: "Dealer",
      building: "Fur Dealer",
      tonsPer1000PerMinute: 53.333,
      tonsPer1000PerMinuteElectric: 26.667,
    },
    {
      good: "Distillery",
      building: "Rum Distillery",
      tonsPer1000PerMinute: 114.286,
    },
  ],
  'Farmers': [
    {
      good: "Fishery",
      building: "Fishery",
      tonsPer1000PerMinute: 25.000,
    },
  ],
  'Investors': [
    {
      good: "Factory",
      building: "Bicycle Factory",
      tonsPer1000PerMinute: 16.667,
      tonsPer1000PerMinuteElectric: 8.333,
    },
    {
      good: "Factory",
      building: "Cigar Factory",
      tonsPer1000PerMinute: 11.111,
    },
    {
      good: "Clockmakers",
      building: "Clockmakers",
      tonsPer1000PerMinute: 15.686,
      tonsPer1000PerMinuteElectric: 7.843,
    },
    {
      good: "Roaster",
      building: "Coffee Roaster",
      tonsPer1000PerMinute: 47.059,
    },
    {
      good: "Jewellers",
      building: "Jewellers",
      tonsPer1000PerMinute: 10.526,
      tonsPer1000PerMinuteElectric: 5.263,
    },
  ],
  'Jornaleros': [
    {
      good: "Darner",
      building: "Poncho Darner",
      tonsPer1000PerMinute: 25.000,
    },
    {
      good: "Distillery",
      building: "Rum Distillery",
      tonsPer1000PerMinute: 14.286,
    },
  ],
  'Obreros': [
    {
      good: "Brewery",
      building: "Brewery",
      tonsPer1000PerMinute: 26.667,
      tonsPer1000PerMinuteElectric: 13.333,
    },
    {
      good: "Factory",
      building: "Cigar Factory",
      tonsPer1000PerMinute: 5.556,
    },
    {
      good: "Roaster",
      building: "Coffee Roaster",
      tonsPer1000PerMinute: 5.882,
    },
    {
      good: "Darner",
      building: "Poncho Darner",
      tonsPer1000PerMinute: 50.000,
    },
    {
      good: "Distillery",
      building: "Rum Distillery",
      tonsPer1000PerMinute: 28.571,
    },
    {
      good: "Maker",
      building: "Tortilla Maker",
      tonsPer1000PerMinute: 14.286,
    },
  ],
  'Workers': [
    {
      good: "Bakery",
      building: "Bakery",
      tonsPer1000PerMinute: 18.182,
      tonsPer1000PerMinuteElectric: 9.091,
    },
    {
      good: "Brewery",
      building: "Brewery",
      tonsPer1000PerMinute: 15.385,
      tonsPer1000PerMinuteElectric: 7.692,
    },
    {
      good: "Fishery",
      building: "Fishery",
      tonsPer1000PerMinute: 50.000,
    },
    {
      good: "Slaughterhouse",
      building: "Slaughterhouse",
      tonsPer1000PerMinute: 20.000,
      tonsPer1000PerMinuteElectric: 10.000,
    },
    {
      good: "Factory",
      building: "Soap Factory",
      tonsPer1000PerMinute: 8.333,
      tonsPer1000PerMinuteElectric: 4.167,
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

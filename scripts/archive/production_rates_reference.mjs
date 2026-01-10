// Manual extraction of critical Arctic/Enbesa production rates from params.js
// Based on direct file inspection

export const PRODUCTION_RATES_FROM_PARAMS = {
  // ARCTIC (from params.js lines ~6000-7000)
  "Pemmican Factory": 1,           // line 6097 (Pemmican Cookhouse in English)
  "Sleeping Bag Factory": 1,        // Need to find
  "Oil Lamp Factory": 0.5,          // Need to verify
  "Parka Factory": 0.5,             // Need to find
  "Husky Sled Factory": 0.5,        // Need to find
  "Canning Factory": 1,             // (Canned Food)
  
  // ENBESA (from params.js lines ~7000-9000)
  "Goat Milk Factory": 1,           // Need to find
  "Dried Meat Factory": 1,          // Need to find
  "Finery Factory": 1,              // Need to find
  "Ceramics Factory": 1,            // Need to find
  "Lantern Factory": 0.5,           // Need to find
  "Tapestries Workshop": 0.5,       // Need to find
  
  // Known correct ones from earlier test
  "Coffee Roaster": 2,
  "Sawmill": 4,
  "Fishery": 2,
  "Schnapps Distillery": 2,
  "Framework Knitters": 2,
  "Slaughterhouse": 1,
  "Bakery": 1,
  "Brewery": 1,
  "Sailmakers": 2,
  "Soap Factory": 2,
  "Fur Dealer": 2,
  "Sewing Machine Factory": 2,
  "Fried Plantain Kitchen": 2,
  "Rum Distillery": 2,
  "Poncho Darner": 2,
  "Felt Producer": 2
};

// This file will be updated as we extract more rates from params.js

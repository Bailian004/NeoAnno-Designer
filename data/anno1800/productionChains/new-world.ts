import { ProductionChain } from '../types';

export const productionChainsNewWorld: any = [
  {
    "productId": "Timber",
    "productName": "Timber",
    "region": "New World",
    "buildingId": "Sawmill",
    "outputPerMinute": 4,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Lumberjack Hut",
        "count": 1
      }
    ]
  },
  {
    "productId": "Fried Plantains",
    "productName": "Fried Plantains",
    "region": "New World",
    "buildingId": "Fried Plantain Kitchen",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Fish Oil Factory",
        "count": 1
      },
      {
        "buildingId": "Plantain Plantation",
        "count": 1
      }
    ]
  },
  {
    "productId": "Sails",
    "productName": "Sails",
    "region": "New World",
    "buildingId": "Sailmakers",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Cotton Mill",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Cotton Plantation",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Rum",
    "productName": "Rum",
    "region": "New World",
    "buildingId": "Rum Distillery",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Lumberjack Hut",
        "count": 1
      },
      {
        "buildingId": "Sugar Cane Plantation",
        "count": 1
      }
    ]
  },
  {
    "productId": "Ponchos",
    "productName": "Ponchos",
    "region": "New World",
    "buildingId": "Poncho Darner",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Alpaca Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Bricks",
    "productName": "Bricks",
    "region": "New World",
    "buildingId": "Brick Factory",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Clay Pit",
        "count": 1
      }
    ]
  },
  {
    "productId": "Tortillas",
    "productName": "Tortillas",
    "region": "New World",
    "buildingId": "Tortilla Maker",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Cattle Farm",
        "count": 1
      },
      {
        "buildingId": "Corn Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Coffee",
    "productName": "Coffee",
    "region": "New World",
    "buildingId": "Coffee Roaster",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Coffee Plantation",
        "count": 1
      }
    ]
  },
  {
    "productId": "Bowler Hats",
    "productName": "Bowler Hats",
    "region": "New World",
    "buildingId": "Bombin Weaver",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Cotton Mill",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Cotton Plantation",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Felt Producer",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Alpaca Farm",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Cigars",
    "productName": "Cigars",
    "region": "New World",
    "buildingId": "Cigar Factory",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Tobacco Plantation",
        "count": 1
      },
      {
        "buildingId": "Marquetry Workshop",
        "count": 1,
        "alternatives": [
          "Marquetry Workshop"
        ],
        "inputs": [
          {
            "buildingId": "Lumberjack Hut",
            "count": 1,
            "alternatives": [
              "NewWorld"
            ]
          }
        ]
      }
    ]
  },
  {
    "productId": "Chocolate",
    "productName": "Chocolate",
    "region": "New World",
    "buildingId": "Chocolate Factory",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Sugar Refinery",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Sugar Cane Plantation",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Cocoa Plantation",
        "count": 1
      }
    ]
  }
];

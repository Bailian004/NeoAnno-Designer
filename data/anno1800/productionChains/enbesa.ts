import { ProductionChain } from '../types';

export const productionChainsEnbesa: any = [
  {
    "productId": "Goat Milk",
    "productName": "Goat Milk",
    "region": "Enbesa",
    "buildingId": "Goat Farm",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": []
  },
  {
    "productId": "Finery",
    "productName": "Finery",
    "region": "Enbesa",
    "buildingId": "Embroiderer",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Linen Mill",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Linseed Farm",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Dried Meat",
    "productName": "Dried Meat",
    "region": "Enbesa",
    "buildingId": "Dry-House",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Salt Works",
        "count": 1
      },
      {
        "buildingId": "Sanga Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Hibiscus Tea",
    "productName": "Hibiscus Tea",
    "region": "Enbesa",
    "buildingId": "Tea Spicer",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Hibiscus Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Mud Bricks",
    "productName": "Mud Bricks",
    "region": "Enbesa",
    "buildingId": "Brick Dry-House",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Clay Harvester",
        "count": 1
      },
      {
        "buildingId": "Teff Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Ceramics",
    "productName": "Ceramics",
    "region": "Enbesa",
    "buildingId": "Ceramics Workshop",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Clay Harvester",
        "count": 1
      },
      {
        "buildingId": "Indigo Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Tapestries",
    "productName": "Tapestries",
    "region": "Enbesa",
    "buildingId": "Tapestry Looms",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Linen Mill",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Linseed Farm",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Indigo Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Seafood Stew",
    "productName": "Seafood Stew",
    "region": "Enbesa",
    "buildingId": "Wat Kitchen",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Teff Mill",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Teff Farm",
            "count": 1
          },
          {
            "buildingId": "Spice Farm",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Lobster Fishery",
        "count": 1
      }
    ]
  },
  {
    "productId": "Clay Pipes",
    "productName": "Clay Pipes",
    "region": "Enbesa",
    "buildingId": "Pipe Maker",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Clay Harvester",
        "count": 1
      },
      {
        "buildingId": "Tobacco Plantation",
        "count": 1
      }
    ]
  },
  {
    "productId": "Illuminated Scripts",
    "productName": "Illuminated Scripts",
    "region": "Enbesa",
    "buildingId": "Luminer",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Paper Mill",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Lumberjack Hut",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Indigo Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Lanterns",
    "productName": "Lanterns",
    "region": "Enbesa",
    "buildingId": "Lanternsmith",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Glassmakers",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Sand Mine",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Chandler",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Apiary",
            "count": 1
          },
          {
            "buildingId": "Cotton Plantation",
            "count": 1
          }
        ]
      }
    ]
  }
];

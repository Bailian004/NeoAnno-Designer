import { ProductionChain } from '../types';

export const productionChainsArctic: any = [
  {
    "productId": "Timber",
    "productName": "Timber",
    "region": "Arctic",
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
    "productId": "Pemmican",
    "productName": "Pemmican",
    "region": "Arctic",
    "buildingId": "Pemmican Cookhouse",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Whaling Station",
        "count": 1
      },
      {
        "buildingId": "Caribou Hunting Cabin",
        "count": 1
      }
    ]
  },
  {
    "productId": "Sleeping Bags",
    "productName": "Sleeping Bags",
    "region": "Arctic",
    "buildingId": "Sleeping Bag Factory",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Seal Hunting Docks",
        "count": 1
      },
      {
        "buildingId": "Goose Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Oil Lamps",
    "productName": "Oil Lamps",
    "region": "Arctic",
    "buildingId": "Oil Lamps Factory",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Brass Smeltery",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Copper Mine",
            "count": 1
          },
          {
            "buildingId": "Zinc Mine",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Whaling Station",
        "count": 1
      }
    ]
  },
  {
    "productId": "Parkas",
    "productName": "Parkas",
    "region": "Arctic",
    "buildingId": "Parka Factory",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Seal Hunting Docks",
        "count": 1
      },
      {
        "buildingId": "Bear Hunting Cabin",
        "count": 1
      }
    ]
  },
  {
    "productId": "Husky Sleds",
    "productName": "Husky Sleds",
    "region": "Arctic",
    "buildingId": "Husky Sled Factory",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Sled Frame Factory",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Seal Hunting Docks",
            "count": 1
          },
          {
            "buildingId": "Lumberjack Hut",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Husky Farm",
        "count": 1
      }
    ]
  }
];

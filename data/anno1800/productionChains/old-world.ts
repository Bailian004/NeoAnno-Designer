import { ProductionChain } from '../types';

export const productionChainsOldWorld: any = [
  {
    "productId": "Timber",
    "productName": "Timber",
    "region": "Old World",
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
    "productId": "Fish",
    "productName": "Fish",
    "region": "Old World",
    "buildingId": "Fishery",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": []
  },
  {
    "productId": "Schnapps",
    "productName": "Schnapps",
    "region": "Old World",
    "buildingId": "Schnapps Distillery",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Potato Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Work Clothes",
    "productName": "Work Clothes",
    "region": "Old World",
    "buildingId": "Framework Knitters",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Sheep Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Bricks",
    "productName": "Bricks",
    "region": "Old World",
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
    "productId": "Sausages",
    "productName": "Sausages",
    "region": "Old World",
    "buildingId": "Slaughterhouse",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Pig Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Sails",
    "productName": "Sails",
    "region": "Old World",
    "buildingId": "Sailmakers",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Sheep Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Bread",
    "productName": "Bread",
    "region": "Old World",
    "buildingId": "Bakery",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Flour Mill",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Grain Farm",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Soap",
    "productName": "Soap",
    "region": "Old World",
    "buildingId": "Soap Factory",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Rendering Works",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Pig Farm",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Steel Beams",
    "productName": "Steel Beams",
    "region": "Old World",
    "buildingId": "Steelworks",
    "outputPerMinute": 1.3333333333333335,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Furnace",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Iron Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Weapons",
    "productName": "Weapons",
    "region": "Old World",
    "buildingId": "Weapon Factory",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Furnace",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Iron Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Beer",
    "productName": "Beer",
    "region": "Old World",
    "buildingId": "Brewery",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Hop Farm",
        "count": 1
      },
      {
        "buildingId": "Malthouse",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Grain Farm",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Windows",
    "productName": "Windows",
    "region": "Old World",
    "buildingId": "Window Makers",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Lumberjack Hut",
        "count": 1
      },
      {
        "buildingId": "Glassmakers",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Sand Mine",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Canned Food",
    "productName": "Canned Food",
    "region": "Old World",
    "buildingId": "Cannery",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Iron Mine",
        "count": 1
      },
      {
        "buildingId": "Artisanal Kitchen",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Cattle Farm",
            "count": 1
          },
          {
            "buildingId": "Red Pepper Farm",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Sewing Machines",
    "productName": "Sewing Machines",
    "region": "Old World",
    "buildingId": "Sewing Machine Factory",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Lumberjack Hut",
        "count": 1
      },
      {
        "buildingId": "Furnace",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Iron Mine",
            "count": 1
          },
          {
            "buildingId": "Coal Mine",
            "count": 1,
            "alternatives": [
              "Charcoal Kiln"
            ]
          }
        ]
      }
    ]
  },
  {
    "productId": "Fur Coats",
    "productName": "Fur Coats",
    "region": "Old World",
    "buildingId": "Fur Dealer",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Hunting Cabin",
        "count": 1
      },
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
    "productId": "Reinforced Concrete",
    "productName": "Reinforced Concrete",
    "region": "Old World",
    "buildingId": "Concrete Factory",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Furnace",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Iron Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1,
            "alternatives": [
              "Coal Mine"
            ]
          }
        ]
      },
      {
        "buildingId": "Limestone Quarry",
        "count": 1
      }
    ]
  },
  {
    "productId": "Glasses",
    "productName": "Glasses",
    "region": "Old World",
    "buildingId": "Spectacle Factory",
    "outputPerMinute": 0.6666666666666667,
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
        "buildingId": "Brass Smeltery",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Zinc Mine",
            "count": 1
          },
          {
            "buildingId": "Copper Mine",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Advanced Weapons",
    "productName": "Advanced Weapons",
    "region": "Old World",
    "buildingId": "Heavy Weapons Factory",
    "outputPerMinute": 0.5,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Dynamite Factory",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Rendering Works",
            "count": 1,
            "inputs": [
              {
                "buildingId": "Pig Farm",
                "count": 1
              }
            ]
          },
          {
            "buildingId": "Saltpeter Works",
            "count": 1
          }
        ]
      },
      {
        "buildingId": "Furnace",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Iron Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1,
            "alternatives": [
              "Coal Mine"
            ]
          }
        ]
      }
    ]
  },
  {
    "productId": "Penny Farthings",
    "productName": "Penny Farthings",
    "region": "Old World",
    "buildingId": "Bicycle Factory",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Furnace",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Iron Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1,
            "alternatives": [
              "Coal Mine"
            ]
          }
        ]
      },
      {
        "buildingId": "Caoutchouc Plantation",
        "count": 1
      }
    ]
  },
  {
    "productId": "Steam Motors",
    "productName": "Steam Motors",
    "region": "Old World",
    "buildingId": "Motor Assembly Line",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Furnace",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Iron Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1,
            "alternatives": [
              "Coal Mine"
            ]
          }
        ]
      },
      {
        "buildingId": "Brass Smeltery",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Zinc Mine",
            "count": 1
          },
          {
            "buildingId": "Copper Mine",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Pocket Watches",
    "productName": "Pocket Watches",
    "region": "Old World",
    "buildingId": "Clockmakers",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Goldsmiths",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Gold Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1,
            "alternatives": [
              "Coal Mine"
            ]
          }
        ]
      },
      {
        "buildingId": "Glassmakers",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Sand Mine",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Light Bulbs",
    "productName": "Light Bulbs",
    "region": "Old World",
    "buildingId": "Light Bulb Factory",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Filament Factory",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Charcoal Kiln",
            "count": 1,
            "alternatives": [
              "Coal Mine"
            ]
          }
        ]
      },
      {
        "buildingId": "Glassmakers",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Sand Mine",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Champagne",
    "productName": "Champagne",
    "region": "Old World",
    "buildingId": "Champagne Cellar",
    "outputPerMinute": 2,
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
        "buildingId": "Vineyard",
        "count": 1
      }
    ]
  },
  {
    "productId": "Jewellery",
    "productName": "Jewellery",
    "region": "Old World",
    "buildingId": "Jewellers",
    "outputPerMinute": 2,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Goldsmiths",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Gold Mine",
            "count": 1
          },
          {
            "buildingId": "Charcoal Kiln",
            "count": 1,
            "alternatives": [
              "Coal Mine"
            ]
          }
        ]
      },
      {
        "buildingId": "Pearl Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Gramophones",
    "productName": "Gramophones",
    "region": "Old World",
    "buildingId": "Gramophone Factory",
    "outputPerMinute": 0.5,
    "electricityBoost": false,
    "chain": [
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
      },
      {
        "buildingId": "Brass Smeltery",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Zinc Mine",
            "count": 1
          },
          {
            "buildingId": "Copper Mine",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Steam Carriages",
    "productName": "Steam Carriages",
    "region": "Old World",
    "buildingId": "Cab Assembly Line",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Motor Assembly Line",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Furnace",
            "count": 1,
            "inputs": [
              {
                "buildingId": "Iron Mine",
                "count": 1
              },
              {
                "buildingId": "Charcoal Kiln",
                "count": 1
              }
            ]
          },
          {
            "buildingId": "Brass Smeltery",
            "count": 1,
            "inputs": [
              {
                "buildingId": "Zinc Mine",
                "count": 1
              },
              {
                "buildingId": "Copper Mine",
                "count": 1
              }
            ]
          }
        ]
      },
      {
        "buildingId": "Coachmakers",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Lumberjack Hut",
            "count": 1
          },
          {
            "buildingId": "Caoutchouc Plantation",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Leather Boots",
    "productName": "Leather Boots",
    "region": "Old World",
    "buildingId": "Bootmakers",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Sanga Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Tailored Suits",
    "productName": "Tailored Suits",
    "region": "Old World",
    "buildingId": "Tailors Shop",
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
    "productId": "Telephones",
    "productName": "Telephones",
    "region": "Old World",
    "buildingId": "Telephone Manufacturer",
    "outputPerMinute": 0.6666666666666667,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Filament Factory",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Coal Mine",
            "count": 1,
            "alternatives": [
              "Charcoal Kiln"
            ]
          }
        ]
      },
      {
        "buildingId": "Marquetry Workshop",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Lumberjack Hut",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Advanced Coffee",
    "productName": "Advanced Coffee",
    "region": "Old World",
    "buildingId": "Advanced Coffee Roaster",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Malthouse",
        "count": 1,
        "inputs": [
          {
            "buildingId": "Grain Farm",
            "count": 1
          }
        ]
      }
    ]
  },
  {
    "productId": "Advanced Rum",
    "productName": "Advanced Rum",
    "region": "Old World",
    "buildingId": "Advanced Rum Distillery",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Coal Mine",
        "count": 1
      },
      {
        "buildingId": "Potato Farm",
        "count": 1
      }
    ]
  },
  {
    "productId": "Advanced Cotton Fabric",
    "productName": "Advanced Cotton Fabric",
    "region": "Old World",
    "buildingId": "Advanced Cotton Mill",
    "outputPerMinute": 1,
    "electricityBoost": false,
    "chain": [
      {
        "buildingId": "Sheep Farm",
        "count": 1
      },
      {
        "buildingId": "Lumberjack Hut",
        "count": 1
      }
    ]
  }
];

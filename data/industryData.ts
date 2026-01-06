// --- TYPES ---
export interface ConsumptionRate {
    goodId: string;
    amountPer1000: number; // Tons per minute consumed by 1000 residents
}

export interface ChainLink {
    buildingId: string;
    count: number; // Ratio needed per 1 parent
    inputs?: ChainLink[];
}

export interface ProductionDefinition {
    id: string; // Good ID
    name: string;
    buildingId: string; // Factory ID
    outputPerMinute: number;
    region: 'Old World' | 'New World';
    tier: 'Basic' | 'Mid' | 'High';
    chain: ChainLink[];
}

// --- CONSUMPTION RATES (Per 1000 Residents) ---
export const CONSUMPTION_RATES: Record<string, ConsumptionRate[]> = {
    // OLD WORLD
    'Farmer': [
        { goodId: 'Fish', amountPer1000: 1.0 },
        { goodId: 'Work Clothes', amountPer1000: 1.1 },
        { goodId: 'Schnapps', amountPer1000: 1.2 }
    ],
    'Worker': [
        { goodId: 'Fish', amountPer1000: 1.0 },
        { goodId: 'Work Clothes', amountPer1000: 1.1 },
        { goodId: 'Sausages', amountPer1000: 1.0 },
        { goodId: 'Bread', amountPer1000: 0.9 },
        { goodId: 'Soap', amountPer1000: 0.4 },
        { goodId: 'Schnapps', amountPer1000: 1.2 },
        { goodId: 'Beer', amountPer1000: 1.3 }
    ],
    'Artisan': [
        { goodId: 'Sausages', amountPer1000: 1.0 },
        { goodId: 'Bread', amountPer1000: 0.9 },
        { goodId: 'Soap', amountPer1000: 0.4 },
        { goodId: 'Canned Food', amountPer1000: 0.58 },
        { goodId: 'Sewing Machines', amountPer1000: 0.47 },
        { goodId: 'Fur Coats', amountPer1000: 0.47 },
        { goodId: 'Rum', amountPer1000: 1.1 }
    ],
    'Engineer': [
        { goodId: 'Canned Food', amountPer1000: 0.58 },
        { goodId: 'Sewing Machines', amountPer1000: 0.47 },
        { goodId: 'Fur Coats', amountPer1000: 0.47 },
        { goodId: 'Glasses', amountPer1000: 0.23 },
        { goodId: 'Coffee', amountPer1000: 1.7 },
        { goodId: 'Light Bulbs', amountPer1000: 0.35 },
        { goodId: 'Penny Farthings', amountPer1000: 0.23 },
        { goodId: 'Pocket Watches', amountPer1000: 0.23 }
    ],
    // NEW WORLD
    'Jornalero': [
        { goodId: 'Fried Plantains', amountPer1000: 1.0 },
        { goodId: 'Ponchos', amountPer1000: 1.0 },
        { goodId: 'Rum', amountPer1000: 1.2 }
    ],
    'Obrero': [
        { goodId: 'Fried Plantains', amountPer1000: 1.0 },
        { goodId: 'Ponchos', amountPer1000: 1.0 },
        { goodId: 'Tortillas', amountPer1000: 0.7 },
        { goodId: 'Coffee', amountPer1000: 1.0 },
        { goodId: 'Bowler Hats', amountPer1000: 0.4 },
        { goodId: 'Cigars', amountPer1000: 0.4 }
    ]
};

// --- PRODUCTION CHAINS ---
export const PRODUCTION_CHAINS: Record<string, ProductionDefinition> = {
    // --- FARMER / BASIC ---
    'Timber': {
        id: 'Timber', name: 'Timber', buildingId: 'Sawmill', outputPerMinute: 4, region: 'Old World', tier: 'Basic',
        chain: [{ buildingId: 'Lumberjack Hut', count: 1 }]
    },
    'Fish': {
        id: 'Fish', name: 'Fish', buildingId: 'Fishery', outputPerMinute: 2, region: 'Old World', tier: 'Basic',
        chain: []
    },
    'Schnapps': {
        id: 'Schnapps', name: 'Schnapps', buildingId: 'Schnapps Distillery', outputPerMinute: 2, region: 'Old World', tier: 'Basic',
        chain: [{ buildingId: 'Potato Farm', count: 1 }]
    },
    'Work Clothes': {
        id: 'Work Clothes', name: 'Work Clothes', buildingId: 'Framework Knitters', outputPerMinute: 2, region: 'Old World', tier: 'Basic',
        chain: [{ buildingId: 'Sheep Farm', count: 1 }]
    },

    // --- WORKER ---
    'Bricks': {
        id: 'Bricks', name: 'Bricks', buildingId: 'Brick Factory', outputPerMinute: 2, region: 'Old World', tier: 'Basic',
        chain: [{ buildingId: 'Clay Pit', count: 0.5 }]
    },
    'Sausages': {
        id: 'Sausages', name: 'Sausages', buildingId: 'Slaughterhouse', outputPerMinute: 1, region: 'Old World', tier: 'Mid',
        chain: [{ buildingId: 'Pig Farm', count: 1 }]
    },
    'Soap': {
        id: 'Soap', name: 'Soap', buildingId: 'Soap Factory', outputPerMinute: 1, region: 'Old World', tier: 'Mid',
        chain: [{ buildingId: 'Rendering Works', count: 2, inputs: [{ buildingId: 'Pig Farm', count: 1 }] }]
    },
    'Bread': {
        id: 'Bread', name: 'Bread', buildingId: 'Bakery', outputPerMinute: 1, region: 'Old World', tier: 'Mid',
        chain: [{ buildingId: 'Flour Mill', count: 0.5, inputs: [{ buildingId: 'Grain Farm', count: 2 }] }]
    },
    'Beer': {
        id: 'Beer', name: 'Beer', buildingId: 'Brewery', outputPerMinute: 1, region: 'Old World', tier: 'Mid',
        chain: [
            { buildingId: 'Hop Farm', count: 1.5 },
            { buildingId: 'Malthouse', count: 0.5, inputs: [{ buildingId: 'Grain Farm', count: 2 }] }
        ]
    },
    'Sails': {
        id: 'Sails', name: 'Sails', buildingId: 'Sailmakers', outputPerMinute: 2, region: 'Old World', tier: 'Mid',
        chain: [{ buildingId: 'Sheep Farm', count: 1 }]
    },
    'Steel Beams': {
        id: 'Steel Beams', name: 'Steel Beams', buildingId: 'Steelworks', outputPerMinute: 1.5, region: 'Old World', tier: 'Mid',
        chain: [{ buildingId: 'Furnace', count: 0.5, inputs: [{ buildingId: 'Iron Mine', count: 1 }, { buildingId: 'Charcoal Kiln', count: 2 }] }]
    },
    'Weapons': {
        id: 'Weapons', name: 'Weapons', buildingId: 'Weapon Factory', outputPerMinute: 1.5, region: 'Old World', tier: 'Mid',
        chain: [{ buildingId: 'Furnace', count: 0.5, inputs: [{ buildingId: 'Iron Mine', count: 1 }, { buildingId: 'Charcoal Kiln', count: 2 }] }]
    },

    // --- ARTISAN ---
    'Windows': {
        id: 'Windows', name: 'Windows', buildingId: 'Window Makers', outputPerMinute: 2, region: 'Old World', tier: 'Mid',
        chain: [{ buildingId: 'Glassmakers', count: 1, inputs: [{ buildingId: 'Sand Mine', count: 1 }] }]
    },
    'Canned Food': {
        id: 'Canned Food', name: 'Canned Food', buildingId: 'Cannery', outputPerMinute: 1.33, region: 'Old World', tier: 'Mid',
        chain: [
            { buildingId: 'Artisanal Kitchen', count: 1, inputs: [{ buildingId: 'Cattle Farm', count: 2 }, { buildingId: 'Red Pepper Farm', count: 2 }] },
            { buildingId: 'Iron Mine', count: 0.5 }
        ]
    },
    'Sewing Machines': {
        id: 'Sewing Machines', name: 'Sewing Machines', buildingId: 'Sewing Machine Factory', outputPerMinute: 2, region: 'Old World', tier: 'Mid',
        chain: [
            { buildingId: 'Lumberjack Hut', count: 0.5 },
            { buildingId: 'Furnace', count: 0.5, inputs: [{ buildingId: 'Iron Mine', count: 1 }, { buildingId: 'Charcoal Kiln', count: 2 }] }
        ]
    },
    'Fur Coats': {
        id: 'Fur Coats', name: 'Fur Coats', buildingId: 'Fur Dealer', outputPerMinute: 2, region: 'Old World', tier: 'Mid',
        chain: [
            { buildingId: 'Hunting Cabin', count: 1 },
            { buildingId: 'Cotton Mill', count: 0.5 } // Requires New World Cotton
        ]
    },

    // --- ENGINEER ---
    'Cement': {
        id: 'Cement', name: 'Reinforced Concrete', buildingId: 'Concrete Factory', outputPerMinute: 1, region: 'Old World', tier: 'High',
        chain: [
            { buildingId: 'Cement Mine', count: 1 },
            { buildingId: 'Steelworks', count: 0.5 }
        ]
    },
    'Penny Farthings': {
        id: 'Penny Farthings', name: 'Penny Farthings', buildingId: 'Bicycle Factory', outputPerMinute: 1, region: 'Old World', tier: 'High',
        chain: [
            { buildingId: 'Furnace', count: 0.5 },
            { buildingId: 'Caoutchouc Plantation', count: 1 } // New World
        ]
    },
    'Brass': {
        id: 'Brass', name: 'Brass', buildingId: 'Brass Smeltery', outputPerMinute: 1.5, region: 'Old World', tier: 'High',
        chain: [
            { buildingId: 'Copper Mine', count: 1 },
            { buildingId: 'Zinc Mine', count: 1 }
        ]
    },
    'Glasses': {
        id: 'Glasses', name: 'Glasses', buildingId: 'Spectacle Factory', outputPerMinute: 1.5, region: 'Old World', tier: 'High',
        chain: [
            { buildingId: 'Brass Smeltery', count: 0.5 },
            { buildingId: 'Glassmakers', count: 0.5 }
        ]
    },

    // --- NEW WORLD (BASIC) ---
    'Fried Plantains': {
        id: 'Fried Plantains', name: 'Fried Plantains', buildingId: 'Fried Plantain Kitchen', outputPerMinute: 2, region: 'New World', tier: 'Basic',
        chain: [{ buildingId: 'Plantain Plantation', count: 1 }]
    },
    'Rum': {
        id: 'Rum', name: 'Rum', buildingId: 'Rum Distillery', outputPerMinute: 2, region: 'New World', tier: 'Basic',
        chain: [{ buildingId: 'Sugar Cane Plantation', count: 1 }]
    },
    'Ponchos': {
        id: 'Ponchos', name: 'Ponchos', buildingId: 'Poncho Darner', outputPerMinute: 2, region: 'New World', tier: 'Basic',
        chain: [{ buildingId: 'Alpaca Farm', count: 1 }]
    },

    // --- NEW WORLD (ADVANCED) ---
    'Tortillas': {
        id: 'Tortillas', name: 'Tortillas', buildingId: 'Tortilla Maker', outputPerMinute: 1.5, region: 'New World', tier: 'Mid',
        chain: [
            { buildingId: 'Corn Farm', count: 1 },
            { buildingId: 'Cattle Farm', count: 1 }
        ]
    },
    'Coffee': {
        id: 'Coffee', name: 'Coffee', buildingId: 'Coffee Roaster', outputPerMinute: 2, region: 'New World', tier: 'Mid',
        chain: [{ buildingId: 'Coffee Plantation', count: 2 }]
    },
    'Bowler Hats': {
        id: 'Bowler Hats', name: 'Bowler Hats', buildingId: 'Felt Producer', outputPerMinute: 2, region: 'New World', tier: 'Mid',
        chain: [
            { buildingId: 'Alpaca Farm', count: 1 },
            { buildingId: 'Cotton Mill', count: 1 }
        ]
    }
};
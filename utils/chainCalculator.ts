import { CONSUMPTION_RATES, PRODUCTION_CHAINS, ChainLink, ProductionDefinition } from "../data/industryData";

export interface IndustryRequest {
    population: Record<string, number>; 
    selectedGoods: string[]; 
}

/**
 * Get region for a population tier
 */
function getTierRegion(tier: string): 'Old World' | 'New World' | undefined {
    if (['Farmer', 'Worker', 'Artisan', 'Engineer', 'Investor', 'Scholar'].includes(tier)) {
        return 'Old World';
    }
    if (['Jornalero', 'Obrero'].includes(tier)) {
        return 'New World';
    }
    return undefined;
}

/**
 * Check if a good is available for the given population setup
 */
function isGoodCompatible(good: ProductionDefinition, populationRegions: Set<string>): boolean {
    // If we have both regions, allow both
    if (populationRegions.size >= 2) return true;
    
    // Otherwise check region match
    for (const region of populationRegions) {
        if (good.region === region) return true;
    }
    
    return false;
}

// --- CORE CALCULATOR ---
export const calculateIndustryNeeds = (request: IndustryRequest): Record<string, number> => {
    // 1. Demand Calculation
    const demandMap: Record<string, number> = {};

    Object.entries(request.population).forEach(([tier, count]) => {
        const rates = CONSUMPTION_RATES[tier] || [];
        rates.forEach(rate => {
            if (request.selectedGoods.includes(rate.goodId)) {
                const totalDemand = (count / 1000) * rate.amountPer1000;
                demandMap[rate.goodId] = (demandMap[rate.goodId] || 0) + totalDemand;
            }
        });
    });

    request.selectedGoods.forEach(goodId => {
        if (!demandMap[goodId] && PRODUCTION_CHAINS[goodId]) {
            demandMap[goodId] = PRODUCTION_CHAINS[goodId].outputPerMinute; 
        }
    });

    // 2. Recursive Building Counter
    const buildingCounts: Record<string, number> = {};
    const buildingAlternatives: Record<string, string[]> = {}; // Track alternatives for each building

    const addToCounts = (buildingId: string, amount: number, alternatives?: string[]) => {
        buildingCounts[buildingId] = (buildingCounts[buildingId] || 0) + amount;
        if (alternatives && alternatives.length > 0) {
            buildingAlternatives[buildingId] = alternatives;
        }
    };

    const processChain = (link: ChainLink, parentCount: number) => {
        const required = link.count * parentCount;
        addToCounts(link.buildingId, required, link.alternatives);
        if (link.inputs) {
            link.inputs.forEach(subLink => processChain(subLink, required));
        }
    };

    Object.entries(demandMap).forEach(([goodId, tonsNeeded]) => {
        const chainDef = PRODUCTION_CHAINS[goodId];
        if (!chainDef) return;

        const factoriesNeeded = tonsNeeded / chainDef.outputPerMinute;
        addToCounts(chainDef.buildingId, factoriesNeeded);

        if (chainDef.chain) {
            chainDef.chain.forEach(link => processChain(link, factoriesNeeded));
        }
    });

    // 3. Finalize
    const finalCounts: Record<string, number> = {};
    Object.entries(buildingCounts).forEach(([bId, preciseCount]) => {
        finalCounts[bId] = Math.ceil(preciseCount);
    });

    return finalCounts;
};

// --- COMPATIBILITY ENGINE ---

const getChainDependencies = (goodId: string): Set<string> => {
    const dependencies = new Set<string>();
    const def = PRODUCTION_CHAINS[goodId];
    if (!def) return dependencies;

    dependencies.add(def.buildingId); 

    const traverse = (links: ChainLink[]) => {
        links.forEach(link => {
            dependencies.add(link.buildingId);
            if (link.inputs) traverse(link.inputs);
        });
    };

    if (def.chain) traverse(def.chain);
    return dependencies;
};

export const getCompatibleGoods = (selectedGoods: string[], availableGoods: string[], populationTiers: string[] = []): string[] => {
    if (selectedGoods.length === 0) {
        // Apply region filter if we have population info
        if (populationTiers.length > 0) {
            const regions = new Set<string>();
            populationTiers.forEach(tier => {
                const region = getTierRegion(tier);
                if (region) regions.add(region);
            });
            
            return availableGoods.filter(goodId => {
                const def = PRODUCTION_CHAINS[goodId];
                return def && isGoodCompatible(def, regions);
            });
        }
        return availableGoods;
    }

    const activeBuildings = new Set<string>();
    selectedGoods.forEach(good => {
        const deps = getChainDependencies(good);
        deps.forEach(b => activeBuildings.add(b));
    });

    return availableGoods.filter(candidate => {
        if (selectedGoods.includes(candidate)) return true;
        
        // Check region compatibility
        const def = PRODUCTION_CHAINS[candidate];
        if (def && populationTiers.length > 0) {
            const regions = new Set<string>();
            populationTiers.forEach(tier => {
                const region = getTierRegion(tier);
                if (region) regions.add(region);
            });
            if (!isGoodCompatible(def, regions)) return false;
        }
        
        const candidateDeps = getChainDependencies(candidate);
        for (const b of candidateDeps) {
            if (activeBuildings.has(b)) return true;
        }
        return false;
    });
};

export const getAvailableGoods = (population: Record<string, number>): string[] => {
    const goods = new Set<string>();
    Object.keys(population).forEach(tier => {
        if (population[tier] > 0) {
            const rates = CONSUMPTION_RATES[tier] || [];
            rates.forEach(r => goods.add(r.goodId));
        }
    });
    
    // Add non-population construction goods
    goods.add('Timber');
    goods.add('Bricks');
    goods.add('Steel Beams');
    goods.add('Windows');
    goods.add('Cement');
    goods.add('Sails');
    goods.add('Weapons');
    
    return Array.from(goods);
};
import { CONSUMPTION_RATES, PRODUCTION_CHAINS, ChainLink } from "../data/industryData";

export interface IndustryRequest {
    population: Record<string, number>; 
    selectedGoods: string[]; 
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

    const addToCounts = (buildingId: string, amount: number) => {
        buildingCounts[buildingId] = (buildingCounts[buildingId] || 0) + amount;
    };

    const processChain = (link: ChainLink, parentCount: number) => {
        const required = link.count * parentCount;
        addToCounts(link.buildingId, required);
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

export const getCompatibleGoods = (selectedGoods: string[], availableGoods: string[]): string[] => {
    if (selectedGoods.length === 0) return availableGoods;

    const activeBuildings = new Set<string>();
    selectedGoods.forEach(good => {
        const deps = getChainDependencies(good);
        deps.forEach(b => activeBuildings.add(b));
    });

    return availableGoods.filter(candidate => {
        if (selectedGoods.includes(candidate)) return true;
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
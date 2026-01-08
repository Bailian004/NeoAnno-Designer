import { PRODUCTION_CHAINS_FULL } from './industryData';

export interface ProductionNode {
  buildingName: string;
  inputGoods: string[];
  outputGood: string;
  outputRate: number; // tons per minute
  workforceNeeded: Record<string, number>;
  icon?: string; // Icon filename
}

export interface DependencyGraph {
  nodes: Map<string, ProductionNode>;
  edges: Map<string, string[]>; // good -> buildings that produce it
  consumers: Map<string, string[]>; // good -> buildings that consume it
}

export interface ProductionResult {
  buildings: Record<string, number>;
  workforce: Record<string, number>;
}

// Canonical good name aliases to improve matching between
// consumption goods and generated production outputs/building names.
// Keys are requested goods (consumption or intermediates),
// values are alternative names to search for among graph keys.
const GOOD_ALIASES: Record<string, string[]> = {
  // Old World basics
  'Work Clothes': ['Knit.', 'Framework Knit.', 'Framework Knitters', 'Working Clothes'],
  'Wool': ['Sheep Farm', 'Sheepfold', 'Sheep'],
  'Fish': ['Fishery'],
  'Grain': ['Grain Farm', 'Wheat'],
  'Malt': ['Malthouse'],
  'Schnapps': ['Schnapps Distill.', 'Distillery'],
  'Timber': ['Sawmill', 'Wooden Planks'],
  // New World basics
  'Alpaca Wool': ['Alpaca Farm'],
};

/**
 * Build a complete dependency graph of all production chains
 */
export function buildDependencyGraph(): DependencyGraph {
  const nodes = new Map<string, ProductionNode>();
  const edges = new Map<string, string[]>();
  const consumers = new Map<string, string[]>();

  // Process each production definition from PRODUCTION_CHAINS_FULL
  Object.entries(PRODUCTION_CHAINS_FULL).forEach(([goodId, definition]) => {
    const buildingName = definition.buildingId;
    
    // Extract input goods from the chain
    const inputGoods: string[] = [];
    const flattenChain = (link: any) => {
      if (link.inputs) {
        link.inputs.forEach((input: any) => {
          if (input.buildingId && !inputGoods.includes(input.buildingId)) {
            inputGoods.push(input.buildingId);
          }
          flattenChain(input);
        });
      }
    };
    
    definition.chain.forEach(link => flattenChain(link));
    
    const node: ProductionNode = {
      buildingName: buildingName,
      inputGoods: inputGoods,
      outputGood: goodId, // The good ID itself
      outputRate: definition.outputPerMinute,
      workforceNeeded: {}, // Will be populated from building data
      icon: undefined
    };

    nodes.set(buildingName, node);

    // Track which buildings produce which goods
    const outputKeys = [
      goodId,
      buildingName,
    ].filter(Boolean);

    outputKeys.forEach(key => {
      if (!edges.has(key)) {
        edges.set(key, []);
      }
      if (!edges.get(key)!.includes(buildingName)) {
        edges.get(key)!.push(buildingName);
      }
    });

    // Track which buildings consume which goods
    inputGoods.forEach(input => {
      if (!consumers.has(input)) {
        consumers.set(input, []);
      }
      consumers.get(input)!.push(buildingName);
    });
  });

  return { nodes, edges, consumers };
}

/**
 * Calculate all upstream production buildings needed to produce a given good at a target rate
 */
export interface ProductionRequirement {
  buildingName: string;
  count: number;
  reason: string; // e.g., "Produces Bread" or "Supplies Grain for Bakery"
}

export function calculateUpstreamProduction(
  targetGood: string,
  targetRate: number, // tons per minute needed
  graph: DependencyGraph,
  includeElectricity: boolean = false
): ProductionRequirement[] {
  const requirements: Map<string, ProductionRequirement> = new Map();
  const visited = new Set<string>();

  function processGood(good: string, rateNeeded: number, depth: number = 0) {
    if (depth > 10) {
      console.warn(`[ProductionOptimizer] Max recursion depth reached for ${good}`);
      return;
    }

    // Find producers of this good (try exact match, aliases, then fuzzy)
    let producers = graph.edges.get(good);
    
    // Try aliases if no direct match
    if ((!producers || producers.length === 0) && GOOD_ALIASES[good]) {
      for (const alias of GOOD_ALIASES[good]) {
        const p = graph.edges.get(alias);
        if (p && p.length > 0) {
          producers = p;
          break;
        }
      }
    }
    
    // If no exact match, try fuzzy matching
    if (!producers || producers.length === 0) {
      const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      const nGood = norm(good);
      for (const [key, prods] of graph.edges.entries()) {
        const nKey = norm(key);
        if (nKey.includes(nGood) || nGood.includes(nKey)) {
          producers = prods;
          break;
        }
      }
    }
    
    if (!producers || producers.length === 0) {
      // Base resource (e.g., Fish, Wool) - no upstream dependencies
      return;
    }

    // Use first producer (TODO: allow user selection or best match)
    const producer = producers[0];
    const node = graph.nodes.get(producer);
    if (!node) return;

    // Calculate how many buildings we need
    let effectiveRate = node.outputRate;
    if (includeElectricity) {
      effectiveRate *= 2; // Electricity doubles production
    }

    const buildingsNeeded = Math.ceil(rateNeeded / effectiveRate);

    // Add or update requirement
    const existing = requirements.get(producer);
    if (existing) {
      existing.count += buildingsNeeded;
    } else {
      requirements.set(producer, {
        buildingName: producer,
        count: buildingsNeeded,
        reason: `Produces ${good}`
      });
    }

    // Recursively process inputs
    node.inputGoods.forEach(input => {
      // Find how much of this input is needed per cycle
      const chain = productionChains.find(c => c.name === producer);
      const inputDef = chain?.inputs?.find(i => i.product === input);
      const inputAmountPerCycle = inputDef?.amount || 1;
      
      // Calculate input rate needed (input consumption per building * number of buildings)
      const inputRatePerBuilding = (inputAmountPerCycle * 60) / (chain?.cycleTime || 30);
      const totalInputRate = inputRatePerBuilding * buildingsNeeded;

      processGood(input, totalInputRate, depth + 1);
    });
  }

  processGood(targetGood, targetRate);

  return Array.from(requirements.values());
}

/**
 * Calculate all production buildings needed to satisfy consumption for a population
 */
export function optimizeProductionChain(
  consumption: Record<string, number>, // good -> tons per minute
  includeElectricity: boolean = false,
  tradeGoods: Set<string> = new Set() // goods to import instead of produce
): Record<string, number> {
  const graph = buildDependencyGraph();
  const allRequirements = new Map<string, number>();

  Object.entries(consumption).forEach(([good, rate]) => {
    // Skip if trading this good
    if (tradeGoods.has(good)) return;

    const requirements = calculateUpstreamProduction(good, rate, graph, includeElectricity);
    
    requirements.forEach(req => {
      const current = allRequirements.get(req.buildingName) || 0;
      allRequirements.set(req.buildingName, current + req.count);
    });
  });

  return Object.fromEntries(allRequirements);
}

/**
 * Like optimizeProductionChain but also aggregates workforce requirements
 */
export function optimizeProductionChainWithWorkforce(
  consumption: Record<string, number>,
  includeElectricity: boolean = false,
  tradeGoods: Set<string> = new Set()
): ProductionResult {
  const graph = buildDependencyGraph();
  const allRequirements = new Map<string, number>();
  const workforce: Record<string, number> = {};

  Object.entries(consumption).forEach(([good, rate]) => {
    if (tradeGoods.has(good)) return;

    const requirements = calculateUpstreamProduction(good, rate, graph, includeElectricity);
    requirements.forEach(req => {
      const current = allRequirements.get(req.buildingName) || 0;
      const newCount = current + req.count;
      allRequirements.set(req.buildingName, newCount);

      const node = graph.nodes.get(req.buildingName);
      if (node && node.workforceNeeded) {
        Object.entries(node.workforceNeeded).forEach(([tier, amount]) => {
          workforce[tier] = (workforce[tier] || 0) + amount * req.count;
        });
      }
    });
  });

  return {
    buildings: Object.fromEntries(allRequirements),
    workforce
  };
}

/**
 * Compute workforce needs for an existing building count map
 */
export function computeWorkforceRequirements(
  buildingCounts: Record<string, number>
): Record<string, number> {
  const graph = buildDependencyGraph();
  const workforce: Record<string, number> = {};

  Object.entries(buildingCounts).forEach(([buildingName, count]) => {
    const node = graph.nodes.get(buildingName);
    if (!node || !node.workforceNeeded) return;
    Object.entries(node.workforceNeeded).forEach(([tier, amount]) => {
      workforce[tier] = (workforce[tier] || 0) + amount * count;
    });
  });

  return workforce;
}

/**
 * Get all goods that can be produced with available workforce
 */
export function getProducibleGoods(availableWorkforce: Record<string, number>): string[] {
  const graph = buildDependencyGraph();
  const producible: string[] = [];

  graph.nodes.forEach((node, buildingName) => {
    // Check if we have the workforce for this building
    const canProduce = Object.entries(node.workforceNeeded).every(([tier, needed]) => {
      const available = availableWorkforce[tier] || 0;
      return available >= needed;
    });

    if (canProduce && !producible.includes(node.outputGood)) {
      producible.push(node.outputGood);
    }
  });

  return producible;
}

/**
 * Analyze bottlenecks in a production chain
 */
export interface Bottleneck {
  good: string;
  required: number;
  available: number;
  deficit: number;
}

export function analyzeBottlenecks(
  targetProduction: Record<string, number>, // good -> rate
  actualCapacity: Record<string, number> // good -> rate
): Bottleneck[] {
  const bottlenecks: Bottleneck[] = [];

  Object.entries(targetProduction).forEach(([good, required]) => {
    const available = actualCapacity[good] || 0;
    if (available < required) {
      bottlenecks.push({
        good,
        required,
        available,
        deficit: required - available
      });
    }
  });

  return bottlenecks.sort((a, b) => b.deficit - a.deficit);
}

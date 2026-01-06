import { productionChains, ProductionChain } from './generatedProductionChains';

export interface ProductionNode {
  buildingName: string;
  inputGoods: string[];
  outputGood: string;
  outputRate: number; // tons per minute
  workforceNeeded: Record<string, number>;
}

export interface DependencyGraph {
  nodes: Map<string, ProductionNode>;
  edges: Map<string, string[]>; // good -> buildings that produce it
  consumers: Map<string, string[]>; // good -> buildings that consume it
}

/**
 * Build a complete dependency graph of all production chains
 */
export function buildDependencyGraph(): DependencyGraph {
  const nodes = new Map<string, ProductionNode>();
  const edges = new Map<string, string[]>();
  const consumers = new Map<string, string[]>();

  productionChains.forEach((chain: ProductionChain) => {
    const inputGoods = chain.inputs?.map(i => i.product) || [];
    const outputRate = (chain.outputAmount * 60) / chain.cycleTime; // Convert to per minute
    
    const node: ProductionNode = {
      buildingName: chain.name,
      inputGoods: inputGoods,
      outputGood: chain.outputProduct,
      outputRate: outputRate,
      workforceNeeded: chain.workforce ? { [chain.workforce.type]: chain.workforce.amount } : {}
    };

    nodes.set(chain.name, node);

    // Track which buildings produce which goods
    if (!edges.has(chain.outputProduct)) {
      edges.set(chain.outputProduct, []);
    }
    edges.get(chain.outputProduct)!.push(chain.name);

    // Track which buildings consume which goods
    inputGoods.forEach(input => {
      if (!consumers.has(input)) {
        consumers.set(input, []);
      }
      consumers.get(input)!.push(chain.name);
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

    // Find producers of this good
    const producers = graph.edges.get(good);
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
      const key = `${input}-${producer}`;
      if (visited.has(key)) return; // Avoid infinite loops
      visited.add(key);

      // Each building consumes inputs at the same rate as output
      // (This is a simplification; real rates may vary)
      const inputRatePerBuilding = effectiveRate;
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

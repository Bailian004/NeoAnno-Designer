import { PRODUCTION_CHAINS_FULL } from './industryData';
import { productionChains } from './generatedProductionChains';
import { canonicalizeProduct, canonicalizeBuilding, getGeneratedNameForBuilding } from './naming';

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

// All matching now uses canonical names. No fuzzy or alias fallbacks.

/**
 * Build a complete dependency graph of all production chains
 */
export function buildDependencyGraph(): DependencyGraph {
  const nodes = new Map<string, ProductionNode>();
  const edges = new Map<string, string[]>();
  const consumers = new Map<string, string[]>();

  // Build a quick lookup map for workforce from generatedProductionChains using canonical mapping
  const workforceMap = new Map<string, Record<string, number>>();
  productionChains.forEach(chain => {
    if (!chain.workforce) return;
    const canonical = canonicalizeBuilding(chain.name);
    const wf = { [chain.workforce.type]: chain.workforce.amount } as Record<string, number>;
    workforceMap.set(chain.name, wf);
    workforceMap.set(canonical, wf);
    const mappedGen = getGeneratedNameForBuilding(canonical);
    if (mappedGen) workforceMap.set(mappedGen, wf);
  });
  const getWorkforce = (buildingName: string): Record<string, number> => {
    const canonical = canonicalizeBuilding(buildingName);
    return workforceMap.get(canonical) || workforceMap.get(buildingName) || {};
  };

  // Process each production definition from PRODUCTION_CHAINS_FULL
  Object.entries(PRODUCTION_CHAINS_FULL).forEach(([goodId, definition]) => {
    const buildingName = definition.buildingId;
    
    // Create node for the main building
    const mainInputs: string[] = [];
    
    // Recursively process chain to create nodes for ALL buildings
    const processChainLink = (link: any, parentGood?: string) => {
      const building = link.buildingId;
      if (!building) return;
      
      // Collect inputs for this building
      const inputs: string[] = [];
      if (link.inputs && Array.isArray(link.inputs)) {
        link.inputs.forEach((input: any) => {
          if (input.buildingId) {
            inputs.push(input.buildingId);
            // Recursively process nested inputs
            processChainLink(input, building);
          }
        });
      }
      
      // Create node for this building if it doesn't exist
      if (!nodes.has(building)) {
        // For intermediate buildings, the outputGood is the building name itself
        // (since we don't have explicit intermediate good names)
        nodes.set(building, {
          buildingName: building,
          inputGoods: inputs,
          outputGood: building, // Use building name as the good for chain buildings
          outputRate: 1, // Default rate
          workforceNeeded: getWorkforce(building),
          icon: undefined
        });
        
        // Register this building as producing itself (for chain lookups)
        if (!edges.has(building)) {
          edges.set(building, []);
        }
        if (!edges.get(building)!.includes(building)) {
          edges.get(building)!.push(building);
        }
      }
      
      // Track that this building is an input to parent
      if (parentGood) {
        mainInputs.push(building);
      }
    };
    
    // Process chain links
    if (definition.chain && Array.isArray(definition.chain)) {
      definition.chain.forEach(link => processChainLink(link, goodId));
    }
    
    // Create/update main building node
    nodes.set(buildingName, {
      buildingName: buildingName,
      inputGoods: mainInputs,
      outputGood: goodId,
      outputRate: definition.outputPerMinute,
      workforceNeeded: getWorkforce(buildingName),
      icon: undefined
    });

    // Track which buildings produce which goods
    const outputKeys = [goodId, buildingName].filter(Boolean);
    outputKeys.forEach(key => {
      if (!edges.has(key)) {
        edges.set(key, []);
      }
      if (!edges.get(key)!.includes(buildingName)) {
        edges.get(key)!.push(buildingName);
      }
    });

    // Track which buildings consume which goods
    mainInputs.forEach(input => {
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

    // Resolve producers strictly using canonical names
    const candidates = [canonicalizeProduct(good), canonicalizeBuilding(good), good];
    let producers: string[] | undefined;
    for (const k of candidates) {
      const p = graph.edges.get(k);
      if (p && p.length > 0) { producers = p; break; }
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
    node.inputGoods.forEach(inputBuilding => {
      const inputNode = graph.nodes.get(inputBuilding);
      if (inputNode) {
        processGood(inputNode.outputGood, rateNeeded, depth + 1);
      }
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

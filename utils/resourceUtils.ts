import { PlacedBuilding, GameConfig, BuildingDefinition } from "../types";

export interface ResourceBalance {
  id: string;
  name: string;
  produced: number;
  consumed: number;
  net: number;
  producers: string[]; // Names of buildings producing this
  consumers: string[]; // Names of buildings consuming this
}

export const calculateResourceBalance = (
  buildings: PlacedBuilding[], 
  config: GameConfig,
  populationMultiplier: number = 1.0 // For simulating growth
): ResourceBalance[] => {
  const balances: Record<string, ResourceBalance> = {};
  const resourceMeta = config.resources || {};

  // Helper to init resource entry
  const ensureResource = (id: string) => {
    if (!balances[id]) {
      balances[id] = {
        id,
        name: resourceMeta[id]?.name || id,
        produced: 0,
        consumed: 0,
        net: 0,
        producers: [],
        consumers: []
      };
    }
  };

  buildings.forEach(placed => {
    const def = config.buildings.find(d => d.id === placed.definitionId);
    if (!def) return;

    // Production
    if (def.production) {
      // Outputs
      def.production.outputs?.forEach(out => {
        ensureResource(out.resourceId);
        balances[out.resourceId].produced += out.amount;
        if (!balances[out.resourceId].producers.includes(def.name)) {
          balances[out.resourceId].producers.push(def.name);
        }
      });

      // Inputs (Consumption by factories)
      def.production.inputs?.forEach(inRes => {
        ensureResource(inRes.resourceId);
        balances[inRes.resourceId].consumed += inRes.amount;
        if (!balances[inRes.resourceId].consumers.includes(def.name)) {
          balances[inRes.resourceId].consumers.push(def.name);
        }
      });
    }

    // Residence Consumption
    if (def.residence && def.residence.consumption) {
      def.residence.consumption.forEach(cons => {
        ensureResource(cons.resourceId);
        // Consumption per house * multiplier
        const amount = cons.amount * populationMultiplier;
        balances[cons.resourceId].consumed += amount;
        if (!balances[cons.resourceId].consumers.includes(def.name)) {
          balances[cons.resourceId].consumers.push(def.name);
        }
      });
    }
  });

  // Calculate Nets
  return Object.values(balances).map(b => ({
    ...b,
    net: b.produced - b.consumed
  })).sort((a, b) => a.name.localeCompare(b.name));
};

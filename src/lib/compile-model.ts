/**
 * Compile raw canonical data into indexed runtime model.
 * This is a pure function that should be called once per data load.
 *
 * All derived lookups, maps, and relationships are built here:
 * - byId indexes for fast O(1) lookups
 * - production chains indexed by input/output goods
 * - influence radius lookups
 * - docklands importables
 * - item targeting indexes
 * - service building provider maps
 */

import { Anno1800Data } from './neoanno-data';

export type CompiledBuilding = any; // building object with added computed fields if needed
export type CompiledGood = any;
export type CompiledService = any;
export type CompiledResident = any;
export type CompiledItem = any;

/**
 * Production chain entry with resolved building/good details.
 */
export interface ProductionChainEntry {
  buildingGuid: string;
  buildingName?: string;
  inputGoods: string[]; // guids
  outputGoods: string[]; // guids
  duration?: number;
}

/**
 * Influence definition for a building.
 */
export interface InfluenceData {
  buildingGuid: string;
  type: string; // e.g. "police", "fire", "health", etc.
  radius: number;
  roadDistance?: number;
}

/**
 * Item targeting: which buildings are affected by a specific item.
 */
export interface ItemTargetIndex {
  itemGuid: string;
  affectedBuildingGuids: Set<string>;
}

/**
 * UI-ready building projection for Designer components.
 * Derived from raw canonical data with sensible defaults.
 */
export interface UiBuilding {
  id: string;
  name: string;
  category: 'Residence' | 'Public' | 'Production' | 'Decoration';
  icon?: string;
  region?: string;
  ui_group?: 'residences' | 'production' | 'logistics' | 'public' | 'decorative';
  sub_category?: string;
  residence?: {
    populationType?: string;
    maxPopulation?: number;
  };
  color?: string;
  width?: number;
  height?: number;
}

/**
 * The compiled runtime model: all indexes and lookups, optimized for UI rendering and calculation.
 */
export interface CompiledModel {
  // Raw data reference (for features that need it)
  raw: Anno1800Data;

  // By-ID indexes
  buildingsById: Map<string, CompiledBuilding>;
  goodsById: Map<string, CompiledGood>;
  servicesById: Map<string, CompiledService>;
  residentsById: Map<string, CompiledResident>;
  itemsByGuid: Map<string, CompiledItem>;

  // GUID → ID cross-references (if data includes guids)
  buildingGuidToId: Map<string, string>;
  goodGuidToId: Map<string, string>;
  serviceGuidToId: Map<string, string>;

  // Production relationships
  goodProducers: Map<string, string[]>; // goodId -> [buildingIds that produce it]
  buildingRecipes: Map<string, ProductionChainEntry[]>; // buildingId -> [production chains]

  // Service/influence lookup
  serviceProviders: Map<string, string[]>; // serviceId -> [buildingIds]
  influenceByBuilding: Map<string, InfluenceData[]>; // buildingId -> [influence objects]

  // Docklands
  docklandsImportableGoods: Set<string>; // goodIds that can be imported via docklands
  docklandsCostByGood: Map<string, any>; // goodId -> cost/bracket data if available

  // Item targeting
  itemTargets: Map<string, ItemTargetIndex>; // itemGuid -> targets

  // Tourism/happiness/other computed indexes (extensible)
  tourismBuildings: Map<string, any>; // buildingId -> tourism data if present

  // UI Projections (for Designer components)
  ui: {
    buildingsList: UiBuilding[];
    buildingsByCategory: Map<string, UiBuilding[]>;
  };
}

/**
 * Build all indexes from raw canonical data.
 * Collects validation warnings and logs them as a summary at the end.
 *
 * @param rawData - The loaded Anno1800Data from the remote repository
 * @returns A CompiledModel with all lookups pre-built
 */

// Category mapping: derive UI category from canonical building type
const CATEGORY_MAPPING: Record<string, UiBuilding['category']> = {
  // Residence types
  'residence': 'Residence',
  'residential': 'Residence',
  'house': 'Residence',
  'housing': 'Residence',
  
  // Production types
  'factory': 'Production',
  'production': 'Production',
  'farm': 'Production',
  'agriculture': 'Production',
  'mine': 'Production',
  'industry': 'Production',
  
  // Public/Service types
  'public': 'Public',
  'service': 'Public',
  'institution': 'Public',
  'culture': 'Public',
  'logistics': 'Public',
  'warehouse': 'Public',
  'marketplace': 'Public',
  
  // Decoration
  'decoration': 'Decoration',
  'ornament': 'Decoration',
  'street': 'Decoration',
  'park': 'Decoration',
};

function deriveCategoryFromBuilding(building: any): UiBuilding['category'] {
  // 1. Check if canonical data has category
  if (building.category) return building.category;
  
  // 2. Check building type fields
  const type = (building.type || building.buildingType || '').toLowerCase();
  for (const [key, category] of Object.entries(CATEGORY_MAPPING)) {
    if (type.includes(key)) return category;
  }
  
  // 3. Check name/id for hints
  const name = (building.name || building.id || '').toLowerCase();
  if (name.includes('residence') || name.includes('house')) return 'Residence';
  if (name.includes('warehouse') || name.includes('market')) return 'Public';
  if (name.includes('farm') || name.includes('factory') || name.includes('mine')) return 'Production';
  if (name.includes('street') || name.includes('park')) return 'Decoration';
  
  // Default
  return 'Production';
}

function deriveIconFromBuilding(building: any): string | undefined {
  let icon = building.icon || building.iconPath || building.iconName || building.guid || building.id;
  
  // Ensure it's a string
  if (!icon || typeof icon !== 'string') {
    return undefined;
  }
  
  // Convert icon_ prefix icons to A7_ prefix (local naming convention)
  if (icon.startsWith('icon_')) {
    icon = icon.replace(/^icon_/, 'A7_');
  }
  
  // Ensure .png extension
  if (!icon.endsWith('.png')) {
    icon = icon + '.png';
  }
  
  return icon;
}

function deriveRegionFromBuilding(building: any): string | undefined {
  // Check region fields
  if (building.region) return building.region;
  if (building.regions && Array.isArray(building.regions) && building.regions.length > 0) {
    return building.regions[0];
  }
  if (building.dlc || building.area) return building.dlc || building.area;
  return undefined;
}

function projectBuildingToUi(building: any): UiBuilding {
  const id = building.id || building.guid;
  const iconFilename = deriveIconFromBuilding(building);
  const iconPath = iconFilename ? `${import.meta.env.BASE_URL}icons/${iconFilename}` : undefined;
  
  return {
    id,
    name: building.name || id || 'Unknown',
    category: deriveCategoryFromBuilding(building),
    icon: iconPath,
    region: deriveRegionFromBuilding(building),
    ui_group: building.ui_group,
    sub_category: building.sub_category,
    residence: building.residence,
    color: building.color || '#888888',
    width: building.width || building.BlockSize?.[0] || 2,
    height: building.height || building.BlockSize?.[1] || 2,
  };
}

export function compileModel(rawData: Anno1800Data): CompiledModel {
  // Track validation issues for summary logging (avoid spam)
  const validationIssues: Record<string, { count: number; examples: any[] }> = {
    building_missing_id: { count: 0, examples: [] },
    good_missing_id: { count: 0, examples: [] },
    service_missing_id: { count: 0, examples: [] },
    resident_missing_id: { count: 0, examples: [] },
    item_missing_guid: { count: 0, examples: [] },
    chain_missing_building: { count: 0, examples: [] },
  };

  const MAX_EXAMPLES = 5; // Store up to 5 examples per issue type

  function recordIssue(type: keyof typeof validationIssues, obj: any) {
    validationIssues[type].count++;
    if (validationIssues[type].examples.length < MAX_EXAMPLES) {
      validationIssues[type].examples.push(obj);
    }
  }

  const model: CompiledModel = {
    raw: rawData,

    buildingsById: new Map(),
    goodsById: new Map(),
    servicesById: new Map(),
    residentsById: new Map(),
    itemsByGuid: new Map(),

    buildingGuidToId: new Map(),
    goodGuidToId: new Map(),
    serviceGuidToId: new Map(),

    goodProducers: new Map(),
    buildingRecipes: new Map(),

    serviceProviders: new Map(),
    influenceByBuilding: new Map(),

    docklandsImportableGoods: new Set(),
    docklandsCostByGood: new Map(),

    itemTargets: new Map(),

    tourismBuildings: new Map(),
    
    ui: {
      buildingsList: [],
      buildingsByCategory: new Map(),
    },
  };

  // 1. Index buildings
  if (rawData.buildings && Array.isArray(rawData.buildings)) {
    for (const building of rawData.buildings) {
      const id = building.id || building.guid;
      if (!id) {
        recordIssue('building_missing_id', building);
        continue;
      }
      model.buildingsById.set(id, building);
      if (building.guid) {
        model.buildingGuidToId.set(building.guid, id);
      }
    }
  }

  // 2. Index goods
  if (rawData.goods && Array.isArray(rawData.goods)) {
    for (const good of rawData.goods) {
      const id = good.id || good.guid;
      if (!id) {
        recordIssue('good_missing_id', good);
        continue;
      }
      model.goodsById.set(id, good);
      if (good.guid) {
        model.goodGuidToId.set(good.guid, id);
      }
    }
  }

  // 3. Index services
  if (rawData.services && Array.isArray(rawData.services)) {
    for (const service of rawData.services) {
      const id = service.id || service.guid;
      if (!id) {
        recordIssue('service_missing_id', service);
        continue;
      }
      model.servicesById.set(id, service);
      if (service.guid) {
        model.serviceGuidToId.set(service.guid, id);
      }
    }
  }

  // 4. Index residents
  if (rawData.residents && Array.isArray(rawData.residents)) {
    for (const resident of rawData.residents) {
      const id = resident.id || resident.guid;
      if (!id) {
        recordIssue('resident_missing_id', resident);
        continue;
      }
      model.residentsById.set(id, resident);
    }
  }

  // 5. Index items
  if (rawData.items && Array.isArray(rawData.items)) {
    for (const item of rawData.items) {
      if (!item.guid) {
        recordIssue('item_missing_guid', item);
        continue;
      }
      model.itemsByGuid.set(item.guid, item);
    }
  }

  // 6. Build production chain indexes
  if (rawData.productionChains && Array.isArray(rawData.productionChains)) {
    for (const chain of rawData.productionChains) {
      const buildingId = chain.buildingId || chain.buildingGuid;
      if (!buildingId) {
        recordIssue('chain_missing_building', chain);
        continue;
      }

      // Add to buildingRecipes
      if (!model.buildingRecipes.has(buildingId)) {
        model.buildingRecipes.set(buildingId, []);
      }
      model.buildingRecipes.get(buildingId)!.push({
        buildingGuid: buildingId,
        buildingName: chain.buildingName,
        inputGoods: chain.inputs || [],
        outputGoods: chain.outputs || [],
        duration: chain.duration,
      });

      // Index output goods → producers
      if (chain.outputs && Array.isArray(chain.outputs)) {
        for (const outputGoodId of chain.outputs) {
          if (!model.goodProducers.has(outputGoodId)) {
            model.goodProducers.set(outputGoodId, []);
          }
          if (!model.goodProducers.get(outputGoodId)!.includes(buildingId)) {
            model.goodProducers.get(outputGoodId)!.push(buildingId);
          }
        }
      }
    }
  }

  // 7. Build consumption/needs indexes (optional, for service providers)
  if (rawData.consumption && Array.isArray(rawData.consumption)) {
    for (const consumption of rawData.consumption) {
      const residentId = consumption.residentId;
      const serviceId = consumption.serviceId;
      if (residentId && serviceId) {
        if (!model.serviceProviders.has(serviceId)) {
          model.serviceProviders.set(serviceId, []);
        }
        // For now, track that this service is needed; could expand to service building lookups
      }
    }
  }

  // 8. Build influence indexes (if influence data exists)
  if (rawData.services && Array.isArray(rawData.services)) {
    for (const service of rawData.services) {
      if (service.radius != null || service.roadDistance != null) {
        const buildingId = service.id || service.guid;
        if (!model.influenceByBuilding.has(buildingId)) {
          model.influenceByBuilding.set(buildingId, []);
        }
        model.influenceByBuilding.get(buildingId)!.push({
          buildingGuid: buildingId,
          type: service.type || 'service',
          radius: service.radius ?? 0,
          roadDistance: service.roadDistance,
        });
      }
    }
  }

  // 9. Build docklands index
  if (rawData.docklands) {
    if (Array.isArray(rawData.docklands.importableGoods)) {
      for (const goodId of rawData.docklands.importableGoods) {
        model.docklandsImportableGoods.add(goodId);
      }
    }
    if (rawData.docklands.costByGood && typeof rawData.docklands.costByGood === 'object') {
      for (const [goodId, cost] of Object.entries(rawData.docklands.costByGood)) {
        model.docklandsCostByGood.set(goodId, cost);
      }
    }
  }

  // 10. Build item targeting index
  if (rawData.items && Array.isArray(rawData.items)) {
    for (const item of rawData.items) {
      if (!item.guid) continue;
      if (item.targets && Array.isArray(item.targets)) {
        const targetIndex: ItemTargetIndex = {
          itemGuid: item.guid,
          affectedBuildingGuids: new Set(item.targets),
        };
        model.itemTargets.set(item.guid, targetIndex);
      }
    }
  }

  // 11. Optional: Build tourism index (if tourism data exists)
  if (rawData.meta?.tourism) {
    // Extend as needed for tourism-specific lookups
  }

  // 12. Build UI projections from canonical data
  const uiSummary = {
    total: 0,
    missingCategory: 0,
    missingIcon: 0,
    missingRegion: 0,
    byCategory: {} as Record<string, number>,
  };

  model.ui.buildingsList = Array.from(model.buildingsById.values()).map(building => {
    const uiBuilding = projectBuildingToUi(building);
    
    // Track stats
    uiSummary.total++;
    if (!building.category) uiSummary.missingCategory++;
    if (!uiBuilding.icon) uiSummary.missingIcon++;
    if (!uiBuilding.region) uiSummary.missingRegion++;
    uiSummary.byCategory[uiBuilding.category] = (uiSummary.byCategory[uiBuilding.category] || 0) + 1;
    
    return uiBuilding;
  });

  // Build category index
  for (const building of model.ui.buildingsList) {
    if (!model.ui.buildingsByCategory.has(building.category)) {
      model.ui.buildingsByCategory.set(building.category, []);
    }
    model.ui.buildingsByCategory.get(building.category)!.push(building);
  }

  // Log UI projection summary in dev
  if (import.meta.env.DEV && uiSummary.total > 0) {
    console.log('[compileModel] UI projection summary:', {
      totalBuildings: uiSummary.total,
      categoriesInferred: uiSummary.missingCategory,
      iconsInferred: uiSummary.missingIcon,
      regionsInferred: uiSummary.missingRegion,
      byCategory: uiSummary.byCategory,
    });
  }

  // Log validation summary (instead of spamming individual warnings)
  const hasIssues = Object.values(validationIssues).some(issue => issue.count > 0);
  if (hasIssues && import.meta.env.DEV) {
    console.warn('[compileModel] Data validation summary:', {
      building_missing_id: validationIssues.building_missing_id.count,
      good_missing_id: validationIssues.good_missing_id.count,
      service_missing_id: validationIssues.service_missing_id.count,
      resident_missing_id: validationIssues.resident_missing_id.count,
      item_missing_guid: validationIssues.item_missing_guid.count,
      chain_missing_building: validationIssues.chain_missing_building.count,
    });
    // Optionally log examples of first few issues
    if (import.meta.env.VITE_DEBUG_DATA_ISSUES === 'true') {
      const issuesWithExamples = Object.entries(validationIssues)
        .filter(([_, issue]) => issue.count > 0)
        .reduce((acc, [key, issue]) => {
          acc[key] = { count: issue.count, examples: issue.examples };
          return acc;
        }, {} as Record<string, any>);
      console.log('[compileModel] Issue examples:', issuesWithExamples);
    }
  }

  return model;
}

/**
 * Layout Patterns (BlockGene) for Genetic Solver
 * Pre-defined building arrangements for better city aesthetics
 */

export interface PlacementPattern {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  buildings: PatternBuilding[];
  requiredCategories: string[]; // e.g., ['Residence', 'Public']
}

export interface PatternBuilding {
  category: string; // 'Residence', 'Public', 'Production', 'Decoration', 'Road'
  relativeX: number;
  relativeY: number;
  width: number;
  height: number;
  rotation?: 0 | 90 | 180 | 270;
  tags?: string[]; // e.g., ['tier1', 'tier2', 'service', 'marketplace']
}

/**
 * Residential Block Patterns
 */
export const RESIDENTIAL_PATTERNS: PlacementPattern[] = [
  {
    id: 'res_block_2x2',
    name: 'Compact Housing (2×2)',
    description: '4 residences in a tight grid with central courtyard',
    width: 12,
    height: 12,
    requiredCategories: ['Residence'],
    buildings: [
      { category: 'Residence', relativeX: 1, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 7, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 1, relativeY: 7, width: 4, height: 4 },
      { category: 'Residence', relativeX: 7, relativeY: 7, width: 4, height: 4 },
      { category: 'Decoration', relativeX: 5, relativeY: 5, width: 2, height: 2, tags: ['park'] }
    ]
  },
  {
    id: 'res_block_3x2',
    name: 'Medium Housing (3×2)',
    description: '6 residences with marketplace access',
    width: 18,
    height: 12,
    requiredCategories: ['Residence', 'Public'],
    buildings: [
      { category: 'Residence', relativeX: 1, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 6, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 13, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 1, relativeY: 7, width: 4, height: 4 },
      { category: 'Residence', relativeX: 6, relativeY: 7, width: 4, height: 4 },
      { category: 'Residence', relativeX: 13, relativeY: 7, width: 4, height: 4 },
      { category: 'Public', relativeX: 11, relativeY: 1, width: 2, height: 2, tags: ['service'] }
    ]
  },
  {
    id: 'res_block_artisan_luxury',
    name: 'Artisan District',
    description: 'Spacious layout for higher-tier residences',
    width: 20,
    height: 16,
    requiredCategories: ['Residence'],
    buildings: [
      { category: 'Residence', relativeX: 2, relativeY: 2, width: 5, height: 5, tags: ['tier3', 'tier4'] },
      { category: 'Residence', relativeX: 13, relativeY: 2, width: 5, height: 5, tags: ['tier3', 'tier4'] },
      { category: 'Residence', relativeX: 2, relativeY: 9, width: 5, height: 5, tags: ['tier3', 'tier4'] },
      { category: 'Residence', relativeX: 13, relativeY: 9, width: 5, height: 5, tags: ['tier3', 'tier4'] },
      { category: 'Decoration', relativeX: 8, relativeY: 6, width: 4, height: 4, tags: ['fountain', 'statue'] },
      { category: 'Road', relativeX: 0, relativeY: 7, width: 20, height: 1 }
    ]
  }
];

/**
 * Service Hub Patterns
 */
export const SERVICE_PATTERNS: PlacementPattern[] = [
  {
    id: 'service_hub_basic',
    name: 'Basic Service Hub',
    description: 'Marketplace with fire station and church',
    width: 16,
    height: 12,
    requiredCategories: ['Public'],
    buildings: [
      { category: 'Public', relativeX: 2, relativeY: 2, width: 5, height: 5, tags: ['marketplace'] },
      { category: 'Public', relativeX: 9, relativeY: 2, width: 3, height: 3, tags: ['fire'] },
      { category: 'Public', relativeX: 9, relativeY: 7, width: 4, height: 4, tags: ['church'] },
      { category: 'Road', relativeX: 0, relativeY: 6, width: 16, height: 1 }
    ]
  },
  {
    id: 'service_hub_advanced',
    name: 'Advanced Service Hub',
    description: 'Full service center for higher tiers',
    width: 24,
    height: 16,
    requiredCategories: ['Public'],
    buildings: [
      { category: 'Public', relativeX: 2, relativeY: 2, width: 5, height: 5, tags: ['marketplace'] },
      { category: 'Public', relativeX: 9, relativeY: 2, width: 4, height: 4, tags: ['university'] },
      { category: 'Public', relativeX: 15, relativeY: 2, width: 4, height: 4, tags: ['bank'] },
      { category: 'Public', relativeX: 9, relativeY: 8, width: 4, height: 4, tags: ['variety'] },
      { category: 'Public', relativeX: 15, relativeY: 8, width: 3, height: 3, tags: ['hospital'] },
      { category: 'Decoration', relativeX: 1, relativeY: 9, width: 5, height: 5, tags: ['park'] }
    ]
  }
];

/**
 * Production Zone Patterns
 */
export const PRODUCTION_PATTERNS: PlacementPattern[] = [
  {
    id: 'production_food_cluster',
    name: 'Food Production Cluster',
    description: 'Fishery, bakery, and slaughterhouse with warehouse',
    width: 20,
    height: 16,
    requiredCategories: ['Production'],
    buildings: [
      { category: 'Production', relativeX: 1, relativeY: 1, width: 5, height: 5, tags: ['fishery'] },
      { category: 'Production', relativeX: 8, relativeY: 1, width: 4, height: 4, tags: ['bakery'] },
      { category: 'Production', relativeX: 14, relativeY: 1, width: 5, height: 5, tags: ['slaughterhouse'] },
      { category: 'Production', relativeX: 1, relativeY: 8, width: 4, height: 4, tags: ['brewery'] },
      { category: 'Production', relativeX: 7, relativeY: 8, width: 5, height: 5, tags: ['warehouse'] }
    ]
  },
  {
    id: 'production_goods_cluster',
    name: 'Goods Production Cluster',
    description: 'Textile and crafts production',
    width: 18,
    height: 14,
    requiredCategories: ['Production'],
    buildings: [
      { category: 'Production', relativeX: 1, relativeY: 1, width: 4, height: 4, tags: ['soap'] },
      { category: 'Production', relativeX: 7, relativeY: 1, width: 5, height: 5, tags: ['sewing'] },
      { category: 'Production', relativeX: 14, relativeY: 1, width: 3, height: 3, tags: ['schnapps'] },
      { category: 'Production', relativeX: 7, relativeY: 8, width: 5, height: 5, tags: ['warehouse'] }
    ]
  }
];

/**
 * Mixed-Use Patterns
 */
export const MIXED_PATTERNS: PlacementPattern[] = [
  {
    id: 'mixed_neighborhood',
    name: 'Complete Neighborhood',
    description: 'Residences with integrated services',
    width: 24,
    height: 20,
    requiredCategories: ['Residence', 'Public'],
    buildings: [
      // Top row residences
      { category: 'Residence', relativeX: 1, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 6, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 11, relativeY: 1, width: 4, height: 4 },
      { category: 'Residence', relativeX: 16, relativeY: 1, width: 4, height: 4 },
      
      // Services in middle
      { category: 'Public', relativeX: 2, relativeY: 7, width: 5, height: 5, tags: ['marketplace'] },
      { category: 'Public', relativeX: 9, relativeY: 7, width: 3, height: 3, tags: ['fire'] },
      { category: 'Public', relativeX: 14, relativeY: 7, width: 4, height: 4, tags: ['church'] },
      
      // Bottom row residences
      { category: 'Residence', relativeX: 1, relativeY: 14, width: 4, height: 4 },
      { category: 'Residence', relativeX: 6, relativeY: 14, width: 4, height: 4 },
      { category: 'Residence', relativeX: 11, relativeY: 14, width: 4, height: 4 },
      { category: 'Residence', relativeX: 16, relativeY: 14, width: 4, height: 4 },
      
      // Central decoration
      { category: 'Decoration', relativeX: 21, relativeY: 8, width: 2, height: 2, tags: ['tree'] }
    ]
  }
];

/**
 * All patterns combined
 */
export const ALL_PATTERNS = [
  ...RESIDENTIAL_PATTERNS,
  ...SERVICE_PATTERNS,
  ...PRODUCTION_PATTERNS,
  ...MIXED_PATTERNS
];

/**
 * Find suitable patterns for given building categories
 */
export function findPatternsForCategories(categories: string[]): PlacementPattern[] {
  return ALL_PATTERNS.filter(pattern => 
    pattern.requiredCategories.every(req => categories.includes(req))
  );
}

/**
 * Get pattern by ID
 */
export function getPattern(id: string): PlacementPattern | undefined {
  return ALL_PATTERNS.find(p => p.id === id);
}

/**
 * Calculate efficiency score for a pattern
 * (area utilized / total area)
 */
export function calculatePatternEfficiency(pattern: PlacementPattern): number {
  const totalArea = pattern.width * pattern.height;
  const buildingArea = pattern.buildings.reduce((sum, b) => sum + (b.width * b.height), 0);
  return buildingArea / totalArea;
}

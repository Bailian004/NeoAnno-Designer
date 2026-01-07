/**
 * Building Data Adapter
 * Converts generated data to BuildingDefinition format for genetic solver
 */

import { BuildingDefinition } from '../types';
import { productionChains } from './generatedProductionChains';
import { serviceBuildings } from './generatedServiceBuildings';
import { residenceBuildings } from './generatedResidences';
import { getBuildingIdFromName, BUILDING_ID_MAP } from './buildingIdMap';

// Color scheme for different building types
const COLORS = {
  residence: '#4CAF50',
  production: '#FF9800',
  service: '#2196F3',
  infrastructure: '#9C27B0',
  road: '#757575'
};

/**
 * Convert generated data to BuildingDefinition[]
 */
export function loadBuildingDefinitions(): BuildingDefinition[] {
  const definitions: BuildingDefinition[] = [];

  // Add residences
  residenceBuildings.forEach(building => {
    definitions.push({
      id: building.identifier || building.name,
      name: building.name,
      width: building.size.x,
      height: building.size.z,
      color: COLORS.residence,
      icon: building.icon,
      category: 'Residence',
      influenceRadius: 0,
      influenceRange: 0
    });
  });

  // Add production buildings
  productionChains.forEach(building => {
    definitions.push({
      id: building.identifier || building.name,
      name: building.name,
      width: building.size.x,
      height: building.size.z,
      color: COLORS.production,
      icon: building.icon,
      category: 'Production',
      influenceRadius: 0,
      influenceRange: 0
    });
  });

  // Add service buildings
  serviceBuildings.forEach(building => {
    const range = building.range?.range || 0;
    definitions.push({
      id: building.identifier || building.name,
      name: building.name,
      width: building.size.x,
      height: building.size.z,
      color: COLORS.service,
      icon: building.icon,
      category: 'Public',
      influenceRadius: building.range?.type === 'radius' ? range : 0,
      influenceRange: building.range?.type === 'street' ? range : 0
    });
  });

  // Add basic road
  definitions.push({
    id: 'Street_1x1',
    name: 'Road',
    width: 1,
    height: 1,
    color: COLORS.road,
    category: 'Public',
    influenceRadius: 0,
    influenceRange: 0
  });

  return definitions;
}

/**
 * Get building definition by name using ID mapping table
 */
export function getBuildingByName(
  definitions: BuildingDefinition[],
  name: string
): BuildingDefinition | undefined {
  // Try ID mapping table first (most reliable)
  const mappedId = getBuildingIdFromName(name);
  if (mappedId) {
    const match = definitions.find(d => d.id === mappedId);
    if (match) return match;
  }

  // Fallback to direct ID match
  let match = definitions.find(d => d.id === name);
  if (match) return match;

  // Fallback to exact name match
  const normalized = name.toLowerCase().trim();
  match = definitions.find(d => d.name.toLowerCase() === normalized);
  if (match) return match;
  
  // Fallback to contains match (less reliable)
  match = definitions.find(d => d.name.toLowerCase().includes(normalized));
  if (match) return match;
  
  return undefined;
}

/**
 * Map targetCounts with friendly names to actual building IDs
 * Now with proper error reporting and validation
 */
export function mapTargetCountsToIds(
  targetCounts: Record<string, number>,
  definitions: BuildingDefinition[]
): Record<string, number> {
  const mapped: Record<string, number> = {};
  const failures: string[] = [];

  Object.entries(targetCounts).forEach(([name, count]) => {
    const def = getBuildingByName(definitions, name);
    if (def) {
      mapped[def.id] = count;
    } else {
      // Check if it's already an ID
      const byId = definitions.find(d => d.id === name);
      if (byId) {
        mapped[name] = count;
      } else {
        failures.push(name);
        console.warn(`[BuildingAdapter] Could not find building: "${name}"`);
      }
    }
  });

  // Report summary if there were failures
  if (failures.length > 0) {
    console.error(
      `[BuildingAdapter] Failed to resolve ${failures.length} building(s):`,
      failures.join(', ')
    );
  }

  return mapped;
}

/**
 * Building Data Adapter
 * Converts generated data to BuildingDefinition format for genetic solver
 */

import { BuildingDefinition } from '../types';
import { productionChains } from './generatedProductionChains';
import { serviceBuildings } from './generatedServiceBuildings';
import { residenceBuildings } from './generatedResidences';

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
 * Get building definition by name (case-insensitive, fuzzy matching)
 */
export function getBuildingByName(
  definitions: BuildingDefinition[],
  name: string
): BuildingDefinition | undefined {
  const normalized = name.toLowerCase().trim();
  
  // Try exact match first
  let match = definitions.find(d => d.name.toLowerCase() === normalized);
  if (match) return match;
  
  // Try contains match
  match = definitions.find(d => d.name.toLowerCase().includes(normalized));
  if (match) return match;
  
  // Try reverse: name contains definition name (e.g., "Workers Residence" contains "Worker")
  match = definitions.find(d => {
    const defName = d.name.toLowerCase();
    return normalized.includes(defName) || defName.includes(normalized.split(' ')[0]);
  });
  if (match) return match;
  
  // Try special cases for residences
  if (normalized.includes('residence')) {
    const tier = normalized.split(' ')[0]; // e.g., "Workers" from "Workers Residence"
    match = definitions.find(d => 
      d.category === 'Residence' && 
      d.name.toLowerCase().includes(tier.toLowerCase())
    );
  }
  
  return match;
}

/**
 * Map targetCounts with friendly names to actual building IDs
 */
export function mapTargetCountsToIds(
  targetCounts: Record<string, number>,
  definitions: BuildingDefinition[]
): Record<string, number> {
  const mapped: Record<string, number> = {};

  Object.entries(targetCounts).forEach(([name, count]) => {
    const def = getBuildingByName(definitions, name);
    if (def) {
      mapped[def.id] = count;
    } else {
      console.warn(`Could not find building definition for: ${name}`);
      // Try using the name as-is in case it's already an ID
      mapped[name] = count;
    }
  });

  return mapped;
}

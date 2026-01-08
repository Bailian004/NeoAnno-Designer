import { productionChains } from '../data/generatedProductionChains';
import { PRODUCTION_CHAINS_FULL as CHAINS_FULL } from '../data/industryData';
import { residenceBuildings } from '../data/generatedResidences';
import { serviceBuildings } from '../data/generatedServiceBuildings';
import { getHelpfulBuildingIcon } from '../data/helpfulIconMap';
import { canonicalizeBuilding, getGeneratedNameForBuilding } from '../data/naming';
import { BUILDING_ICON_OVERRIDES, PRODUCT_ICON_MAP } from '../data/buildingIcons';

/**
 * Centralized icon resolution for all buildings in the app.
 * 
 * Priority order:
 * 1. Manual overrides (buildingIcons.ts) - highest priority for exact matches
 * 2. Helpful_info icons (icons.json + presets.json with synonym matching)
 * 3. Building data files (generatedProductionChains, etc.) with fuzzy matching
 * 
 * @param buildingName - The name of the building
 * @returns The icon filename or undefined if not found
 */
export function getBuildingIcon(buildingName: string): string | undefined {
  // Canonicalize incoming name first
  const canonical = canonicalizeBuilding(buildingName);
  // Priority 1: Check manual overrides first (exact matches, correct case)
  const override = BUILDING_ICON_OVERRIDES[canonical] || BUILDING_ICON_OVERRIDES[buildingName];
  if (override) return override;
  
  // Priority 2: Check helpful info with smart matching
  const helpful = getHelpfulBuildingIcon(canonical) || getHelpfulBuildingIcon(buildingName);
  if (helpful) return helpful;
  
  // Priority 3: Check building data files using canonical mapping only (no fuzzy)
  const genName = getGeneratedNameForBuilding(canonical) || canonical;
  const prodChain = productionChains.find(c => c.name === genName) || productionChains.find(c => c.name === canonical);
  
  if (prodChain?.icon) return prodChain.icon;
  
  const residence = residenceBuildings.find(r => r.name === canonical || r.name === buildingName);
  if (residence?.icon) return residence.icon;
  
  const service = serviceBuildings.find(s => s.name === canonical || s.name === buildingName);
  if (service?.icon) return service.icon;
  
  // Fallback: derive product icon from comprehensive chains by matching building
  const defForBuilding = Object.values(CHAINS_FULL).find(d => d.buildingId === canonical || d.buildingId === buildingName);
  if (defForBuilding) {
    const productIcon = getProductIcon(defForBuilding.id);
    if (productIcon) return productIcon;
  }

  return undefined;
}

/**
 * Get the icon for a product (used for production chain group headers)
 * 
 * @param productName - The name of the product
 * @returns The icon filename or undefined if not found
 */
export function getProductIcon(productName: string): string | undefined {
  // 1) Explicit product icon map
  const direct = PRODUCT_ICON_MAP[productName];
  if (direct) return direct;

  // 2) Some product names equal a building; check overrides directly
  const overrideProduct = BUILDING_ICON_OVERRIDES[productName];
  if (overrideProduct) return overrideProduct;

  // 3) Map product -> main building via comprehensive chains, then reuse building icon logic
  const def = CHAINS_FULL[productName];
  if (def) {
    // Prefer explicit override for the producing building
    const bOverride = BUILDING_ICON_OVERRIDES[def.buildingId];
    if (bOverride) return bOverride;

    // Fallback to generated data icon for the producing building
    const prod = productionChains.find(c => c.name === def.buildingId);
    if (prod?.icon) return prod.icon;
  }

  return undefined;
}

/**
 * Get the full icon source URL for use in img tags
 * 
 * @param icon - The icon filename
 * @param baseUrl - The base URL (typically import.meta.env.BASE_URL)
 * @returns The full icon path or undefined
 */
export function getIconSrc(icon: string | undefined, baseUrl: string): string | undefined {
  return icon ? `${baseUrl}icons/${icon}` : undefined;
}

/**
 * Manual region overrides for buildings that appear in multiple regions.
 * This is the authoritative source for multi-region buildings.
 */

export const BUILDING_REGION_OVERRIDES: Record<string, string[]> = {
    // Old World + Cape Trelawney buildings
    'Sawmill': ['Old World', 'Cape Trelawney', 'New World', 'Arctic'],
    'Schnapps Distillery': ['Old World', 'Cape Trelawney'],
    'Framework Knitters': ['Old World', 'Cape Trelawney'],
    'Brick Factory': ['Old World', 'Cape Trelawney', 'New World'],
    'Slaughterhouse': ['Old World', 'Cape Trelawney'],
    'Flour Mill': ['Old World', 'Cape Trelawney'],
    'Bakery': ['Old World', 'Cape Trelawney'],
    'Sailmakers': ['Old World', 'Cape Trelawney', 'New World'],
    'Furnace': ['Old World', 'Cape Trelawney'],
    'Steelworks': ['Old World', 'Cape Trelawney'],
    'Rendering Works': ['Old World', 'Cape Trelawney'],
    'Soap Factory': ['Old World', 'Cape Trelawney'],
    'Weapon Factory': ['Old World', 'Cape Trelawney'],
    'Malthouse': ['Old World', 'Cape Trelawney'],
    'Brewery': ['Old World', 'Cape Trelawney'],
    'Glassmakers': ['Old World', 'Cape Trelawney'],
    'Window Makers': ['Old World', 'Cape Trelawney'],
    'Artisanal Kitchen': ['Old World', 'Cape Trelawney'],
    'Cannery': ['Old World', 'Cape Trelawney'],
    'Sewing Machine Factory': ['Old World', 'Cape Trelawney'],
    'Fur Dealer': ['Old World', 'Cape Trelawney'],
    'Concrete Factory': ['Old World', 'Cape Trelawney'],
    'Brass Smeltery': ['Old World', 'Cape Trelawney'],
    'Spectacle Factory': ['Old World', 'Cape Trelawney'],
    'Dynamite Factory': ['Old World', 'Cape Trelawney'],
    'Heavy Weapons Factory': ['Old World', 'Cape Trelawney'],
    'Bicycle Factory': ['Old World', 'Cape Trelawney'],
    'Motor Assembly Line': ['Old World', 'Cape Trelawney'],
    'Fuel Station': ['Old World', 'Cape Trelawney'],
    'Goldsmiths': ['Old World', 'Cape Trelawney'],
    'Clockmakers': ['Old World', 'Cape Trelawney'],
    'Filament Factory': ['Old World', 'Cape Trelawney'],
    'Light Bulb Factory': ['Old World', 'Cape Trelawney'],
    'Champagne Cellar': ['Old World', 'Cape Trelawney'],
    'Marquetry Workshop': ['Old World', 'Cape Trelawney'],
    'Jewellers': ['Old World', 'Cape Trelawney'],
    'Gramophone Factory': ['Old World', 'Cape Trelawney'],
    'Coachmakers': ['Old World', 'Cape Trelawney'],
    'Cab Assembly Line': ['Old World', 'Cape Trelawney'],
    'Bootmakers': ['Old World', 'Cape Trelawney'],
    'Tailor\'s Shop': ['Old World', 'Cape Trelawney'],
    'Telephone Manufacturer': ['Old World', 'Cape Trelawney'],
    
    // Enbesa-only buildings
    'Advanced Coffee Roaster': ['Enbesa'],
    'Advanced Rum Distillery': ['Enbesa'],
    'Advanced Cotton Mill': ['Enbesa'],
    'Fried Plantain Kitchen': ['Enbesa'],
    'Linen Mill': ['Enbesa'],
    'Embroiderer': ['Enbesa'],
    'Dry-House': ['Enbesa'],
    'Tea Spicer': ['Enbesa'],
    'Brick Dry-House': ['Enbesa'],
    'Ceramics Workshop': ['Enbesa'],
    'Tapestry Looms': ['Enbesa'],
    'Teff Mill': ['Enbesa'],
    'Wat Kitchen': ['Enbesa'],
    'Pipe Maker': ['Enbesa'],
    
    // New World-only buildings
    'Rum Distillery': ['New World'],
    'Cotton Mill': ['New World'],
    'Poncho Darner': ['New World'],
    'Tortilla Maker': ['New World'],
    'Coffee Roaster': ['New World'],
    'Felt Producer': ['New World'],
    'Bombín Weaver': ['New World'],
    'Cigar Factory': ['New World'],
    'Sugar Refinery': ['New World'],
    'Chocolate Factory': ['New World'],
    
    // Arctic-only buildings
    'Luminer': ['Arctic'],
    'Chandler': ['Arctic'],
    'Lanternsmith': ['Arctic'],
    'Pemmican Cookhouse': ['Arctic'],
    'Sleeping Bag Factory': ['Arctic'],
    'Oil Lamp Factory': ['Arctic'],
    'Parka Factory': ['Arctic'],
    'Sled Frame Factory': ['Arctic'],
    'Husky Sled Factory': ['Arctic'],
};

// Normalize building name for matching
export function normalizeBuildingName(name: string): string {
    return name
        .toLowerCase()
        .replace(/distill\.|distillery/g, 'distillery')
        .replace(/knitters?|knit\./g, 'knitters')
        .replace(/\s+/g, ' ')
        .trim();
}

// Get regions for a building, with fuzzy matching
export function getBuildingRegions(buildingName: string): string[] | undefined {
    // Try exact match first
    if (BUILDING_REGION_OVERRIDES[buildingName]) {
        return BUILDING_REGION_OVERRIDES[buildingName];
    }
    
    // Try normalized matching
    const normalized = normalizeBuildingName(buildingName);
    for (const [key, regions] of Object.entries(BUILDING_REGION_OVERRIDES)) {
        if (normalizeBuildingName(key) === normalized) {
            return regions;
        }
    }
    
    return undefined;
}

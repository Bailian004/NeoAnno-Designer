# Anno 1800 Data Integration Summary

## Successfully Generated Files

### 1. **data/generatedProductionChains.ts** (89 buildings)
Production buildings with complete chain data:
- **Cycle times**: Seconds per production cycle
- **Inputs/Outputs**: Full chain requirements  
- **Workforce**: Type and amount per building
- **Modules**: Field/pasture counts and sizes
- **Cross-referenced**: Identifiers and icons from presets.json

**Example:**
```typescript
{
  name: "Lumberjack's Hut",
  identifier: "Agriculture_arctic_01 (Timber Yard)",
  icon: "A7_wood_log.png",
  region: "The Old World",
  tier: "Farmers",
  size: {x:4, z:4},
  cycleTime: 15,
  outputAmount: 1,
  outputProduct: "Hut",
  inputs: [],
  workforce: {type:"Farmers", amount:5}
}
```

### 2. **data/generatedServiceBuildings.ts** (12 buildings)
Public service buildings with coverage data:
- **Service types**: Marketplace, Church, School, etc.
- **Range**: Street distance or radius coverage
- **Supply info**: Merged from wikiBuildingInfo.json where available

**Coverage Types:**
- **Street distance**: Marketplace (~48 tiles), Church (~72 tiles), Variety Theatre (~96 tiles)
- **Radius**: Fire Station (15 tiles), Trade Union (15 tiles), Town Hall (20 tiles)

### 3. **data/generatedResidences.ts** (7 buildings)
Residence buildings by tier and region:
- Farmer → Worker → Artisan → Engineer → Investor (Old World)
- Jornalero → Obrero (New World)

### 4. **data/generatedSummary.json**
Complete inspection file with all 121 buildings organized by type, region, and tier.

## Data Sources Integrated

1. **# Anno 1800 Building Reference Guid.txt**
   - Production cycle times
   - Input/output ratios
   - Workforce requirements
   - Module counts (fields/pastures)
   - Service ranges

2. **presets.json** (2,302 buildings, 1,475 Anno 1800)
   - Building identifiers
   - Icon filenames
   - Footprints (BuildBlocker)
   - Localization names

3. **wikiBuildingInfo.json** (300 entries)
   - ProductionInfos (119 entries with output amounts)
   - SupplyInfos (26 entries with household coverage)
   - Radius strings

## Coverage by Region

| Region | Buildings | Production | Services | Residences |
|--------|-----------|------------|----------|------------|
| The Old World | 77 | 61 | 9 | 5 |
| The New World | 25 | 19 | 2 | 2 |
| The Arctic | 8 | 8 | 0 | 0 |
| Enbesa | 11 | 11 | 0 | 0 |

## Next Steps to Enable Genetic Solver

### Immediate Implementation
1. **Import generated data** into existing data files or use as-is
2. **Create targetCounts resolver**:
   ```typescript
   function deriveTargetCounts(population: PopulationTarget): BuildingCounts {
     // Use productionChains + consumption rates to calculate
     // required production buildings per tier
   }
   ```

### Missing Pieces
1. **Consumption rates per tier**: How much each resident tier consumes per good (e.g., Workers need 0.00033 bread/s)
2. **Service capacity**: How many residences each service building covers
3. **Building effectiveness**: Base productivity (can use Trade Union items later)

### Workaround
- For now, use **manual targetCounts** or derive from wikiBuildingInfo.json SupplyEntries
- Example: Bakery supplies 55 Workers → divide by residents per house to get coverage

## Files Created

- `/scripts/parseAnnoGuide.js` - Parser script (re-runnable)
- `/data/generatedProductionChains.ts` - Production chains
- `/data/generatedServiceBuildings.ts` - Service buildings
- `/data/generatedResidences.ts` - Residence data  
- `/data/generatedSummary.json` - Full inspection export

## Usage

Import generated data:
```typescript
import { productionChains } from './data/generatedProductionChains';
import { serviceBuildings } from './data/generatedServiceBuildings';
import { residenceBuildings } from './data/generatedResidences';
```

All data is typed and ready for integration with the genetic solver.

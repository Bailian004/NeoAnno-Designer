# Data Flow Architecture - NeoAnno Designer

## Current State: Mixed Old/New System

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TIER 1: DATA SOURCES                               │
└─────────────────────────────────────────────────────────────────────────────┘

                   OLD SYSTEM (Scattered Files)
                   ════════════════════════════

    data/industryData.ts ◄─── data/generatedProductionChains.ts
         │                           │
         ├─ CONSUMPTION_RATES        ├─ productionChains
         ├─ PRODUCTION_CHAINS        └─ ProductionChain interface
         └─ PRODUCTION_CHAINS_FULL
              │
              ├─ data/goodConsumption.ts
              │   └─ GOOD_CONSUMPTION
              │
              ├─ data/productionRates.ts
              │   └─ 271 building rates
              │
              └─ data/buildingRegions.ts
                  └─ Region overrides


                   NEW SYSTEM (Centralized)
                   ════════════════════════

    data/anno1800/index.ts ◄─── data/anno1800/compat.ts
         │                            │
         ├─ productionChains          └─ PRODUCTION_CHAINS_FULL
         │  (per-region)                (rebuilds from new)
         ├─ consumption
         │  (per-region)
         ├─ buildings
         ├─ residents
         ├─ services
         ├─ residences
         ├─ goodsCatalog (59 goods with regions)
         ├─ productionRates (271 rates)
         ├─ aliasMap (42 aliases)
         └─ buildingRegionOverrides


┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIER 2: CALCULATION LAYER                               │
└─────────────────────────────────────────────────────────────────────────────┘

CONSUMPTION CALCULATIONS:
═════════════════════════

data/chainCalculator.ts
  ├─ Imports: CONSUMPTION_RATES from industryData ⚠ OLD
  ├─ Imports: GOOD_CONSUMPTION from goodConsumption ⚠ OLD
  ├─ Functions:
  │   ├─ calculateDemandByPopulation()
  │   └─ calculateChainRequirements()
  └─ Used by: Designer, chainSolver
       │
       └──► utils/chainCalculator.ts ⚠ DUPLICATE NAME!
             ├─ Imports: CONSUMPTION_RATES from industryData ⚠ OLD
             ├─ Imports: PRODUCTION_CHAINS from industryData ⚠ OLD
             ├─ Functions:
             │   └─ calculateChain()
             └─ Used by: Designer.tsx


POPULATION CALCULATIONS:
═══════════════════════

data/advancedPopulationCalculator.ts
  ├─ Imports: CONSUMPTION_RATES from industryData ⚠ OLD
  ├─ Functions:
  │   └─ calculatePopulationNeeds()
  └─ Used by: PopulationManager.ts
       │
       └──► services/PopulationManager.ts
             └─ Used by: Component state


PRODUCTION CALCULATIONS:
═══════════════════════

utils/productionCalculator.ts
  ├─ Imports: GOOD_CONSUMPTION from goodConsumption ⚠ OLD
  ├─ Functions:
  │   └─ calculateGoodDemand()
  └─ Used by: testCalculator script


OPTIMIZATION:
══════════════

data/productionOptimizer.ts
  ├─ Imports: PRODUCTION_CHAINS_FULL from industryData ⚠ OLD
  ├─ Imports: productionChains from generatedProductionChains ⚠ OLD
  └─ Functions:
      └─ optimize()


VALIDATION & NAMING:
════════════════════

data/validators.ts
  ├─ Imports: CONSUMPTION_RATES from industryData ⚠ OLD
  ├─ Imports: PRODUCTION_CHAINS_FULL from industryData ⚠ OLD
  ├─ Imports: productionChains from generatedProductionChains ⚠ OLD
  └─ Functions:
      └─ validate*()

data/naming.ts
  ├─ Imports: PRODUCTION_CHAINS_FULL from industryData ⚠ OLD
  ├─ Imports: productionChains from generatedProductionChains ⚠ OLD
  └─ Functions:
      └─ canonicalizeName()


ICON RESOLUTION: ✓ PARTIALLY UPDATED
═════════════════════════════════════

utils/iconResolver.ts
  ├─ Imports: PRODUCTION_CHAINS_FULL from anno1800/compat ✓ NEW
  ├─ Imports: productionChains from anno1800/index ✓ NEW
  └─ Functions:
      └─ getIconForBuilding()


BUILDING MAPPING:
═════════════════

data/buildingAdapter.ts
  ├─ Imports: productionChains from generatedProductionChains ⚠ OLD
  └─ Functions:
      └─ mapBuildingIdsToCounts()


┌─────────────────────────────────────────────────────────────────────────────┐
│                       TIER 3: COMPONENTS & UI LAYER                          │
└─────────────────────────────────────────────────────────────────────────────┘

components/CalculatorView.tsx  ⚠ PARTIALLY UPDATED
  ├─ Imports: PRODUCTION_CHAINS_FULL from anno1800/compat ✓ NEW
  ├─ Imports: productionChains from generatedProductionChains ⚠ OLD
  ├─ Imports: residenceBuildings from generatedResidences.ts ⚠ OLD
  ├─ Imports: serviceBuildings from generatedServiceBuildings.ts ⚠ OLD
  ├─ Uses: chainCalculator.ts
  ├─ Uses: iconResolver.ts
  └─ State: Region selection, building layout


components/Designer.tsx  ⚠ OLD
  ├─ Imports: PRODUCTION_CHAINS_FULL from industryData ⚠ OLD
  ├─ Uses: chainCalculator.ts
  ├─ Uses: PopulationManager.ts
  ├─ Uses: geneticSolver.ts
  └─ State: Grid state, production setup


components/GridCanvas.tsx
  └─ Pure rendering


components/ResourcePanel.tsx
  └─ Display/reporting


components/HomePage.tsx
  └─ Navigation/menu


┌─────────────────────────────────────────────────────────────────────────────┐
│                      TIER 4: SERVICES & APPLICATION                          │
└─────────────────────────────────────────────────────────────────────────────┘

services/PopulationManager.ts
  └─ Uses: advancedPopulationCalculator.ts ⚠ OLD IMPORTS


services/geneticSolver.ts
  └─ Uses: utils/chainCalculator.ts ⚠ OLD IMPORTS


App.tsx
  └─ Routes to components (CalculatorView, Designer, Home)


┌─────────────────────────────────────────────────────────────────────────────┐
│                            CURRENT PROBLEMS                                  │
└─────────────────────────────────────────────────────────────────────────────┘

❌ MIXED DATA SOURCES
   ├─ iconResolver.ts ✓ Uses new anno1800/compat.ts
   ├─ CalculatorView.tsx ⚠ Mixed (some new, some old)
   ├─ Designer.tsx ⚠ Uses old industryData.ts
   ├─ utils/chainCalculator.ts ⚠ Uses old industryData.ts
   ├─ data/chainCalculator.ts ⚠ Uses old industryData.ts
   ├─ data/naming.ts ⚠ Uses old industryData.ts + generatedProductionChains
   ├─ data/validators.ts ⚠ Uses old industryData.ts + generatedProductionChains
   ├─ data/advancedPopulationCalculator.ts ⚠ Uses old industryData.ts
   ├─ data/productionOptimizer.ts ⚠ Uses old industryData.ts + generatedProductionChains
   └─ data/buildingAdapter.ts ⚠ Uses old generatedProductionChains


❌ DUPLICATE CALCULATORS WITH SAME NAME
   ├─ data/chainCalculator.ts (5 functions, uses CONSUMPTION_RATES)
   └─ utils/chainCalculator.ts (1 function, uses PRODUCTION_CHAINS)
   → Risk: Import ambiguity, duplicate logic


❌ REDUNDANT DATA FILES
   ├─ data/industryData.ts ◄─ Can be replaced with anno1800/compat.ts
   ├─ data/productionRates.ts ◄─ Same as anno1800/rates/productionRates.ts
   ├─ data/buildingRegions.ts ◄─ Same as anno1800/index.ts buildingRegionOverrides
   ├─ data/generatedProductionChains.ts ◄─ Can be replaced with anno1800/index.ts
   ├─ data/generatedResidences.ts ◄─ Can be replaced with anno1800/index.ts
   └─ data/generatedServiceBuildings.ts ◄─ Can be replaced with anno1800/index.ts


❌ CALCULATION INCONSISTENCIES
   ├─ CONSUMPTION_RATES: Record<tier, Record<good, rate>> (per-tier basis)
   ├─ GOOD_CONSUMPTION: Record<good, Record<tier, rate>> (per-good basis)
   → Risk: Different structures cause lookup bugs


✓ CORRECT APPROACH
   ├─ anno1800/index.ts: Single source of truth (per-region data)
   ├─ anno1800/compat.ts: Backwards compatibility bridge
   └─ New consumers should import from anno1800/index


┌─────────────────────────────────────────────────────────────────────────────┐
│                          RECOMMENDED FLOW (Target)                           │
└─────────────────────────────────────────────────────────────────────────────┘

    data/anno1800/index.ts
         │
         ├─ productionChains (per-region)
         ├─ consumption (per-region)
         ├─ buildings
         ├─ residents
         ├─ services
         ├─ residences
         ├─ goodsCatalog
         ├─ productionRates
         ├─ aliasMap
         └─ buildingRegionOverrides
         │
         ├──────────────┬──────────────┬──────────────┬─────────────┐
         │              │              │              │             │
         ▼              ▼              ▼              ▼             ▼
    iconResolver   chainCalculator  population    validators   naming
    (simplified)   (simplified)     calculator               (simplified)


COMPONENTS (All consuming from anno1800/index):
  ├─ CalculatorView.tsx
  ├─ Designer.tsx
  └─ ResourcePanel.tsx
       │
       ├─ PopulationManager.ts
       ├─ geneticSolver.ts
       └─ Production calculators


═════════════════════════════════════════════════════════════════════════════════

## Summary of Changes Needed

| File | Current State | New State | Priority |
|------|---------------|-----------|----------|
| data/chainCalculator.ts | Uses old industryData | Use anno1800/index | HIGH |
| utils/chainCalculator.ts | Uses old industryData | Use anno1800/index | HIGH |
| data/naming.ts | Uses old files | Use anno1800/index | HIGH |
| data/validators.ts | Uses old files | Use anno1800/index | HIGH |
| data/advancedPopulationCalculator.ts | Uses old industryData | Use anno1800/index | HIGH |
| data/productionOptimizer.ts | Uses old industryData | Use anno1800/index | MEDIUM |
| data/buildingAdapter.ts | Uses old generatedProductionChains | Use anno1800/index | MEDIUM |
| components/Designer.tsx | Uses old industryData | Use anno1800/index | HIGH |
| components/CalculatorView.tsx | Mixed | Use anno1800/index | MEDIUM |
| Rename/Consolidate | data/chainCalculator.ts ↔ utils/chainCalculator.ts | Merge or distinguish | LOW |
| Delete Old Files | After all consumers migrated | Remove 5 old data files | FINAL |
```

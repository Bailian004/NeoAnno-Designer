# Data Flow Optimization Analysis

## Current State Assessment: ✅ Mostly Optimal (with minor improvements possible)

The architecture is **good**, but there are **5 consolidation opportunities** that could further streamline the codebase.

---

## 🎯 5 Optimization Opportunities

### **OPPORTUNITY 1: Unify Consumer Data Structures** ⭐⭐⭐ HIGH IMPACT

**Problem**: Two different consumption rate data structures exist
- `CONSUMPTION_RATES`: `Record<tier, ConsumptionNeed[]>` — tier-indexed
- `GOOD_CONSUMPTION`: `Record<good, Record<tier, rate>>` — good-indexed

Both are used in calculators, requiring awkward lookups and dual imports.

**Current Situation**:
```
data/chainCalculator.ts
├─ Imports CONSUMPTION_RATES (tier-indexed)
└─ Imports GOOD_CONSUMPTION (good-indexed)

data/advancedPopulationCalculator.ts
└─ Imports CONSUMPTION_RATES (tier-indexed)

utils/productionCalculator.ts
└─ Imports GOOD_CONSUMPTION (good-indexed)

utils/chainCalculator.ts
└─ Imports CONSUMPTION_RATES (tier-indexed)
```

**Recommendation**: 
- Standardize on **one canonical format** in `anno1800/index.ts`
- Provide **two views** of the same data (tier-indexed AND good-indexed)
- Add helper getters: `getConsumptionByTier(tier)` and `getConsumptionByGood(good)`
- Eliminates duplicate data and import confusion

**Effort**: MEDIUM | **Payoff**: HIGH | **Risk**: LOW

---

### **OPPORTUNITY 2: Consolidate Calculator Files** ⭐⭐⭐ HIGH IMPACT

**Problem**: 4 calculator files with overlapping responsibilities
```
data/chainCalculator.ts (113 lines)
  └─ calculateChainForGood() — single function
  └─ Unused? (only internal recursive calls)

utils/chainCalculator.ts (182 lines)
  └─ calculateIndustryNeeds() — used by Designer.tsx
  └─ getTierRegion() — internal helper
  └─ isGoodCompatible() — internal helper
  └─ Used actively ✓

data/advancedPopulationCalculator.ts (361 lines)
  └─ calculateOptimizedRequirements() — used by PopulationInput.tsx + tests
  └─ Multiple internal helpers
  └─ Used actively ✓

utils/productionCalculator.ts (117 lines)
  └─ calculateBuildingsForPopulation() — different API
  └─ Unused? (calculateGoodDemand uses it but not called anywhere)
```

**Root Cause**: Historical refactors left overlapping calculators

**Current Usage**:
- ✓ `utils/chainCalculator.ts` → Designer.tsx (2 calls)
- ✓ `data/advancedPopulationCalculator.ts` → PopulationInput.tsx + tests (10 calls)
- ❓ `data/chainCalculator.ts` → Only internal (suspicious)
- ❓ `utils/productionCalculator.ts` → Appears unused (suspicious)

**Recommendation**:
1. **Audit `data/chainCalculator.ts`**: Determine if it's dead code. If so, deprecate.
2. **Audit `utils/productionCalculator.ts`**: Determine usage. If unused, deprecate.
3. **Merge remaining calculators** into a single `services/calculationEngine.ts`:
   ```
   CalculationEngine
   ├─ calculateConsumption(population) → demands by good
   ├─ calculateProduction(demands) → production buildings
   ├─ calculateWorkforce(buildings) → workforce by type
   ├─ optimizeChain(demands) → optimized production chain
   └─ calculateServices(population) → service building needs
   ```
4. **Clear naming**: Each export function has one clear responsibility

**Effort**: MEDIUM | **Payoff**: HIGH | **Risk**: MEDIUM (need to verify usage first)

---

### **OPPORTUNITY 3: Eliminate Duplicate Data Files** ⭐⭐ MEDIUM IMPACT

**Problem**: 5 old data files are now redundant with `anno1800/` structure

```
CURRENT (Active):
├─ data/anno1800/index.ts ✓ Single source of truth
└─ data/anno1800/compat.ts ✓ Backwards compat

OBSOLETE (After consumer migration):
├─ data/industryData.ts (can be deleted)
├─ data/productionRates.ts (duplicate of anno1800/rates/)
├─ data/buildingRegions.ts (duplicate of anno1800/index buildingRegionOverrides)
├─ data/generatedProductionChains.ts (duplicate of anno1800/productionChains/)
├─ data/generatedResidences.ts (duplicate of anno1800/residences/)
└─ data/generatedServiceBuildings.ts (duplicate of anno1800/services/)
```

**Recommendation**:
1. **After consumer migration** (Phase 1), delete all old data files
2. **Keep only**: anno1800/ and a single compat.ts if needed
3. **Result**: Bundle size reduction, clearer data ownership

**Effort**: LOW | **Payoff**: MEDIUM | **Risk**: LOW (just cleanup)

---

### **OPPORTUNITY 4: Unify Building/Service/Residence Metadata** ⭐⭐ MEDIUM IMPACT

**Problem**: Three separate concepts (Production Buildings, Service Buildings, Residence Buildings) with different schemas

**Current Structure**:
```
anno1800/
├─ buildings/ (4 files, 146 buildings)
│   └─ BuildingInfo: { buildingId, name, type, size, workforce, icon }
├─ services/ (4 files, 13 services)
│   └─ ServiceBuilding: { name, region, tier, range, service, icon }
└─ residences/ (4 files, 11 residences)
    └─ ResidenceBuilding: { name, region, tier, size, icon }
```

**Problem**: Each has different schemas and metadata fields
- Services have `range` (service coverage), buildings don't
- Residences have `tier`, buildings have `type`
- No unified query interface

**Recommendation**:
1. **Create unified `Building` type** in `anno1800/types.ts`:
   ```typescript
   interface Building {
     buildingId: string;
     name: string;
     region: Region;
     category: 'Production' | 'Service' | 'Residence';
     size: { width: number; height: number };
     icon: string;
     // Optional fields based on category:
     production?: { outputs: string[]; rate: number; workforce: number };
     service?: { type: string; range: ServiceRange };
     residence?: { tier: string; capacity: number };
   }
   ```

2. **Merge into single `anno1800/buildings/` structure** with all 170 buildings

3. **Result**: 
   - Single query: `getBuilding(id)` returns unified schema
   - Better type safety
   - Easier to extend (adding new categories)

**Effort**: MEDIUM | **Payoff**: MEDIUM | **Risk**: MEDIUM (broad schema change)

---

### **OPPORTUNITY 5: Create Calculation Result Cache Layer** ⭐ LOW PRIORITY

**Problem**: Same calculations run repeatedly (Designer rerender, PopulationInput rerender, etc.)

**Current Flow**:
```
Component (render) 
  → calculateOptimizedRequirements() 
    → calculateIndustryNeeds() 
      → multiple passes over consumption data
```

**Recommendation**:
1. Create `services/CalculationCache.ts` with memoization
2. Cache keys: `{ populationHash, selectedGoodsHash, regionHash }`
3. Invalidate on data updates (rare)
4. **Result**: 20-30% faster re-renders

**Effort**: LOW | **Payoff**: LOW (optimization only) | **Risk**: LOW

---

## 📊 Optimization Priority Matrix

| Opportunity | Impact | Effort | Risk | Blocker? |
|------------|--------|--------|------|----------|
| 1. Unify Consumption Data | HIGH | MEDIUM | LOW | ❌ No — can do anytime |
| 2. Consolidate Calculators | HIGH | MEDIUM | MEDIUM | ❌ No — audit first |
| 3. Delete Old Files | MEDIUM | LOW | LOW | ✅ YES — after Phase 1 |
| 4. Unify Building Schema | MEDIUM | MEDIUM | MEDIUM | ❌ No — architectural |
| 5. Calculation Cache | LOW | LOW | LOW | ❌ No — nice-to-have |

---

## ✅ What's Already Optimal

1. **Per-region data structure** — Perfect for multi-region support
2. **Central index pattern** — Clean dependency injection point
3. **Backwards compat layer** — Smooth migration path
4. **Type coverage** — Good interface definitions
5. **Export organization** — Clear separation of concerns

---

## 🎯 Recommended Next Steps

**If you want to proceed with optimization:**

1. **Immediate (Quick wins)**:
   - [ ] Audit `data/chainCalculator.ts` — is it used?
   - [ ] Audit `utils/productionCalculator.ts` — is it used?

2. **Phase 1 (Consumer migration)**: Just update imports first ✅

3. **Phase 2 (Light optimization)**: 
   - Unify consumption data structures (Opportunity 1)
   - Consolidate calculator files (Opportunity 2)

4. **Phase 3 (Cleanup)**:
   - Delete old data files (Opportunity 3)

5. **Phase 4 (Architecture)**:
   - Unify Building schema (Opportunity 4) — *optional*
   - Add calculation cache (Opportunity 5) — *optional*

---

## Current Recommendation

**🟢 Current flow is ~85% optimal.** The main inefficiency is **calculator consolidation** and **data structure duplication**, not the overall architecture.

**Suggest**: 
1. Complete Phase 1 (consumer migration) **first** — gives you clarity on what's actually used
2. Then pursue Opportunities 1-2 based on real usage patterns
3. Defer Opportunities 4-5 unless you hit real pain points

This way you don't over-engineer — you optimize based on actual code behavior.

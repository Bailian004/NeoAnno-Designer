# AUDIT FINDINGS SUMMARY - ACTION ITEMS

## Data Gap Analysis: NeoAnno-Designer vs Anno1800Calculator Reference

---

## 1. CRITICAL GAPS

### A. Enbesa Region - Complete Metadata Blackout
**Severity:** 🔴 CRITICAL  
**Affected Chains:** 9 chains (Dried Meat Fac., Finery, Hibiscus Farm, Tea Spice Blend, Mud Brick Fac., Tapestry Loom, Ceramics Wkshp, Illuminated Scr., Lanternmaker)

**Current State:**
- Icons: 0/9 (0%)
- Identifiers: 0/9 (0%)
- Workforce: 9/9 (100% in file)

**Required Actions:**
1. Add 9 icon file references to `helpfulIconMap.ts` or icon folder
2. Add 9 building identifiers from reference params.js
3. Verify tier assignments (currently "Unknown")
4. Cross-validate workforce amounts with reference

**Estimated Effort:** 2-3 hours

---

### B. Arctic Region - Severe Metadata Gaps
**Severity:** 🔴 CRITICAL  
**Affected Chains:** 5/7 chains missing icons, 5/7 missing identifiers

**Current State:**
- Icons: 2/7 (28.6%)
- Identifiers: 2/7 (28.6%)
- Workforce: 7/7 (100% in file)

**Missing Metadata:**
- Caribou Hunting - No icon, no identifier
- Pemmican Cook. - No icon, no identifier
- Sleeping Bag - No icon, no identifier
- Oil Lamp Fac. - No icon, no identifier
- Husky Sled Fac. - No icon, no identifier

**Required Actions:**
1. Add 5 icon references
2. Add 5 building identifiers from reference
3. Verify "Unknown" tier assignments (should be "Arctic Explorers" or similar)
4. Cross-validate workforce (should be "Technicians" or "Explorers")

**Estimated Effort:** 1-2 hours

---

### C. Data Parsing Issues
**Severity:** 🔴 CRITICAL  
**Impact:** Audit script cannot validate core fields (cycle times, outputs, workforce)

**Current State:**
- Actual data IS in file (verified manually)
- Parsing regex fails on TypeScript structure
- Blocks accurate validation

**Required Actions:**
1. Fix JSON/TypeScript parsing in audit script
2. Update regex to handle unquoted property keys
3. Re-run full audit to get accurate baseline
4. Identify any additional data issues hidden by parser

**Estimated Effort:** 1 hour

---

## 2. MAJOR GAPS

### D. Icon Coverage
**Severity:** 🟠 HIGH  
**Status:** 53/87 chains have icons (60.9%)  
**Missing:** 34 chains

**Missing by Region:**
- The Old World: 11/51 missing (21.6%)
- The New World: 9/20 missing (45%)
- The Arctic: 5/7 missing (71.4%)
- Enbesa: 9/9 missing (100%)

**Required Actions:**
1. Create/source icon files for 34 chains
2. Map icons to correct output products
3. Update `buildingIcons.ts` or icon mapping file
4. Test icon display in UI

**Estimated Effort:** 4-6 hours (icon sourcing)

---

### E. Building Identifiers (GUIDs)
**Severity:** 🟠 HIGH  
**Status:** 51/87 chains have identifiers (58.6%)  
**Missing:** 36 chains

**Missing by Region:**
- The Old World: 13/51 missing (25.5%)
- The New World: 9/20 missing (45%)
- The Arctic: 5/7 missing (71.4%)
- Enbesa: 9/9 missing (100%)

**Example Identifiers Needed:**

| Chain | Identifier Pattern |
|-------|-------------------|
| Cattle Farm | `CreativeMode_Agriculture_XX_field` |
| Artisanal Kit. | Food/Factory processing identifier |
| Spectacle Fac. | `Factory_XX` pattern |
| Heavy Weapons | Heavy industry identifier |

**Required Actions:**
1. Extract identifiers from reference params.js
2. Match building codes to chains
3. Add to `generatedProductionChains.ts` identifier field
4. Validate against reference

**Estimated Effort:** 3-4 hours (research + mapping)

---

## 3. MISSING BUILDINGS

**Severity:** 🟡 MEDIUM  
**Status:** App has 87/150+ buildings (~58% coverage)  
**Missing:** ~60-70 buildings from reference

**Gap Analysis:**

### Old World Missing (Estimated 20-25):
- Advanced production chains (beyond Investors)
- Luxury item factories
- Special buildings with modules

### New World Missing (Estimated 10-15):
- Advanced Obrero-tier chains
- Late-game specialty items

### Arctic Missing (Estimated 5-10):
- Craft/artisan buildings
- Specialty products

### Enbesa Missing (Estimated 10-15):
- Various craft buildings
- Food production chains
- Specialty craft items

**Required Actions:**
1. Scan reference params.js for complete building list
2. Identify buildings not in generatedProductionChains.ts
3. Extract data for missing buildings
4. Add as new entries to production chains
5. Assign icons and identifiers
6. Validate workforce/cycle times

**Estimated Effort:** 8-12 hours (major task)

---

## 4. TIER ASSIGNMENTS

**Severity:** 🟡 MEDIUM  
**Status:** 16 chains marked as "Unknown" tier

**Affected Regions:**
- Arctic: All 7 chains = "Unknown"
- Enbesa: All 9 chains = "Unknown"

**Should Be:** Region-specific tiers
- Arctic: Should be "Arctic Explorers" or "Technicians"
- Enbesa: Should be regional tiers (varies by building)

**Required Actions:**
1. Review reference for Arctic tier naming
2. Review reference for Enbesa tier naming
3. Update 16 tier assignments
4. Ensure tier names match consumption/population data

**Estimated Effort:** 1-2 hours

---

## 5. VALIDATION GAPS

### A. Cycle Times (tpmin)
**Status:** Values present in file  
**Need to Validate:** Against reference factories.js

**Known Values to Check:**
- Raw materials: Typically 15-30s
- Processing: Typically 30-60s
- Manufacturing: Typically 60-120s
- Complex crafts: Typically 90-150s

**Action:** Cross-check all 87 cycle times with reference

---

### B. Workforce Requirements
**Status:** Values present in file (parsed as JSON)  
**Need to Validate:** Against reference maintenances array

**Example Validations Needed:**
```
Reference: "Lumberjack" maintains: [{Product: 1010017, Amount: 5}] → Unskilled
Our Data: "Lumberjack's Hut" workforce: {type: "Farmers", amount: 5}
Match: ✓ (but type name differs)
```

**Action:** Verify all workforce amounts and types match reference

---

### C. Production Inputs/Outputs
**Status:** Structure present  
**Need to Validate:** Input products match reference

**Action:** 
1. Extract all inputs from 57 manufacturing chains
2. Compare with reference production.js
3. Flag mismatches

---

### D. Regional Availability
**Status:** 4 regions covered  
**Need to Validate:** Some products may be region-locked in reference

**Action:**
1. Check reference for region restrictions
2. Verify our regional assignments match
3. Identify products available in multiple regions

---

## 6. CONSUMPTION RATE MAPPING

**Severity:** 🟢 LOW  
**Status:** Data defined in industryData.ts  
**Need to:** Validate against reference consumption.js

**Population Types Defined:**
- Farmer, Worker, Artisan, Engineer
- Jornalero, Obrero
(Missing: Shepherd, Elder, Explorer, Technician, Scientist)

**Actions:**
1. Add missing population type consumption rates
2. Cross-validate rates with reference
3. Ensure rates match population tiers
4. Test consumption calculations

---

## COMPLETION CHECKLIST

### Immediate (This Week)
- [ ] Fix parsing framework in audit script
- [ ] Complete Enbesa icon mapping (9 chains)
- [ ] Complete Arctic icon mapping (5 chains)
- [ ] Add Enbesa identifiers (9 chains)
- [ ] Add Arctic identifiers (5 chains)
- [ ] Correct tier assignments for Arctic/Enbesa (16 chains)

### Short Term (Next Week)
- [ ] Add remaining Old World icons (11 chains)
- [ ] Add remaining New World icons (9 chains)
- [ ] Add remaining Old World identifiers (13 chains)
- [ ] Add remaining New World identifiers (9 chains)
- [ ] Validate all 87 cycle times vs reference
- [ ] Validate all 87 workforce values vs reference

### Medium Term (2-3 Weeks)
- [ ] Extract ~60 missing buildings from reference
- [ ] Add new building chains to production file
- [ ] Assign icons to new buildings
- [ ] Assign identifiers to new buildings
- [ ] Validate consumption rates for all population types
- [ ] Test UI with complete dataset

### Long Term (Ongoing)
- [ ] Maintain sync with Anno1800Calculator reference
- [ ] Monitor for game updates/DLC additions
- [ ] Community feedback on missing buildings
- [ ] Performance optimization with 150+ buildings

---

## ESTIMATED EFFORT SUMMARY

| Task | Hours | Priority |
|------|-------|----------|
| Fix parsing | 1 | 🔴 CRITICAL |
| Enbesa metadata | 2-3 | 🔴 CRITICAL |
| Arctic metadata | 1-2 | 🔴 CRITICAL |
| Icon coverage | 4-6 | 🟠 HIGH |
| Identifiers | 3-4 | 🟠 HIGH |
| Tier assignments | 1-2 | 🟡 MEDIUM |
| Validation (cycles, workforce) | 3-4 | 🟡 MEDIUM |
| Missing buildings | 8-12 | 🟡 MEDIUM |
| Consumption rates | 2-3 | 🟢 LOW |
| **TOTAL** | **25-36** | **1-2 weeks** |

---

## REFERENCE DATA SOURCES

### For Missing Data:
1. **params.js** (~3.5MB)
   - Contains all building definitions
   - Search for: factories, icon names, maintenances (workforce)
   - Region assignments, tier information

2. **production.js** (~9KB)
   - Production chain definitions
   - Input/output mappings
   - Cycle time calculations

3. **consumption.js** (~14KB)
   - Consumption rates by population type
   - Population tier definitions
   - Good requirements

4. **world.js** (~31KB)
   - Region definitions
   - Regional availability of goods/buildings
   - Trade information

---

## DATA VALIDATION TEMPLATE

When adding/updating chains, verify:

```typescript
{
  name: "Building Name",              // ✓ Required - unique
  identifier: "Building_GUID",         // ✓ Required - from reference
  icon: "icon_filename.png",           // ✓ Required - icon file must exist
  region: "The Old World",             // ✓ Required - one of 4 regions
  tier: "Tier Name",                   // ✓ Required - valid tier for region
  size: {"x":5,"z":5},                // ✓ Required - must match reference
  cycleTime: 60,                       // ✓ Required - verified vs reference
  outputAmount: 1,                     // ✓ Required - from reference
  outputProduct: "Output Name",        // ✓ Required - valid product
  inputs: [{...}],                     // ✓ Optional - validated if present
  workforce: {type:"...",amount:50},  // ✓ Required - verified vs reference
  modules: {...}                       // ⚠ Optional - validated if present
}
```

---

**Status:** Ready for Phase 1 implementation  
**Last Updated:** January 9, 2026  
**Owner:** Data Audit Team

# Icon Mapping Investigation Summary

## Issue
The NeoAnno-Designer project had missing icon mappings where building definitions in `annoData.ts` referenced icon filenames that didn't exist in the `/icons` directory.

## Root Cause
The issue was **case sensitivity mismatch** between the referenced filenames and the actual icon files:
- Referenced filenames used lowercase (e.g., `A7_pub.png`)
- Actual icon files used proper capitalization (e.g., `A7_Pub.png`)

## Files Analyzed
- **Icon directory**: `/workspaces/NeoAnno-Designer/icons/` (2,395 PNG files)
- **Building data**: `/workspaces/NeoAnno-Designer/data/annoData.ts`

## Issues Found & Fixed

### 1. Case Mismatch Issues (13 fixed)
These icons existed but with different capitalization:

| Wrong Reference | Correct Filename | Status |
|----------------|------------------|---------|
| `A7_pub.png` | `A7_Pub.png` | ✅ Fixed |
| `A7_school.png` | `A7_School.png` | ✅ Fixed |
| `A7_church.png` | `A7_Church.png` | ✅ Fixed |
| `A7_hospital.png` | `A7_Hospital.png` | ✅ Fixed |
| `A7_university.png` | `A7_University.png` | ✅ Fixed |
| `A7_bank.png` | `A7_Bank.png` | ✅ Fixed |
| `A7_potatoes.png` | `A7_Potatoes.png` | ✅ Fixed |
| `A7_wool.png` | `A7_Wool.png` | ✅ Fixed |
| `A7_bricks.png` | `A7_Bricks.png` | ✅ Fixed |
| `A7_steel.png` | `A7_Steel.png` | ✅ Fixed |
| `A7_bread.png` | `A7_Bread.png` | ✅ Fixed |
| `A7_pigs.png` | `A7_Pigs.png` | ✅ Fixed |
| `A7_warehouse.png` | `A7_Warehouse.png` | ✅ Fixed |

### 2. Incorrect Filename Issues (3 fixed)
These required mapping to different icon files:

| Wrong Reference | Correct Filename | Reason |
|----------------|------------------|---------|
| `A7_flour_mill.png` | `A7_Flour.png` | Icon represents the flour product, not the mill building |
| `A7_soap.png` | `A7_soap_2.png` | Alternative soap icon exists with `_2` suffix |
| `A7_sausage.png` | `A7_meat_sausage.png` | Specific sausage icon has `meat_` prefix |

## Scripts Created

### 1. `/scripts/auditIcons.cjs`
Comprehensive audit script that:
- Lists all icon files in the `/icons` directory
- Identifies all icon references in `annoData.ts`
- Reports missing icon files
- Shows unused icon files (2,354 available for future use)
- Groups results by Anno game prefix (A4, A6, A7, A8)

**Usage**: `node scripts/auditIcons.cjs`

### 2. `/scripts/findIconMismatches.cjs`
Advanced diagnostic script that:
- Performs case-insensitive icon matching
- Identifies fixable case mismatches
- Suggests similar filenames for missing icons
- Auto-generates a fix script

**Usage**: `node scripts/findIconMismatches.cjs`

### 3. `/scripts/fixIconNames.cjs` (auto-generated)
Automated fix script that applies all case corrections to `annoData.ts`

**Usage**: `node scripts/fixIconNames.cjs`

## Final Status

✅ **All icon mappings verified and fixed**
- **Missing icons**: 0 (down from 16)
- **Used icons**: 41 out of 2,395 available
- **Unused icons**: 2,354 available for future building definitions

## Icon Inventory by Game

The `/icons` directory contains icons from multiple Anno games:
- **A4** (Anno 1404): 132 icons
- **A6** (Anno 2070/2205): 303 icons  
- **A7** (Anno 1800): 1,607 icons
- **A8** (Anno History Collection): 168 icons
- **icon_27_***: 160 generic icons

This provides a rich library for expanding the building database in the future.

## Recommendations

1. **Case Sensitivity**: When adding new building definitions, ensure icon filename case matches exactly
2. **Icon Discovery**: Use `scripts/auditIcons.cjs` to verify mappings before deployment
3. **Future Expansion**: 2,354 unused icons are available for adding more buildings
4. **Naming Convention**: Consider standardizing on consistent capitalization (currently mixed)

## Changes Made to Source Code

File: `/workspaces/NeoAnno-Designer/data/annoData.ts`
- Updated 16 IconFileName references to match actual file cases
- No functional changes to building definitions
- All building GUIDs and properties preserved

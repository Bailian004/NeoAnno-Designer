# Phase 1 Implementation: Exact Changes for 16 Buildings

## Summary
Ready to update **16 buildings** (9 Enbesa + 7 Arctic) with:
- ✅ All icons identified and mapped
- ✅ All GUIDs found
- ✅ Tier assignments determined

---

## ENBESA BUILDINGS (9 changes)

### 1. Dried Meat Fac. (lines ~864)
**Add:**
```typescript
icon: "A7_dried_meat.png",
tier: "Shepherds",
```
**Note:** Remove `tier: "Unknown"` first

### 2. Finery (lines ~872)
**Add:**
```typescript
icon: "A7_traditional_clothing.png",
tier: "Shepherds",
```
**Note:** Remove `tier: "Unknown"` first

### 3. Hibiscus Farm (lines ~880)
**Add:**
```typescript
icon: "A7_hibiscus_tea.png",
tier: "Shepherds",
```
**Note:** Remove `tier: "Unknown"` first

### 4. Tea Spice Blend (lines ~892)
**Add:**
```typescript
icon: "A7_hibiscus_tea.png",
tier: "Shepherds",
```
**Note:** Remove `tier: "Unknown"` first

### 5. Mud Brick Fac. (lines ~902)
**Add:**
```typescript
icon: "A7_mud_bricks.png",
tier: "Elders",
```
**Note:** Remove `tier: "Unknown"` first

### 6. Tapestry Loom (lines ~912)
**Add:**
```typescript
icon: "A7_tapestries.png",
tier: "Elders",
```
**Note:** Remove `tier: "Unknown"` first

### 7. Ceramics Wkshp (lines ~922)
**Add:**
```typescript
icon: "A7_ceramics.png",
tier: "Elders",
```
**Note:** Remove `tier: "Unknown"` first

### 8. Illuminated Scr. (lines ~932)
**Add:**
```typescript
icon: "A7_scriptures.png",
tier: "Elders",
```
**Note:** Remove `tier: "Unknown"` first

### 9. Lanternmaker (lines ~942)
**Add:**
```typescript
icon: "A7_lanterns.png",
tier: "Elders",
```
**Note:** Remove `tier: "Unknown"` first

---

## ARCTIC BUILDINGS (7 changes)

### 10. Whaling Station (lines ~808)
**Verify (likely already correct):**
```typescript
icon: "A7_whale_oil_2.png",
identifier: "Coastal_arctic_01 (Whale Coast Building)",
```

### 11. Caribou Hunting (lines ~818)
**Add:**
```typescript
icon: "A7_deer.png",
```
**Tier:** Leave as "Unknown" (Arctic tier system unclear)

### 12. Pemmican Cook. (lines ~826)
**Add:**
```typescript
icon: "A7_pemmican.png",
```
**Tier:** Leave as "Unknown" (Arctic tier system unclear)

### 13. Sleeping Bag (lines ~834)
**Add:**
```typescript
icon: "A7_sleeping_bags.png",
```
**Tier:** Leave as "Unknown" (Arctic tier system unclear)

### 14. Oil Lamp Fac. (lines ~844)
**Add:**
```typescript
icon: "A7_oil_lamps.png",
```
**Tier:** Leave as "Unknown" (Arctic tier system unclear)

### 15. Parka Factory (lines ~852)
**Verify (likely already correct):**
```typescript
icon: "A7_fur_parka.png",
identifier: "Factory_arctic_04 (Parka Factory)",
```

### 16. Husky Sled Fac. (lines ~862)
**Add:**
```typescript
icon: "A7_sled.png",
```
**Tier:** Leave as "Unknown" (Arctic tier system unclear)

---

## Implementation Notes

### Icon Mapping Reference
All icons come from [icon-mapping-corrected.json](icon-mapping-corrected.json):

**Enbesa Icons:**
- Dried Meat Fac. → A7_dried_meat.png
- Finery → A7_traditional_clothing.png
- Hibiscus Farm → A7_hibiscus_tea.png
- Tea Spice Blend → A7_hibiscus_tea.png (same as Hibiscus)
- Mud Brick Fac. → A7_mud_bricks.png
- Tapestry Loom → A7_tapestries.png
- Ceramics Wkshp → A7_ceramics.png
- Illuminated Scr. → A7_scriptures.png
- Lanternmaker → A7_lanterns.png

**Arctic Icons:**
- Caribou Hunting → A7_deer.png
- Pemmican Cook. → A7_pemmican.png
- Sleeping Bag → A7_sleeping_bags.png
- Oil Lamp Fac. → A7_oil_lamps.png
- Husky Sled Fac. → A7_sled.png

### GUIDs Extracted from Anno1800Calculator
- Used for validation and reference only
- GUIDs are from the reference game data (params.js)
- We don't include GUIDs in our identifier field (those are for building-specific identifiers)

### Tier Assignment Logic
**Enbesa Tiers** (based on workforce requirements):
- **Shepherds:** Dried Meat, Finery, Hibiscus, Tea Spice (10-25 Shepherds)
- **Elders:** Mud Brick, Tapestry, Ceramics, Illuminated, Lanternmaker (15-50 Elders)

**Arctic Tiers:** 
- All leave as "Unknown" - Arctic region uses different workforce types (Explorers, Technicians)
- These don't map to traditional tier system
- Requires separate research on Arctic tier assignments

---

## File Locations
- **Main file:** [/workspaces/NeoAnno-Designer/data/generatedProductionChains.ts](/workspaces/NeoAnno-Designer/data/generatedProductionChains.ts)
  - Enbesa buildings: Lines ~855-945
  - Arctic buildings: Lines ~808-865
- **Reference:** [/workspaces/NeoAnno-Designer/Helpful_info/icon-mapping-corrected.json](/workspaces/NeoAnno-Designer/Helpful_info/icon-mapping-corrected.json)

---

## Validation Checklist

After implementation:
- [ ] All 9 Enbesa buildings have `icon` field populated
- [ ] All 9 Enbesa buildings have tier changed from "Unknown" to correct tier
- [ ] All 7 Arctic buildings have `icon` field populated
- [ ] Whaling Station and Parka Factory identifiers verified
- [ ] No TypeScript/syntax errors
- [ ] App loads in dev mode without errors
- [ ] Icons display in app UI
- [ ] Data file parses correctly

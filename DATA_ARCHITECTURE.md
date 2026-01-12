# Remote Data Architecture Implementation Guide

## Summary

This document outlines the new architecture for NeoAnno-Designer that separates **raw canonical data** (loaded from the remote `neoanno-data` repository) from a **compiled runtime model** (optimized indexes and lookups).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  neoanno-data Repository (GitHub Pages)                     │
│  https://bailian004.github.io/neoanno-data/                 │
│  - versions/latest.json (version manifest)                  │
│  - anno1800/v2.0.1/buildings.json, goods.json, etc.         │
└─────────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────────────────┐
              │  loadAnnoData()      │
              │  (fetch + cache)     │
              └──────────────────────┘
                         ↓
              ┌──────────────────────┐
              │  Anno1800Data        │
              │  (raw canonical)     │
              └──────────────────────┘
                         ↓
              ┌──────────────────────┐
              │  compileModel()      │
              │  (pure function)     │
              └──────────────────────┘
                         ↓
              ┌──────────────────────┐
              │  CompiledModel       │
              │  (indexes + lookups) │
              └──────────────────────┘
                         ↓
              ┌──────────────────────┐
              │  DataContext         │
              │  (React Provider)    │
              └──────────────────────┘
                         ↓
              ┌──────────────────────┐
              │  UI Components       │
              │  (read from context) │
              └──────────────────────┘
```

## New Files

### 1. `src/lib/neoanno-data.ts`
**Responsibility:** Network + caching layer

- Fetches versioned JSON files from GitHub Pages with optional raw.githubusercontent fallback
- Implements localStorage caching with 24h TTL
- Supports dev mode for local development
- Returns `{ version, data }`

**Example Usage:**
```typescript
const { version, data } = await loadAnnoData({
  pagesBaseUrl: "https://bailian004.github.io/neoanno-data",
  devMode: import.meta.env.DEV,
});
```

### 2. `src/lib/compile-model.ts`
**Responsibility:** Pure compilation to optimized indexes

- Builds all lookup maps from raw data (one-time per load)
- Creates:
  - `buildingsById`, `goodsById`, `servicesById`, `residentsById`, `itemsByGuid`
  - GUID ↔ ID mappings
  - Production chain indexes (`goodProducers`, `buildingRecipes`)
  - Service provider indexes
  - Influence radius indexes
  - Docklands importables
  - Item targeting indexes
- **No network calls, no side effects—pure function**

**Example Usage:**
```typescript
const model = compileModel(rawData);
const building = model.buildingsById.get('my-building-id');
const producers = model.goodProducers.get('my-good-id');
```

### 3. `src/context/DataContext.tsx`
**Responsibility:** React integration + single source of truth

- Wraps the app and manages data lifecycle
- Loads data on mount
- Compiles model via `useMemo` (recompiles only if raw data changes)
- Exposes via `useData()` hook
- Provides: `rawData`, `model`, `dataVersion`, `loading`, `error`, `reload()`

**Example Usage:**
```typescript
const { model, loading, error } = useData();

if (loading) return <Spinner />;
if (error) return <Error msg={error} />;
if (!model) return null;

const building = model.buildingsById.get(id);
```

### 4. `components/DataStatus.tsx`
**Responsibility:** UI indicator

- Shows data version in navbar
- Displays loading spinner while fetching
- Shows error indicator if load fails

## Integration Pattern

### Step 1: Wrap App with Provider

In `App.tsx`:
```tsx
import { DataProvider } from './src/context/DataContext';

function App() {
  return (
    <DataProvider>
      <AppStateProvider>
        <RoutedApp />
      </AppStateProvider>
    </DataProvider>
  );
}
```

### Step 2: Use Data in Components

In any component:
```tsx
import { useData } from '../src/context/DataContext';

export const MyComponent = () => {
  const { model, loading } = useData();
  
  if (loading) return <div>Loading...</div>;
  if (!model) return null;
  
  const myBuilding = model.buildingsById.get('some-id');
  return <div>{myBuilding?.name}</div>;
};
```

## Incremental Adoption Strategy

**Do NOT rewrite everything at once.** Follow this order:

1. **Phase 1: Building List** ← Start here
   - Replace direct imports of buildings with `model.buildingsById`
   - Test in Designer / sandbox view
   - Verify: Buildings render, details work

2. **Phase 2: Goods & Production**
   - Replace production chain imports with `model.buildingRecipes`, `model.goodProducers`
   - Update chain calculators to use compiled indexes
   - Verify: Chain details, production chains work

3. **Phase 3: Services & Residents**
   - Replace service/resident imports with `model.servicesById`, `model.residentsById`
   - Update population calculator to use indexes
   - Verify: Population needs, services render

4. **Phase 4: Advanced Features**
   - Docklands: use `model.docklandsImportableGoods`
   - Item targeting: use `model.itemTargets`
   - Influence: use `model.influenceByBuilding`

### While Transitioning

If legacy code needs old data structures, create **adapter functions** in `src/lib/adapters/` that bridge the gap:

```typescript
// src/lib/adapters/legacyAdapter.ts
export function toOldBuildingFormat(compiledBuilding: CompiledBuilding) {
  return { ...compiledBuilding, /* adapt fields */ };
}
```

**But avoid duplicating logic.** Always compute derived values from the compiled model, not by re-importing local JSON.

## Data Version Management

### Pinning a Version

In `DataContext.tsx`, pass `pinnedVersion`:

```typescript
const { version, data } = await loadAnnoData({
  // ...
  pinnedVersion: "v2.0.1", // pins to this version
});
```

### Version Display

The `<DataStatus />` component in the navbar shows:
- `vX.Y.Z` when loaded
- Loading spinner while fetching
- ⚠ indicator if error

## Development Mode

In dev mode (`import.meta.env.DEV`), the loader:
- Connects to `http://localhost:3000` instead of GitHub Pages
- Disables caching (always fetches fresh)
- Useful for testing data changes locally

Requires a local server serving the neoanno-data repository structure.

## Type Safety

All new code is fully typed:

```typescript
// Raw data types
type Anno1800Data = { buildings: any[], goods: any[], ... }

// Compiled model type
type CompiledModel = {
  buildingsById: Map<string, CompiledBuilding>,
  goodsById: Map<string, CompiledGood>,
  // ... all indexes
}

// Context hook
const { model }: DataContextShape = useData();
```

**Benefit:** IDE autocomplete, catch errors at compile time.

## Constraints & Rules

1. **No heavy computation during render.**
   - All indexes are pre-built in `compileModel()`.
   - Components only read from indexes.

2. **No repeated "build map from array" in components.**
   - All derived data is in `CompiledModel`.

3. **GUID lookups are normalized in compilation.**
   - Use `model.buildingGuidToId.get(guid)` if needed.

4. **Graceful degradation.**
   - Missing IDs log warnings but don't crash.
   - Components check `if (!model)` before accessing.

5. **No breaking changes to existing components (yet).**
   - Existing features continue to work with local data.
   - Incrementally replace imports as you refactor.

## Testing the Integration

### Quick Test
1. Start the app: `npm run dev`
2. Look at the navbar → should see data version (e.g., `v2.0.1`)
3. No console errors
4. Check browser Network tab → data loads from GitHub Pages

### Full Test
1. Build: `npm run build` (should succeed)
2. Dev mode: `npm run dev` (should load without errors)
3. Open any component using `useData()` → should render without crashes

### Dev Mode Testing
1. Clone [neoanno-data repo](https://github.com/Bailian004/neoanno-data)
2. Serve locally on port 3000
3. Set `devMode: true` in `DataContext.tsx`
4. Data should load from localhost

## FAQ

**Q: Will this break existing components?**
A: No. Existing components still work. This provides a new data path. Migrate incrementally.

**Q: How much memory does caching use?**
A: Typical cache is ~5MB (all files for one version). localStorage default limit is 5–10MB per domain.

**Q: What if GitHub Pages is down?**
A: The loader falls back to raw.githubusercontent.com. If both fail, the app shows an error but can use stale cache if available.

**Q: Can I pin data to a specific version?**
A: Yes. Pass `pinnedVersion: "v2.0.1"` to `loadAnnoData()`.

**Q: How do I add checksums?**
A: The loader supports optional SHA256 validation. Pass manifests with `sha256` fields and set `validateChecksums: true`.

## Next Steps

1. **Verify build & dev mode work** ✓ (done)
2. **Start Phase 1:** Refactor building display to use `model.buildingsById`
3. **Test in Designer component**
4. **Proceed to Phase 2 (production chains), etc.**

## Files Changed

- `App.tsx`: Added DataProvider wrapper
- `state/AppState.tsx`: Removed unused data imports (imports still exist but will be cleaned up)
- `components/Navbar.tsx`: Added DataStatus indicator
- `components/DataStatus.tsx`: New component
- `src/lib/neoanno-data.ts`: New data loader
- `src/lib/compile-model.ts`: New compilation logic
- `src/context/DataContext.tsx`: New React context

---

**Status:** Infrastructure complete, ready for incremental adoption.

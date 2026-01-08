# Required Fixes and Follow-ups

This document captures known gaps and planned fixes so they aren’t lost.

## Status Snapshot
- Canonical naming introduced (products/buildings) and used across optimizer + icons.
- Reference JSON typo fixed: Penny Farthings.
- Production chains render with full dependencies; icons use canonical + product fallback.
- Dev validator added: logs missing product/icon/workforce.

## High-Priority Fixes
- Workforce coverage: Add workforce data for advanced buildings not present in generated data.
  - Validator flags examples: Bombin Weaver, Cab Assembly Line, Bootmakers, Tailors Shop, Telephone Manufacturer, Oil Lamps Factory, Goat Farm, Embroiderer, Dry-House, Tea Spicer, Brick Dry-House, Ceramics Workshop, Wat Kitchen, Pipe Maker, Luminer, Lanternsmith, Pemmican Cookhouse, Sleeping Bag Factory, Husky Sled Factory.
  - Approach: Add a canonical→workforce fallback map or enhance generator to include these.

- Icon coverage: Ensure icons for all canonical building names.
  - Added overrides for common names (e.g., Sewing Machine Factory, Spectacle Factory, Motor Assembly Line, Gramophone Factory, Cab Assembly Line, Bombin Weaver, Fried Plantain Kitchen, Heavy Weapons Factory, Light Bulb Factory, Champagne Cellar).
  - Remaining: Add overrides for the rest of validator-flagged names listed above if product fallback is undesirable.

- Data regeneration (Option A, completion):
  - Regenerate `data/generatedProductionChains.ts` so `outputProduct` uses product names and building names are not truncated (removes need for `generatedProductionChainsFixed.ts`).
  - Remove legacy fuzzy matching permanently (already removed in runtime) and rely solely on canonicalization.

## Medium-Priority Fixes
- Tailwind in production:
  - Replace `cdn.tailwindcss.com` usage with proper Tailwind setup via PostCSS or CLI (per console warning).
  - Update `index.html` and add Tailwind config.

- Validator UX + CI:
  - Add a small dev-only panel to display validator results (instead of console only).
  - Add a CI check (Node script) that imports `validateData()` and fails on issues.

- Bundle size:
  - Address large chunk warnings by introducing manual chunks or dynamic imports.

## Dev Notes / Decisions
- Source of truth:
  - Chains: `data/industryData.ts` → `PRODUCTION_CHAINS_FULL` built from `data/reference/production-chains.json`.
  - Consumption: `CONSUMPTION_RATES` in `data/industryData.ts` (good IDs only).
- Canonicalization helpers: `data/naming.ts`.
- Validator: `data/validators.ts` (runs in dev via `CalculatorView`).

## Files to Touch in Follow-ups
- Workforce fallback: add mapping in `data/productionOptimizer.ts` or a separate `data/workforceOverrides.ts` consumed by the optimizer.
- Icon overrides: extend `data/buildingIcons.ts` for remaining canonical names.
- Tailwind setup: add `tailwind.config.js`, `postcss.config.js`, update styles and `index.html`.
- CI validator: new script (e.g., `scripts/validate-data.mjs`) that imports `validateData()` and exits non-zero on issues.

## Completed Items (for reference)
- Fixed typo in `data/reference/production-chains.json` (Penny Farthings).
- Removed fuzzy matching from optimizer and icon resolver (canonical-only).
- Added product icon fallback when building icon is missing.
- Introduced `data/naming.ts` for canonical mapping.

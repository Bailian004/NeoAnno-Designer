<div align="center">
<img width="1200" height="475" alt="NeoAnno Banner" src="public/NEO%20Anno%20Banner.png" />
</div>

# NeoAnno Designer

NeoAnno Designer is a modern, multi device enabled toolkit for planning, calculating, and optimizing Anno layouts. It brings together a traditional grid-based sandbox, a production calculator, and a genetic solver so you can design faster, validate chains, and iterate toward efficient, beautiful islands — all in one cohesive app.

## Features
- Traditional Sandbox: Grid-based layout designer with placement, move, rotate, and snap-to-grid via the canvas in [components/GridCanvas.tsx](components/GridCanvas.tsx).
- Production Calculator: Computes required buildings and chains from population/goods inputs using [utils/productionCalculator.ts](utils/productionCalculator.ts) and [utils/chainCalculator.ts](utils/chainCalculator.ts).
- Genetic Solver: Searches for balanced setups via an evolutionary approach in [services/geneticSolver.ts](services/geneticSolver.ts) and [services/PopulationManager.ts](services/PopulationManager.ts).
- Mobile navbar: Inline game/region accordions with overlay dropdowns, backdrop tap-to-close, and mode pills for Sandbox/Calculator/Solver.
- Designer header: Icon controls for Blueprints, Buildings, Resources, Cursor, Terrain, and Radius (desktop and mobile), with panels default-closed on mobile and in-panel close buttons.

## Status
- In development: Not yet live; features and UX are actively evolving.
- Local dev supported: See Run Locally below to try it today.
- Roadmap: Full support for all Anno Titles, More Ingame icons & Introducing Actual Island Canvases and an Island designer. A full and proper release and hosting once stable.

## Run Locally
**Prerequisite:** Node.js

1) Install deps: `npm install`
2) Start dev server: `npm run dev`

## Usage
- Sandbox: Place and move buildings on the grid; use header icons to toggle Cursor, Terrain paint, and Radius overlays. Panels for Blueprints, Buildings, and Resources open inline and can be closed from their headers.
- Calculator: Configure population and goods to see required production chains and building counts.
- Solver: Uses the genetic solver to search for balanced production setups based on needs and constraints.

## Scripts
- `npm run dev`: Starts Vite dev server on port 3000.
- `npm run build`: Builds a production bundle to `dist/`.
- `npm run preview`: Serves the built bundle locally for verification.

## Project Structure
- UI: [components/Designer.tsx](components/Designer.tsx), [components/GridCanvas.tsx](components/GridCanvas.tsx), [components/ResourcePanel.tsx](components/ResourcePanel.tsx), [components/HomePage.tsx](components/HomePage.tsx)
- Logic: [utils/productionCalculator.ts](utils/productionCalculator.ts), [utils/chainCalculator.ts](utils/chainCalculator.ts), [utils/resourceUtils.ts](utils/resourceUtils.ts)
- Solver: [services/geneticSolver.ts](services/geneticSolver.ts), [services/PopulationManager.ts](services/PopulationManager.ts)
- Data: [data/productionChains.ts](data/productionChains.ts), [data/industryData.ts](data/industryData.ts), [data/annoData.ts](data/annoData.ts)
- App Bootstrapping: [index.tsx](index.tsx), [App.tsx](App.tsx), [vite.config.ts](vite.config.ts)

## Technology
- Frontend: React 19 + TypeScript, bundled with Vite 6.
- Rendering: Canvas-backed grid interactions in [components/GridCanvas.tsx](components/GridCanvas.tsx).
- Algorithms: Production math in [utils/productionCalculator.ts](utils/productionCalculator.ts) and [utils/chainCalculator.ts](utils/chainCalculator.ts); evolutionary search in [services/geneticSolver.ts](services/geneticSolver.ts).
- Data Model: Production chains and industries in [data/productionChains.ts](data/productionChains.ts) and [data/industryData.ts](data/industryData.ts).
- Tooling: `vite` scripts for dev/build/preview; minimal external deps (React, uuid).

## Configuration
- Updates source: [pages/UpdatesPage.tsx](pages/UpdatesPage.tsx) reads `VITE_UPDATES_URL` when defined; otherwise defaults to `/updates.json`.
- No API keys required. Environment is optional and minimal for local dev.

## Tips (Mobile)
- Swipe the game/region headers to reveal overlay chips; tap backdrop to close.
- Use the header icons (Cursor, Terrain, Radius) to switch canvas modes; rotation stays in the dock.

## Troubleshooting
- Port in use: Change the dev server port in [vite.config.ts](vite.config.ts) or stop the conflicting process.
- Empty updates: Ensure `VITE_UPDATES_URL` points to a reachable JSON or provide `/updates.json` in `public/`.

## Acknowledgements
- [AnnoDesigner](https://github.com/oliversaggau/anno-designer/tree/Anno117): foundational concepts for layout planning and UI inspiration.
- [Anno 1800 Calculator](https://github.com/suhrmann/Anno-1800-Calculator/): production math and chains informed by community tools.

## License
Open source under the MIT License. See [LICENSE.md](LICENSE.md) for details.

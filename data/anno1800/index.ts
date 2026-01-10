// Central export hub for Anno 1800 data
import { productionChainsOldWorld } from './productionChains/old-world';
import { productionChainsNewWorld } from './productionChains/new-world';
import { productionChainsArctic } from './productionChains/arctic';
import { productionChainsEnbesa } from './productionChains/enbesa';

import { consumptionOldWorld } from './consumption/old-world';
import { consumptionNewWorld } from './consumption/new-world';
import { consumptionArctic } from './consumption/arctic';
import { consumptionEnbesa } from './consumption/enbesa';

import { buildingsOldWorld } from './buildings/old-world';
import { buildingsNewWorld } from './buildings/new-world';
import { buildingsArctic } from './buildings/arctic';
import { buildingsEnbesa } from './buildings/enbesa';

import { residentsOldWorld } from './residents/old-world';
import { residentsNewWorld } from './residents/new-world';
import { residentsArctic } from './residents/arctic';
import { residentsEnbesa } from './residents/enbesa';

import { servicesOldWorld } from './services/old-world';
import { servicesNewWorld } from './services/new-world';
import { servicesArctic } from './services/arctic';
import { servicesEnbesa } from './services/enbesa';

import { residencesOldWorld } from './residences/old-world';
import { residencesNewWorld } from './residences/new-world';
import { residencesArctic } from './residences/arctic';
import { residencesEnbesa } from './residences/enbesa';

import { goodsCatalog } from './goods/catalog';
import { aliasMap } from './aliases/nameMap';
import { productionRates } from './rates/productionRates';

export const productionChains = {
  'Old World': productionChainsOldWorld,
  'New World': productionChainsNewWorld,
  Arctic: productionChainsArctic,
  Enbesa: productionChainsEnbesa,
};

export const consumption = {
  'Old World': consumptionOldWorld,
  'New World': consumptionNewWorld,
  Arctic: consumptionArctic,
  Enbesa: consumptionEnbesa,
};

export const buildings = {
  'Old World': buildingsOldWorld,
  'New World': buildingsNewWorld,
  Arctic: buildingsArctic,
  Enbesa: buildingsEnbesa,
};

export const residents = {
  'Old World': residentsOldWorld,
  'New World': residentsNewWorld,
  Arctic: residentsArctic,
  Enbesa: residentsEnbesa,
};

export const services = {
  'Old World': servicesOldWorld,
  'New World': servicesNewWorld,
  Arctic: servicesArctic,
  Enbesa: servicesEnbesa,
};

export const residences = {
  'Old World': residencesOldWorld,
  'New World': residencesNewWorld,
  Arctic: residencesArctic,
  Enbesa: residencesEnbesa,
};

export { goodsCatalog, aliasMap, productionRates };

// Multi-region building overrides from buildingRegions.ts
export const buildingRegionOverrides: Record<string, string[]> = {
  'Sawmill': ['Old World', 'Cape Trelawney', 'New World', 'Arctic'],
  'Schnapps Distillery': ['Old World', 'Cape Trelawney'],
  'Framework Knitters': ['Old World', 'Cape Trelawney'],
  'Brick Factory': ['Old World', 'Cape Trelawney', 'New World'],
  'Sailmakers': ['Old World', 'Cape Trelawney', 'New World'],
  'Brass Smeltery': ['Old World', 'Cape Trelawney', 'Arctic'],
  'Copper Mine': ['Old World', 'Cape Trelawney', 'Arctic'],
  'Zinc Mine': ['Old World', 'Cape Trelawney', 'Arctic'],
  'Lumberjack Hut': ['Old World', 'Cape Trelawney', 'New World', 'Arctic'],
  'Marquetry Workshop': ['Old World', 'Cape Trelawney', 'New World'],
};

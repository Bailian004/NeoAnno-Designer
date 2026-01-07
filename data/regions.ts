import rawRegions from "./reference/regions.json";

interface RawRegion {
  id: number;
  name: string;
  img: string;
  dlcID: number;
  populationIDs: number[];
}

export interface RegionDefinition {
  key: string;
  id: number;
  name: string;
  image: string;
  dlcId: number;
  populationIds: number[];
}

const rawFile = rawRegions as Record<string, RawRegion>;

export const REGIONS: RegionDefinition[] = Object.entries(rawFile).map(
  ([key, region]) => ({
    key,
    id: region.id,
    name: region.name,
    image: region.img,
    dlcId: region.dlcID,
    populationIds: region.populationIDs,
  })
);

export const REGIONS_BY_ID = new Map<number, RegionDefinition>(
  REGIONS.map((region) => [region.id, region])
);

export const REGIONS_BY_KEY = new Map<string, RegionDefinition>(
  REGIONS.map((region) => [region.key, region])
);

import rawDlcs from "./reference/dlcs.json";

interface RawDlc {
  id: number;
  name: string;
  release?: string;
  season: number | false;
  "content-pack": boolean;
  img: string;
}

export interface DlcDefinition {
  id: number;
  name: string;
  release?: string;
  season: number | null;
  isContentPack: boolean;
  image: string;
}

const rawList = rawDlcs as RawDlc[];

export const DLCS: DlcDefinition[] = rawList.map((dlc) => ({
  id: dlc.id,
  name: dlc.name,
  release: dlc.release,
  season: dlc.season === false ? null : dlc.season,
  isContentPack: Boolean(dlc["content-pack"]),
  image: dlc.img,
}));

export const DLC_BY_ID = new Map<number, DlcDefinition>(
  DLCS.map((dlc) => [dlc.id, dlc])
);

export const DLC_BY_NAME = new Map<string, DlcDefinition>(
  DLCS.map((dlc) => [dlc.name.toLowerCase(), dlc])
);

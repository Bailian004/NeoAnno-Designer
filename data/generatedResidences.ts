// Auto-generated from Anno 1800 Building Reference Guide

export interface ResidenceBuilding {
  name: string;
  identifier?: string;
  icon?: string;
  region: string;
  tier: string;
  size: { x: number; z: number };
}

export const residenceBuildings: ResidenceBuilding[] = [
  {
    name: "Farmer Residence",
    region: "The Old World",
    tier: "Farmers",
    size: {"x":3,"z":3},
  },
  {
    name: "Worker Residence",
    identifier: "Residence_tier02",
    icon: "A7_resident_worker.png",
    region: "The Old World",
    tier: "Workers",
    size: {"x":3,"z":3},
  },
  {
    name: "Artisan Res.",
    region: "The Old World",
    tier: "Artisans",
    size: {"x":3,"z":3},
  },
  {
    name: "Engineer Res.",
    region: "The Old World",
    tier: "Engineers",
    size: {"x":3,"z":3},
  },
  {
    name: "Investor Res.",
    region: "The Old World",
    tier: "Investors",
    size: {"x":3,"z":3},
  },
  {
    name: "Jornalero Res.",
    region: "The New World",
    tier: "Jornaleros",
    size: {"x":3,"z":3},
  },
  {
    name: "Obrero Res.",
    region: "The New World",
    tier: "Obreros",
    size: {"x":3,"z":3},
  },
];

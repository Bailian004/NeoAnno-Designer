import { ServiceBuilding } from '../types';

export const servicesNewWorld: ServiceBuilding[] = [
  {
    "name": "Marketplace",
    "identifier": "Service_colony02_01 (Bazaar)",
    "icon": "A7_bazaar.png",
    "region": "The New World",
    "tier": "Jornaleros",
    "size": {"x": 5, "z": 6},
    "service": "\"Marketplace\".",
    "range": {"type": "street", "range": 48}
  },
  {
    "name": "Chapel",
    "identifier": "Service_colony01_02 (Chapel)",
    "icon": "A7_church.png",
    "region": "The New World",
    "tier": "Jornaleros",
    "size": {"x": 4, "z": 6},
    "service": "\"Chapel\".",
    "range": {"type": "street", "range": 48}
  },
  {
    "name": "Boxing Arena",
    "identifier": "Service_colony01_03 (Boxing Arena)",
    "icon": "A7_box_arena.png",
    "region": "The New World",
    "tier": "Obreros",
    "size": {"x": 9, "z": 9},
    "service": "\"Boxing Arena\".",
    "range": {"type": "street", "range": 72}
  }
];

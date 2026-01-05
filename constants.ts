import { AnnoTitle } from "./types";

export const CANVAS_BG_COLOR = "#1a1a1a";
export const GRID_LINE_COLOR = "#333333";
export const GRID_MAJOR_LINE_COLOR = "#555555";
export const CELL_SIZE = 20; // Pixels per grid cell at zoom 1

export const ANNO_TITLES_META: Record<AnnoTitle, { image: string, year: string, theme: string }> = {
  [AnnoTitle.ANNO_1800]: {
    // Official Steam Library Hero Art
    image: "https://cdn.akamai.steamstatic.com/steam/apps/916440/library_hero.jpg",
    year: "1800",
    theme: "border-yellow-600 shadow-yellow-900/20"
  },
  [AnnoTitle.ANNO_1404]: {
    // Official Steam Library Hero Art (History Edition)
    image: "https://cdn.akamai.steamstatic.com/steam/apps/1281630/library_hero.jpg",
    year: "1404",
    theme: "border-amber-700 shadow-amber-900/20"
  },
  [AnnoTitle.ANNO_2070]: {
    // Official Steam Library Hero Art
    image: "https://cdn.akamai.steamstatic.com/steam/apps/48240/library_hero.jpg",
    year: "2070",
    theme: "border-cyan-500 shadow-cyan-900/20"
  },
  [AnnoTitle.ANNO_2205]: {
    // Official Steam Library Hero Art
    image: "https://cdn.akamai.steamstatic.com/steam/apps/375910/library_hero.jpg",
    year: "2205",
    theme: "border-blue-400 shadow-blue-900/20"
  },
  [AnnoTitle.ANNO_117]: {
    // High-quality Roman Architecture fallback (Unsplash) as official assets are not yet on Steam
    image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80",
    year: "117",
    theme: "border-red-800 shadow-red-900/40"
  }
};
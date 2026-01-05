import { AnnoTitle } from "./types";

export const CANVAS_BG_COLOR = "#1a1a1a";
export const GRID_LINE_COLOR = "#333333";
export const GRID_MAJOR_LINE_COLOR = "#555555";
export const CELL_SIZE = 20; // Pixels per grid cell at zoom 1

export const ANNO_TITLES_META: Record<AnnoTitle, { image: string, year: string, theme: string }> = {
  [AnnoTitle.ANNO_1800]: {
    image: "https://picsum.photos/id/122/600/400",
    year: "1800",
    theme: "border-yellow-600 shadow-yellow-900/20"
  },
  [AnnoTitle.ANNO_1404]: {
    image: "https://picsum.photos/id/82/600/400",
    year: "1404",
    theme: "border-amber-700 shadow-amber-900/20"
  },
  [AnnoTitle.ANNO_2070]: {
    image: "https://picsum.photos/id/201/600/400",
    year: "2070",
    theme: "border-cyan-500 shadow-cyan-900/20"
  },
  [AnnoTitle.ANNO_2205]: {
    image: "https://picsum.photos/id/119/600/400",
    year: "2205",
    theme: "border-blue-400 shadow-blue-900/20"
  },
  [AnnoTitle.ANNO_117]: {
    image: "https://picsum.photos/id/103/600/400",
    year: "117",
    theme: "border-red-800 shadow-red-900/40"
  }
};

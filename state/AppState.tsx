import React, { createContext, useContext, useState, useEffect } from 'react';
import { AnnoTitle } from '../types';

export type AppMode = 'sandbox' | 'calculator' | 'solver' | 'home' | 'settings' | 'updates' | 'about' | 'tutorial' | 'bug';
export type RegionKey = 'Old World' | 'New World' | 'Arctic' | 'Enbesa' | 'Cape Trelawney' | 'Orient' | 'Occident' | 'Global';

export interface ManifestItem {
  id: string;
  count: number;
}
export interface Manifest {
  title: string;
  items: ManifestItem[];
}

interface AppStateShape {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  selectedGame: AnnoTitle | null;
  setSelectedGame: (t: AnnoTitle | null) => void;
  region: RegionKey;
  setRegion: (r: RegionKey) => void;
  manifest: Manifest | null;
  setManifest: (m: Manifest | null) => void;
  navCollapsed: boolean;
  setNavCollapsed: (c: boolean) => void;
}

const AppStateContext = createContext<AppStateShape | null>(null);

const LS_KEY = 'neoanno.appstate.v1';

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<AppMode>('home');
  const [selectedGame, setSelectedGame] = useState<AnnoTitle | null>(null);
  const [region, setRegion] = useState<RegionKey>('Global');
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [navCollapsed, setNavCollapsed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setMode(parsed.mode ?? 'home');
        setSelectedGame(parsed.selectedGame ?? null);
        setRegion(parsed.region ?? 'Global');
        setManifest(parsed.manifest ?? null);
        setNavCollapsed(parsed.navCollapsed ?? false);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const snapshot = { mode, selectedGame, region, manifest, navCollapsed };
    try { localStorage.setItem(LS_KEY, JSON.stringify(snapshot)); } catch {}
  }, [mode, selectedGame, region, manifest, navCollapsed]);

  return (
    <AppStateContext.Provider value={{ mode, setMode, selectedGame, setSelectedGame, region, setRegion, manifest, setManifest, navCollapsed, setNavCollapsed }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
};

/**
 * DataContext: Single source of truth for canonical data.
 *
 * Responsibilities:
 * - Load raw data from remote repository
 * - Compile into runtime model (once)
 * - Expose via context hook
 * - Handle loading/error states
 * - Trigger reloads if version changes
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loadAnnoData, Anno1800Data } from '../lib/neoanno-data';
import { compileModel, CompiledModel } from '../lib/compile-model';

export interface DataContextShape {
  // Raw canonical data
  rawData: Anno1800Data | null;

  // Compiled model (derived from raw data)
  model: CompiledModel | null;

  // Metadata
  dataVersion: string | null;

  // Loading/error states
  loading: boolean;
  error: string | null;

  // Manual reload trigger
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextShape | null>(null);

export interface DataProviderProps {
  children: React.ReactNode;
  // Optional: override these for development/testing
  pagesBaseUrl?: string;
  rawBaseUrl?: string;
  pinnedVersion?: string;
}

/**
 * DataProvider: Wraps the app and provides data context.
 *
 * Usage:
 *   <DataProvider>
 *     <App />
 *   </DataProvider>
 *
 * Then access via useData() hook in any component.
 */
export const DataProvider: React.FC<DataProviderProps> = ({
  children,
  pagesBaseUrl = 'https://bailian004.github.io/neoanno-data',
  rawBaseUrl = 'https://raw.githubusercontent.com/Bailian004/neoanno-data/main',
  pinnedVersion,
}) => {
  const [rawData, setRawData] = useState<Anno1800Data | null>(null);
  const [dataVersion, setDataVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compile model whenever rawData changes
  const model = useMemo(() => {
    if (!rawData) return null;
    try {
      return compileModel(rawData);
    } catch (err) {
      console.error('Failed to compile model:', err);
      setError(err instanceof Error ? err.message : 'Failed to compile model');
      return null;
    }
  }, [rawData]);

  // Load data on mount or when config changes
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use environment variables for base URLs, with fallback to props
      const basePagesUrl = import.meta.env.VITE_NEOANNO_DATA_BASE_URL || pagesBaseUrl;
      const baseRawUrl = import.meta.env.VITE_NEOANNO_DATA_RAW_FALLBACK || rawBaseUrl;
      const devModeEnabled = import.meta.env.VITE_NEOANNO_DATA_DEV_MODE === 'true' || false;
      const devPort = parseInt(import.meta.env.VITE_NEOANNO_DATA_DEV_PORT || '3000', 10);

      const { version, data } = await loadAnnoData({
        game: 'anno1800',
        devMode: devModeEnabled,
        devPort,
        pagesBaseUrl: basePagesUrl,
        rawBaseUrl: baseRawUrl,
        pinnedVersion,
        validateChecksums: false,
      });
      setRawData(data);
      setDataVersion(version);

      // Log data load success in development
      if (import.meta.env.DEV) {
        console.log(`[DataContext] Loaded anno data version ${version}`, {
          pagesBase: basePagesUrl,
          devMode: devModeEnabled,
          version,
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error loading data';
      setError(msg);
      console.error('[DataContext] Error loading data:', msg, {
        pagesBase: import.meta.env.VITE_NEOANNO_DATA_BASE_URL,
        rawFallback: import.meta.env.VITE_NEOANNO_DATA_RAW_FALLBACK,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [pagesBaseUrl, rawBaseUrl, pinnedVersion]);

  return (
    <DataContext.Provider
      value={{
        rawData,
        model,
        dataVersion,
        loading,
        error,
        reload: loadData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

/**
 * Hook to access data context.
 *
 * Usage:
 *   const { model, loading, error } = useData();
 *   if (loading) return <Spinner />;
 *   if (error) return <Error msg={error} />;
 *   if (!model) return null;
 *   // use model.buildingsById, model.goodsById, etc.
 */
export const useData = (): DataContextShape => {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within <DataProvider>');
  }
  return ctx;
};

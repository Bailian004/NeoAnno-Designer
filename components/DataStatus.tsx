/**
 * DataStatus: Display data version and loading/error state.
 * Minimal indicator for the app UI.
 */

import React from 'react';
import { useData } from '../src/context/DataContext';

export const DataStatus: React.FC = () => {
  const { dataVersion, loading, error } = useData();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <div className="animate-spin w-3 h-3 border border-slate-400 border-t-amber-500 rounded-full" />
        Loading data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-400 flex items-center gap-1">
        <span>⚠</span>
        <span>Data error</span>
      </div>
    );
  }

  return (
    <div className="text-xs text-slate-500">
      {dataVersion ? `v${dataVersion}` : 'no version'}
    </div>
  );
};

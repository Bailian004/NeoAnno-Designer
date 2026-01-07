import React from 'react';
import { useAppState } from '../state/AppState';
import { Designer } from './Designer';

export const SandboxView: React.FC = () => {
  const { selectedGame, setMode } = useAppState();
  if (!selectedGame) return (
    <div className="p-8 text-slate-300">
      <p className="text-sm">Select a game to start designing.</p>
      <div className="mt-3"><button className="px-3 py-1 rounded bg-amber-500 text-slate-900" onClick={() => setMode('home')}>Go to Home</button></div>
    </div>
  );
  return <Designer gameTitle={selectedGame} onBack={() => setMode('home')} />;
};

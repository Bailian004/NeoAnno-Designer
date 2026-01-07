import React from 'react';

export const AboutPage: React.FC = () => (
  <div className="p-6 text-slate-100">
    <h2 className="text-lg font-black text-amber-400 mb-3">About NeoAnno Designer</h2>
    <p className="text-sm text-slate-300">NeoAnno Designer helps you plan, calculate, and auto-generate layouts for Anno games across multiple eras.</p>
    <div className="mt-3 text-xs text-slate-400">
      <p><strong>Version:</strong> 0.0.0</p>
      <p><strong>Tech:</strong> React, TypeScript, Vite</p>
      <p><strong>Data:</strong> Integrated chains, regions, DLCs, and building datasets</p>
      <p><strong>Credits:</strong> Community and reference projects</p>
    </div>
  </div>
);

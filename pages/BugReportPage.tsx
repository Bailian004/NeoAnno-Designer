import React from 'react';

export const BugReportPage: React.FC = () => (
  <div className="p-6 text-slate-100">
    <h2 className="text-lg font-black text-amber-400 mb-3">Report a Bug / Request a Feature</h2>
    <p className="text-sm text-slate-300">Please use our GitHub issues page to report bugs or request features. Include clear steps, screenshots, and expected vs actual behavior.</p>
    <div className="mt-3">
      <a className="px-3 py-1 rounded bg-slate-800 border border-white/10 text-xs text-slate-200 hover:bg-slate-700" href="https://github.com/benoakleigh4/NeoAnno-Designer/issues" target="_blank" rel="noreferrer">Open GitHub Issues</a>
    </div>
    <div className="mt-4 text-xs text-slate-400">
      <p><strong>Guidance:</strong></p>
      <ul className="list-disc ml-5">
        <li>Describe the problem and the steps to reproduce.</li>
        <li>Attach screenshots of your canvas or calculator outputs.</li>
        <li>Include your game, region, and mode (Sandbox/Calculator/Solver).</li>
      </ul>
    </div>
  </div>
);

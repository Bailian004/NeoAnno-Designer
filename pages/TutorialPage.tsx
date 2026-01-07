import React from 'react';

export const TutorialPage: React.FC = () => (
  <div className="p-6 text-slate-100">
    <h2 className="text-lg font-black text-amber-400 mb-3">Tutorial & Guide</h2>
    <div className="space-y-4 text-sm text-slate-300">
      <section>
        <h3 className="text-xs uppercase font-bold text-slate-400">Getting Started</h3>
        <p>Select a game and region, then choose Sandbox, Calculator, or Solver from the top navigation.</p>
      </section>
      <section>
        <h3 className="text-xs uppercase font-bold text-slate-400">Sandbox Mode</h3>
        <p>Use the building palette to place structures. Toggle terrain and rotation via the floating toolbar. Optionally load a manifest exported from the Calculator to track requirements.</p>
      </section>
      <section>
        <h3 className="text-xs uppercase font-bold text-slate-400">Calculator Mode</h3>
        <p>Enter population targets and review calculated requirements with attractive cards. Export the manifest to Sandbox or Solver.</p>
      </section>
      <section>
        <h3 className="text-xs uppercase font-bold text-slate-400">Solver Mode</h3>
        <p>Choose City mode to generate residential and service layouts, or Industrial mode to work with multiple production chain canvases. Incompatible chains are greyed out.</p>
      </section>
      <section>
        <h3 className="text-xs uppercase font-bold text-slate-400">Tips</h3>
        <ul className="list-disc ml-5">
          <li>Use the region selector to filter chains and ensure compliance.</li>
          <li>Export manifests from Calculator to prefill Solver or Sandbox.</li>
          <li>Collapse the top navigation to maximize canvas space.</li>
        </ul>
      </section>
    </div>
  </div>
);

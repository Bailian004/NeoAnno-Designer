import React, { useEffect, useState } from 'react';

export const SettingsPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  const [gridSnap, setGridSnap] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('neoanno.settings.v1');
      if (raw) {
        const s = JSON.parse(raw);
        setDarkMode(!!s.darkMode); setLanguage(s.language || 'en'); setGridSnap(!!s.gridSnap); setZoom(s.zoom || 1);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('neoanno.settings.v1', JSON.stringify({ darkMode, language, gridSnap, zoom })); } catch {}
  }, [darkMode, language, gridSnap, zoom]);

  return (
    <div className="p-6 text-slate-100">
      <h2 className="text-lg font-black text-amber-400 mb-3">Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0f172a]/80 border border-white/10 rounded p-3">
          <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">General</h3>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={darkMode} onChange={e=>setDarkMode(e.target.checked)} /> Dark Mode</label>
          <div className="mt-2">
            <label className="text-xs text-slate-400">Language</label>
            <select className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs" value={language} onChange={e=>setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="fr">Français</option>
            </select>
          </div>
        </div>
        <div className="bg-[#0f172a]/80 border border-white/10 rounded p-3">
          <h3 className="text-xs uppercase font-bold text-slate-400 mb-2">Canvas</h3>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={gridSnap} onChange={e=>setGridSnap(e.target.checked)} /> Snap to grid</label>
          <div className="mt-2">
            <label className="text-xs text-slate-400">Default Zoom</label>
            <input type="number" min={0.5} max={2} step={0.1} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs" value={zoom} onChange={e=>setZoom(parseFloat(e.target.value)||1)} />
          </div>
        </div>
      </div>
    </div>
  );
};

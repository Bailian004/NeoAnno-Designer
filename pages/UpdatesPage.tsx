import React, { useEffect, useState } from 'react';

interface UpdateEntry { date: string; title: string; description?: string; }

export const UpdatesPage: React.FC = () => {
  const [entries, setEntries] = useState<UpdateEntry[]>([]);
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const url = `${baseUrl}updates.json`;
    fetch(url)
      .then(r => r.json())
      .then(setEntries)
      .catch(err => {
        console.error('Failed to load updates:', err);
        setEntries([]);
      });
  }, []);

  return (
    <div className="p-6 text-slate-100">
      <h2 className="text-lg font-black text-amber-400 mb-3">Updates & Activity</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">No updates found.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e, i) => (
            <div key={i} id={`update-${i}`} className="p-3 rounded bg-[#0f172a]/80 border border-white/10">
              <div className="text-[10px] uppercase text-slate-500">{e.date}</div>
              <div className="text-sm font-bold text-slate-200">{e.title}</div>
              {e.description && <div className="text-xs text-slate-400">{e.description}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

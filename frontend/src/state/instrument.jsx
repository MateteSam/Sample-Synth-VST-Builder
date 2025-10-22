import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const InstrumentContext = createContext(null);

const DEFAULT_MANIFEST = {
  meta: { name: 'New Preset', author: '', version: '0.1.0' },
  engine: {
    env: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.5 },
    filter: { type: 'lowpass', cutoff: 20000, q: 0 },
    fx: { delay: { time: 0, feedback: 0, mix: 0 }, reverb: { mix: 0 } },
    master: 0.85,
    polyphony: 32,
    voiceStealing: 'last',
    velocityCurve: 'linear',
    sustain: false,
    sostenuto: false,
  },
  mapping: { mode: 'auto', strategy: 'closest-root', roundRobin: { enabled: true, order: 'sequential' } },
  samples: [],
  ui: { template: null, bindings: [], bindingOrder: [], theme: { primary: '#22c55e', accent: '#3b82f6' }, selectedSampleId: null, selectedInstrument: null, groupNames: {}, currentArticulations: {}, currentMics: {} },
  sequence: { bpm: 120, tracks: [] },
};

export function InstrumentProvider({ engine, children }) {
  // Always start with a clean default manifest; do not auto-load previous sessions.
  // Users can explicitly load a preset or a previous session from the UI if desired.
  const [manifest, setManifest] = useState(() => DEFAULT_MANIFEST);

  // Autosave: skip the first save if a previous session exists to avoid clobbering it on startup
  const skipFirstSave = useRef(false);
  useEffect(() => {
    try {
      if (skipFirstSave.current) {
        skipFirstSave.current = false;
        return;
      }
      localStorage.setItem('instrument_manifest', JSON.stringify(manifest));
    } catch {}
  }, [manifest]);

  // Determine on mount whether to skip the first autosave
  useEffect(() => {
    try {
      if (localStorage.getItem('instrument_manifest')) {
        skipFirstSave.current = true;
      }
    } catch {}
  }, []);

  // Load custom group names from backend on mount (merge with any local names)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3000/api/group-names');
        if (res.ok) {
          const data = await res.json();
          const names = data?.groupNames || {};
          setManifest((m) => ({
            ...m,
            ui: { ...m.ui, groupNames: { ...(m.ui.groupNames || {}), ...names } },
          }));
        }
      } catch {}
    })();
  }, []);

  // Sync engine with manifest on load and when key performance params change
  useEffect(() => {
    try {
      engine?.setVelocityCurve?.(manifest.engine.velocityCurve);
      engine?.setSustain?.(manifest.engine.sustain);
      engine?.setSostenuto?.(manifest.engine.sostenuto);
    } catch {}
  }, [engine, manifest.engine.velocityCurve, manifest.engine.sustain, manifest.engine.sostenuto]);

  const api = useMemo(() => ({
    manifest,
    setManifest,
    engine,
    setGroupName(category, name) {
      setManifest((m) => ({ ...m, ui: { ...m.ui, groupNames: { ...(m.ui.groupNames || {}), [category]: name } } }));
    },
    async saveGroupNames() {
      try {
        const res = await fetch('http://localhost:3000/api/group-names', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ groupNames: manifest.ui?.groupNames || {} }),
        });
        // Always persist locally as well
        try { localStorage.setItem('instrument_manifest', JSON.stringify(manifest)); } catch {}
        return res.ok;
      } catch {
        // Fallback: persist locally only
        try {
          localStorage.setItem('instrument_manifest', JSON.stringify(manifest));
          return true;
        } catch {
          return false;
        }
      }
    },
    setEngineParam(path, value) {
      setManifest((m) => {
        const next = { ...m, engine: { ...m.engine } };
        const parts = path.split('.');
        let obj = next.engine;
        for (let i = 0; i < parts.length - 1; i++) {
          const p = parts[i]; obj[p] = { ...(obj[p] ?? {}) };
          obj = obj[p];
        }
        obj[parts[parts.length - 1]] = value;
        return next;
      });
    },
    addSamples(samples) {
      setManifest((m) => {
        const next = { ...m, samples: [...m.samples] };
        const newCats = new Set();
        for (const s of samples) {
          const entry = { id: s.id, name: s.name, rootMidi: s.rootMidi, url: s.url || null, category: s.category || 'Uncategorized' };
          if (!next.samples.find((x) => x.id === entry.id)) next.samples.push(entry);
          const cat = entry.category || 'Uncategorized';
          newCats.add(cat);
        }
        const ui = { ...(next.ui || {}) };
        const names = { ...(ui.groupNames || {}) };
        for (const cat of newCats) {
          if (!names[cat] || !String(names[cat]).trim()) {
            names[cat] = cat; // auto-name group based on folder-derived category
          }
        }
        ui.groupNames = names;
        if (samples.length && !ui.selectedSampleId) ui.selectedSampleId = samples[0].id;
        // Auto-select instrument when there is a single category (new or overall)
        if (!ui.selectedInstrument) {
          const allCats = Array.from(new Set(next.samples.map((x) => x.category || 'Uncategorized')));
          if (allCats.length === 1) {
            ui.selectedInstrument = allCats[0];
          } else if (newCats.size === 1) {
            ui.selectedInstrument = Array.from(newCats)[0];
          }
        }
        next.ui = ui;
        return next;
      });
    },
    clearSamples() {
      setManifest((m) => ({
        ...m,
        samples: [],
        ui: { ...m.ui, selectedSampleId: null },
      }));
    },
    setSelectedInstrument(name) { setManifest((m) => ({ ...m, ui: { ...m.ui, selectedInstrument: name || null } })); },
    setSelectedSampleId(id) { setManifest((m) => ({ ...m, ui: { ...m.ui, selectedSampleId: id } })); },
    setVelocityCurve(curve) {
      setManifest((m) => ({ ...m, engine: { ...m.engine, velocityCurve: curve } }));
      engine?.setVelocityCurve?.(curve);
    },
    toggleSustain(on) { setManifest((m) => ({ ...m, engine: { ...m.engine, sustain: on } })); engine?.setSustain?.(on); },
    toggleSostenuto(on) { setManifest((m) => ({ ...m, engine: { ...m.engine, sostenuto: on } })); engine?.setSostenuto?.(on); },
    setCurrentArticulation(category, articulation) {
      setManifest((m) => ({ ...m, ui: { ...m.ui, currentArticulations: { ...(m.ui.currentArticulations || {}), [category]: articulation || null } } }));
      try { engine?.setArticulation?.(category, articulation || null); } catch {}
    },
    setCurrentMic(category, mic) {
      setManifest((m) => ({ ...m, ui: { ...m.ui, currentMics: { ...(m.ui.currentMics || {}), [category]: mic || null } } }));
      try { engine?.setMic?.(category, mic || null); } catch {}
    },
    downloadJSON() {
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${manifest.meta?.name || 'instrument'}.json`;
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    },
    async exportPlugin() {
      // Async export: start job, poll status, return final outDir/zip when ready
      try {
        const body = {
          engine: manifest.engine || {},
          ui: { 
            groupNames: manifest.ui?.groupNames || {},
            bindings: manifest.ui?.bindings || [],
            bindingOrder: manifest.ui?.bindingOrder || [],
            canvas: manifest.ui?.canvas || {},
            // Respect user's choice: only include a template if they loaded one
            template: manifest.ui?.template || null,
            theme: manifest.ui?.theme || {},
            assets: manifest.ui?.assets || []
          },
          sequence: manifest.sequence || {},
          meta: manifest.meta || { name: 'Untitled', author: '', version: '0.1.0' },
          options: { zip: true },
        };
        const start = await fetch('http://localhost:3000/api/export_async', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!start.ok) throw new Error(`Export start failed: ${start.status}`);
        const d = await start.json();
        const stamp = d?.stamp;
        if (!stamp) throw new Error('No stamp returned');

        // Poll until complete or error
        const startAt = Date.now();
        while (true) {
          await new Promise((res) => setTimeout(res, 500));
          const sres = await fetch(`http://localhost:3000/api/export/status/${stamp}`);
          if (!sres.ok) throw new Error(`Status check failed: ${sres.status}`);
          const status = await sres.json();
          if (status.error) throw new Error(status.error);
          if (Number(status.progress || 0) >= 100) break;
          // Safety timeout (5 minutes)
          if (Date.now() - startAt > 1000 * 60 * 5) throw new Error('Export timed out');
        }
        const fin = await fetch(`http://localhost:3000/api/export/result/${stamp}`);
        if (!fin.ok) throw new Error(`Result fetch failed: ${fin.status}`);
        const result = await fin.json();
        return result?.outDir ? `http://localhost:3000${result.outDir}` : (result?.zip ? `http://localhost:3000${result.zip}` : null);
      } catch (e) {
        console.warn('Export failed:', e);
        return null;
      }
    },
  }), [manifest, engine]);

  return <InstrumentContext.Provider value={api}>{children}</InstrumentContext.Provider>;
}

export function useInstrument() {
  const ctx = useContext(InstrumentContext);
  if (!ctx) throw new Error('useInstrument must be used within InstrumentProvider');
  return ctx;
}
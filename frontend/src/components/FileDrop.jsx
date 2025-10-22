import React, { useRef, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';

export default function FileDrop({ engine, onSamplesLoaded }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [instrumentName, setInstrumentName] = useState('');
  const [autoGroupByFolder, setAutoGroupByFolder] = useState(true);
  const { addSamples, clearSamples } = useInstrument();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    const loaded = [];
    try {
      // Try backend upload first
      const form = new FormData();
      Array.from(files).forEach((f) => form.append('files', f));
      const res = await fetch('http://localhost:3000/api/samples/upload', { method: 'POST', body: form });
      if (res.ok) {
        const data = await res.json();
        const created = data.samples || [];
        for (const s of created) {
          const url = `http://localhost:3000${s.url}`;
          try {
            const category = instrumentName?.trim() || 'Uncategorized';
            const sample = await engine.loadUrl(s.name, url, s.rootMidi, category, { velLow: s.velLow, velHigh: s.velHigh, rrIndex: s.rrIndex, mic: s.mic });
            loaded.push(sample);
          } catch (e) {
            console.error('Decode failed from backend, falling back to local:', s.name, e);
          }
        }
      } else {
        throw new Error('Backend upload failed');
      }
    } catch (err) {
      console.warn('Backend upload not available, loading locally.', err);
      // Fallback to local decoding
      for (const file of files) {
        if (file.type && !file.type.startsWith('audio')) continue;
        try {
          let category = instrumentName?.trim() || '';
          if (autoGroupByFolder) {
            const rel = file.webkitRelativePath || '';
            if (rel && rel.includes('/')) {
              category = rel.split('/')[0] || category;
            }
          }
          if (!category) category = 'Uncategorized';
          const s = await engine.loadFile(file, category);
          loaded.push(s);
        } catch (e) {
          console.error('Failed to load file', file.name, e);
        }
      }
    } finally {
      setLoading(false);
      try { addSamples(loaded); } catch {}
      onSamplesLoaded && onSamplesLoaded(loaded);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  return (
    <div onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <div className="row wrap">
        <button className="secondary" onClick={() => inputRef.current?.click()}>+ Load Samples/Folders</button>
        <button className="danger" onClick={async () => {
          try {
            // Clear backend persisted samples and files
            await fetch('http://localhost:3000/api/samples', { method: 'DELETE' });
          } catch {}
          try { engine.clearSamples?.(); } catch {}
          try { clearSamples(); } catch {}
          onSamplesLoaded && onSamplesLoaded([]);
        }}>Clear All Samples</button>
        {loading && <span className="muted">Loading…</span>}
        <input ref={inputRef} type="file" accept="audio/*" multiple style={{ display: 'none' }} webkitdirectory="" onChange={(e) => handleFiles(e.target.files)} />
      </div>
      <div className="space" />
      <div className="row wrap" style={{ gap: 8 }}>
        <label className="row" style={{ gap: 6 }}>
          <span className="muted">Instrument Name</span>
          <input type="text" placeholder="e.g., Guitar" value={instrumentName} onChange={(e) => setInstrumentName(e.target.value)} />
        </label>
        <label className="row" style={{ gap: 6 }}>
          <input type="checkbox" checked={autoGroupByFolder} onChange={(e) => setAutoGroupByFolder(e.target.checked)} />
          <span className="muted">Auto group by first folder</span>
        </label>
      </div>
      <div style={{ marginTop: 8 }} className="muted">Drag & drop audio files or select a folder. Option A: select a folder with subfolders (auto-group by folder). Option B: select a single instrument folder and set Instrument Name.</div>
    </div>
  );
}
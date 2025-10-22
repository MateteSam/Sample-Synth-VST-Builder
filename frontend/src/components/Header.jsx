import React, { useEffect, useRef, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import TopNav from './TopNav.jsx';

export default function Header({ mode, setMode }) {
  const { manifest, engine, downloadJSON, saveGroupNames, setCurrentArticulation, setCurrentMic } = useInstrument();
  const [isSaved, setIsSaved] = useState(false);
  const selectedInstrument = manifest.ui?.selectedInstrument || null;
  const [art, setArt] = useState('');
  const [mic, setMic] = useState('');

  useEffect(() => {
    try { setIsSaved(localStorage.getItem('persist_enabled') === '1'); } catch {}
  }, []);
  // Sync dropdowns when instrument changes
  useEffect(() => {
    const list = engine?.getSamples?.() || [];
    const filtered = selectedInstrument ? list.filter((s) => (s.category || 'Uncategorized') === selectedInstrument) : list;
    const arts = Array.from(new Set(filtered.map((s) => s.articulation).filter(Boolean))).sort();
    const mics = Array.from(new Set(filtered.map((s) => s.mic).filter(Boolean))).sort();
    const currentArt = manifest.ui?.currentArticulations?.[selectedInstrument || 'Uncategorized'] || '';
    const currentMic = manifest.ui?.currentMics?.[selectedInstrument || 'Uncategorized'] || '';
    setArt(currentArt || '');
    setMic(currentMic || '');
    // Store options for render
    Header._arts = arts; Header._mics = mics;
  }, [engine, selectedInstrument, manifest.ui?.currentArticulations, manifest.ui?.currentMics]);
  const [showExport, setShowExport] = useState(false);
  const [exportOpts, setExportOpts] = useState({ includeEngine: true, includeGroupNames: true, includeSequencer: false, targetVST3: true, targetStandalone: true, scopeInstrumentOnly: false, zip: true });
  const [exportLink, setExportLink] = useState('');
  const [exportZipLink, setExportZipLink] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [exportStamp, setExportStamp] = useState('');
  const pollRef = useRef(null);

  async function onExportSubmit() {
    try {
      const body = {
        engine: exportOpts.includeEngine ? (manifest.engine || {}) : undefined,
        ui: exportOpts.includeGroupNames ? { groupNames: manifest.ui?.groupNames || {} } : undefined,
        // Include design config from Design page (bindings, bindingOrder, canvas, presetName, etc.)
        design: manifest.ui ? {
          bindings: manifest.ui.bindings || [],
          bindingOrder: manifest.ui.bindingOrder || [],
          canvas: manifest.ui.canvas || {},
          presetName: manifest.ui.presetName || 'Custom',
          usageCounts: manifest.ui.usageCounts || {},
          recentTypes: manifest.ui.recentTypes || [],
        } : undefined,
        sequencer: exportOpts.includeSequencer ? (manifest.sequence || null) : undefined,
        options: {
          includeSequencer: !!exportOpts.includeSequencer,
          targets: { vst3: !!exportOpts.targetVST3, standalone: !!exportOpts.targetStandalone },
          zip: !!exportOpts.zip,
          runBuilder: !!exportOpts.runBuilder,
        },
        scope: exportOpts.scopeInstrumentOnly && (manifest.ui?.selectedInstrument ? { instrumentName: manifest.ui.selectedInstrument } : undefined),
      };
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('Starting…');
      const res = await fetch('http://localhost:3000/api/export_async', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Export start failed: ${res.status}`);
      const data = await res.json();
      const stamp = data?.stamp || '';
      setExportStamp(stamp);
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const s = await fetch(`http://localhost:3000/api/export/status/${stamp}`).then((r) => r.json());
          setExportProgress(Number(s.progress || 0));
          setExportMessage(String(s.message || 'Building'));
          // Surface backend error if present
          if (s.error) {
            setExportMessage(String(s.message || 'Error'));
            setIsExporting(false);
            clearInterval(pollRef.current);
            alert(`Export error: ${s.error}`);
            return;
          }
          if (Number(s.progress || 0) >= 100) {
            clearInterval(pollRef.current);
            const fin = await fetch(`http://localhost:3000/api/export/result/${stamp}`).then((r) => r.json()).catch(() => null);
            const url = fin?.outDir ? `http://localhost:3000${fin.outDir}` : '';
            const zipUrl = fin?.zip ? `http://localhost:3000${fin.zip}` : '';
            setExportLink(url);
            setExportZipLink(zipUrl);
            setIsExporting(false);
            setShowExport(false);
            alert(`Exported: ${zipUrl || url || 'OK'}`);
          }
        } catch {}
      }, 500);
    } catch (e) {
      setIsExporting(false);
      alert('Export failed');
    }
  }

  async function onCancelExport() {
    try {
      if (!exportStamp) return;
      await fetch(`http://localhost:3000/api/export/cancel/${exportStamp}`, { method: 'POST' });
      setIsExporting(false);
      setExportMessage('Cancel requested');
      if (pollRef.current) clearInterval(pollRef.current);
    } catch (e) {
      console.warn('Cancel failed', e);
    }
  }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  return (
  <div className="card compact p-12">
        <TopNav mode={mode} setMode={setMode} />
        <div className="space" />
      <div className="row justify-between">
        <div className="row gap-12">
          <div className="avatar">SA</div>
          <div>
            <div className="title">AI VST Sample Designer</div>
            <div className="muted mb-8">{manifest.meta?.name || 'New Preset'} {isSaved ? '• Saved' : '• Ephemeral'}</div>
          </div>
        </div>
  <div className="row wrap gap-8" style={{ alignItems: 'center' }}>
          {selectedInstrument && (
            <>
              <label className="row gap-6">
                <span className="muted">Articulation</span>
                <select value={art} onChange={(e) => { const v = e.target.value || ''; setArt(v); setCurrentArticulation(selectedInstrument, v || null); }}>
                  <option value="">Any</option>
                  {(Header._arts || []).map((a) => (<option key={a} value={a}>{a}</option>))}
                </select>
              </label>
              <label className="row gap-6">
                <span className="muted">Mic</span>
                <select value={mic} onChange={(e) => { const v = e.target.value || ''; setMic(v); setCurrentMic(selectedInstrument, v || null); }}>
                  <option value="">Any</option>
                  {(Header._mics || []).map((m) => (<option key={m} value={m}>{m}</option>))}
                </select>
              </label>
            </>
          )}
          <button className="primary" onClick={async () => {
            try { localStorage.setItem('persist_enabled', '1'); setIsSaved(true); } catch {}
            try { await saveGroupNames(); } catch {}
          }}>Save VST</button>
          <button className="secondary" onClick={downloadJSON}>Export Manifest</button>
          <button onClick={() => setShowExport(true)}>Export…</button>
        </div>
      </div>
      {showExport && (
        <div className="modal-overlay">
          <div className="modal-card card compact">
            <div className="modal-header">
              <strong>Export Plugin Project</strong>
              <button className="btn-icon" onClick={() => setShowExport(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="space" />
              <div className="row wrap gap-12">
              <label className="row gap-8">
                <input type="checkbox" checked={exportOpts.includeEngine} onChange={(e) => setExportOpts((o) => ({ ...o, includeEngine: e.target.checked }))} />
                <span>Include engine defaults (master, ADSR, filter, delay, reverb, limiter, velocity curve)</span>
              </label>
              <label className="row gap-8">
                <input type="checkbox" checked={exportOpts.includeGroupNames} onChange={(e) => setExportOpts((o) => ({ ...o, includeGroupNames: e.target.checked }))} />
                <span>Include instrument labels (UI group names)</span>
              </label>
              <label className="row gap-8">
                <input type="checkbox" checked={exportOpts.includeSequencer} onChange={(e) => setExportOpts((o) => ({ ...o, includeSequencer: e.target.checked }))} />
                <span>Include sequencer patterns (metadata only)</span>
              </label>
              <label className="row gap-8">
                <input type="checkbox" checked={exportOpts.zip} onChange={(e) => setExportOpts((o) => ({ ...o, zip: e.target.checked }))} />
                <span>Create ZIP for download</span>
              </label>
              <label className="row gap-8">
                <input type="checkbox" checked={exportOpts.runBuilder || false} onChange={(e) => setExportOpts((o) => ({ ...o, runBuilder: e.target.checked }))} />
                <span>Attempt builder (requires JUCE/CMake on server)</span>
              </label>
              <label className="row gap-8">
                <input type="checkbox" checked={exportOpts.scopeInstrumentOnly} onChange={(e) => setExportOpts((o) => ({ ...o, scopeInstrumentOnly: e.target.checked }))} />
                <span>Export only selected instrument ({manifest.ui?.selectedInstrument || 'none'})</span>
              </label>
              <div className="row gap-12">
                <label className="row gap-6">
                  <span className="muted">Targets</span>
                  <label className="row gap-4">
                    <input type="checkbox" checked={exportOpts.targetVST3} onChange={(e) => setExportOpts((o) => ({ ...o, targetVST3: e.target.checked }))} /> VST3
                  </label>
                  <label className="row gap-4">
                    <input type="checkbox" checked={exportOpts.targetStandalone} onChange={(e) => setExportOpts((o) => ({ ...o, targetStandalone: e.target.checked }))} /> Standalone
                  </label>
                </label>
              </div>
              </div>
              <div className="space" />
            </div>
            <div className="modal-footer">
              <div className="row justify-end gap-8">
                <button className="secondary" disabled={isExporting} onClick={() => setShowExport(false)}>Close</button>
                {!isExporting ? (
                  <button className="primary" onClick={onExportSubmit}>Export</button>
                ) : (
                  <>
                    <button className="secondary" onClick={onCancelExport}>Cancel Export</button>
                    <button className="primary" disabled>Exporting…</button>
                  </>
                )}
              </div>
            </div>
            {isExporting && (
              <div className="m-12">
                <div className="export-status">{exportMessage} • {Number(exportProgress).toFixed(0)}%</div>
                <div className="progress"><div className="bar" style={{ width: `${Math.max(0, Math.min(100, Number(exportProgress)))}%` }} /></div>
              </div>
            )}
            {(exportLink || exportZipLink) && (
              <div className="muted mt-8">
                Last export: {exportLink ? (<a href={exportLink} target="_blank" rel="noreferrer">{exportLink}</a>) : '—'}
                {exportZipLink ? (<>
                  {' '}
                  • <a href={exportZipLink} target="_blank" rel="noreferrer">Download ZIP</a>
                </>) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useMemo } from 'react';
import FileDrop from '../components/FileDrop.jsx';
import { midiToName } from '../utils/music.js';
import AISampleGenerator from '../components/AISampleGenerator.jsx';
import Waveform from '../components/Waveform.jsx';
import ZoneTrack from '../components/ZoneTrack.jsx';
import { useInstrument } from '../state/instrument.jsx';
import { getGroupOptions, getDisplayName } from '../utils/groups.js';

export default function Map({ engine, samples, setSamples }) {
  const { manifest, setSelectedInstrument, addSamples } = useInstrument();
  const selectedInstrument = manifest.ui?.selectedInstrument || null;
  const names = manifest.ui?.groupNames || {};
  const onLoaded = () => {
    const list = engine.getSamples();
    setSamples(list);
    try { addSamples(list); } catch {}
  };

  const updateSample = (id, fields) => {
    const s = engine.samples.find((x) => x.id === id);
    if (!s) return;
    Object.assign(s, fields);
    setSamples([...engine.samples]);
  };

  const options = useMemo(() => {
    const names = manifest.ui?.groupNames || {};
    return getGroupOptions(engine.samples || [], names);
  }, [engine?.samples?.length, manifest.ui?.groupNames]);

  const filtered = useMemo(() => {
    const all = engine.getSamples();
    if (!selectedInstrument) return all;
    return all.filter((s) => (s.category || 'Uncategorized') === selectedInstrument);
  }, [engine?.samples?.length, selectedInstrument]);

  return (
  <div className="card compact">
      <h2 className="title" style={{ marginBottom: 8 }}>Map</h2>
      <p className="muted">Load audio files and assign zones across the keyboard and velocity ranges.</p>
      <div className="space" />
      <FileDrop engine={engine} onSamplesLoaded={onLoaded} />
      <div className="space" />
      <AISampleGenerator engine={engine} onGenerated={onLoaded} />
      <div className="space" />
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Instrument Selection</strong>
        <select value={selectedInstrument || ''} onChange={(e) => setSelectedInstrument(e.target.value || null)}>   
          <option value="">All Instruments</option>
          {(options.categories || options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label} ({opt.count})</option>
          ))}
        </select>
      </div>
      <div className="space" />
      {filtered.length === 0 ? (
        <p className="muted">No samples loaded yet.</p>
      ) : (
  <div className="card compact" style={{ marginTop: 12 }}>
          <ZoneTrack samples={filtered} />
          <div className="space" />
          <div className="row wrap" style={{ gap: 12 }}>
            {filtered.map((s) => (
              <div key={s.id} style={{ border: '1px dashed var(--border)', borderRadius: 8, padding: 10, minWidth: 280 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{s.name}</strong>
                  <span className="muted">{getDisplayName(s.category || 'Uncategorized', manifest.ui?.groupNames || {})} • Root: {midiToName(s.rootMidi)}</span>
                </div>
                <div className="space" />
                <Waveform buffer={s.buffer} />
                <div className="space" />
                <div className="row wrap" style={{ gap: 8 }}>
                  <label className="row gap"><span className="muted">Root</span><input type="number" value={s.rootMidi} onChange={(e) => updateSample(s.id, { rootMidi: Number(e.target.value) })} /></label>
                  <label className="row gap"><span className="muted">Note Low</span><input type="number" value={s.noteLow} onChange={(e) => updateSample(s.id, { noteLow: Number(e.target.value) })} /></label>
                  <label className="row gap"><span className="muted">Note High</span><input type="number" value={s.noteHigh} onChange={(e) => updateSample(s.id, { noteHigh: Number(e.target.value) })} /></label>
                  <label className="row gap"><span className="muted">Vel Low</span><input type="number" value={s.velLow} onChange={(e) => updateSample(s.id, { velLow: Number(e.target.value) })} /></label>
                  <label className="row gap"><span className="muted">Vel High</span><input type="number" value={s.velHigh} onChange={(e) => updateSample(s.id, { velHigh: Number(e.target.value) })} /></label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useMemo, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import { getGroupOptions } from '../utils/groups.js';

export default function InstrumentLibrary() {
  const { manifest, setSelectedInstrument, setGroupName, saveGroupNames } = useInstrument();
  const names = manifest.ui?.groupNames || {};
  const options = useMemo(() => getGroupOptions(manifest.samples || [], names), [manifest.samples, names]);

  const selected = manifest.ui?.selectedInstrument || null;
  const [savedMsg, setSavedMsg] = useState('');

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Instrument Library</strong>
        <select value={selected || ''} onChange={(e) => setSelectedInstrument(e.target.value || null)}>
          <option value="">All Instruments</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label} ({opt.count})</option>
          ))}
        </select>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <button className="secondary" onClick={async () => {
            const ok = await saveGroupNames();
            setSavedMsg(ok ? 'Names saved!' : 'Save failed');
            setTimeout(() => setSavedMsg(''), 2000);
          }}>Save Names</button>
          {savedMsg && <span className="muted">{savedMsg}</span>}
        </div>
      </div>
      <div className="space" />
      {options.length === 0 ? (
        <div className="muted">No samples loaded yet.</div>
      ) : (
        <div className="row wrap" style={{ gap: 12 }}>
          {options.map((opt) => (
            <div key={opt.value} className="card compact" style={{ minWidth: 240 }}>
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{opt.label}</strong>
                <span className="muted">{opt.count}</span>
              </div>
              <div className="space" />
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Display Name</span>
                <input type="text" value={names[opt.value] || ''} onChange={(e) => setGroupName(opt.value, e.target.value)} placeholder={opt.value} />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useRef, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import SynthPanel from './SynthPanel.jsx';
import MasterMeter from './MasterMeter.jsx';
import SpectrumVisualizer from './SpectrumVisualizer.jsx';

export default function RightPanel({ engine }) {
  const [master, setMaster] = useState(0.85);
  const [activeTab, setActiveTab] = useState('Synth');
  const { manifest, toggleSustain, toggleSostenuto, setVelocityCurve } = useInstrument();
  const [mcOpen, setMcOpen] = useState(true);
  const [perfOpen, setPerfOpen] = useState(true);
  const masterRef = useRef(null);
  const perfRef = useRef(null);
  const fxRef = useRef(null);

  const onMasterChange = (e) => {
    const v = Number(e.target.value);
    setMaster(v);
    engine.setMasterGain(v);
  };
  const scrollTo = (ref) => ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="right-panel">
      <div className="row header justify-end">
        <div className="row gap-6">
          <button className="secondary" onClick={() => scrollTo(masterRef)} title="Scroll to Master Controls">Master</button>
          <button className="secondary" onClick={() => scrollTo(perfRef)} title="Scroll to Performance Settings">Performance</button>
          <button className="secondary" onClick={() => scrollTo(fxRef)} title="Scroll to Synth/FX Panel">Synth/FX</button>
        </div>
      </div>
  <div ref={masterRef} className="master-controls card compact collapsible">
          <div className="row header justify-between">
          <h2 className="title">MASTER</h2>
          <button className="btn-icon" title={mcOpen ? 'Collapse Master Controls' : 'Expand Master Controls'} onClick={() => setMcOpen((v) => !v)}>{mcOpen ? '▾' : '▸'}</button>
        </div>
        {mcOpen && (
          <>
            <div className="row">
                <label className="row gap-6">
                <span className="muted">Gain</span>
                <input type="range" min={0} max={1} step={0.01} value={master} onChange={onMasterChange} title="Adjust master output gain" />
              </label>
            </div>
            <div className="space" />
            <MasterMeter engine={engine} />
            <div className="space" />
              <div className="row justify-between">
              <span className="muted">Spectrum</span>
            </div>
            <SpectrumVisualizer engine={engine} height={100} />
          </>
        )}
      </div>
  <div ref={perfRef} className="card compact collapsible">
          <div className="row header justify-between">
          <h2 className="title" style={{ margin: 0 }}>PERFORMANCE</h2>
          <button className="btn-icon" title={perfOpen ? 'Collapse Performance Settings' : 'Expand Performance Settings'} onClick={() => setPerfOpen((v) => !v)}>{perfOpen ? '▾' : '▸'}</button>
        </div>
        {perfOpen && (
          <div className="row wrap gap-10">
            <label className="row gap-6">
              <span className="muted">Sustain</span>
              <input type="checkbox" checked={!!manifest.engine.sustain} onChange={(e) => toggleSustain(e.target.checked)} title="Toggle sustain pedal behavior" />
            </label>
            <label className="row gap-6">
              <span className="muted">Sostenuto</span>
              <input type="checkbox" checked={!!manifest.engine.sostenuto} onChange={(e) => toggleSostenuto(e.target.checked)} title="Toggle sostenuto pedal behavior" />
            </label>
            <label className="row gap-6">
              <span className="muted">Velocity Curve</span>
              <select value={manifest.engine.velocityCurve} onChange={(e) => setVelocityCurve(e.target.value)} title="Adjust how MIDI velocity affects volume">
                <option value="linear">Linear</option>
                <option value="soft">Soft</option>
                <option value="hard">Hard</option>
                <option value="log">Log</option>
                <option value="exp">Exp</option>
              </select>
            </label>
          </div>
        )}
      </div>
  <div ref={fxRef} className="effects-panel card compact">
        <div className="tabs header">
          <div className={`tab ${activeTab === 'Synth' ? 'active' : ''}`} onClick={() => setActiveTab('Synth')} title="Synthesizer parameters">Synth</div>
          <div className={`tab ${activeTab === 'FX' ? 'active' : ''}`} onClick={() => setActiveTab('FX')} title="Effects parameters">FX</div>
          <div className={`tab ${activeTab === 'Matrix' ? 'active' : ''}`} onClick={() => setActiveTab('Matrix')} title="Modulation matrix">Matrix</div>
        </div>
        <div className="tab-content">
          {activeTab === 'Synth' && <SynthPanel engine={engine} />}
          {activeTab === 'FX' && <div>FX Content</div>}
          {activeTab === 'Matrix' && <div>Matrix Content</div>}
        </div>
      </div>
    </div>
  );
}
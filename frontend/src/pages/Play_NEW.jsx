import React, { useEffect, useState, useRef } from 'react';
import '../styles/Play.css';
import { useInstrument } from '../state/instrument.jsx';
import FileDrop from '../components/FileDrop.jsx';
import InstrumentLibrary from '../components/InstrumentLibrary.jsx';
import SampleSelector from '../components/SampleSelector.jsx';
import Waveform from '../components/Waveform.jsx';
import SpectrumVisualizer from '../components/SpectrumVisualizer.jsx';
import MasterMeter from '../components/MasterMeter.jsx';
import SynthPanel from '../components/SynthPanel.jsx';
import BottomKeyboardDock from '../components/BottomKeyboardDock.jsx';

export default function Play({ engine, mode, setMode, compact }) {
  const { manifest, toggleSustain, toggleSostenuto, setVelocityCurve } = useInstrument();
  const selectedInstrument = manifest.ui?.selectedInstrument || null;
  
  // Panel collapse states
  const [sampleManagerOpen, setSampleManagerOpen] = useState(true);
  const [instrumentLibOpen, setInstrumentLibOpen] = useState(true);
  const [waveformOpen, setWaveformOpen] = useState(true);
  const [masterOpen, setMasterOpen] = useState(true);
  const [performanceOpen, setPerformanceOpen] = useState(true);
  const [synthFxOpen, setSynthFxOpen] = useState(true);
  
  // State
  const [sampleCount, setSampleCount] = useState(0);
  const [master, setMaster] = useState(0.85);
  const [activeWaveTab, setActiveWaveTab] = useState('wave');
  const [activeSynthTab, setActiveSynthTab] = useState('synth');
  
  const onSamplesLoaded = () => setSampleCount(engine?.samples?.length || 0);
  
  const onMasterChange = (e) => {
    const v = Number(e.target.value);
    setMaster(v);
    engine.setMasterGain(v);
  };

  useEffect(() => {
    // Prevent cross-group overlays when switching instruments
    try { engine.stopAllVoices?.(true); } catch {}
  }, [selectedInstrument]);

  const onNoteOn = (midi, velocity) => {
    try {
      if (selectedInstrument) {
        engine.noteOnCategory?.(midi, velocity, selectedInstrument);
      } else {
        engine.noteOn(midi, velocity);
      }
    } catch (e) { console.error(e); }
  };
  
  const onNoteOff = (midi) => {
    try { engine.noteOff(midi); } catch (e) { console.error(e); }
  };

  return (
    <div className="play-page-container">
      {/* Three-column layout */}
      <div className="play-grid">
        
        {/* LEFT PANEL - Sample & Instrument Management */}
        <div className="play-column play-left">
          
          {/* Sample Manager */}
          <div className="play-card">
            <div className="play-card-header" onClick={() => setSampleManagerOpen(!sampleManagerOpen)}>
              <h3 className="play-card-title">SAMPLE MANAGER</h3>
              <button className="play-collapse-btn">{sampleManagerOpen ? '▼' : '▶'}</button>
            </div>
            {sampleManagerOpen && (
              <div className="play-card-body">
                <FileDrop engine={engine} onSamplesLoaded={onSamplesLoaded} />
              </div>
            )}
          </div>

          {/* Instrument Library */}
          <div className="play-card">
            <div className="play-card-header" onClick={() => setInstrumentLibOpen(!instrumentLibOpen)}>
              <h3 className="play-card-title">INSTRUMENTS ({sampleCount})</h3>
              <button className="play-collapse-btn">{instrumentLibOpen ? '▼' : '▶'}</button>
            </div>
            {instrumentLibOpen && (
              <div className="play-card-body">
                <InstrumentLibrary />
              </div>
            )}
          </div>

        </div>

        {/* CENTER PANEL - Waveform & Visualization */}
        <div className="play-column play-center">
          
          <div className="play-card play-card-large">
            <div className="play-card-header">
              <h3 className="play-card-title">WAVEFORM</h3>
              <button className="play-collapse-btn" onClick={() => setWaveformOpen(!waveformOpen)}>
                {waveformOpen ? '▼' : '▶'}
              </button>
            </div>
            {waveformOpen && (
              <div className="play-card-body">
                {/* Sample Selector */}
                <div className="play-sample-selector-wrapper">
                  <SampleSelector engine={engine} />
                </div>
                
                {/* Tab Navigation */}
                <div className="play-tabs">
                  <button 
                    className={`play-tab ${activeWaveTab === 'wave' ? 'play-tab-active' : ''}`}
                    onClick={() => setActiveWaveTab('wave')}
                  >
                    Wave
                  </button>
                  <button 
                    className={`play-tab ${activeWaveTab === 'scope' ? 'play-tab-active' : ''}`}
                    onClick={() => setActiveWaveTab('scope')}
                  >
                    Scope
                  </button>
                  <button 
                    className={`play-tab ${activeWaveTab === 'spectrum' ? 'play-tab-active' : ''}`}
                    onClick={() => setActiveWaveTab('spectrum')}
                  >
                    Spectrum
                  </button>
                  <button 
                    className={`play-tab ${activeWaveTab === 'lfo' ? 'play-tab-active' : ''}`}
                    onClick={() => setActiveWaveTab('lfo')}
                  >
                    LFO
                  </button>
                </div>

                {/* Waveform Display */}
                <div className="play-waveform-container">
                  {activeWaveTab === 'wave' && (
                    engine?.samples?.length ? (
                      <Waveform buffer={engine.samples[0].buffer} height={280} />
                    ) : (
                      <div className="play-empty-state">
                        <span className="play-empty-text">Load samples to view waveform</span>
                      </div>
                    )
                  )}
                  {activeWaveTab === 'spectrum' && (
                    <div className="play-spectrum-wrapper">
                      <SpectrumVisualizer engine={engine} height={280} />
                    </div>
                  )}
                  {activeWaveTab === 'scope' && (
                    <div className="play-empty-state">
                      <span className="play-empty-text">Oscilloscope view</span>
                    </div>
                  )}
                  {activeWaveTab === 'lfo' && (
                    <div className="play-empty-state">
                      <span className="play-empty-text">LFO visualization</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* RIGHT PANEL - Controls & Effects */}
        <div className="play-column play-right">
          
          {/* Master Controls */}
          <div className="play-card">
            <div className="play-card-header" onClick={() => setMasterOpen(!masterOpen)}>
              <h3 className="play-card-title">MASTER</h3>
              <button className="play-collapse-btn">{masterOpen ? '▼' : '▶'}</button>
            </div>
            {masterOpen && (
              <div className="play-card-body">
                {/* Master Gain */}
                <div className="play-control-row">
                  <label className="play-label">Gain</label>
                  <div className="play-slider-wrapper">
                    <input 
                      type="range" 
                      min={0} 
                      max={1} 
                      step={0.01} 
                      value={master} 
                      onChange={onMasterChange}
                      className="play-slider"
                    />
                    <span className="play-value">{(master * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Master Meter */}
                <div className="play-meter-wrapper">
                  <label className="play-label">Level</label>
                  <MasterMeter engine={engine} />
                </div>

                {/* Mini Spectrum */}
                <div className="play-mini-spectrum">
                  <label className="play-label">Spectrum</label>
                  <SpectrumVisualizer engine={engine} height={80} />
                </div>
              </div>
            )}
          </div>

          {/* Performance Settings */}
          <div className="play-card">
            <div className="play-card-header" onClick={() => setPerformanceOpen(!performanceOpen)}>
              <h3 className="play-card-title">PERFORMANCE</h3>
              <button className="play-collapse-btn">{performanceOpen ? '▼' : '▶'}</button>
            </div>
            {performanceOpen && (
              <div className="play-card-body">
                <div className="play-control-row">
                  <label className="play-label">Sustain</label>
                  <input 
                    type="checkbox" 
                    checked={!!manifest.engine.sustain} 
                    onChange={(e) => toggleSustain(e.target.checked)}
                    className="play-checkbox"
                  />
                </div>
                
                <div className="play-control-row">
                  <label className="play-label">Sostenuto</label>
                  <input 
                    type="checkbox" 
                    checked={!!manifest.engine.sostenuto} 
                    onChange={(e) => toggleSostenuto(e.target.checked)}
                    className="play-checkbox"
                  />
                </div>

                <div className="play-control-row">
                  <label className="play-label">Velocity Curve</label>
                  <select 
                    value={manifest.engine.velocityCurve} 
                    onChange={(e) => setVelocityCurve(e.target.value)}
                    className="play-select"
                  >
                    <option value="linear">Linear</option>
                    <option value="soft">Soft</option>
                    <option value="hard">Hard</option>
                    <option value="log">Logarithmic</option>
                    <option value="exp">Exponential</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Synth/FX Panel */}
          <div className="play-card play-card-expandable">
            <div className="play-card-header" onClick={() => setSynthFxOpen(!synthFxOpen)}>
              <h3 className="play-card-title">SYNTH / FX</h3>
              <button className="play-collapse-btn">{synthFxOpen ? '▼' : '▶'}</button>
            </div>
            {synthFxOpen && (
              <div className="play-card-body">
                {/* Tabs */}
                <div className="play-tabs">
                  <button 
                    className={`play-tab ${activeSynthTab === 'synth' ? 'play-tab-active' : ''}`}
                    onClick={() => setActiveSynthTab('synth')}
                  >
                    Synth
                  </button>
                  <button 
                    className={`play-tab ${activeSynthTab === 'fx' ? 'play-tab-active' : ''}`}
                    onClick={() => setActiveSynthTab('fx')}
                  >
                    FX
                  </button>
                  <button 
                    className={`play-tab ${activeSynthTab === 'matrix' ? 'play-tab-active' : ''}`}
                    onClick={() => setActiveSynthTab('matrix')}
                  >
                    Matrix
                  </button>
                </div>

                {/* Tab Content */}
                <div className="play-tab-content">
                  {activeSynthTab === 'synth' && <SynthPanel engine={engine} />}
                  {activeSynthTab === 'fx' && (
                    <div className="play-empty-state">
                      <span className="play-empty-text">FX controls coming soon</span>
                    </div>
                  )}
                  {activeSynthTab === 'matrix' && (
                    <div className="play-empty-state">
                      <span className="play-empty-text">Modulation matrix coming soon</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Bottom Keyboard Dock */}
      <BottomKeyboardDock engine={engine} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
    </div>
  );
}

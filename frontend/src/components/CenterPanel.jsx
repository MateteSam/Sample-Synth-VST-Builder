import React from 'react';
import Waveform from './Waveform.jsx';
import SampleSelector from './SampleSelector.jsx';
export default function CenterPanel({ engine }) {
  return (
    <div className="center-panel">
      <div className="waveform-viewer card">
        <SampleSelector engine={engine} />
        <div className="tabs">
          <div className="tab active" title="Waveform view">Wave</div>
          <div className="tab" title="Oscilloscope view">Scope</div>
          <div className="tab" title="Spectrum analyzer view">Spectrum</div>
          <div className="tab" title="Low-Frequency Oscillator view">LFO</div>
        </div>
        <div className="waveform-display">
          {engine?.samples?.length ? (
            <Waveform buffer={engine.samples[0].buffer} height={220} />
          ) : (
            <div className="row" style={{ justifyContent: 'center', height: '100%' }}>
              <span className="muted">Load a sample to see the waveform</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
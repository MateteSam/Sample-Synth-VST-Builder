import React, { useState } from 'react';
import FileDrop from './FileDrop.jsx';
import InstrumentLibrary from './InstrumentLibrary.jsx';

export default function LeftPanel({ engine }) {
  const [count, setCount] = useState(0);
  const onLoaded = () => setCount(engine?.samples?.length || 0);
  const [smOpen, setSmOpen] = useState(true);
  const [ilOpen, setIlOpen] = useState(true);
  const [pbOpen, setPbOpen] = useState(false);
  return (
    <div className="left-panel">
      <div className="sample-manager card collapsible">
        <div className="row header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="title" style={{ margin: 0 }}>SAMPLE MANAGER</h2>
          <button className="btn-icon" title={smOpen ? 'Collapse' : 'Expand'} onClick={() => setSmOpen((v) => !v)}>{smOpen ? '▾' : '▸'}</button>
        </div>
        {smOpen && (
          <div className="card-body">
            <FileDrop engine={engine} onSamplesLoaded={onLoaded} title="Drag and drop audio files or folders here to load samples." />
          </div>
        )}
      </div>
      <div className="instrument-library card collapsible">
        <div className="row header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="title" style={{ margin: 0 }}>INSTRUMENT LIBRARY ({count})</h2>
          <button className="btn-icon" title={ilOpen ? 'Collapse' : 'Expand'} onClick={() => setIlOpen((v) => !v)}>{ilOpen ? '▾' : '▸'}</button>
        </div>
        {ilOpen && (
          <div className="card-body">
            <InstrumentLibrary />
          </div>
        )}
      </div>
      <div className="playback-settings card collapsible">
        <div className="row header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="title" style={{ margin: 0 }}>PLAYBACK SETTINGS</h2>
          <button className="btn-icon" title={pbOpen ? 'Collapse' : 'Expand'} onClick={() => setPbOpen((v) => !v)}>{pbOpen ? '▾' : '▸'}</button>
        </div>
        {pbOpen && (
          <div className="card-body">
            <div className="setting">
              <span>Round Robin</span>
              <select title="Determines how samples are selected when multiple are available for a single note.">
                <option>Sequential</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
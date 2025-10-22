import React from 'react';

const MODES = ['PLAY', 'MAP', 'SEQUENCE', 'DESIGN', 'LIVE', 'TEST'];

export default function TopNav({ mode, setMode }) {
  return (
    <div className="row wrap gap-8 justify-center topnav">
      {MODES.map((m) => (
        <button
          key={m}
          className={`tab-btn ${mode === m ? 'active' : ''}`}
          onClick={() => setMode(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
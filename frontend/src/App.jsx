import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import Play from './pages/Play.jsx';
import Map from './pages/Map.jsx';
import Sequence from './pages/Sequence.jsx';
import Design from './pages/Design.jsx';
import Live from './pages/Live.jsx';
import Test from './pages/TestPage.jsx';
import AudioEngine from './audio/AudioEngine.js';
import { InstrumentProvider } from './state/instrument.jsx';

export default function App() {
  const [mode, setMode] = useState('PLAY');
  const [engine] = useState(() => new AudioEngine());
  const [samples, setSamples] = useState([]);
  const [compact, setCompact] = useState(() => {
    try { return localStorage.getItem('play_compact_mode') === '1'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('play_compact_mode', compact ? '1' : '0'); } catch {}
  }, [compact]);

  useEffect(() => {
    const MODES = ['PLAY', 'MAP', 'SEQUENCE', 'DESIGN', 'LIVE', 'TEST'];
    const handleKeyDown = (e) => {
      // Number keys 1..6 map to modes
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= MODES.length) {
        setMode(MODES[num - 1]);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowRight') {
        const idx = MODES.indexOf(mode);
        const next = (idx + 1) % MODES.length;
        setMode(MODES[next]);
        e.preventDefault();
        return;
      }
      if (e.key === 'ArrowLeft') {
        const idx = MODES.indexOf(mode);
        const prev = (idx - 1 + MODES.length) % MODES.length;
        setMode(MODES[prev]);
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, setMode]);

  return (
    <InstrumentProvider engine={engine}>
      <div className="container theme-dark">
        <Header mode={mode} setMode={setMode} compact={compact} setCompact={setCompact} />
        <div className="content">
          <div className={`view view-${mode} ${compact ? 'compact' : ''}`} key={mode}>
            {mode === 'PLAY' && <Play engine={engine} mode={mode} setMode={setMode} compact={compact} />}
            {mode === 'MAP' && <Map engine={engine} samples={samples} setSamples={setSamples} />}
            {mode === 'SEQUENCE' && <Sequence engine={engine} />}
            {mode === 'DESIGN' && <Design />}
            {mode === 'LIVE' && <Live />}
            {mode === 'TEST' && <Test engine={engine} />}
          </div>
        </div>
      </div>
    </InstrumentProvider>
  );
}
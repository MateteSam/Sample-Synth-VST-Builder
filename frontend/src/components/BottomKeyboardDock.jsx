import React, { useEffect, useMemo, useRef, useState } from 'react';
import Keyboard from './Keyboard.jsx';

export default function BottomKeyboardDock({ engine, onNoteOn, onNoteOff }) {
  const [octave, setOctave] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [kbHeight, setKbHeight] = useState(120);
  const [showLabels, setShowLabels] = useState(true);
  const startYRef = useRef(0);
  const startHRef = useRef(120);
  const resizingRef = useRef(false);
  const startMidi = useMemo(() => Math.max(12, Math.min(96, 48 + octave * 12)), [octave]);
  const endMidi = useMemo(() => Math.min(108, startMidi + 24), [startMidi]);
  const decOct = () => setOctave((o) => Math.max(-3, o - 1));
  const incOct = () => setOctave((o) => Math.min(4, o + 1));

  useEffect(() => {
    // Load persisted settings
    try {
      const h = Number(localStorage.getItem('kb_dock_height'));
      if (!Number.isNaN(h)) setKbHeight(Math.max(100, Math.min(300, h)));
      const lbl = localStorage.getItem('kb_show_labels');
      if (lbl != null) setShowLabels(lbl === '1');
    } catch {}

    const onMove = (e) => {
      if (!resizingRef.current) return;
      const delta = startYRef.current - e.clientY;
      const next = Math.max(100, Math.min(300, startHRef.current + delta));
      setKbHeight(next);
    };
    const onUp = () => {
      resizingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    if (resizingRef.current) {
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    }
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  useEffect(() => {
    try { localStorage.setItem('kb_dock_height', String(kbHeight)); } catch {}
  }, [kbHeight]);
  useEffect(() => {
    try { localStorage.setItem('kb_show_labels', showLabels ? '1' : '0'); } catch {}
  }, [showLabels]);

  const beginResize = (e) => {
    resizingRef.current = true;
    startYRef.current = e.clientY;
    startHRef.current = kbHeight;
  };

  return (
    <div className="keyboard-dock" style={{ flexShrink: 0 }}>
      <div className="keyboard-dock-header">
        <div className="keyboard-dock-title">
          <span className="keyboard-icon">🎹</span>
          <strong>PIANO KEYBOARD</strong>
          <span className="keyboard-range-badge">MIDI {startMidi}–{endMidi}</span>
        </div>
        <div className="keyboard-dock-controls">
          <button className="kbd-btn kbd-btn-octave" onClick={decOct} title="Shift octave down">
            <span>−</span>
          </button>
          <span className="kbd-octave-display">Oct {octave >= 0 ? '+' : ''}{octave}</span>
          <button className="kbd-btn kbd-btn-octave" onClick={incOct} title="Shift octave up">
            <span>+</span>
          </button>
          
          <div className="kbd-divider"></div>
          
          <label className="kbd-checkbox-label" title="Show note names on keys">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
            <span>Labels</span>
          </label>
          
          <div className="kbd-divider"></div>
          
          <label className="kbd-slider-label" title="Modulation wheel depth">
            <span>Mod</span>
            <input type="range" min={0} max={127} step={1} defaultValue={0} 
              onChange={(e) => {
                try { engine.setModWheel?.(Number(e.target.value)); } catch {}
              }} 
              className="kbd-mod-slider"
            />
          </label>
          
          <div className="kbd-divider"></div>
          
          <button className="kbd-btn kbd-btn-toggle" onClick={() => setCollapsed((c) => !c)} title={collapsed ? 'Show keyboard' : 'Hide keyboard'}>
            {collapsed ? '▲' : '▼'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div className="keyboard-resize-handle" onPointerDown={beginResize} title="Drag to resize keyboard" />
          <div className="space" />
          <Keyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} startMidi={startMidi} endMidi={endMidi} height={kbHeight} showLabels={showLabels} />
        </>
      )}
    </div>
  );
}
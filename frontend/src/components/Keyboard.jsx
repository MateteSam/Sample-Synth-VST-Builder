import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import { midiToName } from '../utils/music.js';

function isBlack(midi) { return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12); }
function isWhite(midi) { return !isBlack(midi); }

export default function Keyboard({ onNoteOn, onNoteOff, startMidi = 48, endMidi = 72, height = 160, blackWidthRatio = 0.6, showLabels = true }) {
  const { toggleSustain } = useInstrument();
  const { whites, blacks, whiteCount } = useMemo(() => {
    const whites = [], blacks = [];
    let wIndex = 0;
    for (let m = startMidi; m <= endMidi; m++) {
      if (isWhite(m)) {
        whites.push({ midi: m, index: wIndex });
        wIndex++;
      } else {
        // position between previous and next white key
        const pos = wIndex - 0.5; // after previous white
        blacks.push({ midi: m, pos });
      }
    }
    return { whites, blacks, whiteCount: wIndex };
  }, [startMidi, endMidi]);

  const blackWidthPct = (blackWidthRatio * 100) / whiteCount;
  const [active, setActive] = useState(new Set());
  const downKeysRef = useRef(new Map()); // keyboard key -> midi
  const pressedPointerRef = useRef(new Map()); // pointerId -> midi
  const sustainDownRef = useRef(false);

  // Computer keyboard mapping (two octaves starting at startMidi)
  const BASE = startMidi;
  const KEY_TO_OFFSET = {
    a:0, w:1, s:2, e:3, d:4, f:5, t:6, g:7, y:8, h:9, u:10, j:11, k:12,
    o:13, l:14, p:15, ';':16, "'":17
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      const k = (e.key || '').toLowerCase();
      if (e.code === 'Space' || k === ' ') {
        if (!sustainDownRef.current) {
          sustainDownRef.current = true;
          try { toggleSustain(true); } catch {}
        }
        e.preventDefault();
        return;
      }
      if (!(k in KEY_TO_OFFSET)) return;
      e.preventDefault();
      if (downKeysRef.current.has(k)) return; // avoid repeats
      const midi = BASE + KEY_TO_OFFSET[k];
      const velocity = e.shiftKey ? 120 : e.altKey ? 70 : e.ctrlKey ? 90 : 100;
      onNoteOn?.(midi, velocity);
      downKeysRef.current.set(k, midi);
      setActive((prev) => new Set(prev).add(midi));
    };
    const onKeyUp = (e) => {
      const k = (e.key || '').toLowerCase();
      if (e.code === 'Space' || k === ' ') {
        if (sustainDownRef.current) {
          sustainDownRef.current = false;
          try { toggleSustain(false); } catch {}
        }
        e.preventDefault();
        return;
      }
      const midi = downKeysRef.current.get(k);
      if (midi == null) return;
      e.preventDefault();
      onNoteOff?.(midi);
      downKeysRef.current.delete(k);
      setActive((prev) => { const s = new Set(prev); s.delete(midi); return s; });
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [BASE, onNoteOn, onNoteOff]);

  const handlePointerDown = (midi) => (e) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      const velocity = Math.max(1, Math.min(127, Math.round(127 * (1 - y / rect.height))));
      onNoteOn?.(midi, velocity);
      setActive((prev) => new Set(prev).add(midi));
      e.currentTarget.setPointerCapture?.(e.pointerId);
      pressedPointerRef.current.set(e.pointerId, midi);
    } catch {}
  };
  const handlePointerUp = (e) => {
    const midi = pressedPointerRef.current.get(e.pointerId);
    if (midi != null) {
      onNoteOff?.(midi);
      setActive((prev) => { const s = new Set(prev); s.delete(midi); return s; });
      pressedPointerRef.current.delete(e.pointerId);
    }
  };

  return (
    <div className="keyboard" style={{ ['--white-count']: whiteCount, height }} onPointerUp={handlePointerUp}>
      <div className="white-keys" style={{ ['--white-count']: whiteCount }}>
        {whites.map((w) => (
          <div
            key={w.midi}
            className={`white-key${active.has(w.midi) ? ' active playing' : ''}`}
            onPointerDown={handlePointerDown(w.midi)}
            title={midiToName(w.midi)}
          >
            {showLabels && <span className="note-label">{midiToName(w.midi)}</span>}
          </div>
        ))}
      </div>
      <div className="black-keys">
        {blacks.map((b) => {
          const leftPct = ((b.pos / whiteCount) * 100);
          const style = { left: `${leftPct}%`, width: `${blackWidthPct}%`, transform: 'translateX(-50%)' };
          return (
            <div
              key={b.midi}
              className={`black-key${active.has(b.midi) ? ' active playing' : ''}`}
              style={style}
              onPointerDown={handlePointerDown(b.midi)}
              title={midiToName(b.midi)}
            />
          );
        })}
      </div>
    </div>
  );
}
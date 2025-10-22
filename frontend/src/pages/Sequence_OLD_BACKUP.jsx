import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import { getGroupOptions } from '../utils/groups.js';
import '../styles/Sequence.css';

export default function Sequence({ engine }) {
  const { manifest, setManifest } = useInstrument();
  const [patternLength, setPatternLength] = useState(16);
  const stepsCount = patternLength;
  const TRACK_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#a855f7', '#14b8a6'];
  const [tempo, setTempo] = useState(120);
  const [running, setRunning] = useState(false);
  const [swing, setSwing] = useState(0); // 0..0.5
  const [subdivision, setSubdivision] = useState('1/16'); // '1/4' | '1/8' | '1/16' | '1/32'
  const [currentStep, setCurrentStep] = useState(0);
  const [masterLevel, setMasterLevel] = useState(0);
  const [limiterOn, setLimiterOn] = useState(true);
  const [resetRROnBar, setResetRROnBar] = useState(false);
  const [mode, setMode] = useState('piano'); // 'grid' | 'piano' | 'wave' | 'music'
  const [scaleRoot, setScaleRoot] = useState('C');
  const [scaleType, setScaleType] = useState('Major'); // 'Major' | 'Minor' | 'None'
  const [tool, setTool] = useState('draw'); // 'draw' | 'vel'
  // Additional edit tools for piano roll
  // 'select' toggles selection on notes; 'length' adjusts note length by dragging horizontally
  useEffect(() => {
    if (tool !== 'length') return;
    // no-op hook placeholder for future cursor feedback
  }, [tool]);
  const [clipboardPattern, setClipboardPattern] = useState(null);
  const [tracks, setTracks] = useState(() => {
    return [
      { id: crypto.randomUUID(), name: 'Track 1', color: TRACK_COLORS[0], instrument: '', articulation: '', mic: '', rrMode: 'cycle', mute: false, solo: false, armed: false, volume: 0.9, pan: 0, midi: 60, velocity: 100, density: 0.3, pattern: Array.from({ length: stepsCount }, () => 0), notes: [], velocities: Array.from({ length: stepsCount }, () => 100) },
      { id: crypto.randomUUID(), name: 'Track 2', color: TRACK_COLORS[1], instrument: '', articulation: '', mic: '', rrMode: 'cycle', mute: false, solo: false, armed: false, volume: 0.9, pan: 0, midi: 62, velocity: 100, density: 0.3, pattern: Array.from({ length: stepsCount }, () => 0), notes: [], velocities: Array.from({ length: stepsCount }, () => 100) },
    ];
  });
  // Resize existing patterns when global pattern length changes
  useEffect(() => {
    setTracks((ts) => ts.map((t) => {
      const pat = t.pattern.slice(0, stepsCount);
      while (pat.length < stepsCount) pat.push(0);
      return { ...t, pattern: pat };
    }));
  }, [stepsCount]);
  const timerRef = useRef(null);

  const names = manifest.ui?.groupNames || {};
  const sampleCount = engine?.samples?.length || 0;
  const options = useMemo(() => getGroupOptions(engine?.samples || [], names), [sampleCount, names]);

  // Chord progression + melody track state for Music mode
  const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  const nameToSemi = (name) => NOTE_NAMES.indexOf(name);
  const [chordTrack, setChordTrack] = useState({ instrument: '', articulation: '', mic: '', rrMode: 'cycle', velocity: 100, octave: 4, volume: 1, pan: 0 });
  const [melodyTrack, setMelodyTrack] = useState({ instrument: '', articulation: '', mic: '', rrMode: 'cycle', velocity: 100, volume: 1, pan: 0, notes: [], velocities: Array.from({ length: stepsCount }, () => 100) });
  const [chords, setChords] = useState(() => Array.from({ length: stepsCount }, () => ({ root: 'C', quality: 'Maj', inversion: 0, octave: 4, velocity: 100 })));
  useEffect(() => {
    setChords((cs) => { const next = cs.slice(0, stepsCount); while (next.length < stepsCount) next.push({ root: 'C', quality: 'Maj', inversion: 0, octave: 4, velocity: 100 }); return next; });
    setMelodyTrack((mt) => ({ ...mt, velocities: Array.from({ length: stepsCount }, (_, i) => (mt.velocities?.[i] ?? 100)) }));
  }, [stepsCount]);

  // Persist sequencer state into global manifest for export
  useEffect(() => {
    const simplifyTrack = (t) => ({
      id: t.id, name: t.name, color: t.color, instrument: t.instrument, articulation: t.articulation, mic: t.mic,
      rrMode: t.rrMode, mute: !!t.mute, solo: !!t.solo, armed: !!t.armed, volume: t.volume, pan: t.pan,
      midi: t.midi, velocity: t.velocity, density: t.density, pattern: Array.from(t.pattern || []),
      notes: Array.from(t.notes || []).map((n) => ({ start: n.start, length: n.length, midi: n.midi, level: n.level })),
      velocities: Array.from(t.velocities || []),
    });
    const payload = {
      bpm: tempo,
      subdivision,
      swing,
      stepsCount,
      mode,
      scaleRoot,
      scaleType,
      tracks: tracks.map(simplifyTrack),
      music: {
        chordTrack: { instrument: chordTrack.instrument, articulation: chordTrack.articulation, mic: chordTrack.mic, rrMode: chordTrack.rrMode, velocity: chordTrack.velocity, octave: chordTrack.octave, volume: chordTrack.volume, pan: chordTrack.pan },
        chords: chords.map((c) => ({ root: c.root, quality: c.quality, inversion: c.inversion, octave: c.octave, velocity: c.velocity })),
        melodyTrack: {
          instrument: melodyTrack.instrument, articulation: melodyTrack.articulation, mic: melodyTrack.mic, rrMode: melodyTrack.rrMode,
          velocity: melodyTrack.velocity, volume: melodyTrack.volume, pan: melodyTrack.pan,
          notes: Array.from(melodyTrack.notes || []).map((n) => ({ start: n.start, length: n.length, midi: n.midi, level: n.level })),
          velocities: Array.from(melodyTrack.velocities || []),
        },
      },
    };
    try {
      setManifest((m) => ({ ...m, sequence: payload }));
    } catch {}
  }, [tempo, subdivision, swing, stepsCount, mode, scaleRoot, scaleType, tracks, chords, chordTrack, melodyTrack, setManifest]);

  const QUALITY_INTERVALS = {
    Maj: [0,4,7], Min: [0,3,7], Dim: [0,3,6], Sus2: [0,2,7], Sus4: [0,5,7],
    Maj7: [0,4,7,11], Min7: [0,3,7,10], Dom7: [0,4,7,10],
  };
  const getChordNotes = (ch, rootNameFallback, scaleTypeFallback) => {
    const rootName = ch.root || rootNameFallback || 'C';
    const quality = ch.quality || 'Maj';
    const inv = Math.max(0, Math.min(3, Number(ch.inversion || 0)));
    const semi = nameToSemi(rootName);
    const baseMidi = 12 * ((ch.octave ?? 4) + 1) + (semi >= 0 ? semi : 0);
    const ints = (QUALITY_INTERVALS[quality] || QUALITY_INTERVALS['Maj']).slice();
    // apply inversion: move first interval to top by +12 for each inversion
    for (let i = 0; i < inv; i++) { const x = ints.shift(); ints.push((x ?? 0) + 12); }
    return ints.map((iv) => baseMidi + iv);
  };

  useEffect(() => {
    if (!running) return;
    let cancelled = false;
    let step = 0;
    const qn = (60 / tempo) * 1000; // quarter note in ms
    const base = (subdivision === '1/4') ? qn
      : (subdivision === '1/8') ? qn / 2
      : (subdivision === '1/16') ? qn / 4
      : qn / 8; // '1/32'

    const getDelayForStep = (i) => {
      if (subdivision === '1/8' || subdivision === '1/16') {
        const isOffbeat = i % 2 === 1;
        const s = Math.max(0, Math.min(0.5, swing));
        return isOffbeat ? base * (1 + s) : base * (1 - s);
      }
      return base;
    };

    const tick = () => {
      if (cancelled) return;
      setCurrentStep(step);
      const anySolo = tracks.some((t) => t.solo);
      const levelMap = [0, 0.6, 0.85, 1];
      const playable = (mode === 'music') ? (() => {
        const arr = tracks.slice();
        try {
          const chord = chords?.[step];
          if (chord && chordTrack?.instrument) {
            const ns = getChordNotes(chord, scaleRoot, scaleType).map((m) => ({ start: step, midi: m, level: 3 }));
            arr.push({ id: 'chords', instrument: chordTrack.instrument, articulation: chordTrack.articulation || null, mic: chordTrack.mic || null, rrMode: chordTrack.rrMode || 'cycle', volume: chordTrack.volume ?? 1, pan: chordTrack.pan ?? 0, velocity: chordTrack.velocity ?? 100, notes: ns });
          }
        } catch {}
        try { if (melodyTrack?.instrument) arr.push({ ...melodyTrack }); } catch {}
        return arr;
      })() : tracks;
      for (const tr of playable) {
        if (tr.mute) continue;
        if (anySolo && !tr.solo) continue;
        if (tr.notes && Array.isArray(tr.notes)) {
          const notes = tr.notes || [];
          for (const n of notes) {
            if (n.start === step && tr.instrument) {
              const perStep = Math.max(1, Math.min(127, Number((tr.velocities || [])[step] ?? 100)));
              const vel = Math.round(((tr.velocity ?? 100) * levelMap[Math.min(3, Number(n.level ?? 2))]) * (perStep / 100));
              try {
                engine.noteOnCategory(
                  Number(n.midi || tr.midi || 60),
                  vel,
                  tr.instrument,
                  tr.articulation || null,
                  tr.mic || null,
                  tr.rrMode || 'cycle',
                  { gain: tr.volume ?? 1, pan: tr.pan ?? 0 }
                );
              } catch {}
            }
          }
        } else {
          const lvl = Number(tr.pattern[step] || 0);
          if (lvl > 0 && tr.instrument) {
            const perStep = Math.max(1, Math.min(127, Number((tr.velocities || [])[step] ?? 100)));
            const vel = Math.round(((tr.velocity ?? 100) * levelMap[Math.min(3, lvl)]) * (perStep / 100));
            try {
              engine.noteOnCategory(
                tr.midi,
                vel,
                tr.instrument,
                tr.articulation || null,
                tr.mic || null,
                tr.rrMode || 'cycle',
                { gain: tr.volume ?? 1, pan: tr.pan ?? 0 }
              );
            } catch {}
          }
        }
      }
      const delay = getDelayForStep(step);
      const nextStep = (step + 1) % stepsCount;
      if (resetRROnBar && nextStep === 0) {
        try { engine.resetRR?.(); } catch {}
      }
      step = nextStep;
      timerRef.current = setTimeout(tick, delay);
    };
    tick();
    return () => { cancelled = true; clearTimeout(timerRef.current); };
  }, [running, tempo, subdivision, swing, stepsCount, tracks, engine]);

  // Stop all voices when transport stops
  useEffect(() => {
    if (!running) {
      try { engine.stopAllVoices?.(true); } catch {}
    }
  }, [running, engine]);

  // Ensure tracks have density initialized
  useEffect(() => {
    setTracks((ts) => ts.map((t) => (t.density == null ? { ...t, density: 0.3 } : t)));
  }, []);

  const toggleStep = (trackId, i) => {
    setTracks((ts) => ts.map((t) => {
      if (t.id !== trackId) return t;
      const next = { ...t, pattern: t.pattern.slice() };
      const cur = Number(next.pattern[i] || 0);
      next.pattern[i] = (cur + 1) % 4; // 0(off)->1->2->3->0
      return next;
    }));
  };

  // MultiTrack Piano Roll: stacked per-track rows with gutter and velocity lane
  const MultiTrackPianoRoll = ({ tracks, stepsCount, currentStep, onToggle, onMute, onArm, onSetVel, scaleRoot, scaleType }) => {
    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const midiToName = (m) => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
    const range = Array.from({ length: 13 }, (_, i) => 72 - i); // compact rows: C5..C4
    const rootIdx = NOTE_NAMES.indexOf(scaleRoot);
    const intervals = scaleType === 'Major' ? [0,2,4,5,7,9,11] : (scaleType === 'Minor' ? [0,2,3,5,7,8,10] : []);
    const inScale = (m) => intervals.length > 0 && intervals.includes(((m % 12) - rootIdx + 12) % 12);

    const laneHeight = 40;
    const handleVelClick = (e, tr, stepIdx) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const pct = Math.round((1 - (y / laneHeight)) * 100);
      onSetVel(tr.id, stepIdx, pct);
    };
    const handleVelMove = (e, tr, stepIdx) => {
      if (!(e.buttons & 1)) return; // only when mouse button held
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const pct = Math.round((1 - (y / laneHeight)) * 100);
      onSetVel(tr.id, stepIdx, pct);
    };

    return (
      <div className="mtpr">
        {tracks.map((tr) => (
          <div key={tr.id} className="mtpr-row mt-8">
            <div className="row align-stretch gap-8">
              <div className="mtpr-gutter" style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="row gap-8" style={{ alignItems: 'center' }}>
                  <div className="dot" style={{ background: tr.color || '#555' }} />
                  <div className="fw-600">{tr.name}</div>
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button className={tr.mute ? 'danger' : 'secondary'} onClick={() => onMute(tr.id, !tr.mute)}>M</button>
                  <button className={tr.armed ? 'secondary' : ''} onClick={() => onArm(tr.id, !tr.armed)}>R</button>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="piano-roll" style={{ border: 'none' }}>
                  <div className="pr-keys">
                    {range.map((m) => (
                      <div key={m} className="pr-key">{midiToName(m)}</div>
                    ))}
                  </div>
                  <div className="pr-grid">
                    {range.map((m) => (
                      <div key={m} className={`pr-row ${inScale(m) ? 'scale' : ''}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${stepsCount}, 1fr)`, gap: 4 }}>
                        {Array.from({ length: stepsCount }, (_, i) => {
                          const activeNote = (tr.notes || []).find((n) => Number(n.start) === i && Number(n.midi) === m);
                          const active = !!activeNote;
                          const selected = !!activeNote?.selected;
                          const playing = i === currentStep;
                          const onPointerDown = () => onToggle(tr.id, i, m);
                          const onPointerEnter = (e) => { if (e.buttons & 1) onToggle(tr.id, i, m); };
                          return (
                            <div
                              key={i}
                              className={`pr-cell ${active ? 'active' : ''} ${selected ? 'selected' : ''} ${playing ? 'playing' : ''}`}
                              onPointerDown={onPointerDown}
                              onPointerEnter={onPointerEnter}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="row" style={{ gap: 4, marginTop: 6 }}>
                  <div className="muted" style={{ width: 120, textAlign: 'right' }}>Velocity</div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${stepsCount}, 1fr)`, gap: 4 }}>
                    {Array.from({ length: stepsCount }, (_, i) => {
                      const pct = Number((tr.velocities || [])[i] ?? 100);
                      return (
                        <div key={i} style={{ background: '#0b1220', border: '1px solid var(--border)', borderRadius: 4, height: laneHeight, position: 'relative', cursor: 'pointer' }} onClick={(e) => handleVelClick(e, tr, i)} onMouseMove={(e) => handleVelMove(e, tr, i)}>
                          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${Math.max(0, Math.min(100, pct))}%`, background: 'rgba(34,197,94,0.6)' }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  const setTrackInstrument = (trackId, name) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, instrument: name || '' } : t)));
  };

  const setTrackArticulation = (trackId, art) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, articulation: art || '' } : t)));
  };

  const setTrackMic = (trackId, mic) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, mic: mic || '' } : t)));
  };

  const setTrackRRMode = (trackId, mode) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, rrMode: mode || 'cycle' } : t)));
  };

  const setTrackMute = (trackId, on) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, mute: !!on } : t)));
  };
  const setTrackSolo = (trackId, on) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, solo: !!on } : t)));
  };
  const setTrackArmed = (trackId, on) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, armed: !!on } : t)));
  };
  const setTrackVolume = (trackId, vol) => {
    const v = Math.max(0, Math.min(1, Number(vol)));
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, volume: v } : t)));
  };
  const setTrackPan = (trackId, pan) => {
    const p = Math.max(-1, Math.min(1, Number(pan)));
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, pan: p } : t)));
  };

  const setTrackName = (trackId, name) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, name } : t)));
  };

  const setTrackColor = (trackId, color) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, color } : t)));
  };

  const setTrackDensity = (trackId, density) => {
    const d = Math.max(0, Math.min(1, Number(density)));
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, density: d } : t)));
  };

  const copyPattern = (trackId) => {
    const tr = tracks.find((t) => t.id === trackId);
    if (!tr) return;
    setClipboardPattern(tr.pattern.slice());
  };

  const pastePattern = (trackId) => {
    if (!clipboardPattern) return;
    setTracks((ts) => ts.map((t) => {
      if (t.id !== trackId) return t;
      const pat = clipboardPattern.slice(0, stepsCount);
      while (pat.length < stepsCount) pat.push(0);
      return { ...t, pattern: pat };
    }));
  };

  const clearPattern = (trackId) => {
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, pattern: Array.from({ length: stepsCount }, () => 0) } : t)));
  };

  const fillPattern = (trackId, type) => {
    const pat = Array.from({ length: stepsCount }, () => 0);
    if (type === '4s') {
      for (let i = 0; i < stepsCount; i++) { if (i % 4 === 0) pat[i] = 3; }
    } else if (type === '8s') {
      for (let i = 0; i < stepsCount; i++) { if (i % 2 === 0) pat[i] = 2; }
    } else if (type === '3s') {
      for (let i = 0; i < stepsCount; i++) { if (i % 3 === 0) pat[i] = 2; }
    } else if (type === 'rand') {
      const density = (tracks.find((t) => t.id === trackId)?.density) ?? 0.3;
      for (let i = 0; i < stepsCount; i++) {
        if (Math.random() < density) pat[i] = 1 + Math.floor(Math.random() * 3);
      }
    }
    setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, pattern: pat } : t)));
  };

  const quantizePattern = (trackId, grid) => {
    setTracks((ts) => ts.map((t) => {
      if (t.id !== trackId) return t;
      const keepModulo = grid === '4s' ? 4 : grid === '8s' ? 2 : 3;
      const p = t.pattern.map((lvl, i) => (i % keepModulo === 0 ? lvl : 0));
      return { ...t, pattern: p };
    }));
  };

  const shiftPattern = (trackId, dir) => {
    setTracks((ts) => ts.map((t) => {
      if (t.id !== trackId) return t;
      const p = t.pattern.slice();
      if (dir === 'left') {
        const first = p.shift();
        p.push(first ?? 0);
      } else {
        const last = p.pop();
        p.unshift(last ?? 0);
      }
      return { ...t, pattern: p };
    }));
  };

  const invertPattern = (trackId) => {
    setTracks((ts) => ts.map((t) => {
      if (t.id !== trackId) return t;
      const p = t.pattern.map((lvl) => {
        const n = Number(lvl || 0);
        if (n === 0) return 0; // keep rests as rests
        return 4 - n; // 1->3, 2->2, 3->1
      });
      return { ...t, pattern: p };
    }));
  };

  // Piano roll interaction: draw/select/length
  const togglePRCell = (trackId, stepIdx, midi) => {
    setTracks((ts) => ts.map((t) => {
      if (t.id !== trackId) return t;
      const notes = (t.notes || []).slice();
      const idx = notes.findIndex((n) => Number(n.start) === Number(stepIdx) && Number(n.midi) === Number(midi));
      if (tool === 'draw') {
        if (idx >= 0) {
          notes.splice(idx, 1);
        } else {
          notes.push({ start: Number(stepIdx), length: 1, midi: Number(midi), level: 2, selected: false });
        }
      } else if (tool === 'vel') {
        // cycle velocity level 1..3; create if missing
        if (idx >= 0) {
          const cur = Number(notes[idx].level ?? 2);
          notes[idx] = { ...notes[idx], level: ((cur % 3) + 1) };
        } else {
          notes.push({ start: Number(stepIdx), length: 1, midi: Number(midi), level: 1, selected: false });
        }
      } else if (tool === 'select') {
        if (idx >= 0) {
          const sel = !!notes[idx].selected;
          notes[idx] = { ...notes[idx], selected: !sel };
        }
      } else if (tool === 'length') {
        // Adjust length by dragging to a later cell in the same row
        if (idx >= 0) {
          notes[idx] = { ...notes[idx], length: Math.max(1, Number(notes[idx].length || 1)) };
        } else {
          // If clicking beyond start, find a note on this row with a start before the step
          const prevIdx = notes.findIndex((n) => Number(n.midi) === Number(midi) && Number(n.start) < Number(stepIdx));
          if (prevIdx >= 0) {
            const start = Number(notes[prevIdx].start);
            const len = Math.max(1, Number(stepIdx) - start + 1);
            notes[prevIdx] = { ...notes[prevIdx], length: len };
          } else {
            // create a new note and allow dragging to set length
            notes.push({ start: Number(stepIdx), length: 1, midi: Number(midi), level: 2, selected: false });
          }
        }
      }
      return { ...t, notes };
    }));
  };

  // Delete selected notes across tracks
  const deleteSelectedNotes = () => {
    setTracks((ts) => ts.map((t) => ({ ...t, notes: (t.notes || []).filter((n) => !n.selected) })));
  };

  // Nudge selected notes left/right
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const nudgeSelected = (delta) => {
    setTracks((ts) => ts.map((t) => {
      const notes = (t.notes || []).map((n) => n.selected ? { ...n, start: clamp(Number(n.start) + Number(delta), 0, stepsCount - 1) } : n);
      return { ...t, notes };
    }));
  };

  // Keybindings: Delete removes selection; arrows nudge
  useEffect(() => {
    const handler = (e) => {
      const tag = (e.target?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete') {
        deleteSelectedNotes();
      } else if (e.key === 'ArrowLeft') {
        nudgeSelected(-1);
      } else if (e.key === 'ArrowRight') {
        nudgeSelected(1);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stepsCount]);

  // Helper: set per-step velocity (0..100%) for a track
  const setTrackStepVelocity = (trackId, stepIdx, velPercent) => {
    const pct = Math.max(0, Math.min(100, Number(velPercent)));
    setTracks((ts) => ts.map((t) => {
      if (t.id !== trackId) return t;
      const vels = (t.velocities || Array.from({ length: stepsCount }, () => 100)).slice();
      vels[stepIdx] = pct;
      return { ...t, velocities: vels };
    }));
  };

  // Simple Piano Roll component for per-track editing with scale highlights
  const PianoRoll = ({ stepsCount, currentStep, track, onToggle, scaleRoot = 'C', scaleType = 'None' }) => {
    const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const midiToName = (m) => NOTE_NAMES[m % 12] + (Math.floor(m / 12) - 1);
    const range = Array.from({ length: 25 }, (_, i) => 72 - i); // C5 down to C3
    const rootIdx = NOTE_NAMES.indexOf(scaleRoot);
    const intervals = scaleType === 'Major' ? [0,2,4,5,7,9,11] : (scaleType === 'Minor' ? [0,2,3,5,7,8,10] : []);
    const inScale = (m) => intervals.length > 0 && intervals.includes(((m % 12) - rootIdx + 12) % 12);
    return (
      <div className="piano-roll">
        <div className="pr-keys">
          {range.map((m) => (
            <div key={m} className="pr-key">{midiToName(m)}</div>
          ))}
        </div>
        <div className="pr-grid">
          {range.map((m) => (
            <div key={m} className={`pr-row ${inScale(m) ? 'scale' : ''}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${stepsCount}, 1fr)`, gap: 4 }}>
              {Array.from({ length: stepsCount }, (_, i) => {
                const active = (track.notes || []).some((n) => Number(n.start) === i && Number(n.midi) === m);
                const playing = i === currentStep;
                return (
                  <div
                    key={i}
                    className={`pr-cell ${active ? 'active' : ''} ${playing ? 'playing' : ''}`}
                    onClick={() => onToggle(i, m)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const addTrack = () => {
    setTracks((ts) => ts.concat({ id: crypto.randomUUID(), name: `Track ${ts.length + 1}`, color: TRACK_COLORS[ts.length % TRACK_COLORS.length], instrument: '', articulation: '', mic: '', rrMode: 'cycle', mute: false, solo: false, armed: false, volume: 0.9, pan: 0, midi: 60, velocity: 100, density: 0.3, pattern: Array.from({ length: stepsCount }, () => 0), notes: [], velocities: Array.from({ length: stepsCount }, () => 100) }));
  };

  const duplicateTrack = (trackId) => {
    setTracks((ts) => {
      const idx = ts.findIndex((t) => t.id === trackId);
      if (idx === -1) return ts;
      const src = ts[idx];
      const copy = {
        ...src,
        id: crypto.randomUUID(),
        name: `${src.name} Copy`,
        color: TRACK_COLORS[ts.length % TRACK_COLORS.length],
        pattern: src.pattern.slice(),
        armed: !!src.armed,
        notes: (src.notes || []).map((n) => ({ ...n })),
        velocities: (src.velocities || Array.from({ length: stepsCount }, () => 100)).slice(),
      };
      const next = ts.slice();
      next.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const deleteTrack = (trackId) => {
    setTracks((ts) => ts.filter((t) => t.id !== trackId));
  };

  // EDIT-mode helpers
  const humanizeVelocity = (amount = 5) => {
    setTracks((ts) => ts.map((t) => {
      const base = (t.velocities || Array.from({ length: stepsCount }, () => 100));
      const vels = base.map((v) => {
        const delta = Math.round((Math.random() * 2 - 1) * amount);
        return Math.max(1, Math.min(127, Number(v) + delta));
      });
      return { ...t, velocities: vels };
    }));
  };
  const generateHarmony = () => {
    // Simple harmony: duplicate each track transposed up a third (4 semitones)
    setTracks((ts) => {
      const next = ts.slice();
      for (const t of ts) {
        const copy = {
          ...t,
          id: crypto.randomUUID(),
          name: `${t.name} Harmony`,
          midi: Number(t.midi || 60) + 4,
          color: '#a855f7',
          notes: (t.notes || []).map((n) => ({ ...n, midi: Number(n.midi) + 4 })),
          velocities: (t.velocities || Array.from({ length: stepsCount }, () => 100)).slice(),
        };
        next.push(copy);
      }
      return next;
    });
  };

  // Wave Mode recording state and helpers
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordBlob, setRecordBlob] = useState(null);
  const [recordUrl, setRecordUrl] = useState(null);
  const waveCanvasRef = useRef(null);
  const [recordError, setRecordError] = useState('');
  const [targetTrackId, setTargetTrackId] = useState(null);
  useEffect(() => { setTargetTrackId((id) => id ?? (tracks[0]?.id || null)); }, [tracks]);

  const startRecording = () => {
    try {
      const stream = engine?.getOutputStream?.();
      if (!stream) { setRecordError('Recording stream unavailable'); return; }
      const rec = new MediaRecorder(stream);
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordBlob(blob);
        setRecording(false);
      };
      rec.start();
      setRecordError('');
      setRecording(true);
    } catch (e) {
      setRecordError(String(e?.message || e) || 'Recording failed');
    }
  };
  const stopRecording = () => { try { recorderRef.current?.stop?.(); } catch {} };
  const clearRecording = () => { setRecordBlob(null); chunksRef.current = []; };
  const convertRecordingToPattern = async (trackId) => {
    try {
      if (!recordBlob) return;
      const ab = await recordBlob.arrayBuffer();
      const buf = await engine.ctx.decodeAudioData(ab);
      const ch = buf.getChannelData(0);
      const win = Math.max(1, Math.floor(ch.length / stepsCount));
      const pat = Array.from({ length: stepsCount }, (_, i) => {
        const start = i * win; const end = Math.min(ch.length, start + win);
        let sum = 0; const len = end - start;
        for (let j = start; j < end; j++) { const v = ch[j]; sum += v * v; }
        const rms = Math.sqrt(sum / Math.max(1, len));
        if (rms < 0.05) return 0; if (rms < 0.15) return 1; if (rms < 0.3) return 2; return 3;
      });
      setTracks((ts) => ts.map((t) => (t.id === trackId ? { ...t, pattern: pat } : t)));
    } catch (e) {
      setRecordError('Convert failed: ' + String(e?.message || e));
    }
  };

  // Draw waveform preview when a recording is available
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!recordBlob) {
      setRecordUrl(null);
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) { ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      }
      return;
    }
    const url = URL.createObjectURL(recordBlob);
    setRecordUrl(url);
    (async () => {
      try {
        const ab = await recordBlob.arrayBuffer();
        const buf = await engine.ctx.decodeAudioData(ab);
        const data = buf.getChannelData(0);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width;
        const h = canvas.height;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const step = Math.max(1, Math.floor(data.length / w));
        for (let x = 0; x < w; x++) {
          const start = x * step;
          let min = 1, max = -1;
          for (let i = start; i < start + step && i < data.length; i++) {
            const v = data[i];
            if (v < min) min = v;
            if (v > max) max = v;
          }
          const y1 = (1 - ((max + 1) / 2)) * h;
          const y2 = (1 - ((min + 1) / 2)) * h;
          ctx.moveTo(x, y1);
          ctx.lineTo(x, y2);
        }
        ctx.stroke();
      } catch (e) {
        // ignore drawing errors
      }
    })();
    return () => { URL.revokeObjectURL(url); };
  }, [recordBlob, engine]);

  // Master meter loop
  useEffect(() => {
    let rafId = 0;
    const analyser = engine?.analyser;
    if (!analyser) return;
    const buf = new Uint8Array(analyser.fftSize);
    const loop = () => {
      try {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length); // 0..~1
        setMasterLevel(rms);
      } catch {}
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [engine]);

  return (
    <div className="sequence-page">
      {/* Mode Tabs */}
      <div className="sequence-mode-tabs">
        <button 
          className={`sequence-mode-tab ${mode === 'grid' ? 'active' : ''}`}
          onClick={() => setMode('grid')}
        >
          🥁 Grid (Drums)
        </button>
        <button 
          className={`sequence-mode-tab ${mode === 'piano' ? 'active' : ''}`}
          onClick={() => setMode('piano')}
        >
          🎹 Piano Roll
        </button>
        <button 
          className={`sequence-mode-tab ${mode === 'music' ? 'active' : ''}`}
          onClick={() => setMode('music')}
        >
          🎼 Music (Chords)
        </button>
        <button 
          className={`sequence-mode-tab ${mode === 'wave' ? 'active' : ''}`}
          onClick={() => setMode('wave')}
        >
          🌊 Waveform
        </button>
      </div>

      {/* Toolbar */}
      <div className="seq-toolbar">
        <div className="group transport">
          <button className="pill" title="Play" onClick={() => setRunning(true)}>▶</button>
          <button className="pill" title="Stop" onClick={() => setRunning(false)}>■</button>
          <button className={`pill ${running ? 'on' : ''}`} title="Record Toggle" onClick={() => setRunning((r) => !r)}>REC</button>
        </div>
        <div className="group tempo">
          <span className="label">TEMPO</span>
          <input className="num" type="number" value={tempo} onChange={(e) => setTempo(Number(e.target.value))} />
        </div>
        <div className="group swing">
          <span className="label">SW</span>
          <input className="num" type="number" min={0} max={0.5} step={0.01} value={swing} onChange={(e) => setSwing(Number(e.target.value))} />
        </div>
        <div className="group subdiv">
          <span className="label">DIV</span>
          <select className="num" value={subdivision} onChange={(e) => setSubdivision(e.target.value)}>
            <option value="1/4">1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
            <option value="1/32">1/32</option>
          </select>
        </div>
        <div className="group scale">
          <span className="label">Scale Highlight:</span>
          <select value={scaleRoot} onChange={(e) => setScaleRoot(e.target.value)}>
            {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map((n) => (<option key={n} value={n}>{n}</option>))}
          </select>
          <select value={scaleType} onChange={(e) => setScaleType(e.target.value)}>
            {['Major','Minor','None'].map((t) => (<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div className="group tools">
          <span className="label">Tools:</span>
          <button className={`pill ${tool === 'draw' ? 'on' : ''}`} onClick={() => setTool('draw')}>Draw</button>
          <button className={`pill ${tool === 'vel' ? 'on' : ''}`} onClick={() => setTool('vel')}>Paint Velocity</button>
          <button className={`pill ${tool === 'select' ? 'on' : ''}`} onClick={() => setTool('select')}>Select</button>
          <button className={`pill ${tool === 'length' ? 'on' : ''}`} onClick={() => setTool('length')}>Length</button>
        </div>

        <div className="group ai">
          <button className="pill purple" onClick={() => humanizeVelocity(8)}>Humanize</button>
          <button className="pill green" onClick={generateHarmony}>Gen Harmony</button>
        </div>
        <div className="group right">
          <button className="secondary" onClick={addTrack}>+ Track</button>
          <label className="row" style={{ gap: 6 }}>
            <span className="muted">Len</span>
            <select value={stepsCount} onChange={(e) => setPatternLength(Number(e.target.value))}>
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
            </select>
          </label>
          <label className="row" style={{ gap: 6 }}>
            <span className="muted">Limiter</span>
            <input type="checkbox" checked={limiterOn} onChange={(e) => { setLimiterOn(e.target.checked); try { engine?.setLimiter?.(e.target.checked); } catch {} }} />
          </label>
          <label className="row" style={{ gap: 6 }}>
            <span className="muted">Reset RR</span>
            <input type="checkbox" checked={resetRROnBar} onChange={(e) => setResetRROnBar(e.target.checked)} />
          </label>
        </div>
      </div>

      {/* Content Area */}
      <div className="sequence-content">
        <div className="row" style={{ alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div className="muted">Output</div>
          <div className="meter"><div className="meter-fill" style={{ width: `${Math.min(1, masterLevel) * 100}%` }} /></div>
        </div>
        <div className="ruler">
          {Array.from({ length: stepsCount }, (_, i) => (
            <div key={i} className="tick">{i + 1}</div>
          ))}
        </div>
        {mode === 'music' && (
        <div className="card compact" style={{ marginTop: 8 }}>
          <div className="row wrap" style={{ gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
              <strong>Chord Instrument</strong>
              <select value={chordTrack.instrument} onChange={(e) => setChordTrack((t) => ({ ...t, instrument: e.target.value }))}>
                <option value="">Select instrument…</option>
                {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Oct</span>
                <input type="number" value={chordTrack.octave} onChange={(e) => setChordTrack((t) => ({ ...t, octave: Number(e.target.value) }))} />
              </label>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Vel</span>
                <input type="number" value={chordTrack.velocity} onChange={(e) => setChordTrack((t) => ({ ...t, velocity: Number(e.target.value) }))} />
              </label>
            </div>
            <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
              <strong>Melody Instrument</strong>
              <select value={melodyTrack.instrument} onChange={(e) => setMelodyTrack((t) => ({ ...t, instrument: e.target.value }))}>
                <option value="">Select instrument…</option>
                {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Vel</span>
                <input type="number" value={melodyTrack.velocity} onChange={(e) => setMelodyTrack((t) => ({ ...t, velocity: Number(e.target.value) }))} />
              </label>
            </div>
          </div>
          <div className="space" />
          <strong>Chord Progression</strong>
          <div className="chords-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${stepsCount}, 1fr)`, gap: 6, marginTop: 8 }}>
            {chords.map((c, i) => (
              <div key={i} className={`chord-cell ${i === currentStep ? 'playing' : ''}`}>
                <select value={c.root} onChange={(e) => setChords((cs) => cs.map((x, idx) => idx === i ? { ...x, root: e.target.value } : x))}>
                  {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'].map((n) => (<option key={n} value={n}>{n}</option>))}
                </select>
                <select value={c.quality} onChange={(e) => setChords((cs) => cs.map((x, idx) => idx === i ? { ...x, quality: e.target.value } : x))}>
                  {Object.keys(QUALITY_INTERVALS).map((q) => (<option key={q} value={q}>{q}</option>))}
                </select>
                <select value={String(c.inversion || 0)} onChange={(e) => setChords((cs) => cs.map((x, idx) => idx === i ? { ...x, inversion: Number(e.target.value) } : x))}>
                  {[0,1,2,3].map((iv) => (<option key={iv} value={iv}>{`Inv ${iv}`}</option>))}
                </select>
              </div>
            ))}
          </div>
          <div className="space" />
          <strong>Melody</strong>
          <PianoRoll
            stepsCount={stepsCount}
            currentStep={currentStep}
            track={melodyTrack}
            onToggle={(i, m) => setMelodyTrack((t) => {
              const notes = (t.notes || []).slice();
              const idx = notes.findIndex((n) => Number(n.start) === Number(i) && Number(n.midi) === Number(m));
              if (tool === 'draw') { if (idx >= 0) notes.splice(idx, 1); else notes.push({ start: i, length: 1, midi: m, level: 2 }); }
              else if (tool === 'vel') { if (idx >= 0) { const cur = Number(notes[idx].level ?? 2); notes[idx] = { ...notes[idx], level: ((cur % 3) + 1) }; } else { notes.push({ start: i, length: 1, midi: m, level: 1 }); } }
              else if (tool === 'select') { if (idx >= 0) { const sel = !!notes[idx].selected; notes[idx] = { ...notes[idx], selected: !sel }; } }
              else if (tool === 'length') { if (idx >= 0) { notes[idx] = { ...notes[idx], length: Math.max(1, Number(notes[idx].length || 1)) }; } else { const prevIdx = notes.findIndex((n) => Number(n.midi) === Number(m) && Number(n.start) < Number(i)); if (prevIdx >= 0) { const start = Number(notes[prevIdx].start); const len = Math.max(1, Number(i) - start + 1); notes[prevIdx] = { ...notes[prevIdx], length: len }; } else { notes.push({ start: i, length: 1, midi: m, level: 2 }); } } }
              return { ...t, notes };
            })}
            scaleRoot={scaleRoot}
            scaleType={scaleType}
          />
        </div>
        )}
        {mode === 'wave' && (
        <div className="card compact" style={{ marginTop: 8 }}>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className={recording ? 'danger' : 'secondary'} onClick={() => recording ? stopRecording() : startRecording()}>{recording ? 'Stop Recording' : 'Start Recording'}</button>
            <button onClick={clearRecording} disabled={!recordBlob}>Clear</button>
            <label className="row" style={{ gap: 6 }}>
              <span className="muted">Target Track</span>
              <select value={targetTrackId || ''} onChange={(e) => setTargetTrackId(e.target.value)}>
                {tracks.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <button className="secondary" onClick={() => convertRecordingToPattern(targetTrackId)} disabled={!recordBlob || !targetTrackId}>Convert to Pattern</button>
          </div>
          {recordError && (<div className="muted" style={{ color: 'var(--danger)', marginTop: 6 }}>{recordError}</div>)}
          {recordBlob ? (
            <div style={{ marginTop: 8 }}>
              <audio src={recordUrl || undefined} controls style={{ width: '100%' }} />
              <div className="wave" style={{ marginTop: 8 }}>
                <canvas ref={waveCanvasRef} width={800} height={120} onDoubleClick={() => convertRecordingToPattern(targetTrackId)} />
              </div>
              <div className="muted" style={{ marginTop: 6 }}>Double-click waveform to convert.</div>
            </div>
          ) : (
            <p className="muted" style={{ marginTop: 8 }}>No recording yet. Start recording to capture output.</p>
          )}
        </div>
        )}
        {mode === 'piano' && (
        <MultiTrackPianoRoll
          tracks={tracks}
          stepsCount={stepsCount}
          currentStep={currentStep}
          onToggle={(trackId, step, midi) => togglePRCell(trackId, step, midi)}
          onMute={(trackId, on) => setTrackMute(trackId, on)}
          onArm={(trackId, on) => setTrackArmed(trackId, on)}
          onSetVel={(trackId, stepIdx, pct) => setTrackStepVelocity(trackId, stepIdx, pct)}
          scaleRoot={scaleRoot}
          scaleType={scaleType}
        />
        )}
        {mode !== 'piano' && tracks.map((tr) => (
        <div key={tr.id} className="card compact" style={{ marginTop: 8, borderColor: tr.color || '#555', borderWidth: 2 }}>
          <div className="row wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="row" style={{ alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: tr.color || '#555' }} />
              <input type="text" value={tr.name} onChange={(e) => setTrackName(tr.id, e.target.value)} style={{ fontWeight: 600, border: '1px solid var(--border)', background: 'transparent' }} />
              <input className="color-input" type="color" value={tr.color || '#555'} onChange={(e) => setTrackColor(tr.id, e.target.value)} />
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Instrument</span>
                <select value={tr.instrument} onChange={(e) => setTrackInstrument(tr.id, e.target.value)}>
                  <option value="">Select instrument…</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <div className="row wrap" style={{ gap: 8, alignItems: 'center' }}>
                <button className={tr.mute ? 'danger' : 'secondary'} onClick={() => setTrackMute(tr.id, !tr.mute)}>{tr.mute ? 'Muted' : 'Mute'}</button>
                <button className={tr.solo ? 'secondary' : ''} onClick={() => setTrackSolo(tr.id, !tr.solo)}>{tr.solo ? 'Solo' : 'Solo'}</button>
                <label className="row" style={{ gap: 6 }}>
                  <span className="muted">Vol</span>
                  <input type="range" min={0} max={1} step={0.01} value={tr.volume} onChange={(e) => setTrackVolume(tr.id, e.target.value)} />
                </label>
                <label className="row" style={{ gap: 6 }}>
                  <span className="muted">Pan</span>
                  <input type="range" min={-1} max={1} step={0.01} value={tr.pan} onChange={(e) => setTrackPan(tr.id, e.target.value)} />
                </label>
              </div>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Articulation</span>
                <select value={tr.articulation} onChange={(e) => setTrackArticulation(tr.id, e.target.value)}>
                  <option value="">Any</option>
                  {Array.from(new Set((engine?.samples || []).filter((s) => (s.category || 'Uncategorized') === (tr.instrument || 'Uncategorized')).map((s) => s.articulation).filter(Boolean))).sort().map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Mic</span>
                <select value={tr.mic} onChange={(e) => setTrackMic(tr.id, e.target.value)}>
                  <option value="">Any</option>
                  {Array.from(new Set((engine?.samples || []).filter((s) => (s.category || 'Uncategorized') === (tr.instrument || 'Uncategorized')).map((s) => s.mic).filter(Boolean))).sort().map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">RR Mode</span>
                <select value={tr.rrMode || 'cycle'} onChange={(e) => setTrackRRMode(tr.id, e.target.value)}>
                  <option value="cycle">Cycle</option>
                  <option value="random">Random</option>
                  <option value="off">Off</option>
                </select>
              </label>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">MIDI</span>
                <input type="number" value={tr.midi} onChange={(e) => setTracks((ts) => ts.map((t) => t.id === tr.id ? { ...t, midi: Number(e.target.value) } : t))} />
              </label>
              <label className="row" style={{ gap: 6 }}>
                <span className="muted">Velocity</span>
                <input type="number" value={tr.velocity} onChange={(e) => setTracks((ts) => ts.map((t) => t.id === tr.id ? { ...t, velocity: Number(e.target.value) } : t))} />
              </label>
            </div>
          </div>
          <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
            <button className="secondary" onClick={() => copyPattern(tr.id)}>Copy</button>
            <button className="secondary" onClick={() => pastePattern(tr.id)} disabled={!clipboardPattern}>Paste</button>
            <button onClick={() => shiftPattern(tr.id, 'left')}>◀ Shift</button>
            <button onClick={() => shiftPattern(tr.id, 'right')}>Shift ▶</button>
            <button className="danger" onClick={() => clearPattern(tr.id)}>Clear</button>
            <button onClick={() => fillPattern(tr.id, '4s')}>Fill 4s</button>
            <button onClick={() => fillPattern(tr.id, '8s')}>Fill 8s</button>
            <button onClick={() => fillPattern(tr.id, '3s')}>Fill 3s</button>
            <button onClick={() => fillPattern(tr.id, 'rand')}>Random</button>
            <button onClick={() => invertPattern(tr.id)}>Invert</button>
            <button className="secondary" onClick={() => quantizePattern(tr.id, '4s')}>Quantize 4s</button>
            <button className="secondary" onClick={() => quantizePattern(tr.id, '8s')}>Quantize 8s</button>
            <button className="secondary" onClick={() => quantizePattern(tr.id, '3s')}>Quantize 3s</button>
            <label className="row" style={{ gap: 6 }}>
              <span className="muted">Density</span>
              <input type="range" min={0} max={1} step={0.01} value={tr.density ?? 0.3} onChange={(e) => setTrackDensity(tr.id, e.target.value)} />
            </label>
            <button className="secondary" onClick={() => duplicateTrack(tr.id)}>Duplicate</button>
            <button className="danger" onClick={() => deleteTrack(tr.id)}>Delete Track</button>
          </div>
          {mode === 'grid' && (
            <div className="sequencer" style={{ display: 'grid', gridTemplateColumns: `repeat(${stepsCount}, 1fr)`, gap: 6 }}>
              {tr.pattern.map((lvl, i) => {
                const n = Number(lvl || 0);
                const lvlClass = n === 0 ? '' : (n === 1 ? 'l1' : (n === 2 ? 'l2' : 'l3'));
                return (
                  <div key={i} className={`step ${lvlClass} ${i === currentStep ? 'playing' : ''}`} onClick={() => toggleStep(tr.id, i)}>{i + 1}</div>
                );
              })}
            </div>
          )}
          {mode === 'piano' && null}
        </div>
        ))}

        <p className="muted" style={{ marginTop: 8 }}>Each track advances through steps and triggers its selected instrument group.</p>
      </div> {/* end sequence-content */}
    </div> {/* end sequence-page */}
  );
}
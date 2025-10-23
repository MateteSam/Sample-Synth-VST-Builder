import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import { getGroupOptions } from '../utils/groups.js';
import Keyboard from '../components/Keyboard.jsx';
import '../styles/Sequence.css';

export default function Sequence({ engine }) {
  const { manifest, setManifest } = useInstrument();
  
  // Mode: 'sample', 'program', 'edit'
  const [mode, setMode] = useState('sample');
  
  // Global sequencer state
  const [tempo, setTempo] = useState(120);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [patternLength, setPatternLength] = useState(16);
  
  // PROGRAM mode state
  const TRACK_COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b', '#a855f7', '#14b8a6', '#ec4899', '#06b6d4'];
  const [tracks, setTracks] = useState([
    { 
      id: crypto.randomUUID(), 
      name: 'Track 1', 
      color: TRACK_COLORS[0], 
      instrument: '', 
      articulation: '', 
      mic: '',
      mute: false, 
      solo: false, 
      armed: true, 
      volume: 0.8, 
      pan: 0,
      notes: [] // { start: 0, length: 1, midi: 60, velocity: 100 }
    }
  ]);
  const [recording, setRecording] = useState(false);
  const [metronome, setMetronome] = useState(true);
  const [countIn, setCountIn] = useState(1); // 0, 1, 2 bars
  const [overdub, setOverdub] = useState(true);
  
  // EDIT mode state
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0]?.id);
  const [tool, setTool] = useState('draw'); // 'draw', 'select', 'erase', 'velocity'
  const [snap, setSnap] = useState(true);
  const [snapValue, setSnapValue] = useState('1/16'); // '1/4', '1/8', '1/16', '1/32', '1/64'
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  
  // SAMPLE mode state
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [velocity, setVelocity] = useState(100);
  const [pitch, setPitch] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState(null);
  
  const names = manifest.ui?.groupNames || {};
  const sampleCount = engine?.samples?.length || 0;
  const options = useMemo(() => getGroupOptions(engine?.samples || [], names), [sampleCount, names]);
  
  // Auto-select first instrument for SAMPLE mode
  useEffect(() => {
    if (mode === 'sample' && !selectedInstrument && options?.instruments?.length > 0) {
      setSelectedInstrument(options.instruments[0].value);
    }
  }, [mode, selectedInstrument, options?.instruments]);
  
  // Sequencer engine
  const timerRef = useRef(null);
  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setCurrentStep(0);
      return;
    }
    
    const interval = (60 / tempo) * 1000 / 4; // 16th note interval
    timerRef.current = setInterval(() => {
      setCurrentStep((s) => {
        const next = (s + 1) % patternLength;
        
        // Play metronome click
        if (metronome && next % 4 === 0) {
          try {
            engine?.playNote?.(next === 0 ? 84 : 76, 80);
          } catch {}
        }
        
        // Play notes from PROGRAM/EDIT tracks
        if (mode === 'program' || mode === 'edit') {
          tracks.forEach((track) => {
            if (track.mute || (!track.solo && tracks.some(t => t.solo))) return;
            
            track.notes.forEach((note) => {
              if (Math.floor(note.start) === next) {
                const midi = note.midi;
                const vel = note.velocity || 100;
                try {
                  if (track.instrument) {
                    engine?.noteOnCategory?.(midi, vel * track.volume, track.instrument);
                  } else {
                    engine?.noteOn?.(midi, vel * track.volume);
                  }
                  
                  // Schedule note off
                  const noteLength = (60 / tempo) * 1000 * note.length / 4;
                  setTimeout(() => {
                    try { engine?.noteOff?.(midi); } catch {}
                  }, noteLength);
                } catch {}
              }
            });
          });
        }
        
        return next;
      });
    }, interval);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, tempo, patternLength, tracks, mode, metronome, engine]);
  
  // Recording handler
  const recordedNotesRef = useRef([]);
  const recordStartTimeRef = useRef(null);
  
  const handleRecordNoteOn = (midi, vel) => {
    if (mode !== 'program' || !recording) return;
    
    const now = Date.now();
    if (!recordStartTimeRef.current) recordStartTimeRef.current = now;
    
    const elapsed = (now - recordStartTimeRef.current) / 1000; // seconds
    const step = (elapsed * tempo / 60) * 4; // convert to 16th notes
    
    recordedNotesRef.current.push({
      midi,
      velocity: vel,
      startTime: step,
      endTime: null
    });
  };
  
  const handleRecordNoteOff = (midi) => {
    if (mode !== 'program' || !recording) return;
    
    const now = Date.now();
    const elapsed = (now - recordStartTimeRef.current) / 1000;
    const step = (elapsed * tempo / 60) * 4;
    
    const note = recordedNotesRef.current.find(n => n.midi === midi && n.endTime === null);
    if (note) {
      note.endTime = step;
    }
  };
  
  const finalizeRecording = () => {
    const armedTrack = tracks.find(t => t.armed);
    if (!armedTrack) return;
    
    const newNotes = recordedNotesRef.current.map(n => ({
      start: n.startTime,
      length: Math.max(0.25, (n.endTime || n.startTime + 1) - n.startTime),
      midi: n.midi,
      velocity: n.velocity
    }));
    
    setTracks(prev => prev.map(t => {
      if (t.id !== armedTrack.id) return t;
      
      if (overdub) {
        return { ...t, notes: [...t.notes, ...newNotes] };
      } else {
        return { ...t, notes: newNotes };
      }
    }));
    
    recordedNotesRef.current = [];
    recordStartTimeRef.current = null;
  };
  
  // AI Chord Suggestion
  const suggestChords = () => {
    // Analyze existing notes in selected track
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;
    
    // Simple chord suggestions based on common progressions
    const suggestions = [
      { name: 'I-V-vi-IV (Pop)', chords: ['C Maj', 'G Maj', 'A Min', 'F Maj'] },
      { name: 'ii-V-I (Jazz)', chords: ['D Min7', 'G Dom7', 'C Maj7'] },
      { name: 'I-IV-V (Blues)', chords: ['C Maj', 'F Maj', 'G Maj'] },
      { name: 'vi-IV-I-V (Emotional)', chords: ['A Min', 'F Maj', 'C Maj', 'G Maj'] }
    ];
    
    setAiSuggestion({
      type: 'chords',
      suggestions
    });
    setAiPanelOpen(true);
  };
  
  // AI Melody Suggestion
  const suggestMelody = () => {
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;
    
    // Generate simple melody patterns
    const scales = {
      'C Major': [60, 62, 64, 65, 67, 69, 71, 72],
      'A Minor': [57, 59, 60, 62, 64, 65, 67, 69],
      'G Major': [55, 57, 59, 60, 62, 64, 66, 67]
    };
    
    setAiSuggestion({
      type: 'melody',
      scales
    });
    setAiPanelOpen(true);
  };
  
  // AI Harmony Suggestion
  const suggestHarmony = () => {
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track || track.notes.length === 0) return;
    
    // Analyze existing notes and suggest harmony
    const suggestions = [
      { name: 'Thirds above', interval: 4 },
      { name: 'Fifths above', interval: 7 },
      { name: 'Octave', interval: 12 },
      { name: 'Counter melody', interval: -2 }
    ];
    
    setAiSuggestion({
      type: 'harmony',
      suggestions
    });
    setAiPanelOpen(true);
  };
  
  // Apply AI suggestion
  const applyAiSuggestion = (suggestion) => {
    const track = tracks.find(t => t.id === selectedTrackId);
    if (!track) return;
    
    if (aiSuggestion.type === 'harmony') {
      // Add harmony notes
      const interval = suggestion.interval;
      const harmonyNotes = track.notes.map(n => ({
        ...n,
        midi: n.midi + interval
      }));
      
      // Create new track for harmony
      const newTrack = {
        id: crypto.randomUUID(),
        name: `${track.name} (${suggestion.name})`,
        color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
        instrument: track.instrument,
        articulation: track.articulation,
        mic: track.mic,
        mute: false,
        solo: false,
        armed: false,
        volume: 0.6,
        pan: 0,
        notes: harmonyNotes
      };
      
      setTracks(prev => [...prev, newTrack]);
    }
    
    setAiPanelOpen(false);
    setAiSuggestion(null);
  };
  
  // Add track
  const addTrack = () => {
    const newTrack = {
      id: crypto.randomUUID(),
      name: `Track ${tracks.length + 1}`,
      color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
      instrument: '',
      articulation: '',
      mic: '',
      mute: false,
      solo: false,
      armed: false,
      volume: 0.8,
      pan: 0,
      notes: []
    };
    setTracks(prev => [...prev, newTrack]);
  };
  
  // Remove track
  const removeTrack = (id) => {
    if (tracks.length <= 1) return;
    setTracks(prev => prev.filter(t => t.id !== id));
    if (selectedTrackId === id) {
      setSelectedTrackId(tracks.find(t => t.id !== id)?.id);
    }
  };
  
  // Update track property
  const updateTrack = (id, updates) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };
  
  // SAMPLE MODE - Play note
  const onSampleNoteOn = (midi, vel) => {
    setVelocity(vel);
    try {
      if (selectedInstrument) {
        engine?.noteOnCategory?.(midi, vel, selectedInstrument);
      } else {
        engine?.noteOn?.(midi, vel);
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const onSampleNoteOff = (midi) => {
    try {
      engine?.noteOff?.(midi);
    } catch (e) {
      console.error(e);
    }
  };
  
  // PROGRAM MODE - Play note (with recording)
  const onProgramNoteOn = (midi, vel) => {
    handleRecordNoteOn(midi, vel);
    try {
      const armedTrack = tracks.find(t => t.armed);
      if (armedTrack && armedTrack.instrument) {
        engine?.noteOnCategory?.(midi, vel, armedTrack.instrument);
      } else {
        engine?.noteOn?.(midi, vel);
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  const onProgramNoteOff = (midi) => {
    handleRecordNoteOff(midi);
    try {
      engine?.noteOff?.(midi);
    } catch (e) {
      console.error(e);
    }
  };
  
  // Render mode-specific content
  const renderContent = () => {
    if (mode === 'sample') {
      return (
        <div className="sequence-sample-mode">
          {/* Fullscreen background */}
          <div 
            className="sample-mode-background"
            style={{
              backgroundImage: backgroundImage 
                ? `url(${backgroundImage})` 
                : selectedInstrument 
                  ? `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
            }}
          >
            {/* Overlay UI */}
            <div className="sample-mode-overlay">
              <div className="sample-mode-header">
                <h1 className="sample-mode-title">
                  {selectedInstrument || 'Select an Instrument'}
                </h1>
                <div className="sample-mode-controls">
                  <select 
                    className="sample-mode-select"
                    value={selectedInstrument || ''}
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                  >
                    <option value="">-- Select Instrument --</option>
                    {(options?.instruments || []).map((inst) => (
                      <option key={inst.value} value={inst.value}>
                        {inst.label}
                      </option>
                    ))}
                  </select>
                  
                  <button 
                    className="sample-mode-btn"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setBackgroundImage(url);
                        }
                      };
                      input.click();
                    }}
                  >
                    📸 Change Background
                  </button>
                </div>
              </div>
              
              {/* Velocity/Pitch Visualization */}
              <div className="sample-mode-visualizer">
                <div className="viz-bar">
                  <span className="viz-label">VELOCITY</span>
                  <div className="viz-meter">
                    <div 
                      className="viz-meter-fill"
                      style={{ width: `${(velocity / 127) * 100}%` }}
                    />
                  </div>
                  <span className="viz-value">{velocity}</span>
                </div>
                
                <div className="viz-bar">
                  <span className="viz-label">PITCH</span>
                  <div className="viz-meter">
                    <div 
                      className="viz-meter-fill"
                      style={{ 
                        width: `${Math.abs(pitch / 12) * 100}%`,
                        marginLeft: pitch < 0 ? `${50 - Math.abs(pitch / 12) * 50}%` : '50%'
                      }}
                    />
                  </div>
                  <span className="viz-value">{pitch > 0 ? '+' : ''}{pitch}</span>
                </div>
              </div>
              
              {/* Transport (minimal) */}
              <div className="sample-mode-transport">
                <button 
                  className={`transport-btn ${running ? 'active' : ''}`}
                  onClick={() => setRunning(!running)}
                >
                  {running ? '■' : '▶'}
                </button>
                <span className="transport-tempo">{tempo} BPM</span>
                <input 
                  type="range" 
                  min="60" 
                  max="200" 
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  className="transport-tempo-slider"
                />
              </div>
            </div>
          </div>
          
          {/* Bottom Keyboard */}
          <div className="sample-mode-keyboard">
            <Keyboard 
              onNoteOn={onSampleNoteOn}
              onNoteOff={onSampleNoteOff}
              startMidi={36}
              endMidi={96}
              height={180}
              showLabels={true}
            />
          </div>
        </div>
      );
    }
    
    if (mode === 'program') {
      return (
        <div className="sequence-program-mode">
          {/* Transport Bar */}
          <div className="program-transport">
            <div className="transport-left">
              <button 
                className={`transport-btn ${running ? 'active' : ''}`}
                onClick={() => {
                  if (recording) {
                    setRecording(false);
                    setRunning(false);
                    finalizeRecording();
                  } else {
                    setRunning(!running);
                  }
                }}
              >
                {running ? '■' : '▶'}
              </button>
              
              <button 
                className={`transport-btn record ${recording ? 'active' : ''}`}
                onClick={() => {
                  if (!recording) {
                    setRecording(true);
                    setRunning(true);
                    recordedNotesRef.current = [];
                    recordStartTimeRef.current = null;
                  } else {
                    setRecording(false);
                    setRunning(false);
                    finalizeRecording();
                  }
                }}
                disabled={!tracks.some(t => t.armed)}
              >
                ⏺
              </button>
              
              <div className="transport-divider" />
              
              <div className="transport-setting">
                <label>Count-in:</label>
                <select value={countIn} onChange={(e) => setCountIn(Number(e.target.value))}>
                  <option value={0}>Off</option>
                  <option value={1}>1 bar</option>
                  <option value={2}>2 bars</option>
                </select>
              </div>
              
              <div className="transport-setting">
                <label>
                  <input 
                    type="checkbox" 
                    checked={metronome}
                    onChange={(e) => setMetronome(e.target.checked)}
                  />
                  Metronome
                </label>
              </div>
              
              <div className="transport-setting">
                <label>
                  <input 
                    type="checkbox" 
                    checked={overdub}
                    onChange={(e) => setOverdub(e.target.checked)}
                  />
                  Overdub
                </label>
              </div>
            </div>
            
            <div className="transport-center">
              <div className="tempo-display">
                <label>TEMPO</label>
                <input 
                  type="number" 
                  value={tempo}
                  onChange={(e) => setTempo(Number(e.target.value))}
                  min="20"
                  max="300"
                />
              </div>
              
              <div className="pattern-length">
                <label>LENGTH</label>
                <input 
                  type="number" 
                  value={patternLength}
                  onChange={(e) => setPatternLength(Math.max(4, Number(e.target.value)))}
                  min="4"
                  max="64"
                />
              </div>
            </div>
            
            <div className="transport-right">
              <button className="add-track-btn" onClick={addTrack}>
                ＋ Add Track
              </button>
            </div>
          </div>
          
          {/* Tracks List */}
          <div className="program-tracks">
            {tracks.map((track, index) => (
              <div 
                key={track.id} 
                className={`program-track ${track.armed ? 'armed' : ''} ${track.mute ? 'muted' : ''}`}
                style={{ borderLeftColor: track.color }}
              >
                <div className="track-header">
                  <div className="track-number" style={{ backgroundColor: track.color }}>
                    {index + 1}
                  </div>
                  
                  <input 
                    type="text"
                    value={track.name}
                    onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                    className="track-name"
                  />
                  
                  <button 
                    className={`track-btn ${track.armed ? 'active' : ''}`}
                    onClick={() => {
                      // Arm this track, disarm others
                      setTracks(prev => prev.map(t => ({
                        ...t,
                        armed: t.id === track.id ? !t.armed : false
                      })));
                    }}
                    title="Arm for recording"
                  >
                    ⏺
                  </button>
                  
                  <button 
                    className={`track-btn ${track.mute ? 'active' : ''}`}
                    onClick={() => updateTrack(track.id, { mute: !track.mute })}
                    title="Mute"
                  >
                    M
                  </button>
                  
                  <button 
                    className={`track-btn ${track.solo ? 'active' : ''}`}
                    onClick={() => updateTrack(track.id, { solo: !track.solo })}
                    title="Solo"
                  >
                    S
                  </button>
                  
                  <div className="track-divider" />
                  
                  <select 
                    value={track.instrument}
                    onChange={(e) => updateTrack(track.id, { instrument: e.target.value })}
                    className="track-instrument"
                  >
                    <option value="">-- Instrument --</option>
                    {(options?.instruments || []).map((inst) => (
                      <option key={inst.value} value={inst.value}>
                        {inst.label}
                      </option>
                    ))}
                  </select>
                  
                  <div className="track-divider" />
                  
                  <div className="track-volume">
                    <label>VOL</label>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={track.volume}
                      onChange={(e) => updateTrack(track.id, { volume: Number(e.target.value) })}
                    />
                    <span>{Math.round(track.volume * 100)}%</span>
                  </div>
                  
                  <div className="track-pan">
                    <label>PAN</label>
                    <input 
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={track.pan}
                      onChange={(e) => updateTrack(track.id, { pan: Number(e.target.value) })}
                    />
                    <span>{track.pan > 0 ? 'R' : track.pan < 0 ? 'L' : 'C'}</span>
                  </div>
                  
                  <button 
                    className="track-remove"
                    onClick={() => removeTrack(track.id)}
                    disabled={tracks.length <= 1}
                    title="Remove track"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="track-timeline">
                  {/* Visual representation of notes */}
                  <div className="track-notes">
                    {track.notes.map((note, i) => {
                      const left = (note.start / patternLength) * 100;
                      const width = (note.length / patternLength) * 100;
                      return (
                        <div 
                          key={i}
                          className="track-note"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            backgroundColor: track.color,
                            opacity: note.velocity / 127
                          }}
                          title={`MIDI ${note.midi}, Vel ${note.velocity}`}
                        />
                      );
                    })}
                  </div>
                  
                  {/* Playhead */}
                  {running && (
                    <div 
                      className="track-playhead"
                      style={{ left: `${(currentStep / patternLength) * 100}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Bottom Keyboard */}
          <div className="program-keyboard">
            <Keyboard 
              onNoteOn={onProgramNoteOn}
              onNoteOff={onProgramNoteOff}
              startMidi={36}
              endMidi={96}
              height={120}
              showLabels={false}
            />
          </div>
        </div>
      );
    }
    
    if (mode === 'edit') {
      const selectedTrack = tracks.find(t => t.id === selectedTrackId);
      const midiRange = { low: 36, high: 96 };
      const noteHeight = 16;
      
      return (
        <div className="sequence-edit-mode">
          {/* Toolbar */}
          <div className="edit-toolbar">
            <div className="toolbar-section">
              <label>Track:</label>
              <select 
                value={selectedTrackId}
                onChange={(e) => setSelectedTrackId(e.target.value)}
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="toolbar-divider" />
            
            <div className="toolbar-section tools">
              <button 
                className={`tool-btn ${tool === 'draw' ? 'active' : ''}`}
                onClick={() => setTool('draw')}
                title="Draw notes"
              >
                ✏️
              </button>
              <button 
                className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
                onClick={() => setTool('select')}
                title="Select notes"
              >
                ⬚
              </button>
              <button 
                className={`tool-btn ${tool === 'erase' ? 'active' : ''}`}
                onClick={() => setTool('erase')}
                title="Erase notes"
              >
                🗑️
              </button>
              <button 
                className={`tool-btn ${tool === 'velocity' ? 'active' : ''}`}
                onClick={() => setTool('velocity')}
                title="Adjust velocity"
              >
                📊
              </button>
            </div>
            
            <div className="toolbar-divider" />
            
            <div className="toolbar-section">
              <label>
                <input 
                  type="checkbox"
                  checked={snap}
                  onChange={(e) => setSnap(e.target.checked)}
                />
                Snap
              </label>
              <select 
                value={snapValue}
                onChange={(e) => setSnapValue(e.target.value)}
                disabled={!snap}
              >
                <option value="1/4">1/4</option>
                <option value="1/8">1/8</option>
                <option value="1/16">1/16</option>
                <option value="1/32">1/32</option>
                <option value="1/64">1/64</option>
              </select>
            </div>
            
            <div className="toolbar-divider" />
            
            <div className="toolbar-section ai-section">
              <button className="ai-btn" onClick={suggestChords}>
                🎵 Chords
              </button>
              <button className="ai-btn" onClick={suggestMelody}>
                🎼 Melody
              </button>
              <button className="ai-btn" onClick={suggestHarmony} disabled={!selectedTrack || selectedTrack.notes.length === 0}>
                🎹 Harmony
              </button>
            </div>
            
            <div className="toolbar-divider" />
            
            <div className="toolbar-section">
              <button 
                className={`transport-btn ${running ? 'active' : ''}`}
                onClick={() => setRunning(!running)}
              >
                {running ? '■' : '▶'}
              </button>
            </div>
          </div>
          
          {/* Piano Roll */}
          <div className="edit-piano-roll">
            <div className="piano-roll-container">
              {/* Piano keys (left sidebar) */}
              <div className="piano-keys">
                {Array.from({ length: midiRange.high - midiRange.low + 1 }, (_, i) => {
                  const midi = midiRange.high - i;
                  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                  const noteName = noteNames[midi % 12];
                  const isBlack = noteName.includes('#');
                  const octave = Math.floor(midi / 12) - 1;
                  
                  return (
                    <div 
                      key={midi}
                      className={`piano-key ${isBlack ? 'black' : 'white'}`}
                      style={{ height: noteHeight }}
                      onClick={() => {
                        try {
                          if (selectedTrack?.instrument) {
                            engine?.noteOnCategory?.(midi, 100, selectedTrack.instrument);
                          } else {
                            engine?.noteOn?.(midi, 100);
                          }
                          setTimeout(() => engine?.noteOff?.(midi), 200);
                        } catch {}
                      }}
                    >
                      {noteName === 'C' && <span className="octave-label">{noteName}{octave}</span>}
                    </div>
                  );
                })}
              </div>
              
              {/* Note grid */}
              <div className="piano-grid">
                <svg width="100%" height={(midiRange.high - midiRange.low + 1) * noteHeight}>
                  {/* Grid lines */}
                  {Array.from({ length: midiRange.high - midiRange.low + 1 }, (_, i) => {
                    const midi = midiRange.high - i;
                    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                    const noteName = noteNames[midi % 12];
                    const isBlack = noteName.includes('#');
                    
                    return (
                      <line 
                        key={midi}
                        x1="0"
                        y1={i * noteHeight}
                        x2="100%"
                        y2={i * noteHeight}
                        stroke={isBlack ? '#1a1a1a' : '#2a2a2a'}
                        strokeWidth="1"
                      />
                    );
                  })}
                  
                  {/* Beat lines */}
                  {Array.from({ length: patternLength + 1 }, (_, i) => (
                    <line 
                      key={i}
                      x1={`${(i / patternLength) * 100}%`}
                      y1="0"
                      x2={`${(i / patternLength) * 100}%`}
                      y2="100%"
                      stroke={i % 4 === 0 ? '#444' : '#2a2a2a'}
                      strokeWidth={i % 4 === 0 ? '2' : '1'}
                    />
                  ))}
                  
                  {/* Notes */}
                  {selectedTrack?.notes.map((note, i) => {
                    const y = (midiRange.high - note.midi) * noteHeight;
                    const x = (note.start / patternLength) * 100;
                    const width = (note.length / patternLength) * 100;
                    
                    return (
                      <rect 
                        key={i}
                        x={`${x}%`}
                        y={y}
                        width={`${width}%`}
                        height={noteHeight - 2}
                        fill={selectedTrack.color}
                        stroke="#000"
                        strokeWidth="1"
                        opacity={note.velocity / 127}
                        rx="2"
                        className="piano-note"
                      />
                    );
                  })}
                  
                  {/* Playhead */}
                  {running && (
                    <line 
                      x1={`${(currentStep / patternLength) * 100}%`}
                      y1="0"
                      x2={`${(currentStep / patternLength) * 100}%`}
                      y2="100%"
                      stroke="#22c55e"
                      strokeWidth="2"
                      className="playhead"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
          
          {/* AI Panel */}
          {aiPanelOpen && aiSuggestion && (
            <div className="ai-panel">
              <div className="ai-panel-header">
                <h3>AI Suggestions - {aiSuggestion.type}</h3>
                <button onClick={() => setAiPanelOpen(false)}>✕</button>
              </div>
              
              <div className="ai-panel-content">
                {aiSuggestion.type === 'chords' && (
                  <div className="ai-chord-suggestions">
                    {aiSuggestion.suggestions.map((sugg, i) => (
                      <div key={i} className="ai-suggestion-card">
                        <h4>{sugg.name}</h4>
                        <div className="chord-list">
                          {sugg.chords.join(' → ')}
                        </div>
                        <button onClick={() => applyAiSuggestion(sugg)}>
                          Apply
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {aiSuggestion.type === 'melody' && (
                  <div className="ai-melody-suggestions">
                    {Object.entries(aiSuggestion.scales).map(([name, notes]) => (
                      <div key={name} className="ai-suggestion-card">
                        <h4>{name}</h4>
                        <div className="scale-notes">
                          {notes.join(', ')}
                        </div>
                        <button onClick={() => applyAiSuggestion({ name, notes })}>
                          Generate Melody
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {aiSuggestion.type === 'harmony' && (
                  <div className="ai-harmony-suggestions">
                    {aiSuggestion.suggestions.map((sugg, i) => (
                      <div key={i} className="ai-suggestion-card">
                        <h4>{sugg.name}</h4>
                        <p>Interval: {sugg.interval > 0 ? '+' : ''}{sugg.interval} semitones</p>
                        <button onClick={() => applyAiSuggestion(sugg)}>
                          Add Harmony Track
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
  };
  
  return (
    <div className="sequence-page-new">
      {/* Mode Selector */}
      <div className="sequence-mode-selector">
        <button 
          className={`mode-tab ${mode === 'sample' ? 'active' : ''}`}
          onClick={() => setMode('sample')}
        >
          🎹 SAMPLE
        </button>
        <button 
          className={`mode-tab ${mode === 'program' ? 'active' : ''}`}
          onClick={() => setMode('program')}
        >
          🎙️ PROGRAM
        </button>
        <button 
          className={`mode-tab ${mode === 'edit' ? 'active' : ''}`}
          onClick={() => setMode('edit')}
        >
          ✏️ EDIT
        </button>
      </div>
      
      {/* Mode Content */}
      {renderContent()}
    </div>
  );
}



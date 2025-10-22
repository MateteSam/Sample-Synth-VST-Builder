import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import MasterMeter from '../components/MasterMeter.jsx';
import SpectrumVisualizer from '../components/SpectrumVisualizer.jsx';
import Keyboard from '../components/Keyboard.jsx';
import WidgetRenderer from '../components/WidgetRenderer.jsx';
import { getGroupOptions } from '../utils/groups.js';

export default function Test({ engine }) {
  const { manifest, setManifest, toggleSustain, toggleSostenuto, setVelocityCurve } = useInstrument();

  const [midiAccess, setMidiAccess] = useState(null);
  const [midiInputs, setMidiInputs] = useState([]);
  const [selectedInputId, setSelectedInputId] = useState('');
  const inputRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [recordUrl, setRecordUrl] = useState('');
  const chunksRef = useRef([]);

  // Preview mode: 'windowed' with controls, 'fullscreen' clean preview
  const [previewMode, setPreviewMode] = useState('windowed'); // 'windowed' or 'fullscreen'
  const [showOverlay, setShowOverlay] = useState(true);
  
  // Preview zoom (for windowed mode)
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  const instrumentOptions = useMemo(() => {
    const names = manifest.ui?.groupNames || {};
    return getGroupOptions(engine?.samples || [], names);
  }, [engine?.samples?.length, manifest.ui?.groupNames]);
  const selectedInstrument = manifest.ui?.selectedInstrument || '';

  // Auto-hide overlay in fullscreen after 3 seconds
  useEffect(() => {
    if (showOverlay && previewMode === 'fullscreen') {
      const timer = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showOverlay, previewMode]);

  function applyBinding(nextManifest, name, value) {
    if (!name) return nextManifest;
    const next = { ...nextManifest, engine: { ...nextManifest.engine } };
    try {
      switch (name) {
        case 'masterGain':
          next.engine.master = value;
          engine?.setMasterGain?.(value);
          break;
        case 'filterCutoff':
          next.engine.filter = { ...(next.engine.filter || {}), cutoff: value };
          engine?.setFilter?.({ cutoff: value });
          break;
        case 'filterQ':
          next.engine.filter = { ...(next.engine.filter || {}), q: value };
          engine?.setFilter?.({ q: value });
          break;
        case 'filterType':
          next.engine.filter = { ...(next.engine.filter || {}), type: value };
          engine?.setFilter?.({ type: value });
          break;
        case 'velocityCurve':
          next.engine.velocityCurve = value;
          setVelocityCurve?.(value);
          break;
        case 'envelopeAttack':
          next.engine.env = { ...(next.engine.env || {}), attack: value };
          engine?.setEnvelope?.({ attack: value });
          break;
        case 'envelopeDecay':
          next.engine.env = { ...(next.engine.env || {}), decay: value };
          engine?.setEnvelope?.({ decay: value });
          break;
        case 'envelopeSustain':
          next.engine.env = { ...(next.engine.env || {}), sustain: value };
          engine?.setEnvelope?.({ sustain: value });
          break;
        case 'envelopeRelease':
          next.engine.env = { ...(next.engine.env || {}), release: value };
          engine?.setEnvelope?.({ release: value });
          break;
        case 'delayTime':
          next.engine.fx = { ...(next.engine.fx || {}), delayTime: value };
          engine?.setDelay?.({ time: value });
          break;
        case 'delayFeedback':
          next.engine.fx = { ...(next.engine.fx || {}), delayFeedback: value };
          engine?.setDelay?.({ feedback: value });
          break;
        case 'delayMix':
          next.engine.fx = { ...(next.engine.fx || {}), delayMix: value };
          engine?.setDelay?.({ mix: value });
          break;
        case 'reverbMix':
          next.engine.fx = { ...(next.engine.fx || {}), reverbMix: value };
          // Reverb mix routed in engine via master graph
          break;
        case 'limiter':
          next.engine.fx = { ...(next.engine.fx || {}), limiter: !!value };
          engine?.setLimiter?.(!!value);
          break;
        default:
          break;
      }
    } catch {}
    return next;
  }

  function onNoteOn(midi, velocity) {
    const cat = selectedInstrument || null;
    if (cat) {
      try { engine.noteOnCategory?.(midi, velocity, cat); } catch {}
    } else {
      try { engine.noteOn?.(midi, velocity); } catch {}
    }
  }
  function onNoteOff(midi) {
    try { engine.noteOff?.(midi); } catch {}
  }

  // MIDI: request access and populate devices
  useEffect(() => {
    let mounted = true;
    async function setupMidi() {
      try {
        const access = await navigator.requestMIDIAccess();
        if (!mounted) return;
        setMidiAccess(access);
        const inputs = Array.from(access.inputs.values());
        setMidiInputs(inputs);
        if (inputs[0]) setSelectedInputId(inputs[0].id);
      } catch (e) {
        // Web MIDI may require https or specific browser
      }
    }
    setupMidi();
    return () => { mounted = false; };
  }, []);

  // Bind selected MIDI input
  useEffect(() => {
    if (!midiAccess) return;
    try {
      // detach previous
      if (inputRef.current) {
        inputRef.current.onmidimessage = null;
        inputRef.current = null;
      }
      const input = Array.from(midiAccess.inputs.values()).find((i) => i.id === selectedInputId) || null;
      inputRef.current = input || null;
      if (input) {
        input.onmidimessage = (msg) => {
          const [status, data1, data2] = msg.data || [];
          const cmd = status & 0xf0;
          if (cmd === 0x90 && data2 > 0) {
            onNoteOn(Number(data1), Number(data2));
          } else if ((cmd === 0x80) || (cmd === 0x90 && data2 === 0)) {
            onNoteOff(Number(data1));
          }
        };
      }
    } catch {}
  }, [midiAccess, selectedInputId]);

  // Recording via MediaRecorder
  function startRecording() {
    try {
      const stream = engine?.getOutputStream?.();
      if (!stream) throw new Error('No output stream available');
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordUrl(url);
      };
      rec.start();
      setRecorder(rec);
      setRecording(true);
    } catch (e) {
      console.warn('Recording failed:', e);
    }
  }
  function stopRecording() {
    try { recorder?.stop?.(); } catch {}
    setRecording(false);
  }

  const orderedWidgets = useMemo(() => {
    const ui = manifest.ui || {};
    const list = ui.bindings || [];
    const order = ui.bindingOrder || list.map((b) => b.id);
    const byId = new Map(list.map((b) => [b.id, b]));
    return order.map((id) => byId.get(id)).filter(Boolean);
  }, [manifest.ui?.bindings, manifest.ui?.bindingOrder]);

  // Compute dynamic canvas bounds based on widgets
  const bounds = useMemo(() => {
    let maxRight = 0, maxBottom = 0;
    for (const w of orderedWidgets) {
      if (!w?.visible) continue;
      const r = Number(w.x || 0) + Number(w.w || 0);
      const b = Number(w.y || 0) + Number(w.h || 0);
      if (r > maxRight) maxRight = r;
      if (b > maxBottom) maxBottom = b;
    }
    const width = Math.max(800, Math.ceil(maxRight + 16));
    const height = Math.max(400, Math.ceil(maxBottom + 16));
    return { width, height };
  }, [orderedWidgets]);

  function updateWidget(id, updates) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const list = (ui.bindings || []).map((b) => (b.id === id ? { ...b, ...updates } : b));
      return { ...m, ui: { ...ui, bindings: list, bindingOrder: ui.bindingOrder || list.map((b) => b.id) } };
    });
  }

  // Widget update handler with binding application
  function handleWidgetUpdate(id, updates) {
    const widget = orderedWidgets.find(w => w.id === id);
    if (!widget) return;

    // Update the widget state
    updateWidget(id, updates);

    // Apply bindings to engine
    if ('value' in updates && widget.binding) {
      setManifest((m) => applyBinding(m, widget.binding, Number(updates.value)));
    }
    if ('checked' in updates && widget.binding) {
      setManifest((m) => applyBinding(m, widget.binding, !!updates.checked));
    }
    if ('valueX' in updates && widget.bindingX) {
      setManifest((m) => applyBinding(m, widget.bindingX, Number(updates.valueX)));
    }
    if ('valueY' in updates && widget.bindingY) {
      setManifest((m) => applyBinding(m, widget.bindingY, Number(updates.valueY)));
    }
    if ('pressed' in updates && widget.binding) {
      setManifest((m) => applyBinding(m, widget.binding, !!updates.pressed));
    }
  }

  // Initialize engine with current UI defaults on mount
  useEffect(() => {
    try {
      const list = manifest?.ui?.bindings || [];
      for (const w of list) {
        switch (w.type) {
          case 'slider':
          case 'knob':
          case 'fader':
            if (w.binding) setManifest((m) => applyBinding(m, w.binding, Number(w.value ?? 0)));
            break;
          case 'toggle':
            if (w.binding) setManifest((m) => applyBinding(m, w.binding, !!w.checked));
            break;
          case 'select':
            if (w.binding) setManifest((m) => applyBinding(m, w.binding, w.value));
            break;
          case 'xy':
            if (w.bindingX) setManifest((m) => applyBinding(m, w.bindingX, Number(w.valueX ?? w.minX ?? 0)));
            if (w.bindingY) setManifest((m) => applyBinding(m, w.bindingY, Number(w.valueY ?? w.minY ?? 0)));
            break;
          default:
            break;
        }
      }
    } catch {}
  }, []);

  // No widgets designed yet
  if (orderedWidgets.length === 0) {
    return (
      <div className="card compact">
        <h2 className="title" style={{ marginBottom: 8 }}>Test / Live Preview</h2>
        <p className="muted">No widgets designed yet. Go to the Design page to create your UI.</p>
      </div>
    );
  }

  const canvas = manifest?.ui?.canvas || {};

  // Fullscreen mode - clean preview like exported VST/standalone
  if (previewMode === 'fullscreen') {
    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw', 
        height: '100vh',
        background: canvas.bg || '#0b1220',
        backgroundImage: canvas.bgImage ? `url(${canvas.bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden',
        zIndex: 9999
      }}>
        {/* Overlay controls */}
        {showOverlay && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.85)',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10000,
            transition: 'opacity 0.3s',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
          onMouseEnter={() => setShowOverlay(true)}
          >
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ opacity: 0.5 }}>🎹</span>
              <span>Live Preview</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span style={{ fontWeight: 400, opacity: 0.8 }}>{manifest?.meta?.name || 'Untitled Instrument'}</span>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {midiInputs.length > 0 && (
                <select 
                  value={selectedInputId}
                  onChange={(e) => setSelectedInputId(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 12
                  }}
                >
                  {midiInputs.map((inp) => (
                    <option key={inp.id} value={inp.id}>{inp.name}</option>
                  ))}
                </select>
              )}
              <button 
                onClick={() => setPreviewMode('windowed')}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '6px 14px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500
                }}
              >
                Exit Fullscreen
              </button>
            </div>
          </div>
        )}

        {/* Show overlay trigger zone when hidden */}
        {!showOverlay && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 50,
              zIndex: 9999
            }}
            onMouseEnter={() => setShowOverlay(true)}
          />
        )}

        {/* Fullscreen canvas */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: bounds.width,
            height: bounds.height,
            maxWidth: '100%',
            maxHeight: '100%'
          }}>
            {orderedWidgets.map((w) => (
              !w?.visible ? null : (
                <div key={w.id} className="widget" style={{ left: w.x || 0, top: w.y || 0, width: w.w || 200, height: w.h || 80 }}>
                  <WidgetRenderer 
                    widget={w}
                    onUpdate={handleWidgetUpdate}
                    isDesignMode={false}
                    showLabels={false}
                    engine={engine}
                    onNoteOn={onNoteOn}
                    onNoteOff={onNoteOff}
                  />
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Windowed mode - with controls and tools
  return (
    <div className="pad-12">

      <div className="pad-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <strong>Exact Export Preview</strong>
            <div className="muted mb-6">This renders your designed UI with live bindings to the engine.</div>
          </div>
          <button 
            onClick={() => {
              setPreviewMode('fullscreen');
              setShowOverlay(true);
            }}
            style={{
              background: 'var(--accent)',
              border: 'none',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            ⛶ Fullscreen Preview
          </button>
        </div>
        <div className="space" />
  <div className="row align-center gap-12">
          <div className="muted">Zoom</div>
          <input type="range" min={0.5} max={2} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
          <div className="muted">{(zoom * 100).toFixed(0)}%</div>
          <button onClick={() => setZoom(1)} className="btn-small">Reset</button>
        </div>
        <div className="preview-outer pos-relative overflow-auto" style={{ width: `${Math.ceil(bounds.width * zoom)}px`, height: `${Math.ceil(bounds.height * zoom)}px` }}>
          <div className="preview-canvas panel-dark pos-relative" style={{ width: `${bounds.width}px`, height: `${bounds.height}px`, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
             {orderedWidgets.length === 0 ? (
               <div className="muted">No widgets in Design yet. Add controls in the Design page to see them here.</div>
             ) : (
               orderedWidgets.map((w) => (
                !w?.visible ? null : (
                  <div key={w.id} className="widget" style={{ left: w.x || 0, top: w.y || 0, width: w.w || 200, height: w.h || 80 }}>
                    <WidgetRenderer 
                      widget={w}
                      onUpdate={handleWidgetUpdate}
                      isDesignMode={false}
                      showLabels={false}
                      engine={engine}
                      onNoteOn={onNoteOn}
                      onNoteOff={onNoteOff}
                    />
                  </div>
                )
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
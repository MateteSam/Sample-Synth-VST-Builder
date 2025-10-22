import React, { useState, useEffect, useMemo } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import WidgetRenderer from '../components/WidgetRenderer.jsx';

// Binding catalogs (same as Design.jsx)
const NUMERIC_BINDINGS = {
  masterGain: { label: 'Master Gain', min: 0, max: 1, step: 0.01 },
  filterCutoff: { label: 'Filter Cutoff', min: 20, max: 20000, step: 1 },
  filterQ: { label: 'Filter Q', min: 0, max: 20, step: 0.01 },
  envelopeAttack: { label: 'Attack', min: 0, max: 4, step: 0.001 },
  envelopeDecay: { label: 'Decay', min: 0, max: 4, step: 0.001 },
  envelopeSustain: { label: 'Sustain', min: 0, max: 1, step: 0.001 },
  envelopeRelease: { label: 'Release', min: 0, max: 4, step: 0.001 },
  delayTime: { label: 'Delay Time', min: 0, max: 2, step: 0.001 },
  delayFeedback: { label: 'Delay Feedback', min: 0, max: 1, step: 0.001 },
  delayMix: { label: 'Delay Mix', min: 0, max: 1, step: 0.001 },
  reverbMix: { label: 'Reverb Mix', min: 0, max: 1, step: 0.001 },
  transpose: { label: 'Transpose', min: -24, max: 24, step: 1 },
  glideTime: { label: 'Glide Time', min: 0, max: 2, step: 0.001 },
  modWheel: { label: 'Mod Depth', min: 0, max: 1, step: 0.001 },
  modRate: { label: 'Mod Rate', min: 0.1, max: 20, step: 0.01 },
};
const BOOLEAN_BINDINGS = {
  sustain: { label: 'Sustain' },
  sostenuto: { label: 'Sostenuto' },
  limiter: { label: 'Limiter' },
};
const ENUM_BINDINGS = {
  filterType: { label: 'Filter Type', options: ['lowpass', 'highpass', 'bandpass', 'notch'] },
  velocityCurve: { label: 'Velocity Curve', options: ['linear', 'soft', 'hard', 'log', 'exp'] },
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

export default function Test({ engine }) {
  const { manifest, setManifest } = useInstrument();
  const [previewMode, setPreviewMode] = useState('fullscreen'); // 'fullscreen' or 'windowed'
  const [showOverlay, setShowOverlay] = useState(true);

  // Get widgets from manifest
  const rawBindings = manifest?.ui?.bindings;
  const bindingOrder = manifest?.ui?.bindingOrder || [];
  const bindings = Array.isArray(rawBindings) ? rawBindings : Object.values(rawBindings || {});
  const orderedWidgets = useMemo(() => {
    const map = new Map(bindings.map((b) => [b.id, b]));
    return bindingOrder.map((id) => map.get(id)).filter(Boolean);
  }, [bindings, bindingOrder]);

  const visibleWidgets = orderedWidgets.filter((w) => w.visible !== false);
  const canvas = manifest?.ui?.canvas || { width: 800, height: 600, bgColor: '#0b1220', bgUrl: '', textureUrl: '' };

  // Auto-hide overlay after 3 seconds
  useEffect(() => {
    if (showOverlay && previewMode === 'fullscreen') {
      const timer = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showOverlay, previewMode]);

  // Apply engine bindings when widget values change
  const applyBinding = (manifest, name, value) => {
    const next = { ...manifest };
    try {
      switch (name) {
        case 'masterGain':
          next.engine = { ...(next.engine || {}), master: value };
          engine?.setMasterGain?.(value);
          break;
        case 'filterCutoff':
          next.engine.filter = { ...(next.engine.filter || {}), cutoff: value };
          engine?.setFilterCutoff?.(value);
          break;
        case 'filterQ':
          next.engine.filter = { ...(next.engine.filter || {}), q: value };
          engine?.setFilterQ?.(value);
          break;
        case 'filterType':
          next.engine.filter = { ...(next.engine.filter || {}), type: value };
          engine?.setFilterType?.(value);
          break;
        case 'velocityCurve':
          next.engine.velocityCurve = value;
          engine?.setVelocityCurve?.(value);
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
          const delayFx = { ...(next.engine.fx || {}) };
          delayFx.delay = { ...(delayFx.delay || {}), time: value };
          next.engine.fx = delayFx;
          engine?.setDelay?.({ time: value });
          break;
        case 'delayFeedback':
          const delayFx2 = { ...(next.engine.fx || {}) };
          delayFx2.delay = { ...(delayFx2.delay || {}), feedback: value };
          next.engine.fx = delayFx2;
          engine?.setDelay?.({ feedback: value });
          break;
        case 'delayMix':
          const delayFx3 = { ...(next.engine.fx || {}) };
          delayFx3.delay = { ...(delayFx3.delay || {}), mix: value };
          next.engine.fx = delayFx3;
          engine?.setDelay?.({ mix: value });
          break;
        case 'reverbMix':
          const reverbFx = { ...(next.engine.fx || {}) };
          reverbFx.reverb = { ...(reverbFx.reverb || {}), mix: value };
          next.engine.fx = reverbFx;
          engine?.setReverbMix?.(value);
          break;
        case 'sustain':
          next.engine.cc = { ...(next.engine.cc || {}), sustain: !!value };
          engine?.setSustain?.(!!value);
          break;
        case 'sostenuto':
          next.engine.cc = { ...(next.engine.cc || {}), sostenuto: !!value };
          engine?.setSostenuto?.(!!value);
          break;
        case 'limiter':
          next.engine.fx = { ...(next.engine.fx || {}), limiter: !!value };
          engine?.setLimiter?.(!!value);
          break;
        case 'transpose':
          next.engine.pitch = { ...(next.engine.pitch || {}), transpose: value };
          engine?.setTranspose?.(value);
          break;
        case 'glideTime':
          next.engine.pitch = { ...(next.engine.pitch || {}), glideTime: value };
          engine?.setGlide?.(value);
          break;
        case 'modRate':
          next.engine.mod = { ...(next.engine.mod || {}), rate: value };
          engine?.setModRate?.(value);
          break;
        case 'modWheel':
          next.engine.mod = { ...(next.engine.mod || {}), depth: value };
          engine?.setModWheel?.(value);
          break;
        default:
          break;
      }
    } catch (e) {
      console.warn('Engine binding failed:', name, value, e);
    }
    return next;
  };

  // Update widget value and apply binding
  const updateWidgetValue = (widgetId, newValue) => {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const bindings = Array.isArray(ui.bindings) ? [...ui.bindings] : [];
      const idx = bindings.findIndex((w) => w.id === widgetId);
      if (idx < 0) return m;
      
      const widget = { ...bindings[idx] };
      const next = { ...m, ui: { ...ui, bindings: [...bindings] } };
      
      // Update widget value based on type
      if (widget.type === 'slider' || widget.type === 'knob' || widget.type === 'fader') {
        widget.value = newValue;
        if (widget.binding) {
          return applyBinding({ ...next, ui: { ...ui, bindings: bindings.map((w, i) => i === idx ? widget : w) } }, widget.binding, newValue);
        }
      } else if (widget.type === 'toggle' || widget.type === 'button') {
        widget.checked = newValue;
        if (widget.binding) {
          return applyBinding({ ...next, ui: { ...ui, bindings: bindings.map((w, i) => i === idx ? widget : w) } }, widget.binding, newValue);
        }
      } else if (widget.type === 'select') {
        widget.value = newValue;
        if (widget.binding) {
          return applyBinding({ ...next, ui: { ...ui, bindings: bindings.map((w, i) => i === idx ? widget : w) } }, widget.binding, newValue);
        }
      } else if (widget.type === 'xy') {
        widget.valueX = newValue.x;
        widget.valueY = newValue.y;
        if (widget.bindingX) {
          applyBinding(next, widget.bindingX, newValue.x);
        }
        if (widget.bindingY) {
          applyBinding(next, widget.bindingY, newValue.y);
        }
      }
      
      next.ui.bindings = bindings.map((w, i) => i === idx ? widget : w);
      return next;
    });
  };

  if (visibleWidgets.length === 0) {
    return (
      <div className="card compact">
        <h2 className="title" style={{ marginBottom: 8 }}>Test / Live Preview</h2>
        <p className="muted">No widgets designed yet. Go to the Design page to create your UI.</p>
      </div>
    );
  }

  const theme = manifest?.ui?.theme || {};
  const themeStyle = {
    '--accent': theme.accent || '#4fb6ff',
    '--accent-2': theme.primary || '#00eaff',
    '--bg': canvas.bgColor || '#0b1220',
  };

  return (
    <div className="theme-dark" style={{ 
      position: 'relative', 
      width: '100%', 
      height: previewMode === 'fullscreen' ? '100vh' : 'auto',
      background: canvas.bgColor || '#0b1220',
      overflow: 'hidden',
      ...themeStyle
    }}>
      {/* Overlay controls */}
      {showOverlay && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.8)',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          transition: 'opacity 0.3s',
          opacity: showOverlay ? 1 : 0
        }}
        onMouseEnter={() => setShowOverlay(true)}
        >
          <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
            Live Preview - {manifest?.meta?.name || 'Untitled'}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              onClick={() => setPreviewMode(previewMode === 'fullscreen' ? 'windowed' : 'fullscreen')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              {previewMode === 'fullscreen' ? '🗗 Windowed' : '⛶ Fullscreen'}
            </button>
            <button 
              onClick={() => setShowOverlay(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 18,
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Show overlay button on hover when hidden */}
      {!showOverlay && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            zIndex: 999
          }}
          onMouseEnter={() => setShowOverlay(true)}
        />
      )}

      {/* Canvas rendering */}
      <div className="preview-canvas" style={{
        position: 'relative',
        width: previewMode === 'fullscreen' ? '100%' : (canvas.width || canvas.w),
        height: previewMode === 'fullscreen' ? '100%' : (canvas.height || canvas.h),
        maxWidth: previewMode === 'fullscreen' ? 'none' : (canvas.width || canvas.w),
        margin: previewMode === 'fullscreen' ? 0 : '20px auto',
        background: canvas.bgColor || '#0b1220',
      }}>
        {canvas.bgUrl && (
          <div className="bg-img" style={{ backgroundImage: `url(${canvas.bgUrl})` }} />
        )}
        {canvas.textureUrl && (
          <div className="texture-overlay" style={{ backgroundImage: `url(${canvas.textureUrl})` }} />
        )}
        {visibleWidgets.map((w) => {
          const style = {
            position: 'absolute',
            left: w.x,
            top: w.y,
            width: w.w,
            height: w.h,
            pointerEvents: 'auto'
          };

          // Use shared WidgetRenderer for pixel-perfect parity with Design page
          return (
            <div key={w.id} style={style} className="widget">
              <WidgetRenderer
                widget={w}
                manifest={manifest}
                engine={engine}
                onUpdate={updateWidgetValue}
                isDesignMode={false}
                showLabels={true}
                onNoteOn={(midi, vel) => { try { engine?.noteOn?.(midi, vel); } catch {} }}
                onNoteOff={(midi) => { try { engine?.noteOff?.(midi); } catch {} }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
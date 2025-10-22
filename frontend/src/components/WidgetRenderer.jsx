import React from 'react';
import MasterMeter from './MasterMeter.jsx';
import SpectrumVisualizer from './SpectrumVisualizer.jsx';
import Keyboard from './Keyboard.jsx';
import ButtonPush from './ButtonPush.jsx';
import Sequence from '../pages/Sequence.jsx';
import { 
  PatternDisplayWidget, 
  StepEditorWidget, 
  TransportControlsWidget, 
  PianoRollWidget 
} from './SequencerWidgets.jsx';

import { IconScrew, IconGrill } from './Icons.jsx';

// Shared widget renderer used by both Design and Test pages
// This ensures visual consistency between design-time and runtime
export default function WidgetRenderer({ widget, onUpdate, isDesignMode = false, showLabels = true, engine, onNoteOn, onNoteOff, manifest }) {
  const w = widget;
  const transparentStyle = w.transparent
    ? { background: 'none', boxShadow: 'none', border: 'none', outline: 'none' }
    : {};

  function updateValue(updates) {
    if (onUpdate) {
      onUpdate(w.id, updates);
    }
  }

  // Slider widget
  if (w.type === 'slider') {
    const curr = Number(w.value ?? 0);
    const min = Number(w.min ?? 0);
    const max = Number(w.max ?? 1);
    const pct = Math.max(0, Math.min(100, ((curr - min) / (max - min)) * 100));
    const trackH = Math.max(10, Math.min(20, Math.round((Number(w.h ?? 72) - 36) * 0.6)));
    
    return (
      <div className="widget-body" style={transparentStyle}>
        <div className="row justify-between">
          <div>{w.label || 'Slider'}</div>
          <div className="muted">{curr.toFixed?.(2)}</div>
        </div>
        <input 
          className="range" 
          type="range" 
          min={min} 
          max={max} 
          step={w.step} 
          value={curr}
          style={{ '--val': `${pct}%`, height: `${trackH}px` }} 
          onChange={(e) => updateValue({ value: Number(e.target.value) })} 
        />
      </div>
    );
  }

  // Knob widget
  if (w.type === 'knob') {
    const v = Number(w.value ?? 0);
    const min = Number(w.min ?? 0);
    const max = Number(w.max ?? 1);
    const p = Math.max(0, Math.min(1, (v - min) / (max - min)));
    const angle = 135 + p * 270;
    const availH = Math.max(24, Number(w.h ?? 130) - 32);
    const size = Math.max(36, Math.min(Number(w.w ?? 160) - 24, availH - 8));
    const knobControlStyle = w.transparent
      ? { width: size, height: size, margin: '8px auto', background: 'none', boxShadow: 'none', border: 'none' }
      : { width: size, height: size, margin: '8px auto' };
    const knobDialStyle = w.transparent
      ? { transform: `rotate(${angle}deg)`, width: '100%', height: '100%', background: 'none', boxShadow: 'none', border: 'none' }
      : { transform: `rotate(${angle}deg)`, width: '100%', height: '100%' };
    return (
      <div className="widget-body" style={transparentStyle}>
        <div className="row justify-between">
          <div>{w.label || 'Knob'}</div>
          <div className="muted">{v.toFixed?.(2)}</div>
        </div>
        <div className="knob-control" style={knobControlStyle}>
          <div className="knob-dial" style={knobDialStyle}>
            <div className="knob-indicator" />
          </div>
          <input 
            className="knob-input" 
            type="range" 
            min={min} 
            max={max} 
            step={w.step} 
            value={v} 
            onChange={(e) => updateValue({ value: Number(e.target.value) })} 
            style={{ width: '100%', height: '100%', cursor: 'pointer', background: w.transparent ? 'none' : undefined, border: w.transparent ? 'none' : undefined }} 
          />
        </div>
      </div>
    );
  }

  // Toggle widget
  if (w.type === 'toggle') {
    return (
      <div className="widget-body" style={transparentStyle}>
        <div className="row justify-between">
          <div>{w.label || 'Toggle'}</div>
          <div className="muted">{w.checked ? 'On' : 'Off'}</div>
        </div>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={!!w.checked} 
            onChange={(e) => updateValue({ checked: !!e.target.checked })} 
          />
          <span className="slider" />
        </label>
      </div>
    );
  }

  // Select widget
  if (w.type === 'select') {
    return (
      <div className="widget-body" style={transparentStyle}>
        <div className="row justify-between">
          <div>{w.label || 'Select'}</div>
          <div className="muted">{String(w.value)}</div>
        </div>
        <select 
          className="select" 
          value={w.value} 
          onChange={(e) => updateValue({ value: e.target.value })}
        >
          {(w.choices || []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  // Fader widget
  if (w.type === 'fader') {
    const curr = Number(w.value ?? 0);
    const min = Number(w.min ?? 0);
    const max = Number(w.max ?? 1);
    const pct = Math.max(0, Math.min(100, ((curr - min) / (max - min)) * 100));
    const trackW = Math.max(14, Math.min(28, Math.round((Number(w.w ?? 72) - 16) * 0.6)));
    const trackH = Math.max(40, Math.round((Number(w.h ?? 180) - 36)));
    
    return (
      <div className="widget-body grid-center" style={transparentStyle}>
        <div className="row justify-between w-full">
          <div>{w.label || 'Fader'}</div>
          <div className="muted">{curr.toFixed?.(2)}</div>
        </div>
        <input 
          className="range-vertical" 
          type="range" 
          min={min} 
          max={max} 
          step={w.step} 
          value={curr}
          style={{ '--val': `${pct}%`, width: `${trackW}px`, height: `${trackH}px` }} 
          onChange={(e) => updateValue({ value: Number(e.target.value) })} 
        />
      </div>
    );
  }

  // Button widget (uses new ButtonPush styles)
  if (w.type === 'button') {
    const pressed = !!w.pressed;
    return (
      <div className="widget-body" style={{ ...transparentStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="row justify-between">
          <div>{w.label || 'Button'}</div>
          <div className="muted">{pressed ? 'Pressed' : 'Idle'}</div>
        </div>
        <div style={{ width: '100%', height: Math.max(36, Number(w.h ?? 72) - 36) }}>
          <ButtonPush 
            pressed={pressed}
            onChange={(next) => updateValue({ pressed: !!next })}
            styleId={w.styleId || 'default'}
            color={w.color || 'default'}
            accentColor={w.accentColor}
          />
        </div>
      </div>
    );
  }

  // XY Pad widget
  if (w.type === 'xy') {
    const rx = (Number(w.valueX ?? w.minX) - w.minX) / ((w.maxX ?? 1) - (w.minX ?? 0));
    const ry = (Number(w.valueY ?? w.minY) - w.minY) / ((w.maxY ?? 1) - (w.minY ?? 0));
    const left = `${Math.max(0, Math.min(100, rx * 100))}%`;
    const top = `${Math.max(0, Math.min(100, ry * 100))}%`;
    
    return (
      <div 
        className="widget-body" 
        style={{ ...transparentStyle, height: '100%' }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const onMove = (ev) => {
            const rx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
            const ry = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
            const xVal = (w.minX ?? 0) + rx * ((w.maxX ?? 1) - (w.minX ?? 0));
            const yVal = (w.minY ?? 0) + ry * ((w.maxY ?? 1) - (w.minY ?? 0));
            updateValue({ valueX: xVal, valueY: yVal });
          };
          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
          };
          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <div className="row justify-between">
          <div>{w.label || 'XY Pad'}</div>
          <div className="muted">X: {(w.valueX ?? 0).toFixed?.(2)} Y: {(w.valueY ?? 0).toFixed?.(2)}</div>
        </div>
        <div className="xy-pad" style={{ position: 'relative', width: '100%', height: 'calc(100% - 24px)' }}>
          <div className="xy-thumb" style={{ position: 'absolute', left, top }} />
        </div>
      </div>
    );
  }

  // Meter widget
  if (w.type === 'meter') {
    return <MasterMeter engine={engine} />;
  }

  // Spectrum widget
  if (w.type === 'spectrum') {
    return <SpectrumVisualizer engine={engine} height={Number(w.h ?? 120)} />;
  }

  // Keyboard widget
  if (w.type === 'keyboard') {
    return (
      <div className="widget-body" style={transparentStyle}>
        <Keyboard 
          startMidi={Number(w.startMidi ?? 48)} 
          endMidi={Number(w.endMidi ?? 72)} 
          height={Number(w.h ?? 160)} 
          onNoteOn={onNoteOn} 
          onNoteOff={onNoteOff} 
        />
      </div>
    );
  }

  // Label widget
  if (w.type === 'label') {
    return (
      <div className="widget-body" style={transparentStyle}>
        <div>{w.text || w.label || 'Label'}</div>
      </div>
    );
  }

  // Image widget
  if (w.type === 'image') {
    return (
      <div className="widget-body" style={transparentStyle}>
        <img 
          src={w.src || ''} 
          alt={w.label || 'Image'} 
          className="w-full h-full" 
          style={{ objectFit: w.fit || 'cover', borderRadius: Number(w.radius ?? 0) }} 
        />
      </div>
    );
  }

  // Logo widget
  if (w.type === 'logo') {
    return (
      <div className="widget-body" style={transparentStyle}>
        <img 
          src={w.src || ''} 
          alt={w.label || 'Logo'} 
          className="w-full h-full" 
          style={{ objectFit: w.fit || 'contain', borderRadius: Number(w.radius ?? 0) }} 
        />
      </div>
    );
  }

  // Divider widget
  if (w.type === 'divider') {
    return (
      <div className="widget-body" style={transparentStyle}>
        <div className="preview-divider w-full" style={{ height: 2 }} />
      </div>
    );
  }

  // State Display widget
  if (w.type === 'stateDisplay') {
    let displayValue = w.displayValue || '--';
    
    // Dynamic state binding evaluation (if manifest is provided via a context)
    if (w.stateBinding) {
      const binding = w.stateBinding;
      // For now, show the binding name - this will be populated by the Test page
      displayValue = w.displayValue || binding;
    }
    
    return (
      <div className="widget-body" style={{ ...transparentStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 8 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{w.label || 'State'}</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{displayValue}</div>
      </div>
    );
  }

  // Sequencer widget (full sequence page)
  if (w.type === 'sequencer') {
  return <div style={transparentStyle}><Sequence engine={engine} manifest={manifest} /></div>;
  }

  // Pattern Display widget
  if (w.type === 'patternDisplay') {
    return (
      <div style={transparentStyle}>
        <PatternDisplayWidget
          config={w.config || {}}
          isDesignMode={isDesignMode}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

    // Decorative Screw widget
    if (w.type === 'screw') {
      return (
        <div className="widget-body" style={{ ...transparentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconScrew style={{ width: w.w || 32, height: w.h || 32 }} />
        </div>
      );
    }

    // Decorative Grill widget
    if (w.type === 'grill') {
      return (
        <div className="widget-body" style={{ ...transparentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconGrill style={{ width: w.w || 48, height: w.h || 24 }} />
        </div>
      );
    }

  // Step Editor widget
  if (w.type === 'stepEditor') {
    return (
      <div style={transparentStyle}>
        <StepEditorWidget
          config={w.config || {}}
          isDesignMode={isDesignMode}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Transport Controls widget
  if (w.type === 'transportControls') {
    return (
      <div style={transparentStyle}>
        <TransportControlsWidget
          config={w.config || {}}
          isDesignMode={isDesignMode}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Piano Roll widget
  if (w.type === 'pianoRoll') {
    return (
      <div style={transparentStyle}>
        <PianoRollWidget
          config={w.config || {}}
          isDesignMode={isDesignMode}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Fallback for unknown types
  return (
    <div className="widget-body" style={transparentStyle}>
      <div className="muted">Unknown widget type: {w.type}</div>
    </div>
  );
}

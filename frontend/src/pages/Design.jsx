import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import { IconMidi, IconTemplates, IconStyle, IconTab, IconComponents, IconLayers, IconAssets, IconAI } from '../components/Icons.jsx';
import { ComponentLibrary } from '../components/ComponentLibrary.jsx';
import Sequence from './Sequence.jsx';
import Keyboard from '../components/Keyboard.jsx';
import MasterMeter from '../components/MasterMeter.jsx';
import SpectrumVisualizer from '../components/SpectrumVisualizer.jsx';
import DesignCanvas from '../components/DesignCanvas.jsx';
import AssetManager from '../components/AssetManager.jsx';
import AIAssistantPanel from '../components/AIAssistantPanel.jsx';
import ModernControlsPanel from '../components/ModernControlsPanel.jsx';
import ModernKnob from '../components/ModernKnob.jsx';
import ModernFader from '../components/ModernFader.jsx';
import ModernButton from '../components/ModernButton.jsx';
import ModernLED from '../components/ModernLED.jsx';
import PitchWheel from '../components/PitchWheel.jsx';
import ModWheel from '../components/ModWheel.jsx';
import TransposeButton from '../components/TransposeButton.jsx';
import { TEMPLATES, loadTemplate, generateWoodGrainDataUrl } from '../utils/templates.js';
import { HexColorPicker } from 'react-colorful';

// Binding catalogs
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
  // New synth bindings
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

// Cross-page state bindings (Play/Map/Sequence integration)
const STATE_BINDINGS = {
  // Play page state
    'state.selectedInstrument': { label: 'Selected Instrument', type: 'string', source: 'play' },
    'state.instrumentCount': { label: 'Instrument Count', type: 'number', source: 'play' },
    'state.sampleCount': { label: 'Sample Count', type: 'number', source: 'play' },
  
  // Map page state
    'state.currentArticulation': { label: 'Current Articulation', type: 'string', source: 'map' },
    'state.currentMic': { label: 'Current Mic', type: 'string', source: 'map' },
    'state.zoneCount': { label: 'Zone Count', type: 'number', source: 'map' },
  
  // Sequence page state
    'state.sequencerPlaying': { label: 'Sequencer Playing', type: 'boolean', source: 'sequence' },
    'state.sequencerBPM': { label: 'Sequencer BPM', type: 'number', source: 'sequence' },
    'state.sequencerCurrentStep': { label: 'Current Step', type: 'number', source: 'sequence' },
    'state.sequencerMode': { label: 'Sequencer Mode', type: 'string', source: 'sequence' },
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Safe ID generator: uses crypto.randomUUID if available, else falls back
function randomId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return 'id-' + Math.random().toString(36).slice(2) + '-' + Date.now();
}

function TabButton({ active, onClick, children }) {
  return (<button onClick={onClick} className={`tab-btn ${active ? 'active' : ''}`}>{children}</button>);
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Design page error:', error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>Design failed to render</strong>
            <span className="muted">{String(this.state.error?.message || this.state.error)}</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function Design() {
  const { manifest, setManifest, engine } = useInstrument();
  const [activeTab, setActiveTab] = useState('components');
  const [selectedIds, setSelectedIds] = useState([]);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [openCats, setOpenCats] = useState({ templates: true, suggested: true, favorites: true, recent: true, popular: true, controls: true, displays: true, interaction: true, decorative: false, static: false });
  const [pinnedCats, setPinnedCats] = useState({});
  const [sortAZ, setSortAZ] = useState(false);
  const [libFocus, setLibFocus] = useState({ catId: null, idx: -1 });
  const libSearchRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const [transport, setTransport] = useState({ playing: false, recording: false });
  const [midiLearnActive, setMidiLearnActive] = useState(false);
  const [automationMode, setAutomationMode] = useState('off'); // off, read, write, latch
  const [inspectorTab, setInspectorTab] = useState('properties'); // properties, automation, midi, scripts
  
  // Phase 3: Canvas improvements
  const [zoom, setZoom] = useState(0.75);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [clipboard, setClipboard] = useState([]);
  const canvasRef = useRef(null);
  
  // Phase 4: Inspector enhancements
  const [collapsedSections, setCollapsedSections] = useState({});
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('');
  
  // Phase 5: Professional touches
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [tooltip, setTooltip] = useState({ show: false, text: '', x: 0, y: 0 });
  const [isExporting, setIsExporting] = useState(false);
  
  // Phase 6: Enhanced interactions
  const [marquee, setMarquee] = useState(null); // { x, y, w, h } for selection box
  const [isDragging, setIsDragging] = useState(false);
  const [canvasPanning, setCanvasPanning] = useState(false);
  const [snapGuides, setSnapGuides] = useState([]); // [{ type: 'vertical'|'horizontal', position: number }]
  
  const presetName = manifest?.ui?.presetName || 'New Preset';
  const canvas = manifest?.ui?.canvas || {};
  const usageCounts = manifest?.ui?.usageCounts || {};
  const recentTypes = manifest?.ui?.recentTypes || [];
  const bgInputRef = useRef(null);
  const texInputRef = useRef(null);

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('design.library.favorites');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setFavorites(arr);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('design.library.favorites', JSON.stringify(favorites)); } catch {}
  }, [favorites]);

  // Persist library UI preferences (open/pinned/sort) to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('design.library.prefs');
      if (!raw) return;
      const prefs = JSON.parse(raw);
      if (prefs && typeof prefs === 'object') {
        if (prefs.openCats && typeof prefs.openCats === 'object') {
          // Merge to keep any new default categories (e.g., suggested)
          setOpenCats((prev) => ({ ...prev, ...prefs.openCats }));
        }
        if (prefs.pinnedCats && typeof prefs.pinnedCats === 'object') {
          setPinnedCats(prefs.pinnedCats);
        }
        if (typeof prefs.sortAZ === 'boolean') {
          setSortAZ(prefs.sortAZ);
        }
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const prefs = { openCats, pinnedCats, sortAZ };
      localStorage.setItem('design.library.prefs', JSON.stringify(prefs));
    } catch {}
  }, [openCats, pinnedCats, sortAZ]);

  // Components library structure (moved earlier to avoid TDZ on LIBRARY)
  const LIBRARY = useMemo(() => {
    const TYPE_LABELS = {
      slider: 'Slider', knob: 'Knob', toggle: 'Toggle Switch', fader: 'Fader', button: 'Push Button', select: 'Select',
      xy: 'XY Pad', keyboard: 'Keyboard', meter: 'Meter', spectrum: 'Spectrum', divider: 'Divider Line', label: 'Label', image: 'Image', logo: 'Logo', stateDisplay: 'State Display',
      patternDisplay: 'Pattern Display', stepEditor: 'Step Editor', transportControls: 'Transport Controls', pianoRoll: 'Piano Roll'
    };
    const ALL_TYPES = Object.keys(TYPE_LABELS);
    const popularList = ALL_TYPES.filter((t) => (usageCounts[t] || 0) > 0)
      .sort((a, b) => (usageCounts[b] || 0) - (usageCounts[a] || 0));
    const suggestedTypes = Array.from(new Set([...(recentTypes || []), ...popularList]))
      .filter((t) => TYPE_LABELS[t])
      .slice(0, 8);
    const suggestedCat = suggestedTypes.length ? {
      id: 'suggested',
      label: 'Suggested',
      items: suggestedTypes.map((t) => ({ key: t, label: TYPE_LABELS[t], create: (x, y) => addWidgetOfType(t, x, y) })),
    } : null;
    const favoritesCat = {
      id: 'favorites',
      label: 'Favorites',
      items: favorites.map((key) => ({ key, label: TYPE_LABELS[key] || key, create: (x, y) => addWidgetOfType(key, x, y) })),
    };
    const recentsCat = {
      id: 'recent',
      label: 'Recent',
      items: recentTypes.filter((t) => TYPE_LABELS[t]).map((t) => ({ key: t, label: TYPE_LABELS[t], create: (x, y) => addWidgetOfType(t, x, y) })),
    };
    const popularCat = {
      id: 'popular',
      label: 'Popular',
      items: popularList.slice(0, 8).map((t) => ({ key: t, label: TYPE_LABELS[t], create: (x, y) => addWidgetOfType(t, x, y) })),
    };
    const controlsCat = {
      id: 'controls', label: 'Controls', items: [
        { key: 'slider', label: 'Slider', create: (x, y) => addWidgetOfType('slider', x, y) },
        { key: 'knob', label: 'Knob', create: (x, y) => addWidgetOfType('knob', x, y) },
        { key: 'toggle', label: 'Toggle Switch', create: (x, y) => addWidgetOfType('toggle', x, y) },
        { key: 'fader', label: 'Fader', create: (x, y) => addWidgetOfType('fader', x, y) },
        { key: 'button', label: 'Push Button', create: (x, y) => addWidgetOfType('button', x, y) },
        { key: 'select', label: 'Select', create: (x, y) => addWidgetOfType('select', x, y) },
        { key: 'rotary-encoder', label: 'Rotary Encoder', disabled: true },
      ]
    };
    const interactionCat = {
      id: 'interaction', label: 'Interaction', items: [
        { key: 'xy', label: 'XY Pad', create: (x, y) => addWidgetOfType('xy', x, y) },
        { key: 'keyboard', label: 'Keyboard', create: (x, y) => addWidgetOfType('keyboard', x, y) },
  { key: 'pitchwheel', label: 'Pitch Wheel', create: (x, y) => addWidgetOfType('pitchwheel', x, y) },
  { key: 'modwheel', label: 'Mod Wheel', create: (x, y) => addWidgetOfType('modwheel', x, y) },
  { key: 'transpose', label: 'Transpose Button', create: (x, y) => addWidgetOfType('transpose', x, y) },
        { key: 'tbar-fader', label: 'T-Bar Fader', disabled: true },
      ]
    };
    const displaysCat = {
      id: 'displays', label: 'Displays', items: [
        { key: 'meter', label: 'Meter', create: (x, y) => addWidgetOfType('meter', x, y) },
        { key: 'spectrum', label: 'Spectrum', create: (x, y) => addWidgetOfType('spectrum', x, y) },
        { key: 'vu-meter-analog', label: 'Analog VU Meter', disabled: true },
        { key: 'vumeter', label: 'Digital VU Meter', disabled: true },
        { key: 'display-7-segment', label: '7-Segment Display', disabled: true },
        { key: 'displayscreen', label: 'Display Screen', disabled: true },
      ]
    };
    const decorativeCat = {
      id: 'decorative', label: 'Decorative', items: [
        { key: 'divider', label: 'Divider Line', create: (x, y) => addWidgetOfType('divider', x, y) },
        { key: 'deco-text', label: 'Styled Text', disabled: true },
        { key: 'deco-vent', label: 'Ventilation', disabled: true },
        { key: 'deco-screw', label: 'Screw', disabled: true },
      ]
    };
    const staticCat = {
      id: 'static', label: 'Static', items: [
        { key: 'label', label: 'Label', create: (x, y) => addWidgetOfType('label', x, y) },
        { key: 'image', label: 'Image', create: (x, y) => addWidgetOfType('image', x, y) },
        { key: 'logo', label: 'Logo', create: (x, y) => addWidgetOfType('logo', x, y) },
        { key: 'stateDisplay', label: 'State Display', create: (x, y) => addWidgetOfType('stateDisplay', x, y) },
      ]
    };
    const sequencerCat = {
      id: 'sequencer', label: 'Sequencer', items: [
        { key: 'patternDisplay', label: 'Pattern Display', create: (x, y) => addWidgetOfType('patternDisplay', x, y) },
        { key: 'stepEditor', label: 'Step Editor', create: (x, y) => addWidgetOfType('stepEditor', x, y) },
        { key: 'transportControls', label: 'Transport Controls', create: (x, y) => addWidgetOfType('transportControls', x, y) },
        { key: 'pianoRoll', label: 'Piano Roll', create: (x, y) => addWidgetOfType('pianoRoll', x, y) },
      ]
    };
    const templatesCat = {
      id: 'templates',
      label: 'Templates',
      items: Object.entries(TEMPLATES).map(([key, template]) => ({
        key,
        label: template.label,
        description: template.description,
        create: () => loadTemplateById(key)
      }))
    };
    return [
      templatesCat,
      ...(suggestedCat ? [suggestedCat] : []),
      favoritesCat, recentsCat, popularCat, controlsCat, interactionCat, sequencerCat, displaysCat, decorativeCat, staticCat
    ];
  }, [favorites, usageCounts, recentTypes]);
  

  // Quick focus for library search ('/') when on Components tab
  useEffect(() => {
    const handler = (e) => {
      if (activeTab !== 'components') return;
      const tag = (e.target?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.key === '/') {
        libSearchRef.current?.focus?.();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab]);

  // Keyboard navigation for Components library: arrows navigate, Enter adds
  useEffect(() => {
    const handler = (e) => {
      if (activeTab !== 'components') return;
      const tag = (e.target?.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      const key = e.key;
      if (!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Enter','Home','End'].includes(key)) return;
      e.preventDefault();
      const layout = LIBRARY.map((cat) => ({ id: cat.id, items: maybeSort(filterItems(cat.items)), open: !!(pinnedCats[cat.id] || openCats[cat.id]) }));
      const flat = [];
      for (const cat of layout) {
        if (!cat.open) continue;
        cat.items.forEach((it, idx) => flat.push({ catId: cat.id, idx, item: it }));
      }
      if (flat.length === 0) return;
      let pos = flat.findIndex((f) => f.catId === libFocus.catId && f.idx === libFocus.idx);
      if (pos < 0) pos = 0;
      if (key === 'ArrowDown' || key === 'ArrowRight') pos = Math.min(flat.length - 1, pos + 1);
      if (key === 'ArrowUp' || key === 'ArrowLeft') pos = Math.max(0, pos - 1);
      if (key === 'Home') pos = 0;
      if (key === 'End') pos = flat.length - 1;
      if (key === 'Enter') {
        const cur = flat[pos];
        cur?.item?.create?.();
        return;
      }
      const cur = flat[pos];
      setLibFocus({ catId: cur.catId, idx: cur.idx });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeTab, LIBRARY, openCats, pinnedCats, libFocus, sortAZ, libraryQuery]);

  // Normalize to array with an order for layers
  useEffect(() => {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      let bindings = ui.bindings;
      let order = ui.bindingOrder;
      if (Array.isArray(bindings)) {
        order = Array.isArray(order) ? order : (bindings.map((b) => b.id));
      } else {
        const arr = Object.values(bindings || {}).map((b) => ({ ...b }));
        order = arr.map((b) => b.id);
        bindings = arr;
      }
      return { ...m, ui: { ...ui, bindings, bindingOrder: order } };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape to deselect all
      if (e.key === 'Escape' && selectedIds.length > 0) {
        setSelectedIds([]);
        e.preventDefault();
      }
      // Spacebar for pan mode
      if (e.code === 'Space' && !e.repeat && !canvasPanning && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        setCanvasPanning(true);
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.code === 'Space' && canvasPanning) {
        setCanvasPanning(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, canvasPanning]);

  // Robust normalization during render to avoid crashes before effect runs
  const rawBindings = manifest?.ui?.bindings;
  const bindings = Array.isArray(rawBindings) ? rawBindings : Object.values(rawBindings || {});
  const rawOrder = manifest?.ui?.bindingOrder;
  const order = Array.isArray(rawOrder) ? rawOrder : bindings.map((b) => b.id);
  const orderedWidgets = React.useMemo(() => {
    const map = new Map(bindings.map((b) => [b.id, b]));
    return order.map((id) => map.get(id)).filter(Boolean);
  }, [bindings, order]);

  // Layering helpers: move selected widget(s) in bindingOrder
  function bringToFront() {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const bindingOrder = [...(ui.bindingOrder || bindings.map(b => b.id))];
      const ids = selectedIds.slice();
      // Remove selected ids, then append at end (front)
      const filtered = bindingOrder.filter(id => !ids.includes(id));
      const nextOrder = [...filtered, ...ids];
      return { ...m, ui: { ...ui, bindingOrder: nextOrder } };
    });
  }

  function sendToBack() {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const bindingOrder = [...(ui.bindingOrder || bindings.map(b => b.id))];
      const ids = selectedIds.slice();
      // Remove selected ids, then prepend (back)
      const filtered = bindingOrder.filter(id => !ids.includes(id));
      const nextOrder = [...ids, ...filtered];
      return { ...m, ui: { ...ui, bindingOrder: nextOrder } };
    });
  }

  // Engine binding application helper
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
        case 'delayTime': {
          const fx = { ...(next.engine.fx || {}) };
          const delay = { ...(fx.delay || {}), time: value };
          next.engine.fx = { ...fx, delay };
          engine?.setDelay?.({ time: value });
          break;
        }
        case 'delayFeedback': {
          const fx = { ...(next.engine.fx || {}) };
          const delay = { ...(fx.delay || {}), feedback: value };
          next.engine.fx = { ...fx, delay };
          engine?.setDelay?.({ feedback: value });
          break;
        }
        case 'delayMix': {
          const fx = { ...(next.engine.fx || {}) };
          const delay = { ...(fx.delay || {}), mix: value };
          next.engine.fx = { ...fx, delay };
          engine?.setDelay?.({ mix: value });
          break;
        }
        case 'reverbMix': {
          const fx = { ...(next.engine.fx || {}) };
          const reverb = { ...(fx.reverb || {}), mix: value };
          next.engine.fx = { ...fx, reverb };
          engine?.setReverbMix?.(value);
          break;
        }
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
      // New synth bindings wiring
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
  }

  // Generic add-by-type to support drag-to-canvas placement
  function addWidgetOfType(type, x = 24, y = 24) {
    let w = null;
    switch (type) {
      case 'slider':
        w = {
          id: randomId(),
          type: 'slider',
          label: 'Slider',
          // Unbound by default; neutral UI-only value
          min: 0, max: 1, step: 0.01, value: 0.5,
          x, y, w: 220, h: 72, visible: true, locked: false,
        };
        break;
      case 'knob':
        w = {
          id: randomId(),
          type: 'knob',
          label: 'Knob',
          // Unbound by default; generic range
          min: 0, max: 1, step: 0.01, value: 0.5,
          x, y, w: 160, h: 130, visible: true, locked: false,
        };
        break;
      case 'toggle':
        w = {
          id: randomId(),
          type: 'toggle',
          label: 'Toggle',
          // Unbound by default
          checked: false,
          x, y, w: 220, h: 72, visible: true, locked: false,
        };
        break;
      case 'fader':
        w = {
          id: randomId(),
          type: 'fader',
          label: 'Fader',
          // Unbound by default; neutral UI-only value
          min: 0, max: 1, step: 0.01, value: 0.5,
          x, y, w: 72, h: 180, visible: true, locked: false,
        };
        break;
      case 'button':
        w = {
          id: randomId(),
          type: 'button',
          label: 'Button',
          // Unbound by default
          pressed: false,
          x, y, w: 120, h: 48, visible: true, locked: false,
        };
        break;
      case 'select':
        w = {
          id: randomId(),
          type: 'select',
          label: 'Select',
          // Unbound by default; choices appear after binding is chosen
          choices: [],
          value: '',
          x, y, w: 220, h: 72, visible: true, locked: false,
        };
        break;
      case 'xy':
        w = {
          id: randomId(),
          type: 'xy',
          label: 'XY Pad',
          // Unbound by default
          minX: 0, maxX: 1, minY: 0, maxY: 1, valueX: 0.5, valueY: 0.5,
          x, y, w: 240, h: 220, visible: true, locked: false,
        };
        break;
      case 'meter':
        w = {
          id: randomId(),
          type: 'meter',
          label: 'Output',
          x, y, w: 240, h: 72, visible: true, locked: false,
        };
        break;
      case 'label':
        w = {
          id: randomId(),
          type: 'label',
          label: 'Label',
          x, y, w: 160, h: 40, visible: true, locked: false,
        };
        break;
      case 'image':
        w = {
          id: randomId(),
          type: 'image',
          label: 'Image',
          src: 'https://via.placeholder.com/240x120?text=Image',
          fit: 'cover',
          radius: 8,
          x, y, w: 240, h: 120, visible: true, locked: false,
        };
        break;
      case 'logo':
        w = {
          id: randomId(),
          type: 'logo',
          label: 'Logo',
          src: 'https://via.placeholder.com/160x80?text=Logo',
          fit: 'contain',
          radius: 0,
          x, y, w: 160, h: 80, visible: true, locked: false,
        };
        break;
      case 'keyboard':
        w = {
          id: randomId(),
          type: 'keyboard',
          label: 'Keyboard',
          startMidi: 48,
          endMidi: 72,
          x, y, w: 420, h: 160, visible: true, locked: false,
        };
        break;
      case 'spectrum':
        w = {
          id: randomId(),
          type: 'spectrum',
          label: 'Spectrum',
          x, y, w: 240, h: 120, visible: true, locked: false,
        };
        break;
      case 'divider':
        w = {
          id: randomId(),
          type: 'divider',
          label: 'Divider',
          x, y, w: 240, h: 2, visible: true, locked: false,
        };
        break;
      case 'stateDisplay':
        w = {
          id: randomId(),
          type: 'stateDisplay',
          label: 'State Display',
          stateBinding: 'state.selectedInstrument',
          x, y, w: 200, h: 40, visible: true, locked: false,
        };
        break;
      case 'patternDisplay':
        w = {
          id: randomId(),
          type: 'patternDisplay',
          label: 'Pattern Display',
          config: { trackIndex: 0, stepCount: 16, cellSize: 20, showLabels: true },
          x, y, w: 400, h: 80, visible: true, locked: false,
        };
        break;
      case 'stepEditor':
        w = {
          id: randomId(),
          type: 'stepEditor',
          label: 'Step Editor',
          config: { trackIndex: 0, stepCount: 16, cellSize: 24, showVelocity: true, editable: true },
          x, y, w: 500, h: 80, visible: true, locked: false,
        };
        break;
      case 'transportControls':
        w = {
          id: randomId(),
          type: 'transportControls',
          label: 'Transport',
          config: { showTempo: true, showSwing: false, minTempo: 60, maxTempo: 240 },
          x, y, w: 400, h: 80, visible: true, locked: false,
        };
        break;
      case 'pianoRoll':
        w = {
          id: randomId(),
          type: 'pianoRoll',
          label: 'Piano Roll',
          config: { trackIndex: 0, showPianoKeys: true, noteRange: { min: 48, max: 72 }, stepCount: 16 },
          x, y, w: 500, h: 300, visible: true, locked: false,
        };
        break;
      default:
        return;
    }
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextBindings = [...(ui.bindings || []), w];
      const nextOrder = [...(ui.bindingOrder || []), w.id];
      const counts = { ...(ui.usageCounts || {}) };
      counts[type] = (counts[type] || 0) + 1;
      const rec = [type, ...(ui.recentTypes || []).filter((t) => t !== type)];
      if (rec.length > 8) rec.length = 8;
      return { ...m, ui: { ...ui, bindings: nextBindings, bindingOrder: nextOrder, usageCounts: counts, recentTypes: rec } };
    });
  }

  function toggleFavorite(key) {
    setFavorites((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function LibraryPreview({ type }) {
    switch (type) {
      case 'slider':
        return (<div className="preview-box"><div className="preview-slider" style={{ width: '100%' }} /></div>);
      case 'knob':
        return (<div className="preview-box"><div className="preview-knob" /></div>);
      case 'toggle':
        return (<div className="preview-box"><div className="preview-toggle" /></div>);
      case 'xy':
        return (<div className="preview-box"><div className="preview-xy" /></div>);
      case 'meter':
        return (<div className="preview-box"><div className="preview-meter" /></div>);
      case 'spectrum':
        return (<div className="preview-box"><div className="preview-spectrum" /></div>);
      case 'select':
        return (<div className="preview-box"><div className="preview-select" /></div>);
      case 'fader':
        return (<div className="preview-box"><div className="preview-fader" /></div>);
      case 'button':
        return (<div className="preview-box"><div className="preview-button" /></div>);
      case 'label':
        return (<div className="preview-box"><div className="preview-label">Aa</div></div>);
      case 'image':
        return (<div className="preview-box"><div className="preview-image" /></div>);
      case 'logo':
        return (<div className="preview-box"><div className="preview-image" /></div>);
      case 'divider':
        return (<div className="preview-box"><div className="preview-divider" /></div>);
      case 'stateDisplay':
        return (<div className="preview-box"><div className="preview-label" style={{ fontSize: 9 }}>◇</div></div>);
      case 'patternDisplay':
        return (<div className="preview-box"><div className="preview-label" style={{ fontSize: 9 }}>▭▭▭▭</div></div>);
      case 'stepEditor':
        return (<div className="preview-box"><div className="preview-label" style={{ fontSize: 9 }}>▣▣▣▣</div></div>);
      case 'transportControls':
        return (<div className="preview-box"><div className="preview-label" style={{ fontSize: 12 }}>▶</div></div>);
      case 'pianoRoll':
        return (<div className="preview-box"><div className="preview-label" style={{ fontSize: 9 }}>♫♪</div></div>);
      default:
        return null;
    }
  }


  const query = libraryQuery.trim().toLowerCase();
  function filterItems(items) {
    if (!query) return items;
    return items.filter((it) => it.label.toLowerCase().includes(query) || it.key.includes(query));
  }
  function maybeSort(items) {
    if (!sortAZ) return items;
    return [...items].sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }

  // Add widgets
  function addSlider() {
    const w = {
      id: randomId(),
      type: 'slider',
      label: 'Slider',
      min: 0, max: 1, step: 0.01, value: 0.5,
      x: 24, y: 24, w: 220, h: 72, visible: true, locked: false,
    };
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextBindings = [...(ui.bindings || []), w];
      const nextOrder = [...(ui.bindingOrder || []), w.id];
      return { ...m, ui: { ...ui, bindings: nextBindings, bindingOrder: nextOrder } };
    });
  }

  function addKnob() {
    const w = {
      id: randomId(),
      type: 'knob',
      label: 'Knob',
      min: 0, max: 1, step: 0.01, value: 0.5,
      x: 24, y: 120, w: 160, h: 130, visible: true, locked: false,
    };
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextBindings = [...(ui.bindings || []), w];
      const nextOrder = [...(ui.bindingOrder || []), w.id];
      return { ...m, ui: { ...ui, bindings: nextBindings, bindingOrder: nextOrder } };
    });
  }

  function addToggle() {
    const w = {
      id: randomId(),
      type: 'toggle',
      label: 'Toggle',
      checked: false,
      x: 24, y: 270, w: 220, h: 72, visible: true, locked: false,
    };
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextBindings = [...(ui.bindings || []), w];
      const nextOrder = [...(ui.bindingOrder || []), w.id];
      return { ...m, ui: { ...ui, bindings: nextBindings, bindingOrder: nextOrder } };
    });
  }

  function addXYPad() {
    const w = {
      id: randomId(),
      type: 'xy',
      label: 'XY Pad',
      minX: 0, maxX: 1, minY: 0, maxY: 1, valueX: 0.5, valueY: 0.5,
      x: 280, y: 24, w: 240, h: 220, visible: true, locked: false,
    };
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextBindings = [...(ui.bindings || []), w];
      const nextOrder = [...(ui.bindingOrder || []), w.id];
      return { ...m, ui: { ...ui, bindings: nextBindings, bindingOrder: nextOrder } };
    });
  }

  function addMeter() {
    const w = {
      id: randomId(),
      type: 'meter',
      label: 'Output',
      x: 280, y: 260, w: 240, h: 72, visible: true, locked: false,
    };
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextBindings = [...(ui.bindings || []), w];
      const nextOrder = [...(ui.bindingOrder || []), w.id];
      return { ...m, ui: { ...ui, bindings: nextBindings, bindingOrder: nextOrder } };
    });
  }

  function addSelect() {
    const w = {
      id: randomId(),
      type: 'select',
      label: 'Select',
      choices: [],
      value: '',
      x: 560, y: 24, w: 220, h: 72, visible: true, locked: false,
    };
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextBindings = [...(ui.bindings || []), w];
      const nextOrder = [...(ui.bindingOrder || []), w.id];
      return { ...m, ui: { ...ui, bindings: nextBindings, bindingOrder: nextOrder } };
    });
  }

  // Load a template from the templates library
  function loadTemplateById(templateId) {
    try {
      const templateData = loadTemplate(templateId, manifest);
      setManifest((m) => {
        const ui = { ...(m.ui || {}) };
        return {
          ...m,
          ui: {
            ...ui,
            bindings: templateData.widgets,
            bindingOrder: templateData.widgets.map((w) => w.id),
            canvas: templateData.canvas,
            presetName: templateData.presetName,
            template: templateId,
            usageCounts: ui.usageCounts || {},
            recentTypes: ui.recentTypes || []
          }
        };
      });
      setSelectedIds([]);
    } catch (error) {
      console.error('Failed to load template:', error);
      alert('Failed to load template: ' + error.message);
    }
  }

  // Load the single modern template on demand
  function addModernStandaloneTemplate() {
    loadTemplateById('modern-standalone');
  }

  // Reset canvas to empty
  function resetCanvas() {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      return { ...m, ui: { ...ui, bindings: [], bindingOrder: [], template: undefined } };
    });
    setSelectedIds([]);
  }


  function setWidgetValue(w, value) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const list = (ui.bindings || []).map((b) => (b.id === w.id ? { ...b, value } : b));
      let next = { ...m, ui: { ...ui, bindings: list } };
      next = applyBinding(next, w.binding, value);
      return next;
    });
  }

  function setToggleValue(w, checked) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const list = (ui.bindings || []).map((b) => (b.id === w.id ? { ...b, checked } : b));
      let next = { ...m, ui: { ...ui, bindings: list } };
      next = applyBinding(next, w.binding, checked);
      return next;
    });
  }

  function setSelectValue(w, value) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const list = (ui.bindings || []).map((b) => (b.id === w.id ? { ...b, value } : b));
      let next = { ...m, ui: { ...ui, bindings: list } };
      next = applyBinding(next, w.binding, value);
      return next;
    });
  }

  function setButtonPressed(w, pressed) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const list = (ui.bindings || []).map((b) => (b.id === w.id ? { ...b, pressed: !!pressed } : b));
      let next = { ...m, ui: { ...ui, bindings: list } };
      next = applyBinding(next, w.binding, !!pressed);
      return next;
    });
  }

  function setXYValue(w, xVal, yVal) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const list = (ui.bindings || []).map((b) => (b.id === w.id ? { ...b, valueX: xVal, valueY: yVal } : b));
      let next = { ...m, ui: { ...ui, bindings: list } };
      next = applyBinding(next, w.bindingX, xVal);
      next = applyBinding(next, w.bindingY, yVal);
      return next;
    });
  }

  function updateWidget(id, updates) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const list = (ui.bindings || []).map((b) => (b.id === id ? { ...b, ...updates } : b));
      return { ...m, ui: { ...ui, bindings: list, bindingOrder: ui.bindingOrder || list.map((b) => b.id) } };
    });
  }

  // Begin corner resize with aspect ratio lock
  function beginResize(e, w, corner) {
    if (w.locked) return;
    try { e.preventDefault(); e.stopPropagation(); } catch {}
    const startX = e.clientX; const startY = e.clientY;
    const orig = { x: Number(w.x || 0), y: Number(w.y || 0), w: Number(w.w || 1), h: Number(w.h || 1) };
    const ratio = Math.max(0.0001, orig.h / orig.w);
    let canvasEl = null; let rect = null;
    try { canvasEl = e.currentTarget.closest('.canvas'); rect = canvasEl?.getBoundingClientRect(); } catch {}
    const minW = 40; const minH = 24;

    const onMove = (ev) => {
      const dx = (ev.clientX - startX) / zoom; // Account for zoom
      const dy = (ev.clientY - startY) / zoom; // Account for zoom
      let newW = orig.w; let newH = orig.h; let newX = orig.x; let newY = orig.y;

      if (corner === 'se') { 
        newW = Math.max(minW, orig.w + dx); 
        newH = Math.max(minH, orig.h + dy);  // Free resize, not locked to ratio
      }
      if (corner === 'ne') { 
        newW = Math.max(minW, orig.w + dx); 
        newH = Math.max(minH, orig.h - dy); 
        newY = orig.y + orig.h - newH;
      }
      if (corner === 'sw') { 
        newW = Math.max(minW, orig.w - dx); 
        newH = Math.max(minH, orig.h + dy); 
        newX = orig.x + orig.w - newW;
      }
      if (corner === 'nw') { 
        newW = Math.max(minW, orig.w - dx); 
        newH = Math.max(minH, orig.h - dy); 
        newX = orig.x + orig.w - newW; 
        newY = orig.y + orig.h - newH;
      }

      if (canvas?.snap || snapToGrid) { 
        const g = Number(canvas?.gridSize ?? 20); 
        newW = Math.round(newW / g) * g; 
        newH = Math.round(newH / g) * g; 
        newX = Math.round(newX / g) * g; 
        newY = Math.round(newY / g) * g; 
      }
      
      // Clamp to canvas bounds (accounting for zoom)
      if (rect) {
        const canvasW = rect.width / zoom;
        const canvasH = rect.height / zoom;
        newX = Math.max(0, Math.min(newX, canvasW - minW));
        newY = Math.max(0, Math.min(newY, canvasH - minH));
        newW = Math.max(minW, Math.min(newW, canvasW - newX));
        newH = Math.max(minH, Math.min(newH, canvasH - newY));
      }

      updateWidget(w.id, { x: newX, y: newY, w: newW, h: newH });
    };
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function reorderWidgets(dragId, targetId) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const ord = [...(ui.bindingOrder || [])];
      const di = ord.indexOf(dragId);
      const ti = ord.indexOf(targetId);
      if (di === -1 || ti === -1) return m;
      ord.splice(di, 1);
      ord.splice(ti, 0, dragId);
      return { ...m, ui: { ...ui, bindingOrder: ord } };
    });
  }

  function updateCanvas(updates) {
    setManifest((m) => {
      const ui = { ...(m.ui || {}) };
      const nextCanvas = { ...(ui.canvas || {}), ...updates };
      return { ...m, ui: { ...ui, canvas: nextCanvas } };
    });
  }

  // Preset save/load to localStorage using current presetName
  function savePreset() {
    try {
      const key = `design.preset.${presetName || 'Untitled'}`;
      localStorage.setItem(key, JSON.stringify(manifest));
    } catch (e) {
      console.warn('Failed to save preset:', e);
    }
  }
  function loadPreset() {
    try {
      const key = `design.preset.${presetName || 'Untitled'}`;
      const raw = localStorage.getItem(key);
      if (!raw) {
        alert('No preset saved for this name');
        return;
      }
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;
      setManifest(data);
    } catch (e) {
      console.warn('Failed to load preset:', e);
    }
  }

  // Explicitly load the last autosaved session (if any). This does not run on startup.
  function loadLastSession() {
    try {
      const raw = localStorage.getItem('instrument_manifest');
      if (!raw) {
        alert('No previous session found');
        return;
      }
      const data = JSON.parse(raw);
      if (data && typeof data === 'object') {
        setManifest(data);
      }
    } catch (e) {
      console.warn('Failed to load last session:', e);
      alert('Failed to load last session');
    }
  }

  // Clear persisted manifest to avoid loading stale UI on refresh
  function clearSavedDesign() {
    try { localStorage.removeItem('instrument_manifest'); } catch {}
    // Also clear current canvas state to reflect immediately
    setManifest((m) => ({ ...m, ui: { ...(m.ui || {}), bindings: [], bindingOrder: [], template: null } }));
    setSelectedIds([]);
  }

  // Phase 3: Canvas improvement functions
  function copySelectedWidgets() {
    const selected = orderedWidgets.filter(w => selectedIds.includes(w.id));
    if (selected.length > 0) {
      setClipboard(selected.map(w => ({ ...w })));
    }
  }

  function pasteWidgets() {
    if (clipboard.length === 0) return;
    const newWidgets = clipboard.map(w => ({
      ...w,
      id: randomId(),
      x: (w.x || 0) + 20,
      y: (w.y || 0) + 20,
      label: (w.label || w.type) + ' (Copy)'
    }));
    
    setManifest(m => {
      const ui = { ...(m.ui || {}) };
      const bindings = [...(ui.bindings || []), ...newWidgets];
      const bindingOrder = [...(ui.bindingOrder || []), ...newWidgets.map(w => w.id)];
      return { ...m, ui: { ...ui, bindings, bindingOrder } };
    });
    
    // Select the newly pasted widgets
    setSelectedIds(newWidgets.map(w => w.id));
  }

  function deleteSelectedWidgets() {
    if (selectedIds.length === 0) return;
    setManifest(m => {
      const ui = { ...(m.ui || {}) };
      const bindings = (ui.bindings || []).filter(w => !selectedIds.includes(w.id));
      const bindingOrder = (ui.bindingOrder || []).filter(id => !selectedIds.includes(id));
      return { ...m, ui: { ...ui, bindings, bindingOrder } };
    });
    setSelectedIds([]);
  }

  function duplicateSelectedWidgets() {
    copySelectedWidgets();
    pasteWidgets();
  }

  function alignWidgets(alignment) {
    if (selectedIds.length < 2) return;
    const selected = orderedWidgets.filter(w => selectedIds.includes(w.id));
    
    setManifest(m => {
      const ui = { ...(m.ui || {}) };
      let bindings = [...(ui.bindings || [])];
      
      if (alignment === 'left') {
        const minX = Math.min(...selected.map(w => w.x || 0));
        bindings = bindings.map(w => selectedIds.includes(w.id) ? { ...w, x: minX } : w);
      } else if (alignment === 'right') {
        const maxX = Math.max(...selected.map(w => (w.x || 0) + (w.w || 100)));
        bindings = bindings.map(w => selectedIds.includes(w.id) ? { ...w, x: maxX - (w.w || 100) } : w);
      } else if (alignment === 'top') {
        const minY = Math.min(...selected.map(w => w.y || 0));
        bindings = bindings.map(w => selectedIds.includes(w.id) ? { ...w, y: minY } : w);
      } else if (alignment === 'bottom') {
        const maxY = Math.max(...selected.map(w => (w.y || 0) + (w.h || 40)));
        bindings = bindings.map(w => selectedIds.includes(w.id) ? { ...w, y: maxY - (w.h || 40) } : w);
      } else if (alignment === 'center-h') {
        const avgX = selected.reduce((sum, w) => sum + (w.x || 0) + (w.w || 100) / 2, 0) / selected.length;
        bindings = bindings.map(w => selectedIds.includes(w.id) ? { ...w, x: avgX - (w.w || 100) / 2 } : w);
      } else if (alignment === 'center-v') {
        const avgY = selected.reduce((sum, w) => sum + (w.y || 0) + (w.h || 40) / 2, 0) / selected.length;
        bindings = bindings.map(w => selectedIds.includes(w.id) ? { ...w, y: avgY - (w.h || 40) / 2 } : w);
      }
      
      return { ...m, ui: { ...ui, bindings } };
    });
  }

  // Phase 5: Export handler
  async function handleExport(format = 'json') {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const exportData = {
        version: '1.0.0',
        name: presetName || 'Untitled',
        timestamp: new Date().toISOString(),
        manifest: manifest,
        format: format
      };
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${presetName || 'design'}-${format}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setShowExportPreview(false);
      setIsExporting(false);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
    }
  }

  // Export: Generate a HISE interface script from the current UI
  function generateHiseScript(currentManifest) {
    const ui = currentManifest?.ui || currentManifest;
    const canvas = ui?.canvas || {};
    const widgets = ui?.widgets || [];

    const esc = (s = '') => String(s).replace(/"/g, '\\"');
    const idFrom = (base, i) => (base || 'Ctrl') + '_' + (i + 1);

    const lines = [];
    lines.push('// Auto-generated HISE Interface by AI VST Sample Designer');
    lines.push('// Date: ' + new Date().toISOString());
    lines.push('');
    lines.push('// Set interface size');
    if (canvas.width && canvas.height) {
      lines.push('Content.setWidth(' + Number(canvas.width) + ');');
      lines.push('Content.setHeight(' + Number(canvas.height) + ');');
    }
    lines.push('');
    lines.push('// Create controls');
    widgets.forEach((w, i) => {
      const x = Math.round(Number(w.x || 0));
      const y = Math.round(Number(w.y || 0));
      const wW = Math.round(Number(w.w || 80));
      const wH = Math.round(Number(w.h || 24));
      const name = idFrom(w.label || w.type, i).replace(/[^A-Za-z0-9_]/g, '_');
      const label = esc(w.label || w.type || 'Control');
      const min = (w.min !== undefined) ? Number(w.min) : 0;
      const max = (w.max !== undefined) ? Number(w.max) : 1;
      const step = (w.step !== undefined) ? Number(w.step) : 0.01;
      const value = (w.value !== undefined) ? Number(w.value) : min;

      switch (w.type) {
        case 'knob':
          lines.push('const var ' + name + ' = Content.addKnob("' + label + '", ' + x + ', ' + y + ');');
          lines.push(name + '.setRange(' + min + ', ' + max + ', ' + step + ');');
          lines.push(name + '.setValue(' + value + ');');
          lines.push(name + '.setPosition(' + x + ', ' + y + ', ' + wW + ', ' + wH + ');');
          break;
        case 'fader':
          lines.push('const var ' + name + " = Content.addSlider(\"" + label + "\", " + x + ", " + y + ");");
          lines.push(name + '.setRange(' + min + ', ' + max + ', ' + step + ');');
          lines.push(name + '.setValue(' + value + ');');
          lines.push(name + '.set("style", "LinearVertical");');
          lines.push(name + '.setPosition(' + x + ', ' + y + ', ' + wW + ', ' + wH + ');');
          break;
        case 'toggle':
          lines.push('const var ' + name + ' = Content.addButton("' + label + '", ' + x + ', ' + y + ');');
          lines.push(name + '.setValue(' + (w.checked ? 1 : 0) + ');');
          lines.push(name + '.setPosition(' + x + ', ' + y + ', ' + wW + ', ' + wH + ');');
          break;
        case 'label':
          lines.push('const var ' + name + ' = Content.addLabel("' + label + '", ' + x + ', ' + y + ');');
          if (w.fontSize) lines.push(name + '.set("fontSize", ' + Number(w.fontSize) + ');');
          if (w.fontWeight && (""+w.fontWeight).toLowerCase().includes('bold')) lines.push(name + '.set("bold", true);');
          lines.push(name + '.setPosition(' + x + ', ' + y + ', ' + wW + ', ' + wH + ');');
          break;
        case 'select':
          lines.push('const var ' + name + ' = Content.addComboBox("' + label + '", ' + x + ', ' + y + ');');
          lines.push(name + '.setPosition(' + x + ', ' + y + ', ' + wW + ', ' + wH + ');');
          break;
        case 'keyboard':
          lines.push('const var ' + name + ' = Content.addMidiKeyboard("' + label + '", ' + x + ', ' + y + ');');
          lines.push(name + '.setPosition(' + x + ', ' + y + ', ' + wW + ', ' + wH + ');');
          break;
        default:
          // Skip decorative or unsupported controls in HISE (screw, grill, spectrum, etc.)
          break;
      }
    });
    lines.push('');
    lines.push('// TODO: Bind controls to parameters & samples after importing in HISE');
    return lines.join('\n');
  }

  async function handleExportForHise() {
    try {
      const uiOnly = manifest?.ui || manifest;

      // 1) Export HISE-ready manifest JSON (UI only)
      const blob1 = new Blob([JSON.stringify(uiOnly, null, 2)], { type: 'application/json' });
      const url1 = URL.createObjectURL(blob1);
      const a1 = document.createElement('a');
      a1.href = url1;
      a1.download = `${presetName || 'design'}-hise-manifest.json`;
      document.body.appendChild(a1);
      a1.click();
      document.body.removeChild(a1);
      URL.revokeObjectURL(url1);

      // 2) Export auto-generated HISE interface script
      const script = generateHiseScript(manifest);
      const blob2 = new Blob([script], { type: 'text/plain' });
      const url2 = URL.createObjectURL(blob2);
      const a2 = document.createElement('a');
      a2.href = url2;
      a2.download = `${presetName || 'design'}-hise-interface.js`;
      document.body.appendChild(a2);
      a2.click();
      document.body.removeChild(a2);
      URL.revokeObjectURL(url2);
    } catch (err) {
      console.error('HISE export failed:', err);
      alert('HISE export failed. Check console for details.');
    }
  }

  // Phase 4: Widget presets for quick application
  const WIDGET_PRESETS = {
    slider: {
      'Volume Control': { min: 0, max: 1, step: 0.01, value: 0.8, label: 'Volume', binding: 'masterGain' },
      'Filter Cutoff': { min: 20, max: 20000, step: 1, value: 5000, label: 'Cutoff', binding: 'filterCutoff' },
      'Pan Control': { min: -1, max: 1, step: 0.01, value: 0, label: 'Pan' },
    },
    knob: {
      'Resonance': { min: 0, max: 20, step: 0.1, value: 1, label: 'Resonance', binding: 'filterQ' },
      'Attack': { min: 0, max: 2, step: 0.001, value: 0.01, label: 'Attack', binding: 'envelopeAttack' },
      'Release': { min: 0, max: 4, step: 0.001, value: 0.5, label: 'Release', binding: 'envelopeRelease' },
      'Brass Cap': { color: '#b8860b', label: 'Brass Knob', fontWeight: '700', fontSize: 14 },
      'Cream Knob': { color: '#f5f5dc', label: 'Cream Knob', fontWeight: '700', fontSize: 14 },
    },
    fader: {
      'Channel Fader': { min: 0, max: 1, step: 0.01, value: 0.85, label: 'Level' },
      'Send Amount': { min: 0, max: 1, step: 0.01, value: 0, label: 'Send' },
      'Brass Fader': { color: '#b8860b', label: 'Brass Fader', fontWeight: '700', fontSize: 14 },
      'Cream Fader': { color: '#f5f5dc', label: 'Cream Fader', fontWeight: '700', fontSize: 14 },
    },
    toggle: {
      'Power Switch': { checked: true, label: 'Power' },
      'Mute': { checked: false, label: 'Mute' },
      'Solo': { checked: false, label: 'Solo' },
    },
  };

  function applyPresetToWidget(widgetId, presetName) {
    const widget = orderedWidgets.find(w => w.id === widgetId);
    if (!widget) return;
    
    const preset = WIDGET_PRESETS[widget.type]?.[presetName];
    if (!preset) return;
    
    updateWidget(widgetId, { ...preset });
  }

  function toggleSection(sectionId) {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }

  // Phase 5: Undo/Redo system
  function saveToHistory() {
    const snapshot = JSON.stringify(manifest);
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(snapshot);
      // Limit to 50 history states
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }

  function undo() {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snapshot = history[newIndex];
    if (snapshot) {
      setManifest(JSON.parse(snapshot));
      setHistoryIndex(newIndex);
    }
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    if (snapshot) {
      setManifest(JSON.parse(snapshot));
      setHistoryIndex(newIndex);
    }
  }

  // Save initial state to history
  useEffect(() => {
    if (history.length === 0) {
      saveToHistory();
    }
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;
      
      // Undo: Ctrl/Cmd + Z
      if (ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      else if (ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redo();
      }
      // Keyboard Shortcuts Panel: Ctrl/Cmd + /
      else if (ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowShortcutsPanel(prev => !prev);
      }
      // Copy: Ctrl/Cmd + C
      else if (ctrlKey && e.key === 'c') {
        e.preventDefault();
        copySelectedWidgets();
      }
      // Paste: Ctrl/Cmd + V
      else if (ctrlKey && e.key === 'v') {
        e.preventDefault();
        pasteWidgets();
      }
      // Duplicate: Ctrl/Cmd + D
      else if (ctrlKey && e.key === 'd') {
        e.preventDefault();
        duplicateSelectedWidgets();
      }
      // Delete: Delete or Backspace
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelectedWidgets();
        }
      }
      // Select All: Ctrl/Cmd + A
      else if (ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(orderedWidgets.map(w => w.id));
      }
      // Deselect: Escape
      else if (e.key === 'Escape') {
        setSelectedIds([]);
        setShowShortcutsPanel(false);
        setShowExportPreview(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, orderedWidgets, clipboard, historyIndex, history]);

  // Initialize engine from current UI widgets so features are active on load
  useEffect(() => {
    try {
      const list = manifest?.ui?.bindings || [];
      for (const w of list) {
        switch (w.type) {
          case 'slider':
          case 'knob':
          case 'fader':
            // Only apply if explicitly bound and value is defined
            if (w.binding && w.value !== undefined) applyBinding(manifest, w.binding, Number(w.value));
            break;
          case 'toggle':
            if (w.binding && w.checked !== undefined) applyBinding(manifest, w.binding, !!w.checked);
            break;
          case 'select':
            if (w.binding && w.value !== undefined && w.value !== '') applyBinding(manifest, w.binding, w.value);
            break;
          case 'button':
            if (w.binding && w.pressed !== undefined) applyBinding(manifest, w.binding, !!w.pressed);
            break;
          case 'xy':
            if (w.bindingX && w.valueX !== undefined) applyBinding(manifest, w.bindingX, Number(w.valueX));
            if (w.bindingY && w.valueY !== undefined) applyBinding(manifest, w.bindingY, Number(w.valueY));
            break;
          default:
            break;
        }
      }
    } catch {}
  }, [engine, manifest?.ui?.bindings]);

  const selected = orderedWidgets.find((w) => selectedIds.includes(w.id)) || null;

  const theme = manifest?.ui?.theme || {};
  const themeStyle = {
    '--accent': theme.accent || '#4fb6ff',
    '--accent-2': theme.primary || '#00eaff',
    '--bg': (manifest?.ui?.canvas?.bgColor || '#0b1220'),
  };

  return (
    <ErrorBoundary>
      <div className="design-page theme-dark" style={themeStyle}>
        <div className="design-grid">
          <div className="left-panel card compact">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 className="title" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Design</h2>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button 
              className="btn-icon" 
              style={{ fontSize: 14, opacity: historyIndex <= 0 ? 0.3 : 1 }} 
              title="Undo (Ctrl+Z)" 
              onClick={undo}
              disabled={historyIndex <= 0}
            >↶</button>
            <button 
              className="btn-icon" 
              style={{ fontSize: 14, opacity: historyIndex >= history.length - 1 ? 0.3 : 1 }} 
              title="Redo (Ctrl+Y)" 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >↷</button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <button 
              className="btn-icon" 
              style={{ fontSize: 14 }} 
              title="Keyboard Shortcuts (Ctrl+/)"
              onClick={() => setShowShortcutsPanel(true)}
            >⌨️</button>
            <button className="btn-icon" style={{ fontSize: 14 }} title="Help">❓</button>
          </div>
        </div>
        <div className="tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
          <TabButton active={activeTab === 'components'} onClick={() => setActiveTab('components')}><IconComponents style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Components</span></TabButton>
          <TabButton active={activeTab === 'layers'} onClick={() => setActiveTab('layers')}><IconLayers style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Layers</span></TabButton>
          <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')}><IconAssets style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Assets</span></TabButton>
          <TabButton active={activeTab === 'style'} onClick={() => setActiveTab('style')}><IconStyle style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Style</span></TabButton>
          <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}><IconAI style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">AI</span></TabButton>
          <TabButton active={activeTab === 'sequence'} onClick={() => setActiveTab('sequence')}><IconTab style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Sequence</span></TabButton>
        </div>
        {activeTab === 'components' && (
          <div className="panel-body" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <ComponentLibrary />
          </div>
        )}
        {activeTab === 'layers' && (
          <div className="panel-body">
            <ul className="list">
              {orderedWidgets.map((w) => (
                <li key={w.id} className="item" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', w.id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const did = e.dataTransfer.getData('text/plain'); reorderWidgets(did, w.id); }}>
                  <div className="label">
                    <input type="checkbox" checked={!!w.visible} onChange={(e) => updateWidget(w.id, { visible: !!e.target.checked })} />
                    <input type="checkbox" checked={!!w.locked} onChange={(e) => updateWidget(w.id, { locked: !!e.target.checked })} />
                    <button onClick={() => setSelectedIds([w.id])} className={selectedIds.includes(w.id) ? 'primary' : ''}>{w.label || w.type}</button>
                  </div>
                  <div className="row gap">
                    <button onClick={() => updateWidget(w.id, { x: 24, y: 24 })} className="secondary">Reset Pos</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {activeTab === 'assets' && (
          <div className="panel-body" style={{ height: 'calc(100% - 100px)', overflow: 'hidden' }}>
            <AssetManager
              currentAssets={manifest?.ui?.assets || []}
              onAssetSelect={(asset) => {
                // When an asset is selected, create an image widget with it
                if (asset.type === 'image') {
                  addWidgetOfType('image', 24, 24);
                  // Update the last widget with the selected image
                  setManifest((m) => {
                    const ui = { ...(m.ui || {}) };
                    const widgets = [...(ui.bindings || [])];
                    if (widgets.length > 0) {
                      const lastWidget = widgets[widgets.length - 1];
                      lastWidget.src = asset.url;
                      lastWidget.label = asset.name;
                    }
                    return { ...m, ui: { ...ui, bindings: widgets, assets: [...(ui.assets || []), asset] } };
                  });
                }
              }}
            />
          </div>
        )}
        {activeTab === 'sequence' && (
          <div className="panel-body">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Embedded Sequencer</strong>
              <div className="muted">Compact sequencer integrated with your design</div>
            </div>
            {/* Layering controls */}
            <div className="property-section">
              <div className="property-section-title">Layering</div>
              <div className="row gap">
                <button className="secondary" onClick={bringToFront} disabled={selectedIds.length === 0}>Bring to Front</button>
                <button className="secondary" onClick={sendToBack} disabled={selectedIds.length === 0}>Send to Back</button>
              </div>
            </div>
            <div className="space" />
          <div className="card compact pad-12">
              <Sequence engine={engine} />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'ai' && (
        <AIAssistantPanel onApplySuggestion={(widget) => {
          // Optionally scroll to newly added widget or select it
          if (widget && widget.id) {
            setSelectedId(widget.id);
          }
        }} />
      )}

      {activeTab === 'style' && (
        <div className="panel-body">
          <div className="row gap">
            <label className="label">Show Grid
              <input type="checkbox" checked={!!canvas.showGrid} onChange={(e) => updateCanvas({ showGrid: !!e.target.checked })} />
            </label>
            <label className="label">Grid Size
              <input type="number" step="1" min="4" value={Number(canvas.gridSize ?? 20)} onChange={(e) => updateCanvas({ gridSize: Number(e.target.value) })} />
            </label>
            <label className="label">Snap to Grid
              <input type="checkbox" checked={!!canvas.snap} onChange={(e) => updateCanvas({ snap: !!e.target.checked })} />
            </label>
            <label className="label">Show Labels
              <input type="checkbox" checked={!!canvas.showLabels} onChange={(e) => updateCanvas({ showLabels: !!e.target.checked })} />
            </label>
          </div>
          <div className="space" />
          <div className="row gap">
            <label className="label">Background Image
              <input type="file" accept="image/*" ref={bgInputRef} onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const url = URL.createObjectURL(f);
                  updateCanvas({ bgUrl: url, bgSize: 'cover', bgRepeat: 'no-repeat', bgPosition: 'center' });
                } catch {}
              }} />
            </label>
            <button className="secondary" onClick={() => {
              try { if (canvas.bgUrl?.startsWith?.('blob:')) URL.revokeObjectURL(canvas.bgUrl); } catch {}
              updateCanvas({ bgUrl: '', bgSize: '', bgRepeat: '', bgPosition: '' });
              if (bgInputRef.current) bgInputRef.current.value = '';
            }}>Clear</button>
          </div>

          {/* Background Presets */}
          <div className="property-section">
            <div className="property-section-header" onClick={() => toggleSection('bg-presets')}>
              <div className="property-section-title">Background Presets</div>
              <span className={`property-section-arrow ${!collapsedSections['bg-presets'] ? 'expanded' : ''}`}>▶</span>
            </div>
            <div className={`property-section-content ${!collapsedSections['bg-presets'] ? 'expanded' : 'collapsed'}`}>
              <div className="preset-grid">
                <button className="preset-button" onClick={() => updateCanvas({ bgUrl: generateWoodGrainDataUrl('walnut'), bgSize: '512px', bgRepeat: 'repeat', bgPosition: 'left top' })}>Walnut</button>
                <button className="preset-button" onClick={() => updateCanvas({ bgUrl: generateWoodGrainDataUrl('mahogany'), bgSize: '512px', bgRepeat: 'repeat', bgPosition: 'left top' })}>Mahogany</button>
                <button className="preset-button" onClick={() => updateCanvas({ bgUrl: generateWoodGrainDataUrl('maple'), bgSize: '512px', bgRepeat: 'repeat', bgPosition: 'left top' })}>Maple</button>
                <button className="preset-button" onClick={() => updateCanvas({ bgUrl: generateWoodGrainDataUrl('ebony'), bgSize: '512px', bgRepeat: 'repeat', bgPosition: 'left top' })}>Dark Ebony</button>
                <button className="preset-button" onClick={() => updateCanvas({ bgUrl: '', bgSize: '', bgRepeat: '', bgPosition: '' })}>Clear</button>
              </div>
            </div>
          </div>

          <div className="row gap">
            <label className="label">Texture Overlay
              <input type="file" accept="image/*" ref={texInputRef} onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  const url = URL.createObjectURL(f);
                  updateCanvas({ textureUrl: url, textureSize: 'cover', textureRepeat: 'no-repeat', texturePosition: 'center' });
                } catch {}
              }} />
            </label>
            <button className="secondary" onClick={() => {
              try { if (canvas.textureUrl?.startsWith?.('blob:')) URL.revokeObjectURL(canvas.textureUrl); } catch {}
              updateCanvas({ textureUrl: '', textureSize: '', textureRepeat: '', texturePosition: '' });
              if (texInputRef.current) texInputRef.current.value = '';
            }}>Clear</button>
          </div>
          <div className="row gap">
            <label className="label">Background Opacity
              <input type="number" min="0" max="1" step="0.05" value={typeof canvas.bgOpacity === 'number' ? canvas.bgOpacity : 1} onChange={(e) => updateCanvas({ bgOpacity: clamp(Number(e.target.value), 0, 1) })} />
            </label>
            <label className="label">Texture Opacity
              <input type="number" min="0" max="1" step="0.05" value={typeof canvas.textureOpacity === 'number' ? canvas.textureOpacity : 0.25} onChange={(e) => updateCanvas({ textureOpacity: clamp(Number(e.target.value), 0, 1) })} />
            </label>
          </div>

          {/* Theme Section */}
          <div className="property-section">
            <div className="property-section-header" onClick={() => toggleSection('theme-colors')}>
              <div className="property-section-title">Theme Colors</div>
              <span className={`property-section-arrow ${!collapsedSections['theme-colors'] ? 'expanded' : ''}`}>▶</span>
            </div>
            <div className={`property-section-content ${!collapsedSections['theme-colors'] ? 'expanded' : 'collapsed'}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label" style={{ marginBottom: 8 }}>Accent Color</label>
                  <HexColorPicker 
                    color={theme.accent || '#4fb6ff'} 
                    onChange={(color) => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { ...(m.ui?.theme || {}), accent: color } } }))}
                    style={{ width: '100%', height: 120 }}
                  />
                  <input 
                    type="text" 
                    value={theme.accent || '#4fb6ff'} 
                    onChange={(e) => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { ...(m.ui?.theme || {}), accent: e.target.value } } }))}
                    style={{ marginTop: 8, width: '100%', fontFamily: 'monospace' }}
                  />
                </div>
                <div>
                  <label className="label" style={{ marginBottom: 8 }}>Primary Color</label>
                  <HexColorPicker 
                    color={theme.primary || '#00eaff'} 
                    onChange={(color) => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { ...(m.ui?.theme || {}), primary: color } } }))}
                    style={{ width: '100%', height: 120 }}
                  />
                  <input 
                    type="text" 
                    value={theme.primary || '#00eaff'} 
                    onChange={(e) => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { ...(m.ui?.theme || {}), primary: e.target.value } } }))}
                    style={{ marginTop: 8, width: '100%', fontFamily: 'monospace' }}
                  />
                </div>
                <div className="preset-grid">
                  <button className="preset-button" onClick={() => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { accent: '#4fb6ff', primary: '#00eaff' } } }))}>Default Blue</button>
                  <button className="preset-button" onClick={() => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { accent: '#22c55e', primary: '#10b981' } } }))}>Green</button>
                  <button className="preset-button" onClick={() => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { accent: '#a855f7', primary: '#8b5cf6' } } }))}>Purple</button>
                  <button className="preset-button" onClick={() => setManifest(m => ({ ...m, ui: { ...m.ui, theme: { accent: '#f59e0b', primary: '#d97706' } } }))}>Amber</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="canvas card" role="region" aria-label="Design canvas" 
        onDragOver={(e) => e.preventDefault()} 
        onDrop={(e) => {
          const type = e.dataTransfer.getData('componenttype') || e.dataTransfer.getData('text/x-component') || e.dataTransfer.getData('text/plain');
          if (!type) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.round((e.clientX - rect.left) / zoom - 20);
          const y = Math.round((e.clientY - rect.top) / zoom - 20);
          addWidgetOfType(type, x, y);
        }}
        onMouseDown={(e) => {
          // Start marquee selection on empty canvas area
          if (e.target === e.currentTarget || e.target.classList.contains('canvas-content')) {
            const rect = e.currentTarget.getBoundingClientRect();
            const startX = (e.clientX - rect.left) / zoom;
            const startY = (e.clientY - rect.top) / zoom;
            setMarquee({ x: startX, y: startY, w: 0, h: 0 });
            
            const onMove = (ev) => {
              const x = (ev.clientX - rect.left) / zoom;
              const y = (ev.clientY - rect.top) / zoom;
              const w = x - startX;
              const h = y - startY;
              setMarquee({ x: Math.min(startX, x), y: Math.min(startY, y), w: Math.abs(w), h: Math.abs(h) });
              
              // Select widgets that intersect with marquee
              const intersecting = orderedWidgets.filter(widget => {
                const wx = widget.x || 0;
                const wy = widget.y || 0;
                const ww = widget.w || 100;
                const wh = widget.h || 40;
                const mx = Math.min(startX, x);
                const my = Math.min(startY, y);
                const mw = Math.abs(w);
                const mh = Math.abs(h);
                return !(wx + ww < mx || wx > mx + mw || wy + wh < my || wy > my + mh);
              }).map(w => w.id);
              setSelectedIds(intersecting);
            };
            
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
              setMarquee(null);
            };
            
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }
        }}
      >
        <div className="toolbar">
          <div className="group">
            <button className={`btn-icon ${transport.playing ? 'on' : ''}`} title="Play" onClick={() => setTransport((t) => ({ ...t, playing: !t.playing }))}>▶</button>
            <button className={`btn-icon ${transport.recording ? 'on' : ''}`} title="Record" onClick={() => setTransport((t) => ({ ...t, recording: !t.recording }))}>⏺</button>
            <button className="btn-icon" title="Stop" onClick={() => setTransport({ playing: false, recording: false })}>■</button>
          </div>
          <div className="group">
            <button className={`btn-icon ${snapToGrid ? 'on' : ''}`} title="Snap to Grid (G)" onClick={() => setSnapToGrid(!snapToGrid)}>⊞</button>
            <button className={`btn-icon ${showGrid ? 'on' : ''}`} title="Show Grid" onClick={() => setShowGrid(!showGrid)}>⊟</button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <button className="btn-icon" title="Align Left" disabled={selectedIds.length < 2} onClick={() => alignWidgets('left')}>⫮</button>
            <button className="btn-icon" title="Align Center H" disabled={selectedIds.length < 2} onClick={() => alignWidgets('center-h')}>⊣</button>
            <button className="btn-icon" title="Align Right" disabled={selectedIds.length < 2} onClick={() => alignWidgets('right')}>⫯</button>
            <button className="btn-icon" title="Align Top" disabled={selectedIds.length < 2} onClick={() => alignWidgets('top')}>⫴</button>
            <button className="btn-icon" title="Align Center V" disabled={selectedIds.length < 2} onClick={() => alignWidgets('center-v')}>⊥</button>
            <button className="btn-icon" title="Align Bottom" disabled={selectedIds.length < 2} onClick={() => alignWidgets('bottom')}>⫵</button>
          </div>
          <div className="group flex-1 gap-8 justify-center">
            <button className="btn-icon" title="Save Preset" onClick={savePreset}>💾</button>
            <input className="preset-name" type="text" value={presetName} onChange={(e) => setManifest((m) => ({ ...m, ui: { ...m.ui, presetName: e.target.value } }))} />
            <button className="btn-icon" title="Load Preset" onClick={loadPreset}>📂</button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />
            <button className="btn-icon" title="Export Design" onClick={() => setShowExportPreview(true)}>📤</button>
            <button className="btn-primary" style={{ marginLeft: 8, padding: '6px 12px', fontSize: 12 }} title="Export for HISE" onClick={handleExportForHise}>Export for HISE</button>
            <button className="btn-icon" title="Export for HISE" onClick={() => {
              const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${presetName || 'design'}-hise.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}>🎹</button>
          </div>
          <div className="group">
            <button className="btn-icon" title="Zoom Out" onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}>−</button>
            <span style={{ fontSize: 11, minWidth: 40, textAlign: 'center', color: 'var(--muted)' }}>{Math.round(zoom * 100)}%</span>
            <button className="btn-icon" title="Zoom In" onClick={() => setZoom(Math.min(2, zoom + 0.25))}>+</button>
            <button className="btn-icon" title="Reset Zoom" onClick={() => setZoom(1)}>↺</button>
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 8px' }} />
            <button className="btn-icon" title="Clear saved design" onClick={clearSavedDesign}>🗑</button>
          </div>
          <div className="group min-w-160">
            <MasterMeter engine={engine} />
          </div>
        </div>
        {canvas.bgUrl && (
          <div
            className="bg-img"
            style={{
              backgroundImage: `url(${canvas.bgUrl})`,
              backgroundSize: canvas.bgSize || 'cover',
              backgroundRepeat: canvas.bgRepeat || 'no-repeat',
              backgroundPosition: canvas.bgPosition || 'center',
              opacity: typeof canvas.bgOpacity === 'number' ? canvas.bgOpacity : 1
            }}
          />
        )}
        {canvas.textureUrl && (
          <div
            className="texture-overlay"
            style={{
              backgroundImage: `url(${canvas.textureUrl})`,
              backgroundSize: canvas.textureSize || 'cover',
              backgroundRepeat: canvas.textureRepeat || 'no-repeat',
              backgroundPosition: canvas.texturePosition || 'center',
              opacity: typeof canvas.textureOpacity === 'number' ? canvas.textureOpacity : 0.25
            }}
          />
        )}
        {(showGrid || canvas.showGrid) && (
          <div className="grid-overlay" style={{ '--grid': `${Number(canvas.gridSize ?? 20)}px` }} />
        )}
        <div className="canvas-content" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        {orderedWidgets.length === 0 && (
          <div className="empty-canvas-hint inset-center">
            <div className="card max-w-520 text-center">
              <h2 style={{ marginBottom: 8 }}>Canvas is empty</h2>
              <div className="muted" style={{ marginBottom: 16 }}>Use the Components panel to add sliders, knobs, and other widgets.</div>
              <div className="row gap-8 justify-center">
                <button className="primary" onClick={() => addModernStandaloneTemplate()}>Load Modern Template</button>
                <button className="secondary" onClick={() => loadTemplateById('wooden-studio')}>Load Wooden Template</button>
                <button className="secondary" onClick={() => { setActiveTab('components'); }}>Open Components</button>
                <button className="secondary" onClick={loadLastSession}>Load Last Session</button>
                <button onClick={() => resetCanvas()}>Reset Canvas</button>
              </div>
            </div>
          </div>
        )}
        {orderedWidgets.map((w) => (
          !w?.visible ? null : (
            <div key={w.id} className={`widget ${selectedIds.includes(w.id) ? 'selected' : ''} ${isDragging && selectedIds.includes(w.id) ? 'dragging' : ''}`}
                 style={{ left: w.x, top: w.y, width: w.w, height: w.h }}
                  onClick={(e) => {
                    // Multi-select with Ctrl/Cmd+Click
                    if (e.ctrlKey || e.metaKey) {
                      e.stopPropagation();
                      if (selectedIds.includes(w.id)) {
                        setSelectedIds(selectedIds.filter(id => id !== w.id));
                      } else {
                        setSelectedIds([...selectedIds, w.id]);
                      }
                    }
                  }}
                  onPointerDown={(e) => {
                    if (w.locked) return;
                    
                    // If not multi-selecting and widget not selected, select it
                    if (!e.ctrlKey && !e.metaKey && !selectedIds.includes(w.id)) {
                      setSelectedIds([w.id]);
                    }
                    
                    setIsDragging(true);
                    const startX = e.clientX; const startY = e.clientY;
                    const orig = { x: w.x, y: w.y };
                    const move = (ev) => {
                      const dx = (ev.clientX - startX) / zoom;
                      const dy = (ev.clientY - startY) / zoom;
                      let nx = clamp(orig.x + dx, 0, 4000);
                      let ny = clamp(orig.y + dy, 0, 4000);
                      if (snapToGrid || canvas.snap) {
                        const g = Number(canvas.gridSize ?? 20);
                        nx = Math.round(nx / g) * g;
                        ny = Math.round(ny / g) * g;
                      }
                      // Clamp within canvas bounds so widgets don't leave the screen
                      try {
                        const canvasEl = e.currentTarget.closest('.canvas');
                        const rect = canvasEl?.getBoundingClientRect();
                        if (rect) {
                          const maxX = Math.max(0, (rect.width / zoom) - Number(w.w || 0));
                          const maxY = Math.max(0, (rect.height / zoom) - Number(w.h || 0));
                          nx = clamp(nx, 0, maxX);
                          ny = clamp(ny, 0, maxY);
                        }
                      } catch {}
                      
                      // Move all selected widgets together
                      if (selectedIds.includes(w.id) && selectedIds.length > 1) {
                        const deltaX = nx - (w.x || 0);
                        const deltaY = ny - (w.y || 0);
                        selectedIds.forEach(id => {
                          const widget = orderedWidgets.find(w => w.id === id);
                          if (widget) {
                            updateWidget(id, { 
                              x: (widget.x || 0) + deltaX, 
                              y: (widget.y || 0) + deltaY 
                            });
                          }
                        });
                      } else {
                        updateWidget(w.id, { x: nx, y: ny });
                      }
                    };
                   const up = () => { 
                     setIsDragging(false);
                     window.removeEventListener('pointermove', move); 
                     window.removeEventListener('pointerup', up); 
                   };
                   window.addEventListener('pointermove', move, { passive: true }); 
                   window.addEventListener('pointerup', up, { passive: true });
                 }}>
              {canvas.showLabels && !selectedIds.includes(w.id) && (
                <div className="widget-title">{w.label || w.type}</div>
              )}
              {selectedIds.includes(w.id) && (
                <div className="widget-title" style={{ opacity: 1, top: -26, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px', background: 'rgba(0,234,255,0.12)', borderRadius: 6 }}>
                  <input 
                    type="text" 
                    value={w.label || w.type}
                    onChange={(e) => updateWidget(w.id, { label: e.target.value })}
                    onClick={(e) => { e.stopPropagation(); }}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      color: 'var(--accent-2)', 
                      fontSize: 11, 
                      fontWeight: 600, 
                      outline: 'none',
                      flex: 1,
                      minWidth: 0
                    }}
                    placeholder="Label..."
                  />
                  <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 4 }}>{w.w}×{w.h}</span>
                </div>
              )}
              {w.type === 'slider' && (
                <div className="widget-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center', height: '100%', padding: '16px 12px' }}>
                  <ModernFader
                    label={w.label || 'Slider'}
                    value={Number(w.value ?? 0.5)}
                    min={Number(w.min ?? 0)}
                    max={Number(w.max ?? 1)}
                    onChange={(newValue) => setWidgetValue(w, newValue)}
                    orientation="horizontal"
                    width={Math.max(100, Number(w.w ?? 220) - 40)}
                    unit={w.unit || ''}
                  />
                </div>
              )}
              {w.type === 'knob' && (
                <div className="widget-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <ModernKnob
                    label={w.label || 'Knob'}
                    value={Number(w.value ?? 0.5)}
                    min={Number(w.min ?? 0)}
                    max={Number(w.max ?? 1)}
                    onChange={(newValue) => setWidgetValue(w, newValue)}
                    unit={w.unit || ''}
                    size={Math.min(Number(w.w ?? 160) - 40, Number(w.h ?? 130) - 60)}
                  />
                </div>
              )}
              {w.type === 'toggle' && (
                <div className="widget-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px' }}>
                  <ModernLED
                    label={w.label || 'Toggle'}
                    value={!!w.checked}
                    onChange={(newValue) => setToggleValue(w, newValue)}
                    clickable={true}
                    size={Number(w.h ?? 72) > 100 ? 'large' : 'medium'}
                    color="#00eaff"
                  />
                </div>
              )}
              {w.type === 'select' && (
                <div className="widget-body">
                  <div className="row justify-between"><div>{w.label || 'Select'}</div><div className="muted">{String(w.value)}</div></div>
                  <select className="select" value={w.value} onChange={(e) => setSelectValue(w, e.target.value)}>
                    {(w.choices || ENUM_BINDINGS[w.binding]?.options || []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}
              {w.type === 'fader' && (
                <div className="widget-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '16px 8px' }}>
                  <ModernFader
                    label={w.label || 'Fader'}
                    value={Number(w.value ?? 0.5)}
                    min={Number(w.min ?? 0)}
                    max={Number(w.max ?? 1)}
                    onChange={(newValue) => setWidgetValue(w, newValue)}
                    orientation="vertical"
                    height={Math.max(60, Number(w.h ?? 180) - 60)}
                    unit={w.unit || ''}
                  />
                </div>
              )}
              {w.type === 'button' && (
                <div className="widget-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <ModernButton
                    label={w.label || 'Button'}
                    variant="primary"
                    size={Number(w.h ?? 72) > 100 ? 'large' : Number(w.h ?? 72) > 60 ? 'medium' : 'small'}
                    active={w.pressed}
                    onClick={() => {
                      setButtonPressed(w, !w.pressed);
                    }}
                  />
                </div>
              )}
              {w.type === 'pitchwheel' && (
                <div className="widget-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '8px' }}>
                  <PitchWheel
                    label={w.label || 'Pitch'}
                    value={Number(w.value ?? 0)}
                    onChange={(nv) => setWidgetValue(w, nv)}
                    height={Math.max(100, Number(w.h ?? 140) - 20)}
                  />
                </div>
              )}
              {w.type === 'modwheel' && (
                <div className="widget-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '8px' }}>
                  <ModWheel
                    label={w.label || 'Mod'}
                    value={Number(w.value ?? 0)}
                    onChange={(nv) => setWidgetValue(w, nv)}
                    height={Math.max(100, Number(w.h ?? 140) - 20)}
                  />
                </div>
              )}
              {w.type === 'transpose' && (
                <div className="widget-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <TransposeButton
                    value={Number(w.value ?? 0)}
                    onChange={(nv) => setWidgetValue(w, nv)}
                    step={Number(w.step ?? 1)}
                  />
                </div>
              )}
              {w.type === 'xy' && (
                <div className="widget-body" style={{ height: '100%' }}
                     onMouseDown={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const onMove = (ev) => {
                         const rx = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                         const ry = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
                         const xVal = w.minX + rx * (w.maxX - w.minX);
                         const yVal = w.minY + ry * (w.maxY - w.minY);
                         setXYValue(w, xVal, yVal);
                       };
                       const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
                       window.addEventListener('mousemove', onMove);
                       window.addEventListener('mouseup', onUp);
                     }}>
                  <div className="row justify-between"><div>{w.label || 'XY Pad'}</div><div className="muted">X: {(w.valueX ?? 0).toFixed?.(2)}  Y: {(w.valueY ?? 0).toFixed?.(2)}</div></div>
                  <div className="xy-pad" style={{ position: 'relative', width: '100%', height: `calc(100% - 24px)` }}>
                    {(() => {
                      const rx = (Number(w.valueX ?? w.minX) - w.minX) / (w.maxX - w.minX);
                      const ry = (Number(w.valueY ?? w.minY) - w.minY) / (w.maxY - w.minY);
                      const left = `${Math.max(0, Math.min(100, rx * 100))}%`;
                      const top = `${Math.max(0, Math.min(100, ry * 100))}%`;
                      return <div className="xy-thumb" style={{ position: 'absolute', left, top }} />;
                    })()}
                  </div>
                </div>
              )}
              {w.type === 'meter' && (
                <MasterMeter engine={engine} />
              )}
              {w.type === 'spectrum' && (
                <div className="widget-body" style={{ height: '100%' }}>
                  <SpectrumVisualizer engine={engine} height={Number(w.h ?? 120)} />
                </div>
              )}
              {w.type === 'label' && (
                <div className="widget-body">
                  <div 
                    className="label-widget"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: (w.textAlign || 'center') === 'left' ? 'flex-start' : (w.textAlign === 'right' ? 'flex-end' : 'center'),
                      width: '100%',
                      height: '100%',
                      fontSize: Number(w.fontSize ?? 14),
                      fontWeight: w.fontWeight || '600',
                      color: w.color || 'var(--text)',
                      letterSpacing: typeof w.letterSpacing === 'number' ? `${w.letterSpacing}px` : undefined,
                      textTransform: w.textTransform || 'none',
                      padding: '0 8px'
                    }}
                  >
                    {w.label || 'Label'}
                  </div>
                </div>
              )}
              {(w.type === 'image' || w.type === 'logo') && (
                <div className="widget-body">
                  <div className="image-widget" style={{ borderRadius: (w.radius ?? 8) }}>
                    <img src={w.src} alt={w.label || 'Image'} style={{ objectFit: (w.fit || 'cover') }} />
                  </div>
                </div>
              )}
              {w.type === 'keyboard' && (
                <div className="widget-body" style={{ height: '100%' }}>
                  <Keyboard
                    startMidi={Number(w.startMidi ?? 48)}
                    endMidi={Number(w.endMidi ?? 72)}
                    height={Number(w.h ?? 160)}
                    onNoteOn={(midi, velocity) => { try { engine?.noteOn?.(midi, velocity); } catch {} }}
                    onNoteOff={(midi) => { try { engine?.noteOff?.(midi); } catch {} }}
                  />
                </div>
              )}
              {w.type === 'divider' && (
                <div className="widget-body">
                  <div className="divider-line" />
                </div>
              )}
              {w.type === 'stateDisplay' && (
                <div className="widget-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 8 }}>
                  <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4 }}>{w.label || 'State'}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {(() => {
                      const binding = w.stateBinding;
                      if (!binding) return '—';
                      // Get state value from manifest
                      if (binding === 'state.selectedInstrument') return manifest?.ui?.selectedInstrument || 'None';
                      if (binding === 'state.instrumentCount') return Object.keys(manifest?.ui?.groupNames || {}).length;
                      if (binding === 'state.sampleCount') return (manifest?.samples || []).length;
                      if (binding === 'state.currentArticulation') {
                        const inst = manifest?.ui?.selectedInstrument;
                        return (manifest?.ui?.currentArticulations || {})[inst] || 'None';
                      }
                      if (binding === 'state.currentMic') {
                        const inst = manifest?.ui?.selectedInstrument;
                        return (manifest?.ui?.currentMics || {})[inst] || 'None';
                      }
                      if (binding === 'state.zoneCount') return engine?.samples?.length || 0;
                      if (binding === 'state.sequencerPlaying') return manifest?.sequence?.playing ? '▶️ Playing' : '⏸️ Stopped';
                      if (binding === 'state.sequencerBPM') return manifest?.sequence?.bpm || 120;
                      if (binding === 'state.sequencerCurrentStep') return manifest?.sequence?.currentStep || 0;
                      if (binding === 'state.sequencerMode') return manifest?.sequence?.mode || 'grid';
                      return '—';
                    })()}
                  </div>
                </div>
              )}
              {!w.locked && selectedIds.includes(w.id) && (
                <div className="resize-handles" aria-hidden="true">
                  <div className="resize-handle nw" onPointerDown={(e) => beginResize(e, w, 'nw')} />
                  <div className="resize-handle ne" onPointerDown={(e) => beginResize(e, w, 'ne')} />
                  <div className="resize-handle se" onPointerDown={(e) => beginResize(e, w, 'se')} />
                  <div className="resize-handle sw" onPointerDown={(e) => beginResize(e, w, 'sw')} />
                </div>
              )}
            </div>
          )
        ))}
        {marquee && (
          <div 
            className="marquee-selection"
            style={{
              position: 'absolute',
              left: marquee.x,
              top: marquee.y,
              width: marquee.w,
              height: marquee.h,
              border: '1px dashed var(--accent-2)',
              background: 'rgba(0, 234, 255, 0.08)',
              pointerEvents: 'none',
              borderRadius: 2,
              zIndex: 1000
            }}
          />
        )}
        {snapGuides.map((guide, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              background: 'var(--accent)',
              pointerEvents: 'none',
              zIndex: 999,
              boxShadow: '0 0 8px rgba(75,121,255,0.6)',
              ...(guide.type === 'vertical' 
                ? { left: guide.position, top: 0, bottom: 0, width: 1 }
                : { top: guide.position, left: 0, right: 0, height: 1 }
              )
            }}
          />
        ))}
        </div> {/* canvas-content */}
      </div>

      <div className="right-panel card compact">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="subtitle" style={{ margin: 0, fontSize: 12, fontWeight: 800, letterSpacing: 0.6, textTransform: 'uppercase' }}>Property Inspector</h3>
          {selected && (
            <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ padding: '2px 6px', background: 'var(--surface-2)', borderRadius: 4, fontFamily: 'monospace' }}>{selected.type}</span>
            </div>
          )}
        </div>
        {!selected && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, margin: '0 auto 8px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }} />
            <div className="muted" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.3 }}>No component selected</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Click a widget on the canvas to edit properties</div>
          </div>
        )}
        {selected && (
          <>
            {/* Live Preview */}
            {showLivePreview && (
              <div className="live-preview-section" style={{ 
                marginBottom: 16, 
                padding: 12, 
                background: 'rgba(15, 23, 42, 0.5)', 
                border: '1px solid #243041',
                borderRadius: 8 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>Live Preview</span>
                  <button 
                    className="btn-icon" 
                    style={{ width: 20, height: 20, fontSize: 10 }}
                    onClick={() => setShowLivePreview(false)}
                    title="Hide Preview"
                  >×</button>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  minHeight: 60,
                  background: '#0b1220',
                  borderRadius: 6,
                  padding: 12
                }}>
                  <LibraryPreview type={selected.type} />
                </div>
                <div style={{ marginTop: 8, fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
                  {selected.w || 100} × {selected.h || 40}px
                </div>
              </div>
            )}
            {!showLivePreview && (
              <button 
                className="secondary" 
                style={{ width: '100%', marginBottom: 12, fontSize: 11 }}
                onClick={() => setShowLivePreview(true)}
              >
                Show Live Preview
              </button>
            )}
            
            <div className="tabs" style={{ marginTop: 0, marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
              <div className={`inspector-tab ${inspectorTab === 'properties' ? 'active' : ''}`}>
                <TabButton active={inspectorTab === 'properties'} onClick={() => setInspectorTab('properties')}><IconTab style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Properties</span></TabButton>
              </div>
              <div className={`inspector-tab ${inspectorTab === 'automation' ? 'active' : ''}`}>
                <TabButton active={inspectorTab === 'automation'} onClick={() => setInspectorTab('automation')}><IconTab style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Automation</span></TabButton>
              </div>
              <div className={`inspector-tab ${inspectorTab === 'midi' ? 'active' : ''}`}>
                <TabButton active={inspectorTab === 'midi'} onClick={() => setInspectorTab('midi')}><IconMidi style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">MIDI</span></TabButton>
              </div>
              <div className={`inspector-tab ${inspectorTab === 'scripts' ? 'active' : ''}`}>
                <TabButton active={inspectorTab === 'scripts'} onClick={() => setInspectorTab('scripts')}><IconTab style={{ marginRight: 4, verticalAlign: 'middle' }} /><span className="tab-label">Scripts</span></TabButton>
              </div>
            </div>
          <div className="panel-body">
            {inspectorTab === 'properties' && (
              <>
            {/* General Section */}
            <div className="property-section">
              <div 
                className="property-section-title" 
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => toggleSection('basic')}
              >
                <span>General</span>
                <span className={`property-section-arrow ${!collapsedSections.basic ? 'expanded' : ''}`}>▶</span>
              </div>
              {!collapsedSections.basic && (
                <>
                  <div className="row gap">
                    <label className="label">Label <input type="text" value={selected.label || ''} onChange={(e) => updateWidget(selected.id, { label: e.target.value })} /></label>
                  </div>
                  <div className="row gap">
                    <label className="label">Visible
                      <input type="checkbox" checked={!!selected.visible} onChange={(e) => updateWidget(selected.id, { visible: e.target.checked })} />
                    </label>
                    <label className="label">Locked
                      <input type="checkbox" checked={!!selected.locked} onChange={(e) => updateWidget(selected.id, { locked: e.target.checked })} />
                    </label>
                  </div>
                </>
              )}
            </div>
            
            {/* Quick Presets Section */}
            {WIDGET_PRESETS[selected.type] && (
              <div className="property-section">
                <div 
                  className="property-section-title"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => toggleSection('presets')}
                >
                  <span>Quick Presets</span>
                  <span className={`property-section-arrow ${!collapsedSections.presets ? 'expanded' : ''}`}>▶</span>
                </div>
                {!collapsedSections.presets && (
                  <div style={{ display: 'grid', gap: 6 }}>
                    {Object.keys(WIDGET_PRESETS[selected.type]).map(presetName => (
                      <button
                        key={presetName}
                        className="secondary"
                        style={{ width: '100%', fontSize: 11, padding: '6px 10px', textAlign: 'left' }}
                        onClick={() => applyPresetToWidget(selected.id, presetName)}
                      >
                        {presetName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Type-Specific Properties */}
            {(selected.type === 'slider') && (
              <div className="property-section">
                <div 
                  className="property-section-title"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => toggleSection('slider-props')}
                >
                  <span>Slider Properties</span>
                  <span className={`property-section-arrow ${!collapsedSections['slider-props'] ? 'expanded' : ''}`}>▶</span>
                </div>
                {!collapsedSections['slider-props'] && (
                  <>
                    <div className="row gap">
                      <label className="label">Binding
                        <select value={selected.binding} onChange={(e) => updateWidget(selected.id, { binding: e.target.value })}>
                          <option value="">-- Select Binding --</option>
                          {Object.entries(NUMERIC_BINDINGS).map(([key, spec]) => (
                            <option key={key} value={key}>{spec.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="row gap">
                      <label className="label">Min <input type="number" step="0.001" value={selected.min ?? 0} onChange={(e) => updateWidget(selected.id, { min: Number(e.target.value) })} /></label>
                      <label className="label">Max <input type="number" step="0.001" value={selected.max ?? 1} onChange={(e) => updateWidget(selected.id, { max: Number(e.target.value) })} /></label>
                      <label className="label">Step <input type="number" step="0.001" value={selected.step ?? 0.01} onChange={(e) => updateWidget(selected.id, { step: Number(e.target.value) })} /></label>
                    </div>
                  </>
                )}
              </div>
            )}
            {(selected.type === 'knob') && (
              <div className="property-section">
                <div 
                  className="property-section-title"
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  onClick={() => toggleSection('knob-props')}
                >
                  <span>Knob Properties</span>
                  <span className={`property-section-arrow ${!collapsedSections['knob-props'] ? 'expanded' : ''}`}>▶</span>
                </div>
                {!collapsedSections['knob-props'] && (
                  <>
                    <div className="row gap">
                      <label className="label">Binding
                        <select value={selected.binding} onChange={(e) => updateWidget(selected.id, { binding: e.target.value })}>
                          <option value="">-- Select Binding --</option>
                          {Object.entries(NUMERIC_BINDINGS).map(([key, spec]) => (
                            <option key={key} value={key}>{spec.label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="row gap">
                      <label className="label">Min <input type="number" step="0.001" value={selected.min ?? 0} onChange={(e) => updateWidget(selected.id, { min: Number(e.target.value) })} /></label>
                      <label className="label">Max <input type="number" step="0.001" value={selected.max ?? 1} onChange={(e) => updateWidget(selected.id, { max: Number(e.target.value) })} /></label>
                      <label className="label">Step <input type="number" step="0.001" value={selected.step ?? 0.01} onChange={(e) => updateWidget(selected.id, { step: Number(e.target.value) })} /></label>
                    </div>
                  </>
                )}
              </div>
            )}
            {(selected.type === 'fader') && (
              <>
                <div className="row gap">
                  <label className="label">Binding
                    <select value={selected.binding || ''} onChange={(e) => updateWidget(selected.id, { binding: e.target.value })}>
                      <option value="">-- Select Binding --</option>
                      {Object.entries(NUMERIC_BINDINGS).map(([key, spec]) => (
                        <option key={key} value={key}>{spec.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="row gap">
                  <label className="label">Min <input type="number" step="0.001" value={selected.min} onChange={(e) => updateWidget(selected.id, { min: Number(e.target.value) })} /></label>
                  <label className="label">Max <input type="number" step="0.001" value={selected.max} onChange={(e) => updateWidget(selected.id, { max: Number(e.target.value) })} /></label>
                  <label className="label">Step <input type="number" step="0.001" value={selected.step} onChange={(e) => updateWidget(selected.id, { step: Number(e.target.value) })} /></label>
                </div>
              </>
            )}
            {(selected.type === 'toggle') && (
              <>
                <div className="row gap">
                  <label className="label">Binding
                    <select value={selected.binding || ''} onChange={(e) => updateWidget(selected.id, { binding: e.target.value })}>
                      <option value="">-- Select Binding --</option>
                      {Object.entries(BOOLEAN_BINDINGS).map(([key, spec]) => (
                        <option key={key} value={key}>{spec.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            {(selected.type === 'select') && (
              <>
                <div className="row gap">
                  <label className="label">Binding
                    <select value={selected.binding} onChange={(e) => {
                      const b = e.target.value;
                      const choices = ENUM_BINDINGS[b]?.options || [];
                      updateWidget(selected.id, { binding: b, choices });
                    }}>
                      <option value="">-- Select Binding --</option>
                      {Object.entries(ENUM_BINDINGS).map(([key, spec]) => (
                        <option key={key} value={key}>{spec.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="row gap">
                  <label className="label">Value
                    <select value={selected.value || ''} onChange={(e) => setSelectValue(selected, e.target.value)}>
                      {((selected.choices && selected.choices.length ? selected.choices : (ENUM_BINDINGS[selected.binding]?.options || []))).map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                      {((selected.choices && selected.choices.length) || (ENUM_BINDINGS[selected.binding]?.options || []).length) === 0 && (
                        <option value="" disabled>(choose binding first)</option>
                      )}
                    </select>
                  </label>
                </div>
              </>
            )}
            {(selected.type === 'button') && (
              <>
                <div className="row gap">
                  <label className="label">Binding
                    <select value={selected.binding || ''} onChange={(e) => updateWidget(selected.id, { binding: e.target.value })}>
                      <option value="">-- Select Binding --</option>
                      {Object.entries(BOOLEAN_BINDINGS).map(([key, spec]) => (
                        <option key={key} value={key}>{spec.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}
            {(selected.type === 'keyboard') && (
              <>
                <div className="row gap">
                  <label className="label">Start MIDI <input type="number" step="1" value={Number(selected.startMidi ?? 48)} onChange={(e) => updateWidget(selected.id, { startMidi: Number(e.target.value) })} /></label>
                  <label className="label">End MIDI <input type="number" step="1" value={Number(selected.endMidi ?? 72)} onChange={(e) => updateWidget(selected.id, { endMidi: Number(e.target.value) })} /></label>
                </div>
              </>
            )}
            {(selected.type === 'image' || selected.type === 'logo') && (
              <>
                <div className="row gap">
                  <label className="label">Source URL <input type="text" value={selected.src || ''} onChange={(e) => updateWidget(selected.id, { src: e.target.value })} /></label>
                </div>
                <div className="row gap">
                  <label className="label">Object Fit
                    <select value={selected.fit || 'cover'} onChange={(e) => updateWidget(selected.id, { fit: e.target.value })}>
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                      <option value="fill">Fill</option>
                      <option value="none">None</option>
                    </select>
                  </label>
                  <label className="label">Border Radius <input type="number" step="1" value={Number(selected.radius ?? 8)} onChange={(e) => updateWidget(selected.id, { radius: Number(e.target.value) })} /></label>
                </div>
              </>
            )}
            {(selected.type === 'xy') && (
              <>
                <div className="row gap">
                  <label className="label">Binding X
                    <select value={selected.bindingX || ''} onChange={(e) => updateWidget(selected.id, { bindingX: e.target.value })}>
                      <option value="">-- Select Binding --</option>
                      {Object.entries(NUMERIC_BINDINGS).map(([key, spec]) => (
                        <option key={key} value={key}>{spec.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="label">Binding Y
                    <select value={selected.bindingY || ''} onChange={(e) => updateWidget(selected.id, { bindingY: e.target.value })}>
                      <option value="">-- Select Binding --</option>
                      {Object.entries(NUMERIC_BINDINGS).map(([key, spec]) => (
                        <option key={key} value={key}>{spec.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="row gap">
                  <label className="label">Min X <input type="number" step="0.001" value={selected.minX} onChange={(e) => updateWidget(selected.id, { minX: Number(e.target.value) })} /></label>
                  <label className="label">Max X <input type="number" step="0.001" value={selected.maxX} onChange={(e) => updateWidget(selected.id, { maxX: Number(e.target.value) })} /></label>
                  <label className="label">Min Y <input type="number" step="0.001" value={selected.minY} onChange={(e) => updateWidget(selected.id, { minY: Number(e.target.value) })} /></label>
                  <label className="label">Max Y <input type="number" step="0.001" value={selected.maxY} onChange={(e) => updateWidget(selected.id, { maxY: Number(e.target.value) })} /></label>
                </div>
              </>
            )}
            {(selected.type === 'stateDisplay') && (
              <>
                <div className="row gap">
                  <label className="label">State Binding
                    <select value={selected.stateBinding || ''} onChange={(e) => updateWidget(selected.id, { stateBinding: e.target.value })}>
                      <option value="">Select State...</option>
                      {Object.entries(STATE_BINDINGS).map(([key, spec]) => (
                        <option key={key} value={key}>{spec.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 8, padding: 8, background: 'var(--bg)', borderRadius: 4 }}>
                  <strong>Live State Display</strong><br/>
                  This widget shows real-time state from other pages (Play, Map, Sequence). The displayed value updates automatically.
                </div>
              </>
            )}
            <div className="space" />
            <div className="row gap">
              <label className="label">X <input type="number" value={selected.x} onChange={(e) => updateWidget(selected.id, { x: Number(e.target.value) })} /></label>
              <label className="label">Y <input type="number" value={selected.y} onChange={(e) => updateWidget(selected.id, { y: Number(e.target.value) })} /></label>
              <label className="label">W <input type="number" value={selected.w} onChange={(e) => updateWidget(selected.id, { w: Number(e.target.value) })} /></label>
              <label className="label">H <input type="number" value={selected.h} onChange={(e) => updateWidget(selected.id, { h: Number(e.target.value) })} /></label>
            </div>
              </>
            )}

            {inspectorTab === 'automation' && (
              <>
                <div className="property-section">
                  <div className="property-section-title">Automation Mode</div>
                  <div className="row gap" style={{ marginBottom: 12 }}>
                    <button className={`btn ${automationMode === 'off' ? 'primary' : 'secondary'}`} onClick={() => setAutomationMode('off')} style={{ flex: 1 }}>Off</button>
                    <button className={`btn ${automationMode === 'read' ? 'primary' : 'secondary'}`} onClick={() => setAutomationMode('read')} style={{ flex: 1 }}>Read</button>
                    <button className={`btn ${automationMode === 'write' ? 'primary' : 'secondary'}`} onClick={() => setAutomationMode('write')} style={{ flex: 1 }}>Write</button>
                    <button className={`btn ${automationMode === 'latch' ? 'primary' : 'secondary'}`} onClick={() => setAutomationMode('latch')} style={{ flex: 1 }}>Latch</button>
                  </div>
                </div>

                {automationMode !== 'off' && (
                  <>
                    <div className="property-section">
                      <div className="property-section-title">Automation Lanes</div>
                      {selected.binding && (
                        <div style={{ 
                          padding: 12, 
                          background: 'rgba(0,234,255,0.05)', 
                          borderRadius: 6,
                          border: '1px solid rgba(0,234,255,0.2)',
                          marginBottom: 12
                        }}>
                          <div className="row justify-between align-center" style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-2)' }}>
                              {NUMERIC_BINDINGS[selected.binding]?.label || selected.binding}
                            </span>
                            <span style={{ 
                              fontSize: 10, 
                              padding: '2px 8px', 
                              background: automationMode === 'read' ? 'rgba(100,149,237,0.2)' : automationMode === 'write' ? 'rgba(0,234,255,0.2)' : 'rgba(255,193,7,0.2)',
                              color: automationMode === 'read' ? '#6495ed' : automationMode === 'write' ? 'var(--accent-2)' : '#ffc107',
                              borderRadius: 4,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: 0.5
                            }}>
                              {automationMode === 'read' ? '📖 Reading' : automationMode === 'write' ? '✏️ Writing' : '🔒 Latching'}
                            </span>
                          </div>
                          <div style={{ 
                            height: 80, 
                            background: 'rgba(0,0,0,0.3)', 
                            borderRadius: 4, 
                            position: 'relative', 
                            overflow: 'hidden',
                            border: '1px solid rgba(0,234,255,0.1)'
                          }}>
                            {/* Grid lines */}
                            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                              <defs>
                                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"/>
                                </pattern>
                                <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="var(--accent-2)" stopOpacity="0.8"/>
                                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.8"/>
                                </linearGradient>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                              <polyline 
                                points="0,60 15,45 30,50 50,30 70,40 85,25 100,35" 
                                fill="none" 
                                stroke="url(#curve-gradient)" 
                                strokeWidth="2.5"
                                vectorEffect="non-scaling-stroke"
                                style={{ filter: 'drop-shadow(0 0 4px rgba(0,234,255,0.5))' }}
                              />
                              {/* Control points */}
                              <circle cx="0" cy="60" r="3" fill="var(--accent-2)" opacity="0.8" />
                              <circle cx="15" cy="45" r="3" fill="var(--accent-2)" opacity="0.8" />
                              <circle cx="30" cy="50" r="3" fill="var(--accent-2)" opacity="0.8" />
                              <circle cx="50" cy="30" r="3" fill="var(--accent-2)" opacity="0.8" />
                              <circle cx="70" cy="40" r="3" fill="var(--accent-2)" opacity="0.8" />
                              <circle cx="85" cy="25" r="3" fill="var(--accent-2)" opacity="0.8" />
                              <circle cx="100" cy="35" r="3" fill="var(--accent-2)" opacity="0.8" />
                            </svg>
                          </div>
                        </div>
                      )}
                      {!selected.binding && (
                        <div className="muted" style={{ 
                          fontSize: 11, 
                          padding: 12, 
                          background: 'var(--surface-2)', 
                          borderRadius: 6,
                          border: '1px dashed #243041',
                          textAlign: 'center'
                        }}>
                          Assign a binding in the Properties tab to enable automation
                        </div>
                      )}
                    </div>
                    
                    <div className="property-section">
                      <div className="property-section-title">Actions</div>
                      <div className="row gap">
                        <button 
                          className="btn secondary" 
                          onClick={() => alert('Record automation: Move controls while recording to capture automation data.')}
                          style={{ flex: 1 }}
                        >
                          Record
                        </button>
                        <button 
                          className="btn secondary" 
                          onClick={() => alert('Clear automation data for this widget.')}
                          style={{ flex: 1 }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {automationMode === 'off' && (
                  <div className="muted" style={{ 
                    fontSize: 11, 
                    padding: 12, 
                    background: 'var(--surface-2)', 
                    borderRadius: 6,
                    border: '1px dashed #243041'
                  }}>
                    Enable automation mode to record and playback parameter changes over time.
                  </div>
                )}
              </>
            )}

            {inspectorTab === 'midi' && (
              <>
                <div className="property-section">
                  <div className="property-section-title"><IconMidi style={{ marginRight: 4, verticalAlign: 'middle' }} /> MIDI Learn</div>
                  <button 
                    className={`btn ${midiLearnActive ? 'primary' : 'secondary'}`} 
                    onClick={() => setMidiLearnActive(!midiLearnActive)}
                    style={{ 
                      width: '100%', 
                      marginBottom: 12,
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {midiLearnActive && (
                      <span style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(0,234,255,0.3), transparent)',
                        animation: 'midi-pulse 2s infinite'
                      }} />
                    )}
                    <span style={{ position: 'relative' }}>
                      {midiLearnActive ? 'Listening... (Move MIDI Control)' : 'Enable MIDI Learn'}
                    </span>
                  </button>
                  
                  {selected.midiCC !== undefined && (
                    <div style={{ 
                      padding: 12, 
                      background: 'rgba(0,234,255,0.08)', 
                      borderRadius: 6,
                      border: '1px solid rgba(0,234,255,0.2)',
                      marginBottom: 12
                    }}>
                      <div className="row justify-between align-center" style={{ marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-2)' }}>
                          ✓ MIDI CC {selected.midiCC}
                        </span>
                        <button 
                          className="btn-icon" 
                          style={{ width: 24, height: 24 }}
                          onClick={() => updateWidget(selected.id, { midiCC: undefined })}
                          title="Clear MIDI Assignment"
                        >×</button>
                      </div>
                      <div className="row gap">
                        <label className="label" style={{ flex: 1 }}>
                          Channel
                          <input type="number" min="1" max="16" value={selected.midiChannel || 1} onChange={(e) => updateWidget(selected.id, { midiChannel: Number(e.target.value) })} />
                        </label>
                        <label className="label" style={{ flex: 1 }}>
                          CC#
                          <input type="number" min="0" max="127" value={selected.midiCC || 0} onChange={(e) => updateWidget(selected.id, { midiCC: Number(e.target.value) })} />
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {!selected.midiCC && !midiLearnActive && (
                    <div className="muted" style={{ 
                      fontSize: 11, 
                      padding: 12, 
                      background: 'var(--surface-2)', 
                      borderRadius: 6,
                      border: '1px dashed #243041'
                    }}>
                      Click "Enable MIDI Learn" above, then move a MIDI controller to assign it to this widget.
                    </div>
                  )}
                </div>
                
                <div className="property-section">
                  <div className="property-section-title">MIDI Settings</div>
                  <div className="row gap">
                    <label className="label">
                      Min Value
                      <input type="number" step="0.01" value={selected.midiMin ?? 0} onChange={(e) => updateWidget(selected.id, { midiMin: Number(e.target.value) })} />
                    </label>
                    <label className="label">
                      Max Value
                      <input type="number" step="0.01" value={selected.midiMax ?? 1} onChange={(e) => updateWidget(selected.id, { midiMax: Number(e.target.value) })} />
                    </label>
                  </div>
                </div>
              </>
            )}

            {inspectorTab === 'scripts' && (
              <>
                <div className="muted" style={{ marginBottom: 12 }}>Custom Scripts</div>
                <div className="muted" style={{ fontSize: 11, marginBottom: 8, opacity: 0.7 }}>
                  Write custom JavaScript to run when this widget changes.
                </div>
                <label className="label" style={{ marginBottom: 12 }}>
                  On Change
                  <textarea 
                    value={selected.onChangeScript || ''} 
                    onChange={(e) => updateWidget(selected.id, { onChangeScript: e.target.value })}
                    placeholder="// e.g., console.log('Value changed:', value);"
                    style={{ 
                      width: '100%', 
                      minHeight: 100, 
                      fontFamily: 'monospace', 
                      fontSize: 11, 
                      background: 'var(--bg)', 
                      color: 'var(--text)', 
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: 8,
                      resize: 'vertical'
                    }}
                  />
                </label>
                <label className="label" style={{ marginBottom: 12 }}>
                  On Click
                  <textarea 
                    value={selected.onClickScript || ''} 
                    onChange={(e) => updateWidget(selected.id, { onClickScript: e.target.value })}
                    placeholder="// e.g., alert('Button clicked!');"
                    style={{ 
                      width: '100%', 
                      minHeight: 100, 
                      fontFamily: 'monospace', 
                      fontSize: 11, 
                      background: 'var(--bg)', 
                      color: 'var(--text)', 
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: 8,
                      resize: 'vertical'
                    }}
                  />
                </label>
                <div className="space" />
                <div className="muted" style={{ fontSize: 11, padding: 8, background: 'var(--bg)', borderRadius: 4 }}>
                  <strong>Available variables:</strong><br/>
                  • <code>value</code> - Current widget value<br/>
                  • <code>widget</code> - Widget object<br/>
                  • <code>manifest</code> - Full manifest
                </div>
              </>
            )}

          </div> {/* end panel-body */}
          </>
        )}
      </div> {/* end right-panel */}
      </div> {/* end design-grid */}
    </div> {/* end design-page theme-dark */}

    {/* Keyboard Shortcuts Panel */}
    {showShortcutsPanel && (
        <div className="modal-overlay" onClick={() => setShowShortcutsPanel(false)}>
          <div className="modal-content shortcuts-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <button className="btn-icon" onClick={() => setShowShortcutsPanel(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="shortcuts-section">
                <h4>General</h4>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Undo</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Z</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Redo</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Y</kbd> or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Show/Hide Shortcuts</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>/</kbd></span>
                </div>
              </div>
              
              <div className="shortcuts-section">
                <h4>Selection</h4>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Select All</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>A</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Deselect</span>
                  <span className="shortcut-keys"><kbd>Esc</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Multi-Select</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>Click</kbd></span>
                </div>
              </div>
              
              <div className="shortcuts-section">
                <h4>Editing</h4>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Copy</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>C</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Paste</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>V</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Duplicate</span>
                  <span className="shortcut-keys"><kbd>Ctrl</kbd> + <kbd>D</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Delete</span>
                  <span className="shortcut-keys"><kbd>Delete</kbd> or <kbd>Backspace</kbd></span>
                </div>
              </div>
              
              <div className="shortcuts-section">
                <h4>Navigation</h4>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Search Components</span>
                  <span className="shortcut-keys"><kbd>/</kbd></span>
                </div>
                <div className="shortcut-row">
                  <span className="shortcut-desc">Close Modal</span>
                  <span className="shortcut-keys"><kbd>Esc</kbd></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Panel */}
      {showShortcutsPanel && (
        <div className="modal-overlay" onClick={() => setShowShortcutsPanel(false)}>
          <div className="modal-content shortcuts-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⌨️ Keyboard Shortcuts</h3>
              <button className="btn-icon" onClick={() => setShowShortcutsPanel(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="shortcuts-grid">
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>S</kbd>
                  <span>Save Design</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>E</kbd>
                  <span>Export Design</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                  <span>Undo</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>Y</kbd>
                  <span>Redo</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>D</kbd>
                  <span>Duplicate Widget</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Delete</kbd>
                  <span>Delete Widget</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>G</kbd>
                  <span>Toggle Grid</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>R</kbd>
                  <span>Toggle Rulers</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Arrow Keys</kbd>
                  <span>Move Widget</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Shift</kbd> + <kbd>Arrow</kbd>
                  <span>Move 10px</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>+</kbd>
                  <span>Zoom In</span>
                </div>
                <div className="shortcut-item">
                  <kbd>Ctrl</kbd> + <kbd>-</kbd>
                  <span>Zoom Out</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    {/* Export Preview Modal */}
    {showExportPreview && (
      <div className="modal-overlay" onClick={() => !isExporting && setShowExportPreview(false)}>
        <div className="modal-content export-preview-panel" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>📤 Export Design</h3>
            <button className="btn-icon" onClick={() => !isExporting && setShowExportPreview(false)} disabled={isExporting}>×</button>
          </div>
          <div className="modal-body">
            {isExporting ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
                <div className="loading-text">Exporting design...</div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Design Summary</h4>
                  <div style={{ 
                    padding: 16, 
                    background: 'rgba(0,234,255,0.05)', 
                    border: '1px solid rgba(0,234,255,0.2)', 
                    borderRadius: 6 
                  }}>
                    <div className="row justify-between" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Preset Name:</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{presetName || 'Untitled'}</span>
                    </div>
                    <div className="row justify-between" style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Widgets:</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{orderedWidgets.length}</span>
                    </div>
                    <div className="row justify-between">
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Canvas Size:</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{canvas.width || 800} × {canvas.height || 600}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600 }}>Export Format</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <button 
                      className="btn secondary" 
                      style={{ padding: 16, flexDirection: 'column', alignItems: 'flex-start' }}
                      onClick={() => handleExport('json')}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>JSON</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Full design data</div>
                    </button>
                    <button 
                      className="btn secondary" 
                      style={{ padding: 16, flexDirection: 'column', alignItems: 'flex-start' }}
                      onClick={() => handleExport('template')}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}><IconTemplates width={32} height={32} /></div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Template</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Reusable template</div>
                    </button>
                    <button 
                      className="btn secondary" 
                      style={{ padding: 16, flexDirection: 'column', alignItems: 'flex-start' }}
                      onClick={() => handleExport('vst')}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}><IconMidi width={32} height={32} /></div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>VST Project</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>C++ VST3 code</div>
                    </button>
                    <button 
                      className="btn secondary" 
                      style={{ padding: 16, flexDirection: 'column', alignItems: 'flex-start' }}
                      onClick={() => handleExport('standalone')}
                    >
                      <div style={{ fontSize: 24, marginBottom: 8 }}><IconTemplates width={32} height={32} /></div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Standalone</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>Electron app</div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )}
    </ErrorBoundary>
  );
}
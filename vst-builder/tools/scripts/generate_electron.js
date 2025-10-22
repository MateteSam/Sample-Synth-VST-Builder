const fs = require('fs');
const path = require('path');

function usage() {
  console.log('Usage: node generate_electron.js <exportPath>');
  process.exit(2);
}

const args = process.argv.slice(2);
if (args.length < 1) usage();
const exportPath = path.resolve(args[0]);

console.log('[vst-builder] generate_electron.js -> reading design from', exportPath);

// Read mapping.json to get design config
let mapping = {};
let designConfig = {};
try {
  const mappingPath = path.join(exportPath, 'mapping.json');
  if (fs.existsSync(mappingPath)) {
    mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    // Extract design config from ui (bindings, bindingOrder, canvas, etc.)
    if (mapping.ui) {
      designConfig = {
        bindings: mapping.ui.bindings || [],
        bindingOrder: mapping.ui.bindingOrder || [],
        canvas: mapping.ui.canvas || {},
        presetName: mapping.ui.presetName || 'Custom',
      };
    }
  }
} catch (e) {
  console.warn('Could not read mapping.json:', e.message);
}

const appDir = path.join(exportPath, 'standalone-electron');
if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

// package.json
const pkg = {
  name: 'SekoSa-Standalone',
  productName: 'SekoSa Standalone',
  version: '0.0.1',
  main: 'main.js',
  scripts: { start: 'electron .' },
  dependencies: {},
  devDependencies: {}
};
fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(pkg, null, 2));

// main.js
const mainJs = `const { app, BrowserWindow } = require('electron');
const path = require('path');
function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800, webPreferences: { nodeIntegration: true, contextIsolation: false } });
  win.loadFile(path.join(__dirname, 'index.html'));
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
`;
fs.writeFileSync(path.join(appDir, 'main.js'), mainJs);

// Generate HTML based on design config
function generateHTML(designConfig) {
  const bindings = designConfig.bindings || [];
  const canvas = designConfig.canvas || {};
  const presetName = designConfig.presetName || 'SekoSa Standalone';
  
  // Estimate canvas size from widget positions
  let maxX = 800, maxY = 600;
  for (const w of bindings) {
    const right = (Number(w.x) || 0) + (Number(w.w) || 200);
    const bottom = (Number(w.y) || 0) + (Number(w.h) || 100);
    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }
  maxX = Math.min(1600, Math.max(800, maxX + 40));
  maxY = Math.min(1200, Math.max(600, maxY + 40));

  const gridSnap = Number(canvas.gridSize) || 20;
  const showGrid = canvas.showGrid ? 'block' : 'none';
  const showLabels = canvas.showLabels ? 'block' : 'none';
  
  // Build widget HTML fragments
  let widgetHTML = '';
  for (const w of bindings) {
    if (!w.visible) continue;
    
    const x = Number(w.x) || 0;
    const y = Number(w.y) || 0;
    const wid = Number(w.w) || 200;
    const hei = Number(w.h) || 100;
    const label = w.label || w.type;
    
    let widgetBody = '';
    switch (w.type) {
      case 'slider':
        widgetBody = `<div class="widget-label">${label}</div>
          <input class="slider-input" type="range" min="${Number(w.min || 0)}" max="${Number(w.max || 1)}" step="${Number(w.step || 0.01)}" value="${Number(w.value || 0.5)}" data-binding="${w.binding || ''}" />
          <div class="widget-value" data-display="${w.binding || ''}">0.50</div>`;
        break;
      case 'knob':
        widgetBody = `<div class="widget-label">${label}</div>
          <div class="knob-container">
            <input class="knob-input" type="range" min="${Number(w.min || 0)}" max="${Number(w.max || 1)}" step="${Number(w.step || 0.01)}" value="${Number(w.value || 0.5)}" data-binding="${w.binding || ''}" />
            <div class="knob-dial" data-value="0.5"></div>
          </div>
          <div class="widget-value" data-display="${w.binding || ''}">0.50</div>`;
        break;
      case 'fader':
        widgetBody = `<div class="widget-label">${label}</div>
          <div class="fader-container">
            <input class="fader-input" type="range" min="${Number(w.min || 0)}" max="${Number(w.max || 1)}" step="${Number(w.step || 0.01)}" value="${Number(w.value || 0.5)}" orient="vertical" data-binding="${w.binding || ''}" />
          </div>
          <div class="widget-value" data-display="${w.binding || ''}">0.50</div>`;
        break;
      case 'toggle':
        widgetBody = `<div class="widget-label">${label}</div>
          <label class="switch"><input type="checkbox" class="toggle-input" ${w.checked ? 'checked' : ''} data-binding="${w.binding || ''}" /><span class="slider-toggle"></span></label>
          <div class="widget-value" data-display="${w.binding || ''}">Off</div>`;
        break;
      case 'button':
        widgetBody = `<div class="widget-label">${label}</div>
          <button class="push-button" data-binding="${w.binding || ''}">Press</button>`;
        break;
      case 'select':
        const opts = (w.choices || []).map(ch => `<option value="${ch}">${ch}</option>`).join('');
        widgetBody = `<div class="widget-label">${label}</div>
          <select class="select-input" data-binding="${w.binding || ''}">${opts}</select>`;
        break;
      case 'keyboard':
        widgetBody = `<div class="keyboard-container" data-start-midi="${Number(w.startMidi || 48)}" data-end-midi="${Number(w.endMidi || 72)}"></div>`;
        break;
      case 'meter':
        widgetBody = `<div class="widget-label">${label}</div><div class="meter-display"><div class="meter-bar"></div></div>`;
        break;
      case 'spectrum':
        widgetBody = `<div class="widget-label">${label}</div><canvas class="spectrum-canvas" width="400" height="100"></canvas>`;
        break;
      case 'label':
        widgetBody = `<div class="label-text">${label}</div>`;
        break;
      case 'image':
      case 'logo':
        const src = w.src || 'https://via.placeholder.com/200x100';
        const fit = w.fit || 'cover';
        const radius = w.radius || 8;
        widgetBody = `<img class="image-widget" src="${src}" style="object-fit:${fit};border-radius:${radius}px;width:100%;height:100%" alt="${label}" />`;
        break;
      case 'xy':
        widgetBody = `<div class="widget-label">${label}</div>
          <div class="xy-pad-container" data-binding-x="${w.bindingX || ''}" data-binding-y="${w.bindingY || ''}">
            <div class="xy-thumb"></div>
          </div>`;
        break;
      case 'divider':
        widgetBody = `<div class="divider-line"></div>`;
        break;
      default:
        widgetBody = `<div class="widget-label">${label}</div><div class="muted">${w.type}</div>`;
    }
    
    widgetHTML += `
    <div class="widget ${w.locked ? 'locked' : ''} ${w.type}" style="left:${x}px;top:${y}px;width:${wid}px;height:${hei}px" data-widget-id="${w.id}" data-widget-type="${w.type}">
      ${widgetBody}
    </div>`;
  }

  const gridPattern = canvas.showGrid ? `
    <svg class="grid-overlay" width="${maxX}" height="${maxY}" style="display:${showGrid}">
      <defs>
        <pattern id="grid" width="${gridSnap}" height="${gridSnap}" patternUnits="userSpaceOnUse">
          <path d="M ${gridSnap} 0 L 0 0 0 ${gridSnap}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>` : '';

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${presetName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        --bg: #0f1720;
        --panel: #111827;
        --border: #1f2937;
        --text: #e6eef6;
        --muted: #94a3b8;
        --accent: #7c3aed;
        --success: #22c55e;
      }
      
      html, body {
        height: 100%;
        margin: 0;
        font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
      
      body {
        background: var(--bg);
        color: var(--text);
        overflow: hidden;
      }
      
      .container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        gap: 0;
      }
      
      .header {
        padding: 12px 16px;
        background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
        border-bottom: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      
      .header .title {
        font-size: 16px;
        font-weight: 600;
      }
      
      .header .muted {
        font-size: 12px;
        color: var(--muted);
        margin-left: auto;
      }
      
      .controls {
        padding: 8px 12px;
        background: var(--panel);
        border-bottom: 1px solid var(--border);
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
        flex-shrink: 0;
        overflow-y: auto;
        max-height: 80px;
      }
      
      .controls label {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: var(--muted);
        white-space: nowrap;
      }
      
      .controls button {
        padding: 4px 8px;
        background: var(--accent);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 11px;
        cursor: pointer;
      }
      
      .controls button:hover {
        background: #6d28d9;
      }
      
      .canvas {
        flex: 1;
        position: relative;
        overflow: auto;
        background: var(--bg);
        width: ${maxX}px;
        height: ${maxY}px;
      }
      
      .grid-overlay {
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      }
      
      .widget {
        position: absolute;
        background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        border: 1px solid var(--border);
        border-radius: 6px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transition: box-shadow 0.2s;
      }
      
      .widget:hover {
        box-shadow: 0 4px 12px rgba(124,58,237,0.2);
      }
      
      .widget.locked {
        opacity: 0.7;
      }
      
      .widget-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--text);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .widget-value {
        font-size: 10px;
        color: var(--muted);
        margin-top: auto;
      }
      
      .slider-input, .fader-input {
        cursor: pointer;
        accent-color: var(--accent);
      }
      
      .slider-input {
        width: 100%;
      }
      
      .fader-input {
        width: 100%;
        height: 100%;
        writing-mode: bt-lr;
      }
      
      .knob-container {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        flex: 1;
      }
      
      .knob-input {
        width: 100%;
        opacity: 0;
        cursor: pointer;
        position: absolute;
      }
      
      .knob-dial {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), rgba(0,0,0,0.3));
        border: 2px solid var(--accent);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .knob-dial::after {
        content: '';
        width: 3px;
        height: 20px;
        background: var(--accent);
        border-radius: 2px;
        position: absolute;
        top: 4px;
        transform: rotate(0deg);
      }
      
      .toggle-input {
        cursor: pointer;
      }
      
      .switch {
        display: flex;
        align-items: center;
        cursor: pointer;
      }
      
      .slider-toggle {
        position: relative;
        width: 44px;
        height: 24px;
        background: #374151;
        border-radius: 12px;
        display: inline-block;
        transition: background 0.3s;
      }
      
      .slider-toggle::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        background: white;
        border-radius: 50%;
        top: 2px;
        left: 2px;
        transition: left 0.3s;
      }
      
      .toggle-input:checked ~ .slider-toggle {
        background: var(--accent);
      }
      
      .toggle-input:checked ~ .slider-toggle::after {
        left: 22px;
      }
      
      .push-button {
        padding: 6px 12px;
        background: var(--accent);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 12px;
        transition: all 0.1s;
      }
      
      .push-button:active {
        background: #6d28d9;
        transform: scale(0.95);
      }
      
      .select-input {
        background: var(--panel);
        color: var(--text);
        border: 1px solid var(--border);
        border-radius: 4px;
        padding: 4px 6px;
        font-size: 12px;
        cursor: pointer;
      }
      
      .keyboard-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(24px, 1fr));
        gap: 4px;
        height: 100%;
      }
      
      .keyboard-key {
        height: 60px;
        border-radius: 4px;
        background: white;
        color: #111;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-size: 9px;
        font-weight: 600;
        user-select: none;
        transition: all 0.05s;
      }
      
      .keyboard-key.black {
        background: #111;
        color: white;
        height: 45px;
      }
      
      .keyboard-key.active {
        transform: translateY(2px);
        box-shadow: 0 1px 3px rgba(0,0,0,0.5);
      }
      
      .meter-display {
        width: 100%;
        height: 100%;
        background: #07101a;
        border-radius: 4px;
        overflow: hidden;
        display: flex;
        align-items: center;
      }
      
      .meter-bar {
        width: 0%;
        height: 100%;
        background: linear-gradient(90deg, var(--accent), var(--success));
        transition: width 0.05s linear;
      }
      
      .spectrum-canvas {
        width: 100%;
        height: 100%;
        display: block;
        background: #07101a;
        border-radius: 4px;
      }
      
      .label-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--text);
      }
      
      .image-widget {
        border-radius: 6px;
        object-fit: cover;
      }
      
      .xy-pad-container {
        width: 100%;
        height: 100%;
        background: #07101a;
        border-radius: 4px;
        position: relative;
        cursor: crosshair;
        overflow: hidden;
      }
      
      .xy-thumb {
        width: 12px;
        height: 12px;
        background: var(--accent);
        border: 2px solid white;
        border-radius: 50%;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
      
      .divider-line {
        width: 100%;
        height: 100%;
        border-top: 1px solid var(--border);
      }
      
      .muted {
        color: var(--muted);
        font-size: 12px;
      }
      
      @media (max-width: 800px) {
        .controls {
          flex-wrap: wrap;
        }
        .keyboard-key {
          height: 45px;
          font-size: 8px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="title">${presetName}</div>
        <div class="muted" id="status">Loading...</div>
      </div>
      
      <div class="controls">
        <label>Master <input id="ctlGain" type="range" min="0" max="1" step="0.01" value="0.85" /></label>
        <label>Filter <select id="ctlFilterType">
          <option value="lowpass">lowpass</option>
          <option value="highpass">highpass</option>
          <option value="bandpass">bandpass</option>
        </select></label>
        <label>Cutoff <input id="ctlCutoff" type="range" min="20" max="20000" step="1" value="8000" /></label>
        <label>Q <input id="ctlQ" type="range" min="0.1" max="20" step="0.1" value="1" /></label>
        <label>Velocity <input id="ctlVelocity" type="range" min="1" max="127" step="1" value="100" /></label>
        <span id="midiStatus" class="muted">MIDI: none</span>
        <button id="btnStop">Stop All</button>
        <button id="btnRecord">Record</button>
      </div>
      
      <div class="canvas">
        ${gridPattern}
        ${widgetHTML}
      </div>
    </div>
    
    <script src="renderer.js"></script>
  </body>
</html>`;
}

const indexHtml = generateHTML(designConfig);
fs.writeFileSync(path.join(appDir, 'index.html'), indexHtml);

// Generate renderer.js - same audio engine, adapted to work with dynamic widgets
const rendererJs = `
(async () => {
  const fs = require('fs');
  const path = require('path');
  const { pathToFileURL } = require('url');
  
  const mappingPath = path.join(__dirname, '..', 'mapping.json');
  let mapping = {};
  try { mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8')); } catch (e) { console.warn('No mapping.json', e); }
  
  const assetsDir = path.join(__dirname, '..', 'assets');
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  let masterGain = null, analyser = null, mediaDest = null, biquad = null;
  const voices = new Map();
  let sustainDown = false;
  const sustained = new Set();
  const env = { attack: 0.01, decay: 0.10, sustain: 0.80, release: 0.40 };
  const samples = [];
  let currentCategory = null;
  
  async function loadSampleFile(filename) {
    try {
      const url = pathToFileURL(path.join(assetsDir, filename)).href;
      const res = await fetch(url);
      const ab = await res.arrayBuffer();
      return await audioCtx.decodeAudioData(ab);
    } catch (e) { console.warn('Failed to load', filename, e); return null; }
  }
  
  async function init() {
    const status = document.getElementById('status');
    status.innerText = 'Loading samples...';
    
    const sam = mapping.samples || [];
    for (const s of sam) {
      const buf = await loadSampleFile(s.filename);
      if (buf) samples.push({ meta: s, buffer: buf });
    }
    
    status.innerText = 'Ready - ' + samples.length + ' samples loaded';
    
    // Setup audio graph
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.85;
    biquad = audioCtx.createBiquadFilter();
    biquad.type = 'lowpass';
    biquad.frequency.value = 8000;
    biquad.Q.value = 1;
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    mediaDest = audioCtx.createMediaStreamDestination();
    
    masterGain.connect(biquad);
    biquad.connect(analyser);
    biquad.connect(mediaDest);
    analyser.connect(audioCtx.destination);
    
    // Build keyboard from all keyboard widgets
    buildKeyboards();
    window.addEventListener('resize', debounce(() => buildKeyboards(), 200));
    
    startMeter(analyser);
    startSpectrum(analyser);
    
    // Wire global controls
    const gainEl = document.getElementById('ctlGain');
    if (gainEl) gainEl.oninput = (e) => { masterGain.gain.value = Number(e.target.value); };
    
    const typeEl = document.getElementById('ctlFilterType');
    if (typeEl) typeEl.onchange = (e) => { biquad.type = e.target.value; };
    
    const cutEl = document.getElementById('ctlCutoff');
    if (cutEl) cutEl.oninput = (e) => { biquad.frequency.value = Number(e.target.value); };
    
    const qEl = document.getElementById('ctlQ');
    if (qEl) qEl.oninput = (e) => { biquad.Q.value = Number(e.target.value); };
    
    const stopBtn = document.getElementById('btnStop');
    if (stopBtn) stopBtn.onclick = () => { try { stopAll(); } catch {} };
    
    // Recording setup
    const recBtn = document.getElementById('btnRecord');
    const recLink = document.createElement('a');
    recLink.style.marginLeft = '8px';
    recLink.style.fontSize = '12px';
    let recorder = null, recChunks = [];
    
    if (recBtn) {
      recBtn.onclick = () => {
        if (!recorder || recorder.state === 'inactive') {
          try {
            recChunks = [];
            recorder = new MediaRecorder(mediaDest.stream);
            recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recChunks.push(e.data); };
            recorder.onstop = () => {
              const blob = new Blob(recChunks, { type: 'audio/webm' });
              const url = URL.createObjectURL(blob);
              recLink.href = url;
              recLink.download = 'seko-recording.webm';
              recLink.textContent = 'Download';
              recBtn.textContent = 'Record';
              if (!recBtn.nextSibling) recBtn.parentElement.appendChild(recLink);
            };
            recorder.start();
            recBtn.textContent = 'Stop';
          } catch (e) { console.warn('Record failed', e); }
        } else {
          try { recorder && recorder.state !== 'inactive' && recorder.stop(); } catch {}
        }
      };
    }
    
    setupMIDI();
  }
  
  function stopAll() {
    const now = audioCtx.currentTime;
    for (const [midi, v] of Array.from(voices.entries())) {
      try {
        const startVal = v.gainNode.gain.value;
        v.gainNode.gain.cancelScheduledValues(now);
        v.gainNode.gain.setValueAtTime(startVal, now);
        v.gainNode.gain.linearRampToValueAtTime(0, now + Math.max(0.03, env.release * 0.5));
        v.src.stop(now + Math.max(0.08, env.release * 0.5 + 0.05));
      } catch {}
      voices.delete(midi);
    }
    sustained.clear();
  }
  
  function findSampleForMidi(midi, category) {
    if (!samples.length) return null;
    let pool = samples;
    if (category) pool = samples.filter(s => (s.meta.category || 'Uncategorized') === category);
    let best = null, bestD = 1e9;
    for (const s of pool) {
      const d = Math.abs((s.meta.rootMidi || 60) - midi);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }
  
  function noteOn(buf, midi, velocity = 100) {
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    src.connect(gain);
    gain.connect(masterGain);
    
    const vel = Math.max(1, Math.min(127, Number(velocity) || 100));
    const vNorm = vel / 127;
    const vCurve = vNorm * vNorm;
    const now = audioCtx.currentTime;
    
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vCurve, now + env.attack);
    const sus = env.sustain * vCurve;
    gain.gain.linearRampToValueAtTime(sus, now + env.attack + env.decay);
    
    src.playbackRate.value = Math.pow(2, (midi - 60) / 12);
    src.start();
    voices.set(midi, { src, gainNode: gain });
  }
  
  function noteOff(midi) {
    if (sustainDown) { sustained.add(midi); return; }
    const v = voices.get(midi);
    if (!v) return;
    voices.delete(midi);
    
    const now = audioCtx.currentTime;
    try {
      const startVal = v.gainNode.gain.value;
      v.gainNode.gain.cancelScheduledValues(now);
      v.gainNode.gain.setValueAtTime(startVal, now);
      v.gainNode.gain.linearRampToValueAtTime(0, now + env.release);
      v.src.stop(now + env.release + 0.05);
    } catch {}
  }
  
  function sustainUpRelease() {
    const toRelease = Array.from(sustained.values());
    sustained.clear();
    for (const midi of toRelease) {
      const v = voices.get(midi);
      if (!v) continue;
      voices.delete(midi);
      
      const now = audioCtx.currentTime;
      try {
        const startVal = v.gainNode.gain.value;
        v.gainNode.gain.cancelScheduledValues(now);
        v.gainNode.gain.setValueAtTime(startVal, now);
        v.gainNode.gain.linearRampToValueAtTime(0, now + env.release);
        v.src.stop(now + env.release + 0.05);
      } catch {}
    }
  }
  
  function startMeter(analyser) {
    const meterEl = document.querySelector('.meter-bar');
    if (!meterEl) return;
    const data = new Uint8Array(analyser.fftSize);
    
    function loop() {
      try { analyser.getByteTimeDomainData(data); } catch (e) { requestAnimationFrame(loop); return; }
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      const pct = Math.min(100, Math.max(0, Math.round(rms * 100)));
      meterEl.style.width = pct + '%';
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
  
  function startSpectrum(analyser) {
    const canvases = document.querySelectorAll('.spectrum-canvas');
    if (canvases.length === 0) return;
    
    const buf = new Uint8Array(analyser.frequencyBinCount);
    
    function draw() {
      try { analyser.getByteFrequencyData(buf); } catch (e) { requestAnimationFrame(draw); return; }
      
      canvases.forEach(c => {
        const ctx = c.getContext('2d');
        const w = c.clientWidth;
        const h = c.clientHeight;
        
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#07101a';
        ctx.fillRect(0, 0, w, h);
        
        const barCount = Math.min(64, buf.length);
        const step = Math.floor(buf.length / barCount);
        const barW = Math.max(2, (w - (barCount - 1) * 2) / barCount);
        
        for (let i = 0; i < barCount; i++) {
          const idx = i * step;
          const mag = buf[idx] || 0;
          const pct = mag / 255;
          const barH = Math.max(2, Math.floor(pct * (h - 4)));
          const x = i * (barW + 2);
          const y = h - barH;
          
          const grad = ctx.createLinearGradient(0, y, 0, h);
          grad.addColorStop(0, '#7c3aed');
          grad.addColorStop(1, '#22c55e');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, Math.floor(barW), barH);
        }
      });
      
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
  
  function buildKeyboards() {
    const containers = document.querySelectorAll('.keyboard-container');
    containers.forEach(kb => {
      kb.innerHTML = '';
      const startMidi = Number(kb.dataset.startMidi || 48);
      const endMidi = Number(kb.dataset.endMidi || 72);
      
      for (let m = startMidi; m <= endMidi; m++) {
        const isBlack = [1, 3, 6, 8, 10].includes((m % 12));
        const k = document.createElement('div');
        k.className = 'keyboard-key' + (isBlack ? ' black' : '');
        k.dataset.midi = m;
        k.innerText = '';
        
        const down = (ev) => {
          ev.preventDefault();
          k.classList.add('active');
          const cat = currentCategory || null;
          const s = findSampleForMidi(m, cat);
          const velEl = document.getElementById('ctlVelocity');
          const vel = velEl ? Number(velEl.value) || 100 : 100;
          if (s) noteOn(s.buffer, m, vel);
        };
        
        const up = (ev) => {
          ev.preventDefault();
          k.classList.remove('active');
          noteOff(m);
        };
        
        k.addEventListener('mousedown', down);
        k.addEventListener('mouseup', up);
        k.addEventListener('mouseleave', up);
        k.addEventListener('touchstart', down, { passive: false });
        k.addEventListener('touchend', up);
        k.addEventListener('touchcancel', up);
        
        kb.appendChild(k);
      }
    });
  }
  
  async function setupMIDI() {
    const label = document.getElementById('midiStatus');
    try {
      const access = await navigator.requestMIDIAccess();
      const inputs = Array.from(access.inputs.values());
      if (!inputs.length) { if (label) label.textContent = 'MIDI: no devices'; return; }
      
      const input = inputs[0];
      if (label) label.textContent = 'MIDI: ' + (input.name || 'device');
      
      input.onmidimessage = (msg) => {
        const [status, data1, data2] = msg.data || [];
        const cmd = status & 0xf0;
        
        if (cmd === 0x90 && data2 > 0) {
          const cat = currentCategory || null;
          const s = findSampleForMidi(Number(data1), cat);
          if (s) noteOn(s.buffer, Number(data1), Number(data2));
        } else if (cmd === 0x80 || (cmd === 0x90 && data2 === 0)) {
          noteOff(Number(data1));
        } else if (cmd === 0xB0 && data1 === 64) {
          const on = Number(data2) >= 64;
          sustainDown = on;
          if (!on) sustainUpRelease();
          if (label) label.textContent = 'MIDI: ' + (input.name || 'device') + ' (Sustain ' + (on ? 'On' : 'Off') + ')';
        }
      };
    } catch (e) {
      if (label) label.textContent = 'MIDI: unavailable';
    }
  }
  
  window.addEventListener('keydown', (e) => { if (e.key === 'Shift') sustainDown = true; });
  window.addEventListener('keyup', (e) => { if (e.key === 'Shift') { sustainDown = false; sustainUpRelease(); } });
  
  function debounce(fn, wait) {
    let t = null;
    return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); };
  }
  
  window.addEventListener('DOMContentLoaded', init);
})();
`;

fs.writeFileSync(path.join(appDir, 'renderer.js'), rendererJs);

console.log('[vst-builder] electron app scaffold written to', appDir);
process.exit(0);

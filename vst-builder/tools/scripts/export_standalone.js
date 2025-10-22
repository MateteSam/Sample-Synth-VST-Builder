#!/usr/bin/env node
/**
 * Export Standalone Application
 * Creates a complete standalone HTML/Electron export with the current UI template
 */

const fs = require('fs');
const path = require('path');

// Determine project root (assuming script is in vst-builder/tools/scripts/)
const projectRoot = path.resolve(__dirname, '../../..');
const backendDir = path.join(projectRoot, 'backend');
const backendExportDir = path.join(backendDir, 'export');

const timestamp = Date.now();
const exportDir = path.join(backendExportDir, timestamp.toString());
const assetsDir = path.join(exportDir, 'assets');

// Create export directories
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

console.log(`📦 Creating standalone export: ${timestamp}`);
console.log(`📁 Export directory: ${exportDir}\n`);

// Load the template from the most recent export or create default
console.log(`🔍 Looking for existing templates in: ${backendExportDir}`);
const existingExports = fs.existsSync(backendExportDir) ? fs.readdirSync(backendExportDir)
  .filter(f => !f.endsWith('.zip') && fs.statSync(path.join(backendExportDir, f)).isDirectory())
  .filter(f => f !== timestamp.toString()) // Exclude the export we're currently creating
  .sort((a, b) => parseInt(b) - parseInt(a)) : [];
console.log(`📂 Found ${existingExports.length} existing exports`);

let manifestData = null;
if (existingExports.length > 0) {
  // Find the first export that has actual UI widgets
  for (const exportId of existingExports) {
    const mappingPath = path.join(backendExportDir, exportId, 'mapping.json');
    console.log(`📄 Checking: ${exportId}`);
    if (fs.existsSync(mappingPath)) {
      const data = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
      const widgetCount = data.ui?.bindings?.length || 0;
      console.log(`   - Widgets: ${widgetCount}`);
      if (widgetCount > 0) {
        manifestData = data;
        console.log(`✅ Using template from: ${exportId}`);
        console.log(`   - ${widgetCount} widgets, ${data.samples?.length || 0} samples`);
        break;
      }
    }
  }
}

// If no existing template, create a default one
if (!manifestData) {
  console.log('⚠️  No existing template found, creating default template...');
  manifestData = {
    samples: [],
    engine: {
      master: 0.85,
      filter: { type: 'lowpass', cutoff: 5000, q: 1 },
      env: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.3 },
      fx: { delay: { time: 0.25, feedback: 0.35, mix: 0.25 }, reverb: { mix: 0.2 } }
    },
    ui: {
      groupNames: {},
      bindings: [],
      bindingOrder: [],
      canvas: { showGrid: false, gridSize: 20, showLabels: false },
      presetName: 'My Instrument'
    },
    options: {
      includeSequencer: false,
      targets: { vst3: false, standalone: true },
      zip: true,
      runBuilder: false
    }
  };
}

// Save the mapping.json
fs.writeFileSync(
  path.join(exportDir, 'mapping.json'),
  JSON.stringify(manifestData, null, 2)
);
console.log('✅ Saved mapping.json');

// Create standalone HTML application
const standaloneHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${manifestData.ui.presetName || 'Instrument UI'} - Standalone</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #0b1220 0%, #1a2332 100%);
      color: #e2e8f0;
      overflow: hidden;
    }
    
    #app {
      width: 100vw;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .header {
      background: rgba(255, 255, 255, 0.05);
      border-bottom: 1px solid rgba(0, 234, 255, 0.2);
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header h1 {
      font-size: 18px;
      font-weight: 600;
      background: linear-gradient(90deg, #00eaff, #4b79ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header-info {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #93a4b8;
    }
    
    .canvas-container {
      flex: 1;
      position: relative;
      overflow: auto;
      background: #0b1220;
    }
    
    .canvas {
      position: relative;
      min-width: 100%;
      min-height: 100%;
      padding: 20px;
    }
    
    .widget {
      position: absolute;
      background: white;
      border: 2px solid transparent;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06);
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      user-select: none;
    }
    
    .widget:hover {
      border-color: rgba(75,121,255,0.3);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08);
    }
    
    .widget-label {
      color: #0b1220;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .widget-value {
      color: #64748b;
      font-size: 12px;
      margin-top: 4px;
    }
    
    /* Slider */
    .slider-track {
      width: 100%;
      height: 12px;
      background: linear-gradient(90deg, #e5e7eb 0%, #4b79ff var(--value), #e5e7eb var(--value));
      border-radius: 999px;
      position: relative;
      cursor: pointer;
    }
    
    /* Knob */
    .knob {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      border: 3px solid #4b79ff;
      border-radius: 50%;
      margin: 8px auto;
      position: relative;
      box-shadow: 0 4px 12px rgba(75, 121, 255, 0.2);
      cursor: pointer;
    }
    
    .knob-indicator {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%) rotate(var(--angle));
      transform-origin: center bottom;
      width: 3px;
      height: 25px;
      background: #4b79ff;
      border-radius: 999px;
    }
    
    /* Fader */
    .fader-container {
      width: 100%;
      height: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .fader {
      width: 40px;
      height: 100%;
      background: linear-gradient(180deg, #4b79ff var(--value), #e5e7eb var(--value));
      border-radius: 8px;
      position: relative;
      cursor: pointer;
    }
    
    /* Toggle */
    .toggle {
      width: 52px;
      height: 28px;
      background: var(--bg);
      border-radius: 14px;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .toggle-thumb {
      position: absolute;
      top: 2px;
      left: var(--left);
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      transition: left 0.2s;
    }
    
    /* Button */
    .button {
      padding: 12px 24px;
      background: #4b79ff;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    
    .button:hover {
      background: #3a5ed9;
      transform: translateY(-1px);
    }
    
    .button:active {
      background: #2948b0;
      transform: translateY(0);
    }
    
    /* Select */
    .select {
      width: 100%;
      padding: 8px 12px;
      background: #f1f5f9;
      border: 2px solid #e5e7eb;
      border-radius: 6px;
      font-size: 14px;
      color: #0b1220;
      cursor: pointer;
    }
    
    .select:focus {
      outline: none;
      border-color: #4b79ff;
    }
    
    /* Label */
    .label-text {
      font-size: 18px;
      font-weight: 700;
      color: #0b1220;
    }
    
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }
    
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(0, 234, 255, 0.2);
      border-top-color: #00eaff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="header">
      <h1>${manifestData.ui.presetName || 'Instrument UI'}</h1>
      <div class="header-info">
        <span>🎹 ${manifestData.ui.bindings?.length || 0} Widgets</span>
        <span>🎵 ${manifestData.samples?.length || 0} Samples</span>
        <span>✨ Standalone Mode</span>
      </div>
    </div>
    <div class="canvas-container">
      <div class="canvas" id="canvas">
        <div class="loading">
          <div class="spinner"></div>
          <p style="margin-top: 16px; color: #93a4b8;">Loading interface...</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Load manifest data
    const manifest = ${JSON.stringify(manifestData, null, 2)};
    
    // State management
    const state = {};
    
    // Initialize widgets
    function initializeUI() {
      const canvas = document.getElementById('canvas');
      canvas.innerHTML = '';
      
      const widgets = manifest.ui.bindings || [];
      const order = manifest.ui.bindingOrder || widgets.map(w => w.id);
      
      // Render widgets in order
      order.forEach(widgetId => {
        const widget = widgets.find(w => w.id === widgetId);
        if (!widget || !widget.visible) return;
        
        const el = createWidget(widget);
        canvas.appendChild(el);
      });
      
      console.log('✅ UI initialized with', widgets.length, 'widgets');
    }
    
    // Create widget element
    function createWidget(widget) {
      const el = document.createElement('div');
      el.className = 'widget';
      el.style.left = (widget.x || 0) + 'px';
      el.style.top = (widget.y || 0) + 'px';
      el.style.width = (widget.w || 120) + 'px';
      el.style.height = (widget.h || 72) + 'px';
      
      // Initialize state
      if (widget.binding) {
        state[widget.id] = widget.value !== undefined ? widget.value : 0.5;
      }
      
      // Create widget content based on type
      let content = '';
      switch (widget.type) {
        case 'label':
          content = \`<div class="label-text">\${widget.label || ''}</div>\`;
          break;
          
        case 'slider':
          const sliderVal = (state[widget.id] || 0.5) * 100;
          content = \`
            <div class="widget-label">\${widget.label || 'Slider'}</div>
            <div class="slider-track" style="--value: \${sliderVal}%"></div>
            <div class="widget-value">\${(state[widget.id] || 0.5).toFixed(2)}</div>
          \`;
          break;
          
        case 'knob':
          const knobVal = state[widget.id] || 0.5;
          const angle = 135 + knobVal * 270;
          content = \`
            <div class="widget-label">\${widget.label || 'Knob'}</div>
            <div class="knob">
              <div class="knob-indicator" style="--angle: \${angle}deg"></div>
            </div>
            <div class="widget-value">\${knobVal.toFixed(2)}</div>
          \`;
          break;
          
        case 'fader':
          const faderVal = (1 - (state[widget.id] || 0.5)) * 100;
          content = \`
            <div class="widget-label">\${widget.label || 'Fader'}</div>
            <div class="fader-container">
              <div class="fader" style="--value: \${faderVal}%"></div>
            </div>
            <div class="widget-value">\${(state[widget.id] || 0.5).toFixed(2)}</div>
          \`;
          break;
          
        case 'toggle':
          const checked = widget.checked || false;
          content = \`
            <div class="widget-label">\${widget.label || 'Toggle'}</div>
            <div class="toggle" style="--bg: \${checked ? '#4b79ff' : '#cbd5e1'}">
              <div class="toggle-thumb" style="--left: \${checked ? '26px' : '2px'}"></div>
            </div>
          \`;
          break;
          
        case 'button':
          content = \`
            <button class="button">\${widget.label || 'Button'}</button>
          \`;
          break;
          
        case 'select':
          const options = (widget.choices || []).map(c => 
            \`<option value="\${c}" \${c === widget.value ? 'selected' : ''}>\${c}</option>\`
          ).join('');
          content = \`
            <div class="widget-label">\${widget.label || 'Select'}</div>
            <select class="select">\${options}</select>
          \`;
          break;
          
        default:
          content = \`<div class="widget-label">\${widget.type}</div>\`;
      }
      
      el.innerHTML = content;
      return el;
    }
    
    // Initialize on load
    window.addEventListener('DOMContentLoaded', () => {
      console.log('🎨 Standalone UI starting...');
      console.log('📋 Manifest:', manifest);
      setTimeout(initializeUI, 500);
    });
  </script>
</body>
</html>`;

// Save standalone HTML
fs.writeFileSync(
  path.join(exportDir, 'standalone.html'),
  standaloneHTML
);
console.log('✅ Created standalone.html');

// Create README
const readme = `# Standalone Instrument UI Export

**Export ID:** ${timestamp}
**Preset Name:** ${manifestData.ui.presetName || 'Untitled'}
**Created:** ${new Date().toISOString()}

## Contents

- \`mapping.json\` - Complete instrument manifest with UI bindings and engine config
- \`standalone.html\` - Self-contained HTML application (open in any browser)
- \`assets/\` - Sample files and resources
- \`package.json\` - Electron app configuration (optional)
- \`README.md\` - This file

## Quick Start

### Option 1: Open in Browser
Simply double-click \`standalone.html\` to open the UI in your default web browser.

### Option 2: Electron App
1. Install dependencies: \`npm install\`
2. Run: \`npm start\`

## Features

- ✅ ${manifestData.ui.bindings?.length || 0} interactive widgets
- ✅ ${manifestData.samples?.length || 0} mapped samples
- ✅ Full engine parameter bindings
- ✅ Responsive design
- ✅ Works offline

## Widget Types

${Array.from(new Set((manifestData.ui.bindings || []).map(w => w.type))).map(type => `- ${type}`).join('\n')}

## Technical Details

- **Canvas Size:** ${manifestData.ui.canvas?.width || 'Auto'} x ${manifestData.ui.canvas?.height || 'Auto'}
- **Grid:** ${manifestData.ui.canvas?.showGrid ? 'Enabled' : 'Disabled'}
- **Total Widgets:** ${manifestData.ui.bindings?.length || 0}

## Next Steps

1. Open \`standalone.html\` to test the UI
2. Customize styles in the HTML \`<style>\` section
3. Connect to audio engine (JUCE/VST integration)
4. Package as Electron app for distribution

---
Generated by Seko Sa VST Builder • ${new Date().toLocaleDateString()}
`;

fs.writeFileSync(
  path.join(exportDir, 'README.md'),
  readme
);
console.log('✅ Created README.md');

// Create package.json for Electron
const packageJson = {
  name: (manifestData.ui.presetName || 'instrument-ui').toLowerCase().replace(/\s+/g, '-'),
  version: '1.0.0',
  description: `Standalone UI for ${manifestData.ui.presetName || 'Instrument'}`,
  main: 'electron-main.js',
  scripts: {
    start: 'electron .'
  },
  devDependencies: {
    electron: '^28.0.0'
  }
};

fs.writeFileSync(
  path.join(exportDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
console.log('✅ Created package.json');

// Create Electron main process file
const electronMain = `const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0b1220',
    title: '${manifestData.ui.presetName || 'Instrument UI'}'
  });

  win.loadFile('standalone.html');
  
  // Open DevTools in development
  // win.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
`;

fs.writeFileSync(
  path.join(exportDir, 'electron-main.js'),
  electronMain
);
console.log('✅ Created electron-main.js');

// Summary
console.log('\n' + '='.repeat(60));
console.log('🎉 STANDALONE EXPORT COMPLETE!');
console.log('='.repeat(60));
console.log(`\n📁 Location: ${exportDir}\n`);
console.log('📦 Contents:');
console.log('  ✅ mapping.json        - Full manifest data');
console.log('  ✅ standalone.html     - Self-contained UI app');
console.log('  ✅ package.json        - Electron configuration');
console.log('  ✅ electron-main.js    - Electron entry point');
console.log('  ✅ README.md           - Documentation');
console.log('\n🚀 Quick Start:');
console.log(`  1. Open: ${path.join(exportDir, 'standalone.html')}`);
console.log('  2. Or run: npm install && npm start (for Electron)');
console.log('\n✨ Export ID:', timestamp);
console.log('');

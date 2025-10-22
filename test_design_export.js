/**
 * Test script: Export with Simple VST design template
 * This simulates what the Design page will send when exporting
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Read current samples to include
const samplesFile = path.join(__dirname, 'backend', 'data', 'samples.json');
let samples = [];
try {
  samples = JSON.parse(fs.readFileSync(samplesFile, 'utf8'));
  console.log(`Found ${samples.length} samples`);
} catch (e) {
  console.warn('No samples file, will export with empty samples');
}

// Simple VST template design config (matches Design page's addSimpleVSTTemplate)
const designConfig = {
  bindings: [
    { id: 'lbl-title', type: 'label', label: 'Simple VST', x: 24, y: 12, w: 360, h: 36, visible: true, locked: false },
    { id: 'fdr-master', type: 'fader', label: 'Master', binding: 'masterGain', min: 0, max: 1, step: 0.01, value: 0.85, x: 16, y: 64, w: 72, h: 180, visible: true, locked: false },
    
    { id: 'knb-transpose', type: 'knob', label: 'Transpose', binding: 'transpose', min: -24, max: 24, step: 1, value: 0, x: 120, y: 64, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-glide', type: 'knob', label: 'Glide', binding: 'glideTime', min: 0, max: 0.3, step: 0.01, value: 0, x: 236, y: 64, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-moddepth', type: 'knob', label: 'Mod Depth', binding: 'modWheel', min: 0, max: 1, step: 0.01, value: 0, x: 352, y: 64, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-modrate', type: 'knob', label: 'Mod Rate', binding: 'modRate', min: 0.1, max: 10, step: 0.1, value: 5, x: 468, y: 64, w: 100, h: 96, visible: true, locked: false },
    
    { id: 'knb-attack', type: 'knob', label: 'Attack', binding: 'envelopeAttack', min: 0, max: 1, step: 0.01, value: 0.01, x: 120, y: 176, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-decay', type: 'knob', label: 'Decay', binding: 'envelopeDecay', min: 0, max: 1, step: 0.01, value: 0.2, x: 236, y: 176, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-sustain', type: 'knob', label: 'Sustain', binding: 'envelopeSustain', min: 0, max: 1, step: 0.01, value: 0.9, x: 352, y: 176, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-release', type: 'knob', label: 'Release', binding: 'envelopeRelease', min: 0, max: 1, step: 0.01, value: 0.3, x: 468, y: 176, w: 100, h: 96, visible: true, locked: false },
    
    { id: 'knb-cutoff', type: 'knob', label: 'Cutoff', binding: 'filterCutoff', min: 20, max: 20000, step: 1, value: 1200, x: 120, y: 288, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-resonance', type: 'knob', label: 'Resonance', binding: 'filterQ', min: 0.1, max: 10, step: 0.1, value: 0.7, x: 236, y: 288, w: 100, h: 96, visible: true, locked: false },
    { id: 'sel-filtertype', type: 'select', label: 'Filter Type', binding: 'filterType', choices: ['lowpass', 'highpass', 'bandpass', 'notch'], value: 'lowpass', x: 352, y: 300, w: 140, h: 56, visible: true, locked: false },
    { id: 'sel-velcurve', type: 'select', label: 'Velocity Curve', binding: 'velocityCurve', choices: ['linear', 'soft', 'hard', 'log', 'exp'], value: 'linear', x: 504, y: 300, w: 140, h: 56, visible: true, locked: false },
    
    { id: 'knb-delay', type: 'knob', label: 'Delay', binding: 'delayTime', min: 0, max: 2, step: 0.01, value: 0.25, x: 120, y: 408, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-feedback', type: 'knob', label: 'Feedback', binding: 'delayFeedback', min: 0, max: 0.95, step: 0.01, value: 0.35, x: 236, y: 408, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-delaymix', type: 'knob', label: 'Delay Mix', binding: 'delayMix', min: 0, max: 1, step: 0.01, value: 0.25, x: 352, y: 408, w: 100, h: 96, visible: true, locked: false },
    { id: 'knb-reverb', type: 'knob', label: 'Reverb', binding: 'reverbMix', min: 0, max: 1, step: 0.01, value: 0.2, x: 468, y: 408, w: 100, h: 96, visible: true, locked: false },
    
    { id: 'mtr-output', type: 'meter', label: 'Output', x: 616, y: 24, w: 120, h: 56, visible: true, locked: false },
    { id: 'spc-spectrum', type: 'spectrum', label: 'Spectrum', x: 16, y: 520, w: 760, h: 120, visible: true, locked: false },
    { id: 'kbd-keyboard', type: 'keyboard', label: 'Keyboard', startMidi: 48, endMidi: 72, x: 16, y: 660, w: 760, h: 140, visible: true, locked: false },
  ],
  bindingOrder: [
    'lbl-title',
    'fdr-master',
    'knb-transpose', 'knb-glide', 'knb-moddepth', 'knb-modrate',
    'knb-attack', 'knb-decay', 'knb-sustain', 'knb-release',
    'knb-cutoff', 'knb-resonance', 'sel-filtertype', 'sel-velcurve',
    'knb-delay', 'knb-feedback', 'knb-delaymix', 'knb-reverb',
    'mtr-output',
    'spc-spectrum',
    'kbd-keyboard'
  ],
  canvas: { showGrid: false, gridSize: 20, showLabels: false },
  presetName: 'Simple VST'
};

// Build export body
const body = {
  engine: {
    master: 0.85,
    filter: { type: 'lowpass', cutoff: 1200, q: 0.7 },
    env: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.3 },
    fx: { delay: { time: 0.25, feedback: 0.35, mix: 0.25 }, reverb: { mix: 0.2 } }
  },
  ui: { groupNames: {} },
  design: designConfig,
  options: {
    includeSequencer: false,
    targets: { vst3: false, standalone: true },
    zip: true,
    runBuilder: true,
  }
};

// Send export request
(async () => {
  try {
    console.log('Sending export request...');
    
    // Use http.request instead of fetch for better compatibility
    const jsonBody = JSON.stringify(body);
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: '/api/export_async',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(jsonBody)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', async () => {
        if (res.statusCode !== 202) throw new Error(`Export start failed: ${res.statusCode}`);
        const json = JSON.parse(data);
        const stamp = json?.stamp;
        console.log(`Export started: STAMP=${stamp}`);
        
        // Poll status
        let lastProgress = -1;
        while (true) {
          await new Promise(r => setTimeout(r, 500));
          
          const statusRes = await doHttpGet(`/api/export/status/${stamp}`);
          const status = JSON.parse(statusRes);
          
          if (Number(status.progress) !== lastProgress) {
            console.log(`[${status.progress}%] ${status.message}`);
            lastProgress = Number(status.progress);
          }
          
          if (status.error) throw new Error(status.error);
          if (Number(status.progress || 0) >= 100) break;
        }
        
        const resultRes = await doHttpGet(`/api/export/result/${stamp}`);
        const result = JSON.parse(resultRes);
        
        console.log('\n✓ Export complete!');
        console.log(`  outDir: ${result.outDir}`);
        console.log(`  zip: ${result.zip}`);
        console.log(`\nExport path: http://localhost:3000${result.outDir}`);
      });
    });
    
    req.on('error', (e) => {
      throw new Error(`Request failed: ${e.message}`);
    });
    
    req.write(jsonBody);
    req.end();
    
  } catch (e) {
    console.error('✗ Export failed:', e.message);
    process.exit(1);
  }
})();

function doHttpGet(path, attempt = 1) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          if (attempt < 8) {
            setTimeout(() => doHttpGet(path, attempt + 1).then(resolve).catch(reject), 200 * attempt);
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        } else {
          resolve(data);
        }
      });
    });

    req.on('error', (err) => {
      if (attempt < 8) {
        setTimeout(() => doHttpGet(path, attempt + 1).then(resolve).catch(reject), 200 * attempt);
      } else {
        reject(err);
      }
    });
    req.end();
  });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config();

const { ensureCoreDirs, exportDir, uploadDir } = require('./src/constants');
const tasksRouter = require('./src/routes.tasks');
const samplesRouter = require('./src/routes.samples');
const groupNamesRouter = require('./src/routes.groupNames');
const advancedExportRouter = require('./src/routes.advancedExport');
const templateExportRouter = require('./src/routes.templateExport');
const { exportJobs, ensureExportJobsStore, loadPersistedJobs, persistExportJobs, runExportJob } = require('./src/exportJobs');

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || `http://localhost:${process.env.FRONTEND_PORT || 5173}` }));
app.use(helmet());
app.use(morgan('dev'));

// Core dirs and static
ensureCoreDirs();
app.use('/uploads', express.static(uploadDir));
app.use('/export', express.static(exportDir));

// Routers moved to src/*

// Routes
app.get('/', (req, res) => {
  res.send('OK');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/tasks', tasksRouter);

app.use('/api/group-names', groupNamesRouter);
app.use('/api/samples', samplesRouter);
app.use('/api/export', advancedExportRouter);
app.use('/api/export-template', templateExportRouter);

// Export current instrument state into a JUCE-ready project scaffold (assets + mapping)
app.post('/api/export', (req, res, next) => {
  try {
    const { ensureStore, readSamples, readGroupNames } = require('./src/store');
    const { uploadDir } = require('./src/constants');
    ensureStore();
    let samples = readSamples();
    const { engine, ui, meta, sequence, options, scope, sequencer } = req.body || {};
    // Filter by selected instrument scope if provided
    if (scope && typeof scope === 'object' && scope.instrumentName) {
      const cat = String(scope.instrumentName || '').trim();
      if (cat) samples = samples.filter((s) => (s.category || 'Uncategorized') === cat);
    }
  const exportRoot = exportDir;
    const stamp = `${Date.now()}`;
    const outDir = path.join(exportRoot, stamp);
    const assetsDir = path.join(outDir, 'assets');
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(assetsDir, { recursive: true });
    // Copy assets (synchronous export)
    const mapping = [];
    const copyErrors = [];
    for (const s of samples) {
      const srcPath = path.join(uploadDir, s.filename);
      const destName = s.filename; // keep unique-safe filename
      const destPath = path.join(assetsDir, destName);
      try {
        fs.copyFileSync(srcPath, destPath);
      } catch (err) {
        // record error but continue - export should still produce mapping and instructions
        const msg = `Failed to copy ${srcPath} -> ${destPath}: ${err?.message || err}`;
        console.warn(msg);
        copyErrors.push(msg);
        // create a small placeholder file so assets folder isn't empty for packaging
        try { fs.writeFileSync(destPath + '.missing.txt', msg); } catch (_) {}
      }
      mapping.push({
        filename: destName,
        name: s.name,
        rootMidi: s.rootMidi,
        noteLow: s.noteLow ?? 0,
        noteHigh: s.noteHigh ?? 127,
        velLow: s.velLow ?? 0,
        velHigh: s.velHigh ?? 127,
        rrIndex: s.rrIndex ?? 1,
        category: s.category || 'Uncategorized',
        articulation: s.articulation || null,
        mic: s.mic || null,
      });
    }
    // Include optional engine defaults and UI metadata (e.g., groupNames, bindings, canvas, assets) in mapping.json
    const groupNames = readGroupNames();
    const mappingBundle = {
      samples: mapping,
      engine: typeof engine === 'object' ? engine : undefined,
      ui: ui && typeof ui === 'object' ? {
        ...ui,
        groupNames: ui.groupNames || groupNames, // fallback to stored groupNames
      } : { groupNames },
      meta: meta && typeof meta === 'object' ? meta : undefined,
      sequence: sequence && typeof sequence === 'object' ? sequence : undefined,
      options: (options && typeof options === 'object') ? options : undefined,
      sequencer: (options && options.includeSequencer && sequencer && typeof sequencer === 'object') ? sequencer : undefined,
    };
    fs.writeFileSync(path.join(outDir, 'mapping.json'), JSON.stringify(mappingBundle, null, 2));
    const readme = [
      '# JUCE VST Project Scaffold',
      '',
      'This folder contains exported assets and a mapping.json describing zones, velocity layers, round robin indices, and optional engine defaults.',
      '',
      'Next steps:',
      '1) Use a JUCE C++ template (AudioProcessor/AudioProcessorEditor) to load mapping.json and assets.',
      '2) For each note-on, select sample by category/articulation/mic, velocity, and rrIndex.',
      '3) Adjust playback rate by semitone offset: pow(2, (midi - rootMidi)/12).',
      '4) Apply engine defaults from mapping.json.engine (master, ADSR, filter, delay, reverb, limiter, velocityCurve).',
      '5) If mapping.json.options is present, honor export flags (targets, includeSequencer, scope).',
      '',
      'You can point your build system to assets/ and mapping.json. A CMakeLists.txt template can be added here if desired.',
      '',
      'If you are on Windows and have CMake + JUCE available, a helper script "build_export.ps1" is included at the repository root to attempt a local build for an export stamp.',
      'Run it like: powershell -ExecutionPolicy Bypass -File build_export.ps1 -Stamp <stamp>',
    ].join('\n');
    fs.writeFileSync(path.join(outDir, 'README.md'), readme);

    // Add a minimal JUCE/CMake scaffold to help building VST3 / Standalone targets.
    try {
      const projDir = path.join(outDir, 'project');
      const projSrc = path.join(projDir, 'src');
      fs.mkdirSync(projSrc, { recursive: true });
      const cmake = [
        'cmake_minimum_required(VERSION 3.15)',
        'project(SekoSaExportProject)',
        '# This is a minimal CMake template. To build a JUCE plugin or standalone you will need JUCE as a dependency.',
        '# Recommended: use the official JUCE distribution and follow their CMake instructions:',
        '# https://juce.com/learn/documentation/cmake-projects',
        '',
        '# Add your JUCE and platform-specific setup here. This file intentionally does not attempt to fetch JUCE automatically.',
      ].join('\n');
      fs.writeFileSync(path.join(projDir, 'CMakeLists.txt'), cmake);
      const sampleCpp = [
        '// Minimal plugin loader example (pseudo-code).',
        '// Replace with actual JUCE AudioProcessor/AudioProcessorEditor implementation.',
        '#include <iostream>',
        '#include <fstream>',
        '#include <nlohmann/json.hpp> // optional - if you use a JSON lib',
        '',
        'int main() {',
        '  std::cout << "This is a template project. Replace with your JUCE plugin code.\n";',
        '  std::ifstream f("mapping.json");',
        '  if (f) {',
        '    std::cout << "mapping.json present in export root. Use it from your plugin to map assets.\n";',
        '  } else {',
        '    std::cout << "mapping.json not found.\n";',
        '  }',
        '  return 0;',
        '}',
      ].join('\n');
      fs.writeFileSync(path.join(projSrc, 'main.cpp'), sampleCpp);
      const buildInstructions = [
        'BUILD INSTRUCTIONS',
        '',
        '1) Install JUCE (https://juce.com/get-juce) and follow their CMake build instructions.',
        '2) Create a CMake target for an AudioProcessor (VST3) or an AudioApplication (standalone) that loads mapping.json and assets/.',
        '3) Copy mapping.json and assets/ into your binary distribution or load them from a known path at runtime.',
        '4) For VST3: ensure you build with the VST3 SDK enabled and set proper plugin IDs and manifests.',
        '',
        'This scaffold is intentionally lightweight. See JUCE documentation for complete examples.',
      ].join('\n');
      fs.writeFileSync(path.join(projDir, 'BUILD_INSTRUCTIONS.txt'), buildInstructions);
    } catch (e) {
      console.warn('Failed to write project scaffold:', e?.message || e);
    }

    // Optionally create a ZIP of the export folder (Windows-only via PowerShell)
    let zipRel = null;
    try {
      const wantZip = options && typeof options === 'object' ? !!options.zip : true;
      if (wantZip) {
        const zipAbs = path.join(exportRoot, `${stamp}.zip`);
        const cmd = `Compress-Archive -Path '${outDir}' -DestinationPath '${zipAbs}' -Force`;
        // Silent execution; ignore errors on non-Windows or if PowerShell not available
        spawnSync(process.platform === 'win32' ? 'powershell' : 'pwsh', ['-NoProfile', '-Command', cmd], { stdio: 'ignore' });
        if (fs.existsSync(zipAbs)) zipRel = `/export/${stamp}.zip`;
      }
    } catch (_) {}

    res.status(201).json({ success: true, outDir: `/export/${stamp}`, zip: zipRel });
  } catch (e) {
    next(e);
  }
});

// (404 and subsequent handlers are at the end of the file)

app.post('/api/export_async', (req, res, next) => {
  try {
    console.log('[export_async] Received request');
    const stamp = `${Date.now()}`;
    console.log('[export_async] Starting async job with stamp:', stamp);
    setImmediate(() => {
      try {
        console.log('[runExportJob] Starting for stamp:', stamp);
        // use shared module implementation to avoid duplication
        const { runExportJob } = require('./src/exportJobs');
        runExportJob(req.body || {}, stamp);
      } catch (e) {
        console.error('Export job error:', e);
        const { exportJobs, persistExportJobs } = require('./src/exportJobs');
        exportJobs.set(stamp, { progress: 100, message: 'Failed', outDir: null, zip: null, error: String(e?.message || e), cancelled: false });
        persistExportJobs();
      }
    });
    res.status(202).json({ stamp });
  } catch (e) {
    console.error('[export_async] Error:', e);
    next(e);
  }
});

app.get('/api/export/status/:stamp', (req, res) => {
  const { exportJobs } = require('./src/exportJobs');
  const st = exportJobs.get(req.params.stamp) || { progress: 0, message: 'Pending', outDir: null, zip: null, error: null, cancelled: false };
  res.json(st);
});

app.get('/api/export/result/:stamp', (req, res) => {
  const { exportJobs } = require('./src/exportJobs');
  const st = exportJobs.get(req.params.stamp);
  if (!st || !st.outDir) return res.status(404).json({ error: 'Not ready' });
  res.json({ outDir: st.outDir, zip: st.zip });
});

// Cancel an export job
app.post('/api/export/cancel/:stamp', (req, res) => {
  const { exportJobs, persistExportJobs } = require('./src/exportJobs');
  const stamp = req.params.stamp;
  const job = exportJobs.get(stamp);
  if (!job) return res.status(404).json({ error: 'Unknown job' });
  exportJobs.set(stamp, { ...job, cancelled: true, message: 'Cancel requested' });
  persistExportJobs();
  res.json({ success: true });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Initialize export jobs store
ensureExportJobsStore();
loadPersistedJobs();

app.listen(port, host, () => {
  console.log(`Backend server listening at http://${host}:${port}`);
});
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ensureStore, readSamples, readGroupNames } = require('./store');
const { dataDir, exportDir, uploadDir } = require('./constants');

const exportJobs = new Map();
const exportJobsFile = path.join(dataDir, 'exportJobs.json');

function ensureExportJobsStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(exportJobsFile)) fs.writeFileSync(exportJobsFile, JSON.stringify({}), 'utf-8');
}

function loadPersistedJobs() {
  try {
    ensureExportJobsStore();
    const raw = fs.readFileSync(exportJobsFile, 'utf-8') || '{}';
    const parsed = JSON.parse(raw);
    for (const [k, v] of Object.entries(parsed || {})) exportJobs.set(k, v);
  } catch (e) {
    console.warn('Failed to load exportJobs store:', e?.message || e);
  }
}

function persistExportJobs() {
  try {
    const obj = Object.fromEntries(exportJobs.entries());
    fs.writeFileSync(exportJobsFile, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to persist exportJobs:', e?.message || e);
  }
}

function runExportJob(body, stamp) {
  try {
    ensureStore();
    let samples = readSamples();
    const { engine, ui, meta, sequence, options, scope, sequencer } = body || {};
    console.log('[export] UI bindings received:', ui?.bindings?.length || 0, 'widgets');
    exportJobs.set(stamp, { progress: 5, message: 'Preparing project…', outDir: null, zip: null, error: null, cancelled: false });
    persistExportJobs();

    if (scope && typeof scope === 'object' && scope.instrumentName) {
      const cat = String(scope.instrumentName || '').trim();
      if (cat) samples = samples.filter((s) => (s.category || 'Uncategorized') === cat);
    }

    const outDir = path.join(exportDir, stamp);
    const assetsDir = path.join(outDir, 'assets');
    fs.mkdirSync(outDir, { recursive: true });
    fs.mkdirSync(assetsDir, { recursive: true });

    // Copy assets with progress
    const total = Math.max(1, samples.length);
    let copied = 0;
    for (const s of samples) {
      const cur = exportJobs.get(stamp) || {};
      if (cur.cancelled) {
        exportJobs.set(stamp, { progress: 100, message: 'Cancelled', outDir: null, zip: null, error: null, cancelled: true });
        persistExportJobs();
        return;
      }
      const srcPath = path.join(uploadDir, s.filename);
      const destName = s.filename;
      const destPath = path.join(assetsDir, destName);
      try { fs.copyFileSync(srcPath, destPath); } catch {}
      copied++;
      const pct = Math.min(60, Math.floor(10 + (copied / total) * 50));
      exportJobs.set(stamp, { progress: pct, message: `Copying assets (${copied}/${total})…`, outDir: null, zip: null, error: null, cancelled: false });
      persistExportJobs();
    }

    // mapping.json
    const mapping = samples.map((s) => ({
      filename: s.filename,
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
    }));

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
    exportJobs.set(stamp, { progress: 80, message: 'Writing mapping.json…', outDir: `/export/${stamp}`, zip: null, error: null, cancelled: false });
    persistExportJobs();

    fs.writeFileSync(path.join(outDir, 'README.md'), [
      '# JUCE VST Project Scaffold',
      '',
      'This folder contains exported assets and a mapping.json describing zones, velocity layers, round robin indices, and optional engine defaults.',
      '',
      'Refer to JUCE docs to wire this mapping into an AudioProcessor or standalone app.',
    ].join('\n'));

    // Optional ZIP
    let zipRel = null;
    try {
      const wantZip = options && typeof options === 'object' ? !!options.zip : true;
      exportJobs.set(stamp, { progress: 90, message: 'Creating ZIP…', outDir: `/export/${stamp}`, zip: null, error: null, cancelled: false });
      persistExportJobs();
      if (wantZip) {
        const cur = exportJobs.get(stamp) || {};
        if (cur.cancelled) {
          exportJobs.set(stamp, { progress: 100, message: 'Cancelled', outDir: null, zip: null, error: null, cancelled: true });
          persistExportJobs();
          return;
        }
        const zipAbs = path.join(exportDir, `${stamp}.zip`);
        const cmd = `Compress-Archive -Path '${path.join(exportDir, stamp)}' -DestinationPath '${zipAbs}' -Force`;
        spawnSync(process.platform === 'win32' ? 'powershell' : 'pwsh', ['-NoProfile', '-Command', cmd], { stdio: 'ignore' });
        if (fs.existsSync(zipAbs)) zipRel = `/export/${stamp}.zip`;
      }
    } catch (_) {}

    exportJobs.set(stamp, { progress: 100, message: 'Done', outDir: `/export/${stamp}`, zip: zipRel, error: null, cancelled: false });
    persistExportJobs();
  } catch (e) {
    exportJobs.set(stamp, { progress: 100, message: 'Failed', outDir: null, zip: null, error: String(e?.message || e), cancelled: false });
    persistExportJobs();
  }
}

module.exports = {
  exportJobs,
  ensureExportJobsStore,
  loadPersistedJobs,
  persistExportJobs,
  runExportJob,
};

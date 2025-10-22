const fs = require('fs');
const path = require('path');
const {
  dataDir,
  tasksFile,
  samplesFile,
  groupNamesFile,
} = require('./constants');

function ensureStore() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(tasksFile)) fs.writeFileSync(tasksFile, JSON.stringify([]));
    if (!fs.existsSync(samplesFile)) fs.writeFileSync(samplesFile, JSON.stringify([]));
    if (!fs.existsSync(groupNamesFile)) fs.writeFileSync(groupNamesFile, JSON.stringify({}));
  } catch (e) {
    // ignore
  }
}

function readJsonSafe(file, fallback) {
  try {
    ensureStore();
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function readTasks() { return readJsonSafe(tasksFile, []); }
function writeTasks(tasks) { writeJson(tasksFile, tasks); }

function readSamples() { return readJsonSafe(samplesFile, []); }
function writeSamples(samples) { writeJson(samplesFile, samples); }

function readGroupNames() { return readJsonSafe(groupNamesFile, {}); }
function writeGroupNames(obj) { writeJson(groupNamesFile, obj || {}); }

// Filename parsing helpers
function parseNoteFromFilename(name) {
  try {
    const base = path.basename(name);
    const match = base.match(/([A-Ga-g])([#b])?\s*(\d)/);
    if (match) {
      const letter = match[1].toUpperCase();
      const accidental = match[2] || '';
      const octave = Number(match[3]);
      const map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
      let semi = map[letter];
      if (accidental === '#') semi += 1;
      if (accidental === 'b') semi -= 1;
      return 12 * (octave + 1) + semi;
    }
    const numMatch = base.match(/(?:^|[_\-\s])(\d{1,3})(?=[_\-\s]|\.|$)/);
    if (numMatch) {
      const midi = Number(numMatch[1]);
      if (!Number.isNaN(midi) && midi >= 0 && midi <= 127) return midi;
    }
    return null;
  } catch {
    return null;
  }
}

function parseVelocityFromFilename(name) {
  try {
    const base = path.basename(name).toLowerCase();
    const dyn = base.match(/dynamic\s*([1-3])/);
    if (dyn) {
      const d = Number(dyn[1]);
      if (d === 1) return { velLow: 0, velHigh: 50 };
      if (d === 2) return { velLow: 40, velHigh: 90 };
      if (d === 3) return { velLow: 80, velHigh: 127 };
    }
    const vel = base.match(/vel[_\-]?(\d{2,3})/);
    if (vel) {
      const v = Number(vel[1]);
      if (!Number.isNaN(v)) {
        const low = Math.max(0, v - 16);
        const high = Math.min(127, v + 16);
        return { velLow: low, velHigh: high };
      }
    }
    return null;
  } catch {
    return null;
  }
}

function parseRoundRobinFromFilename(name) {
  try {
    const base = path.basename(name).toLowerCase();
    const rr = base.match(/rr[_\-]?(\d{1,2})/);
    if (rr) {
      const idx = Number(rr[1]);
      if (!Number.isNaN(idx) && idx >= 1) return idx;
    }
    return null;
  } catch {
    return null;
  }
}

function parseMicFromFilename(name) {
  try {
    const base = path.basename(name).toLowerCase();
    if (/(close|spot|near)/.test(base)) return 'Close';
    if (/(room|far|ambient)/.test(base)) return 'Room';
    if (/(overhead|oh)/.test(base)) return 'Overhead';
    if (/(mid|middle)/.test(base)) return 'Mid';
    if (/decca/.test(base)) return 'Decca';
    return null;
  } catch {
    return null;
  }
}

module.exports = {
  ensureStore,
  readTasks,
  writeTasks,
  readSamples,
  writeSamples,
  readGroupNames,
  writeGroupNames,
  parseNoteFromFilename,
  parseVelocityFromFilename,
  parseRoundRobinFromFilename,
  parseMicFromFilename,
};

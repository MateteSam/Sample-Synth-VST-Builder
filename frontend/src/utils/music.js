export const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToName(midi) {
  const octave = Math.floor(midi / 12) - 1;
  const index = ((midi % 12) + 12) % 12;
  return `${NOTE_NAMES[index]}${octave}`;
}

export function noteNameToMidi(name) {
  if (!name) return null;
  const m = /^\s*([A-Ga-g])([#b]?)(-?\d+)\s*$/.exec(name);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const accidental = m[2];
  const octave = parseInt(m[3], 10);
  const baseMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let idx = baseMap[letter];
  if (accidental === '#') idx += 1;
  if (accidental === 'b') idx -= 1;
  return idx + (octave + 1) * 12; // C4 = 60
}

export function parseNoteFromFilename(filename) {
  if (!filename) return null;
  // Prefer musical note names like C4, D#3, Db3
  const m = filename.match(/([A-Ga-g][#b]?)(-?\d+)/);
  if (m) return noteNameToMidi(m[0]);
  // Fallback: accept MIDI numbers embedded (e.g., _24_)
  const num = filename.match(/(?:^|[\s_\-])(\d{1,3})(?=[\s_\-]|\.|$)/);
  if (num) {
    const midi = Number(num[1]);
    if (!Number.isNaN(midi) && midi >= 0 && midi <= 127) return midi;
  }
  return null;
}

// HISE-style velocity parsing: DYNAMIC1/2/3 or VEL080
export function parseVelocityFromFilename(filename) {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  const dyn = lower.match(/dynamic\s*([1-3])/);
  if (dyn) {
    const d = Number(dyn[1]);
    if (d === 1) return { velLow: 0, velHigh: 50 };
    if (d === 2) return { velLow: 40, velHigh: 90 };
    if (d === 3) return { velLow: 80, velHigh: 127 };
  }
  const vel = lower.match(/vel[_\-]?(\d{2,3})/);
  if (vel) {
    const v = Number(vel[1]);
    if (!Number.isNaN(v)) {
      const low = Math.max(0, v - 16);
      const high = Math.min(127, v + 16);
      return { velLow: low, velHigh: high };
    }
  }
  return null;
}

// HISE-style round robin parsing: RR1, rr-02
export function parseRoundRobinFromFilename(filename) {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  const rr = lower.match(/rr[_\-]?(\d{1,2})/);
  if (rr) {
    const idx = Number(rr[1]);
    if (!Number.isNaN(idx) && idx >= 1) return idx;
  }
  return null;
}

// Mic position parsing: CLOSE, ROOM, FAR, OH/OVERHEAD, SPOT, MID, DECCA, AMBIENT
export function parseMicFromFilename(filename) {
  if (!filename) return null;
  const lower = filename.toLowerCase();
  if (/(close|spot|near)/.test(lower)) return 'Close';
  if (/(room|far|ambient)/.test(lower)) return 'Room';
  if (/(overhead|oh)/.test(lower)) return 'Overhead';
  if (/(mid|middle)/.test(lower)) return 'Mid';
  if (/decca/.test(lower)) return 'Decca';
  return null;
}
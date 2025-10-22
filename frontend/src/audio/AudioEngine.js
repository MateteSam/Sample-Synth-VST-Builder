import { parseNoteFromFilename, parseVelocityFromFilename, parseRoundRobinFromFilename, parseMicFromFilename } from '../utils/music.js';

export default class AudioEngine {
  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.smoothingTimeConstant = 0.85;
    this.analyser.fftSize = 1024;
    // Output stream for recording
    this.outStreamDest = this.ctx.createMediaStreamDestination();
    // Simple master limiter
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -6;
    this.limiter.knee.value = 6;
    this.limiter.ratio.value = 3;
    this.limiter.attack.value = 0.003;
    this.limiter.release.value = 0.25;
    this.master.connect(this.limiter);
    this.limiter.connect(this.ctx.destination);
    this.limiter.connect(this.analyser);
    this.limiter.connect(this.outStreamDest);
    this.samples = []; // { id, name, buffer, rootMidi, noteLow, noteHigh, velLow, velHigh }
    this.env = { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.5 };
    this.filter = { type: 'lowpass', cutoff: 20000, q: 0 };
    this.fx = { delayTime: 0, delayFeedback: 0, delayMix: 0, reverbMix: 0 };
    this.voices = new Map(); // midi -> array of active voices
    this._sustain = false;
    this._sostenuto = false;
    this._heldForSostenuto = new Set();
    this.velocityCurve = 'linear';
    this.currentArticulation = {}; // category -> articulation or null
    this.currentMic = {}; // category -> mic or null
    this.currentRRMode = {}; // category -> rr mode: 'cycle' | 'random' | 'off'
    this._rrCounters = new Map(); // selection key -> counter
    // Pitch and modulation controls
    this.transpose = 0;
    this.glideTime = 0; // seconds
    this._lastMidi = null;
    this._lastMidiByCategory = {};
    this._modRate = 5; // Hz
    this._modDepth = 0; // 0..1
    this._modOsc = this.ctx.createOscillator();
    this._modOsc.frequency.value = this._modRate;
    try { this._modOsc.start(); } catch {}
  }

  setMasterGain(value) {
    this.master.gain.value = value;
  }

  setLimiter(enabled) {
    try {
      this.master.disconnect();
      this.limiter.disconnect();
    } catch {}
    if (enabled) {
      try {
        this.master.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);
        this.limiter.connect(this.analyser);
        this.limiter.connect(this.outStreamDest);
      } catch {}
    } else {
      try {
        this.master.connect(this.ctx.destination);
        this.master.connect(this.analyser);
        this.master.connect(this.outStreamDest);
      } catch {}
    }
  }

  async loadFile(file, categoryHint) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arrayBuffer);
    const rootMidi = parseNoteFromFilename(file.name) ?? 60; // default C4
    // Derive category from relative path (first folder) or provided hint
    let category = 'Uncategorized';
    let articulation = null;
    try {
      const rel = file.webkitRelativePath || '';
      if (rel && rel.includes('/')) {
        const parts = rel.split('/');
        category = parts[0] || category;
        articulation = parts[1] || null;
      } else if (categoryHint) {
        category = categoryHint;
      }
    } catch {}
    const vel = parseVelocityFromFilename(file.name);
    const rrIndex = parseRoundRobinFromFilename(file.name) ?? 1;
    const mic = parseMicFromFilename(file.name) || null;
    const sample = {
      id: crypto.randomUUID(),
      name: file.name,
      buffer,
      rootMidi,
      category,
      articulation,
      mic,
      noteLow: 0,
      noteHigh: 127,
      velLow: vel?.velLow ?? 0,
      velHigh: vel?.velHigh ?? 127,
      rrIndex,
    };
    this.samples.push(sample);
    this._recalculateNoteRangesForGroup(category, articulation);
    return sample;
  }

  async loadUrl(name, url, rootMidi = 60, category = 'Uncategorized', meta = {}) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch sample: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(arrayBuffer);
    return this.addBuffer(name, buffer, rootMidi, category, meta);
  }

  addBuffer(name, buffer, rootMidi = 60, category = 'Uncategorized', meta = {}) {
    const sample = {
      id: crypto.randomUUID(),
      name,
      buffer,
      rootMidi,
      category,
      articulation: meta.articulation || null,
      mic: meta.mic || null,
      noteLow: meta.noteLow ?? 0,
      noteHigh: meta.noteHigh ?? 127,
      velLow: meta.velLow ?? 0,
      velHigh: meta.velHigh ?? 127,
      rrIndex: meta.rrIndex ?? 1,
    };
    this.samples.push(sample);
    this._recalculateNoteRangesForGroup(category, sample.articulation || null);
    return sample;
  }

  getSamples() { return [...this.samples]; }

  clearSamples() {
    try { this.stopAllVoices?.(true); } catch {}
    this.samples = [];
  }

  findSample(midi, velocity) {
    const inRange = this.samples.filter(
      (s) => midi >= s.noteLow && midi <= s.noteHigh && velocity >= s.velLow && velocity <= s.velHigh
    );
    if (inRange.length > 0) {
      // Choose closest root, then rotate among equal-root RR variants
      const sorted = inRange.sort((a, b) => Math.abs(midi - a.rootMidi) - Math.abs(midi - b.rootMidi));
      const bestDistance = Math.abs(midi - sorted[0].rootMidi);
      const tie = sorted.filter((x) => Math.abs(midi - x.rootMidi) === bestDistance);
      if (tie.length <= 1) return sorted[0];
      const key = `global|root:${tie[0].rootMidi}|vel:${tie[0].velLow}-${tie[0].velHigh}`;
      const rrNext = this._nextRR(key, tie.map((t) => t.rrIndex));
      const chosen = tie.find((t) => t.rrIndex === rrNext) || tie[0];
      return chosen;
    }
    if (this.samples.length === 0) return null;
    // Fallback: closest by pitch, ignoring ranges
    let best = null; let bestD = Infinity;
    for (const s of this.samples) {
      const d = Math.abs(midi - s.rootMidi);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  findSampleInCategory(midi, velocity, category, articulation, mic, rrMode) {
    const cat = (category || 'Uncategorized');
    let candidates = this.samples.filter(
      (s) => (s.category || 'Uncategorized') === cat &&
        midi >= s.noteLow && midi <= s.noteHigh && velocity >= s.velLow && velocity <= s.velHigh
    );
    if (articulation) candidates = candidates.filter((s) => (s.articulation || null) === articulation);
    if (mic) candidates = candidates.filter((s) => (s.mic || null) === mic);
    if (candidates.length > 0) {
      candidates.sort((a, b) => Math.abs(midi - a.rootMidi) - Math.abs(midi - b.rootMidi));
      const bestDistance = Math.abs(midi - candidates[0].rootMidi);
      const tie = candidates.filter((x) => Math.abs(midi - x.rootMidi) === bestDistance);
      if (tie.length <= 1) return candidates[0];
      const artKey = articulation || 'any';
      const micKey = mic || 'any';
      const key = `cat:${cat}|art:${artKey}|mic:${micKey}|root:${tie[0].rootMidi}|vel:${tie[0].velLow}-${tie[0].velHigh}`;
      const mode = rrMode || 'cycle';
      let chosen;
      if (mode === 'random') {
        const idx = Math.floor(Math.random() * tie.length);
        chosen = tie[idx];
      } else if (mode === 'off') {
        chosen = tie[0];
      } else {
        const rrNext = this._nextRR(key, tie.map((t) => t.rrIndex));
        chosen = tie.find((t) => t.rrIndex === rrNext) || tie[0];
      }
      return chosen;
    }
    // Fallback: ignore articulation/mic and ranges, pick closest pitch in category
    const byCat = this.samples.filter((s) => (s.category || 'Uncategorized') === cat);
    if (byCat.length === 0) return null;
    let best = null; let bestD = Infinity;
    for (const s of byCat) {
      const d = Math.abs(midi - s.rootMidi);
      if (d < bestD) { bestD = d; best = s; }
    }
    return best;
  }

  playNote(midi, velocity = 100) { this.noteOn(midi, velocity); }

  playNoteCategory(midi, velocity = 100, category) { this.noteOnCategory(midi, velocity, category); }

  noteOn(midi, velocity = 100) {
    const s = this.findSample(midi, velocity);
    if (!s) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = s.buffer;

    // Filter
    const biq = this.ctx.createBiquadFilter();
    biq.type = this.filter.type || 'lowpass';
    biq.frequency.value = this.filter.cutoff || 20000;
    biq.Q.value = this.filter.q || 0.0001;

    // Amplitude envelope (gate-controlled)
    const amp = this.ctx.createGain();
    let v = Math.max(0, Math.min(1, velocity / 127));
    switch (this.velocityCurve) {
      case 'soft': v = Math.sqrt(v); break;
      case 'hard': v = v * v; break;
      case 'log': v = Math.log1p(v * 9) / Math.log1p(10); break;
      case 'exp': v = (Math.exp(v) - 1) / (Math.E - 1); break;
      default: break; // linear
    }
    const peak = Math.max(0.05, Math.min(1, v));
    amp.gain.cancelScheduledValues(now);
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(peak, now + this.env.attack);
    amp.gain.linearRampToValueAtTime(peak * this.env.sustain, now + this.env.attack + this.env.decay);

    // Attach global mod wheel (tremolo)
    const modGain = this.ctx.createGain();
    modGain.gain.value = this._modDepth || 0;
    try { this._modOsc.connect(modGain); modGain.connect(amp.gain); } catch {}

    // Delay FX (send)
    const delay = this.ctx.createDelay(2.0);
    delay.delayTime.value = this.fx.delayTime || 0;
    const fb = this.ctx.createGain();
    fb.gain.value = this.fx.delayFeedback || 0;
    delay.connect(fb).connect(delay);
    const delayOut = this.ctx.createGain();
    delayOut.gain.value = this.fx.delayMix || 0;

    // Reverb FX (simple impulse)
    const convolver = this.ctx.createConvolver();
    if (!this._impulse) this._impulse = this._createImpulse(2.5, 2.0);
    convolver.buffer = this._impulse;
    const revOut = this.ctx.createGain();
    revOut.gain.value = this.fx.reverbMix || 0;

    // Routing
    src.connect(biq);
    biq.connect(amp);
    amp.connect(this.master);
    amp.connect(delay);
    delay.connect(delayOut).connect(this.master);
    amp.connect(convolver);
    convolver.connect(revOut).connect(this.master);

    const semitones = (midi + (this.transpose || 0)) - s.rootMidi;
    const targetRate = Math.pow(2, semitones / 12);
    const prev = this._lastMidi;
    if (this.glideTime > 0 && prev != null) {
      const prevRate = Math.pow(2, (prev - s.rootMidi) / 12);
      src.playbackRate.setValueAtTime(prevRate, now);
      src.playbackRate.linearRampToValueAtTime(targetRate, now + this.glideTime);
    } else {
      src.playbackRate.value = targetRate;
    }
    src.start();
    this._lastMidi = midi + (this.transpose || 0);

    const voice = { midi, src, amp, modGain, startedAt: now, sample: s };
    const arr = this.voices.get(midi) || [];
    arr.push(voice);
    this.voices.set(midi, arr);
    return voice;
  }

  noteOnCategory(midi, velocity = 100, category, articulationOverride, micOverride, rrModeOverride, options) {
    const cat = category || 'Uncategorized';
    const art = (articulationOverride !== undefined && articulationOverride !== null)
      ? articulationOverride
      : (this.currentArticulation[cat] || null);
    const mic = (micOverride !== undefined && micOverride !== null)
      ? micOverride
      : (this.currentMic[cat] || null);
    const rrMode = (rrModeOverride !== undefined && rrModeOverride !== null)
      ? rrModeOverride
      : (this.currentRRMode[cat] || 'cycle');
    const s = this.findSampleInCategory(midi, velocity, cat, art, mic, rrMode);
    if (!s) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = s.buffer;

    // Filter
    const biq = this.ctx.createBiquadFilter();
    biq.type = this.filter.type || 'lowpass';
    biq.frequency.value = this.filter.cutoff || 20000;
    biq.Q.value = this.filter.q || 0.0001;

    // Amplitude envelope (gate-controlled)
    const amp = this.ctx.createGain();
    const trackGain = Math.max(0, Math.min(1, (options?.gain ?? 1)));
    const trackPan = Math.max(-1, Math.min(1, (options?.pan ?? 0)));
    let v = Math.max(0, Math.min(1, velocity / 127));
    switch (this.velocityCurve) {
      case 'soft': v = Math.sqrt(v); break;
      case 'hard': v = v * v; break;
      case 'log': v = Math.log1p(v * 9) / Math.log1p(10); break;
      case 'exp': v = (Math.exp(v) - 1) / (Math.E - 1); break;
      default: break; // linear
    }
    const peakBase = Math.max(0.05, Math.min(1, v));
    const peak = Math.max(0.0, Math.min(1.0, peakBase * trackGain));
    amp.gain.cancelScheduledValues(now);
    amp.gain.setValueAtTime(0, now);
    amp.gain.linearRampToValueAtTime(peak, now + this.env.attack);
    amp.gain.linearRampToValueAtTime(peak * this.env.sustain, now + this.env.attack + this.env.decay);

    // Attach global mod wheel (tremolo)
    const modGain = this.ctx.createGain();
    modGain.gain.value = this._modDepth || 0;
    try { this._modOsc.connect(modGain); modGain.connect(amp.gain); } catch {}

    // Delay FX (send)
    const delay = this.ctx.createDelay(2.0);
    delay.delayTime.value = this.fx.delayTime || 0;
    const fb = this.ctx.createGain();
    fb.gain.value = this.fx.delayFeedback || 0;
    delay.connect(fb).connect(delay);
    const delayOut = this.ctx.createGain();
    delayOut.gain.value = this.fx.delayMix || 0;

    // Reverb FX (simple impulse)
    const convolver = this.ctx.createConvolver();
    if (!this._impulse) this._impulse = this._createImpulse(2.5, 2.0);
    convolver.buffer = this._impulse;
    const revOut = this.ctx.createGain();
    revOut.gain.value = this.fx.reverbMix || 0;

    // Routing
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = trackPan;
    src.connect(biq);
    biq.connect(amp);
    amp.connect(panner);
    panner.connect(this.master);
    amp.connect(delay);
    delay.connect(delayOut).connect(this.master);
    amp.connect(convolver);
    convolver.connect(revOut).connect(this.master);

    const semitones = (midi + (this.transpose || 0)) - s.rootMidi;
    const targetRate = Math.pow(2, semitones / 12);
    const prev = this._lastMidiByCategory[cat];
    if (this.glideTime > 0 && prev != null) {
      const prevRate = Math.pow(2, (prev - s.rootMidi) / 12);
      src.playbackRate.setValueAtTime(prevRate, now);
      src.playbackRate.linearRampToValueAtTime(targetRate, now + this.glideTime);
    } else {
      src.playbackRate.value = targetRate;
    }
    src.start();
    this._lastMidiByCategory[cat] = midi + (this.transpose || 0);

    const voice = { midi, src, amp, modGain, startedAt: now, sample: s };
    const arr = this.voices.get(midi) || [];
    arr.push(voice);
    this.voices.set(midi, arr);
    return voice;
  }

  noteOff(midi) {
    const now = this.ctx.currentTime;
    const arr = this.voices.get(midi);
    if (!arr || arr.length === 0) return;
    const voice = arr.pop();
    // Sustain and Sostenuto handling
    if (this._sustain || (this._sostenuto && this._heldForSostenuto.has(midi))) {
      // Put voice back to be released when pedal is lifted
      const parked = this.voices.get(`sustain:${midi}`) || [];
      parked.push(voice);
      this.voices.set(`sustain:${midi}`, parked);
      if (arr.length === 0) this.voices.delete(midi); else this.voices.set(midi, arr);
      return;
    }
    if (arr.length === 0) this.voices.delete(midi); else this.voices.set(midi, arr);
    try {
      const current = voice.amp.gain.value;
      voice.amp.gain.cancelScheduledValues(now);
      voice.amp.gain.setValueAtTime(current, now);
      voice.amp.gain.linearRampToValueAtTime(0.0001, now + this.env.release);
      // Disconnect modulation for this voice
      try { voice.modGain?.disconnect?.(); } catch {}
      voice.src.stop(now + this.env.release + 0.02);
    } catch (e) {
      // ignore
    }
  }

  setSustain(on) {
    const now = this.ctx.currentTime;
    this._sustain = !!on;
    if (!this._sustain) {
      // Release parked voices
      for (const [key, voices] of Array.from(this.voices.entries())) {
        if (!String(key).startsWith('sustain:')) continue;
        for (const v of voices) {
          try {
            const current = v.amp.gain.value;
            v.amp.gain.cancelScheduledValues(now);
            v.amp.gain.setValueAtTime(current, now);
            v.amp.gain.linearRampToValueAtTime(0.0001, now + this.env.release);
            v.src.stop(now + this.env.release + 0.02);
          } catch {}
        }
        this.voices.delete(key);
      }
    }
  }

  setSostenuto(on) {
    this._sostenuto = !!on;
    if (this._sostenuto) {
      // Mark currently held notes to be sustained when released
      this._heldForSostenuto = new Set(Array.from(this.voices.keys()).filter((k) => typeof k === 'number'));
    } else {
      this._heldForSostenuto.clear();
    }
  }

  setVelocityCurve(curve) {
    this.velocityCurve = curve || 'linear';
  }

  setEnvelope({ attack, decay, sustain, release }) {
    if (attack != null) this.env.attack = attack;
    if (decay != null) this.env.decay = decay;
    if (sustain != null) this.env.sustain = sustain;
    if (release != null) this.env.release = release;
  }

  setFilter({ type, cutoff, q }) {
    if (type) this.filter.type = type;
    if (cutoff != null) this.filter.cutoff = cutoff;
    if (q != null) this.filter.q = q;
  }

  setDelay({ time, feedback, mix }) {
    if (time != null) this.fx.delayTime = time;
    if (feedback != null) this.fx.delayFeedback = feedback;
    if (mix != null) this.fx.delayMix = mix;
  }

  setReverbMix(mix) { this.fx.reverbMix = mix; }

  // New controls
  setTranspose(semitones) { this.transpose = Math.round(semitones || 0); }
  setGlide(seconds) { this.glideTime = Math.max(0, Number(seconds || 0)); }
  setModRate(hz) { this._modRate = Math.max(0.1, Math.min(12, Number(hz || 5))); try { this._modOsc.frequency.value = this._modRate; } catch {} }
  setModWheel(value) {
    const depth = Math.max(0, Math.min(1, Number(value) / 127));
    this._modDepth = depth;
    try {
      for (const arr of this.voices.values()) {
        for (const v of arr || []) {
          if (v.modGain) v.modGain.gain.value = depth;
        }
      }
    } catch {}
  }

  // Stop all currently sounding voices (including sustained ones) to avoid cross-group overlays
  stopAllVoices(immediate = true) {
    const now = this.ctx.currentTime;
    for (const [key, arr] of Array.from(this.voices.entries())) {
      for (const v of arr || []) {
        try {
          const current = v.amp.gain.value;
          v.amp.gain.cancelScheduledValues(now);
          v.amp.gain.setValueAtTime(current, now);
          const releaseTime = immediate ? 0.005 : this.env.release;
          v.amp.gain.linearRampToValueAtTime(0.0001, now + releaseTime);
          try { v.modGain?.disconnect?.(); } catch {}
          v.src.stop(now + releaseTime + 0.02);
        } catch {}
      }
      this.voices.delete(key);
    }
    this._heldForSostenuto.clear?.();
  }

  _createImpulse(duration = 2, decay = 2) {
    const rate = this.ctx.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }
  setArticulation(category, articulation) {
    this.currentArticulation[category || 'Uncategorized'] = articulation || null;
  }

  setMic(category, mic) {
    this.currentMic[category || 'Uncategorized'] = mic || null;
  }

  setRRMode(category, mode) {
    const m = (mode === 'random' || mode === 'off' || mode === 'cycle') ? mode : 'cycle';
    this.currentRRMode[category || 'Uncategorized'] = m;
  }

  _nextRR(key, indices = []) {
    if (!indices || indices.length === 0) return 1;
    const uniq = Array.from(new Set(indices)).sort((a, b) => a - b);
    const cur = this._rrCounters.get(key) || 0;
    const nextIdx = (cur + 1) % uniq.length;
    const next = uniq[nextIdx];
    this._rrCounters.set(key, nextIdx);
    return next;
  }

  _recalculateNoteRangesForGroup(category, articulation) {
    const cat = category || 'Uncategorized';
    let group = this.samples.filter((s) => (s.category || 'Uncategorized') === cat);
    if (articulation) group = group.filter((s) => (s.articulation || null) === articulation);
    if (group.length === 0) return;
    const sorted = group.slice().sort((a, b) => a.rootMidi - b.rootMidi);
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const prev = sorted[i - 1] || null;
      const next = sorted[i + 1] || null;
      const low = prev ? Math.floor((prev.rootMidi + cur.rootMidi) / 2) : 0;
      const high = next ? Math.ceil((cur.rootMidi + next.rootMidi) / 2) : 127;
      cur.noteLow = Math.max(0, low);
      cur.noteHigh = Math.min(127, high);
    }
  }

  resetRR() {
    try { this._rrCounters.clear(); } catch {}
  }

  // Return MediaStream of the engine’s master output for recording
  getOutputStream() {
    return this.outStreamDest?.stream || null;
  }
}
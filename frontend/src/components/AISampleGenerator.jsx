import React, { useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';

async function renderOffline(options = {}) {
  const { duration = 2.0, type = 'sine', frequency = 220, attack = 0.02, decay = 0.2, sustain = 0.7, release = 0.3, filterCutoff = 12000 } = options;
  const sampleRate = 44100;
  const ctx = new OfflineAudioContext(1, Math.floor(sampleRate * duration), sampleRate);
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = frequency;
  const amp = ctx.createGain();
  const now = 0;
  amp.gain.setValueAtTime(0, now);
  amp.gain.linearRampToValueAtTime(1, now + attack);
  amp.gain.linearRampToValueAtTime(sustain, now + attack + decay);
  amp.gain.setValueAtTime(sustain, duration - release);
  amp.gain.linearRampToValueAtTime(0.0001, duration);
  const biq = ctx.createBiquadFilter();
  biq.type = 'lowpass';
  biq.frequency.value = filterCutoff;
  osc.connect(biq).connect(amp).connect(ctx.destination);
  osc.start();
  osc.stop(duration);
  const buffer = await ctx.startRendering();
  return buffer;
}

function chooseSettings(prompt) {
  const p = (prompt || '').toLowerCase();
  if (p.includes('pluck') || p.includes('plucky')) {
    return { type: 'triangle', frequency: 330, attack: 0.005, decay: 0.15, sustain: 0.2, release: 0.2, filterCutoff: 9000 };
  }
  if (p.includes('bass')) {
    return { type: 'sawtooth', frequency: 55, attack: 0.02, decay: 0.5, sustain: 0.8, release: 0.6, filterCutoff: 2000 };
  }
  if (p.includes('drone')) {
    return { type: 'sine', frequency: 110, attack: 0.6, decay: 0.4, sustain: 0.9, release: 1.2, filterCutoff: 4000 };
  }
  if (p.includes('metal') || p.includes('fm')) {
    return { type: 'square', frequency: 440, attack: 0.02, decay: 0.3, sustain: 0.6, release: 0.4, filterCutoff: 12000 };
  }
  return { type: 'sine', frequency: 220, attack: 0.02, decay: 0.2, sustain: 0.7, release: 0.3, filterCutoff: 12000 };
}

export default function AISampleGenerator({ engine, onGenerated }) {
  const [prompt, setPrompt] = useState('A warm, analog-style pad with a slow filter sweep');
  const [busy, setBusy] = useState(false);
  const { manifest, addSamples } = useInstrument();

  const generate = async () => {
    setBusy(true);
    try {
      const settings = chooseSettings(prompt);
      const buffer = await renderOffline({ duration: 3.0, ...settings });
      const category = manifest.ui?.selectedInstrument || 'Uncategorized';
      engine.addBuffer(`AI-${prompt.slice(0,32)}`, buffer, 60, category);
      const list = engine.getSamples();
      try { addSamples(list); } catch {}
      onGenerated && onGenerated(list);
    } catch (e) {
      console.error('AI generation failed', e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card compact">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong>AI Sample Generator</strong>
        <label className="row gap"><input type="checkbox" defaultChecked /> <span className="muted">Velocity Crossfade</span></label>
      </div>
      <div className="space" />
      <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={3} style={{ width: '100%', background:'#0b1220', border:'1px solid var(--border)', color:'var(--text)', borderRadius:8, padding:10 }} />
      <div className="space" />
      <div className="row wrap">
        <button className="secondary" onClick={generate} disabled={busy}>{busy ? 'Generating…' : 'Generate Sample'}</button>
        <span className="muted">Describe a sound. Examples: “soft plucky synth”, “deep bass drone”, “bright FM metallic”.</span>
      </div>
    </div>
  );
}
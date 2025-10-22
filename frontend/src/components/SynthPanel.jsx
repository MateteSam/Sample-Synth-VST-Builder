import React, { useEffect, useRef, useState } from 'react';

export default function SynthPanel({ engine }) {
  const [env, setEnv] = useState({ attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.5 });
  const [filter, setFilter] = useState({ type: 'lowpass', cutoff: 20000, q: 0 });
  const [delay, setDelay] = useState({ time: 0, feedback: 0, mix: 0 });
  const [reverbMix, setReverbMix] = useState(0);
  // Pitch and modulation
  const [transpose, setTranspose] = useState(0);
  const [glide, setGlide] = useState(0);
  const [modRate, setModRate] = useState(5);
  const canvasRef = useRef(null);

  useEffect(() => { engine.setEnvelope(env); }, [env, engine]);
  useEffect(() => { engine.setFilter(filter); }, [filter, engine]);
  useEffect(() => { engine.setDelay(delay); }, [delay, engine]);
  useEffect(() => { engine.setReverbMix(reverbMix); }, [reverbMix, engine]);
  useEffect(() => { engine.setTranspose(transpose); }, [transpose, engine]);
  useEffect(() => { engine.setGlide(glide); }, [glide, engine]);
  useEffect(() => { engine.setModRate(modRate); }, [modRate, engine]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const w = c.clientWidth, h = c.clientHeight;
    c.width = w * devicePixelRatio; c.height = h * devicePixelRatio;
    const ctx = c.getContext('2d');
    ctx.scale(devicePixelRatio, devicePixelRatio);
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
    const start = 10, end = w - 10, base = h - 10;
    const a = env.attack * 100;
    const d = env.decay * 100;
    const sLvl = env.sustain;
    const r = env.release * 100;
    const total = a + d + r + 100;
    const ax = start + (a/total)*(end-start);
    const dx = ax + (d/total)*(end-start);
    const rx = dx + ((r+100)/total)*(end-start);
    ctx.beginPath();
    ctx.moveTo(start, base);
    ctx.lineTo(ax, 10);
    ctx.lineTo(dx, base - sLvl*(base-10));
    ctx.lineTo(rx, base);
    ctx.stroke();
  }, [env]);

  return (
    <div>
  <div className="muted mb-8">Envelope</div>
  <canvas ref={canvasRef} className="panel-canvas" />
  <div className="space" />
  <div className="row wrap gap-8">
        <label className="row gap"><span className="muted">Attack</span><input type="number" min={0} step={0.01} value={env.attack} onChange={(e)=>setEnv(v=>({...v, attack:Number(e.target.value)}))} /></label>
        <label className="row gap"><span className="muted">Decay</span><input type="number" min={0} step={0.01} value={env.decay} onChange={(e)=>setEnv(v=>({...v, decay:Number(e.target.value)}))} /></label>
        <label className="row gap"><span className="muted">Sustain</span><input type="number" min={0} max={1} step={0.01} value={env.sustain} onChange={(e)=>setEnv(v=>({...v, sustain:Number(e.target.value)}))} /></label>
        <label className="row gap"><span className="muted">Release</span><input type="number" min={0} step={0.01} value={env.release} onChange={(e)=>setEnv(v=>({...v, release:Number(e.target.value)}))} /></label>
      </div>
  
  <div className="space" />
  <div className="muted mb-6">Filter</div>
  <div className="row wrap gap-8">
        <label className="row gap"><span className="muted">Cutoff</span><input type="number" min={20} max={20000} value={filter.cutoff} onChange={(e)=>setFilter(v=>({...v, cutoff:Number(e.target.value)}))} /></label>
        <label className="row gap"><span className="muted">Resonance</span><input type="number" min={0} max={30} step={0.1} value={filter.q} onChange={(e)=>setFilter(v=>({...v, q:Number(e.target.value)}))} /></label>
        <label className="row gap"><span className="muted">Type</span>
          <select value={filter.type} onChange={(e)=>setFilter(v=>({...v, type:e.target.value}))}>
            <option value="lowpass">Lowpass</option>
            <option value="highpass">Highpass</option>
            <option value="bandpass">Bandpass</option>
          </select>
        </label>
      </div>
  <div className="space" />
  <div className="muted mb-6">Delay</div>
  <div className="row wrap gap-8">
        <label className="row gap"><span className="muted">Time</span><input type="number" min={0} max={2} step={0.01} value={delay.time} onChange={(e)=>setDelay(v=>({...v, time:Number(e.target.value)}))} /></label>
        <label className="row gap"><span className="muted">Feedback</span><input type="number" min={0} max={0.99} step={0.01} value={delay.feedback} onChange={(e)=>setDelay(v=>({...v, feedback:Number(e.target.value)}))} /></label>
        <label className="row gap"><span className="muted">Mix</span><input type="number" min={0} max={1} step={0.01} value={delay.mix} onChange={(e)=>setDelay(v=>({...v, mix:Number(e.target.value)}))} /></label>
      </div>
  <div className="space" />
  <div className="muted mb-6">Reverb</div>
  <label className="row gap"><span className="muted">Mix</span><input type="number" min={0} max={1} step={0.01} value={reverbMix} onChange={(e)=>setReverbMix(Number(e.target.value))} /></label>

  <div className="space" />
  <div className="muted mb-6">Pitch & Modulation</div>
  <div className="row wrap gap-8">
        <label className="row gap"><span className="muted">Transpose</span><input type="number" min={-24} max={24} step={1} value={transpose} onChange={(e)=>setTranspose(Number(e.target.value))} /></label>
        <label className="row gap"><span className="muted">Glide (s)</span><input type="number" min={0} max={2} step={0.01} value={glide} onChange={(e)=>setGlide(Number(e.target.value))} /></label>
        <label className="row gap"><span className="muted">Mod Rate (Hz)</span><input type="number" min={0.1} max={12} step={0.1} value={modRate} onChange={(e)=>setModRate(Number(e.target.value))} /></label>
      </div>
    </div>
  );
}
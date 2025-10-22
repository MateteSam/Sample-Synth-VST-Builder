import React, { useEffect, useRef, useState } from 'react';

export default function MasterMeter({ engine }) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    if (!engine?.analyser) return;
    const a = engine.analyser;
    a.smoothingTimeConstant = 0.85;
    a.fftSize = 1024;
    const data = new Uint8Array(a.frequencyBinCount);
    const loop = () => {
      a.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128; // -1..1
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length); // 0..1
      setLevel(rms);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine]);

  const pct = Math.min(100, Math.max(0, Math.round(level * 100)));
  return (
    <div className="row" style={{ alignItems: 'center', gap: 8 }}>
      <span className="muted" style={{ minWidth: 60 }}>Level</span>
      <div style={{ flex: 1, height: 8, background: '#0b1220', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--primary)' }} />
      </div>
    </div>
  );
}
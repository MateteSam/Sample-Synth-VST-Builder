import React, { useRef, useState, useEffect } from 'react';

// Pitch wheel: vertical drag, range [-1, 1], springs back to 0 on release
export default function PitchWheel({ label = 'Pitch', value = 0, onChange, height = 120 }) {
  const [v, setV] = useState(Number(value) || 0);
  const ref = useRef(null);

  useEffect(() => { setV(Number(value) || 0); }, [value]);

  function handlePointerDown(e) {
    e.preventDefault();
    const startY = e.clientY;
    const startV = v;
    const range = Math.max(60, height - 40);
    const onMove = (ev) => {
      const dy = ev.clientY - startY;
      let nv = startV - dy / range * 2; // scale approx
      nv = Math.max(-1, Math.min(1, nv));
      setV(nv);
      onChange?.(nv);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      // spring to center
      setV(0); onChange?.(0);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  const pct = (v + 1) / 2; // 0..1
  const trackH = Math.max(60, height - 40);

  return (
    <div className="wheel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div ref={ref} className="wheel-track" onPointerDown={handlePointerDown}
           style={{ position: 'relative', width: 42, height: trackH + 20, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.2))', boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.35), 0 8px 16px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ position: 'absolute', left: '50%', top: 10 + (1 - pct) * trackH, transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: 14, background: 'radial-gradient(circle at 30% 30%, #7dd3fc, #0284c7 60%, #0b1020)', boxShadow: '0 4px 10px rgba(0,0,0,0.5), inset 0 2px 6px rgba(255,255,255,0.2)' }} />
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: 18, height: 2, background: 'rgba(255,255,255,0.2)', transform: 'translate(-50%, -50%)' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</div>
    </div>
  );
}

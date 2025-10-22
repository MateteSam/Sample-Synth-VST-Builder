import React, { useEffect, useRef } from 'react';

export default function SpectrumVisualizer({ engine, height = 100, smoothing = 0.8, fftSize = 2048, barColor = '#22c55e' }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const c = canvasRef.current;
    const a = engine?.analyser;
    if (!c || !a) return;
    a.smoothingTimeConstant = Math.max(0, Math.min(1, smoothing));
    a.fftSize = fftSize;
    const buf = new Uint8Array(a.frequencyBinCount);

    const draw = () => {
      const w = c.clientWidth;
      const h = c.clientHeight;
      c.width = Math.max(1, Math.floor(w * devicePixelRatio));
      c.height = Math.max(1, Math.floor(h * devicePixelRatio));
      const ctx = c.getContext('2d');
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, w, h);

      try {
        a.getByteFrequencyData(buf);
      } catch {}

      const barCount = Math.min(64, buf.length);
      const step = Math.floor(buf.length / barCount);
      const barW = Math.max(2, (w - (barCount - 1) * 2) / barCount);
      for (let i = 0; i < barCount; i++) {
        const idx = i * step;
        const magnitude = buf[idx] || 0; // 0..255
        const pct = magnitude / 255;
        const barH = Math.max(2, Math.floor(pct * (h - 4)));
        const x = i * (barW + 2);
        const y = h - barH;
        // Gradient per bar
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, barColor);
        grad.addColorStop(1, '#3b82f6');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, Math.floor(barW), barH);
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine, smoothing, fftSize, barColor]);

  return (
    <div className="spectrum" style={{ width: '100%', height, background: '#0b1220', border: '1px solid var(--border)', borderRadius: 8 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}
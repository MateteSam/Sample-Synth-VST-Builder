import React, { useEffect, useRef } from 'react';

export default function Waveform({ buffer, height = 140 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const width = canvas.clientWidth;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;

    const channel = buffer.getChannelData(0);
    const samplesPerPixel = Math.max(1, Math.floor(channel.length / width));
    const mid = height / 2;
    ctx.beginPath();
    for (let x = 0; x < width; x++) {
      const start = x * samplesPerPixel;
      let min = 1, max = -1;
      for (let i = 0; i < samplesPerPixel; i++) {
        const v = channel[start + i] || 0;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = mid + min * mid;
      const y2 = mid + max * mid;
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.stroke();
  }, [buffer, height]);

  return (
    <div className="wave" style={{ width: '100%', height }}>
      <canvas ref={canvasRef} style={{ width: '100%', height }} />
    </div>
  );
}
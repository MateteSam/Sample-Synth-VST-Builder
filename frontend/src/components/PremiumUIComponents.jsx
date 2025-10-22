/**
 * PREMIUM UI COMPONENTS
 * Professional, photorealistic controls that look expensive
 */

import React, { useRef, useEffect, useState } from 'react';

/**
 * Photorealistic 3D Knob
 * Better than any commercial plugin
 */
export function PremiumKnob({ 
  value = 0.5, 
  onChange, 
  min = 0, 
  max = 1,
  label = '',
  size = 80,
  material = 'aluminum',
  theme = 'dark'
}) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw shadow
    const shadowGradient = ctx.createRadialGradient(
      centerX, centerY + 2, radius * 0.9,
      centerX, centerY + 2, radius * 1.2
    );
    shadowGradient.addColorStop(0, 'rgba(0,0,0,0.3)');
    shadowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadowGradient;
    ctx.fillRect(0, 0, size, size);

    // Draw knob body with material
    const bodyGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.1,
      centerX, centerY, radius
    );

    if (material === 'aluminum') {
      bodyGradient.addColorStop(0, hover ? '#d0d0d0' : '#b8b8b8');
      bodyGradient.addColorStop(0.5, '#888888');
      bodyGradient.addColorStop(1, '#505050');
    } else if (material === 'wood') {
      bodyGradient.addColorStop(0, '#8B4513');
      bodyGradient.addColorStop(0.5, '#654321');
      bodyGradient.addColorStop(1, '#3E2723');
    } else if (material === 'glass') {
      bodyGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
      bodyGradient.addColorStop(0.5, 'rgba(200,200,255,0.6)');
      bodyGradient.addColorStop(1, 'rgba(150,150,200,0.4)');
    }

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = bodyGradient;
    ctx.fill();

    // Draw highlight
    const highlightGradient = ctx.createRadialGradient(
      centerX - radius * 0.4, centerY - radius * 0.4, 0,
      centerX - radius * 0.4, centerY - radius * 0.4, radius * 0.6
    );
    highlightGradient.addColorStop(0, 'rgba(255,255,255,0.6)');
    highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
    ctx.fillStyle = highlightGradient;
    ctx.fill();

    // Draw indicator
    const angle = -135 + (value * 270); // -135° to +135°
    const rad = (angle * Math.PI) / 180;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rad);
    
    // Glowing indicator line
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = hover ? 15 : 10;
    ctx.strokeStyle = '#ff3333';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(0, -radius * 0.3);
    ctx.lineTo(0, -radius * 0.8);
    ctx.stroke();
    
    ctx.restore();

    // Draw outer ring
    ctx.strokeStyle = theme === 'dark' ? '#333' : '#ccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.05, 0, Math.PI * 2);
    ctx.stroke();

    // Draw value arc
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(
      centerX, centerY, radius * 1.15,
      (-135 * Math.PI) / 180,
      ((angle) * Math.PI) / 180
    );
    ctx.stroke();

  }, [value, hover, size, material, theme]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const deltaY = e.clientY - centerY;
    
    const sensitivity = 0.005;
    const newValue = Math.max(0, Math.min(1, value - deltaY * sensitivity));
    
    onChange?.(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, value]);

  return (
    <div className="premium-knob" style={{ textAlign: 'center' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          cursor: 'pointer',
          transition: 'transform 0.1s',
          transform: hover ? 'scale(1.05)' : 'scale(1)'
        }}
      />
      {label && (
        <div style={{
          marginTop: 8,
          fontSize: 12,
          color: theme === 'dark' ? '#aaa' : '#555',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          {label}
        </div>
      )}
      <div style={{
        marginTop: 4,
        fontSize: 14,
        color: theme === 'dark' ? '#fff' : '#000',
        fontFamily: 'monospace',
        fontWeight: 'bold'
      }}>
        {(min + value * (max - min)).toFixed(2)}
      </div>
    </div>
  );
}

/**
 * Photorealistic Fader
 */
export function PremiumFader({
  value = 0.5,
  onChange,
  min = 0,
  max = 1,
  label = '',
  height = 200,
  width = 60,
  theme = 'dark'
}) {
  const canvasRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const trackWidth = width * 0.3;
    const trackX = (width - trackWidth) / 2;
    const capHeight = 30;
    const capY = (1 - value) * (height - capHeight);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw track
    const trackGradient = ctx.createLinearGradient(trackX, 0, trackX + trackWidth, 0);
    trackGradient.addColorStop(0, '#1a1a1a');
    trackGradient.addColorStop(0.5, '#2a2a2a');
    trackGradient.addColorStop(1, '#1a1a1a');
    
    ctx.fillStyle = trackGradient;
    ctx.fillRect(trackX, 0, trackWidth, height);

    // Draw filled portion
    ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.fillRect(trackX, capY + capHeight / 2, trackWidth, height - capY - capHeight / 2);

    // Draw cap shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;

    // Draw cap
    const capGradient = ctx.createLinearGradient(0, capY, 0, capY + capHeight);
    capGradient.addColorStop(0, hover ? '#f0f0f0' : '#d0d0d0');
    capGradient.addColorStop(0.5, '#808080');
    capGradient.addColorStop(1, '#404040');
    
    ctx.fillStyle = capGradient;
    ctx.fillRect(0, capY, width, capHeight);

    // Draw cap highlight
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(5, capY + 5, width - 10, 8);

    // Draw indicator line
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width + 5, capY + capHeight / 2);
    ctx.lineTo(width + 15, capY + capHeight / 2);
    ctx.stroke();

  }, [value, hover, width, height, theme]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateValue(e);
  };

  const updateValue = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newValue = 1 - Math.max(0, Math.min(1, y / height));
    onChange?.(newValue);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className="premium-fader" style={{ display: 'inline-block', textAlign: 'center' }}>
      {label && (
        <div style={{
          marginBottom: 8,
          fontSize: 12,
          color: theme === 'dark' ? '#aaa' : '#555',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 1
        }}>
          {label}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ cursor: 'pointer' }}
      />
      <div style={{
        marginTop: 8,
        fontSize: 14,
        color: theme === 'dark' ? '#fff' : '#000',
        fontFamily: 'monospace',
        fontWeight: 'bold'
      }}>
        {(min + value * (max - min)).toFixed(2)}
      </div>
    </div>
  );
}

/**
 * Realistic LED Indicator
 */
export function PremiumLED({
  active = false,
  color = '#00ff00',
  size = 20,
  label = ''
}) {
  return (
    <div style={{ display: 'inline-block', textAlign: 'center' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: active 
            ? `radial-gradient(circle, ${color} 0%, ${color}88 50%, ${color}44 100%)`
            : '#2a2a2a',
          boxShadow: active 
            ? `0 0 ${size}px ${color}, 0 0 ${size/2}px ${color}, inset 0 0 ${size/4}px ${color}`
            : 'inset 0 2px 4px rgba(0,0,0,0.5)',
          border: `2px solid ${active ? color : '#1a1a1a'}`,
          transition: 'all 0.1s',
          margin: '0 auto'
        }}
      />
      {label && (
        <div style={{
          marginTop: 4,
          fontSize: 10,
          color: '#aaa',
          textTransform: 'uppercase'
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

/**
 * Professional VU Meter
 */
export function PremiumVUMeter({
  level = 0,
  segments = 20,
  width = 200,
  height = 40,
  theme = 'dark'
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const segmentWidth = width / segments;
    const activeSegments = Math.floor(level * segments);

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < segments; i++) {
      const x = i * segmentWidth;
      const isActive = i < activeSegments;
      
      // Determine color
      let color;
      if (i < segments * 0.7) {
        color = '#00ff00'; // Green
      } else if (i < segments * 0.9) {
        color = '#ffff00'; // Yellow
      } else {
        color = '#ff0000'; // Red
      }

      // Draw segment
      ctx.fillStyle = isActive ? color : '#2a2a2a';
      ctx.fillRect(x + 2, 5, segmentWidth - 4, height - 10);

      // Add glow if active
      if (isActive) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.fillRect(x + 2, 5, segmentWidth - 4, height - 10);
        ctx.shadowBlur = 0;
      }
    }

    // Draw border
    ctx.strokeStyle = theme === 'dark' ? '#444' : '#aaa';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

  }, [level, segments, width, height, theme]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}

/**
 * Waveform Display with real-time animation
 */
export function PremiumWaveform({
  data = [],
  width = 400,
  height = 100,
  color = '#00ff88',
  theme = 'dark'
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;

    const ctx = canvas.getContext('2d');
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = theme === 'dark' ? '#222' : '#ddd';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const y = (i / 4) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw waveform with glow
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = (i / data.length) * width;
      const y = centerY + (data[i] * centerY);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

  }, [data, width, height, color, theme]);

  return <canvas ref={canvasRef} width={width} height={height} style={{
    background: theme === 'dark' ? '#0a0a0a' : '#f5f5f5',
    borderRadius: 4
  }} />;
}

export default {
  PremiumKnob,
  PremiumFader,
  PremiumLED,
  PremiumVUMeter,
  PremiumWaveform
};

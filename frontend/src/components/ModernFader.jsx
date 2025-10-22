import { useState, useRef, useEffect } from 'react';
import EditableText from './EditableText';

export default function ModernFader({ 
  label = 'Fader', 
  value = 0.5, 
  min = 0, 
  max = 1, 
  onChange,
  onLabelChange,
  height = 120,
  color = '#4b79ff',
  orientation = 'vertical' // 'vertical' or 'horizontal'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e);
    e.preventDefault();
  };

  const updateValue = (e) => {
    if (!trackRef.current) return;

    const rect = trackRef.current.getBoundingClientRect();
    let newValue;

    if (orientation === 'vertical') {
      const y = Math.max(0, Math.min(rect.height, rect.bottom - e.clientY));
      newValue = min + (y / rect.height) * (max - min);
    } else {
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      newValue = min + (x / rect.width) * (max - min);
    }

    if (onChange) {
      onChange(newValue);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      updateValue(e);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = orientation === 'vertical' ? 'ns-resize' : 'ew-resize';
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, orientation]);

  const containerStyle = orientation === 'vertical' 
    ? { height, width: 60 } 
    : { width: height, height: 60, flexDirection: 'row' };

  const trackStyle = orientation === 'vertical'
    ? { height: '100%', width: 12 }
    : { width: '100%', height: 12 };

  const thumbStyle = orientation === 'vertical'
    ? { bottom: `${percentage}%`, left: '50%', transform: 'translate(-50%, 50%)' }
    : { left: `${percentage}%`, top: '50%', transform: 'translate(-50%, -50%)' };

  const fillStyle = orientation === 'vertical'
    ? { height: `${percentage}%`, width: '100%' }
    : { width: `${percentage}%`, height: '100%' };

  return (
    <div className="modern-fader-container" style={containerStyle}>
      {orientation === 'vertical' && (
        <EditableText 
          value={label}
          onChange={onLabelChange}
          className="modern-fader-label"
        />
      )}
      <div 
        ref={trackRef}
        className={`modern-fader-track ${orientation} ${isDragging ? 'dragging' : ''}`}
        style={{ ...trackStyle, '--fader-color': color }}
        onMouseDown={handleMouseDown}
      >
        <div className="fader-fill" style={fillStyle} />
        <div className="fader-thumb" style={thumbStyle} />
      </div>
      {orientation === 'horizontal' && (
        <EditableText 
          value={label}
          onChange={onLabelChange}
          className="modern-fader-label"
        />
      )}
      <div className="modern-fader-value">
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  );
}

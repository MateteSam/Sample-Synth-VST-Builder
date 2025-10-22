import { useState, useRef, useEffect } from 'react';
import EditableText from './EditableText';

export default function ModernKnob({ 
  label = 'Knob', 
  value = 0.5, 
  min = 0, 
  max = 1, 
  onChange,
  onLabelChange,
  size = 64,
  color = '#4b79ff'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(value);
  const knobRef = useRef(null);

  const rotation = -140 + (value - min) / (max - min) * 280; // -140° to +140°

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaY = startY - e.clientY;
      const sensitivity = 0.005;
      const newValue = Math.max(min, Math.min(max, startValue + deltaY * sensitivity * (max - min)));
      
      if (onChange) {
        onChange(newValue);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    } else {
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, [isDragging, startY, startValue, min, max, onChange]);

  return (
    <div className="modern-knob-container" style={{ width: size + 40 }}>
      <EditableText 
        value={label}
        onChange={onLabelChange}
        className="modern-knob-label"
      />
      <div 
        ref={knobRef}
        className={`modern-knob ${isDragging ? 'dragging' : ''}`}
        style={{ 
          width: size, 
          height: size,
          '--knob-rotation': `${rotation}deg`,
          '--knob-color': color
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="knob-body">
          <div className="knob-indicator" />
          <div className="knob-center" />
        </div>
      </div>
      <div className="modern-knob-value">
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  );
}

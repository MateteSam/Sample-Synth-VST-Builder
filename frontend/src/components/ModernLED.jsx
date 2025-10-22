import { useState } from 'react';
import EditableText from './EditableText';

export default function ModernLED({ 
  label = 'LED', 
  value = false,
  onChange,
  onLabelChange,
  color = '#4b79ff',
  size = 'medium', // 'small', 'medium', 'large'
  clickable = true
}) {
  const sizeMap = {
    small: 12,
    medium: 16,
    large: 24
  };

  const ledSize = sizeMap[size] || 16;

  const handleClick = () => {
    if (clickable && onChange) {
      onChange(!value);
    }
  };

  return (
    <div className="modern-led-container">
      <div 
        className={`modern-led ${value ? 'on' : 'off'} ${clickable ? 'clickable' : ''}`}
        style={{ 
          width: ledSize, 
          height: ledSize,
          '--led-color': color,
          '--led-glow': value ? color : 'transparent'
        }}
        onClick={handleClick}
      >
        <div className="led-inner" />
        <div className="led-highlight" />
      </div>
      {label && (
        <EditableText 
          value={label}
          onChange={onLabelChange}
          className="modern-led-label"
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import EditableText from './EditableText';

export default function ModernButton({ 
  label = 'Button', 
  onClick,
  onLabelChange,
  variant = 'primary', // 'primary', 'secondary', 'accent', 'danger'
  size = 'medium', // 'small', 'medium', 'large'
  icon = null,
  active = false
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    if (onClick) {
      onClick();
    }
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  return (
    <button
      className={`modern-button ${variant} ${size} ${isPressed ? 'pressed' : ''} ${active ? 'active' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {icon && <span className="button-icon">{icon}</span>}
      <EditableText 
        value={label}
        onChange={onLabelChange}
        className="modern-button-label"
        as="span"
      />
    </button>
  );
}

import { useState, useRef, useEffect } from 'react';

export default function EditableText({ 
  value, 
  onChange, 
  className = '', 
  placeholder = 'Click to edit',
  as = 'span',
  multiline = false 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (multiline) {
        inputRef.current.select();
      } else {
        inputRef.current.setSelectionRange(0, inputRef.current.value.length);
      }
    }
  }, [isEditing, multiline]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  const Tag = as;

  if (!isEditing) {
    return (
      <Tag
        className={`editable-text ${className}`}
        onClick={() => setIsEditing(true)}
        style={{ cursor: 'pointer' }}
        title="Click to edit"
      >
        {value || placeholder}
      </Tag>
    );
  }

  if (multiline) {
    return (
      <textarea
        ref={inputRef}
        className={`editable-text-input ${className}`}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={3}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      className={`editable-text-input ${className}`}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
    />
  );
}

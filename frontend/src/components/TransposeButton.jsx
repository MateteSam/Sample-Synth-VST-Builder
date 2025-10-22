import React from 'react';

export default function TransposeButton({ value = 0, onChange, step = 1 }) {
  const val = Number(value) || 0;
  return (
    <button
      className="transpose-btn"
      onClick={() => onChange?.(val + step)}
      title={`Transpose (+${step})`}
      style={{
        padding: '10px 12px',
        borderRadius: 10,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.2))',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'white',
        boxShadow: '0 6px 18px rgba(0,0,0,0.35), inset 0 2px 6px rgba(255,255,255,0.12)',
        fontWeight: 700,
        minWidth: 48,
      }}
    >
      +{step}
    </button>
  );
}

import React from 'react';
// Stub for preview rendering. Replace with real visuals for each type.
const ComponentPreview = ({ type, styleId }) => (
  <div style={{ width: 40, height: 40, background: '#222', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>
    {type}
  </div>
);
export default ComponentPreview;

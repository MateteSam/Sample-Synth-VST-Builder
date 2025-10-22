import React from 'react';

export default function ButtonPush({ pressed, onChange, styleId, color = 'default', accentColor }) {
  const DefaultButton = ({ pressed }) => (
    <div className={`btnpush-default${pressed ? ' pressed' : ''}`}>
      <div className={`btnpush-led${pressed ? ' on' : ''}`}></div>
    </div>
  );

  const VintageSquareLitButton = ({ pressed, color = 'default' }) => (
    <div className={`btnpush-vintage-square-lit color-${color}${pressed ? ' pressed' : ''}`}></div>
  );

  const VintageDarkRoundButton = ({ pressed }) => (
    <div className={`btnpush-vintage-dark-round${pressed ? ' pressed' : ''}`}></div>
  );

  const ModernFlatButton = ({ pressed, accentColor }) => {
    const finalAccentColor = accentColor || 'var(--accent-2)';
    return (
      <div
        className={`btnpush-modern-flat${pressed ? ' pressed' : ''}`}
        style={pressed ? { backgroundColor: finalAccentColor } : undefined}
      >
        <div
          className={`btnpush-accent-dot${pressed ? ' on' : ''}`}
          style={!pressed ? { backgroundColor: finalAccentColor } : undefined}
        />
      </div>
    );
  };

  const ModernGlowButton = ({ pressed, accentColor }) => {
    const finalAccentColor = accentColor || 'var(--accent-2)';
    return (
      <div
        className={`btnpush-modern-glow${pressed ? ' pressed' : ''}`}
        style={{ ['--glow-color']: finalAccentColor, backgroundColor: pressed ? finalAccentColor : 'rgba(0,0,0,0.5)' }}
      />
    );
  };

  const VintageCreamButton = ({ pressed }) => (
    <div className={`btnpush-vintage-cream${pressed ? ' pressed' : ''}`}></div>
  );

  const renderStyle = () => {
    switch (styleId) {
      case 'vintage-red-square-lit':
        return <VintageSquareLitButton pressed={pressed} color={color} />;
      case 'vintage-dark-round':
        return <VintageDarkRoundButton pressed={pressed} />;
      case 'modern-flat':
        return <ModernFlatButton pressed={pressed} accentColor={accentColor} />;
      case 'modern-glow':
        return <ModernGlowButton pressed={pressed} accentColor={accentColor} />;
      case 'vintage-cream':
        return <VintageCreamButton pressed={pressed} />;
      case 'default':
      default:
        return <DefaultButton pressed={pressed} />;
    }
  };

  const getBorderRadiusForStyle = (styleId) => {
    switch (styleId) {
      case 'vintage-red-square-lit':
        return '2px';
      case 'modern-flat':
      case 'vintage-cream':
        return '6px';
      default:
        return '9999px';
    }
  };

  return (
    <div
      className="btnpush-frame"
      style={{ borderRadius: getBorderRadiusForStyle(styleId) }}
      onClick={() => onChange(!pressed)}
    >
      {renderStyle()}
    </div>
  );
}

import { useState } from 'react';
import ModernKnob from './ModernKnob';
import ModernFader from './ModernFader';
import ModernLED from './ModernLED';
import ModernButton from './ModernButton';

export default function ModernControlsPanel() {
  const [knobValue, setKnobValue] = useState(0.5);
  const [faderValue, setFaderValue] = useState(0.75);
  const [ledOn, setLedOn] = useState(true);
  const [knobLabel, setKnobLabel] = useState('Filter');
  const [faderLabel, setFaderLabel] = useState('Volume');
  const [ledLabel, setLedLabel] = useState('Power');

  return (
    <div className="modern-controls-panel">
      <div className="panel-header">
        <h3 className="panel-title">Modern Synth Controls</h3>
        <p className="panel-subtitle">Click any label to edit • Drag controls to adjust</p>
      </div>

      <div className="controls-grid">
        <div className="controls-section">
          <h4 className="section-title">Knobs</h4>
          <div className="controls-row">
            <ModernKnob 
              label={knobLabel}
              value={knobValue}
              onChange={setKnobValue}
              onLabelChange={setKnobLabel}
              color="#4b79ff"
              size={72}
            />
            <ModernKnob 
              label="Resonance"
              value={0.3}
              onChange={(v) => console.log('Resonance:', v)}
              color="#10b981"
              size={72}
            />
            <ModernKnob 
              label="Drive"
              value={0.65}
              onChange={(v) => console.log('Drive:', v)}
              color="#f59e0b"
              size={72}
            />
          </div>
        </div>

        <div className="controls-section">
          <h4 className="section-title">Faders</h4>
          <div className="controls-row">
            <ModernFader 
              label={faderLabel}
              value={faderValue}
              onChange={setFaderValue}
              onLabelChange={setFaderLabel}
              height={140}
              color="#4b79ff"
            />
            <ModernFader 
              label="Pan"
              value={0.5}
              onChange={(v) => console.log('Pan:', v)}
              height={140}
              color="#8b5cf6"
            />
            <ModernFader 
              label="Send"
              value={0.2}
              onChange={(v) => console.log('Send:', v)}
              height={140}
              color="#06b6d4"
            />
          </div>
        </div>

        <div className="controls-section">
          <h4 className="section-title">LEDs & Buttons</h4>
          <div className="controls-column">
            <div className="led-group">
              <ModernLED 
                label={ledLabel}
                value={ledOn}
                onChange={setLedOn}
                onLabelChange={setLedLabel}
                color="#10b981"
                size="large"
              />
              <ModernLED 
                label="Signal"
                value={true}
                onChange={() => {}}
                color="#4b79ff"
                size="medium"
              />
              <ModernLED 
                label="Clip"
                value={false}
                onChange={() => {}}
                color="#ef4444"
                size="medium"
              />
            </div>
            <div className="button-group">
              <ModernButton 
                label="Play"
                onClick={() => console.log('Play clicked')}
                variant="primary"
                size="medium"
              />
              <ModernButton 
                label="Record"
                onClick={() => console.log('Record clicked')}
                variant="danger"
                size="medium"
              />
              <ModernButton 
                label="Settings"
                onClick={() => console.log('Settings clicked')}
                variant="secondary"
                size="small"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="panel-footer">
        <div className="info-badge">
          <span className="badge-icon">✨</span>
          <span>All controls support live editing</span>
        </div>
      </div>
    </div>
  );
}

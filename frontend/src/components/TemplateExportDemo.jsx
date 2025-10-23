/**
 * QUICK START: How to Use PSD/Figma Template Export
 * Perfect round-trip workflow demonstration
 */

import React, { useState } from 'react';
import EnhancedTemplateExportPanel from './EnhancedTemplateExportPanel';

const TemplateExportDemo = () => {
  // Example design data - this would come from your actual design canvas
  const [currentDesign] = useState({
    name: "My Awesome Synth",
    width: 800,
    height: 600,
    backgroundColor: "#2a2a2a",
    components: [
      {
        id: "knob_001",
        type: "knob",
        x: 100,
        y: 100,
        width: 60,
        height: 60,
        parameter: "cutoff",
        value: 50,
        min: 0,
        max: 100,
        color: "#cccccc"
      },
      {
        id: "knob_002", 
        type: "knob",
        x: 200,
        y: 100,
        width: 60,
        height: 60,
        parameter: "resonance",
        value: 25,
        min: 0,
        max: 100,
        color: "#cccccc"
      },
      {
        id: "fader_001",
        type: "fader",
        x: 350,
        y: 80,
        width: 30,
        height: 100,
        parameter: "volume",
        value: 75,
        min: 0,
        max: 100,
        color: "#888888"
      },
      {
        id: "btn_001",
        type: "button",
        x: 450,
        y: 120,
        width: 50,
        height: 30,
        parameter: "power",
        value: 1,
        min: 0,
        max: 1,
        color: "#ff6600"
      }
    ]
  });

  return (
    <div className="template-export-demo">
      <h2>🎨 PSD/Figma Template Export Demo</h2>
      
      <div className="demo-content">
        <div className="current-design">
          <h3>Current Design:</h3>
          <div className="design-preview">
            <div className="design-canvas" style={{
              width: currentDesign.width,
              height: currentDesign.height,
              backgroundColor: currentDesign.backgroundColor,
              position: 'relative',
              border: '1px solid #555',
              borderRadius: '8px'
            }}>
              {currentDesign.components.map(comp => (
                <div
                  key={comp.id}
                  className={`component ${comp.type}`}
                  style={{
                    position: 'absolute',
                    left: comp.x,
                    top: comp.y,
                    width: comp.width,
                    height: comp.height,
                    backgroundColor: comp.color,
                    borderRadius: comp.type === 'knob' ? '50%' : '4px',
                    border: '2px solid #666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#fff'
                  }}
                >
                  {comp.parameter}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="export-panel">
          <EnhancedTemplateExportPanel 
            designData={currentDesign}
            className="demo-export"
          />
        </div>
      </div>

      <div className="workflow-steps">
        <h3>🔄 Complete Workflow:</h3>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <strong>Design Your Instrument</strong>
              <p>Create knobs, faders, buttons in VST Builder</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <strong>Export Template</strong>
              <p>Click "Export PSD/Figma Template" above</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <strong>Edit in External Tool</strong>
              <p>Open in Photoshop/Figma and make it beautiful!</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <strong>Import Back</strong>
              <p>Use "Import PSD/Figma" to bring edited design back</p>
            </div>
          </div>
          
          <div className="step">
            <div className="step-number">5</div>
            <div className="step-content">
              <strong>Export VST/Standalone</strong>
              <p>One-click export to get your professional instrument!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pro-tips">
        <h3>💡 Pro Tips:</h3>
        <ul>
          <li><strong>Layer Names:</strong> NEVER change them! They're critical for import.</li>
          <li><strong>Photoshop:</strong> Use layer effects, textures, gradients freely</li>
          <li><strong>Figma:</strong> Create components and variants for consistency</li>
          <li><strong>Quality:</strong> Work at 2x resolution for crisp results</li>
          <li><strong>Testing:</strong> Export multiple variations and A/B test</li>
        </ul>
      </div>

      <style jsx>{`
        .template-export-demo {
          padding: 20px;
          color: #ffffff;
          background: #1a1a1a;
          min-height: 100vh;
        }

        h2 {
          color: #00ff66;
          margin-bottom: 20px;
        }

        .demo-content {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 20px;
          margin-bottom: 30px;
        }

        .current-design {
          background: #2a2a2a;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #333;
        }

        .design-preview {
          margin-top: 10px;
          overflow: auto;
          max-height: 400px;
        }

        .design-canvas {
          margin: 0 auto;
          transform: scale(0.8);
          transform-origin: top left;
        }

        .export-panel {
          background: #2a2a2a;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #333;
        }

        .workflow-steps {
          background: #0a1a0a;
          border: 1px solid #22c55e;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .step-number {
          background: #00ff66;
          color: #000;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          flex-shrink: 0;
        }

        .step-content strong {
          color: #00ff66;
          display: block;
          margin-bottom: 4px;
        }

        .step-content p {
          color: #ccc;
          margin: 0;
          font-size: 14px;
        }

        .pro-tips {
          background: #1a1a0a;
          border: 1px solid #ffcc00;
          border-radius: 8px;
          padding: 20px;
        }

        .pro-tips h3 {
          color: #ffcc00;
          margin-bottom: 12px;
        }

        .pro-tips ul {
          margin: 0;
          padding-left: 20px;
        }

        .pro-tips li {
          margin-bottom: 8px;
          color: #ccc;
        }

        .pro-tips strong {
          color: #ffcc00;
        }

        @media (max-width: 768px) {
          .demo-content {
            grid-template-columns: 1fr;
          }
          
          .design-canvas {
            transform: scale(0.6);
          }
        }
      `}</style>
    </div>
  );
};

export default TemplateExportDemo;
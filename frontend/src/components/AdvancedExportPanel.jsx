/**
 * ADVANCED EXPORT PANEL
 * Frontend component for revolutionary export features
 */

import React, { useState, useCallback } from 'react';
import { useInstrument } from '../state/instrument';

export function AdvancedExportPanel() {
  const { state } = useInstrument();
  const [exportStatus, setExportStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  /**
   * Import PSD design
   */
  const handlePSDImport = useCallback(async (file) => {
    setImporting(true);
    
    try {
      const formData = new FormData();
      formData.append('psd', file);

      const response = await fetch('http://localhost:3000/api/export/import-psd', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ PSD Imported!\n\nFound ${result.data.components.length} components\nExtracted ${result.data.assets.length} assets`);
        
        // Apply imported design to state
        // state.updateFromImport(result.data);
      } else {
        alert('❌ Import failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Import error: ' + error.message);
    } finally {
      setImporting(false);
    }
  }, []);

  /**
   * Import from Figma
   */
  const handleFigmaImport = useCallback(async () => {
    const fileKey = prompt('Enter Figma file key:');
    const accessToken = prompt('Enter Figma access token:');

    if (!fileKey || !accessToken) return;

    setImporting(true);

    try {
      const response = await fetch('http://localhost:3000/api/export/import-figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileKey, accessToken })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Figma design imported successfully!');
      } else {
        alert('❌ Import failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Import error: ' + error.message);
    } finally {
      setImporting(false);
    }
  }, []);

  /**
   * ONE-CLICK EXPORT - THE MAGIC BUTTON!
   */
  const handleOneClickExport = useCallback(async () => {
    const confirmed = confirm(
      '🚀 ONE-CLICK EXPORT\n\n' +
      'This will generate:\n' +
      '✓ HISE Project (.hip)\n' +
      '✓ VST3 Plugin\n' +
      '✓ Standalone App\n' +
      '✓ Web Version\n' +
      '✓ Installer\n' +
      '✓ Documentation\n\n' +
      'This may take 5-10 minutes.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    setExporting(true);
    setExportStatus('Starting export...');

    try {
      // Prepare design data
      const designData = {
        name: state.instrumentName || 'MyInstrument',
        layout: {
          width: 800,
          height: 600
        },
        components: state.components || [],
        samples: state.samples || [],
        sampleGroups: state.sampleGroups || [],
        effects: state.effects || [],
        metadata: {
          author: state.author || 'Unknown',
          version: state.version || '1.0.0',
          description: state.description || ''
        },
        theme: state.theme || {}
      };

      // Start export
      const response = await fetch('http://localhost:3000/api/export/one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designData,
          options: {
            exportHISE: true,
            exportVST: true,
            exportStandalone: true,
            exportWeb: true,
            createInstaller: true,
            runTests: true
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setExportStatus(`Export started! Job ID: ${result.exportId}`);

        // Poll for status
        pollExportStatus(result.exportId);
      } else {
        alert('❌ Export failed: ' + result.error);
        setExporting(false);
      }
    } catch (error) {
      alert('❌ Export error: ' + error.message);
      setExporting(false);
    }
  }, [state]);

  /**
   * Poll export status
   */
  const pollExportStatus = useCallback((exportId) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/export/status/${exportId}`);
        const result = await response.json();

        if (result.status === 'processing') {
          setExportStatus('Processing... ' + (result.message || ''));
        } else if (result.success) {
          clearInterval(interval);
          setExporting(false);
          setExportStatus(null);

          alert(
            `✅ EXPORT COMPLETE!\n\n` +
            `Duration: ${result.duration}s\n\n` +
            `Your files are ready:\n` +
            `- HISE Project\n` +
            `- VST3 Plugin\n` +
            `- Standalone App\n` +
            `- Web Version\n` +
            `- Installer\n\n` +
            `Check your exports folder!`
          );
        } else if (result.success === false) {
          clearInterval(interval);
          setExporting(false);
          alert('❌ Export failed: ' + result.error);
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 30 minutes
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  }, []);

  /**
   * Generate HISE project only
   */
  const handleHISEExport = useCallback(async () => {
    try {
      const designData = prepareDesignData(state);

      const response = await fetch('http://localhost:3000/api/export/generate-hise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designData,
          projectName: state.instrumentName || 'MyInstrument'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ HISE project generated!\n\nOpen in HISE:\n' + result.data.presetFile);
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  }, [state]);

  /**
   * Compile VST directly (without HISE)
   */
  const handleDirectVSTCompile = useCallback(async () => {
    const confirmed = confirm(
      '🔌 DIRECT VST3 COMPILATION\n\n' +
      'This will compile a VST3 plugin without using HISE.\n' +
      'Requires: JUCE, CMake, C++ compiler\n\n' +
      'This may take 5-15 minutes.\n\n' +
      'Continue?'
    );

    if (!confirmed) return;

    try {
      const designData = prepareDesignData(state);

      const response = await fetch('http://localhost:3000/api/export/compile-vst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designData })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ VST3 compilation started!\n\nCheck console for progress.');
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  }, [state]);

  /**
   * Validate design before export
   */
  const handleValidate = useCallback(async () => {
    try {
      const designData = prepareDesignData(state);

      const response = await fetch('http://localhost:3000/api/export/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ designData })
      });

      const result = await response.json();

      if (result.valid) {
        alert('✅ Design validation passed!\n\nReady to export.');
      } else {
        alert('⚠️ Design validation issues:\n\n' + result.issues.join('\n'));
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  }, [state]);

  return (
    <div className="advanced-export-panel">
      <h2>🚀 Advanced Export System</h2>

      {/* Import Section */}
      <section className="import-section">
        <h3>📥 Import Design</h3>
        <p>Bring your fully designed UI from professional tools</p>

        <div className="button-group">
          <label className="button">
            <input
              type="file"
              accept=".psd"
              onChange={(e) => e.target.files[0] && handlePSDImport(e.target.files[0])}
              disabled={importing}
              style={{ display: 'none' }}
            />
            {importing ? '⏳ Importing...' : '🎨 Import PSD'}
          </label>

          <button onClick={handleFigmaImport} disabled={importing}>
            📐 Import from Figma
          </button>
        </div>
      </section>

      {/* Export Section */}
      <section className="export-section">
        <h3>📤 Export Options</h3>

        {/* THE MAGIC BUTTON */}
        <button
          className="one-click-button"
          onClick={handleOneClickExport}
          disabled={exporting}
          style={{
            fontSize: '1.2em',
            padding: '20px 40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: exporting ? 'not-allowed' : 'pointer',
            marginBottom: '20px',
            width: '100%'
          }}
        >
          {exporting ? '⏳ Exporting...' : '🚀 ONE-CLICK EXPORT (Everything!)'}
        </button>

        {exportStatus && (
          <div className="export-status" style={{
            padding: '10px',
            background: '#f0f0f0',
            borderRadius: '4px',
            marginBottom: '20px'
          }}>
            {exportStatus}
          </div>
        )}

        {/* Individual Export Options */}
        <div className="button-group">
          <button onClick={handleHISEExport}>
            🎹 HISE Project Only
          </button>

          <button onClick={handleDirectVSTCompile}>
            🔌 Direct VST3 Compile
          </button>

          <button onClick={handleValidate}>
            ✅ Validate Design
          </button>
        </div>
      </section>

      {/* Features Info */}
      <section className="features-info">
        <h3>✨ What You Get</h3>
        <ul>
          <li>✅ HISE Project (.hip) - Open in HISE for customization</li>
          <li>✅ VST3 Plugin - Ready to use in any DAW</li>
          <li>✅ Standalone App - Desktop application (Windows/Mac)</li>
          <li>✅ Web Version - Progressive Web App</li>
          <li>✅ Installer - Ready to distribute</li>
          <li>✅ Documentation - User manual and developer docs</li>
        </ul>
      </section>

      {/* Requirements */}
      <section className="requirements-info">
        <h3>📋 Optional Requirements</h3>
        <p>For direct VST compilation (not needed for HISE export):</p>
        <ul>
          <li>JUCE Framework (auto-installed)</li>
          <li>CMake (auto-installed on Windows)</li>
          <li>C++ Compiler (Visual Studio on Windows)</li>
        </ul>
        <p><em>Without these, you can still generate HISE projects!</em></p>
      </section>

      <style jsx>{`
        .advanced-export-panel {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        h2 {
          text-align: center;
          color: #333;
          margin-bottom: 30px;
        }

        h3 {
          color: #555;
          margin-bottom: 15px;
        }

        .button-group {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        button, .button {
          padding: 12px 24px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.3s;
        }

        button:hover:not(:disabled), .button:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,123,255,0.3);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        ul {
          padding-left: 20px;
        }

        li {
          margin: 8px 0;
          color: #555;
        }
      `}</style>
    </div>
  );
}

/**
 * Helper: Prepare design data for export
 */
function prepareDesignData(state) {
  return {
    name: state.instrumentName || 'MyInstrument',
    layout: {
      width: 800,
      height: 600
    },
    components: state.components || [],
    samples: state.samples || [],
    sampleGroups: state.sampleGroups || [],
    effects: state.effects || [],
    metadata: {
      author: state.author || 'Unknown',
      version: state.version || '1.0.0',
      description: state.description || ''
    },
    theme: state.theme || {}
  };
}

export default AdvancedExportPanel;

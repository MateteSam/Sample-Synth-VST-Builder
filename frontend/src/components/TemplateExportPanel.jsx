/**
 * Template Export Panel - Export designs as PSD/Figma templates for external editing
 * Perfect round-trip workflow: Design → Export Template → Edit in Photoshop/Figma → Import Back → Export VST
 */

import React, { useState, useCallback } from 'react';
import { Download, FileImage, Figma, ExternalLink, Info, CheckCircle, AlertCircle } from 'lucide-react';

const TemplateExportPanel = ({ designData, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportType, setExportType] = useState('both'); // 'psd', 'figma', 'both'
  const [showWorkflow, setShowWorkflow] = useState(false);

  /**
   * Export as PSD template for Photoshop editing
   */
  const handlePSDExport = useCallback(async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const response = await fetch('/api/export-template/psd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designData,
          options: {
            filename: `${designData.name || 'instrument'}_template.psd`,
            width: designData.width || 800,
            height: designData.height || 600,
            includeGuides: true,
            includeSmartObjects: true
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setExportResult({
          type: 'psd',
          success: true,
          message: result.message,
          downloadUrl: result.data.downloadUrl,
          workflow: result.data.workflow
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }

    } catch (error) {
      setExportResult({
        type: 'psd',
        success: false,
        error: error.message
      });
    } finally {
      setIsExporting(false);
    }
  }, [designData]);

  /**
   * Export as Figma template
   */
  const handleFigmaExport = useCallback(async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const response = await fetch('/api/export-template/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designData,
          options: {
            filename: `${designData.name || 'instrument'}_template.fig`,
            includeComponents: true,
            includeConstraints: true,
            includeStyles: true
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setExportResult({
          type: 'figma',
          success: true,
          message: result.message,
          downloadUrl: result.data.downloadUrl,
          workflow: result.data.workflow
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }

    } catch (error) {
      setExportResult({
        type: 'figma',
        success: false,
        error: error.message
      });
    } finally {
      setIsExporting(false);
    }
  }, [designData]);

  /**
   * Export both PSD and Figma templates
   */
  const handleBothExport = useCallback(async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const response = await fetch('/api/export-template/both', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designData,
          options: {
            baseName: designData.name || 'instrument_template',
            psd: {
              includeGuides: true,
              includeSmartObjects: true
            },
            figma: {
              includeComponents: true,
              includeConstraints: true,
              includeStyles: true
            }
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setExportResult({
          type: 'both',
          success: true,
          message: result.message,
          psd: result.data.psd,
          figma: result.data.figma,
          workflow: result.data.workflow
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }

    } catch (error) {
      setExportResult({
        type: 'both',
        success: false,
        error: error.message
      });
    } finally {
      setIsExporting(false);
    }
  }, [designData]);

  /**
   * Handle export based on selected type
   */
  const handleExport = useCallback(() => {
    switch (exportType) {
      case 'psd':
        return handlePSDExport();
      case 'figma':
        return handleFigmaExport();
      case 'both':
        return handleBothExport();
      default:
        return handleBothExport();
    }
  }, [exportType, handlePSDExport, handleFigmaExport, handleBothExport]);

  /**
   * Download exported file
   */
  const handleDownload = useCallback((downloadUrl, filename) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'template';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  if (!designData || !designData.components?.length) {
    return (
      <div className={`template-export-panel ${className}`}>
        <div className="empty-state">
          <FileImage size={48} className="text-gray-400" />
          <p className="text-gray-500 mt-2">Design some components first to export templates</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`template-export-panel ${className}`}>
      <div className="panel-header">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileImage size={20} />
          Template Export
        </h3>
        <button
          onClick={() => setShowWorkflow(!showWorkflow)}
          className="info-button"
          title="Show workflow guide"
        >
          <Info size={16} />
        </button>
      </div>

      {showWorkflow && (
        <div className="workflow-guide">
          <h4 className="text-sm font-semibold text-blue-300 mb-2">🔄 Round-Trip Workflow</h4>
          <div className="workflow-steps text-xs text-gray-300">
            <div className="step">1. Design your instrument here</div>
            <div className="step">2. Export as PSD/Figma template</div>
            <div className="step">3. Edit in Photoshop/Figma</div>
            <div className="step">4. Import back to VST Builder</div>
            <div className="step">5. Export as VST/Standalone</div>
          </div>
        </div>
      )}

      <div className="export-options">
        <label className="option-label">Export Format:</label>
        <div className="format-selector">
          <button
            className={`format-btn ${exportType === 'psd' ? 'active' : ''}`}
            onClick={() => setExportType('psd')}
          >
            <FileImage size={16} />
            PSD Only
          </button>
          <button
            className={`format-btn ${exportType === 'figma' ? 'active' : ''}`}
            onClick={() => setExportType('figma')}
          >
            <Figma size={16} />
            Figma Only
          </button>
          <button
            className={`format-btn ${exportType === 'both' ? 'active' : ''}`}
            onClick={() => setExportType('both')}
          >
            <FileImage size={16} />
            <Figma size={16} />
            Both
          </button>
        </div>
      </div>

      <div className="export-action">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="export-button"
        >
          {isExporting ? (
            <>
              <div className="spinner" />
              Exporting Template...
            </>
          ) : (
            <>
              <Download size={16} />
              Export {exportType === 'both' ? 'Templates' : `${exportType.toUpperCase()} Template`}
            </>
          )}
        </button>
      </div>

      {exportResult && (
        <div className={`export-result ${exportResult.success ? 'success' : 'error'}`}>
          {exportResult.success ? (
            <>
              <div className="result-header">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-green-300">{exportResult.message}</span>
              </div>

              {exportResult.type === 'both' ? (
                <div className="download-links">
                  <div className="download-item">
                    <FileImage size={14} />
                    <span>PSD Template</span>
                    <button
                      onClick={() => handleDownload(exportResult.psd.downloadUrl, 'template.psd')}
                      className="download-btn"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                  <div className="download-item">
                    <Figma size={14} />
                    <span>Figma Template</span>
                    <button
                      onClick={() => handleDownload(exportResult.figma.downloadUrl, 'template.json')}
                      className="download-btn"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="download-single">
                  <button
                    onClick={() => handleDownload(exportResult.downloadUrl)}
                    className="download-single-btn"
                  >
                    <Download size={16} />
                    Download Template
                  </button>
                </div>
              )}

              {exportResult.workflow && (
                <div className="workflow-steps-detailed">
                  <h5 className="text-xs font-semibold text-blue-300 mb-1">Next Steps:</h5>
                  {Object.entries(exportResult.workflow).map(([key, value]) => (
                    <div key={key} className="workflow-step text-xs text-gray-300">
                      {typeof value === 'string' ? `${key}: ${value}` : `${key}: ${JSON.stringify(value)}`}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="result-header">
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-red-300">Export failed: {exportResult.error}</span>
            </div>
          )}
        </div>
      )}

      <div className="template-info">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">📋 Template Info</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Components:</span>
            <span className="value">{designData.components?.length || 0}</span>
          </div>
          <div className="info-item">
            <span className="label">Size:</span>
            <span className="value">{designData.width || 800} × {designData.height || 600}</span>
          </div>
          <div className="info-item">
            <span className="label">Format:</span>
            <span className="value">{exportType.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="important-notes">
        <h4 className="text-sm font-semibold text-yellow-300 mb-2">⚠️ Important</h4>
        <ul className="notes-list text-xs text-gray-300">
          <li>Keep layer names exactly as exported</li>
          <li>Don't change the [ID] brackets in layer names</li>
          <li>Edit colors, effects, textures freely</li>
          <li>Maintain component aspect ratios when resizing</li>
          <li>Save and import back to generate VST/Standalone</li>
        </ul>
      </div>

      <style jsx>{`
        .template-export-panel {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
          color: #ffffff;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .info-button {
          background: #333;
          border: none;
          border-radius: 4px;
          padding: 4px;
          color: #ccc;
          cursor: pointer;
        }

        .info-button:hover {
          background: #444;
          color: #fff;
        }

        .workflow-guide {
          background: #0a1a2a;
          border: 1px solid #1a3a5a;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .workflow-steps {
          margin-top: 8px;
        }

        .step {
          padding: 2px 0;
          position: relative;
          padding-left: 16px;
        }

        .step::before {
          content: '→';
          position: absolute;
          left: 0;
          color: #666;
        }

        .export-options {
          margin-bottom: 16px;
        }

        .option-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #ccc;
        }

        .format-selector {
          display: flex;
          gap: 8px;
        }

        .format-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #333;
          border: 1px solid #555;
          border-radius: 6px;
          color: #ccc;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .format-btn:hover {
          background: #444;
          border-color: #666;
        }

        .format-btn.active {
          background: #0066cc;
          border-color: #0066cc;
          color: #fff;
        }

        .export-action {
          margin-bottom: 16px;
        }

        .export-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #0066cc, #0052a3);
          border: none;
          border-radius: 6px;
          color: #fff;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #0052a3, #003d7a);
          transform: translateY(-1px);
        }

        .export-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff40;
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .export-result {
          background: #1a1a1a;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .export-result.success {
          border: 1px solid #22c55e;
          background: #0a1a0a;
        }

        .export-result.error {
          border: 1px solid #ef4444;
          background: #1a0a0a;
        }

        .result-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .download-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .download-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background: #333;
          border-radius: 4px;
        }

        .download-btn {
          margin-left: auto;
          background: #0066cc;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          color: #fff;
          cursor: pointer;
        }

        .download-single {
          margin-top: 8px;
        }

        .download-single-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #0066cc;
          border: none;
          border-radius: 4px;
          color: #fff;
          cursor: pointer;
          width: 100%;
          justify-content: center;
        }

        .workflow-steps-detailed {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #333;
        }

        .workflow-step {
          padding: 2px 0;
        }

        .template-info {
          background: #0a0a0a;
          border: 1px solid #333;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 8px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }

        .label {
          color: #999;
        }

        .value {
          color: #fff;
          font-weight: 500;
        }

        .important-notes {
          background: #1a1a0a;
          border: 1px solid #666600;
          border-radius: 6px;
          padding: 12px;
        }

        .notes-list {
          list-style: none;
          margin-top: 8px;
        }

        .notes-list li {
          padding: 2px 0;
          position: relative;
          padding-left: 16px;
        }

        .notes-list li::before {
          content: '•';
          position: absolute;
          left: 0;
          color: #ffcc00;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
        }
      `}</style>
    </div>
  );
};

export default TemplateExportPanel;
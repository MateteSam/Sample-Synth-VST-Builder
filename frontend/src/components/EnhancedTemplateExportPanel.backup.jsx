/**
 * Enhanced Template Export Panel - Professional UI/UX
 * World-class design matching premium VST tools
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Download,
  FileImage,
  Figma,
  ExternalLink,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { PremiumButton, PremiumCard, PremiumBadge } from './ProfessionalUISystem';
import { useToast } from './ToastNotification';
import { Confetti } from './Confetti';const EnhancedTemplateExportPanel = ({ designData, className = '' }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [exportType, setExportType] = useState('both');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { addToast } = useToast();
  const [exportProgress, setExportProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Enhanced PSD export with progress tracking
   */
  const handlePSDExport = useCallback(async () => {
    setIsExporting(true);
    setExportResult(null);
    setIsAnimating(true);
    setExportProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

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
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        if (result.success) {
          setExportResult({
            type: 'psd',
            success: true,
            message: result.message,
            downloadUrl: result.data.downloadUrl,
            workflow: result.data.workflow,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          throw new Error(result.error || 'Export failed');
        }
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setExportResult({
        type: 'psd',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setIsAnimating(false);
        setExportProgress(0);
      }, 1000);
    }
  }, [designData]);

  /**
   * Enhanced Figma export with progress tracking
   */
  const handleFigmaExport = useCallback(async () => {
    setIsExporting(true);
    setExportResult(null);
    setIsAnimating(true);
    setExportProgress(0);

    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 12;
      });
    }, 180);

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
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        if (result.success) {
          setExportResult({
            type: 'figma',
            success: true,
            message: result.message,
            downloadUrl: result.data.downloadUrl,
            workflow: result.data.workflow,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          throw new Error(result.error || 'Export failed');
        }
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setExportResult({
        type: 'figma',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setIsAnimating(false);
        setExportProgress(0);
      }, 1000);
    }
  }, [designData]);

  /**
   * Enhanced both export
   */
  const handleBothExport = useCallback(async () => {
    setIsExporting(true);
    setExportResult(null);
    setIsAnimating(true);
    setExportProgress(0);

    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 150);

    try {
      const response = await fetch('/api/export-template/both', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designData,
          options: {
            baseName: designData.name || 'instrument_template',
            psd: { includeGuides: true, includeSmartObjects: true },
            figma: { includeComponents: true, includeConstraints: true, includeStyles: true }
          }
        })
      });

      const result = await response.json();
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        if (result.success) {
          setExportResult({
            type: 'both',
            success: true,
            message: result.message,
            psd: result.data.psd,
            figma: result.data.figma,
            workflow: result.data.workflow,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          throw new Error(result.error || 'Export failed');
        }
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setExportResult({
        type: 'both',
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setTimeout(() => {
        setIsExporting(false);
        setIsAnimating(false);
        setExportProgress(0);
      }, 1000);
    }
  }, [designData]);

  /**
   * Handle export based on selected type
   */
  const handleExport = useCallback(() => {
    switch (exportType) {
      case 'psd': return handlePSDExport();
      case 'figma': return handleFigmaExport();
      case 'both': return handleBothExport();
      default: return handleBothExport();
    }
  }, [exportType, handlePSDExport, handleFigmaExport, handleBothExport]);

  /**
   * Enhanced download with animation
   */
  const handleDownload = useCallback((downloadUrl, filename) => {
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'template';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show success animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
  }, []);

  if (!designData || !designData.components?.length) {
    return (
      <PremiumCard variant="premium" className={`template-export-panel empty-state ${className}`}>
        <div className="empty-content">
          <div className="empty-icon">
            <FileImage size={48} />
            <Sparkles className="sparkle-1" size={16} />
            <Sparkles className="sparkle-2" size={12} />
          </div>
          <h3 className="empty-title">Ready to Create Magic?</h3>
          <p className="empty-description">
            Design some amazing components first, then export them as professional PSD/Figma templates!
          </p>
          <PremiumButton variant="primary" size="lg" className="get-started-btn">
            <Zap size={16} />
            Start Designing
          </PremiumButton>
        </div>

        <style jsx>{`
          .empty-state {
            padding: 48px 32px;
            text-align: center;
            min-height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .empty-content {
            max-width: 320px;
          }

          .empty-icon {
            position: relative;
            margin: 0 auto 24px;
            color: #64748b;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .sparkle-1, .sparkle-2 {
            position: absolute;
            color: #fbbf24;
            animation: sparkle 2s ease-in-out infinite;
          }

          .sparkle-1 {
            top: -8px;
            right: -8px;
            animation-delay: 0.5s;
          }

          .sparkle-2 {
            bottom: -4px;
            left: -4px;
            animation-delay: 1s;
          }

          @keyframes sparkle {
            0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
            50% { opacity: 1; transform: scale(1) rotate(180deg); }
          }

          .empty-title {
            font-size: 24px;
            font-weight: 700;
            color: white;
            margin: 0 0 12px 0;
            background: linear-gradient(135deg, #ffffff, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .empty-description {
            color: #94a3b8;
            margin: 0 0 24px 0;
            line-height: 1.6;
          }

          .get-started-btn {
            margin: 0 auto;
          }
        `}</style>
      </PremiumCard>
    );
  }

  return (
    <div className={`enhanced-template-export ${className}`}>
      {/* Header Section */}
      <PremiumCard variant="premium" className="header-card">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <FileImage size={24} />
              <div className="icon-glow" />
            </div>
            <div className="header-text">
              <h2 className="panel-title">Template Export Studio</h2>
              <p className="panel-subtitle">Transform designs into professional templates</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button
              onClick={() => setShowWorkflow(!showWorkflow)}
              className={`info-btn ${showWorkflow ? 'active' : ''}`}
            >
              <Info size={16} />
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`preview-btn ${showPreview ? 'active' : ''}`}
            >
              <Eye size={16} />
            </button>
          </div>
        </div>
      </PremiumCard>

      {/* Workflow Guide */}
      {showWorkflow && (
        <PremiumCard variant="glass" className="workflow-card animate-fade-in">
          <div className="workflow-header">
            <div className="workflow-icon">
              <RefreshCw size={16} />
            </div>
            <h3 className="workflow-title">Professional Round-Trip Workflow</h3>
            <PremiumBadge variant="success" size="sm">Revolutionary</PremiumBadge>
          </div>
          
          <div className="workflow-steps">
            {[
              { step: 1, title: 'Design', desc: 'Create your instrument interface', icon: '🎨', time: '30min' },
              { step: 2, title: 'Export', desc: 'Generate PSD/Figma templates', icon: '📤', time: '1min' },
              { step: 3, title: 'Edit', desc: 'Polish in Photoshop/Figma', icon: '✨', time: '1hr' },
              { step: 4, title: 'Import', desc: 'Bring back stunning designs', icon: '📥', time: '1min' },
              { step: 5, title: 'Export VST', desc: 'Generate professional VST/Standalone', icon: '🚀', time: '10min' }
            ].map((item) => (
              <div key={item.step} className="workflow-step">
                <div className="step-number">{item.step}</div>
                <div className="step-icon">{item.icon}</div>
                <div className="step-content">
                  <h4 className="step-title">{item.title}</h4>
                  <p className="step-desc">{item.desc}</p>
                </div>
                <div className="step-time">
                  <Clock size={12} />
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="workflow-stats">
            <div className="stat">
              <TrendingUp size={16} />
              <span className="stat-label">Speed Increase</span>
              <span className="stat-value">100x</span>
            </div>
            <div className="stat">
              <Award size={16} />
              <span className="stat-label">Quality Level</span>
              <span className="stat-value">Pro</span>
            </div>
          </div>
        </PremiumCard>
      )}

      {/* Export Options */}
      <PremiumCard variant="default" className="export-options-card">
        <div className="options-header">
          <h3 className="options-title">Export Format</h3>
          <div className="format-stats">
            <span className="component-count">{designData.components?.length || 0} components</span>
            <span className="size-info">{designData.width || 800}×{designData.height || 600}</span>
          </div>
        </div>

        <div className="format-selector">
          {[
            { 
              id: 'psd', 
              name: 'PSD Only', 
              icon: FileImage, 
              desc: 'Perfect for Photoshop',
              badge: 'Popular',
              color: '#3b82f6'
            },
            { 
              id: 'figma', 
              name: 'Figma Only', 
              icon: Figma, 
              desc: 'Modern collaborative design',
              badge: 'Trending',
              color: '#10b981'
            },
            { 
              id: 'both', 
              name: 'Both Formats', 
              icon: Sparkles, 
              desc: 'Maximum flexibility',
              badge: 'Recommended',
              color: '#f59e0b'
            }
          ].map((format) => (
            <button
              key={format.id}
              onClick={() => setExportType(format.id)}
              className={`format-option ${exportType === format.id ? 'active' : ''}`}
            >
              <div className="format-header">
                <format.icon size={20} />
                <PremiumBadge 
                  variant={format.id === 'both' ? 'warning' : format.id === 'figma' ? 'success' : 'primary'} 
                  size="xs"
                >
                  {format.badge}
                </PremiumBadge>
              </div>
              <h4 className="format-name">{format.name}</h4>
              <p className="format-desc">{format.desc}</p>
              {exportType === format.id && (
                <div className="active-indicator" style={{ background: format.color }} />
              )}
            </button>
          ))}
        </div>
      </PremiumCard>

      {/* Export Action */}
      <PremiumCard variant="premium" className="export-action-card">
        <div className="export-main">
          <div className="export-info">
            <h3 className="export-title">Ready to Export</h3>
            <p className="export-subtitle">
              Generate professional {exportType === 'both' ? 'PSD & Figma templates' : `${exportType.toUpperCase()} template`}
            </p>
          </div>

          <PremiumButton
            variant="primary"
            size="xl"
            onClick={handleExport}
            disabled={isExporting}
            loading={isExporting}
            className="export-button"
          >
            {isExporting ? (
              <>
                <div className="export-spinner" />
                Exporting... {Math.round(exportProgress)}%
              </>
            ) : (
              <>
                <Download size={20} />
                Export {exportType === 'both' ? 'Templates' : `${exportType.toUpperCase()} Template`}
              </>
            )}
          </PremiumButton>
        </div>

        {isExporting && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="progress-text">
              Processing your design... {Math.round(exportProgress)}%
            </div>
          </div>
        )}
      </PremiumCard>

      {/* Export Results */}
      {exportResult && (
        <PremiumCard 
          variant={exportResult.success ? "premium" : "default"} 
          className={`result-card ${exportResult.success ? 'success' : 'error'} animate-fade-in`}
        >
          <div className="result-header">
            {exportResult.success ? (
              <CheckCircle size={20} className="result-icon success" />
            ) : (
              <AlertCircle size={20} className="result-icon error" />
            )}
            <div className="result-text">
              <h4 className="result-title">
                {exportResult.success ? 'Export Successful!' : 'Export Failed'}
              </h4>
              <p className="result-message">{exportResult.message || exportResult.error}</p>
              {exportResult.timestamp && (
                <span className="result-time">at {exportResult.timestamp}</span>
              )}
            </div>
          </div>

          {exportResult.success && (
            <div className="download-section">
              {exportResult.type === 'both' ? (
                <div className="download-grid">
                  <div className="download-item">
                    <div className="download-info">
                      <FileImage size={16} />
                      <div>
                        <span className="download-label">PSD Template</span>
                        <span className="download-desc">Ready for Photoshop</span>
                      </div>
                    </div>
                    <PremiumButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(exportResult.psd.downloadUrl, 'template.psd')}
                    >
                      <Download size={14} />
                      Download
                    </PremiumButton>
                  </div>
                  
                  <div className="download-item">
                    <div className="download-info">
                      <Figma size={16} />
                      <div>
                        <span className="download-label">Figma Template</span>
                        <span className="download-desc">Ready for Figma</span>
                      </div>
                    </div>
                    <PremiumButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(exportResult.figma.downloadUrl, 'template.json')}
                    >
                      <Download size={14} />
                      Download
                    </PremiumButton>
                  </div>
                </div>
              ) : (
                <div className="download-single">
                  <PremiumButton
                    variant="success"
                    size="lg"
                    onClick={() => handleDownload(exportResult.downloadUrl)}
                    className="download-main-btn"
                  >
                    <Download size={18} />
                    Download {exportResult.type.toUpperCase()} Template
                  </PremiumButton>
                </div>
              )}
            </div>
          )}
        </PremiumCard>
      )}

      <style jsx>{`
        .enhanced-template-export {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 800px;
        }

        /* Header Styles */
        .header-card {
          padding: 24px;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-icon {
          position: relative;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .icon-glow {
          position: absolute;
          inset: -4px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 16px;
          opacity: 0.3;
          filter: blur(8px);
          z-index: -1;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .panel-title {
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .panel-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .info-btn, .preview-btn {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.2);
          color: #94a3b8;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .info-btn:hover, .preview-btn:hover,
        .info-btn.active, .preview-btn.active {
          background: rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.4);
          color: #60a5fa;
          transform: translateY(-1px);
        }

        /* Workflow Styles */
        .workflow-card {
          padding: 24px;
        }

        .workflow-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .workflow-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .workflow-title {
          flex: 1;
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .workflow-steps {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 20px;
        }

        .workflow-step {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .workflow-step:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.2);
          transform: translateX(4px);
        }

        .step-number {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-title {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 4px 0;
        }

        .step-desc {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .step-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #64748b;
          flex-shrink: 0;
        }

        .workflow-stats {
          display: flex;
          gap: 24px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
        }

        .stat-label {
          font-size: 12px;
          color: #64748b;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 700;
          color: #10b981;
        }

        /* Export Options Styles */
        .export-options-card {
          padding: 24px;
        }

        .options-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }

        .options-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .format-stats {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
        }

        .component-count, .size-info {
          padding: 4px 8px;
          background: rgba(59, 130, 246, 0.1);
          border-radius: 6px;
        }

        .format-selector {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .format-option {
          position: relative;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          overflow: hidden;
        }

        .format-option:hover {
          background: rgba(15, 23, 42, 0.8);
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateY(-2px);
        }

        .format-option.active {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
        }

        .format-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .format-name {
          font-size: 14px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px 0;
        }

        .format-desc {
          font-size: 12px;
          color: #94a3b8;
          margin: 0;
        }

        .active-indicator {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          border-radius: 0 0 4px 4px;
        }

        /* Export Action Styles */
        .export-action-card {
          padding: 24px;
        }

        .export-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .export-info {
          flex: 1;
        }

        .export-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px 0;
        }

        .export-subtitle {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        .export-button {
          min-width: 200px;
        }

        .export-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .progress-container {
          margin-top: 16px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 3px;
          transition: width 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: shimmer 2s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-text {
          font-size: 12px;
          color: #64748b;
          text-align: center;
        }

        /* Result Styles */
        .result-card {
          padding: 24px;
        }

        .result-card.success {
          border-color: rgba(16, 185, 129, 0.3);
        }

        .result-card.error {
          border-color: rgba(239, 68, 68, 0.3);
        }

        .result-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 20px;
        }

        .result-icon.success {
          color: #10b981;
        }

        .result-icon.error {
          color: #ef4444;
        }

        .result-text {
          flex: 1;
        }

        .result-title {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px 0;
        }

        .result-message {
          font-size: 14px;
          color: #94a3b8;
          margin: 0 0 4px 0;
        }

        .result-time {
          font-size: 12px;
          color: #64748b;
        }

        .download-section {
          margin-top: 20px;
        }

        .download-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .download-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(16, 185, 129, 0.05);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 12px;
        }

        .download-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .download-label {
          font-size: 14px;
          font-weight: 500;
          color: white;
          display: block;
        }

        .download-desc {
          font-size: 12px;
          color: #94a3b8;
          display: block;
        }

        .download-single {
          text-align: center;
        }

        .download-main-btn {
          min-width: 250px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .enhanced-template-export {
            max-width: 100%;
          }
          
          .format-selector {
            grid-template-columns: 1fr;
          }
          
          .export-main {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .export-button {
            width: 100%;
          }
          
          .download-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedTemplateExportPanel;
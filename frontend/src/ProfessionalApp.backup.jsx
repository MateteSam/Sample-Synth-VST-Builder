/**
 * Professional App Root - World-Class VST Builder Interface
 * Complete redesign with premium UI/UX matching industry standards
 */

import React, { useState, useEffect } from 'react';
import { 
  ProfessionalHeader, 
  ProfessionalSidebar, 
  ProfessionalMainContent, 
  ProfessionalLayout 
} from './components/ProfessionalLayout';
import { ToastProvider } from './components/ToastNotification';
import { PremiumButton, PremiumCard, PremiumBadge } from './components/ProfessionalUISystem';
import EnhancedTemplateExportPanel from './components/EnhancedTemplateExportPanel';
import { 
  Music, 
  Palette, 
  Headphones, 
  FileImage, 
  Download, 
  Settings,
  Zap,
  Star,
  TrendingUp,
  Users,
  Award,
  Clock,
  Heart,
  Sparkles,
  Play,
  Volume2,
  Sliders,
  Grid
} from 'lucide-react';

// Mock data for demonstration
const mockDesignData = {
  name: "Professional Synth",
  width: 800,
  height: 600,
  backgroundColor: "#1a1a1a",
  components: [
    {
      id: "knob_001",
      type: "knob",
      x: 100,
      y: 150,
      width: 80,
      height: 80,
      parameter: "cutoff",
      value: 65,
      min: 0,
      max: 100
    },
    {
      id: "knob_002", 
      type: "knob",
      x: 220,
      y: 150,
      width: 80,
      height: 80,
      parameter: "resonance",
      value: 35,
      min: 0,
      max: 100
    },
    {
      id: "fader_001",
      type: "fader",
      x: 400,
      y: 120,
      width: 40,
      height: 140,
      parameter: "volume",
      value: 80,
      min: 0,
      max: 100
    },
    {
      id: "btn_001",
      type: "button",
      x: 520,
      y: 180,
      width: 60,
      height: 40,
      parameter: "power",
      value: 1,
      min: 0,
      max: 1
    }
  ]
};

const ProfessionalApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate app initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="professional-loading">
        <div className="loading-content">
          <div className="loading-logo">
            <Music size={48} />
            <Zap className="loading-zap" size={24} />
          </div>
          <h1 className="loading-title">Seko Sa VST Builder Pro</h1>
          <p className="loading-subtitle">Initializing world-class features...</p>
          <div className="loading-bar">
            <div className="loading-fill" />
          </div>
        </div>

        <style jsx>{`
          .professional-loading {
            min-height: 100vh;
            background: linear-gradient(135deg, 
              rgba(7, 11, 21, 1) 0%, 
              rgba(15, 23, 42, 1) 50%,
              rgba(7, 11, 21, 1) 100%
            );
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
          }

          .professional-loading::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
            animation: rotate 20s linear infinite;
          }

          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .loading-content {
            text-align: center;
            z-index: 1;
            max-width: 400px;
            padding: 40px;
          }

          .loading-logo {
            position: relative;
            margin: 0 auto 32px;
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.4);
          }

          .loading-zap {
            position: absolute;
            color: #fbbf24;
            animation: pulse 2s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 0.5; transform: scale(0.9); }
            50% { opacity: 1; transform: scale(1.1); }
          }

          .loading-title {
            font-size: 32px;
            font-weight: 700;
            color: white;
            margin: 0 0 16px 0;
            background: linear-gradient(135deg, #ffffff, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .loading-subtitle {
            font-size: 16px;
            color: #64748b;
            margin: 0 0 32px 0;
          }

          .loading-bar {
            width: 100%;
            height: 4px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 2px;
            overflow: hidden;
          }

          .loading-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #1d4ed8);
            border-radius: 2px;
            animation: loading 2s ease-in-out infinite;
          }

          @keyframes loading {
            0% { width: 0%; }
            50% { width: 70%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Render page content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'design':
        return <DesignPage />;
      case 'play':
        return <PlayPage />;
      case 'templates':
        return <TemplatesPage />;
      case 'export':
        return <ExportPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ToastProvider>
      <ProfessionalLayout>
      <ProfessionalHeader 
        onMenuToggle={handleSidebarToggle}
        isMenuOpen={sidebarOpen}
      />
      
      <div className="app-body">
        <ProfessionalSidebar
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        
        <div className={`main-content-wrapper ${sidebarOpen ? 'sidebar-open' : ''}`}>
          {renderContent()}
        </div>
      </div>

      <style jsx global>{`
        .app-body {
          display: flex;
          flex: 1;
          position: relative;
        }

        .main-content-wrapper {
          flex: 1;
          margin-left: 0;
          transition: margin-left 0.3s ease;
        }

        @media (min-width: 1024px) {
          .main-content-wrapper {
            margin-left: 280px;
          }
        }
      `}</style>
      </ProfessionalLayout>
    </ToastProvider>
  );
};

// Dashboard Page Component
const DashboardPage = () => {
  const stats = [
    { label: 'Instruments Created', value: '12', icon: Music, trend: '+3', color: 'primary' },
    { label: 'Templates Exported', value: '24', icon: FileImage, trend: '+8', color: 'success' },
    { label: 'Hours Saved', value: '240', icon: Clock, trend: '+60', color: 'warning' },
    { label: 'Quality Score', value: '98%', icon: Award, trend: '+5%', color: 'secondary' }
  ];

  return (
    <ProfessionalMainContent
      title="Dashboard"
      subtitle="Welcome to your professional VST creation studio"
      actions={
        <PremiumButton variant="primary" size="lg">
          <Play size={16} />
          Quick Start
        </PremiumButton>
      }
    >
      <div className="dashboard-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <PremiumCard key={index} variant="premium" hover glow className="stat-card">
              <div className="stat-header">
                <div className={`stat-icon ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <PremiumBadge variant="success" size="xs">
                  {stat.trend}
                </PremiumBadge>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            </PremiumCard>
          ))}
        </div>

        {/* Quick Actions */}
        <PremiumCard variant="glass" className="quick-actions-card">
          <div className="section-header">
            <h3 className="section-title">Quick Actions</h3>
            <PremiumBadge variant="premium">Pro Features</PremiumBadge>
          </div>
          
          <div className="quick-actions-grid">
            <button className="quick-action">
              <Palette size={24} />
              <span className="action-label">New Design</span>
              <span className="action-desc">Start fresh</span>
            </button>
            
            <button className="quick-action">
              <FileImage size={24} />
              <span className="action-label">Import PSD</span>
              <span className="action-desc">From Photoshop</span>
            </button>
            
            <button className="quick-action">
              <Download size={24} />
              <span className="action-label">Export VST</span>
              <span className="action-desc">One-click</span>
            </button>
            
            <button className="quick-action">
              <Sparkles size={24} />
              <span className="action-label">AI Assistant</span>
              <span className="action-desc">Smart help</span>
            </button>
          </div>
        </PremiumCard>

        {/* Recent Projects */}
        <PremiumCard variant="default" className="recent-projects-card">
          <div className="section-header">
            <h3 className="section-title">Recent Projects</h3>
            <button className="view-all-btn">View All</button>
          </div>
          
          <div className="projects-list">
            {[
              { name: 'Analog Warmth', type: 'Synthesizer', modified: '2 hours ago', progress: 85 },
              { name: 'Digital Dreams', type: 'Effects', modified: '1 day ago', progress: 92 },
              { name: 'Vintage Vibes', type: 'Sampler', modified: '3 days ago', progress: 67 }
            ].map((project, index) => (
              <div key={index} className="project-item">
                <div className="project-info">
                  <h4 className="project-name">{project.name}</h4>
                  <p className="project-meta">
                    <span className="project-type">{project.type}</span>
                    <span className="project-modified">{project.modified}</span>
                  </p>
                </div>
                <div className="project-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="progress-text">{project.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </PremiumCard>
      </div>

      <style jsx>{`
        .dashboard-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
        }

        .stat-card {
          padding: 24px;
        }

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        }

        .stat-icon.success {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .stat-icon.warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .stat-icon.secondary {
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
        }

        .stat-content {
          text-align: left;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .stat-label {
          font-size: 14px;
          color: #94a3b8;
          margin: 0;
        }

        .quick-actions-card {
          padding: 32px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: white;
          margin: 0;
        }

        .quick-actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .quick-action {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #e2e8f0;
        }

        .quick-action:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.4);
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
        }

        .action-label {
          font-size: 16px;
          font-weight: 600;
          color: white;
        }

        .action-desc {
          font-size: 12px;
          color: #94a3b8;
        }

        .recent-projects-card {
          padding: 32px;
        }

        .view-all-btn {
          background: none;
          border: none;
          color: #60a5fa;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .view-all-btn:hover {
          color: #3b82f6;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .project-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(59, 130, 246, 0.1);
          border-radius: 12px;
          transition: all 0.2s;
        }

        .project-item:hover {
          background: rgba(15, 23, 42, 0.8);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .project-info {
          flex: 1;
        }

        .project-name {
          font-size: 16px;
          font-weight: 600;
          color: white;
          margin: 0 0 6px 0;
        }

        .project-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
          margin: 0;
        }

        .project-type {
          color: #60a5fa;
        }

        .project-modified {
          color: #94a3b8;
        }

        .project-progress {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .progress-bar {
          width: 80px;
          height: 6px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 12px;
          color: #94a3b8;
          min-width: 35px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .quick-actions-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .project-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .project-progress {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </ProfessionalMainContent>
  );
};

// Templates Page - Showcase the enhanced template export
const TemplatesPage = () => {
  return (
    <ProfessionalMainContent
      title="Template Export Studio"
      subtitle="Transform your designs into professional PSD & Figma templates"
      actions={
        <div style={{ display: 'flex', gap: '12px' }}>
          <PremiumButton variant="outline" size="md">
            <Settings size={16} />
            Settings
          </PremiumButton>
          <PremiumButton variant="primary" size="md">
            <Heart size={16} />
            Save Template
          </PremiumButton>
        </div>
      }
    >
      <div className="templates-content">
        <EnhancedTemplateExportPanel 
          designData={mockDesignData}
          className="main-export-panel"
        />
        
        {/* Additional template features */}
        <div className="template-features-grid">
          <PremiumCard variant="glass" className="feature-card">
            <div className="feature-icon">
              <Sparkles size={24} />
            </div>
            <h3 className="feature-title">AI-Powered Templates</h3>
            <p className="feature-desc">
              Generate intelligent templates based on your design patterns and preferences.
            </p>
            <PremiumBadge variant="warning" size="sm">Coming Soon</PremiumBadge>
          </PremiumCard>
          
          <PremiumCard variant="glass" className="feature-card">
            <div className="feature-icon">
              <Users size={24} />
            </div>
            <h3 className="feature-title">Team Collaboration</h3>
            <p className="feature-desc">
              Share templates with your team and collaborate in real-time on designs.
            </p>
            <PremiumBadge variant="primary" size="sm">Available</PremiumBadge>
          </PremiumCard>
          
          <PremiumCard variant="glass" className="feature-card">
            <div className="feature-icon">
              <TrendingUp size={24} />
            </div>
            <h3 className="feature-title">Version Control</h3>
            <p className="feature-desc">
              Track changes, compare versions, and revert to previous template iterations.
            </p>
            <PremiumBadge variant="success" size="sm">Pro Only</PremiumBadge>
          </PremiumCard>
        </div>
      </div>

      <style jsx>{`
        .templates-content {
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 1200px;
        }

        .main-export-panel {
          width: 100%;
        }

        .template-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .feature-card {
          padding: 24px;
          text-align: center;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 16px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .feature-title {
          font-size: 18px;
          font-weight: 600;
          color: white;
          margin: 0 0 12px 0;
        }

        .feature-desc {
          font-size: 14px;
          color: #94a3b8;
          margin: 0 0 16px 0;
          line-height: 1.6;
        }
      `}</style>
    </ProfessionalMainContent>
  );
};

// Placeholder pages for other tabs
const DesignPage = () => (
  <ProfessionalMainContent title="Design Canvas" subtitle="Create your instrument interface">
    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
      <Grid size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
      <h3 style={{ color: 'white', marginBottom: '12px' }}>Design Canvas</h3>
      <p>Professional design tools coming soon...</p>
    </div>
  </ProfessionalMainContent>
);

const PlayPage = () => (
  <ProfessionalMainContent title="Play & Test" subtitle="Test your instrument in real-time">
    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
      <Volume2 size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
      <h3 style={{ color: 'white', marginBottom: '12px' }}>Play & Test</h3>
      <p>Audio testing environment coming soon...</p>
    </div>
  </ProfessionalMainContent>
);

const ExportPage = () => (
  <ProfessionalMainContent title="Export VST" subtitle="Generate your professional VST/Standalone">
    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
      <Download size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
      <h3 style={{ color: 'white', marginBottom: '12px' }}>VST Export</h3>
      <p>One-click export system coming soon...</p>
    </div>
  </ProfessionalMainContent>
);

const SettingsPage = () => (
  <ProfessionalMainContent title="Settings" subtitle="Configure your VST Builder">
    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
      <Sliders size={64} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
      <h3 style={{ color: 'white', marginBottom: '12px' }}>Settings</h3>
      <p>Configuration options coming soon...</p>
    </div>
  </ProfessionalMainContent>
);

export default ProfessionalApp;
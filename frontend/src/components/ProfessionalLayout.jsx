/**
 * Professional Layout System - World-Class App Structure
 * Modern, responsive, and stunning layout components
 */

import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Home, 
  Music, 
  Settings, 
  Download, 
  FileImage,
  Palette,
  Headphones,
  Zap,
  Star,
  Maximize2,
  Minimize2
} from 'lucide-react';

// 🏗️ PROFESSIONAL HEADER
export const ProfessionalHeader = ({ onMenuToggle, isMenuOpen }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <header className="professional-header">
      <div className="header-content">
        {/* Logo & Brand */}
        <div className="brand-section">
          <button
            onClick={onMenuToggle}
            className="menu-toggle"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="brand-logo">
            <div className="logo-icon">
              <Music className="logo-music" />
              <Zap className="logo-zap" />
            </div>
            <div className="brand-text">
              <h1 className="brand-title">Seko Sa</h1>
              <p className="brand-subtitle">VST Builder Pro</p>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="status-section">
          <div className="status-indicator">
            <div className="status-dot active" />
            <span className="status-text">Connected</span>
          </div>
          
          <div className="pro-badge">
            <Star size={12} />
            <span>PRO</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-section">
          <button 
            onClick={toggleFullscreen}
            className="action-btn"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          
          <button className="action-btn" title="Settings">
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Announcement / Quick CTA */}
      <div className="header-cta">
        <div className="cta-inner container">
          <div className="cta-text">✨ New: <strong>Template Export Studio</strong> — export PSD & Figma templates for Photoshop/Figma round-trip.</div>
          <div>
            <button className="btn btn-ghost" onClick={() => { window.location.hash = '#templates'; }}>
              Try it
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .professional-header {
          background: linear-gradient(135deg, 
            rgba(30, 41, 59, 0.95) 0%, 
            rgba(15, 23, 42, 0.95) 100%
          );
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          padding: 0;
          position: sticky;
          top: 0;
          z-index: 50;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          max-width: 100%;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .menu-toggle {
          background: none;
          border: none;
          color: #e2e8f0;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-toggle:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          transform: scale(1.05);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          position: relative;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .logo-music {
          color: white;
          position: absolute;
          z-index: 2;
        }

        .logo-zap {
          color: #fbbf24;
          position: absolute;
          transform: translate(2px, -2px);
          z-index: 1;
          opacity: 0.8;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .brand-title {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin: 0;
          background: linear-gradient(135deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .brand-subtitle {
          font-size: 11px;
          font-weight: 500;
          color: #64748b;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #64748b;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #6b7280;
        }

        .status-dot.active {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .status-text {
          font-weight: 500;
        }

        .pro-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: #1f2937;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
        }

        .actions-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
          cursor: pointer;
          padding: 8px;
          border-radius: 6px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
          color: #3b82f6;
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 12px 16px;
          }
          
          .brand-text {
            display: none;
          }
          
          .status-section {
            display: none;
          }
        }
      `}</style>
    </header>
  );
};

// 🎯 PROFESSIONAL SIDEBAR
export const ProfessionalSidebar = ({ isOpen, activeTab, onTabChange }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null },
    { id: 'design', label: 'Design Canvas', icon: Palette, badge: 'Hot' },
    { id: 'play', label: 'Play & Test', icon: Headphones, badge: null },
    { id: 'templates', label: 'Templates', icon: FileImage, badge: 'New' },
    { id: 'export', label: 'Export VST', icon: Download, badge: null },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={() => onTabChange(activeTab)} // Close sidebar
        />
      )}
      
      <aside className={`professional-sidebar ${isOpen ? 'open' : 'closed'}`}>
        <nav className="sidebar-nav">
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            >
              <div className="nav-icon">
                <item.icon size={20} />
              </div>
              
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge ${item.badge === 'Hot' ? 'hot' : item.badge === 'New' ? 'new' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              
              {activeTab === item.id && (
                <div className="nav-indicator" />
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="upgrade-card">
            <div className="upgrade-icon">
              <Star size={16} />
            </div>
            <div className="upgrade-content">
              <p className="upgrade-title">Pro Features</p>
              <p className="upgrade-subtitle">Unlimited exports</p>
            </div>
          </div>
        </div>

        <style jsx>{`
          .sidebar-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 40;
            backdrop-filter: blur(4px);
            transition: all 0.3s ease;
          }

          .professional-sidebar {
            position: fixed;
            top: 73px; /* Below header */
            left: 0;
            height: calc(100vh - 73px);
            width: 280px;
            background: linear-gradient(135deg, 
              rgba(15, 23, 42, 0.95) 0%, 
              rgba(7, 11, 21, 0.95) 100%
            );
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(59, 130, 246, 0.1);
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 45;
            display: flex;
            flex-direction: column;
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
          }

          .professional-sidebar.open {
            transform: translateX(0);
          }

          .sidebar-nav {
            flex: 1;
            padding: 24px 16px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .nav-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border: none;
            background: none;
            color: #94a3b8;
            cursor: pointer;
            border-radius: 10px;
            transition: all 0.2s ease;
            position: relative;
            text-align: left;
            width: 100%;
          }

          .nav-item:hover {
            background: rgba(59, 130, 246, 0.1);
            color: #e2e8f0;
            transform: translateX(4px);
          }

          .nav-item.active {
            background: linear-gradient(135deg, 
              rgba(59, 130, 246, 0.15) 0%, 
              rgba(29, 78, 216, 0.15) 100%
            );
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }

          .nav-icon {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .nav-content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .nav-label {
            font-size: 14px;
            font-weight: 500;
          }

          .nav-badge {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 2px 6px;
            border-radius: 8px;
          }

          .nav-badge.hot {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
          }

          .nav-badge.new {
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
          }

          .nav-indicator {
            position: absolute;
            right: -17px;
            top: 50%;
            transform: translateY(-50%);
            width: 3px;
            height: 20px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 2px;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
          }

          .sidebar-footer {
            padding: 16px;
            border-top: 1px solid rgba(59, 130, 246, 0.1);
          }

          .upgrade-card {
            background: linear-gradient(135deg, 
              rgba(59, 130, 246, 0.1) 0%, 
              rgba(29, 78, 216, 0.1) 100%
            );
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 10px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .upgrade-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #1f2937;
            flex-shrink: 0;
          }

          .upgrade-content {
            flex: 1;
          }

          .upgrade-title {
            font-size: 12px;
            font-weight: 600;
            color: #e2e8f0;
            margin: 0 0 2px 0;
          }

          .upgrade-subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 0;
          }

          @media (min-width: 1024px) {
            .professional-sidebar {
              position: relative;
              top: 0;
              height: 100%;
              transform: translateX(0);
            }
            
            .sidebar-backdrop {
              display: none;
            }
          }
        `}</style>
      </aside>
    </>
  );
};

// 🎨 PROFESSIONAL MAIN CONTENT
export const ProfessionalMainContent = ({ children, title, subtitle, actions }) => {
  return (
    <main className="professional-main">
      {(title || subtitle || actions) && (
        <div className="content-header">
          <div className="header-text">
            {title && <h1 className="content-title">{title}</h1>}
            {subtitle && <p className="content-subtitle">{subtitle}</p>}
          </div>
          {actions && (
            <div className="header-actions">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="content-body">
        {children}
      </div>

      <style jsx>{`
        .professional-main {
          flex: 1;
          background: linear-gradient(135deg, 
            rgba(7, 11, 21, 0.9) 0%, 
            rgba(3, 5, 10, 0.9) 100%
          );
          min-height: calc(100vh - 73px);
          display: flex;
          flex-direction: column;
        }

        .content-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 32px 32px 24px;
          border-bottom: 1px solid rgba(59, 130, 246, 0.1);
          background: linear-gradient(135deg, 
            rgba(15, 23, 42, 0.5) 0%, 
            rgba(7, 11, 21, 0.5) 100%
          );
          backdrop-filter: blur(10px);
        }

        .header-text {
          flex: 1;
        }

        .content-title {
          font-size: 28px;
          font-weight: 700;
          color: white;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #ffffff, #e2e8f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .content-subtitle {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .content-body {
          flex: 1;
          padding: 32px;
          overflow-y: auto;
        }

        @media (max-width: 768px) {
          .professional-main {
            margin-left: 0;
          }
          
          .content-header {
            padding: 24px 16px 16px;
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .content-title {
            font-size: 24px;
          }
          
          .content-subtitle {
            font-size: 14px;
          }
          
          .content-body {
            padding: 24px 16px;
          }
          
          .header-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </main>
  );
};

// 🏗️ PROFESSIONAL LAYOUT WRAPPER
export const ProfessionalLayout = ({ children, sidebarOpen = false, onSidebarToggle }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="professional-layout">
      <div className="layout-container">
        {children}
      </div>

      <style jsx global>{`
        .professional-layout {
          min-height: 100vh;
          background: 
            radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at bottom, rgba(29, 78, 216, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, 
              rgba(7, 11, 21, 1) 0%, 
              rgba(3, 5, 10, 1) 100%
            );
          position: relative;
          overflow-x: hidden;
        }

        .layout-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          position: relative;
        }

        /* Global animations */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slide-in {
          animation: slideIn 0.5s ease-out;
        }

        /* Scrollbar styling */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(59, 130, 246, 0.5) rgba(15, 23, 42, 0.5);
        }

        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        *::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.7), rgba(29, 78, 216, 0.7));
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(29, 78, 216, 0.9));
        }
      `}</style>
    </div>
  );
};

export default {
  ProfessionalHeader,
  ProfessionalSidebar,
  ProfessionalMainContent,
  ProfessionalLayout
};
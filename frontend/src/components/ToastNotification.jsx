/**
 * Toast Notification System - Beautiful, animated notifications
 * Supports success, error, warning, info states with auto-dismiss
 */

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContext = React.createContext();

/**
 * Toast Provider - Wrap your app with this to enable toast notifications
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);

  const addToast = (message, options = {}) => {
    const {
      type = 'info', // success, error, warning, info
      duration = 4000,
      action = null,
      onClose = null
    } = options;

    const id = toastIdRef.current++;
    const toast = { id, message, type, action, onClose };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onClose) toast.onClose();
      return prev.filter(t => t.id !== id);
    });
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook - Use this in any component to show toasts
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * Toast Container - Renders all active toasts
 */
const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemove(toast.id)}
        />
      ))}

      <style jsx>{`
        .toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .toast-container {
            bottom: 12px;
            right: 12px;
            left: 12px;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Individual Toast Component
 */
const Toast = ({ id, message, type, action, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`toast toast-${type} ${isExiting ? 'toast-exit' : 'toast-enter'}`}>
      <div className="toast-icon">{icons[type]}</div>

      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>

      {action && (
        <button className="toast-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}

      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <X size={16} />
      </button>

      <style jsx>{`
        .toast {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          pointer-events: auto;
          animation: toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .toast-enter {
          animation: toast-slide-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .toast-exit {
          animation: toast-slide-out 0.2s ease-out forwards;
        }

        @keyframes toast-slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes toast-slide-out {
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }

        /* Type variants */
        .toast-success {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .toast-success .toast-icon {
          color: #10b981;
        }

        .toast-error {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
          border-color: rgba(239, 68, 68, 0.3);
        }

        .toast-error .toast-icon {
          color: #ef4444;
        }

        .toast-warning {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
          border-color: rgba(245, 158, 11, 0.3);
        }

        .toast-warning .toast-icon {
          color: #f59e0b;
        }

        .toast-info {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .toast-info .toast-icon {
          color: #3b82f6;
        }

        .toast-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-content {
          flex: 1;
          min-width: 0;
        }

        .toast-message {
          margin: 0;
          font-size: 14px;
          font-weight: 500;
          color: #e2e8f0;
          line-height: 1.4;
        }

        .toast-action {
          background: none;
          border: none;
          color: #60a5fa;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .toast-action:hover {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }

        .toast-close {
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .toast-close:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }

        @media (max-width: 640px) {
          .toast {
            max-width: 100%;
            padding: 14px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;

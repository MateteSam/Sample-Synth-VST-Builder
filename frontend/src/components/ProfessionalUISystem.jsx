/**
 * Professional UI System - World-Class Design Components
 * Rivaling Native Instruments, Output, and other premium VST tools
 */

import React from 'react';

// 🎨 PROFESSIONAL COLOR SYSTEM
export const ProfessionalColors = {
  // Primary Brand Colors
  primary: {
    50: '#e6f3ff',
    100: '#b3daff', 
    200: '#80c1ff',
    300: '#4da8ff',
    400: '#1a8fff',
    500: '#0066cc', // Main brand
    600: '#0052a3',
    700: '#003d7a',
    800: '#002951',
    900: '#001428'
  },
  
  // Secondary Accent Colors
  secondary: {
    50: '#fff4e6',
    100: '#ffe0b3',
    200: '#ffcc80',
    300: '#ffb84d', 
    400: '#ffa41a',
    500: '#ff6600', // Accent orange
    600: '#e55a00',
    700: '#cc4f00',
    800: '#b34400',
    900: '#993900'
  },
  
  // Success/Active States
  success: {
    50: '#e6fff0',
    100: '#b3ffcc',
    200: '#80ffa8',
    300: '#4dff84',
    400: '#1aff60',
    500: '#00ff66', // Success green
    600: '#00e55a',
    700: '#00cc4f',
    800: '#00b344',
    900: '#009939'
  },
  
  // Warning States
  warning: {
    50: '#fffce6',
    100: '#fff5b3',
    200: '#ffee80',
    300: '#ffe74d',
    400: '#ffe01a',
    500: '#ffcc00', // Warning yellow
    600: '#e6b800',
    700: '#cca300',
    800: '#b38f00',
    900: '#997a00'
  },
  
  // Error States  
  error: {
    50: '#ffe6e6',
    100: '#ffb3b3',
    200: '#ff8080',
    300: '#ff4d4d',
    400: '#ff1a1a',
    500: '#ff0000', // Error red
    600: '#e60000',
    700: '#cc0000',
    800: '#b30000',
    900: '#990000'
  },
  
  // Professional Grays
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9', 
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b', // Dark UI base
    850: '#151b26', // Darker panels
    900: '#0f172a', // Darkest backgrounds
    950: '#020617'  // Almost black
  }
};

// 🎯 PROFESSIONAL TYPOGRAPHY SYSTEM
export const ProfessionalTypography = {
  fontFamilies: {
    display: '"SF Pro Display", "Segoe UI", system-ui, sans-serif',
    text: '"SF Pro Text", "Segoe UI", system-ui, sans-serif', 
    mono: '"SF Mono", "Consolas", "Monaco", monospace'
  },
  
  fontSizes: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px  
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
    '6xl': '3.75rem'   // 60px
  },
  
  fontWeights: {
    thin: 100,
    extraLight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semiBold: 600,
    bold: 700,
    extraBold: 800,
    black: 900
  },
  
  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2
  }
};

// ✨ PROFESSIONAL SHADOWS & EFFECTS
export const ProfessionalShadows = {
  // Soft shadows for cards and panels
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Premium glow effects
  glow: {
    primary: '0 0 20px rgba(0, 102, 204, 0.4)',
    success: '0 0 20px rgba(0, 255, 102, 0.4)', 
    warning: '0 0 20px rgba(255, 204, 0, 0.4)',
    error: '0 0 20px rgba(255, 0, 0, 0.4)'
  },
  
  // Inset shadows for depth
  inset: {
    sm: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
    base: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
    md: 'inset 0 4px 6px rgba(0, 0, 0, 0.1)'
  }
};

// 🎭 PREMIUM GRADIENTS
export const PremiumGradients = {
  // Brand gradients
  primary: 'linear-gradient(135deg, #0066cc 0%, #0052a3 100%)',
  primaryHover: 'linear-gradient(135deg, #0052a3 0%, #003d7a 100%)',
  
  // Accent gradients
  secondary: 'linear-gradient(135deg, #ff6600 0%, #e55a00 100%)',
  success: 'linear-gradient(135deg, #00ff66 0%, #00e55a 100%)',
  warning: 'linear-gradient(135deg, #ffcc00 0%, #e6b800 100%)',
  error: 'linear-gradient(135deg, #ff0000 0%, #e60000 100%)',
  
  // Neutral gradients
  dark: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  darkPanel: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
  
  // Premium metal effects
  chrome: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)',
  gold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #d97706 50%, #b45309 75%, #92400e 100%)',
  
  // Glass morphism
  glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
  glassCard: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.8) 100%)'
};

// 🌟 PREMIUM BUTTON COMPONENT
export const PremiumButton = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  disabled = false,
  loading = false,
  icon: Icon,
  ...props 
}) => {
  const baseStyles = `
    inline-flex items-center justify-center font-medium transition-all duration-200 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    transform hover:scale-105 active:scale-95
  `;
  
  const variants = {
    primary: `
      bg-gradient-to-r from-primary-500 to-primary-600 text-white
      hover:from-primary-600 hover:to-primary-700 
      focus:ring-primary-500 shadow-lg hover:shadow-xl
      ${!disabled ? 'hover:shadow-primary-500/25' : ''}
    `,
    secondary: `
      bg-gradient-to-r from-secondary-500 to-secondary-600 text-white
      hover:from-secondary-600 hover:to-secondary-700
      focus:ring-secondary-500 shadow-lg hover:shadow-xl
      ${!disabled ? 'hover:shadow-secondary-500/25' : ''}
    `,
    success: `
      bg-gradient-to-r from-success-500 to-success-600 text-black
      hover:from-success-600 hover:to-success-700
      focus:ring-success-500 shadow-lg hover:shadow-xl
      ${!disabled ? 'hover:shadow-success-500/25' : ''}
    `,
    ghost: `
      bg-transparent text-gray-300 border border-gray-600
      hover:bg-gray-800 hover:text-white hover:border-gray-500
      focus:ring-gray-500
    `,
    outline: `
      bg-transparent text-primary-400 border border-primary-500
      hover:bg-primary-500 hover:text-white
      focus:ring-primary-500
    `
  };
  
  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs rounded-md gap-1',
    sm: 'px-3 py-2 text-sm rounded-md gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-lg gap-2',
    lg: 'px-6 py-3 text-base rounded-lg gap-2',
    xl: 'px-8 py-4 text-lg rounded-xl gap-3'
  };
  
  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : size === 'lg' ? 18 : size === 'xl' ? 20 : 16} />
      ) : null}
      {children}
    </button>
  );
};

// 🎴 PREMIUM CARD COMPONENT
export const PremiumCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  glow = false,
  ...props 
}) => {
  const baseStyles = `
    rounded-xl border backdrop-blur-sm transition-all duration-300
    ${hover ? 'hover:scale-[1.02] hover:shadow-2xl' : ''}
  `;
  
  const variants = {
    default: `
      bg-gradient-to-br from-gray-800/90 to-gray-900/90 
      border-gray-700/50 shadow-xl
      ${glow ? 'shadow-primary-500/10' : ''}
    `,
    glass: `
      bg-gradient-to-br from-white/10 to-white/5
      border-white/20 shadow-2xl backdrop-blur-md
    `,
    premium: `
      bg-gradient-to-br from-gray-800/95 to-gray-900/95
      border-primary-500/30 shadow-2xl shadow-primary-500/10
      ring-1 ring-primary-500/20
    `
  };
  
  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// 📊 PREMIUM INPUT COMPONENT
export const PremiumInput = ({ 
  label, 
  error, 
  icon: Icon,
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={16} />
          </div>
        )}
        <input
          className={`
            w-full rounded-lg border bg-gray-800/50 backdrop-blur-sm
            transition-all duration-200 focus:outline-none focus:ring-2
            ${Icon ? 'pl-10 pr-4' : 'px-4'} py-2.5
            ${error 
              ? 'border-error-500 focus:ring-error-500/50 focus:border-error-400' 
              : 'border-gray-600 focus:ring-primary-500/50 focus:border-primary-400'
            }
            text-white placeholder-gray-400
            hover:border-gray-500 hover:bg-gray-800/70
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-error-400">{error}</p>
      )}
    </div>
  );
};

// 🎛️ PREMIUM SLIDER COMPONENT
export const PremiumSlider = ({ 
  value = 50, 
  min = 0, 
  max = 100, 
  step = 1,
  label,
  onChange,
  className = '',
  showValue = true,
  ...props 
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          {showValue && (
            <span className="text-sm text-primary-400 font-mono">{value}</span>
          )}
        </div>
      )}
      <div className="relative">
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-150 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          {...props}
        />
        <div 
          className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-primary-500 -translate-y-1/2 transition-all duration-150 ease-out hover:scale-110"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  );
};

// 🏷️ PREMIUM BADGE COMPONENT
export const PremiumBadge = ({ 
  children, 
  variant = 'default', 
  size = 'sm',
  className = '' 
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    primary: 'bg-primary-500/20 text-primary-300 ring-1 ring-primary-500/30',
    success: 'bg-success-500/20 text-success-300 ring-1 ring-success-500/30',
    warning: 'bg-warning-500/20 text-warning-300 ring-1 ring-warning-500/30',
    error: 'bg-error-500/20 text-error-300 ring-1 ring-error-500/30',
    premium: 'bg-gradient-to-r from-primary-500/20 to-secondary-500/20 text-white ring-1 ring-primary-500/30'
  };
  
  const sizes = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs', 
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

// 🎨 PROFESSIONAL CSS VARIABLES
export const professionalCSSVariables = `
:root {
  /* Brand Colors */
  --color-primary-50: ${ProfessionalColors.primary[50]};
  --color-primary-500: ${ProfessionalColors.primary[500]};
  --color-primary-600: ${ProfessionalColors.primary[600]};
  --color-primary-700: ${ProfessionalColors.primary[700]};
  
  /* Typography */
  --font-display: ${ProfessionalTypography.fontFamilies.display};
  --font-text: ${ProfessionalTypography.fontFamilies.text};
  --font-mono: ${ProfessionalTypography.fontFamilies.mono};
  
  /* Shadows */
  --shadow-sm: ${ProfessionalShadows.sm};
  --shadow-lg: ${ProfessionalShadows.lg};
  --shadow-xl: ${ProfessionalShadows.xl};
  --shadow-glow-primary: ${ProfessionalShadows.glow.primary};
  
  /* Gradients */
  --gradient-primary: ${PremiumGradients.primary};
  --gradient-glass: ${PremiumGradients.glass};
}

/* Custom scrollbars */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-gray-800);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--color-primary-500);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-600);
}

/* Selection colors */
::selection {
  background: var(--color-primary-500);
  color: white;
}

/* Focus ring styles */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-gray-900;
}

/* Animation utilities */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: var(--shadow-glow-primary);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 102, 204, 0.6);
  }
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
`;

export default {
  ProfessionalColors,
  ProfessionalTypography, 
  ProfessionalShadows,
  PremiumGradients,
  PremiumButton,
  PremiumCard,
  PremiumInput,
  PremiumSlider,
  PremiumBadge,
  professionalCSSVariables
};
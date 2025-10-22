import React from 'react';

export function IconStyle(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="3" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <path d="M7 13L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconMidi(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="3" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="7" cy="10" r="1.5" fill="currentColor" />
      <circle cx="13" cy="10" r="1.5" fill="currentColor" />
      <rect x="6" y="13" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function IconTab(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="3" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="7" width="8" height="2" rx="1" fill="currentColor" />
      <rect x="6" y="11" width="8" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export function IconTemplates(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="3" width="14" height="14" rx="4" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="6" width="8" height="8" rx="2" fill="currentColor" />
    </svg>
  );
}

export function IconComponents(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="4" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="4" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function IconLayers(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M10 5L4 8L10 11L16 8L10 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 12L10 15L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAssets(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="1.5" fill="currentColor" />
      <path d="M4 13L7 10L10 13L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconAI(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="9" r="1" fill="currentColor" />
      <circle cx="12" cy="9" r="1" fill="currentColor" />
      <path d="M7 13Q10 15 13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Decorative hardware icons
export function IconScrew(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <circle cx="10" cy="10" r="8" fill="#b8860b" stroke="#7c5a13" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="5.5" fill="#e2c98f" stroke="#b8860b" strokeWidth="1" />
      <rect x="8.5" y="6" width="3" height="8" rx="1" fill="#7c5a13" />
      <rect x="6" y="8.5" width="8" height="3" rx="1" fill="#7c5a13" />
    </svg>
  );
}

export function IconGrill(props) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="6" width="14" height="8" rx="3" fill="#222" stroke="#888" strokeWidth="1.5" />
      <rect x="5" y="7" width="1.5" height="6" rx="0.5" fill="#888" />
      <rect x="8" y="7" width="1.5" height="6" rx="0.5" fill="#888" />
      <rect x="11" y="7" width="1.5" height="6" rx="0.5" fill="#888" />
      <rect x="14" y="7" width="1.5" height="6" rx="0.5" fill="#888" />
    </svg>
  );
}

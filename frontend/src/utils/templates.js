// Modern Standalone Template
// This file now exports a single modern template used for standalone/export.

function randomId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return 'id-' + Math.random().toString(36).slice(2) + '-' + Date.now();
}

// Single modern template aligning with the new design system
export function createModernStandaloneTemplate(manifest) {
  const widgets = [];
  const add = (type, props = {}) => widgets.push({
    id: randomId(),
    type,
    visible: true,
    locked: false,
    zIndex: 1,
    ...props,
  });

  // Header / Branding
  add('label', {
    label: 'NEBULA LITE',
    x: 24,
    y: 16,
    w: 620,
    h: 44,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'left',
    color: '#e5eaf0',
    letterSpacing: -0.25,
  });
  // Subtitle / Tagline
  add('label', {
    label: 'POLYPHONIC SYNTH',
    x: 24,
    y: 56,
    w: 600,
    h: 20,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'left',
    color: '#8ea4c2',
    letterSpacing: 1,
    textTransform: 'uppercase',
  });
  // Optional logo placeholder (replace in Assets)
  add('logo', {
    label: 'Logo',
    src: 'https://via.placeholder.com/160x44?text=LOGO',
    fit: 'contain',
    radius: 0,
    x: 1000,
    y: 16,
    w: 152,
    h: 44,
  });

  // Level strip (left column)
  add('fader', {
    label: 'Master',
    binding: 'masterGain',
    min: 0,
    max: 1,
    step: 0.01,
    value: manifest?.engine?.master ?? 0.85,
    x: 24,
    y: 80,
    w: 84,
    h: 240,
  });
  add('meter', { label: 'Level', x: 128, y: 80, w: 420, h: 40 });
  // Top-right state chip
  add('stateDisplay', { label: 'Instrument', stateBinding: 'state.selectedInstrument', x: 832, y: 80, w: 348, h: 40 });

  // FILTER section
  add('label', { label: 'FILTER', x: 128, y: 132, w: 360, h: 20, fontSize: 12, fontWeight: '700', color: '#8ea4c2', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 128, y: 156, w: 740, h: 2 });
  add('knob', { label: 'Cutoff',  binding: 'filterCutoff', min: 20, max: 20000, step: 1, value: 1200, unit: 'Hz', x: 128, y: 176, w: 120, h: 120 });
  add('knob', { label: 'Reso',    binding: 'filterQ',      min: 0.1, max: 10,    step: 0.1, value: 0.7,            x: 268, y: 176, w: 120, h: 120 });
  add('select', { label: 'Filter Type', binding: 'filterType', choices: ['lowpass','highpass','bandpass','notch'], value: 'lowpass', x: 408, y: 196, w: 180, h: 64 });

  // MODULATION section
  add('label', { label: 'MODULATION', x: 600, y: 132, w: 360, h: 20, fontSize: 12, fontWeight: '700', color: '#8ea4c2', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 600, y: 156, w: 552, h: 2 });
  add('knob', { label: 'Glide',   binding: 'glideTime',  min: 0,   max: 0.3,  step: 0.01, value: 0,    unit: 's',  x: 600, y: 176, w: 120, h: 120 });
  add('knob', { label: 'Mod Amt', binding: 'modWheel',   min: 0,   max: 1,    step: 0.01, value: 0,                 x: 740, y: 176, w: 120, h: 120 });
  add('knob', { label: 'Mod Rate',binding: 'modRate',    min: 0.1, max: 20,   step: 0.01, value: 3,    unit: 'Hz', x: 880, y: 176, w: 120, h: 120 });
  add('select', { label: 'Velocity Curve', binding: 'velocityCurve', choices: ['linear','soft','hard','log','exp'], value: 'linear', x: 1020, y: 196, w: 160, h: 64 });

  // ENVELOPE section
  add('label', { label: 'ENVELOPE', x: 128, y: 312, w: 360, h: 20, fontSize: 12, fontWeight: '700', color: '#8ea4c2', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 128, y: 336, w: 1052, h: 2 });
  add('knob', { label: 'Attack',  binding: 'envelopeAttack',  min: 0, max: 1, step: 0.01, value: 0.01, unit: 's', x: 128, y: 356, w: 120, h: 120 });
  add('knob', { label: 'Decay',   binding: 'envelopeDecay',   min: 0, max: 1, step: 0.01, value: 0.20, unit: 's', x: 268, y: 356, w: 120, h: 120 });
  add('knob', { label: 'Sustain', binding: 'envelopeSustain', min: 0, max: 1, step: 0.01, value: 0.90,             x: 408, y: 356, w: 120, h: 120 });
  add('knob', { label: 'Release', binding: 'envelopeRelease', min: 0, max: 1, step: 0.01, value: 0.30, unit: 's', x: 548, y: 356, w: 120, h: 120 });
  // Transpose quick control near envelope
  add('transpose', { label: 'Transpose', step: 1, value: 0, x: 688, y: 368, w: 140, h: 56 });

  // EFFECTS section
  add('label', { label: 'EFFECTS', x: 128, y: 496, w: 360, h: 20, fontSize: 12, fontWeight: '700', color: '#8ea4c2', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 128, y: 520, w: 1052, h: 2 });
  add('knob', { label: 'Delay',     binding: 'delayTime',     min: 0,   max: 2,    step: 0.01, value: 0.25, unit: 's', x: 128, y: 540, w: 120, h: 120 });
  add('knob', { label: 'Feedback',  binding: 'delayFeedback', min: 0,   max: 0.95, step: 0.01, value: 0.35, x: 268, y: 540, w: 120, h: 120 });
  add('knob', { label: 'Delay Mix', binding: 'delayMix',      min: 0,   max: 1,    step: 0.01, value: 0.25, x: 408, y: 540, w: 120, h: 120 });
  add('knob', { label: 'Reverb',    binding: 'reverbMix',     min: 0,   max: 1,    step: 0.01, value: 0.20, x: 548, y: 540, w: 120, h: 120 });
  add('toggle', { label: 'Limiter', binding: 'limiter', checked: false, x: 688, y: 560, w: 140, h: 72 });

  // ANALYZER
  add('label', { label: 'ANALYZER', x: 24, y: 620, w: 200, h: 20, fontSize: 12, fontWeight: '700', color: '#8ea4c2', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('spectrum', { label: 'Spectrum', x: 24, y: 644, w: 1156, h: 140 });

  // PERFORMANCE
  add('label', { label: 'PERFORMANCE', x: 24, y: 792, w: 240, h: 20, fontSize: 12, fontWeight: '700', color: '#8ea4c2', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 24, y: 816, w: 1156, h: 2 });
  add('pitchwheel', { label: 'Pitch', x: 24,  y: 828, w: 64,  h: 160, value: 0 });
  add('modwheel',   { label: 'Mod',   x: 96,  y: 828, w: 64,  h: 160, value: 0 });
  add('toggle',     { label: 'Sustain',   binding: 'sustain',   checked: !!(manifest?.engine?.sustain),   x: 176, y: 836, w: 140, h: 48 });
  add('toggle',     { label: 'Sostenuto', binding: 'sostenuto', checked: !!(manifest?.engine?.sostenuto), x: 176, y: 896, w: 140, h: 48 });
  add('keyboard',   { label: 'Keyboard', startMidi: 36, endMidi: 88, x: 336, y: 820, w: 844, h: 176 });

  return {
    widgets,
    canvas: {
      showGrid: false,
      gridSize: 20,
      snap: true,
      bgColor: '#0b1220',
      bgUrl: '',
      textureUrl: '',
      width: 1204,
      height: 1000,
    },
    presetName: 'Modern Standalone',
  };
}

// Note: Other legacy templates have been removed to keep a single, consistent modern design.




// Export modern and wooden templates
export function createWoodenStudioTemplate(manifest) {
  const widgets = [];
  const add = (type, props = {}) => widgets.push({ id: randomId(), type, visible: true, locked: false, zIndex: 1, ...props });

  // Branding
  add('label', { label: 'WOODEN STUDIO', x: 24, y: 16, w: 600, h: 40, fontSize: 26, fontWeight: '800', textAlign: 'left', color: '#f3e8d1', letterSpacing: 1, textTransform: 'uppercase' });
  add('label', { label: 'VINTAGE CONSOLE TEMPLATE', x: 24, y: 52, w: 600, h: 18, fontSize: 11, fontWeight: '700', textAlign: 'left', color: '#d9c6a3', letterSpacing: 1.2, textTransform: 'uppercase' });

  // Left strip: Master
  add('fader', { label: 'Master', binding: 'masterGain', min: 0, max: 1, step: 0.01, value: manifest?.engine?.master ?? 0.8, x: 24, y: 84, w: 84, h: 240 });
  add('meter', { label: 'Level', x: 120, y: 84, w: 420, h: 40 });

  // Filter block
  add('label', { label: 'FILTER', x: 120, y: 136, w: 360, h: 20, fontSize: 12, fontWeight: '700', color: '#d9c6a3', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 120, y: 160, w: 760, h: 2 });
  add('knob', { label: 'Cutoff', binding: 'filterCutoff', min: 20, max: 20000, step: 1, value: 1500, unit: 'Hz', x: 120, y: 176, w: 120, h: 120 });
  add('knob', { label: 'Reso', binding: 'filterQ', min: 0.1, max: 10, step: 0.1, value: 0.8, x: 260, y: 176, w: 120, h: 120 });
  add('select', { label: 'Type', binding: 'filterType', choices: ['lowpass','highpass','bandpass','notch'], value: 'lowpass', x: 400, y: 196, w: 180, h: 64 });

  // Envelope block
  add('label', { label: 'ENVELOPE', x: 120, y: 312, w: 360, h: 20, fontSize: 12, fontWeight: '700', color: '#d9c6a3', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 120, y: 336, w: 1052, h: 2 });
  add('knob', { label: 'Attack', binding: 'envelopeAttack', min: 0, max: 1, step: 0.01, value: 0.02, unit: 's', x: 120, y: 356, w: 120, h: 120 });
  add('knob', { label: 'Decay', binding: 'envelopeDecay', min: 0, max: 1, step: 0.01, value: 0.25, unit: 's', x: 260, y: 356, w: 120, h: 120 });
  add('knob', { label: 'Sustain', binding: 'envelopeSustain', min: 0, max: 1, step: 0.01, value: 0.85, x: 400, y: 356, w: 120, h: 120 });
  add('knob', { label: 'Release', binding: 'envelopeRelease', min: 0, max: 1, step: 0.01, value: 0.35, unit: 's', x: 540, y: 356, w: 120, h: 120 });
  add('transpose', { label: 'Transpose', step: 1, value: 0, x: 680, y: 368, w: 140, h: 56 });

  // Effects block
  add('label', { label: 'EFFECTS', x: 120, y: 496, w: 360, h: 20, fontSize: 12, fontWeight: '700', color: '#d9c6a3', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 120, y: 520, w: 1052, h: 2 });
  add('knob', { label: 'Delay', binding: 'delayTime', min: 0, max: 2, step: 0.01, value: 0.28, unit: 's', x: 120, y: 540, w: 120, h: 120 });
  add('knob', { label: 'Feedback', binding: 'delayFeedback', min: 0, max: 0.95, step: 0.01, value: 0.32, x: 260, y: 540, w: 120, h: 120 });
  add('knob', { label: 'Delay Mix', binding: 'delayMix', min: 0, max: 1, step: 0.01, value: 0.22, x: 400, y: 540, w: 120, h: 120 });
  add('knob', { label: 'Reverb', binding: 'reverbMix', min: 0, max: 1, step: 0.01, value: 0.25, x: 540, y: 540, w: 120, h: 120 });
  add('toggle', { label: 'Limiter', binding: 'limiter', checked: false, x: 680, y: 560, w: 140, h: 72 });

  // Analyzer
  add('label', { label: 'ANALYZER', x: 24, y: 680, w: 200, h: 20, fontSize: 12, fontWeight: '700', color: '#d9c6a3', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('spectrum', { label: 'Spectrum', x: 24, y: 704, w: 1156, h: 120 });

  // Performance
  add('label', { label: 'PERFORMANCE', x: 24, y: 840, w: 240, h: 20, fontSize: 12, fontWeight: '700', color: '#d9c6a3', textTransform: 'uppercase', textAlign: 'left', letterSpacing: 1 });
  add('divider', { label: 'Divider', x: 24, y: 864, w: 1156, h: 2 });
  add('pitchwheel', { label: 'Pitch', x: 24, y: 880, w: 64, h: 140, value: 0 });
  add('modwheel', { label: 'Mod', x: 96, y: 880, w: 64, h: 140, value: 0 });
  add('toggle', { label: 'Sustain', binding: 'sustain', checked: !!(manifest?.engine?.sustain), x: 176, y: 888, w: 140, h: 48 });
  add('toggle', { label: 'Sostenuto', binding: 'sostenuto', checked: !!(manifest?.engine?.sostenuto), x: 176, y: 948, w: 140, h: 48 });
  add('keyboard', { label: 'Keyboard', startMidi: 36, endMidi: 88, x: 336, y: 872, w: 844, h: 152 });

  // Add decorative hardware widgets (screws and grill)
  add('screw', { x: 32, y: 32, w: 32, h: 32, locked: true, visible: true, zIndex: 10 });
  add('screw', { x: 1140, y: 32, w: 32, h: 32, locked: true, visible: true, zIndex: 10 });
  add('screw', { x: 32, y: 1008, w: 32, h: 32, locked: true, visible: true, zIndex: 10 });
  add('screw', { x: 1140, y: 1008, w: 32, h: 32, locked: true, visible: true, zIndex: 10 });
  add('grill', { x: 560, y: 80, w: 84, h: 24, locked: true, visible: true, zIndex: 10 });

  // Wooden background via SVG data URL and subtle grain texture
  const bgSize = '512px';
  const bgRepeat = 'repeat';
  const bgUrl = generateWoodGrainDataUrl('walnut');

  return {
    widgets,
    canvas: {
      showGrid: false,
      gridSize: 20,
      snap: true,
      bgColor: '#2a1c11',
      bgUrl,
      bgSize,
      bgRepeat,
      textureUrl: '',
      width: 1204,
      height: 1064,
    },
    presetName: 'Wooden Studio',
  };
}

export function generateWoodGrainDataUrl(tone = 'walnut') {
  const tones = {
    walnut: { base: '#5b3a23', sat: 1, freq: '0.02', seed: 2 },
    mahogany:{ base: '#6b2f1a', sat: 1, freq: '0.022', seed: 5 },
    maple:  { base: '#caa46a', sat: 0.8, freq: '0.018', seed: 9 },
    ebony:  { base: '#2b1f16', sat: 0.9, freq: '0.02', seed: 12 },
  };
  const t = tones[tone] || tones.walnut;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <filter id="wood" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="${t.freq}" numOctaves="4" seed="${t.seed}" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="matrix" values="
        0.7 0.2 0.1 0 0,
        0.3 0.6 0.1 0 0,
        0.2 0.1 0.5 0 0,
        0   0   0   1 0" in="noise" result="grain"/>
      <feBlend in="SourceGraphic" in2="grain" mode="multiply" result="blended"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="${t.base}"/>
  <rect width="100%" height="100%" filter="url(#wood)" opacity="0.55"/>
</svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export const TEMPLATES = {
  'modern-standalone': {
    label: 'Modern Standalone',
    description: 'Polished modern UI for standalone/export',
    create: createModernStandaloneTemplate,
  },
  'wooden-studio': {
    label: 'Wooden Studio',
    description: 'Warm wooden console aesthetic with vintage vibes',
    create: createWoodenStudioTemplate,
  },
};

export function loadTemplate(templateId, manifest) {
  const template = TEMPLATES[templateId];
  if (!template) {
    throw new Error(`Template "${templateId}" not found`);
  }
  return template.create(manifest);
}

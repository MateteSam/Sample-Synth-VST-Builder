/**
 * AI Design Helper - Smart UI suggestions and optimization
 */

// Smart layout algorithms
export const LAYOUT_ALGORITHMS = {
  GRID: 'grid',
  FLOW: 'flow',
  RADIAL: 'radial',
  HIERARCHICAL: 'hierarchical',
};

// Color harmony rules
export const COLOR_HARMONIES = {
  ANALOGOUS: 'analogous',
  COMPLEMENTARY: 'complementary',
  TRIADIC: 'triadic',
  SPLIT_COMPLEMENTARY: 'split-complementary',
  TETRADIC: 'tetradic',
  MONOCHROMATIC: 'monochromatic',
};

/**
 * Analyze engine parameters and suggest appropriate widgets
 */
export function suggestWidgetsForEngine(engineParams = {}) {
  const suggestions = [];
  
  // Master controls
  if (engineParams.master) {
    suggestions.push({
      type: 'fader',
      label: 'Master Volume',
      paramId: 'master.volume',
      min: 0,
      max: 1,
      default: 0.7,
      priority: 'high',
      reason: 'Essential master volume control',
      suggestedPosition: { x: 50, y: 50 },
    });
    
    suggestions.push({
      type: 'knob',
      label: 'Master Pan',
      paramId: 'master.pan',
      min: -1,
      max: 1,
      default: 0,
      priority: 'medium',
      reason: 'Stereo positioning control',
      suggestedPosition: { x: 150, y: 50 },
    });
  }
  
  // Filter controls
  if (engineParams.filter) {
    suggestions.push({
      type: 'knob',
      label: 'Cutoff',
      paramId: 'filter.cutoff',
      min: 20,
      max: 20000,
      default: engineParams.filter.cutoff || 1000,
      priority: 'high',
      reason: 'Filter frequency control',
      suggestedPosition: { x: 250, y: 50 },
    });
    
    suggestions.push({
      type: 'knob',
      label: 'Resonance',
      paramId: 'filter.resonance',
      min: 0,
      max: 1,
      default: engineParams.filter.resonance || 0.5,
      priority: 'high',
      reason: 'Filter resonance control',
      suggestedPosition: { x: 350, y: 50 },
    });
    
    suggestions.push({
      type: 'select',
      label: 'Filter Type',
      paramId: 'filter.type',
      options: ['lowpass', 'highpass', 'bandpass', 'notch'],
      default: engineParams.filter.type || 'lowpass',
      priority: 'medium',
      reason: 'Filter type selection',
      suggestedPosition: { x: 450, y: 50 },
    });
  }
  
  // ADSR envelope
  if (engineParams.adsr) {
    const adsrParams = ['attack', 'decay', 'sustain', 'release'];
    adsrParams.forEach((param, idx) => {
      suggestions.push({
        type: 'slider',
        label: param.charAt(0).toUpperCase() + param.slice(1),
        paramId: `adsr.${param}`,
        min: param === 'sustain' ? 0 : 0.001,
        max: param === 'sustain' ? 1 : 5,
        default: engineParams.adsr[param] || (param === 'sustain' ? 0.7 : 0.5),
        priority: 'high',
        reason: `Envelope ${param} control`,
        suggestedPosition: { x: 50 + idx * 120, y: 150 },
      });
    });
  }
  
  // Effects
  if (engineParams.delay) {
    suggestions.push({
      type: 'knob',
      label: 'Delay Mix',
      paramId: 'delay.mix',
      min: 0,
      max: 1,
      default: engineParams.delay.mix || 0.3,
      priority: 'medium',
      reason: 'Delay wet/dry mix',
      suggestedPosition: { x: 550, y: 150 },
    });
    
    suggestions.push({
      type: 'knob',
      label: 'Delay Time',
      paramId: 'delay.time',
      min: 0.001,
      max: 2,
      default: engineParams.delay.time || 0.5,
      priority: 'low',
      reason: 'Delay time control',
      suggestedPosition: { x: 650, y: 150 },
    });
  }
  
  if (engineParams.reverb) {
    suggestions.push({
      type: 'knob',
      label: 'Reverb Mix',
      paramId: 'reverb.mix',
      min: 0,
      max: 1,
      default: engineParams.reverb.mix || 0.2,
      priority: 'medium',
      reason: 'Reverb wet/dry mix',
      suggestedPosition: { x: 550, y: 250 },
    });
  }
  
  // Always suggest essential visualization
  suggestions.push({
    type: 'meter',
    label: 'Output Level',
    paramId: null,
    priority: 'high',
    reason: 'Essential output metering',
    suggestedPosition: { x: 750, y: 50 },
    width: 30,
    height: 200,
  });
  
  suggestions.push({
    type: 'keyboard',
    label: 'Piano Keys',
    paramId: null,
    priority: 'high',
    reason: 'MIDI input visualization',
    suggestedPosition: { x: 50, y: 400 },
    width: 700,
    height: 100,
  });
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Auto-layout widgets using smart algorithms
 */
export function autoLayoutWidgets(widgets, algorithm = LAYOUT_ALGORITHMS.GRID, canvasWidth = 800, canvasHeight = 600) {
  const layoutWidgets = [...widgets];
  
  switch (algorithm) {
    case LAYOUT_ALGORITHMS.GRID:
      return gridLayout(layoutWidgets, canvasWidth, canvasHeight);
    case LAYOUT_ALGORITHMS.FLOW:
      return flowLayout(layoutWidgets, canvasWidth, canvasHeight);
    case LAYOUT_ALGORITHMS.RADIAL:
      return radialLayout(layoutWidgets, canvasWidth, canvasHeight);
    case LAYOUT_ALGORITHMS.HIERARCHICAL:
      return hierarchicalLayout(layoutWidgets, canvasWidth, canvasHeight);
    default:
      return layoutWidgets;
  }
}

function gridLayout(widgets, canvasWidth, canvasHeight) {
  const padding = 20;
  const cols = Math.ceil(Math.sqrt(widgets.length));
  const cellWidth = (canvasWidth - padding * 2) / cols;
  const cellHeight = 100; // Standard row height
  
  return widgets.map((widget, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    return {
      ...widget,
      x: padding + col * cellWidth + 10,
      y: padding + row * cellHeight + 10,
      width: Math.min(widget.width || 100, cellWidth - 20),
      height: widget.height || 40,
    };
  });
}

function flowLayout(widgets, canvasWidth, canvasHeight) {
  const padding = 20;
  const spacing = 15;
  let x = padding;
  let y = padding;
  let rowHeight = 0;
  
  return widgets.map((widget) => {
    const w = widget.width || 100;
    const h = widget.height || 40;
    
    // Wrap to next row if needed
    if (x + w > canvasWidth - padding) {
      x = padding;
      y += rowHeight + spacing;
      rowHeight = 0;
    }
    
    const positioned = { ...widget, x, y, width: w, height: h };
    x += w + spacing;
    rowHeight = Math.max(rowHeight, h);
    
    return positioned;
  });
}

function radialLayout(widgets, canvasWidth, canvasHeight) {
  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const radius = Math.min(canvasWidth, canvasHeight) * 0.35;
  const angleStep = (2 * Math.PI) / widgets.length;
  
  return widgets.map((widget, idx) => {
    const angle = idx * angleStep - Math.PI / 2; // Start at top
    const x = centerX + radius * Math.cos(angle) - (widget.width || 100) / 2;
    const y = centerY + radius * Math.sin(angle) - (widget.height || 40) / 2;
    
    return {
      ...widget,
      x: Math.max(10, Math.min(x, canvasWidth - (widget.width || 100) - 10)),
      y: Math.max(10, Math.min(y, canvasHeight - (widget.height || 40) - 10)),
    };
  });
}

function hierarchicalLayout(widgets, canvasWidth, canvasHeight) {
  // Group by priority/type
  const groups = {
    primary: widgets.filter(w => w.priority === 'high' || ['fader', 'meter'].includes(w.type)),
    secondary: widgets.filter(w => w.priority === 'medium' || ['knob', 'slider'].includes(w.type)),
    tertiary: widgets.filter(w => !['fader', 'meter', 'knob', 'slider'].includes(w.type)),
  };
  
  const result = [];
  let y = 20;
  
  // Primary controls (top row, larger)
  groups.primary.forEach((widget, idx) => {
    result.push({
      ...widget,
      x: 20 + idx * 120,
      y,
      width: widget.width || 80,
      height: widget.height || (widget.type === 'fader' ? 150 : 80),
    });
  });
  
  y += 180;
  
  // Secondary controls (grid layout)
  const secCols = Math.ceil(Math.sqrt(groups.secondary.length));
  groups.secondary.forEach((widget, idx) => {
    const col = idx % secCols;
    const row = Math.floor(idx / secCols);
    result.push({
      ...widget,
      x: 20 + col * 100,
      y: y + row * 80,
      width: widget.width || 80,
      height: widget.height || 60,
    });
  });
  
  y += Math.ceil(groups.secondary.length / secCols) * 80 + 20;
  
  // Tertiary controls (bottom, full width)
  groups.tertiary.forEach((widget, idx) => {
    result.push({
      ...widget,
      x: 20,
      y: y + idx * 120,
      width: widget.width || (canvasWidth - 40),
      height: widget.height || 100,
    });
  });
  
  return result;
}

/**
 * Distribute widgets evenly with proper spacing
 */
export function distributeWidgets(widgets, direction = 'horizontal') {
  if (widgets.length < 2) return widgets;
  
  const sorted = [...widgets].sort((a, b) => 
    direction === 'horizontal' ? a.x - b.x : a.y - b.y
  );
  
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalSpace = direction === 'horizontal' 
    ? (last.x + last.width) - first.x
    : (last.y + last.height) - first.y;
  
  const totalWidgetSize = sorted.reduce((sum, w) => 
    sum + (direction === 'horizontal' ? w.width : w.height), 0
  );
  
  const spacing = (totalSpace - totalWidgetSize) / (sorted.length - 1);
  
  let pos = direction === 'horizontal' ? first.x : first.y;
  
  return sorted.map((widget) => {
    const result = {
      ...widget,
      [direction === 'horizontal' ? 'x' : 'y']: pos,
    };
    pos += (direction === 'horizontal' ? widget.width : widget.height) + spacing;
    return result;
  });
}

/**
 * Align widgets to a common edge
 */
export function alignWidgets(widgets, alignment = 'left') {
  if (widgets.length === 0) return widgets;
  
  const alignmentMap = {
    left: () => Math.min(...widgets.map(w => w.x)),
    right: () => Math.max(...widgets.map(w => w.x + w.width)),
    top: () => Math.min(...widgets.map(w => w.y)),
    bottom: () => Math.max(...widgets.map(w => w.y + w.height)),
    centerH: () => {
      const left = Math.min(...widgets.map(w => w.x));
      const right = Math.max(...widgets.map(w => w.x + w.width));
      return (left + right) / 2;
    },
    centerV: () => {
      const top = Math.min(...widgets.map(w => w.y));
      const bottom = Math.max(...widgets.map(w => w.y + w.height));
      return (top + bottom) / 2;
    },
  };
  
  const alignTo = alignmentMap[alignment]();
  
  return widgets.map(widget => {
    switch (alignment) {
      case 'left':
        return { ...widget, x: alignTo };
      case 'right':
        return { ...widget, x: alignTo - widget.width };
      case 'top':
        return { ...widget, y: alignTo };
      case 'bottom':
        return { ...widget, y: alignTo - widget.height };
      case 'centerH':
        return { ...widget, x: alignTo - widget.width / 2 };
      case 'centerV':
        return { ...widget, y: alignTo - widget.height / 2 };
      default:
        return widget;
    }
  });
}

/**
 * Generate color palette based on harmony rules
 */
export function generateColorPalette(baseColor, harmony = COLOR_HARMONIES.ANALOGOUS) {
  const hsl = hexToHSL(baseColor);
  
  switch (harmony) {
    case COLOR_HARMONIES.ANALOGOUS:
      return [
        baseColor,
        hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 20, 100)),
        hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 0)),
      ];
      
    case COLOR_HARMONIES.COMPLEMENTARY:
      return [
        baseColor,
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 100)),
        hslToHex((hsl.h + 180) % 360, hsl.s, Math.min(hsl.l + 15, 100)),
        hslToHex(hsl.h, Math.max(hsl.s - 30, 0), hsl.l),
      ];
      
    case COLOR_HARMONIES.TRIADIC:
      return [
        baseColor,
        hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 20, 100)),
        hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 0)),
      ];
      
    case COLOR_HARMONIES.SPLIT_COMPLEMENTARY:
      return [
        baseColor,
        hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 15, 100)),
        hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 15, 0)),
      ];
      
    case COLOR_HARMONIES.TETRADIC:
      return [
        baseColor,
        hslToHex((hsl.h + 90) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 270) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 10, 100)),
      ];
      
    case COLOR_HARMONIES.MONOCHROMATIC:
      return [
        baseColor,
        hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 20, 100)),
        hslToHex(hsl.h, hsl.s, Math.max(hsl.l - 20, 0)),
        hslToHex(hsl.h, Math.max(hsl.s - 20, 0), hsl.l),
        hslToHex(hsl.h, Math.min(hsl.s + 20, 100), hsl.l),
      ];
      
    default:
      return [baseColor, '#ffffff', '#000000', '#888888', '#cccccc'];
  }
}

/**
 * Suggest accessible color combinations
 */
export function suggestAccessibleColors(backgroundColor) {
  const bgHSL = hexToHSL(backgroundColor);
  const isLight = bgHSL.l > 50;
  
  return {
    text: isLight ? '#000000' : '#ffffff',
    primary: isLight ? hslToHex(bgHSL.h, 60, 30) : hslToHex(bgHSL.h, 60, 70),
    secondary: isLight ? hslToHex((bgHSL.h + 30) % 360, 50, 40) : hslToHex((bgHSL.h + 30) % 360, 50, 60),
    accent: isLight ? hslToHex((bgHSL.h + 180) % 360, 70, 40) : hslToHex((bgHSL.h + 180) % 360, 70, 60),
    border: isLight ? '#cccccc' : '#444444',
  };
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1, color2) {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getRelativeLuminance(hex) {
  const rgb = hexToRGB(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
    const sRGB = val / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Color conversion helpers
function hexToRGB(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : { r: 0, g: 0, b: 0 };
}

function hexToHSL(hex) {
  const rgb = hexToRGB(hex);
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: h = 0;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Optimize widget sizes based on type and importance
 */
export function optimizeWidgetSizes(widgets) {
  const sizeMap = {
    fader: { width: 60, height: 150 },
    slider: { width: 200, height: 40 },
    knob: { width: 80, height: 80 },
    toggle: { width: 60, height: 30 },
    button: { width: 100, height: 40 },
    select: { width: 150, height: 35 },
    xy: { width: 150, height: 150 },
    keyboard: { width: 700, height: 100 },
    meter: { width: 30, height: 200 },
    spectrum: { width: 400, height: 150 },
    label: { width: 100, height: 30 },
    image: { width: 100, height: 100 },
    stateDisplay: { width: 200, height: 100 },
    divider: { width: 300, height: 2 },
  };
  
  return widgets.map(widget => ({
    ...widget,
    width: widget.width || sizeMap[widget.type]?.width || 100,
    height: widget.height || sizeMap[widget.type]?.height || 40,
  }));
}

/**
 * Detect and fix overlapping widgets
 */
export function resolveOverlaps(widgets, padding = 10) {
  const resolved = [...widgets];
  
  for (let i = 0; i < resolved.length; i++) {
    for (let j = i + 1; j < resolved.length; j++) {
      const a = resolved[i];
      const b = resolved[j];
      
      // Check if overlapping
      if (a.x < b.x + b.width + padding &&
          a.x + a.width + padding > b.x &&
          a.y < b.y + b.height + padding &&
          a.y + a.height + padding > b.y) {
        // Move widget b to avoid overlap
        b.x = a.x + a.width + padding;
      }
    }
  }
  
  return resolved;
}

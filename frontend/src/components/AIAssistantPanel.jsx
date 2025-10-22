import React, { useState } from 'react';
import { useInstrument } from '../state/instrument';
import {
  suggestWidgetsForEngine,
  autoLayoutWidgets,
  distributeWidgets,
  alignWidgets,
  generateColorPalette,
  suggestAccessibleColors,
  getContrastRatio,
  optimizeWidgetSizes,
  resolveOverlaps,
  LAYOUT_ALGORITHMS,
  COLOR_HARMONIES,
} from '../utils/aiDesignHelper';

export default function AIAssistantPanel({ onApplySuggestion }) {
  const { manifest, updateManifest } = useInstrument();
  const [activeTab, setActiveTab] = useState('suggest');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(LAYOUT_ALGORITHMS.GRID);
  const [selectedHarmony, setSelectedHarmony] = useState(COLOR_HARMONIES.ANALOGOUS);
  const [baseColor, setBaseColor] = useState('#4CAF50');

  const generateSuggestions = () => {
    const engineParams = manifest.engine || {};
    const widgetSuggestions = suggestWidgetsForEngine(engineParams);
    setSuggestions(widgetSuggestions);
  };

  const applyWidgetSuggestion = (suggestion) => {
    const newWidget = {
      id: `widget-${Date.now()}`,
      type: suggestion.type,
      x: suggestion.suggestedPosition?.x || 50,
      y: suggestion.suggestedPosition?.y || 50,
      width: suggestion.width || (suggestion.type === 'slider' ? 200 : 80),
      height: suggestion.height || 40,
      label: suggestion.label,
      paramId: suggestion.paramId,
      min: suggestion.min,
      max: suggestion.max,
      default: suggestion.default,
      options: suggestion.options,
      style: {
        fillColor: baseColor,
        trackColor: '#333333',
        textColor: '#ffffff',
        fontSize: 14,
        fontFamily: 'Arial',
      },
    };

    const currentBindings = manifest.ui?.bindings || [];
    updateManifest({
      ui: {
        ...manifest.ui,
        bindings: [...currentBindings, newWidget],
        bindingOrder: [...(manifest.ui?.bindingOrder || []), newWidget.id],
      },
    });

    if (onApplySuggestion) onApplySuggestion(newWidget);
  };

  const applyAutoLayout = () => {
    const currentBindings = manifest.ui?.bindings || [];
    if (currentBindings.length === 0) return;

    const canvas = manifest.ui?.canvas || { width: 800, height: 600 };
    const layouted = autoLayoutWidgets(currentBindings, selectedLayout, canvas.width, canvas.height);

    updateManifest({
      ui: {
        ...manifest.ui,
        bindings: layouted,
      },
    });
  };

  const applyDistribute = (direction) => {
    const currentBindings = manifest.ui?.bindings || [];
    if (currentBindings.length < 2) return;

    const distributed = distributeWidgets(currentBindings, direction);

    updateManifest({
      ui: {
        ...manifest.ui,
        bindings: distributed,
      },
    });
  };

  const applyAlign = (alignment) => {
    const currentBindings = manifest.ui?.bindings || [];
    if (currentBindings.length === 0) return;

    const aligned = alignWidgets(currentBindings, alignment);

    updateManifest({
      ui: {
        ...manifest.ui,
        bindings: aligned,
      },
    });
  };

  const applyColorPalette = () => {
    const palette = generateColorPalette(baseColor, selectedHarmony);
    const accessible = suggestAccessibleColors(palette[0]);

    updateManifest({
      ui: {
        ...manifest.ui,
        theme: {
          primary: palette[0],
          secondary: palette[1],
          accent: palette[2],
          background: accessible.text === '#ffffff' ? '#1e1e1e' : '#f5f5f5',
          text: accessible.text,
          border: accessible.border,
        },
        canvas: {
          ...manifest.ui?.canvas,
          backgroundColor: accessible.text === '#ffffff' ? '#1e1e1e' : '#f5f5f5',
        },
      },
    });
  };

  const optimizeSizes = () => {
    const currentBindings = manifest.ui?.bindings || [];
    const optimized = optimizeWidgetSizes(currentBindings);

    updateManifest({
      ui: {
        ...manifest.ui,
        bindings: optimized,
      },
    });
  };

  const fixOverlaps = () => {
    const currentBindings = manifest.ui?.bindings || [];
    const resolved = resolveOverlaps(currentBindings, 15);

    updateManifest({
      ui: {
        ...manifest.ui,
        bindings: resolved,
      },
    });
  };

  const checkAccessibility = () => {
    const theme = manifest.ui?.theme || {};
    const bg = theme.background || '#1e1e1e';
    const text = theme.text || '#ffffff';
    const primary = theme.primary || '#4CAF50';

    const textContrast = getContrastRatio(bg, text);
    const primaryContrast = getContrastRatio(bg, primary);

    return {
      textContrast,
      textAA: textContrast >= 4.5,
      textAAA: textContrast >= 7,
      primaryContrast,
      primaryAA: primaryContrast >= 3,
    };
  };

  const accessibility = checkAccessibility();

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>🤖 AI Assistant</h3>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'suggest' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('suggest')}
        >
          Suggestions
        </button>
        <button
          style={activeTab === 'layout' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('layout')}
        >
          Layout
        </button>
        <button
          style={activeTab === 'colors' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('colors')}
        >
          Colors
        </button>
        <button
          style={activeTab === 'optimize' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('optimize')}
        >
          Optimize
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'suggest' && (
          <div>
            <p style={styles.description}>
              Get smart widget suggestions based on your engine parameters
            </p>
            <button style={styles.button} onClick={generateSuggestions}>
              🔍 Analyze Engine & Suggest
            </button>

            {suggestions.length > 0 && (
              <div style={styles.suggestions}>
                <p style={styles.sectionTitle}>
                  {suggestions.length} Suggestions Found
                </p>
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} style={styles.suggestion}>
                    <div style={styles.suggestionHeader}>
                      <span style={styles.suggestionType}>{suggestion.type}</span>
                      <span
                        style={{
                          ...styles.suggestionPriority,
                          backgroundColor:
                            suggestion.priority === 'high'
                              ? '#f44336'
                              : suggestion.priority === 'medium'
                              ? '#FF9800'
                              : '#4CAF50',
                        }}
                      >
                        {suggestion.priority}
                      </span>
                    </div>
                    <p style={styles.suggestionLabel}>{suggestion.label}</p>
                    <p style={styles.suggestionReason}>{suggestion.reason}</p>
                    <button
                      style={styles.smallButton}
                      onClick={() => applyWidgetSuggestion(suggestion)}
                    >
                      + Add to Canvas
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'layout' && (
          <div>
            <p style={styles.description}>
              Auto-arrange widgets with smart layout algorithms
            </p>

            <div style={styles.section}>
              <label style={styles.label}>Layout Algorithm</label>
              <select
                style={styles.select}
                value={selectedLayout}
                onChange={(e) => setSelectedLayout(e.target.value)}
              >
                <option value={LAYOUT_ALGORITHMS.GRID}>Grid Layout</option>
                <option value={LAYOUT_ALGORITHMS.FLOW}>Flow Layout</option>
                <option value={LAYOUT_ALGORITHMS.RADIAL}>Radial Layout</option>
                <option value={LAYOUT_ALGORITHMS.HIERARCHICAL}>
                  Hierarchical Layout
                </option>
              </select>
              <button style={styles.button} onClick={applyAutoLayout}>
                ✨ Apply Auto-Layout
              </button>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Distribute</p>
              <div style={styles.buttonRow}>
                <button
                  style={styles.smallButton}
                  onClick={() => applyDistribute('horizontal')}
                >
                  ↔️ Horizontal
                </button>
                <button
                  style={styles.smallButton}
                  onClick={() => applyDistribute('vertical')}
                >
                  ↕️ Vertical
                </button>
              </div>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Align</p>
              <div style={styles.buttonGrid}>
                <button style={styles.smallButton} onClick={() => applyAlign('left')}>
                  ⬅️ Left
                </button>
                <button style={styles.smallButton} onClick={() => applyAlign('centerH')}>
                  ↔️ Center H
                </button>
                <button style={styles.smallButton} onClick={() => applyAlign('right')}>
                  ➡️ Right
                </button>
                <button style={styles.smallButton} onClick={() => applyAlign('top')}>
                  ⬆️ Top
                </button>
                <button style={styles.smallButton} onClick={() => applyAlign('centerV')}>
                  ↕️ Center V
                </button>
                <button style={styles.smallButton} onClick={() => applyAlign('bottom')}>
                  ⬇️ Bottom
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div>
            <p style={styles.description}>
              Generate beautiful color palettes with harmony rules
            </p>

            <div style={styles.section}>
              <label style={styles.label}>Base Color</label>
              <input
                type="color"
                style={styles.colorInput}
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
              />
            </div>

            <div style={styles.section}>
              <label style={styles.label}>Color Harmony</label>
              <select
                style={styles.select}
                value={selectedHarmony}
                onChange={(e) => setSelectedHarmony(e.target.value)}
              >
                <option value={COLOR_HARMONIES.ANALOGOUS}>Analogous</option>
                <option value={COLOR_HARMONIES.COMPLEMENTARY}>Complementary</option>
                <option value={COLOR_HARMONIES.TRIADIC}>Triadic</option>
                <option value={COLOR_HARMONIES.SPLIT_COMPLEMENTARY}>
                  Split Complementary
                </option>
                <option value={COLOR_HARMONIES.TETRADIC}>Tetradic</option>
                <option value={COLOR_HARMONIES.MONOCHROMATIC}>Monochromatic</option>
              </select>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Preview Palette</p>
              <div style={styles.palettePreview}>
                {generateColorPalette(baseColor, selectedHarmony).map((color, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: color,
                    }}
                    title={color}
                  />
                ))}
              </div>
              <button style={styles.button} onClick={applyColorPalette}>
                🎨 Apply Palette
              </button>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Accessibility Check</p>
              <div style={styles.accessibilityReport}>
                <div style={styles.accessibilityItem}>
                  <span>Text Contrast:</span>
                  <span style={styles.contrastRatio}>
                    {accessibility.textContrast.toFixed(2)}:1
                  </span>
                  <span>
                    {accessibility.textAAA ? '✅ AAA' : accessibility.textAA ? '✅ AA' : '❌'}
                  </span>
                </div>
                <div style={styles.accessibilityItem}>
                  <span>Primary Contrast:</span>
                  <span style={styles.contrastRatio}>
                    {accessibility.primaryContrast.toFixed(2)}:1
                  </span>
                  <span>{accessibility.primaryAA ? '✅ AA' : '❌'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'optimize' && (
          <div>
            <p style={styles.description}>
              Optimize your design for better usability and appearance
            </p>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Widget Optimization</p>
              <button style={styles.button} onClick={optimizeSizes}>
                📐 Optimize Widget Sizes
              </button>
              <p style={styles.hint}>
                Automatically adjust widget sizes based on type and best practices
              </p>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Layout Fixes</p>
              <button style={styles.button} onClick={fixOverlaps}>
                🔧 Fix Overlapping Widgets
              </button>
              <p style={styles.hint}>
                Automatically resolve overlapping widgets with smart positioning
              </p>
            </div>

            <div style={styles.section}>
              <p style={styles.sectionTitle}>Design Stats</p>
              <div style={styles.stats}>
                <div style={styles.stat}>
                  <span style={styles.statValue}>
                    {manifest.ui?.bindings?.length || 0}
                  </span>
                  <span style={styles.statLabel}>Widgets</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statValue}>
                    {manifest.ui?.assets?.length || 0}
                  </span>
                  <span style={styles.statLabel}>Assets</span>
                </div>
                <div style={styles.stat}>
                  <span style={styles.statValue}>
                    {manifest.ui?.canvas?.width || 800}x
                    {manifest.ui?.canvas?.height || 600}
                  </span>
                  <span style={styles.statLabel}>Canvas</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  panel: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 15px',
    borderBottom: '1px solid #444',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #444',
    backgroundColor: '#1e1e1e',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s',
  },
  tabActive: {
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: '#2a2a2a',
    color: '#4CAF50',
    cursor: 'pointer',
    fontSize: '13px',
    borderBottom: '2px solid #4CAF50',
  },
  content: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto',
  },
  description: {
    margin: '0 0 15px 0',
    fontSize: '13px',
    color: '#aaa',
    lineHeight: '1.5',
  },
  button: {
    width: '100%',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginBottom: '10px',
  },
  smallButton: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#555',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontSize: '13px',
    color: '#ccc',
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #555',
    borderRadius: '4px',
    backgroundColor: '#1e1e1e',
    color: '#fff',
    fontSize: '13px',
    marginBottom: '10px',
  },
  colorInput: {
    width: '100%',
    height: '40px',
    border: '1px solid #555',
    borderRadius: '4px',
    backgroundColor: '#1e1e1e',
    cursor: 'pointer',
  },
  buttonRow: {
    display: 'flex',
    gap: '10px',
  },
  buttonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
  },
  suggestions: {
    marginTop: '15px',
  },
  suggestion: {
    padding: '12px',
    backgroundColor: '#1e1e1e',
    borderRadius: '4px',
    marginBottom: '10px',
    border: '1px solid #444',
  },
  suggestionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  suggestionType: {
    fontSize: '12px',
    color: '#4CAF50',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionPriority: {
    fontSize: '10px',
    padding: '2px 8px',
    borderRadius: '10px',
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionLabel: {
    margin: '0 0 5px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff',
  },
  suggestionReason: {
    margin: '0 0 10px 0',
    fontSize: '12px',
    color: '#aaa',
  },
  palettePreview: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
  },
  colorSwatch: {
    flex: 1,
    height: '50px',
    borderRadius: '4px',
    border: '1px solid #555',
  },
  accessibilityReport: {
    padding: '10px',
    backgroundColor: '#1e1e1e',
    borderRadius: '4px',
    border: '1px solid #444',
  },
  accessibilityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    fontSize: '13px',
    color: '#ccc',
  },
  contrastRatio: {
    fontWeight: '600',
    color: '#fff',
  },
  hint: {
    margin: '5px 0 0 0',
    fontSize: '12px',
    color: '#777',
    fontStyle: 'italic',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  stat: {
    padding: '15px',
    backgroundColor: '#1e1e1e',
    borderRadius: '4px',
    border: '1px solid #444',
    textAlign: 'center',
  },
  statValue: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: '5px',
  },
  statLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#aaa',
    textTransform: 'uppercase',
  },
};

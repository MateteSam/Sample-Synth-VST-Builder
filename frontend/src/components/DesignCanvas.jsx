import React, { useRef, useState, useEffect } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import WidgetRenderer from './WidgetRenderer.jsx';

/**
 * Design Canvas Component
 * Renders the canvas area for the Design tab with grid support
 */
export default function DesignCanvas({
  widgets = [],
  selectedIds = [],
  setSelectedIds = () => {},
  onUpdateWidget = () => {},
  onWidgetMove = () => {},
  onWidgetResize = () => {},
  canvas = {},
  engine = null,
  showGrid = true,
  showLabels = true,
  snap = true,
  gridSize = 20
}) {
  const canvasRef = useRef(null);
  const [dragSelection, setDragSelection] = useState(null);
  const [guideLinesH, setGuideLinesH] = useState([]);
  const [guideLinesV, setGuideLinesV] = useState([]);

  // Safety: ensure widgets is always an array
  const safeWidgets = Array.isArray(widgets) ? widgets : [];

  // Multi-select with drag rectangle
  const handleCanvasMouseDown = (e) => {
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setDragSelection({ startX, startY, endX: startX, endY: startY });

    const handleMove = (ev) => {
      const x = ev.clientX - rect.left;
      const y = ev.clientY - rect.top;
      setDragSelection(prev => ({ ...prev, endX: x, endY: y }));
    };

    const handleUp = () => {
      // Select all widgets within the drag rectangle
      if (dragSelection) {
        const minX = Math.min(dragSelection.startX, dragSelection.endX);
        const maxX = Math.max(dragSelection.startX, dragSelection.endX);
        const minY = Math.min(dragSelection.startY, dragSelection.endY);
        const maxY = Math.max(dragSelection.startY, dragSelection.endY);

        const selected = safeWidgets.filter(w => {
          return w.x >= minX && w.x + w.w <= maxX &&
                 w.y >= minY && w.y + w.h <= maxY;
        }).map(w => w.id);

        setSelectedIds(selected);
      }
      setDragSelection(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Alignment guides
  const showAlignmentGuides = (widget, dx, dy) => {
    const horizontalLines = [];
    const verticalLines = [];
    const threshold = 5;

    (safeWidgets || []).forEach(other => {
      if (other.id === widget.id || !other.visible) return;

      // Vertical alignment (left, center, right)
      if (Math.abs((widget.x + dx) - other.x) < threshold) {
        verticalLines.push(other.x);
      }
      if (Math.abs((widget.x + dx + widget.w) - (other.x + other.w)) < threshold) {
        verticalLines.push(other.x + other.w);
      }
      if (Math.abs((widget.x + dx + widget.w / 2) - (other.x + other.w / 2)) < threshold) {
        verticalLines.push(other.x + other.w / 2);
      }

      // Horizontal alignment (top, center, bottom)
      if (Math.abs((widget.y + dy) - other.y) < threshold) {
        horizontalLines.push(other.y);
      }
      if (Math.abs((widget.y + dy + widget.h) - (other.y + other.h)) < threshold) {
        horizontalLines.push(other.y + other.h);
      }
      if (Math.abs((widget.y + dy + widget.h / 2) - (other.y + other.h / 2)) < threshold) {
        horizontalLines.push(other.y + other.h / 2);
      }
    });

    setGuideLinesH([...new Set(horizontalLines)]);
    setGuideLinesV([...new Set(verticalLines)]);
  };

  const clearAlignmentGuides = () => {
    setGuideLinesH([]);
    setGuideLinesV([]);
  };

  // Calculate canvas size to fit all widgets
  const maxX = Math.max(1200, ...(safeWidgets.length > 0 ? safeWidgets.map(w => (w.x + w.w)) : [1200]));
  const maxY = Math.max(800, ...(safeWidgets.length > 0 ? safeWidgets.map(w => (w.y + w.h)) : [800]));

  return (
    <div
      ref={canvasRef}
      className="design-canvas"
      onMouseDown={handleCanvasMouseDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 600,
        background: canvas?.bgColor || '#1e293b',
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Canvas grid background */}
      {showGrid && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <defs>
            <pattern id="grid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
              <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(200,200,200,0.1)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}

      {/* Render widgets */}
      {safeWidgets.map((widget) => (
        <WidgetRenderer
          key={widget.id}
          widget={widget}
          isSelected={selectedIds.includes(widget.id)}
          onSelect={() => setSelectedIds([widget.id])}
          onMove={onWidgetMove}
          onResize={onWidgetResize}
          snap={snap}
          gridSize={gridSize}
        />
      ))}

      {/* Alignment guides */}
      {guideLinesH.map((y, i) => (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            width: '100%',
            height: 1,
            background: 'rgba(255, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        />
      ))}
      {guideLinesV.map((x, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            left: x,
            width: 1,
            height: '100%',
            background: 'rgba(255, 0, 0, 0.5)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        />
      ))}

      {/* Drag selection rectangle */}
      {dragSelection && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(dragSelection.startX, dragSelection.endX),
            top: Math.min(dragSelection.startY, dragSelection.endY),
            width: Math.abs(dragSelection.endX - dragSelection.startX),
            height: Math.abs(dragSelection.endY - dragSelection.startY),
            border: '2px dashed rgba(100, 150, 255, 0.5)',
            background: 'rgba(100, 150, 255, 0.1)',
            pointerEvents: 'none',
            zIndex: 50
          }}
        />
      )}

      {/* Empty state message */}
      {safeWidgets.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#999',
            pointerEvents: 'none',
            zIndex: 10
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '10px', fontWeight: 600 }}>
            No components added yet
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>
            Add components from the library to get started
          </div>
        </div>
      )}
    </div>
  );
}

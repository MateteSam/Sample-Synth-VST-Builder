import React, { useRef, useState, useEffect } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import WidgetRenderer from './WidgetRenderer.jsx';

// Professional drag-and-drop canvas with advanced features
export default function DesignCanvas({ 
  widgets, 
  selectedIds, 
  setSelectedIds,
  onUpdateWidget,
  onWidgetMove,
  onWidgetResize,
  canvas,
  engine,
  showGrid = true,
  showLabels = true,
  snap = true,
  gridSize = 20
}) {
  const canvasRef = useRef(null);
  const [dragSelection, setDragSelection] = useState(null);
  const [guideLinesH, setGuideLinesH] = useState([]);
  const [guideLinesV, setGuideLinesV] = useState([]);

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

  // Calculate canvas size to fit all widgets (with safety fallback)
  const safeWidgets = widgets || [];
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
        background: canvas?.bgColor || 'var(--surface)',
        overflow: 'auto'
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
            pointerEvents: 'none'
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
            pointerEvents: 'none'
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
            pointerEvents: 'none'
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
            pointerEvents: 'none'
          }}
        >
          <div style={{ fontSize: '14px', marginBottom: '10px' }}>No components added yet</div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Add components from the library to get started</div>
        </div>
      )}
    </div>
  );
      }}
    >
      <div
        className="canvas-content"
        style={{
          position: 'relative',
          minWidth: maxX + 40,
          minHeight: maxY + 40,
        }}
      >
      {/* Background image */}
      {canvas?.bgUrl && (
        <div 
          className="canvas-bg-image"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${canvas.bgUrl})`,
            backgroundSize: canvas.bgSize || 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: canvas.bgOpacity || 1,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Texture overlay */}
      {canvas?.textureUrl && (
        <div 
          className="canvas-texture"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${canvas.textureUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'repeat',
            opacity: canvas.textureOpacity || 0.25,
            mixBlendMode: 'overlay',
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Grid overlay */}
      {showGrid && (
        <div 
          className="canvas-grid"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(147,197,253,0.12) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(147,197,253,0.12) 1px, transparent 1px)
            `,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Alignment guides */}
      {guideLinesH.map((y, i) => (
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            height: 1,
            background: 'var(--accent-2)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      ))}
      {guideLinesV.map((x, i) => (
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: x,
            width: 1,
            background: 'var(--accent-2)',
            pointerEvents: 'none',
            zIndex: 1000
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
            border: '2px dashed var(--accent-2)',
            background: 'rgba(0,234,255,0.1)',
            pointerEvents: 'none',
            zIndex: 999
          }}
        />
      )}

      {/* Render widgets */}
      {widgets.map(widget => (
        <Widget
          key={widget.id}
          widget={widget}
          selected={selectedIds.includes(widget.id)}
          onSelect={() => setSelectedIds([widget.id])}
          onUpdate={onUpdateWidget}
          onMove={onWidgetMove}
          onResize={onWidgetResize}
          showLabel={showLabels}
          snap={snap}
          gridSize={gridSize}
          engine={engine}
          showAlignmentGuides={showAlignmentGuides}
          clearAlignmentGuides={clearAlignmentGuides}
        />
      ))}
      </div>
    </div>
  );
}

// Individual widget component with all interactivity
function Widget({ 
  widget, 
  selected, 
  onSelect, 
  onUpdate, 
  onMove, 
  onResize,
  showLabel,
  snap,
  gridSize,
  engine,
  showAlignmentGuides,
  clearAlignmentGuides
}) {
  const { manifest } = useInstrument();

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const handlePointerDown = (e) => {
    if (widget.locked) return;
    e.stopPropagation();
    onSelect();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = widget.x;
    const origY = widget.y;

    const handleMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      let newX = origX + dx;
      let newY = origY + dy;

      if (snap) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
      }

      newX = clamp(newX, 0, 4000);
      newY = clamp(newY, 0, 4000);

      showAlignmentGuides(widget, dx, dy);
      onMove(widget.id, newX, newY);
    };

    const handleUp = () => {
      clearAlignmentGuides();
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const handleResizeCorner = (e, corner) => {
    if (widget.locked) return;
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = widget.x;
    const origY = widget.y;
    const origW = widget.w;
    const origH = widget.h;
    const aspectRatio = origH / origW;

    const handleMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      let newX = origX;
      let newY = origY;
      let newW = origW;
      let newH = origH;

      if (corner === 'se') {
        newW = Math.max(40, origW + dx);
        newH = Math.max(24, Math.round(newW * aspectRatio));
      } else if (corner === 'ne') {
        newW = Math.max(40, origW + dx);
        newH = Math.max(24, Math.round(newW * aspectRatio));
        newY = origY - (newH - origH);
      } else if (corner === 'sw') {
        newW = Math.max(40, origW - dx);
        newH = Math.max(24, Math.round(newW * aspectRatio));
        newX = origX + (origW - newW);
      } else if (corner === 'nw') {
        newW = Math.max(40, origW - dx);
        newH = Math.max(24, Math.round(newW * aspectRatio));
        newX = origX + (origW - newW);
        newY = origY + (origH - newH);
      }

      if (snap) {
        newX = Math.round(newX / gridSize) * gridSize;
        newY = Math.round(newY / gridSize) * gridSize;
        newW = Math.round(newW / gridSize) * gridSize;
        newH = Math.round(newH / gridSize) * gridSize;
      }

      onResize(widget.id, newX, newY, newW, newH);
    };

    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  if (!widget.visible) return null;

    return (
      <div
        className={`widget widget-${widget.type} ${selected ? 'selected' : ''}`}
        style={{
          position: 'absolute',
          left: widget.x,
          top: widget.y,
          width: widget.w,
          height: widget.h,
          zIndex: widget.zIndex || 1
        }}
        onPointerDown={handlePointerDown}
        onContextMenu={(e) => {
          e.preventDefault();
          if (widget.locked) return;
          onUpdate(widget.id, { transparent: !widget.transparent });
        }}
      >
        {showLabel && (
          <div className="widget-title">{widget.label || widget.type}</div>
        )}
        <div className="widget-body">
          <WidgetRenderer 
            widget={widget} 
            manifest={manifest} 
            engine={engine} 
            onUpdate={onUpdate}
            isDesignMode={true}
            showLabels={true}
            onNoteOn={(midi, vel) => engine?.noteOn?.(midi, vel)}
            onNoteOff={(midi) => engine?.noteOff?.(midi)}
          />
        </div>
        {/* Resize handles */}
        {!widget.locked && selected && (
          <div className="resize-handles">
            <div className="resize-handle nw" onPointerDown={(e) => handleResizeCorner(e, 'nw')} />
            <div className="resize-handle ne" onPointerDown={(e) => handleResizeCorner(e, 'ne')} />
            <div className="resize-handle se" onPointerDown={(e) => handleResizeCorner(e, 'se')} />
            <div className="resize-handle sw" onPointerDown={(e) => handleResizeCorner(e, 'sw')} />
          </div>
        )}
      </div>
    );
}

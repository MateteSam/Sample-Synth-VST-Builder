import React, { useState, useEffect } from 'react';
import { useInstrument } from '../state/instrument';

/**
 * Pattern Display Widget - Shows sequencer pattern as grid of steps
 */
export function PatternDisplayWidget({ 
  config = {},
  isDesignMode = false,
  style = {},
}) {
  const { manifest } = useInstrument();
  const sequence = manifest.sequence || {};
  const tracks = sequence.tracks || [];
  
  const {
    trackIndex = 0,
    showLabels = true,
    showVelocity = false,
    stepCount = 16,
    cellSize = 20,
    activeColor = '#4CAF50',
    inactiveColor = '#333333',
    currentStepColor = '#FFC107',
    backgroundColor = '#1e1e1e',
  } = config;

  const track = tracks[trackIndex] || { pattern: Array(stepCount).fill(0), name: 'Track 1' };
  const pattern = track.pattern || Array(stepCount).fill(0);
  const currentStep = isDesignMode ? -1 : (sequence.currentStep || 0);

  return (
    <div style={{
      ...style,
      backgroundColor,
      padding: '10px',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      {showLabels && (
        <div style={{
          fontSize: '12px',
          color: '#fff',
          marginBottom: '8px',
          fontWeight: '600',
        }}>
          {track.name || `Track ${trackIndex + 1}`}
        </div>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(stepCount, pattern.length)}, ${cellSize}px)`,
        gap: '4px',
      }}>
        {pattern.slice(0, stepCount).map((active, idx) => (
          <div
            key={idx}
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: idx === currentStep 
                ? currentStepColor 
                : active 
                ? activeColor 
                : inactiveColor,
              borderRadius: '2px',
              border: idx === currentStep ? '2px solid #fff' : 'none',
              opacity: showVelocity && active ? (track.velocities?.[idx] || 100) / 127 : 1,
              transition: 'all 0.1s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Step Editor Widget - Interactive step sequencer grid
 */
export function StepEditorWidget({
  config = {},
  isDesignMode = false,
  style = {},
  onPatternChange,
}) {
  const { manifest, updateManifest } = useInstrument();
  const sequence = manifest.sequence || {};
  const tracks = sequence.tracks || [];
  
  const {
    trackIndex = 0,
    stepCount = 16,
    cellSize = 24,
    showVelocity = true,
    editable = true,
    activeColor = '#4CAF50',
    inactiveColor = '#333333',
    hoverColor = '#555555',
    backgroundColor = '#1e1e1e',
    gridColor = '#444444',
  } = config;

  const [hoveredStep, setHoveredStep] = useState(-1);
  const track = tracks[trackIndex] || { pattern: Array(stepCount).fill(0), velocities: Array(stepCount).fill(100), name: 'Track 1' };
  const pattern = track.pattern || Array(stepCount).fill(0);
  const velocities = track.velocities || Array(stepCount).fill(100);

  const toggleStep = (stepIdx) => {
    if (isDesignMode || !editable) return;
    
    const newPattern = [...pattern];
    newPattern[stepIdx] = newPattern[stepIdx] ? 0 : 1;
    
    // Update manifest
    const newTracks = [...tracks];
    if (newTracks[trackIndex]) {
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        pattern: newPattern,
      };
      
      updateManifest({
        sequence: {
          ...sequence,
          tracks: newTracks,
        },
      });
    }
    
    if (onPatternChange) onPatternChange(newPattern);
  };

  const adjustVelocity = (stepIdx, delta) => {
    if (isDesignMode || !editable || !pattern[stepIdx]) return;
    
    const newVelocities = [...velocities];
    newVelocities[stepIdx] = Math.max(0, Math.min(127, (newVelocities[stepIdx] || 100) + delta));
    
    const newTracks = [...tracks];
    if (newTracks[trackIndex]) {
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        velocities: newVelocities,
      };
      
      updateManifest({
        sequence: {
          ...sequence,
          tracks: newTracks,
        },
      });
    }
  };

  return (
    <div style={{
      ...style,
      backgroundColor,
      padding: '12px',
      borderRadius: '4px',
      userSelect: 'none',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(stepCount, pattern.length)}, ${cellSize}px)`,
        gap: '6px',
      }}>
        {pattern.slice(0, stepCount).map((active, idx) => {
          const velocity = velocities[idx] || 100;
          const isHovered = hoveredStep === idx;
          
          return (
            <div
              key={idx}
              style={{
                position: 'relative',
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                cursor: editable && !isDesignMode ? 'pointer' : 'default',
              }}
              onMouseEnter={() => setHoveredStep(idx)}
              onMouseLeave={() => setHoveredStep(-1)}
              onClick={() => toggleStep(idx)}
              onWheel={(e) => {
                if (showVelocity && active) {
                  e.preventDefault();
                  adjustVelocity(idx, e.deltaY > 0 ? -5 : 5);
                }
              }}
            >
              {/* Main cell */}
              <div style={{
                width: '100%',
                height: '100%',
                backgroundColor: isHovered && editable && !isDesignMode
                  ? hoverColor
                  : active
                  ? activeColor
                  : inactiveColor,
                borderRadius: '3px',
                border: `1px solid ${gridColor}`,
                transition: 'all 0.15s',
              }} />
              
              {/* Velocity indicator */}
              {showVelocity && active && (
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${(velocity / 127) * 100}%`,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '0 0 3px 3px',
                  pointerEvents: 'none',
                }} />
              )}
              
              {/* Step number */}
              {(idx + 1) % 4 === 1 && (
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '9px',
                  color: '#888',
                  fontWeight: '600',
                }}>
                  {idx + 1}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Transport Controls Widget - Play/Stop/Tempo controls
 */
export function TransportControlsWidget({
  config = {},
  isDesignMode = false,
  style = {},
  onPlay,
  onStop,
  onTempoChange,
}) {
  const { manifest, updateManifest } = useInstrument();
  const sequence = manifest.sequence || {};
  
  const {
    showTempo = true,
    showSwing = false,
    minTempo = 60,
    maxTempo = 240,
    backgroundColor = '#1e1e1e',
    buttonColor = '#4CAF50',
  } = config;

  const [isPlaying, setIsPlaying] = useState(false);
  const tempo = sequence.bpm || 120;
  const swing = sequence.swing || 0;

  const handlePlayStop = () => {
    if (isDesignMode) return;
    
    const newState = !isPlaying;
    setIsPlaying(newState);
    
    if (newState && onPlay) {
      onPlay();
    } else if (!newState && onStop) {
      onStop();
    }
  };

  const handleTempoChange = (newTempo) => {
    if (isDesignMode) return;
    
    updateManifest({
      sequence: {
        ...sequence,
        bpm: newTempo,
      },
    });
    
    if (onTempoChange) onTempoChange(newTempo);
  };

  return (
    <div style={{
      ...style,
      backgroundColor,
      padding: '12px',
      borderRadius: '4px',
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
    }}>
      {/* Play/Stop button */}
      <button
        style={{
          width: '50px',
          height: '50px',
          border: 'none',
          borderRadius: '50%',
          backgroundColor: isPlaying ? '#f44336' : buttonColor,
          color: '#fff',
          fontSize: '20px',
          cursor: isDesignMode ? 'default' : 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={handlePlayStop}
        disabled={isDesignMode}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      {showTempo && (
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            color: '#aaa',
            marginBottom: '4px',
            textTransform: 'uppercase',
          }}>
            Tempo
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="range"
              min={minTempo}
              max={maxTempo}
              value={tempo}
              onChange={(e) => handleTempoChange(Number(e.target.value))}
              disabled={isDesignMode}
              style={{ flex: 1 }}
            />
            <input
              type="number"
              min={minTempo}
              max={maxTempo}
              value={tempo}
              onChange={(e) => handleTempoChange(Number(e.target.value))}
              disabled={isDesignMode}
              style={{
                width: '60px',
                padding: '4px 8px',
                border: '1px solid #555',
                borderRadius: '3px',
                backgroundColor: '#333',
                color: '#fff',
                fontSize: '14px',
              }}
            />
            <span style={{ fontSize: '12px', color: '#aaa' }}>BPM</span>
          </div>
        </div>
      )}

      {showSwing && (
        <div style={{ width: '120px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            color: '#aaa',
            marginBottom: '4px',
            textTransform: 'uppercase',
          }}>
            Swing
          </label>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.05}
            value={swing}
            onChange={(e) => {
              if (!isDesignMode) {
                updateManifest({
                  sequence: { ...sequence, swing: Number(e.target.value) },
                });
              }
            }}
            disabled={isDesignMode}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Piano Roll Widget - Compact piano roll display
 */
export function PianoRollWidget({
  config = {},
  isDesignMode = false,
  style = {},
}) {
  const { manifest } = useInstrument();
  const sequence = manifest.sequence || {};
  const tracks = sequence.tracks || [];
  
  const {
    trackIndex = 0,
    showPianoKeys = true,
    noteRange = { min: 48, max: 72 }, // C3 to C5
    stepCount = 16,
    cellWidth = 20,
    cellHeight = 12,
    activeColor = '#4CAF50',
    backgroundColor = '#1e1e1e',
    keyColor = '#ffffff',
    blackKeyColor = '#000000',
  } = config;

  const track = tracks[trackIndex] || { notes: [] };
  const notes = track.notes || [];
  
  const noteCount = noteRange.max - noteRange.min + 1;
  const isBlackKey = (midi) => [1, 3, 6, 8, 10].includes(midi % 12);

  return (
    <div style={{
      ...style,
      backgroundColor,
      padding: '10px',
      borderRadius: '4px',
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex' }}>
        {/* Piano keys */}
        {showPianoKeys && (
          <div style={{ width: '40px', marginRight: '8px' }}>
            {Array.from({ length: noteCount }).map((_, idx) => {
              const midi = noteRange.max - idx;
              const isBlack = isBlackKey(midi);
              
              return (
                <div
                  key={idx}
                  style={{
                    height: `${cellHeight}px`,
                    backgroundColor: isBlack ? blackKeyColor : keyColor,
                    border: '1px solid #555',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isBlack ? '#fff' : '#000',
                  }}
                >
                  {midi % 12 === 0 ? `C${Math.floor(midi / 12) - 1}` : ''}
                </div>
              );
            })}
          </div>
        )}

        {/* Piano roll grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stepCount}, ${cellWidth}px)`,
          gridTemplateRows: `repeat(${noteCount}, ${cellHeight}px)`,
          gap: '1px',
          backgroundColor: '#444',
        }}>
          {Array.from({ length: noteCount * stepCount }).map((_, idx) => {
            const step = idx % stepCount;
            const noteIdx = Math.floor(idx / stepCount);
            const midi = noteRange.max - noteIdx;
            
            // Check if there's a note at this position
            const hasNote = notes.some(note => 
              note.midi === midi && 
              note.start <= step && 
              note.start + (note.length || 1) > step
            );
            
            return (
              <div
                key={idx}
                style={{
                  backgroundColor: hasNote ? activeColor : '#2a2a2a',
                  opacity: isBlackKey(midi) ? 0.7 : 1,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

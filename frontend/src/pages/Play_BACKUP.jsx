
import React, { useEffect, useMemo } from 'react';
import LeftPanel from '../components/LeftPanel.jsx';
import CenterPanel from '../components/CenterPanel.jsx';
import RightPanel from '../components/RightPanel.jsx';
import BottomKeyboardDock from '../components/BottomKeyboardDock.jsx';
import '../styles/Play.css';
import { useInstrument } from '../state/instrument.jsx';
import { getDisplayName, getGroupOptions } from '../utils/groups.js';

export default function Play({ engine, mode, setMode, compact }) {
  const { manifest, setSelectedInstrument } = useInstrument();
  const selectedInstrument = manifest.ui?.selectedInstrument || null;
  const instrumentLabel = selectedInstrument ? getDisplayName(selectedInstrument, manifest.ui?.groupNames || {}) : null;
  const names = manifest.ui?.groupNames || {};
  const options = useMemo(() => getGroupOptions(manifest.samples || [], names), [manifest.samples, names]);

  useEffect(() => {
    // Prevent cross-group overlays when switching instruments
    try { engine.stopAllVoices?.(true); } catch {}
  }, [selectedInstrument]);

  const onNoteOn = (midi, velocity) => {
    try {
      if (selectedInstrument) {
        engine.noteOnCategory?.(midi, velocity, selectedInstrument);
      } else {
        engine.noteOn(midi, velocity);
      }
    } catch (e) { console.error(e); }
  };
  const onNoteOff = (midi) => {
    try { engine.noteOff(midi); } catch (e) { console.error(e); }
  };

  return (
    <div className={`play-page ${compact ? 'compact' : ''}`}>
      <div className="play-main">
        <LeftPanel engine={engine} />
        <CenterPanel engine={engine} />
        <RightPanel engine={engine} />
      </div>
      <BottomKeyboardDock engine={engine} onNoteOn={onNoteOn} onNoteOff={onNoteOff} />
    </div>
  );
}

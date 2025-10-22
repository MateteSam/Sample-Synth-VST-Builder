import React from 'react';
import { midiToName } from '../utils/music.js';

const START = 21; // A0
const END = 108;  // C8
const RANGE = END - START + 1;

export default function ZoneTrack({ samples }) {
  return (
    <div className="zone-track">
      {samples.map((s) => {
        const leftPct = ((s.noteLow - START) / RANGE) * 100;
        const widthPct = ((s.noteHigh - s.noteLow + 1) / RANGE) * 100;
        return (
          <div key={s.id} className="zone-bar" style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
            {midiToName(s.rootMidi)}
          </div>
        );
      })}
    </div>
  );
}
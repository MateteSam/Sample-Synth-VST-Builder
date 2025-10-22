import React, { useMemo, useState } from 'react';
import { useInstrument } from '../state/instrument.jsx';
import { getCategories, getDisplayName } from '../utils/groups.js';

export default function SampleSelector({ engine }) {
  const { addSamples, setSelectedInstrument, manifest } = useInstrument();
  const [index, setIndex] = useState(0);

  const sampleCount = engine?.samples?.length || 0;
  const groups = useMemo(() => getCategories(engine?.samples || []), [sampleCount]);

  const onLoadedSync = () => {
    const list = engine?.samples || [];
    addSamples(list);
    const idx = Math.max(0, Math.min(index, groups.length - 1));
    const name = groups[idx] || null;
    setSelectedInstrument(name || null);
    setIndex(idx);
  };

  const go = (dir) => {
    const next = Math.max(0, Math.min(groups.length - 1, index + dir));
    setIndex(next);
    const name = groups[next] || null;
    setSelectedInstrument(name || null);
  };

  const currentGroup = groups[index] || manifest.ui?.selectedInstrument || null;
  const currentLabel = currentGroup ? getDisplayName(currentGroup, manifest.ui?.groupNames || {}) : null;

  return (
    <div className="row justify-between mb-8">
      <div className="row gap-8">
        <button className="secondary" onClick={() => go(-1)} disabled={index <= 0 || groups.length === 0}>Prev</button>
        <button className="secondary" onClick={() => go(1)} disabled={index >= groups.length - 1 || groups.length === 0}>Next</button>
      </div>
      <div className="muted">{currentLabel ? currentLabel : 'No Instrument Selected'}</div>
      <button onClick={onLoadedSync}>Sync</button>
    </div>
  );
}
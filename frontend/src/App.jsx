import React from 'react';
import ProfessionalApp from './ProfessionalApp';
import { InstrumentProvider } from './state/instrument.jsx';
import './styles.css';

export default function App() {
  return (
    <InstrumentProvider engine={null}>
      <ProfessionalApp />
    </InstrumentProvider>
  );
}
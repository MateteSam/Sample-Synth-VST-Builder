import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Ephemeral testing mode: clear persisted samples and local manifest on refresh
// try {
//   const persistEnabled = localStorage.getItem('persist_enabled') === '1';
//   if (!persistEnabled) {
//     try { localStorage.removeItem('instrument_manifest'); } catch {}
//     try { fetch('http://localhost:3000/api/samples', { method: 'DELETE' }); } catch {}
//   }
// } catch {}

createRoot(document.getElementById('root')).render(<App />);
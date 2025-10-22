vst-builder

This folder contains helper tools to generate a minimal Electron-based standalone app from an export and attempt to package it.

Current functionality:
- Node script `tools/scripts/generate_electron.js` creates a `standalone-electron` folder inside an export. It writes a simple Electron app that loads `mapping.json` and lists assets.
- Windows PowerShell script `tools/scripts/build.ps1` will call the Node generator and (if `npx`/`electron-packager` is available) attempt to package the app.

Usage (simple):
	node tools/scripts/generate_electron.js <exportPath>

Requirements to package the app:
- Node.js + npm (node and npx on PATH)
- electron and electron-packager will be used via npx when packaging is run automatically

Notes:
- The electron app is currently a basic viewer. The plan is to replace the renderer with a full playable UI that mirrors the in-app Test page.
- Packaging is best done on a machine with Node and electron packaging tools installed. The backend will attempt to invoke platform packagers if available.

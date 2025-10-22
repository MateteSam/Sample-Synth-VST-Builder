const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const name of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, name), path.join(dest, name));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node collect_packaged.js <exportPath>');
    process.exit(2);
  }
  const exportPath = path.resolve(args[0]);
  const appDir = path.join(exportPath, 'standalone-electron');
  const distDir = path.join(appDir, 'dist');
  const binOut = path.join(exportPath, 'binaries');
  const logFile = path.join(exportPath, 'builder.log');

  try {
    if (!fs.existsSync(distDir)) {
      console.log('No dist directory found at', distDir);
      process.exit(0);
    }
    if (!fs.existsSync(binOut)) fs.mkdirSync(binOut, { recursive: true });

    const entries = fs.readdirSync(distDir, { withFileTypes: true }).filter(e => e.isDirectory());
    for (const ent of entries) {
      const src = path.join(distDir, ent.name);
      const dest = path.join(binOut, ent.name);
      copyRecursiveSync(src, dest);
      
      // Copy mapping.json and assets into resources/app parent directory so renderer can find them
      try {
        const resourcesApp = path.join(dest, 'resources', 'app');
        if (fs.existsSync(resourcesApp)) {
          const resourcesParent = path.dirname(resourcesApp);
          const mappingSrc = path.join(exportPath, 'mapping.json');
          const assetsSrc = path.join(exportPath, 'assets');
          if (fs.existsSync(mappingSrc)) {
            fs.copyFileSync(mappingSrc, path.join(resourcesParent, 'mapping.json'));
            console.log('Copied mapping.json into', resourcesParent);
          }
          if (fs.existsSync(assetsSrc)) {
            copyRecursiveSync(assetsSrc, path.join(resourcesParent, 'assets'));
            console.log('Copied assets/ into', resourcesParent);
          }
        }
      } catch (e) {
        console.warn('Failed to copy mapping/assets into packaged app:', e.message || e);
      }
      
      // write a small README for testers
      try {
        const readme = [
          '# SekoSa Standalone — Test Build',
          '',
          'What is this?',
          '- A self-contained Electron-based standalone app to audition your exported samples.',
          '',
          'How to run (Windows):',
          '- Double-click SekoSaStandalone.exe inside this folder.',
          '',
          'How to run (macOS):',
          '- Open SekoSaStandalone.app (you may need to right-click → Open the first time).',
          '',
          'Features:',
          '- Responsive keyboard UI',
          '- Master gain and filter controls',
          '- Velocity and ADSR envelopes',
          '- Sustain pedal (MIDI CC64) and basic MIDI input',
          '- Master meter, spectrum view, and simple recording',
          '',
          'Notes:',
          '- Assets and mapping.json are bundled next to the app under resources/app/..',
          '- Stop button performs a panic to release all voices.',
        ].join('\n');
        fs.writeFileSync(path.join(dest, 'README_FOR_TESTERS.txt'), readme);
      } catch (e) {
        console.warn('Failed to write README_FOR_TESTERS:', e.message || e);
      }
      // zip the folder if zip utility not available we'll rely on Node's zlib not used here: leave raw folder
      // write simple installer scripts
      const installerWin = path.join(dest, 'install.bat');
      const uninstallWin = path.join(dest, 'uninstall.bat');
      try {
        fs.writeFileSync(installerWin, '@echo off\r\nset TARGET=%ProgramFiles%\\SekoSaStandalone\r\nif not exist "%TARGET%" mkdir "%TARGET%"\r\nxcopy "%~dp0" "%TARGET%" /E /Y\r\necho Installed to %TARGET%\r\necho To uninstall run uninstall.bat\r\n');
        fs.writeFileSync(uninstallWin, '@echo off\r\nset TARGET=%ProgramFiles%\\SekoSaStandalone\r\nrmdir /S /Q "%TARGET%"\r\necho Uninstalled\r\n');
      } catch (e) {
        console.warn('Failed to write Windows installer scripts:', e.message || e);
      }
      const installerSh = path.join(dest, 'install.sh');
      const uninstallSh = path.join(dest, 'uninstall.sh');
      try {
        fs.writeFileSync(installerSh, '#!/bin/sh\nset -e\nTARGET="/Applications/SekoSaStandalone.app"\nsrcdir="$(cd "$(dirname "$0")" && pwd)"\ncp -R "$srcdir" "$TARGET"\necho Installed to $TARGET\necho To uninstall: rm -rf $TARGET\n');
        fs.writeFileSync(uninstallSh, '#!/bin/sh\nset -e\nTARGET="/Applications/SekoSaStandalone.app"\nrm -rf $TARGET\necho Uninstalled\n');
      } catch (e) {
        console.warn('Failed to write unix installer scripts:', e.message || e);
      }
    }

    // attempt to update the export zip (prefer powershell on Windows)
    try {
      const exportRoot = path.dirname(exportPath);
      const stamp = path.basename(exportPath);
      const zipAbs = path.join(exportRoot, `${stamp}.zip`);
      if (process.platform === 'win32') {
        const { spawnSync } = require('child_process');
        spawnSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${exportPath}' -DestinationPath '${zipAbs}' -Force`], { stdio: 'ignore' });
      } else {
        // attempt zip
        const { spawnSync } = require('child_process');
        spawnSync('zip', ['-r', zipAbs, path.basename(exportPath)], { cwd: exportRoot, stdio: 'ignore' });
      }
    } catch (e) {
      console.warn('Failed to update export zip:', e.message || e);
    }

    console.log('Collected packaged apps into', binOut);
  } catch (e) {
    console.error('collect_packaged.js failed:', e.message || e);
    process.exit(1);
  }
}

main();

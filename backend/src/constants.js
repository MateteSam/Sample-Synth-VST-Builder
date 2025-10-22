const path = require('path');
const fs = require('fs');

// Resolve paths relative to the backend folder (one level up from src)
const backendRoot = path.join(__dirname, '..');
const dataDir = path.join(backendRoot, 'data');
const exportDir = path.join(backendRoot, 'export');
const tasksFile = path.join(dataDir, 'tasks.json');
const samplesFile = path.join(dataDir, 'samples.json');
const groupNamesFile = path.join(dataDir, 'groupNames.json');
const uploadDir = path.join(dataDir, 'uploads');

// Ensure core directories exist at startup
function ensureCoreDirs() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });
  } catch (e) {
    // Best-effort; errors will surface on actual usage
  }
}

module.exports = {
  backendRoot,
  dataDir,
  exportDir,
  uploadDir,
  tasksFile,
  samplesFile,
  groupNamesFile,
  ensureCoreDirs,
};

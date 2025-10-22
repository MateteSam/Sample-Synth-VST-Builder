const fs = require('fs');
const path = require('path');

const exportDir = path.join(__dirname, '../../../backend/export');
const keep = '1760817826487';

if (!fs.existsSync(exportDir)) {
  console.log('Export directory does not exist');
  process.exit(0);
}

const entries = fs.readdirSync(exportDir);
let removed = 0;

for (const entry of entries) {
  if (entry.startsWith(keep)) {
    console.log(`Keeping: ${entry}`);
    continue;
  }
  const fullPath = path.join(exportDir, entry);
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
    console.log(`Removed: ${entry}`);
    removed++;
  } catch (e) {
    console.warn(`Failed to remove ${entry}:`, e.message);
  }
}

console.log(`\nCleanup complete. Removed ${removed} items, kept: ${keep}`);

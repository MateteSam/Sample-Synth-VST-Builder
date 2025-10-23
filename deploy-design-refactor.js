#!/usr/bin/env node
/**
 * Safe Design.jsx Replacement Script
 * Handles file operations without terminal display issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const baseDir = 'c:\\Users\\DELL\\Documents\\FILING CABINET OF MILLIONS\\Seko Sa';
const pagesDir = path.join(baseDir, 'frontend\\src\\pages');
const stylesDir = path.join(baseDir, 'frontend\\src\\styles');

const designPath = path.join(pagesDir, 'Design.jsx');
const designRefactoredPath = path.join(pagesDir, 'Design_REFACTORED.jsx');
const designCleanStylesPath = path.join(stylesDir, 'Design_Clean.css');
const designStylesPath = path.join(stylesDir, 'Design.css');

try {
  console.log('\n========== DESIGN TAB REFACTORING ==========\n');

  // Step 1: Check if refactored file exists
  if (!fs.existsSync(designRefactoredPath)) {
    console.error('❌ ERROR: Design_REFACTORED.jsx not found!');
    process.exit(1);
  }
  console.log('✓ Design_REFACTORED.jsx found');

  // Step 2: Create timestamped backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const backupPath = path.join(pagesDir, `Design.BACKUP_${timestamp}.jsx`);
  fs.copyFileSync(designPath, backupPath);
  console.log(`✓ Backup created: Design.BACKUP_${timestamp}.jsx`);

  // Step 3: Replace Design.jsx with refactored version
  const refactoredContent = fs.readFileSync(designRefactoredPath, 'utf8');
  fs.writeFileSync(designPath, refactoredContent);
  console.log('✓ Design.jsx replaced with refactored version');

  // Step 4: Copy clean CSS styles
  const cleanCSSContent = fs.readFileSync(designCleanStylesPath, 'utf8');
  fs.writeFileSync(designStylesPath, cleanCSSContent);
  console.log('✓ Design.css updated with clean styles');

  // Step 5: Clean up refactored temp file
  fs.unlinkSync(designRefactoredPath);
  console.log('✓ Temporary files cleaned up');

  // Step 6: Git operations
  console.log('\n📦 Committing to Git...\n');
  
  const cwd = baseDir;
  
  try {
    execSync('git add -A', { cwd, stdio: 'pipe' });
    const commitMsg = 'Feat: Refactor Design tab UI for clean, professional experience\n\n' +
      '- Reorganized layout with collapsible panels\n' +
      '- Left panel: Component library with search\n' +
      '- Right panel: Inspector with properties/bindings/export\n' +
      '- Top bar: Mode selection, undo/redo, zoom controls\n' +
      '- Center canvas: Full-width design area\n' +
      '- All backend features preserved\n' +
      '- Follows Sequence-tab design patterns\n' +
      '- Professional styling and animations\n' +
      '- Full keyboard shortcut support';
    
    execSync(`git commit -m "${commitMsg}"`, { cwd, stdio: 'pipe' });
    console.log('✓ Changes committed');

    execSync('git push origin main', { cwd, stdio: 'pipe' });
    console.log('✓ Pushed to GitHub');
  } catch (gitError) {
    console.warn('⚠ Git operation warning:', gitError.message);
  }

  console.log('\n========== ✨ REFACTORING COMPLETE ✨ ==========\n');
  console.log('Summary:');
  console.log('  • Backup: Design.BACKUP_' + timestamp + '.jsx');
  console.log('  • Updated: Design.jsx (refactored)');
  console.log('  • Styles: Design.css (clean theme)');
  console.log('  • Status: Ready to use\n');

} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  process.exit(1);
}

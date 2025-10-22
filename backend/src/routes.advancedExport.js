/**
 * API ROUTES FOR ADVANCED EXPORT SYSTEM
 * Integrates all the new revolutionary features
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { PSDImporter, FigmaImporter } = require('../src/psdImporter');
const { HISEProjectGenerator } = require('../src/hiseProjectGenerator');
const { JUCEVSTCompiler } = require('../src/juceVSTCompiler');
const { OneClickExporter } = require('../src/oneClickExporter');

// Configure file upload
const upload = multer({
  dest: 'uploads/designs/',
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * POST /api/export/import-psd
 * Import PSD file and extract components
 */
router.post('/import-psd', upload.single('psd'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PSD file provided' });
    }

    const importer = new PSDImporter();
    const result = await importer.importPSD(req.file.path);

    res.json({
      success: true,
      message: 'PSD imported successfully',
      data: result
    });
  } catch (error) {
    console.error('PSD import error:', error);
    res.status(500).json({
      error: 'Failed to import PSD',
      details: error.message
    });
  }
});

/**
 * POST /api/export/import-figma
 * Import design from Figma
 */
router.post('/import-figma', async (req, res) => {
  try {
    const { fileKey, accessToken } = req.body;

    if (!fileKey || !accessToken) {
      return res.status(400).json({
        error: 'Missing fileKey or accessToken'
      });
    }

    const importer = new FigmaImporter(accessToken);
    const result = await importer.importFigmaFile(fileKey);

    res.json({
      success: true,
      message: 'Figma design imported successfully',
      data: result
    });
  } catch (error) {
    console.error('Figma import error:', error);
    res.status(500).json({
      error: 'Failed to import from Figma',
      details: error.message
    });
  }
});

/**
 * POST /api/export/generate-hise
 * Generate HISE project from design
 */
router.post('/generate-hise', async (req, res) => {
  try {
    const { designData, projectName } = req.body;

    if (!designData) {
      return res.status(400).json({ error: 'No design data provided' });
    }

    const outputDir = path.join(process.cwd(), 'backend', 'export', 'hise', projectName);
    const generator = new HISEProjectGenerator(projectName, outputDir);

    const result = await generator.generateProject(designData);

    res.json({
      success: true,
      message: 'HISE project generated successfully',
      data: result
    });
  } catch (error) {
    console.error('HISE generation error:', error);
    res.status(500).json({
      error: 'Failed to generate HISE project',
      details: error.message
    });
  }
});

/**
 * POST /api/export/compile-vst
 * Compile directly to VST3 (without HISE)
 */
router.post('/compile-vst', async (req, res) => {
  try {
    const { designData } = req.body;

    if (!designData) {
      return res.status(400).json({ error: 'No design data provided' });
    }

    const outputDir = path.join(process.cwd(), 'backend', 'export', 'vst3', designData.name);
    const compiler = new JUCEVSTCompiler();

    // This is a long-running process, so we'll start it and return immediately
    res.json({
      success: true,
      message: 'VST3 compilation started',
      status: 'compiling',
      note: 'This may take several minutes. Check /api/export/status/:jobId for progress'
    });

    // Compile in background
    compiler.compileToVST(designData, outputDir)
      .then(result => {
        console.log('VST3 compilation complete:', result);
      })
      .catch(error => {
        console.error('VST3 compilation failed:', error);
      });

  } catch (error) {
    console.error('VST3 compilation error:', error);
    res.status(500).json({
      error: 'Failed to start VST3 compilation',
      details: error.message
    });
  }
});

/**
 * POST /api/export/one-click
 * THE MAGIC BUTTON - Export everything in one go!
 */
router.post('/one-click', async (req, res) => {
  try {
    const { designData, options } = req.body;

    if (!designData) {
      return res.status(400).json({ error: 'No design data provided' });
    }

    // Start export process
    const exporter = new OneClickExporter();

    // Return immediately with job ID
    const exportId = exporter.generateExportId();
    
    res.json({
      success: true,
      message: 'One-click export started',
      exportId,
      status: 'processing',
      note: 'Check /api/export/status/' + exportId + ' for progress'
    });

    // Run export in background
    exporter.exportEverything(designData, options || {})
      .then(result => {
        console.log('One-click export complete:', result);
        // Store result for status endpoint
        global.exportResults = global.exportResults || {};
        global.exportResults[exportId] = result;
      })
      .catch(error => {
        console.error('One-click export failed:', error);
        global.exportResults = global.exportResults || {};
        global.exportResults[exportId] = {
          success: false,
          error: error.message
        };
      });

  } catch (error) {
    console.error('One-click export error:', error);
    res.status(500).json({
      error: 'Failed to start export',
      details: error.message
    });
  }
});

/**
 * GET /api/export/status/:exportId
 * Check export status
 */
router.get('/status/:exportId', (req, res) => {
  const { exportId } = req.params;

  global.exportResults = global.exportResults || {};
  const result = global.exportResults[exportId];

  if (!result) {
    return res.json({
      status: 'processing',
      message: 'Export is still in progress...'
    });
  }

  res.json(result);
});

/**
 * GET /api/export/download/:exportId
 * Download export package
 */
router.get('/download/:exportId', async (req, res) => {
  const { exportId } = req.params;

  global.exportResults = global.exportResults || {};
  const result = global.exportResults[exportId];

  if (!result || !result.success) {
    return res.status(404).json({ error: 'Export not found or failed' });
  }

  // Create ZIP and send
  const zipPath = path.join(result.outputDir, 'package.zip');
  res.download(zipPath);
});

/**
 * POST /api/export/validate
 * Validate design before export
 */
router.post('/validate', async (req, res) => {
  try {
    const { designData } = req.body;

    if (!designData) {
      return res.status(400).json({ error: 'No design data provided' });
    }

    const exporter = new OneClickExporter();
    await exporter.validateDesign(designData);

    res.json({
      success: true,
      message: 'Design validation passed',
      valid: true
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'Design validation failed',
      valid: false,
      issues: [error.message]
    });
  }
});

/**
 * GET /api/export/capabilities
 * Get current system export capabilities
 */
router.get('/capabilities', async (req, res) => {
  const capabilities = {
    psdImport: true,
    figmaImport: true,
    hiseGeneration: true,
    vstCompilation: await checkVSTCapability(),
    standaloneExport: true,
    webExport: true,
    installerCreation: process.platform === 'win32' || process.platform === 'darwin'
  };

  res.json(capabilities);
});

/**
 * Helper: Check if VST compilation is available
 */
async function checkVSTCapability() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    await execAsync('cmake --version');
    return true;
  } catch {
    return false;
  }
}

module.exports = router;

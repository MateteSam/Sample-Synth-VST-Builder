/**
 * Template Export Routes - API endpoints for PSD/Figma template export
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const TemplateExporter = require('./templateExporter');

const templateExporter = new TemplateExporter();

/**
 * Export current design as PSD template
 * POST /api/export-template/psd
 */
router.post('/psd', async (req, res) => {
  try {
    const { designData, options = {} } = req.body;
    
    if (!designData) {
      return res.status(400).json({
        success: false,
        error: 'Design data is required'
      });
    }

    console.log('🎨 Exporting PSD template...');
    const result = await templateExporter.exportAsPSD(designData, options);
    
    if (result.success) {
      res.json({
        success: true,
        message: '🎨 PSD template exported successfully!',
        data: {
          filePath: result.filePath,
          instructions: result.instructions,
          downloadUrl: `/api/export-template/download/${result.filePath.split('/').pop()}`,
          workflow: {
            step1: 'Download the PSD file',
            step2: 'Open in Photoshop and edit',
            step3: 'Save as PSD (keep layer names!)',
            step4: 'Import back using PSD Import',
            step5: 'Export as VST/Standalone'
          }
        }
      });
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ PSD export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export current design as Figma template
 * POST /api/export-template/figma
 */
router.post('/figma', async (req, res) => {
  try {
    const { designData, options = {} } = req.body;
    
    if (!designData) {
      return res.status(400).json({
        success: false,
        error: 'Design data is required'
      });
    }

    console.log('🎨 Exporting Figma template...');
    const result = await templateExporter.exportAsFigma(designData, options);
    
    if (result.success) {
      res.json({
        success: true,
        message: '🎨 Figma template exported successfully!',
        data: {
          filePath: result.filePath,
          instructions: result.instructions,
          downloadUrl: `/api/export-template/download/${result.filePath.split('/').pop()}`,
          workflow: {
            step1: 'Download the JSON file',
            step2: 'Import into Figma and edit',
            step3: 'Export as JSON (keep naming!)',
            step4: 'Import back using Figma Import',
            step5: 'Export as VST/Standalone'
          }
        }
      });
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Figma export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export both PSD and Figma templates
 * POST /api/export-template/both
 */
router.post('/both', async (req, res) => {
  try {
    const { designData, options = {} } = req.body;
    
    if (!designData) {
      return res.status(400).json({
        success: false,
        error: 'Design data is required'
      });
    }

    console.log('🎨 Exporting both PSD and Figma templates...');
    const result = await templateExporter.exportBothTemplates(designData, options);
    
    if (result.success) {
      res.json({
        success: true,
        message: '🎨 Both templates exported successfully!',
        data: {
          psd: {
            filePath: result.psd.filePath,
            downloadUrl: `/api/export-template/download/${result.psd.filePath.split('/').pop()}`
          },
          figma: {
            filePath: result.figma.filePath,
            downloadUrl: `/api/export-template/download/${result.figma.filePath.split('/').pop()}`
          },
          workflow: {
            photoshop: {
              step1: 'Download PSD file',
              step2: 'Edit in Photoshop',
              step3: 'Save and import back'
            },
            figma: {
              step1: 'Download JSON file', 
              step2: 'Import and edit in Figma',
              step3: 'Export and import back'
            },
            final: 'Export as VST/Standalone'
          }
        }
      });
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('❌ Template export error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Download exported template file
 * GET /api/export-template/download/:filename
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../export/templates', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Set appropriate headers
    const ext = path.extname(filename);
    const contentType = ext === '.psd' ? 'application/octet-stream' : 'application/json';
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get list of exported templates
 * GET /api/export-template/list
 */
router.get('/list', async (req, res) => {
  try {
    const result = await templateExporter.getExportedTemplates();
    
    res.json({
      success: true,
      message: `Found ${result.count} exported templates`,
      data: result.templates
    });
    
  } catch (error) {
    console.error('❌ List templates error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete exported template
 * DELETE /api/export-template/:filename
 */
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../export/templates', filename);
    
    await fs.unlink(filePath);
    
    res.json({
      success: true,
      message: `Template ${filename} deleted successfully`
    });
    
  } catch (error) {
    console.error('❌ Delete template error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get template export status and workflow guide
 * GET /api/export-template/workflow
 */
router.get('/workflow', (req, res) => {
  res.json({
    success: true,
    message: 'Template export workflow guide',
    data: {
      overview: 'Perfect round-trip workflow: Design → Export Template → Edit in Photoshop/Figma → Import Back → Export VST',
      
      psdWorkflow: {
        title: '🎨 Photoshop Workflow',
        steps: [
          '1. Design your instrument in VST Builder',
          '2. Click "Export PSD Template"',
          '3. Download the PSD file',
          '4. Open in Photoshop and edit freely',
          '5. Keep layer names exactly as they are!',
          '6. Save as PSD when finished',
          '7. Import back using "Import PSD"',
          '8. Export as VST/Standalone'
        ],
        benefits: [
          'Full Photoshop power for graphics',
          'Professional textures and effects',
          'Advanced layer styles',
          'Smart objects support'
        ]
      },
      
      figmaWorkflow: {
        title: '🎨 Figma Workflow',
        steps: [
          '1. Design your instrument in VST Builder',
          '2. Click "Export Figma Template"',
          '3. Download the JSON file',
          '4. Import into Figma and edit',
          '5. Use components and design systems',
          '6. Export as JSON when finished',
          '7. Import back using "Import Figma"',
          '8. Export as VST/Standalone'
        ],
        benefits: [
          'Collaborative design',
          'Component libraries',
          'Auto-layout and constraints',
          'Design system management'
        ]
      },
      
      layerNaming: {
        title: '📝 Critical Layer Naming',
        format: 'componentType_parameter_value_[id]',
        examples: [
          'knob_cutoff_50_[abc123] = Cutoff knob at 50%',
          'fader_volume_75_[def456] = Volume fader at 75%',
          'btn_play_0_[ghi789] = Play button (off state)'
        ],
        warning: '⚠️ NEVER change layer names or IDs! This breaks the import process.'
      },
      
      supportedComponents: [
        'knob_ - Rotary controls (cutoff, resonance, etc.)',
        'fader_ - Linear sliders (volume, pan, etc.)',
        'btn_ - Buttons and switches',
        'led_ - Status indicators',
        'meter_ - Level meters',
        'wave_ - Waveform displays'
      ],
      
      tips: [
        'Edit colors, textures, effects freely',
        'Add backgrounds and decorative elements',
        'Resize components (maintain aspect ratios)',
        'Use layer effects for realistic materials',
        'Test different color schemes',
        'Create multiple variations'
      ]
    }
  });
});

module.exports = router;
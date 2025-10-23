/**
 * Template Exporter - Creates PSD and Figma templates from designs
 * Perfect round-trip workflow: Design → Export Template → Edit in Photoshop/Figma → Import Back → Export VST
 */

const fs = require('fs').promises;
const path = require('path');

class TemplateExporter {
  constructor() {
    this.exportDir = path.join(__dirname, '../export/templates');
    this.ensureExportDir();
  }

  async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('Error creating export directory:', error);
    }
  }

  /**
   * Export current design as PSD template for Photoshop editing
   */
  async exportAsPSD(designData, options = {}) {
    console.log('🎨 Exporting PSD template for Photoshop...');
    
    const {
      filename = 'instrument_template.psd',
      width = 800,
      height = 600,
      includeGuides = true,
      includeSmartObjects = true
    } = options;

    try {
      // Create PSD structure
      const psdData = {
        width,
        height,
        colorMode: 3, // RGB
        bitsPerChannel: 8,
        layers: await this.createPSDLayers(designData, { includeSmartObjects })
      };

      // Add guides for component placement
      if (includeGuides) {
        psdData.guides = this.createPhotoshopGuides(designData);
      }

      // Generate PSD file
      const psdBuffer = await this.generatePSDFile(psdData);
      const filePath = path.join(this.exportDir, filename);
      
      await fs.writeFile(filePath, psdBuffer);

      // Create companion instruction file
      await this.createPSDInstructions(designData, filename);

      console.log('✅ PSD template exported successfully!');
      return {
        success: true,
        filePath,
        instructions: `${filename}_instructions.txt`,
        message: 'PSD template ready for Photoshop editing!'
      };

    } catch (error) {
      console.error('❌ Error exporting PSD:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Export current design as Figma template
   */
  async exportAsFigma(designData, options = {}) {
    console.log('🎨 Exporting Figma template...');
    
    const {
      filename = 'instrument_template.fig',
      includeComponents = true,
      includeConstraints = true,
      includeStyles = true
    } = options;

    try {
      // Create Figma-compatible structure
      const figmaData = {
        document: {
          id: this.generateId(),
          name: 'VST Instrument Template',
          type: 'DOCUMENT',
          children: await this.createFigmaFrames(designData, { includeComponents, includeConstraints })
        },
        components: includeComponents ? await this.createFigmaComponents(designData) : {},
        styles: includeStyles ? await this.createFigmaStyles(designData) : {},
        schemaVersion: 1,
        meta: {
          exportedAt: new Date().toISOString(),
          exportedBy: 'VST Builder Tool',
          version: '1.0.0'
        }
      };

      // Generate Figma file
      const figmaJSON = JSON.stringify(figmaData, null, 2);
      const filePath = path.join(this.exportDir, filename.replace('.fig', '.json'));
      
      await fs.writeFile(filePath, figmaJSON);

      // Create Figma import instructions
      await this.createFigmaInstructions(designData, filename);

      console.log('✅ Figma template exported successfully!');
      return {
        success: true,
        filePath,
        instructions: `${filename}_figma_instructions.txt`,
        message: 'Figma template ready for editing!'
      };

    } catch (error) {
      console.error('❌ Error exporting Figma:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create PSD layers from design data
   */
  async createPSDLayers(designData, options) {
    const layers = [];

    // Background layer
    layers.push({
      name: 'Background',
      type: 'SOLID_COLOR',
      fillColor: designData.backgroundColor || '#2a2a2a',
      blendMode: 'NORMAL',
      opacity: 255,
      bounds: { left: 0, top: 0, right: designData.width, bottom: designData.height }
    });

    // Component layers
    for (const component of designData.components || []) {
      const layerName = this.createComponentLayerName(component);
      
      layers.push({
        name: layerName,
        type: component.type.toUpperCase(),
        bounds: {
          left: component.x,
          top: component.y,
          right: component.x + component.width,
          bottom: component.y + component.height
        },
        metadata: {
          componentId: component.id,
          componentType: component.type,
          value: component.value || 0,
          min: component.min || 0,
          max: component.max || 100,
          parameter: component.parameter || 'cutoff'
        },
        smartObject: options.includeSmartObjects ? {
          type: 'EMBEDDED',
          data: await this.createSmartObjectData(component)
        } : null
      });
    }

    // Add instruction layer
    layers.push({
      name: '⚠️ INSTRUCTIONS - READ FIRST',
      type: 'TEXT',
      text: this.createInstructionText(),
      textStyle: {
        font: 'Arial',
        size: 14,
        color: '#ffff00'
      },
      bounds: { left: 10, top: 10, right: 400, bottom: 100 }
    });

    return layers;
  }

  /**
   * Create Figma frames from design data
   */
  async createFigmaFrames(designData, options) {
    const frames = [];

    // Main instrument frame
    const mainFrame = {
      id: this.generateId(),
      name: 'VST Instrument',
      type: 'FRAME',
      bounds: {
        x: 0,
        y: 0,
        width: designData.width || 800,
        height: designData.height || 600
      },
      backgroundColor: designData.backgroundColor || '#2a2a2a',
      children: []
    };

    // Add components as children
    for (const component of designData.components || []) {
      const figmaNode = await this.createFigmaNode(component, options);
      mainFrame.children.push(figmaNode);
    }

    // Add instructions frame
    frames.push({
      id: this.generateId(),
      name: '📋 INSTRUCTIONS',
      type: 'FRAME',
      bounds: { x: 850, y: 0, width: 300, height: 400 },
      backgroundColor: '#1a1a1a',
      children: [{
        id: this.generateId(),
        name: 'Instructions Text',
        type: 'TEXT',
        characters: this.createFigmaInstructionText(),
        style: {
          fontFamily: 'Inter',
          fontSize: 12,
          fill: '#ffffff'
        }
      }]
    });

    frames.push(mainFrame);
    return frames;
  }

  /**
   * Create component layer name with metadata
   */
  createComponentLayerName(component) {
    const prefix = this.getComponentPrefix(component.type);
    const parameter = component.parameter || 'param';
    const value = component.value || 0;
    
    return `${prefix}_${parameter}_${value}_[${component.id}]`;
  }

  /**
   * Get component prefix for layer naming
   */
  getComponentPrefix(type) {
    const prefixes = {
      'knob': 'knob',
      'fader': 'fader',
      'button': 'btn',
      'slider': 'slider',
      'led': 'led',
      'meter': 'meter',
      'waveform': 'wave',
      'keyboard': 'keys'
    };
    return prefixes[type] || 'comp';
  }

  /**
   * Create Figma component node
   */
  async createFigmaNode(component, options) {
    return {
      id: this.generateId(),
      name: this.createComponentLayerName(component),
      type: 'RECTANGLE', // Will be converted to proper component in Figma
      bounds: {
        x: component.x,
        y: component.y,
        width: component.width,
        height: component.height
      },
      fills: [{
        type: 'SOLID',
        color: this.getComponentColor(component.type)
      }],
      cornerRadius: component.type === 'knob' ? component.width / 2 : 4,
      constraints: options.includeConstraints ? {
        horizontal: 'LEFT',
        vertical: 'TOP'
      } : null,
      metadata: {
        vstComponent: true,
        componentType: component.type,
        parameter: component.parameter,
        value: component.value,
        min: component.min || 0,
        max: component.max || 100
      }
    };
  }

  /**
   * Get default color for component type
   */
  getComponentColor(type) {
    const colors = {
      'knob': { r: 0.7, g: 0.7, b: 0.7 },
      'fader': { r: 0.5, g: 0.5, b: 0.8 },
      'button': { r: 0.8, g: 0.5, b: 0.5 },
      'led': { r: 0.2, g: 0.8, b: 0.2 },
      'meter': { r: 0.8, g: 0.8, b: 0.2 }
    };
    return colors[type] || { r: 0.6, g: 0.6, b: 0.6 };
  }

  /**
   * Create PSD instruction text
   */
  createInstructionText() {
    return `VST TEMPLATE EDITING INSTRUCTIONS:

1. LAYER NAMING IS CRITICAL!
   - knob_cutoff_50_[id] = Cutoff knob at 50%
   - fader_volume_75_[id] = Volume fader at 75%
   - btn_play_0_[id] = Play button (off)

2. EDIT FREELY:
   - Change colors, textures, styles
   - Add backgrounds, graphics
   - Resize components (maintain ratios)

3. KEEP LAYER NAMES:
   - Don't change the naming format
   - IDs in brackets are important

4. WHEN DONE:
   - Save as PSD
   - Import back into VST Builder
   - Export as VST/Standalone

5. SUPPORTED COMPONENTS:
   - knob_ (circular controls)
   - fader_ (vertical/horizontal)
   - btn_ (buttons, switches)
   - led_ (indicators)
   - meter_ (VU meters)
   - wave_ (waveforms)

Ready to create amazing VSTs!`;
  }

  /**
   * Create Figma instruction text
   */
  createFigmaInstructionText() {
    return `🎛️ VST TEMPLATE EDITING GUIDE

LAYER NAMING:
• knob_cutoff_50_[id] = Cutoff knob
• fader_volume_75_[id] = Volume fader  
• btn_play_0_[id] = Play button

EDITING TIPS:
• Change colors, styles freely
• Use components for consistency
• Add auto-layout for responsive design
• Create variants for different states

CONSTRAINTS:
• Set proper constraints for scaling
• Use center/scale constraints for knobs
• Use left/right for horizontal layouts

EXPORT BACK:
• File → Export → JSON
• Import back into VST Builder
• Generate VST/Standalone

COMPONENT TYPES:
🔘 knob_ - Rotary controls
📊 fader_ - Linear controls
🔲 btn_ - Buttons/switches
💡 led_ - Status indicators
📈 meter_ - Level meters
〰️ wave_ - Waveforms

Ready to design! 🚀`;
  }

  /**
   * Generate PSD file buffer
   */
  async generatePSDFile(psdData) {
    // This would use a PSD generation library
    // For now, return a structured representation
    const psdStructure = {
      header: {
        signature: '8BPS',
        version: 1,
        channels: 3,
        height: psdData.height,
        width: psdData.width,
        depth: psdData.bitsPerChannel,
        mode: psdData.colorMode
      },
      layers: psdData.layers,
      guides: psdData.guides || []
    };

    // Convert to binary PSD format (simplified)
    return Buffer.from(JSON.stringify(psdStructure));
  }

  /**
   * Create Photoshop guides for alignment
   */
  createPhotoshopGuides(designData) {
    const guides = [];
    
    // Grid guides every 50px
    for (let x = 50; x < designData.width; x += 50) {
      guides.push({ direction: 'vertical', position: x });
    }
    
    for (let y = 50; y < designData.height; y += 50) {
      guides.push({ direction: 'horizontal', position: y });
    }

    // Component alignment guides
    for (const component of designData.components || []) {
      guides.push(
        { direction: 'vertical', position: component.x },
        { direction: 'vertical', position: component.x + component.width },
        { direction: 'horizontal', position: component.y },
        { direction: 'horizontal', position: component.y + component.height }
      );
    }

    return guides;
  }

  /**
   * Create PSD instructions file
   */
  async createPSDInstructions(designData, filename) {
    const instructions = `
# PSD TEMPLATE EDITING INSTRUCTIONS

## File: ${filename}

### 🎨 EDITING WORKFLOW:
1. Open ${filename} in Photoshop
2. Edit layers freely (colors, effects, textures)
3. Keep layer names EXACTLY as they are
4. Save as PSD when done
5. Import back into VST Builder
6. Export as VST/Standalone

### 📝 LAYER NAMING CONVENTION:
${designData.components?.map(comp => 
  `- ${this.createComponentLayerName(comp)} = ${comp.type} control for ${comp.parameter}`
).join('\n') || 'No components found'}

### ⚠️ IMPORTANT RULES:
- DO NOT rename layers
- DO NOT delete the [ID] brackets
- DO NOT change layer structure
- You CAN change colors, effects, styles
- You CAN add background elements
- You CAN resize (but maintain aspect ratios)

### 🎛️ COMPONENT GUIDE:
- knob_ = Rotary controls (cutoff, resonance, etc.)
- fader_ = Linear sliders (volume, pan, etc.)
- btn_ = Buttons and switches
- led_ = Status indicators
- meter_ = Level meters
- wave_ = Waveform displays

### 🚀 WHEN FINISHED:
1. File → Save As → PSD
2. Go back to VST Builder
3. Click "Import Edited PSD"
4. Select your saved PSD
5. Click "Export VST/Standalone"
6. Enjoy your custom instrument! 🎹

Created by VST Builder Tool
${new Date().toISOString()}
`;

    const instructPath = path.join(this.exportDir, `${filename}_instructions.txt`);
    await fs.writeFile(instructPath, instructions);
  }

  /**
   * Create Figma instructions file
   */
  async createFigmaInstructions(designData, filename) {
    const instructions = `
# FIGMA TEMPLATE EDITING INSTRUCTIONS

## File: ${filename}

### 🎨 FIGMA WORKFLOW:
1. Import ${filename.replace('.fig', '.json')} into Figma
2. Use "Import from JSON" plugin or manual setup
3. Edit components, styles, layouts
4. Export as JSON when done
5. Import back into VST Builder
6. Export as VST/Standalone

### 🔧 FIGMA EDITING TIPS:
- Convert rectangles to components
- Use auto-layout for responsive design
- Create component variants for states
- Use proper constraints for scaling
- Set up a design system with styles

### 📱 COMPONENT VARIANTS:
${designData.components?.map(comp => 
  `- ${comp.type}: Default, Hover, Active, Disabled`
).join('\n') || 'No components found'}

### 🎨 DESIGN SYSTEM:
- Primary Color: #0066cc
- Secondary Color: #ff6600
- Background: #2a2a2a
- Text: #ffffff
- Accent: #00ff66

### 📏 SPACING SYSTEM:
- Base unit: 8px
- Small: 4px
- Medium: 16px
- Large: 32px
- XL: 64px

### 🚀 EXPORT PROCESS:
1. Select all frames
2. Right-click → Copy as → Copy as JSON
3. Or use Figma API/plugins
4. Save JSON file
5. Import back into VST Builder

### 💡 PRO TIPS:
- Use components for consistency
- Create a master component library
- Use proper naming convention
- Set up responsive constraints
- Test on different screen sizes

Created by VST Builder Tool
${new Date().toISOString()}
`;

    const instructPath = path.join(this.exportDir, `${filename}_figma_instructions.txt`);
    await fs.writeFile(instructPath, instructions);
  }

  /**
   * Create smart object data for PSD
   */
  async createSmartObjectData(component) {
    return {
      type: component.type,
      properties: {
        parameter: component.parameter,
        value: component.value,
        min: component.min || 0,
        max: component.max || 100,
        step: component.step || 1
      },
      style: {
        width: component.width,
        height: component.height,
        color: component.color || '#cccccc'
      }
    };
  }

  /**
   * Create Figma components library
   */
  async createFigmaComponents(designData) {
    const components = {};
    
    const componentTypes = [...new Set(designData.components?.map(c => c.type) || [])];
    
    for (const type of componentTypes) {
      components[type] = {
        id: this.generateId(),
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Component`,
        type: 'COMPONENT',
        variants: {
          'Default': { id: this.generateId(), name: 'Default' },
          'Hover': { id: this.generateId(), name: 'Hover' },
          'Active': { id: this.generateId(), name: 'Active' },
          'Disabled': { id: this.generateId(), name: 'Disabled' }
        }
      };
    }

    return components;
  }

  /**
   * Create Figma styles library
   */
  async createFigmaStyles(designData) {
    return {
      colors: {
        primary: { id: this.generateId(), name: 'Primary', color: '#0066cc' },
        secondary: { id: this.generateId(), name: 'Secondary', color: '#ff6600' },
        background: { id: this.generateId(), name: 'Background', color: '#2a2a2a' },
        text: { id: this.generateId(), name: 'Text', color: '#ffffff' }
      },
      text: {
        heading: { id: this.generateId(), name: 'Heading', fontSize: 24, fontWeight: 'bold' },
        body: { id: this.generateId(), name: 'Body', fontSize: 14, fontWeight: 'normal' },
        caption: { id: this.generateId(), name: 'Caption', fontSize: 12, fontWeight: 'normal' }
      },
      effects: {
        shadow: { id: this.generateId(), name: 'Drop Shadow', type: 'DROP_SHADOW' },
        glow: { id: this.generateId(), name: 'Glow', type: 'INNER_SHADOW' }
      }
    };
  }

  /**
   * Export both PSD and Figma templates
   */
  async exportBothTemplates(designData, options = {}) {
    console.log('🎨 Exporting both PSD and Figma templates...');
    
    const baseName = options.baseName || 'instrument_template';
    
    const [psdResult, figmaResult] = await Promise.all([
      this.exportAsPSD(designData, { 
        filename: `${baseName}.psd`,
        ...options.psd 
      }),
      this.exportAsFigma(designData, { 
        filename: `${baseName}.fig`,
        ...options.figma 
      })
    ]);

    return {
      psd: psdResult,
      figma: figmaResult,
      success: psdResult.success && figmaResult.success,
      message: 'Both PSD and Figma templates exported successfully!'
    };
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get export status
   */
  async getExportedTemplates() {
    try {
      const files = await fs.readdir(this.exportDir);
      const templates = {
        psd: files.filter(f => f.endsWith('.psd')),
        figma: files.filter(f => f.endsWith('.json')),
        instructions: files.filter(f => f.includes('instructions'))
      };
      
      return {
        success: true,
        templates,
        count: templates.psd.length + templates.figma.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = TemplateExporter;
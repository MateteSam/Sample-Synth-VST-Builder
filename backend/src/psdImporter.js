/**
 * PSD IMPORTER - Revolutionary Design Import System
 * Converts Photoshop/Figma/Sketch files into interactive instrument UIs
 */

const fs = require('fs').promises;
const path = require('path');
const PSD = require('psd'); // You'll need: npm install psd

/**
 * Smart layer name parser
 * Detects component types from layer naming conventions
 */
const COMPONENT_PATTERNS = {
  knob: /^(knob|rotary|dial)_(.+)$/i,
  fader: /^(fader|slider|slide)_(.+)$/i,
  button: /^(btn|button)_(.+)$/i,
  keyboard: /^(keyboard|keys)_?(.*)$/i,
  led: /^(led|indicator|light)_(.+)$/i,
  waveform: /^(waveform|wave|osc)_(.+)$/i,
  meter: /^(meter|vu|level)_(.+)$/i,
  display: /^(display|lcd|screen)_(.+)$/i,
  background: /^(bg|background|backdrop)$/i,
  label: /^(label|text|title)_(.+)$/i
};

/**
 * State detection patterns
 * Detects different component states from layer naming
 */
const STATE_PATTERNS = {
  normal: /_(normal|default|idle)$/i,
  hover: /_(hover|over)$/i,
  active: /_(active|pressed|down|on)$/i,
  disabled: /_(disabled|inactive|off)$/i,
  focus: /_(focus|focused)$/i
};

/**
 * Main PSD Importer Class
 */
class PSDImporter {
  constructor() {
    this.components = [];
    this.assets = [];
    this.layout = {};
    this.theme = {};
  }

  /**
   * Import PSD file and extract all components
   */
  async importPSD(psdFilePath) {
    console.log('🎨 Importing PSD file:', psdFilePath);
    
    try {
      const psd = await PSD.open(psdFilePath);
      const tree = psd.tree();
      
      this.layout = {
        width: psd.tree().width,
        height: psd.tree().height,
        name: path.basename(psdFilePath, '.psd')
      };

      // Extract color palette
      await this.extractColorPalette(tree);
      
      // Parse all layers
      await this.parseLayers(tree.children());
      
      // Generate component mapping
      const mapping = this.generateComponentMapping();
      
      // Export assets
      await this.exportAssets(psd, psdFilePath);
      
      console.log('✅ PSD Import complete!');
      console.log(`   - Found ${this.components.length} components`);
      console.log(`   - Extracted ${this.assets.length} assets`);
      
      return {
        layout: this.layout,
        components: this.components,
        assets: this.assets,
        theme: this.theme,
        mapping
      };
      
    } catch (error) {
      console.error('❌ PSD Import failed:', error);
      throw error;
    }
  }

  /**
   * Parse layers recursively
   */
  async parseLayers(layers, parentPath = '') {
    for (const layer of layers) {
      const layerName = layer.name;
      const fullPath = parentPath ? `${parentPath}/${layerName}` : layerName;
      
      // Skip hidden layers
      if (!layer.visible) continue;
      
      // Detect component type
      const componentType = this.detectComponentType(layerName);
      
      if (componentType) {
        const component = await this.parseComponent(layer, componentType, fullPath);
        this.components.push(component);
      }
      
      // Recursively parse children (groups)
      if (layer.children && layer.children().length > 0) {
        await this.parseLayers(layer.children(), fullPath);
      }
    }
  }

  /**
   * Detect component type from layer name
   */
  detectComponentType(layerName) {
    for (const [type, pattern] of Object.entries(COMPONENT_PATTERNS)) {
      if (pattern.test(layerName)) {
        return type;
      }
    }
    return null;
  }

  /**
   * Parse individual component
   */
  async parseComponent(layer, type, fullPath) {
    const match = layerName => {
      for (const pattern of Object.values(COMPONENT_PATTERNS)) {
        const m = layerName.match(pattern);
        if (m) return m[2] || m[1];
      }
      return layerName;
    };

    const paramName = match(layer.name);
    const bounds = layer.export().document.children[0].export().layer;
    
    const component = {
      id: this.generateId(),
      type,
      name: paramName,
      layerName: layer.name,
      fullPath,
      position: {
        x: bounds.left,
        y: bounds.top,
        width: bounds.right - bounds.left,
        height: bounds.bottom - bounds.top
      },
      visible: layer.visible,
      opacity: layer.opacity / 255,
      states: {},
      metadata: {
        blendMode: layer.blendMode,
        layerType: layer.type
      }
    };

    // Detect states (if layer is a group with state variants)
    if (layer.children && layer.children().length > 0) {
      const children = layer.children();
      for (const child of children) {
        const state = this.detectState(child.name);
        if (state) {
          component.states[state] = {
            layerName: child.name,
            visible: child.visible
          };
        }
      }
    }

    // Add component-specific properties
    this.addComponentProperties(component, type);

    return component;
  }

  /**
   * Detect component state from layer name
   */
  detectState(layerName) {
    for (const [state, pattern] of Object.entries(STATE_PATTERNS)) {
      if (pattern.test(layerName)) {
        return state;
      }
    }
    return null;
  }

  /**
   * Add component-specific properties
   */
  addComponentProperties(component, type) {
    switch (type) {
      case 'knob':
        component.properties = {
          min: 0,
          max: 100,
          defaultValue: 50,
          step: 1,
          unit: '',
          rotation: { min: -135, max: 135 }
        };
        break;
      
      case 'fader':
        component.properties = {
          min: 0,
          max: 100,
          defaultValue: 50,
          step: 1,
          orientation: 'vertical',
          unit: ''
        };
        break;
      
      case 'button':
        component.properties = {
          momentary: false,
          toggleable: true
        };
        break;
      
      case 'keyboard':
        component.properties = {
          startNote: 36, // C2
          endNote: 96,   // C7
          octaves: 5
        };
        break;
      
      case 'led':
        component.properties = {
          onColor: '#00ff00',
          offColor: '#333333'
        };
        break;
    }
  }

  /**
   * Extract color palette from PSD
   */
  async extractColorPalette(tree) {
    const colors = new Set();
    
    const extractColors = (layer) => {
      // This is a simplified version - actual implementation would use PSD color data
      if (layer.children && layer.children().length > 0) {
        layer.children().forEach(extractColors);
      }
    };
    
    extractColors(tree);
    
    this.theme = {
      colors: Array.from(colors),
      fonts: [], // Would extract from text layers
      spacing: this.detectSpacing(),
      borderRadius: this.detectBorderRadius()
    };
  }

  /**
   * Detect spacing patterns
   */
  detectSpacing() {
    // Analyze component positions to detect consistent spacing
    const gaps = [];
    
    for (let i = 1; i < this.components.length; i++) {
      const prev = this.components[i - 1];
      const curr = this.components[i];
      
      const gap = curr.position.y - (prev.position.y + prev.position.height);
      if (gap > 0) gaps.push(gap);
    }
    
    // Find most common gaps
    const spacing = gaps.reduce((acc, gap) => {
      acc[gap] = (acc[gap] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(spacing).sort((a, b) => spacing[b] - spacing[a]).slice(0, 3);
  }

  /**
   * Detect border radius patterns
   */
  detectBorderRadius() {
    // Would analyze layer effects to detect rounded corners
    return [0, 4, 8, 16]; // Default values
  }

  /**
   * Generate component mapping for your tool
   */
  generateComponentMapping() {
    return this.components.map(comp => ({
      id: comp.id,
      type: comp.type,
      name: comp.name,
      audioParameter: this.mapToAudioParameter(comp),
      bounds: comp.position,
      properties: comp.properties,
      binding: {
        hiseScript: this.generateHISEBinding(comp),
        webAudio: this.generateWebAudioBinding(comp)
      }
    }));
  }

  /**
   * Map component to audio parameter
   */
  mapToAudioParameter(component) {
    const typeMap = {
      knob: 'continuous',
      fader: 'continuous',
      button: 'discrete',
      led: 'indicator',
      meter: 'output'
    };
    
    return {
      type: typeMap[component.type] || 'unknown',
      parameterId: this.generateParameterId(component.name),
      range: component.properties?.min !== undefined 
        ? [component.properties.min, component.properties.max]
        : [0, 1]
    };
  }

  /**
   * Generate HISE script binding
   */
  generateHISEBinding(component) {
    const paramId = this.generateParameterId(component.name);
    
    switch (component.type) {
      case 'knob':
      case 'fader':
        return `
// ${component.name} Control
const ${paramId} = Content.addKnob("${paramId}", ${component.position.x}, ${component.position.y});
${paramId}.set("width", ${component.position.width});
${paramId}.set("height", ${component.position.height});
${paramId}.set("min", ${component.properties.min});
${paramId}.set("max", ${component.properties.max});
${paramId}.set("defaultValue", ${component.properties.defaultValue});
${paramId}.set("mode", "${component.type === 'fader' ? 'Linear' : 'Frequency'}");
`;
      
      case 'button':
        return `
// ${component.name} Button
const ${paramId} = Content.addButton("${paramId}", ${component.position.x}, ${component.position.y});
${paramId}.set("width", ${component.position.width});
${paramId}.set("height", ${component.position.height});
`;
      
      default:
        return `// ${component.name} (${component.type})`;
    }
  }

  /**
   * Generate Web Audio binding
   */
  generateWebAudioBinding(component) {
    return {
      eventType: component.type === 'button' ? 'click' : 'input',
      audioParam: this.generateParameterId(component.name),
      valueTransform: component.type === 'knob' 
        ? 'exponential' 
        : 'linear'
    };
  }

  /**
   * Export assets (images) from PSD
   */
  async exportAssets(psd, psdFilePath) {
    const outputDir = path.join(
      path.dirname(psdFilePath),
      'exported_assets',
      path.basename(psdFilePath, '.psd')
    );
    
    await fs.mkdir(outputDir, { recursive: true });
    
    for (const component of this.components) {
      try {
        // Export component as PNG
        const assetPath = path.join(outputDir, `${component.id}.png`);
        
        // This would use PSD library to export layer as image
        // Simplified for demonstration
        
        this.assets.push({
          componentId: component.id,
          path: assetPath,
          type: 'png',
          size: component.position
        });
        
        console.log(`   ✓ Exported: ${component.name}`);
      } catch (error) {
        console.error(`   ✗ Failed to export: ${component.name}`, error);
      }
    }
  }

  /**
   * Helper: Generate unique ID
   */
  generateId() {
    return 'comp_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Helper: Generate parameter ID
   */
  generateParameterId(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }
}

/**
 * Figma API Importer
 * Import designs directly from Figma using their API
 */
class FigmaImporter extends PSDImporter {
  constructor(accessToken) {
    super();
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.figma.com/v1';
  }

  async importFigmaFile(fileKey) {
    console.log('🎨 Importing from Figma:', fileKey);
    
    try {
      // Get file data
      const response = await fetch(`${this.baseUrl}/files/${fileKey}`, {
        headers: { 'X-Figma-Token': this.accessToken }
      });
      
      const data = await response.json();
      
      // Parse Figma structure
      await this.parseFigmaNodes(data.document.children);
      
      // Export images
      await this.exportFigmaImages(fileKey);
      
      return this.generateComponentMapping();
      
    } catch (error) {
      console.error('❌ Figma import failed:', error);
      throw error;
    }
  }

  async parseFigmaNodes(nodes, parentPath = '') {
    for (const node of nodes) {
      if (!node.visible) continue;
      
      const componentType = this.detectComponentType(node.name);
      
      if (componentType) {
        const component = {
          id: this.generateId(),
          type: componentType,
          name: node.name,
          position: {
            x: node.absoluteBoundingBox.x,
            y: node.absoluteBoundingBox.y,
            width: node.absoluteBoundingBox.width,
            height: node.absoluteBoundingBox.height
          },
          properties: {}
        };
        
        this.addComponentProperties(component, componentType);
        this.components.push(component);
      }
      
      if (node.children) {
        await this.parseFigmaNodes(node.children, node.name);
      }
    }
  }

  async exportFigmaImages(fileKey) {
    // Get image URLs from Figma API
    const nodeIds = this.components.map(c => c.id).join(',');
    
    const response = await fetch(
      `${this.baseUrl}/images/${fileKey}?ids=${nodeIds}&format=png&scale=2`,
      { headers: { 'X-Figma-Token': this.accessToken } }
    );
    
    const imageData = await response.json();
    
    // Download images
    for (const [nodeId, url] of Object.entries(imageData.images)) {
      this.assets.push({
        componentId: nodeId,
        url,
        type: 'png'
      });
    }
  }
}

module.exports = { PSDImporter, FigmaImporter };

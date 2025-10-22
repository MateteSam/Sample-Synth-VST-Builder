/**
 * HISE PROJECT GENERATOR
 * Generates complete HISE .hip project files from your instrument design
 * This allows you to create HISE projects without ever opening HISE!
 */

const fs = require('fs').promises;
const path = require('path');
const { create } = require('xmlbuilder2');

/**
 * Main HISE Project Generator Class
 */
class HISEProjectGenerator {
  constructor(projectName, outputDir) {
    this.projectName = projectName;
    this.outputDir = outputDir;
    this.components = [];
    this.samples = [];
    this.sampleMaps = [];
    this.modulators = [];
    this.effects = [];
    this.scriptProcessors = [];
  }

  /**
   * Generate complete HISE project structure
   */
  async generateProject(designData) {
    console.log('🏗️  Generating HISE Project:', this.projectName);
    
    try {
      // Create project directory structure
      await this.createProjectStructure();
      
      // Generate XML preset file
      await this.generatePresetXML(designData);
      
      // Generate interface script
      await this.generateInterfaceScript(designData);
      
      // Generate sample maps
      await this.generateSampleMaps(designData.samples);
      
      // Copy samples
      await this.copySamples(designData.samples);
      
      // Generate metadata
      await this.generateProjectMetadata(designData);
      
      // Generate README
      await this.generateReadme();
      
      console.log('✅ HISE Project generated successfully!');
      console.log(`   Location: ${this.outputDir}`);
      console.log(`   Open in HISE: ${path.join(this.outputDir, 'Presets', `${this.projectName}.hip`)}`);
      
      return {
        projectPath: this.outputDir,
        presetFile: path.join(this.outputDir, 'Presets', `${this.projectName}.hip`),
        scriptFile: path.join(this.outputDir, 'Scripts', 'Interface.js')
      };
      
    } catch (error) {
      console.error('❌ HISE Project generation failed:', error);
      throw error;
    }
  }

  /**
   * Create HISE project directory structure
   */
  async createProjectStructure() {
    const dirs = [
      'Presets',
      'Scripts',
      'Samples',
      'SampleMaps',
      'Images',
      'UserPresets',
      'XmlPresetBackups',
      'Binaries'
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(path.join(this.outputDir, dir), { recursive: true });
    }
  }

  /**
   * Generate HISE preset XML file
   */
  async generatePresetXML(designData) {
    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('Preset', {
        Version: '1.0.0',
        Name: this.projectName,
        Author: designData.metadata?.author || 'Unknown',
        Date: new Date().toISOString(),
        Notes: designData.metadata?.description || ''
      });
    
    // Main container
    const container = xml.ele('Content');
    
    // Master container
    const masterContainer = container.ele('Processor', {
      Type: 'Container',
      ID: 'Master Container',
      Bypassed: '0',
      Gain: '1.0',
      Balance: '0.0',
      VoiceLimit: '256',
      KillFadeTime: '20',
      IconColour: '0'
    });
    
    // Add sampler(s)
    for (const sampleGroup of designData.sampleGroups || []) {
      this.addSampler(masterContainer, sampleGroup);
    }
    
    // Add effects chain
    const effectsChain = masterContainer.ele('EditorStates')
      .ele('EffectChain');
    
    for (const effect of designData.effects || []) {
      this.addEffect(effectsChain, effect);
    }
    
    // Routing matrix
    masterContainer.ele('RoutingMatrix', {
      NumSourceChannels: '2',
      Channel0: '0',
      Send0: '-1',
      Channel1: '1',
      Send1: '-1'
    });
    
    // Write XML file
    const xmlString = xml.end({ prettyPrint: true });
    const presetPath = path.join(this.outputDir, 'Presets', `${this.projectName}.hip`);
    await fs.writeFile(presetPath, xmlString);
    
    console.log('   ✓ Generated preset XML');
  }

  /**
   * Add sampler to preset
   */
  addSampler(parent, sampleGroup) {
    const sampler = parent.ele('Processor', {
      Type: 'StreamingSampler',
      ID: sampleGroup.name || 'Sampler',
      Bypassed: '0',
      Gain: '1.0',
      Balance: '0.0',
      VoiceLimit: '256',
      SamplerRepeatMode: 'Kill Note',
      PitchTracking: '1',
      OneShot: '0',
      CrossfadeGroups: '0',
      Purged: '0',
      Reversed: '0'
    });
    
    // Sample map reference
    sampler.ele('SampleMap', {
      ID: sampleGroup.sampleMapId || 'SampleMap'
    });
    
    // Add modulators (envelopes, LFOs, etc.)
    const modChain = sampler.ele('ModulatorChain', {
      Type: 'GainModulation',
      ID: 'Gain Modulation'
    });
    
    // ADSR envelope
    modChain.ele('Processor', {
      Type: 'SimpleEnvelope',
      ID: 'ADSR',
      Bypassed: '0',
      Gain: '1.0',
      Attack: sampleGroup.envelope?.attack || '20',
      Release: sampleGroup.envelope?.release || '200',
      AttackLevel: '0.0',
      AttackCurve: '0.5',
      Monophonic: '0'
    });
    
    return sampler;
  }

  /**
   * Add effect to chain
   */
  addEffect(parent, effect) {
    const effectTypes = {
      reverb: 'SimpleReverb',
      delay: 'SimpleDelay',
      chorus: 'Chorus',
      filter: 'PolyshapeFX',
      compressor: 'Dynamics',
      distortion: 'Dynamics'
    };
    
    const effectType = effectTypes[effect.type] || 'SimpleReverb';
    
    const effectNode = parent.ele('Processor', {
      Type: effectType,
      ID: effect.name || effect.type,
      Bypassed: effect.bypassed ? '1' : '0',
      Gain: '1.0'
    });
    
    // Add effect-specific parameters
    for (const [param, value] of Object.entries(effect.parameters || {})) {
      effectNode.att(param, value.toString());
    }
    
    return effectNode;
  }

  /**
   * Generate interface script
   */
  async generateInterfaceScript(designData) {
    let script = `/**
 * ${this.projectName} - Interface Script
 * Auto-generated by Seko Sa Instrument Builder
 * Generated: ${new Date().toISOString()}
 */

namespace ${this.projectName.replace(/[^a-zA-Z0-9]/g, '_')}
{
    // ========================================
    // CONFIGURATION
    // ========================================
    
    const var WIDTH = ${designData.layout?.width || 800};
    const var HEIGHT = ${designData.layout?.height || 600};
    
    Content.setWidth(WIDTH);
    Content.setHeight(HEIGHT);
    
    // ========================================
    // UI COMPONENTS
    // ========================================
    
`;
    
    // Generate code for each component
    for (const component of designData.components || []) {
      script += this.generateComponentCode(component);
      script += '\n';
    }
    
    // Add callback functions
    script += `
    // ========================================
    // CALLBACKS
    // ========================================
    
`;
    
    for (const component of designData.components || []) {
      if (component.type !== 'label' && component.type !== 'background') {
        script += this.generateCallback(component);
        script += '\n';
      }
    }
    
    // Add utility functions
    script += `
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    inline function updateUI()
    {
        // Custom UI update logic
    }
    
    inline function loadPreset(presetName)
    {
        Engine.loadUserPreset(presetName);
    }
    
}; // namespace
`;
    
    const scriptPath = path.join(this.outputDir, 'Scripts', 'Interface.js');
    await fs.writeFile(scriptPath, script);
    
    console.log('   ✓ Generated interface script');
  }

  /**
   * Generate component code
   */
  generateComponentCode(component) {
    const id = this.sanitizeId(component.name);
    const x = Math.round(component.position?.x || 0);
    const y = Math.round(component.position?.y || 0);
    const w = Math.round(component.position?.width || 100);
    const h = Math.round(component.position?.height || 30);
    
    switch (component.type) {
      case 'knob':
        return `    // ${component.name} Knob
    const var ${id} = Content.addKnob("${id}", ${x}, ${y});
    ${id}.set("width", ${w});
    ${id}.set("height", ${h});
    ${id}.set("min", ${component.properties?.min || 0});
    ${id}.set("max", ${component.properties?.max || 100});
    ${id}.set("defaultValue", ${component.properties?.defaultValue || 50});
    ${id}.set("mode", "Linear");
    ${id}.set("stepSize", ${component.properties?.step || 1});
    ${id}.set("middlePosition", ${(component.properties?.min + component.properties?.max) / 2 || 50});
    ${id}.set("suffix", "${component.properties?.unit || ''}");
`;
      
      case 'fader':
        return `    // ${component.name} Fader
    const var ${id} = Content.addKnob("${id}", ${x}, ${y});
    ${id}.set("width", ${w});
    ${id}.set("height", ${h});
    ${id}.set("style", "Vertical");
    ${id}.set("min", ${component.properties?.min || 0});
    ${id}.set("max", ${component.properties?.max || 100});
    ${id}.set("defaultValue", ${component.properties?.defaultValue || 50});
`;
      
      case 'button':
        return `    // ${component.name} Button
    const var ${id} = Content.addButton("${id}", ${x}, ${y});
    ${id}.set("width", ${w});
    ${id}.set("height", ${h});
    ${id}.set("isMomentary", ${component.properties?.momentary ? 'true' : 'false'});
`;
      
      case 'label':
        return `    // ${component.name} Label
    const var ${id} = Content.addLabel("${id}", ${x}, ${y});
    ${id}.set("width", ${w});
    ${id}.set("height", ${h});
    ${id}.set("text", "${component.properties?.text || component.name}");
    ${id}.set("fontName", "${component.properties?.fontName || 'Arial'}");
    ${id}.set("fontSize", ${component.properties?.fontSize || 14});
    ${id}.set("textColour", Colours.withAlpha(Colours.white, ${component.opacity || 1.0}));
`;
      
      case 'led':
        return `    // ${component.name} LED
    const var ${id} = Content.addPanel("${id}", ${x}, ${y});
    ${id}.set("width", ${w});
    ${id}.set("height", ${h});
    ${id}.set("allowCallbacks", "Clicks, Hover & Dragging");
`;
      
      default:
        return `    // ${component.name} (${component.type})
    const var ${id} = Content.addPanel("${id}", ${x}, ${y});
    ${id}.set("width", ${w});
    ${id}.set("height", ${h});
`;
    }
  }

  /**
   * Generate callback function
   */
  generateCallback(component) {
    const id = this.sanitizeId(component.name);
    const audioParam = component.audioParameter?.parameterId || id;
    
    return `    inline function on${id}Control(component, value)
    {
        // Handle ${component.name} change
        // Value: value (${component.properties?.min || 0} - ${component.properties?.max || 100})
        
        ${this.generateAudioBinding(component, audioParam)}
    };
    ${id}.setControlCallback(on${id}Control);
`;
  }

  /**
   * Generate audio parameter binding
   */
  generateAudioBinding(component, audioParam) {
    switch (component.type) {
      case 'knob':
      case 'fader':
        return `        // Set audio parameter
        Synth.setAttribute(Synth.getIdList("${audioParam}"), value);`;
      
      case 'button':
        return `        // Toggle state
        if (value == 1)
        {
            // Button pressed
            Synth.setAttribute(Synth.getIdList("${audioParam}"), 1);
        }
        else
        {
            // Button released
            Synth.setAttribute(Synth.getIdList("${audioParam}"), 0);
        }`;
      
      default:
        return `        // Custom logic for ${component.type}`;
    }
  }

  /**
   * Generate sample maps
   */
  async generateSampleMaps(samples) {
    if (!samples || samples.length === 0) return;
    
    // Group samples by note/velocity
    const sampleMap = {
      ID: 'SampleMap',
      RRGroupAmount: '1',
      MicPositions: ';'
    };
    
    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('samplemap', sampleMap);
    
    for (const sample of samples) {
      xml.ele('sample', {
        FileName: path.basename(sample.path),
        Root: sample.rootNote || '60',
        LoKey: sample.loKey || sample.rootNote || '60',
        HiKey: sample.hiKey || sample.rootNote || '60',
        LoVel: sample.loVel || '0',
        HiVel: sample.hiVel || '127',
        RRGroup: sample.rrGroup || '1',
        Volume: sample.volume || '0',
        Pan: sample.pan || '0',
        Pitch: sample.pitch || '0',
        SampleStart: sample.sampleStart || '0',
        SampleEnd: sample.sampleEnd || '0',
        SampleStartMod: '0',
        LoopStart: sample.loopStart || '0',
        LoopEnd: sample.loopEnd || '0',
        LoopXFade: '0',
        LoopEnabled: sample.looped ? '1' : '0',
        LowerVelocityXFade: '0',
        UpperVelocityXFade: '0',
        SampleState: 'Normal'
      });
    }
    
    const xmlString = xml.end({ prettyPrint: true });
    const sampleMapPath = path.join(this.outputDir, 'SampleMaps', 'SampleMap.xml');
    await fs.writeFile(sampleMapPath, xmlString);
    
    console.log('   ✓ Generated sample maps');
  }

  /**
   * Copy samples to project
   */
  async copySamples(samples) {
    if (!samples || samples.length === 0) return;
    
    const samplesDir = path.join(this.outputDir, 'Samples');
    
    for (const sample of samples) {
      try {
        const sourcePath = sample.path;
        const destPath = path.join(samplesDir, path.basename(sample.path));
        await fs.copyFile(sourcePath, destPath);
      } catch (error) {
        console.warn(`   ⚠ Could not copy sample: ${sample.path}`);
      }
    }
    
    console.log(`   ✓ Copied ${samples.length} samples`);
  }

  /**
   * Generate project metadata
   */
  async generateProjectMetadata(designData) {
    const metadata = {
      name: this.projectName,
      version: designData.metadata?.version || '1.0.0',
      author: designData.metadata?.author || 'Unknown',
      description: designData.metadata?.description || '',
      generatedBy: 'Seko Sa Instrument Builder',
      generatedDate: new Date().toISOString(),
      components: this.components.length,
      samples: this.samples.length
    };
    
    const metadataPath = path.join(this.outputDir, 'project.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    console.log('   ✓ Generated metadata');
  }

  /**
   * Generate README
   */
  async generateReadme() {
    const readme = `# ${this.projectName}

Auto-generated HISE project by Seko Sa Instrument Builder.

## How to Use

1. Open HISE
2. Go to File → Load Project
3. Select: \`${path.join(this.outputDir, 'Presets', `${this.projectName}.hip`)}\`
4. Click "Compile" to build your VST/Standalone

## Project Structure

- \`Presets/\` - HISE preset files
- \`Scripts/\` - Interface scripts
- \`Samples/\` - Audio samples
- \`SampleMaps/\` - Sample mapping configurations
- \`Images/\` - UI graphics

## Next Steps

1. Test your instrument in HISE
2. Customize the interface if needed
3. Export as VST3/AU/Standalone

Generated: ${new Date().toLocaleString()}
`;
    
    const readmePath = path.join(this.outputDir, 'README.md');
    await fs.writeFile(readmePath, readme);
  }

  /**
   * Helper: Sanitize component ID for script
   */
  sanitizeId(name) {
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^(\d)/, '_$1')
      .replace(/_{2,}/g, '_');
  }
}

module.exports = { HISEProjectGenerator };

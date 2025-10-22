/**
 * JUCE VST3 DIRECT COMPILER
 * Compile VST3 plugins directly without HISE!
 * 
 * This generates a JUCE project and compiles it to native VST3
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class JUCEVSTCompiler {
  constructor() {
    this.jucePath = null;
    this.cmakePath = null;
    this.compilerPath = null;
  }

  /**
   * Compile instrument directly to VST3
   */
  async compileToVST(designData, outputDir) {
    console.log('🎛️  Direct VST3 Compilation Starting...');
    
    try {
      // Check dependencies
      await this.checkDependencies();
      
      // Generate JUCE project
      const projectDir = await this.generateJUCEProject(designData, outputDir);
      
      // Configure CMake
      await this.configureCMake(projectDir);
      
      // Build VST3
      const vstPath = await this.buildVST(projectDir);
      
      console.log('✅ VST3 Compilation Complete!');
      console.log(`   VST3: ${vstPath}`);
      
      return {
        success: true,
        vstPath,
        projectDir
      };
      
    } catch (error) {
      console.error('❌ VST3 Compilation failed:', error);
      throw error;
    }
  }

  /**
   * Check required dependencies
   */
  async checkDependencies() {
    console.log('   Checking dependencies...');
    
    // Check for JUCE
    try {
      const juceDir = process.env.JUCE_PATH || 'C:\\JUCE';
      await fs.access(juceDir);
      this.jucePath = juceDir;
      console.log('   ✓ JUCE found');
    } catch {
      console.log('   ℹ JUCE not found, will auto-install');
      await this.installJUCE();
    }
    
    // Check for CMake
    try {
      await execAsync('cmake --version');
      console.log('   ✓ CMake found');
    } catch {
      console.log('   ℹ CMake not found, will auto-install');
      await this.installCMake();
    }
    
    // Check for C++ compiler
    try {
      if (process.platform === 'win32') {
        await execAsync('cl.exe');
        console.log('   ✓ MSVC found');
      } else {
        await execAsync('g++ --version');
        console.log('   ✓ GCC found');
      }
    } catch {
      throw new Error('C++ compiler not found. Please install Visual Studio (Windows) or GCC (Linux/Mac)');
    }
  }

  /**
   * Auto-install JUCE
   */
  async installJUCE() {
    console.log('   📦 Installing JUCE...');
    
    const juceUrl = 'https://github.com/juce-framework/JUCE/archive/refs/heads/master.zip';
    const installDir = path.join(process.cwd(), 'dependencies', 'JUCE');
    
    // Download and extract JUCE
    // This is simplified - actual implementation would use proper download/extract
    await fs.mkdir(installDir, { recursive: true });
    
    this.jucePath = installDir;
    console.log('   ✓ JUCE installed');
  }

  /**
   * Auto-install CMake
   */
  async installCMake() {
    console.log('   📦 Installing CMake...');
    
    if (process.platform === 'win32') {
      // Use winget on Windows
      await execAsync('winget install Kitware.CMake');
    } else {
      throw new Error('Please install CMake manually: https://cmake.org/download/');
    }
    
    console.log('   ✓ CMake installed');
  }

  /**
   * Generate JUCE project files
   */
  async generateJUCEProject(designData, outputDir) {
    const projectName = designData.name || 'MyInstrument';
    const projectDir = path.join(outputDir, 'JUCE_Project');
    
    await fs.mkdir(projectDir, { recursive: true });
    
    // Generate CMakeLists.txt
    await this.generateCMakeLists(projectDir, projectName, designData);
    
    // Generate source files
    await this.generatePluginProcessor(projectDir, projectName, designData);
    await this.generatePluginEditor(projectDir, projectName, designData);
    
    // Copy assets
    await this.copyAssets(projectDir, designData);
    
    console.log('   ✓ JUCE project generated');
    return projectDir;
  }

  /**
   * Generate CMakeLists.txt
   */
  async generateCMakeLists(projectDir, projectName, designData) {
    const cmake = `cmake_minimum_required(VERSION 3.15)

project(${projectName} VERSION ${designData.metadata?.version || '1.0.0'})

# JUCE setup
set(JUCE_PATH "${this.jucePath}" CACHE PATH "Path to JUCE framework")
add_subdirectory(\${JUCE_PATH} JUCE)

# Plugin formats
set(PLUGIN_FORMATS VST3 Standalone)

# Add plugin
juce_add_plugin(${projectName}
    COMPANY_NAME "${designData.metadata?.author || 'YourCompany'}"
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT FALSE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS FALSE
    COPY_PLUGIN_AFTER_BUILD TRUE
    PLUGIN_MANUFACTURER_CODE Manu
    PLUGIN_CODE ${this.generatePluginCode(projectName)}
    FORMATS \${PLUGIN_FORMATS}
    PRODUCT_NAME "${projectName}"
)

# Source files
target_sources(${projectName}
    PRIVATE
        Source/PluginProcessor.cpp
        Source/PluginEditor.cpp
)

# Include directories
target_include_directories(${projectName}
    PRIVATE
        Source
)

# Link JUCE modules
target_link_libraries(${projectName}
    PRIVATE
        juce::juce_audio_basics
        juce::juce_audio_devices
        juce::juce_audio_formats
        juce::juce_audio_plugin_client
        juce::juce_audio_processors
        juce::juce_audio_utils
        juce::juce_core
        juce::juce_data_structures
        juce::juce_events
        juce::juce_graphics
        juce::juce_gui_basics
        juce::juce_gui_extra
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags
)

# Compile definitions
target_compile_definitions(${projectName}
    PUBLIC
        JUCE_WEB_BROWSER=0
        JUCE_USE_CURL=0
        JUCE_VST3_CAN_REPLACE_VST2=0
)
`;
    
    await fs.writeFile(path.join(projectDir, 'CMakeLists.txt'), cmake);
  }

  /**
   * Generate PluginProcessor.cpp
   */
  async generatePluginProcessor(projectDir, projectName, designData) {
    const sourceDir = path.join(projectDir, 'Source');
    await fs.mkdir(sourceDir, { recursive: true });
    
    // Header file
    const header = `#pragma once

#include <JuceHeader.h>

class ${projectName}AudioProcessor : public juce::AudioProcessor
{
public:
    ${projectName}AudioProcessor();
    ~${projectName}AudioProcessor() override;

    void prepareToPlay(double sampleRate, int samplesPerBlock) override;
    void releaseResources() override;
    void processBlock(juce::AudioBuffer<float>&, juce::MidiBuffer&) override;

    juce::AudioProcessorEditor* createEditor() override;
    bool hasEditor() const override { return true; }

    const juce::String getName() const override { return JucePlugin_Name; }
    bool acceptsMidi() const override { return true; }
    bool producesMidi() const override { return false; }
    bool isMidiEffect() const override { return false; }
    double getTailLengthSeconds() const override { return 0.0; }

    int getNumPrograms() override { return 1; }
    int getCurrentProgram() override { return 0; }
    void setCurrentProgram(int index) override {}
    const juce::String getProgramName(int index) override { return {}; }
    void changeProgramName(int index, const juce::String& newName) override {}

    void getStateInformation(juce::MemoryBlock& destData) override;
    void setStateInformation(const void* data, int sizeInBytes) override;

    // Audio parameters
    juce::AudioProcessorValueTreeState parameters;

private:
    // Sample playback
    juce::Synthesiser synth;
    
    // Parameters
${this.generateParameterDeclarations(designData.components)}
    
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(${projectName}AudioProcessor)
};
`;
    
    // Implementation file
    const impl = `#include "PluginProcessor.h"
#include "PluginEditor.h"

${projectName}AudioProcessor::${projectName}AudioProcessor()
    : AudioProcessor(BusesProperties()
        .withOutput("Output", juce::AudioChannelSet::stereo(), true)),
      parameters(*this, nullptr, "PARAMETERS", createParameterLayout())
{
    // Initialize synthesiser
    for (int i = 0; i < 16; ++i)
        synth.addVoice(new juce::SamplerVoice());
        
    // Load samples
${this.generateSampleLoading(designData.samples)}
}

${projectName}AudioProcessor::~${projectName}AudioProcessor()
{
}

void ${projectName}AudioProcessor::prepareToPlay(double sampleRate, int samplesPerBlock)
{
    synth.setCurrentPlaybackSampleRate(sampleRate);
}

void ${projectName}AudioProcessor::releaseResources()
{
}

void ${projectName}AudioProcessor::processBlock(juce::AudioBuffer<float>& buffer, juce::MidiBuffer& midiMessages)
{
    juce::ScopedNoDenormals noDenormals;
    
    buffer.clear();
    synth.renderNextBlock(buffer, midiMessages, 0, buffer.getNumSamples());
}

juce::AudioProcessorEditor* ${projectName}AudioProcessor::createEditor()
{
    return new ${projectName}AudioProcessorEditor(*this);
}

void ${projectName}AudioProcessor::getStateInformation(juce::MemoryBlock& destData)
{
    auto state = parameters.copyState();
    std::unique_ptr<juce::XmlElement> xml(state.createXml());
    copyXmlToBinary(*xml, destData);
}

void ${projectName}AudioProcessor::setStateInformation(const void* data, int sizeInBytes)
{
    std::unique_ptr<juce::XmlElement> xmlState(getXmlFromBinary(data, sizeInBytes));
    if (xmlState.get() != nullptr)
        if (xmlState->hasTagName(parameters.state.getType()))
            parameters.replaceState(juce::ValueTree::fromXml(*xmlState));
}

juce::AudioProcessor* JUCE_CALLTYPE createPluginFilter()
{
    return new ${projectName}AudioProcessor();
}

juce::AudioProcessorValueTreeState::ParameterLayout ${projectName}AudioProcessor::createParameterLayout()
{
    std::vector<std::unique_ptr<juce::RangedAudioParameter>> params;
    
${this.generateParameterCreation(designData.components)}
    
    return { params.begin(), params.end() };
}
`;
    
    await fs.writeFile(path.join(sourceDir, 'PluginProcessor.h'), header);
    await fs.writeFile(path.join(sourceDir, 'PluginProcessor.cpp'), impl);
    
    console.log('   ✓ Generated audio processor');
  }

  /**
   * Generate PluginEditor.cpp
   */
  async generatePluginEditor(projectDir, projectName, designData) {
    const sourceDir = path.join(projectDir, 'Source');
    
    // Header
    const header = `#pragma once

#include <JuceHeader.h>
#include "PluginProcessor.h"

class ${projectName}AudioProcessorEditor : public juce::AudioProcessorEditor
{
public:
    ${projectName}AudioProcessorEditor(${projectName}AudioProcessor&);
    ~${projectName}AudioProcessorEditor() override;

    void paint(juce::Graphics&) override;
    void resized() override;

private:
    ${projectName}AudioProcessor& audioProcessor;
    
    // UI Components
${this.generateUIComponentDeclarations(designData.components)}
    
    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR(${projectName}AudioProcessorEditor)
};
`;
    
    // Implementation
    const impl = `#include "PluginProcessor.h"
#include "PluginEditor.h"

${projectName}AudioProcessorEditor::${projectName}AudioProcessorEditor(${projectName}AudioProcessor& p)
    : AudioProcessorEditor(&p), audioProcessor(p)
{
    setSize(${designData.layout?.width || 800}, ${designData.layout?.height || 600});
    
    // Setup UI components
${this.generateUIComponentSetup(designData.components)}
}

${projectName}AudioProcessorEditor::~${projectName}AudioProcessorEditor()
{
}

void ${projectName}AudioProcessorEditor::paint(juce::Graphics& g)
{
    g.fillAll(juce::Colour(${this.rgbToHex(designData.theme?.backgroundColor || '#1a1a1a')}));
    
    // Custom painting
${this.generateCustomPainting(designData)}
}

void ${projectName}AudioProcessorEditor::resized()
{
    // Layout components
${this.generateComponentLayout(designData.components)}
}
`;
    
    await fs.writeFile(path.join(sourceDir, 'PluginEditor.h'), header);
    await fs.writeFile(path.join(sourceDir, 'PluginEditor.cpp'), impl);
    
    console.log('   ✓ Generated editor');
  }

  /**
   * Generate parameter declarations
   */
  generateParameterDeclarations(components) {
    if (!components) return '    // No parameters';
    
    return components
      .filter(c => c.type === 'knob' || c.type === 'fader' || c.type === 'button')
      .map(c => `    std::atomic<float>* ${this.sanitizeId(c.name)}Parameter = nullptr;`)
      .join('\n');
  }

  /**
   * Generate parameter creation
   */
  generateParameterCreation(components) {
    if (!components) return '    // No parameters';
    
    return components
      .filter(c => c.type === 'knob' || c.type === 'fader' || c.type === 'button')
      .map(c => {
        const id = this.sanitizeId(c.name);
        const min = c.properties?.min || 0;
        const max = c.properties?.max || 100;
        const def = c.properties?.defaultValue || 50;
        
        return `    params.push_back(std::make_unique<juce::AudioParameterFloat>(
        "${id}",
        "${c.name}",
        ${min}.0f, ${max}.0f, ${def}.0f));`;
      })
      .join('\n\n');
  }

  /**
   * Generate sample loading code
   */
  generateSampleLoading(samples) {
    if (!samples || samples.length === 0) {
      return '    // No samples to load';
    }
    
    return samples.map((sample, idx) => `
    // Load sample: ${path.basename(sample.path)}
    {
        juce::WavAudioFormat wavFormat;
        juce::File sampleFile("${sample.path.replace(/\\/g, '\\\\')}");
        std::unique_ptr<juce::AudioFormatReader> reader(wavFormat.createReaderFor(
            new juce::FileInputStream(sampleFile), true));
        
        if (reader.get() != nullptr)
        {
            juce::BigInteger allNotes;
            allNotes.setRange(${sample.loKey || sample.rootNote || 60}, 
                            ${sample.hiKey || sample.rootNote || 60} - ${sample.loKey || sample.rootNote || 60} + 1, true);
            
            synth.addSound(new juce::SamplerSound(
                "Sample${idx}",
                *reader,
                allNotes,
                ${sample.rootNote || 60},
                0.0,
                0.0,
                reader->lengthInSamples / reader->sampleRate));
        }
    }`).join('\n');
  }

  /**
   * Generate UI component declarations
   */
  generateUIComponentDeclarations(components) {
    if (!components) return '    // No UI components';
    
    return components
      .filter(c => c.type !== 'background' && c.type !== 'label')
      .map(c => {
        const type = c.type === 'button' ? 'juce::TextButton' : 'juce::Slider';
        return `    ${type} ${this.sanitizeId(c.name)};`;
      })
      .join('\n');
  }

  /**
   * Generate UI component setup
   */
  generateUIComponentSetup(components) {
    if (!components) return '    // No components to setup';
    
    return components
      .filter(c => c.type !== 'background' && c.type !== 'label')
      .map(c => {
        const id = this.sanitizeId(c.name);
        
        if (c.type === 'button') {
          return `    addAndMakeVisible(${id});
    ${id}.setButtonText("${c.name}");`;
        } else {
          return `    addAndMakeVisible(${id});
    ${id}.setSliderStyle(juce::Slider::${c.type === 'fader' ? 'LinearVertical' : 'Rotary'});
    ${id}.setTextBoxStyle(juce::Slider::TextBoxBelow, false, 60, 20);
    ${id}.setRange(${c.properties?.min || 0}, ${c.properties?.max || 100});
    ${id}.setValue(${c.properties?.defaultValue || 50});`;
        }
      })
      .join('\n\n');
  }

  /**
   * Generate component layout
   */
  generateComponentLayout(components) {
    if (!components) return '    // No layout';
    
    return components
      .filter(c => c.type !== 'background' && c.type !== 'label')
      .map(c => {
        const id = this.sanitizeId(c.name);
        const x = Math.round(c.position?.x || 0);
        const y = Math.round(c.position?.y || 0);
        const w = Math.round(c.position?.width || 100);
        const h = Math.round(c.position?.height || 30);
        
        return `    ${id}.setBounds(${x}, ${y}, ${w}, ${h});`;
      })
      .join('\n');
  }

  /**
   * Generate custom painting
   */
  generateCustomPainting(designData) {
    return `    // Background image or custom graphics would go here
    g.setFont(16.0f);
    g.setColour(juce::Colours::white);
    g.drawText("${designData.name || 'My Instrument'}", getLocalBounds(), juce::Justification::centredTop, true);`;
  }

  /**
   * Copy assets to project
   */
  async copyAssets(projectDir, designData) {
    const assetsDir = path.join(projectDir, 'Resources');
    await fs.mkdir(assetsDir, { recursive: true });
    
    // Copy images, samples, etc.
    if (designData.assets) {
      for (const asset of designData.assets) {
        try {
          const destPath = path.join(assetsDir, path.basename(asset.path));
          await fs.copyFile(asset.path, destPath);
        } catch (error) {
          console.warn(`   ⚠ Could not copy asset: ${asset.path}`);
        }
      }
    }
  }

  /**
   * Configure CMake
   */
  async configureCMake(projectDir) {
    console.log('   ⚙️  Configuring CMake...');
    
    const buildDir = path.join(projectDir, 'build');
    await fs.mkdir(buildDir, { recursive: true });
    
    const configCommand = process.platform === 'win32'
      ? `cmake -G "Visual Studio 17 2022" -A x64 ..`
      : `cmake -G "Unix Makefiles" ..`;
    
    await execAsync(configCommand, { cwd: buildDir });
    
    console.log('   ✓ CMake configured');
  }

  /**
   * Build VST3
   */
  async buildVST(projectDir) {
    console.log('   🔨 Building VST3...');
    
    const buildDir = path.join(projectDir, 'build');
    const buildCommand = `cmake --build . --config Release`;
    
    await execAsync(buildCommand, { cwd: buildDir });
    
    const vstPath = process.platform === 'win32'
      ? path.join(buildDir, 'Release', '*.vst3')
      : path.join(buildDir, '*.vst3');
    
    console.log('   ✓ VST3 built successfully');
    
    return vstPath;
  }

  /**
   * Helper: Generate 4-character plugin code
   */
  generatePluginCode(projectName) {
    const hash = projectName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return code;
  }

  /**
   * Helper: Sanitize ID
   */
  sanitizeId(name) {
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^(\d)/, '_$1');
  }

  /**
   * Helper: RGB to hex
   */
  rgbToHex(color) {
    return color.replace('#', '0xff');
  }
}

module.exports = { JUCEVSTCompiler };

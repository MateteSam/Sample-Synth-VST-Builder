# HISE Integration Guide

## 🎯 Complete Workflow: Design Tool → HISE → VST/Standalone

This guide shows you how to take your polished UI design and quickly turn it into a working VST/Standalone plugin using HISE.

---

## 📋 Prerequisites

### 1. Install HISE
- Download from: https://github.com/christophhart/HISE
- Install to a location like `C:\HISE`
- Run HISE.exe to verify installation

### 2. Prepare Your Samples
- Have your audio samples ready (WAV, AIFF, FLAC)
- Organize them in folders by instrument/type
- Recommended: 44.1kHz or 48kHz sample rate

---

## 🚀 Step-by-Step Integration

### Phase 1: Export from Design Tool

1. **Open your design** in the Design page (http://localhost:5173/design)
   - Load the Wooden Studio template or your custom design
   - Customize colors, backgrounds, and widget positions
   - Test all controls work as expected

2. **Click "Export for HISE"** button in the toolbar
   - This downloads 2 files:
     - `YourDesign-hise-manifest.json` - UI structure data
     - `YourDesign-hise-interface.js` - HISE interface script

3. **Save both files** to a dedicated project folder:
   ```
   C:\HISE Projects\MyPlugin\
     ├── MyPlugin-hise-manifest.json
     ├── MyPlugin-hise-interface.js
     └── Samples\
         ├── Piano\
         ├── Strings\
         └── ...
   ```

---

### Phase 2: Create HISE Project

1. **Launch HISE**
   - Open HISE.exe
   - Go to `File → New Project`

2. **Configure Project**
   - Project Name: `MyPlugin`
   - Company: Your company name
   - Version: `1.0.0`
   - Project Type: Select **Instrument** (for sampler) or **Effect**
   - Click **Create**

3. **Project Structure Created**
   ```
   Documents/HISE Projects/MyPlugin/
     ├── Scripts/
     ├── Samples/
     ├── Images/
     └── XMLPresetBackups/
   ```

---

### Phase 3: Import Your UI Design

#### Method 1: Copy Interface Script (Recommended)

1. **Open the Interface Designer** in HISE
   - Go to `View → Interface Designer` or press `F4`

2. **Open the ScriptProcessor Editor**
   - In the main processor tree, find "onInit" callback
   - Right-click → "Edit onInit Callback"

3. **Paste Your Generated Script**
   - Open `YourDesign-hise-interface.js` in a text editor
   - **Copy the entire contents**
   - **Paste into HISE's onInit callback editor**
   - The script contains:
     ```javascript
     // Auto-generated HISE Interface by AI VST Sample Designer
     // Date: 2025-10-21T...
     
     // Set interface size
     Content.setWidth(1204);
     Content.setHeight(1064);
     
     // Create controls
     const var Cutoff_1 = Content.addKnob("Cutoff", 32, 148);
     Cutoff_1.setRange(20, 20000, 1);
     Cutoff_1.setValue(2000);
     Cutoff_1.setPosition(32, 148, 80, 80);
     
     const var Resonance_2 = Content.addKnob("Resonance", 128, 148);
     // ... etc
     ```

4. **Compile the Script**
   - Click **Compile** button (or press F5)
   - Your UI should now appear in the Interface Designer!
   - All knobs, faders, buttons, labels should be visible

#### Method 2: Manual Import (If Script Doesn't Work)

If the auto-generated script has issues, use the manifest JSON to recreate manually:

1. Open `YourDesign-hise-manifest.json`
2. Look at the `widgets` array
3. For each widget, manually add in HISE:
   - **Knob**: Right-click Interface → Add Component → Knob
   - **Slider**: Right-click → Add Component → Slider (set style to LinearVertical)
   - **Button**: Right-click → Add Component → Button
   - Set position, range, label from JSON values

---

### Phase 4: Add Sample Mappings

Now you have the UI, but no sound yet. Time to connect samples:

1. **Add Sampler Module**
   - In the main processor tree (left panel)
   - Right-click on "Master Chain"
   - Select `Add → Sampler`
   - Name it (e.g., "MainSampler")

2. **Load Samples**
   - Right-click on your Sampler module
   - Select `Show Sample Map Editor`
   - Drag & drop your WAV files into the sample map
   - HISE will automatically map them across the keyboard

3. **Configure Zones** (Optional)
   - Set velocity ranges for dynamics
   - Set root notes for proper pitch
   - Add round-robin samples for realism

4. **Save Sample Map**
   - Go to `File → Save Sample Map As...`
   - Name it (e.g., "Piano_Map")

---

### Phase 5: Connect UI to Parameters

This is where you bind your knobs/faders to actual audio parameters:

#### Example: Connect Cutoff Knob to Filter

1. **Add a Filter Module**
   - Right-click on Sampler (or Master Chain)
   - `Add → Effects → Filters → State Variable Filter`

2. **Create Parameter Binding in Script**
   - Go back to your onInit callback
   - After the control definitions, add:
   ```javascript
   // Get references to modules
   const var MainSampler = Synth.getChildSynth("MainSampler");
   const var Filter = MainSampler.getEffect("State Variable Filter");
   
   // Bind Cutoff knob to filter frequency
   inline function onCutoff_1Control(component, value) {
       Filter.setAttribute(Filter.Frequency, value);
   }
   Cutoff_1.setControlCallback(onCutoff_1Control);
   
   // Bind Resonance knob to filter Q
   inline function onResonance_2Control(component, value) {
       Filter.setAttribute(Filter.Q, value);
   }
   Resonance_2.setControlCallback(onResonance_2Control);
   ```

3. **Common Bindings**

   **Volume Fader → Gain:**
   ```javascript
   const var Gain = Synth.getModulator("GainModulator");
   inline function onVolume_Control(component, value) {
       Gain.setAttribute(Gain.Gain, value);
   }
   Volume.setControlCallback(onVolume_Control);
   ```

   **Attack Knob → Envelope:**
   ```javascript
   const var Envelope = MainSampler.getModulator("SimpleEnvelope");
   inline function onAttack_Control(component, value) {
       Envelope.setAttribute(Envelope.Attack, value);
   }
   Attack.setControlCallback(onAttack_Control);
   ```

   **Reverb Mix → Reverb Effect:**
   ```javascript
   const var Reverb = Synth.getEffect("Reverb");
   inline function onReverbMix_Control(component, value) {
       Reverb.setAttribute(Reverb.WetLevel, value);
   }
   ReverbMix.setControlCallback(onReverbMix_Control);
   ```

4. **Test Your Bindings**
   - Click **Compile** to update
   - Move your knobs and verify the sound changes
   - Adjust ranges if needed (min/max values)

---

### Phase 6: Styling & Polish in HISE

#### 1. Apply Wood Background
- Your exported design has wooden backgrounds
- To use in HISE:
  1. Export background as PNG from browser (screenshot)
  2. Save to `Documents/HISE Projects/MyPlugin/Images/background.png`
  3. In HISE script:
     ```javascript
     // Set background image
     const var Panel = Content.addPanel("Background", 0, 0);
     Panel.setPosition(0, 0, 1204, 1064);
     Panel.loadImage("{PROJECT_FOLDER}background.png", "filmstrip");
     Panel.set("allowCallbacks", "No Callbacks");
     Panel.set("saveInPreset", false);
     ```

#### 2. Customize Knob/Slider Filmstrips
- HISE uses filmstrip images for controls
- To match your brass/cream aesthetic:
  1. Create PNG filmstrips (vertical stack of frames)
  2. Save to `Images/` folder
  3. Apply in script:
     ```javascript
     Cutoff_1.loadImage("{PROJECT_FOLDER}knob_brass.png", "knob");
     ```

#### 3. Add Fonts & Colors
- Set colors to match your theme:
  ```javascript
  Cutoff_1.set("textColour", 0xFFFFFFFF);  // White text
  Cutoff_1.set("bgColour", 0xFF2A1C11);    // Dark brown background
  ```

---

### Phase 7: Export VST/Standalone

1. **Set Export Options**
   - Go to `File → Export → Export as VST/AU/AAX`
   - Choose target formats:
     - ☑ VST3 (Windows/Mac)
     - ☑ Standalone (EXE/APP)
     - ☐ AU (Mac only)
     - ☐ AAX (Pro Tools, requires iLok)

2. **Configure Build Settings**
   - **Plugin Name**: Display name in DAW
   - **Plugin Code**: Unique 4-character ID (e.g., "Mbla")
   - **Manufacturer Code**: Your company code (e.g., "MyAu")
   - **Version**: 1.0.0
   - **Icon**: Optional PNG for installer

3. **Compile**
   - Click **Export**
   - Wait for compilation (2-10 minutes)
   - Output location: `Documents/HISE Projects/MyPlugin/Binaries/`

4. **Test Your Plugin**
   - Copy VST3 to: `C:\Program Files\Common Files\VST3\`
   - Open your DAW (Ableton, FL Studio, etc.)
   - Scan for new plugins
   - Load your plugin and test!

---

## 🎹 Wooden Studio Template → HISE Example

Let's walk through the specific Wooden Studio template you created:

### Your Template Has:
- **Master Section**: Volume fader, meter, preset selector
- **Filter Section**: Cutoff, Resonance, Filter Type
- **Envelope Section**: Attack, Decay, Sustain, Release
- **Effects Section**: Delay Time, Delay Mix, Reverb Mix, Limiter
- **Performance**: Pitch wheel, Mod wheel, Sustain, Keyboard

### HISE Setup for This:

1. **Add Modules**:
   ```
   Master Chain
     ├── MainSampler (Sampler)
     │   ├── Simple Envelope (ADSR)
     │   └── State Variable Filter
     ├── Simple Gain (Gain control)
     ├── Delay (Delay effect)
     ├── Reverb (Convolution or SimpleReverb)
     └── Simple Limiter
   ```

2. **Binding Script** (after your auto-generated controls):
   ```javascript
   // Get module references
   const var Sampler = Synth.getChildSynth("MainSampler");
   const var Filter = Sampler.getEffect("State Variable Filter");
   const var Envelope = Sampler.getModulator("Simple Envelope");
   const var Gain = Synth.getModulator("Simple Gain");
   const var Delay = Synth.getEffect("Delay");
   const var Reverb = Synth.getEffect("Reverb");
   const var Limiter = Synth.getEffect("Simple Limiter");

   // Master Volume (assuming your fader is MasterVol_1)
   inline function onMasterVol_1Control(component, value) {
       Gain.setAttribute(Gain.Gain, value);
   }
   MasterVol_1.setControlCallback(onMasterVol_1Control);

   // Filter
   inline function onCutoff_3Control(component, value) {
       Filter.setAttribute(Filter.Frequency, value);
   }
   Cutoff_3.setControlCallback(onCutoff_3Control);

   inline function onResonance_4Control(component, value) {
       Filter.setAttribute(Filter.Q, value);
   }
   Resonance_4.setControlCallback(onResonance_4Control);

   // Envelope
   inline function onAttack_7Control(component, value) {
       Envelope.setAttribute(Envelope.Attack, value);
   }
   Attack_7.setControlCallback(onAttack_7Control);

   inline function onDecay_8Control(component, value) {
       Envelope.setAttribute(Envelope.Decay, value);
   }
   Decay_8.setControlCallback(onDecay_8Control);

   inline function onSustain_9Control(component, value) {
       Envelope.setAttribute(Envelope.Sustain, value);
   }
   Sustain_9.setControlCallback(onSustain_9Control);

   inline function onRelease_10Control(component, value) {
       Envelope.setAttribute(Envelope.Release, value);
   }
   Release_10.setControlCallback(onRelease_10Control);

   // Delay
   inline function onDelayTime_11Control(component, value) {
       Delay.setAttribute(Delay.DelayTime, value);
   }
   DelayTime_11.setControlCallback(onDelayTime_11Control);

   inline function onDelayMix_12Control(component, value) {
       Delay.setAttribute(Delay.Mix, value);
   }
   DelayMix_12.setControlCallback(onDelayMix_12Control);

   // Reverb
   inline function onReverbMix_13Control(component, value) {
       Reverb.setAttribute(Reverb.WetLevel, value);
   }
   ReverbMix_13.setControlCallback(onReverbMix_13Control);

   // Limiter
   inline function onLimiter_14Control(component, value) {
       Limiter.setAttribute(Limiter.Limiter, value ? 1 : 0);
   }
   Limiter_14.setControlCallback(onLimiter_14Control);
   ```

---

## 🔧 Troubleshooting

### Issue: "Content not defined"
- **Cause**: Running script outside onInit callback
- **Fix**: Make sure all Content. calls are in the onInit function

### Issue: Controls appear but don't work
- **Cause**: Missing setControlCallback bindings
- **Fix**: Add inline functions to bind controls to parameters (see Phase 5)

### Issue: "Cannot find module MainSampler"
- **Cause**: Module name mismatch
- **Fix**: Check exact module name in HISE's module tree (case-sensitive)

### Issue: Wooden background looks pixelated
- **Cause**: Low-resolution screenshot
- **Fix**: Export background at 2x or 3x resolution from browser

### Issue: Knobs have wrong range in HISE
- **Cause**: Min/max values don't match audio parameter ranges
- **Fix**: Adjust setRange() values in script or use value mapping:
  ```javascript
  inline function onCutoff_Control(component, value) {
      // Map 0-1 to 20-20000 Hz (logarithmic)
      var freq = 20 * Math.pow(1000, value);
      Filter.setAttribute(Filter.Frequency, freq);
  }
  ```

---

## 📚 Additional Resources

### HISE Documentation
- Official Docs: https://docs.hise.audio/
- Scripting API: https://docs.hise.audio/scripting/scripting-api/
- Forum: https://forum.hise.audio/

### YouTube Tutorials
- "HISE Sampler Tutorial" by David Healey
- "Create a VST in HISE" series

### Example Projects
- HISE comes with example projects in `Samples/Tutorial Projects`
- Study how they structure modules and bindings

---

## 🎉 Quick Start Checklist

- [ ] Install HISE
- [ ] Export design from tool (2 files)
- [ ] Create new HISE project
- [ ] Paste interface script into onInit
- [ ] Compile script - UI appears
- [ ] Add Sampler module
- [ ] Load your audio samples
- [ ] Add effects (Filter, Reverb, etc.)
- [ ] Write control bindings (setControlCallback)
- [ ] Test all knobs/faders work
- [ ] Apply wooden background image
- [ ] Export as VST3/Standalone
- [ ] Test in your DAW

---

## 💡 Pro Tips

1. **Version Control**: Save your HISE project folder to Git
2. **Backup Samples**: Keep original samples separate from HISE project
3. **Test Early**: Compile VST frequently to catch issues early
4. **Start Simple**: Get basic sound working before adding complex effects
5. **Use Presets**: Save different configurations as XML presets in HISE
6. **Optimize**: Use sample streaming for large libraries (RR groups, velocity layers)
7. **Add Logo**: Put your logo PNG in Interface Designer for branding

---

## 🚨 Important Notes

- **Control Names**: The auto-generated script uses names like `Cutoff_1`, `Cutoff_2` based on widget order. Note these names for bindings.
- **Sample Licensing**: Ensure you have rights to distribute any samples you include
- **Code Signing**: For commercial distribution, you'll need to code-sign your VST (Windows: Authenticode, Mac: Apple Developer)
- **Testing**: Test on multiple systems before release (different Windows versions, DAWs)

---

Need help? Check the exported `YourDesign-hise-interface.js` - it shows all control names and their initial values!

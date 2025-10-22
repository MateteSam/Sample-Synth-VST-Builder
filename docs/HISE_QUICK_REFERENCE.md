# HISE Quick Reference - Parameter Binding

## 🎛️ Common HISE Module Attributes

### Sampler
```javascript
const var Sampler = Synth.getChildSynth("MainSampler");

// Parameters
Sampler.Volume       // -100 to 0 dB
Sampler.Pan          // -100 (L) to 100 (R)
Sampler.Voice        // Polyphony (1-256)
Sampler.RRGroup      // Round-robin group
```

### Simple Envelope (ADSR)
```javascript
const var Envelope = Sampler.getModulator("Simple Envelope");

// Time in milliseconds
Envelope.Attack      // 0 to 20000 ms
Envelope.AttackLevel // 0 to 1
Envelope.Hold        // 0 to 20000 ms
Envelope.Decay       // 0 to 20000 ms
Envelope.Sustain     // 0 to 1
Envelope.Release     // 0 to 20000 ms
```

### State Variable Filter
```javascript
const var Filter = Sampler.getEffect("State Variable Filter");

Filter.Frequency     // 20 to 20000 Hz
Filter.Q             // 0.3 to 8.0 (resonance)
Filter.Gain          // -24 to 24 dB
Filter.Mode          // 0=LP, 1=HP, 2=BP
```

### Delay
```javascript
const var Delay = Synth.getEffect("Delay");

Delay.DelayTime      // 0 to 20000 ms (or sync to tempo)
Delay.Feedback       // 0 to 1
Delay.Mix            // 0 to 1 (dry/wet)
Delay.TempoSync      // 0 or 1 (on/off)
```

### Reverb
```javascript
const var Reverb = Synth.getEffect("Reverb");

// SimpleReverb
Reverb.Damping       // 0 to 1
Reverb.RoomSize      // 0 to 1
Reverb.Width         // 0 to 1
Reverb.WetLevel      // 0 to 1

// Convolution Reverb
Reverb.DryGain       // -100 to 0 dB
Reverb.WetGain       // -100 to 0 dB
Reverb.Damping       // 0 to 1
```

### Simple Gain
```javascript
const var Gain = Synth.getModulator("Simple Gain");

Gain.Gain            // -100 to 0 dB
Gain.Smoothing       // 0 to 2000 ms
Gain.UseTable        // 0 or 1
```

### Limiter
```javascript
const var Limiter = Synth.getEffect("Simple Limiter");

Limiter.Limiter      // 0 (off) or 1 (on)
Limiter.Threshold    // -60 to 0 dB
Limiter.Release      // 1 to 1000 ms
```

---

## 🔌 Control Binding Template

### Knob → Parameter
```javascript
// 1. Get module reference
const var Filter = Sampler.getEffect("State Variable Filter");

// 2. Create callback function
inline function onCutoff_1Control(component, value) {
    Filter.setAttribute(Filter.Frequency, value);
}

// 3. Attach callback to control
Cutoff_1.setControlCallback(onCutoff_1Control);
```

### Knob with Value Mapping (Linear to Log)
```javascript
inline function onCutoff_1Control(component, value) {
    // Map 0-1 to 20-20000 Hz logarithmically
    var freq = 20 * Math.pow(1000, value);
    Filter.setAttribute(Filter.Frequency, freq);
}
Cutoff_1.setControlCallback(onCutoff_1Control);
```

### Fader → Volume (dB conversion)
```javascript
inline function onVolume_1Control(component, value) {
    // Convert 0-1 to -100dB to 0dB
    var db = (value * 100) - 100;
    Gain.setAttribute(Gain.Gain, db);
}
Volume_1.setControlCallback(onVolume_1Control);
```

### Toggle Button → On/Off
```javascript
inline function onLimiter_1Control(component, value) {
    Limiter.setAttribute(Limiter.Limiter, value);
}
Limiter_1.setControlCallback(onLimiter_1Control);
```

### ComboBox → Filter Mode
```javascript
inline function onFilterType_1Control(component, value) {
    // value = selected index (0, 1, 2, ...)
    Filter.setAttribute(Filter.Mode, value);
}
FilterType_1.setControlCallback(onFilterType_1Control);
```

### Preset Selector
```javascript
// Store preset data
const var presets = [
    {name: "Bright", cutoff: 8000, res: 0.5},
    {name: "Dark", cutoff: 500, res: 0.3},
    {name: "Resonant", cutoff: 2000, res: 0.9}
];

inline function onPresetSelector_1Control(component, value) {
    var preset = presets[value];
    Filter.setAttribute(Filter.Frequency, preset.cutoff);
    Filter.setAttribute(Filter.Q, preset.res);
    
    // Update UI
    Cutoff_1.setValue(preset.cutoff);
    Resonance_2.setValue(preset.res);
}
PresetSelector_1.setControlCallback(onPresetSelector_1Control);
```

---

## 🎨 UI Styling in HISE

### Set Control Properties
```javascript
// Colors (0xAARRGGBB format)
Cutoff_1.set("textColour", 0xFFFFFFFF);      // White
Cutoff_1.set("bgColour", 0xFF2A1C11);        // Dark brown
Cutoff_1.set("itemColour", 0xFFB8860B);      // Brass gold

// Font
Cutoff_1.set("fontSize", 14);
Cutoff_1.set("fontName", "Arial Bold");

// Visibility
Cutoff_1.set("visible", true);
Cutoff_1.set("enabled", true);

// Tooltip
Cutoff_1.set("tooltip", "Adjust filter cutoff frequency");
```

### Load Images (Filmstrips)
```javascript
// Knob filmstrip (100 frames, vertical)
Cutoff_1.loadImage("{PROJECT_FOLDER}knob_brass.png", "filmstrip");
Cutoff_1.set("filmstripAmount", 100);

// Slider filmstrip
Volume_1.loadImage("{PROJECT_FOLDER}fader_brass.png", "filmstrip");

// Background panel
const var BgPanel = Content.addPanel("Background", 0, 0);
BgPanel.loadImage("{PROJECT_FOLDER}background_wood.png", "filmstrip");
BgPanel.setPosition(0, 0, 1204, 1064);
```

---

## 🔊 Common Value Conversions

### Linear to Logarithmic (Frequency)
```javascript
// 0-1 → 20-20000 Hz
var freq = 20 * Math.pow(1000, value);

// 0-1 → 100-10000 Hz
var freq = 100 * Math.pow(100, value);
```

### Linear to Decibels
```javascript
// 0-1 → -60dB to 0dB
var db = (value * 60) - 60;

// 0-1 → -100dB to 0dB
var db = (value * 100) - 100;

// 0-1 → -inf to 0dB (with cutoff at -60dB)
var db = value > 0 ? (20 * Math.log10(value)) : -100;
```

### Milliseconds to Seconds
```javascript
// 0-5000ms knob → 0-5 seconds for display
var seconds = value / 1000;
Label.set("text", seconds.toFixed(2) + "s");
```

### Tempo Sync
```javascript
// Convert delay time to note divisions
const var tempoSync = [
    {name: "1/32", value: 0.03125},
    {name: "1/16", value: 0.0625},
    {name: "1/8", value: 0.125},
    {name: "1/4", value: 0.25},
    {name: "1/2", value: 0.5},
    {name: "1/1", value: 1.0}
];
```

---

## 📝 Complete Wooden Studio Template Binding Example

```javascript
// Auto-generated controls are above this...

// ==================== MODULE REFERENCES ====================
const var Sampler = Synth.getChildSynth("MainSampler");
const var Filter = Sampler.getEffect("State Variable Filter");
const var Envelope = Sampler.getModulator("Simple Envelope");
const var Gain = Synth.getModulator("Simple Gain");
const var Delay = Synth.getEffect("Delay");
const var Reverb = Synth.getEffect("Reverb");
const var Limiter = Synth.getEffect("Simple Limiter");

// ==================== MASTER SECTION ====================
inline function onMasterVolume_1Control(component, value) {
    var db = (value * 100) - 100;  // 0-1 → -100dB to 0dB
    Gain.setAttribute(Gain.Gain, db);
}
MasterVolume_1.setControlCallback(onMasterVolume_1Control);

// ==================== FILTER SECTION ====================
inline function onCutoff_3Control(component, value) {
    var freq = 20 * Math.pow(1000, value);  // Log scale
    Filter.setAttribute(Filter.Frequency, freq);
}
Cutoff_3.setControlCallback(onCutoff_3Control);

inline function onResonance_4Control(component, value) {
    var q = 0.3 + (value * 7.7);  // 0.3 to 8.0
    Filter.setAttribute(Filter.Q, q);
}
Resonance_4.setControlCallback(onResonance_4Control);

inline function onFilterType_5Control(component, value) {
    Filter.setAttribute(Filter.Mode, value);  // 0=LP, 1=HP, 2=BP
}
FilterType_5.setControlCallback(onFilterType_5Control);

// ==================== ENVELOPE SECTION ====================
inline function onAttack_7Control(component, value) {
    var ms = value * 5000;  // 0-5 seconds
    Envelope.setAttribute(Envelope.Attack, ms);
}
Attack_7.setControlCallback(onAttack_7Control);

inline function onDecay_8Control(component, value) {
    var ms = value * 5000;
    Envelope.setAttribute(Envelope.Decay, ms);
}
Decay_8.setControlCallback(onDecay_8Control);

inline function onSustain_9Control(component, value) {
    Envelope.setAttribute(Envelope.Sustain, value);  // 0-1
}
Sustain_9.setControlCallback(onSustain_9Control);

inline function onRelease_10Control(component, value) {
    var ms = value * 10000;  // 0-10 seconds
    Envelope.setAttribute(Envelope.Release, ms);
}
Release_10.setControlCallback(onRelease_10Control);

// ==================== EFFECTS SECTION ====================
inline function onDelayTime_11Control(component, value) {
    var ms = value * 2000;  // 0-2 seconds
    Delay.setAttribute(Delay.DelayTime, ms);
}
DelayTime_11.setControlCallback(onDelayTime_11Control);

inline function onDelayMix_12Control(component, value) {
    Delay.setAttribute(Delay.Mix, value);
}
DelayMix_12.setControlCallback(onDelayMix_12Control);

inline function onReverbMix_13Control(component, value) {
    Reverb.setAttribute(Reverb.WetLevel, value);
}
ReverbMix_13.setControlCallback(onReverbMix_13Control);

inline function onLimiter_14Control(component, value) {
    Limiter.setAttribute(Limiter.Limiter, value);
}
Limiter_14.setControlCallback(onLimiter_14Control);

// ==================== PERFORMANCE SECTION ====================
// Pitch/Mod wheels are handled automatically by HISE
// Sustain/Sostenuto buttons work via MIDI CC by default
```

---

## 🐛 Debug Helper Functions

### Print All Module Names
```javascript
// Find exact module names
const var modules = Synth.getNumChildSynths();
for (i = 0; i < modules; i++) {
    Console.print(Synth.getChildSynth(i).getId());
}
```

### Print All Effect Names
```javascript
// Find exact effect names
const var effects = Sampler.getNumChildSynths();
for (i = 0; i < effects; i++) {
    Console.print(Sampler.getEffect(i).getId());
}
```

### Monitor Control Values
```javascript
inline function onCutoff_1Control(component, value) {
    Console.print("Cutoff value: " + value);
    Filter.setAttribute(Filter.Frequency, value);
}
```

---

## 🎯 Must-Know HISE Shortcuts

| Action | Shortcut |
|--------|----------|
| Compile Script | `F5` |
| Interface Designer | `F4` |
| Add Module | Right-click processor |
| Undo | `Ctrl+Z` |
| Save Project | `Ctrl+S` |
| Play MIDI Preview | Spacebar |
| Toggle Bypass | Click module icon |
| Copy Module | `Ctrl+C` → `Ctrl+V` |

---

## 📦 File Paths in HISE

```javascript
// Project folder
"{PROJECT_FOLDER}background.png"

// Samples folder
"{PROJECT_FOLDER}Samples/Piano/C3.wav"

// Absolute path
"C:/HISE Projects/MyPlugin/Images/logo.png"

// User presets
"{USER_PRESETS}MyPreset.xml"
```

---

## ✅ Pre-Export Checklist

- [ ] All controls have bindings (no orphan knobs)
- [ ] Test all parameter ranges (min/max)
- [ ] Verify sample maps load correctly
- [ ] Test MIDI input (keyboard, CC)
- [ ] Check CPU usage (optimize if >20%)
- [ ] Save default preset state
- [ ] Add tooltips for complex controls
- [ ] Test automation in DAW
- [ ] Verify preset recall works
- [ ] Check memory usage with large samples

---

**Tip**: Keep this reference open while binding your controls in HISE!

/**
 * HISE Binding Template Generator
 * 
 * This file helps you quickly create control bindings for your exported UI.
 * 
 * INSTRUCTIONS:
 * 1. Open your exported `*-hise-interface.js` file
 * 2. Note the control variable names (e.g., Cutoff_1, Volume_2, etc.)
 * 3. Copy this template into your HISE onInit callback AFTER the generated controls
 * 4. Customize the module names and bindings below
 * 5. Uncomment the sections you need
 * 6. Delete sections you don't use
 */

// ==================== MODULE SETUP ====================
// Replace these with your actual module names from HISE

const var MainSampler = Synth.getChildSynth("MainSampler");

// Effects (add/remove as needed)
// const var Filter = MainSampler.getEffect("State Variable Filter");
// const var Reverb = Synth.getEffect("Reverb");
// const var Delay = Synth.getEffect("Delay");
// const var Chorus = Synth.getEffect("Chorus");
// const var Phaser = Synth.getEffect("Phaser");
// const var Distortion = Synth.getEffect("Distortion");
// const var Limiter = Synth.getEffect("Simple Limiter");

// Modulators (add/remove as needed)
// const var Envelope = MainSampler.getModulator("Simple Envelope");
// const var LFO = MainSampler.getModulator("LFO Modulator");
// const var Gain = Synth.getModulator("Simple Gain");

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert linear 0-1 to logarithmic frequency (20-20000 Hz)
 */
function linearToLogFreq(value, min, max) {
    min = min || 20;
    max = max || 20000;
    var range = Math.log(max / min);
    return min * Math.exp(range * value);
}

/**
 * Convert linear 0-1 to decibels
 */
function linearToDb(value, minDb, maxDb) {
    minDb = minDb || -100;
    maxDb = maxDb || 0;
    return minDb + (value * (maxDb - minDb));
}

/**
 * Convert linear 0-1 to milliseconds
 */
function linearToMs(value, maxMs) {
    maxMs = maxMs || 1000;
    return value * maxMs;
}

// ==================== MASTER CONTROLS ====================

// Volume Fader
// Replace 'MasterVolume_1' with your actual control name
/*
inline function onMasterVolume_1Control(component, value) {
    var db = linearToDb(value, -60, 0);
    Gain.setAttribute(Gain.Gain, db);
}
MasterVolume_1.setControlCallback(onMasterVolume_1Control);
*/

// Master Pan
/*
inline function onMasterPan_1Control(component, value) {
    var pan = (value * 200) - 100;  // -100 to 100
    MainSampler.setAttribute(MainSampler.Pan, pan);
}
MasterPan_1.setControlCallback(onMasterPan_1Control);
*/

// ==================== FILTER CONTROLS ====================

// Cutoff Knob
/*
inline function onCutoff_1Control(component, value) {
    var freq = linearToLogFreq(value, 20, 20000);
    Filter.setAttribute(Filter.Frequency, freq);
}
Cutoff_1.setControlCallback(onCutoff_1Control);
*/

// Resonance Knob
/*
inline function onResonance_1Control(component, value) {
    var q = 0.3 + (value * 7.7);  // 0.3 to 8.0
    Filter.setAttribute(Filter.Q, q);
}
Resonance_1.setControlCallback(onResonance_1Control);
*/

// Filter Type Selector
/*
inline function onFilterType_1Control(component, value) {
    // 0 = Low Pass, 1 = High Pass, 2 = Band Pass
    Filter.setAttribute(Filter.Mode, value);
}
FilterType_1.setControlCallback(onFilterType_1Control);
*/

// Filter Gain (for peak/shelf filters)
/*
inline function onFilterGain_1Control(component, value) {
    var gain = (value * 48) - 24;  // -24dB to +24dB
    Filter.setAttribute(Filter.Gain, gain);
}
FilterGain_1.setControlCallback(onFilterGain_1Control);
*/

// ==================== ENVELOPE CONTROLS (ADSR) ====================

// Attack
/*
inline function onAttack_1Control(component, value) {
    var ms = linearToMs(value, 5000);  // 0 to 5 seconds
    Envelope.setAttribute(Envelope.Attack, ms);
}
Attack_1.setControlCallback(onAttack_1Control);
*/

// Decay
/*
inline function onDecay_1Control(component, value) {
    var ms = linearToMs(value, 5000);
    Envelope.setAttribute(Envelope.Decay, ms);
}
Decay_1.setControlCallback(onDecay_1Control);
*/

// Sustain
/*
inline function onSustain_1Control(component, value) {
    Envelope.setAttribute(Envelope.Sustain, value);  // 0 to 1
}
Sustain_1.setControlCallback(onSustain_1Control);
*/

// Release
/*
inline function onRelease_1Control(component, value) {
    var ms = linearToMs(value, 10000);  // 0 to 10 seconds
    Envelope.setAttribute(Envelope.Release, ms);
}
Release_1.setControlCallback(onRelease_1Control);
*/

// ==================== LFO CONTROLS ====================

// LFO Rate
/*
inline function onLFORate_1Control(component, value) {
    var hz = value * 20;  // 0 to 20 Hz
    LFO.setAttribute(LFO.Frequency, hz);
}
LFORate_1.setControlCallback(onLFORate_1Control);
*/

// LFO Amount/Depth
/*
inline function onLFOAmount_1Control(component, value) {
    LFO.setAttribute(LFO.FadeTime, value);
}
LFOAmount_1.setControlCallback(onLFOAmount_1Control);
*/

// LFO Waveform
/*
inline function onLFOWave_1Control(component, value) {
    // 0=Sine, 1=Triangle, 2=Saw, 3=Square, 4=Random
    LFO.setAttribute(LFO.WaveFormType, value);
}
LFOWave_1.setControlCallback(onLFOWave_1Control);
*/

// ==================== DELAY CONTROLS ====================

// Delay Time
/*
inline function onDelayTime_1Control(component, value) {
    var ms = linearToMs(value, 2000);  // 0 to 2 seconds
    Delay.setAttribute(Delay.DelayTime, ms);
}
DelayTime_1.setControlCallback(onDelayTime_1Control);
*/

// Delay Feedback
/*
inline function onDelayFeedback_1Control(component, value) {
    Delay.setAttribute(Delay.Feedback, value);  // 0 to 1
}
DelayFeedback_1.setControlCallback(onDelayFeedback_1Control);
*/

// Delay Mix (Dry/Wet)
/*
inline function onDelayMix_1Control(component, value) {
    Delay.setAttribute(Delay.Mix, value);
}
DelayMix_1.setControlCallback(onDelayMix_1Control);
*/

// Delay Tempo Sync Toggle
/*
inline function onDelaySync_1Control(component, value) {
    Delay.setAttribute(Delay.TempoSync, value);
}
DelaySync_1.setControlCallback(onDelaySync_1Control);
*/

// ==================== REVERB CONTROLS ====================

// Reverb Mix
/*
inline function onReverbMix_1Control(component, value) {
    Reverb.setAttribute(Reverb.WetLevel, value);
}
ReverbMix_1.setControlCallback(onReverbMix_1Control);
*/

// Reverb Room Size
/*
inline function onReverbSize_1Control(component, value) {
    Reverb.setAttribute(Reverb.RoomSize, value);
}
ReverbSize_1.setControlCallback(onReverbSize_1Control);
*/

// Reverb Damping
/*
inline function onReverbDamping_1Control(component, value) {
    Reverb.setAttribute(Reverb.Damping, value);
}
ReverbDamping_1.setControlCallback(onReverbDamping_1Control);
*/

// Reverb Width/Stereo
/*
inline function onReverbWidth_1Control(component, value) {
    Reverb.setAttribute(Reverb.Width, value);
}
ReverbWidth_1.setControlCallback(onReverbWidth_1Control);
*/

// ==================== CHORUS CONTROLS ====================

// Chorus Rate
/*
inline function onChorusRate_1Control(component, value) {
    var hz = value * 10;
    Chorus.setAttribute(Chorus.Rate, hz);
}
ChorusRate_1.setControlCallback(onChorusRate_1Control);
*/

// Chorus Depth
/*
inline function onChorusDepth_1Control(component, value) {
    Chorus.setAttribute(Chorus.Depth, value);
}
ChorusDepth_1.setControlCallback(onChorusDepth_1Control);
*/

// Chorus Mix
/*
inline function onChorusMix_1Control(component, value) {
    Chorus.setAttribute(Chorus.Mix, value);
}
ChorusMix_1.setControlCallback(onChorusMix_1Control);
*/

// ==================== DISTORTION CONTROLS ====================

// Distortion Drive
/*
inline function onDrive_1Control(component, value) {
    var drive = value * 100;  // 0 to 100
    Distortion.setAttribute(Distortion.Drive, drive);
}
Drive_1.setControlCallback(onDrive_1Control);
*/

// Distortion Mix
/*
inline function onDistortionMix_1Control(component, value) {
    Distortion.setAttribute(Distortion.Mix, value);
}
DistortionMix_1.setControlCallback(onDistortionMix_1Control);
*/

// ==================== LIMITER/COMPRESSOR ====================

// Limiter On/Off
/*
inline function onLimiter_1Control(component, value) {
    Limiter.setAttribute(Limiter.Limiter, value);
}
Limiter_1.setControlCallback(onLimiter_1Control);
*/

// Limiter Threshold
/*
inline function onLimiterThreshold_1Control(component, value) {
    var db = linearToDb(value, -60, 0);
    Limiter.setAttribute(Limiter.Threshold, db);
}
LimiterThreshold_1.setControlCallback(onLimiterThreshold_1Control);
*/

// Limiter Release
/*
inline function onLimiterRelease_1Control(component, value) {
    var ms = linearToMs(value, 1000);
    Limiter.setAttribute(Limiter.Release, ms);
}
LimiterRelease_1.setControlCallback(onLimiterRelease_1Control);
*/

// ==================== SAMPLER CONTROLS ====================

// Transpose (Pitch)
/*
inline function onTranspose_1Control(component, value) {
    var semitones = Math.round((value * 24) - 12);  // -12 to +12 semitones
    MainSampler.setAttribute(MainSampler.RootNote, semitones);
}
Transpose_1.setControlCallback(onTranspose_1Control);
*/

// Voices (Polyphony)
/*
inline function onVoices_1Control(component, value) {
    var voices = Math.round(value * 255) + 1;  // 1 to 256
    MainSampler.setAttribute(MainSampler.Voice, voices);
}
Voices_1.setControlCallback(onVoices_1Control);
*/

// Sample Start Offset
/*
inline function onSampleStart_1Control(component, value) {
    var offset = Math.round(value * 10000);
    MainSampler.setAttribute(MainSampler.SampleStartMod, offset);
}
SampleStart_1.setControlCallback(onSampleStart_1Control);
*/

// ==================== PRESET MANAGEMENT ====================

// Preset Selector
/*
const var presets = [
    {name: "Default", data: {cutoff: 2000, res: 0.5, attack: 10}},
    {name: "Bright", data: {cutoff: 8000, res: 0.3, attack: 5}},
    {name: "Dark", data: {cutoff: 500, res: 0.7, attack: 50}},
    {name: "Punchy", data: {cutoff: 1500, res: 0.8, attack: 1}}
];

inline function onPresetSelector_1Control(component, value) {
    var preset = presets[value];
    
    // Apply preset values
    Filter.setAttribute(Filter.Frequency, preset.data.cutoff);
    Filter.setAttribute(Filter.Q, preset.data.res);
    Envelope.setAttribute(Envelope.Attack, preset.data.attack);
    
    // Update UI controls
    Cutoff_1.setValue(preset.data.cutoff);
    Resonance_1.setValue(preset.data.res);
    Attack_1.setValue(preset.data.attack);
    
    Console.print("Loaded preset: " + preset.name);
}
PresetSelector_1.setControlCallback(onPresetSelector_1Control);
*/

// ==================== CUSTOM LOGIC ====================

// Complex parameter mapping example
/*
inline function onComplexControl_1(component, value) {
    // Map one control to multiple parameters
    Filter.setAttribute(Filter.Frequency, value * 10000);
    Filter.setAttribute(Filter.Q, 1.0 - (value * 0.5));
    
    // Conditional logic
    if (value > 0.5) {
        Reverb.setAttribute(Reverb.WetLevel, (value - 0.5) * 2);
    } else {
        Reverb.setAttribute(Reverb.WetLevel, 0);
    }
}
ComplexControl_1.setControlCallback(onComplexControl_1);
*/

// ==================== DEBUGGING ====================

// Uncomment to print all module names to console
/*
Console.print("=== Available Modules ===");
for (i = 0; i < Synth.getNumChildSynths(); i++) {
    Console.print(Synth.getChildSynth(i).getId());
}
*/

// Uncomment to print all effect names
/*
Console.print("=== Available Effects ===");
for (i = 0; i < MainSampler.getNumChildSynths(); i++) {
    Console.print(MainSampler.getEffect(i).getId());
}
*/

// ==================== NOTES ====================

/*
 * IMPORTANT REMINDERS:
 * 
 * 1. Replace all control names (e.g., Cutoff_1) with your actual exported names
 * 2. Replace module names with your exact HISE module IDs (case-sensitive!)
 * 3. Test each binding after uncommenting
 * 4. Delete unused sections to keep code clean
 * 5. Add error handling for production:
 *    
 *    if (isDefined(Filter)) {
 *        Filter.setAttribute(Filter.Frequency, value);
 *    }
 * 
 * 6. Use Console.print() liberally during development for debugging
 * 7. Save your HISE project frequently!
 * 8. Keep a backup of this binding file outside HISE
 */

# Documentation Index

Welcome to the AI VST Sample Designer documentation!

## 📖 HISE Integration Guides

### 🎯 Start Here
**[HISE_INTEGRATION_SUMMARY.md](./HISE_INTEGRATION_SUMMARY.md)**  
Quick overview of the HISE integration workflow. Read this first!

### 📚 Complete Guide
**[HISE_INTEGRATION_GUIDE.md](./HISE_INTEGRATION_GUIDE.md)**  
In-depth step-by-step guide covering:
- Export from Design Tool
- Create HISE project
- Import UI design
- Add sample mappings
- Connect UI to parameters
- Export VST/Standalone
- Troubleshooting

**Estimated reading time**: 30 minutes  
**Estimated workflow time**: 1-2 hours (first time)

### ⚡ Quick Reference
**[HISE_QUICK_REFERENCE.md](./HISE_QUICK_REFERENCE.md)**  
Cheat sheet for HISE developers:
- All module attributes
- Binding patterns
- Value conversions
- UI styling
- Keyboard shortcuts
- Debug helpers

**Use case**: Keep this open while coding in HISE!

### 💻 Code Template
**[HISE_BINDING_TEMPLATE.js](./HISE_BINDING_TEMPLATE.js)**  
Copy-paste ready JavaScript for HISE onInit callback:
- Pre-written control bindings
- Helper functions
- Organized by module type
- Just uncomment what you need!

**Use case**: Copy into HISE, customize names, compile!

---

## 🎨 Design Tool Documentation

### 🎹 UI Design
**[DESIGN_PAGE_IMPROVEMENTS.md](./DESIGN_PAGE_IMPROVEMENTS.md)**  
Design page features and enhancements.

### ⌨️ Keyboard Features
**[DESIGN_KEYBOARD.md](./DESIGN_KEYBOARD.md)**  
Virtual MIDI keyboard integration.

**[KEYBOARD_STYLING.md](./KEYBOARD_STYLING.md)**  
Keyboard appearance and theming.

### 🎭 Page Redesigns
**[PLAY_PAGE_REDESIGN.md](./PLAY_PAGE_REDESIGN.md)**  
Play page UI improvements.

**[SEQUENCE_REDESIGN_DOCS.md](../SEQUENCE_REDESIGN_DOCS.md)**  
Sequencer interface redesign documentation.

### 🔧 Technical Docs
**[AI_DESIGN_ASSISTANT.md](./AI_DESIGN_ASSISTANT.md)**  
AI-powered design helper features.

**[LIVE_PREVIEW.md](./LIVE_PREVIEW.md)**  
Live preview functionality.

**[STATE_INTEGRATION.md](./STATE_INTEGRATION.md)**  
State management architecture.

**[UI_EXPORT_FORMAT.md](./UI_EXPORT_FORMAT.md)**  
Export format specifications.

**[VIEWPORT_FIX.md](./VIEWPORT_FIX.md)**  
Canvas viewport fixes.

**[SEQUENCER_EMBEDDING.md](./SEQUENCER_EMBEDDING.md)**  
Sequencer component embedding.

---

## 🚀 Quick Navigation

### I want to...

**→ Export my design to HISE**  
Start with [HISE_INTEGRATION_SUMMARY.md](./HISE_INTEGRATION_SUMMARY.md)

**→ Learn HISE binding syntax**  
Open [HISE_QUICK_REFERENCE.md](./HISE_QUICK_REFERENCE.md)

**→ Get code to paste into HISE**  
Copy from [HISE_BINDING_TEMPLATE.js](./HISE_BINDING_TEMPLATE.js)

**→ Understand the full workflow**  
Read [HISE_INTEGRATION_GUIDE.md](./HISE_INTEGRATION_GUIDE.md)

**→ Troubleshoot HISE issues**  
Check Troubleshooting section in [HISE_INTEGRATION_GUIDE.md](./HISE_INTEGRATION_GUIDE.md)

**→ Style my UI in the Design Tool**  
See [DESIGN_PAGE_IMPROVEMENTS.md](./DESIGN_PAGE_IMPROVEMENTS.md)

---

## 📋 Workflow Summary

```
┌─────────────────────────────────────────────────────────┐
│  1. DESIGN (Browser)                                    │
│     → Load template (Wooden Studio)                     │
│     → Customize colors, backgrounds, widgets            │
│     → Click "Export for HISE"                           │
│     → Download 2 files                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. HISE PROJECT                                        │
│     → Create new project                                │
│     → Open Interface Designer (F4)                      │
│     → Paste exported script into onInit                 │
│     → Compile (F5) → UI appears!                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. ADD AUDIO                                           │
│     → Add Sampler module                                │
│     → Load your .wav samples                            │
│     → Add effects (Filter, Reverb, etc.)                │
│     → Test sound                                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. BIND CONTROLS                                       │
│     → Copy code from HISE_BINDING_TEMPLATE.js           │
│     → Customize module/control names                    │
│     → Test each knob/fader                              │
│     → Compile & verify                                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. EXPORT VST                                          │
│     → File → Export as VST/Standalone                   │
│     → Set plugin name, version, ID                      │
│     → Click Export (wait 5-10 mins)                     │
│     → Copy to VST3 folder                               │
│     → Test in DAW!                                      │
└─────────────────────────────────────────────────────────┘
```

**Total time**: 1-2 hours (first time), 30-45 minutes (after practice)

---

## 🆘 Getting Help

### Documentation Issues
If something is unclear in these docs:
1. Check the specific guide's troubleshooting section
2. Search HISE forum: https://forum.hise.audio/
3. Ask in GitHub Issues (if applicable)

### HISE-Specific Questions
- Official docs: https://docs.hise.audio/
- Forum: https://forum.hise.audio/
- Discord: HISE Audio Community

### Design Tool Issues
- Check console for errors (F12 in browser)
- Review STATE_INTEGRATION.md for state issues
- Check UI_EXPORT_FORMAT.md for export issues

---

## 🔄 Updates

This documentation is current as of **October 2025**.

### Recent Additions
- ✅ Complete HISE integration workflow
- ✅ Wooden Studio template export
- ✅ Auto-generated HISE interface scripts
- ✅ Binding template with helper functions
- ✅ Quick reference cheat sheet

### Planned
- [ ] Video tutorials
- [ ] More template examples
- [ ] Advanced HISE techniques
- [ ] Filmstrip generator for custom knobs

---

## 📄 License

These documentation files are provided as-is for use with the AI VST Sample Designer tool.

---

*Last updated: October 21, 2025*

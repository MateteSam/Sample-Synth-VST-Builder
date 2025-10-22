# Live Preview Guide (Test Page)

## Overview
The **Test page** provides a live, interactive preview of your designed UI exactly as it will appear in the exported VST/standalone instrument. This is your validation environment before export.

---

## Preview Modes

### 🪟 Windowed Mode (Default)
Standard preview with controls and tools visible.

**Features:**
- Zoom controls (50% - 200%)
- MIDI device selector
- All widgets fully interactive
- Control panel access
- Recording controls

**Best For:**
- Testing individual widgets
- Adjusting parameters
- Debugging UI issues
- Fine-tuning interactions

### ⛶ Fullscreen Mode
Clean, immersive preview matching the exported instrument appearance.

**Features:**
- Full-screen display (no editor chrome)
- Auto-hiding overlay (disappears after 3 seconds)
- Exact export preview
- Live MIDI input
- Professional presentation mode

**Best For:**
- Final validation before export
- Client demonstrations
- Performance testing
- Exact VST/standalone preview

---

## Using Live Preview

### Switching Modes

#### Entering Fullscreen
1. Click **"⛶ Fullscreen Preview"** button (top-right in windowed mode)
2. UI fills entire screen
3. Overlay auto-hides after 3 seconds

#### Exiting Fullscreen
1. Move mouse to top of screen
2. Overlay appears
3. Click **"Exit Fullscreen"** button
4. Returns to windowed mode

### Auto-Hide Overlay
In fullscreen mode, the overlay automatically hides to show clean UI:
- **3-second delay** - Overlay fades after 3 seconds
- **Mouse hover** - Move cursor to top edge to show overlay
- **Stay visible** - Keep mouse in overlay area

---

## Interactive Features

### Live Widget Control
All widgets are fully interactive in preview mode:

**Sliders/Knobs/Faders**
- Drag to change values
- Values apply to audio engine in real-time
- Current value displayed

**Toggles/Buttons**
- Click to activate/deactivate
- Visual feedback (pressed state)
- Engine bindings update instantly

**XY Pads**
- Click and drag anywhere
- Both X and Y values update
- Thumb follows cursor

**Keyboards**
- Click keys to play notes
- Full MIDI note range
- Velocity support

**Selects**
- Dropdown menus work normally
- Changes apply to engine
- Options from Design page

**State Displays**
- Show live data from other pages
- Auto-update when state changes
- No user interaction needed

### MIDI Input
Connect external MIDI controllers for authentic testing:

**Setup:**
1. Connect MIDI controller to computer
2. Open Test page (fullscreen or windowed)
3. Mouse over top to show overlay
4. Select MIDI device from dropdown
5. Play controller - notes trigger audio engine

**Supported MIDI:**
- Note On/Off messages
- All MIDI channels (1-16)
- Velocity sensitivity
- Standard MIDI controllers

---

## Validation Workflow

### Pre-Export Checklist

✅ **Visual Verification**
- All widgets render correctly
- Positions match design
- No overlapping elements
- Images/logos load properly
- Labels are readable

✅ **Interaction Testing**
- Sliders/knobs respond smoothly
- Buttons trigger correctly
- XY pads track accurately
- Keyboard plays notes
- State displays update

✅ **Engine Bindings**
- Parameter changes affect sound
- MIDI input works
- Velocity curve active
- Envelope responds
- Effects apply

✅ **Performance**
- UI runs smoothly
- No lag on interaction
- Audio doesn't glitch
- Meters update in real-time

### Common Issues

#### Widgets Not Responding
**Problem:** Click widget but nothing happens  
**Solution:** 
- Check binding is set in Design page
- Verify widget is not locked
- Ensure manifest is saved

#### MIDI Not Working
**Problem:** MIDI controller doesn't trigger notes  
**Solution:**
- Check MIDI device is selected in dropdown
- Verify controller is USB-connected
- Browser may need MIDI permissions
- Try Chrome/Edge (best MIDI support)

#### Layout Different Than Design
**Problem:** Widgets in wrong positions  
**Solution:**
- Check canvas size in Design page
- Verify widget coordinates (X, Y)
- Ensure zoom is 100% in windowed mode
- Fullscreen centers content

#### State Displays Show "—"
**Problem:** State widgets don't show data  
**Solution:**
- Check state binding is selected
- Verify source page has data (e.g., instrument selected)
- Ensure manifest is updated
- Refresh page if stale

---

## Keyboard Shortcuts

**Fullscreen Mode:**
- **Hover Top** - Show overlay
- **Esc** - Exit fullscreen (browser default)

**Windowed Mode:**
- **Number Keys (1-6)** - Switch pages (global)
- **Mouse Wheel** - Scroll canvas if larger than viewport
- **Drag Zoom Slider** - Adjust preview size

---

## Technical Details

### Widget Rendering
Widgets render using the same component code as Design page:
```
manifest.ui.bindings (widget array)
    ↓
orderedWidgets (sorted by bindingOrder)
    ↓
Rendered by type (slider, knob, toggle, etc.)
    ↓
Interactive with live engine bindings
```

### Engine Integration
Changes in preview apply to audio engine immediately:
- **Numeric bindings** → `setMasterGain()`, `setFilterCutoff()`, etc.
- **Boolean bindings** → `setSustain()`, `setLimiter()`, etc.
- **Enum bindings** → `setFilterType()`, `setVelocityCurve()`, etc.

### State Updates
State Display widgets read from manifest:
- `manifest.ui.selectedInstrument` - Play page
- `manifest.ui.currentArticulations` - Map page
- `manifest.sequence.bpm` - Sequence page

Updates propagate automatically via React state.

### Canvas Bounds
Preview canvas auto-sizes to fit all widgets:
```javascript
// Computes max right/bottom edges
bounds = { 
  width: max(widget.x + widget.w) + 16, 
  height: max(widget.y + widget.h) + 16 
}
```

Minimum: 800×400px  
Maximum: Based on widget positions

---

## Best Practices

### 1. **Test Early, Test Often**
Don't wait until design is complete:
- Test widgets as you add them
- Verify bindings immediately
- Catch layout issues early

### 2. **Use Fullscreen for Final Validation**
Windowed mode for development, fullscreen for validation:
- Quick edits → Windowed mode
- Final check → Fullscreen mode
- Presentations → Fullscreen mode

### 3. **Connect MIDI Early**
Test with actual hardware:
- Real controllers reveal UX issues
- Velocity sensitivity testing
- Performance under load

### 4. **Check All Widget States**
Don't just test default values:
- Move sliders to extremes (min/max)
- Toggle switches on/off
- Select all dropdown options
- Test XY pad corners and center

### 5. **Validate State Displays**
Make state changes and verify updates:
- Switch instruments (Play page)
- Change articulation (Map page)
- Start/stop sequencer (Sequence page)
- Verify displays update instantly

---

## Recording (Windowed Mode Only)

### Audio Recording
Capture your performance for validation:

**Start Recording:**
1. In windowed mode, find recording controls
2. Click **"Start Recording"** button
3. Play instrument (keyboard, MIDI, widgets)
4. Sound is captured

**Stop & Download:**
1. Click **"Stop Recording"** button
2. Recording saves as WebM audio file
3. Download link appears
4. Click to save file

**Use Cases:**
- Demo recordings
- A/B testing different settings
- Quality validation
- Client presentations

---

## Comparison: Windowed vs Fullscreen

| Feature | Windowed | Fullscreen |
|---------|----------|------------|
| **Zoom Control** | ✅ Yes (50-200%) | ❌ No (auto-fit) |
| **MIDI Device Select** | ✅ Visible | ✅ In overlay |
| **Recording** | ✅ Yes | ❌ No |
| **Overlay** | ❌ N/A | ✅ Auto-hide |
| **Controls** | ✅ Always visible | ✅ Hover to show |
| **Exit Method** | ❌ N/A | ✅ Button/Esc |
| **Best For** | Development | Validation |

---

## Export Accuracy

### What You See Is What You Get (WYSIWYG)
The Test page preview is **pixel-perfect** to the exported instrument:
- Same widget rendering code
- Identical layout engine
- Real audio engine bindings
- Actual component library

### Differences (Minor)
Small differences between preview and export:
- **Font rendering** - May vary slightly per platform
- **MIDI handling** - VST host manages MIDI in export
- **Performance** - Standalone may be faster (native code)
- **Window chrome** - VST host provides window frame

These are cosmetic only - **functionality is identical**.

---

## Troubleshooting

### Performance Issues
**Symptoms:** Laggy UI, slow response  
**Solutions:**
- Close other browser tabs
- Reduce number of widgets (< 50 recommended)
- Disable spectrum analyzer if present
- Use simpler widget types (sliders vs knobs)

### Fullscreen Stuck
**Symptoms:** Can't exit fullscreen  
**Solutions:**
- Press **Esc** key (browser shortcut)
- Press **F11** if in browser fullscreen
- Move mouse to top, wait for overlay
- Click browser back button if overlay won't show

### Widgets Overlapping
**Symptoms:** Controls on top of each other  
**Solutions:**
- Check Z-order in Design page Layers tab
- Adjust widget positions to avoid overlap
- Use smaller widget sizes
- Increase canvas dimensions

---

## Examples

### Minimal Synth Preview
```
Canvas: 600×400px
Widgets:
- 3 sliders (attack, decay, release)
- 1 keyboard (2 octaves)
- 1 spectrum analyzer
- 1 master fader

Preview Mode: Fullscreen
MIDI: Connected Arturia MiniLab
Test: Play chords, adjust envelope in real-time
```

### Sample Player Preview
```
Canvas: 800×600px
Widgets:
- State Display (selected instrument)
- 6 velocity layers (buttons)
- Filter cutoff knob
- Reverb mix slider
- XY pad (pitch/mod)

Preview Mode: Windowed (50% zoom)
MIDI: MPK Mini
Test: Switch instruments, test zones
```

---

## See Also
- [Design Page Guide](./DESIGN.md)
- [Widget Types Reference](./WIDGET_TYPES.md)
- [State Integration](./STATE_INTEGRATION.md)
- [Export Guide](./EXPORT.md)
- [MIDI Setup](./MIDI.md)

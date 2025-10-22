# Cross-Page State Integration Guide

## Overview
The Design page now supports **live state binding** from Play, Map, and Sequence pages. This allows you to create dynamic UIs that display real-time information from other parts of your VST/instrument builder.

---

## State Display Widget

### What is it?
A new widget type that shows live state values from other pages in your designed UI.

### How to Add
1. Go to **Design** page
2. Open **Components** tab (left panel)
3. Navigate to **Static** category
4. Click **"State Display"** or drag it to the canvas

### Available State Bindings

#### 🎹 Play Page State
- **Selected Instrument** - Shows which instrument/category is currently selected
- **Instrument Count** - Total number of instrument groups
- **Sample Count** - Total number of loaded samples

#### 🗺️ Map Page State
- **Current Articulation** - Active articulation for selected instrument
- **Current Mic** - Active microphone position for selected instrument
- **Zone Count** - Number of mapped sample zones

#### ▶️ Sequence Page State
- **Sequencer Playing** - Shows "▶️ Playing" or "⏸️ Stopped"
- **Sequencer BPM** - Current tempo in beats per minute
- **Current Step** - Active sequencer step (0-15 or based on pattern length)
- **Sequencer Mode** - Current mode (grid/piano/wave/music)

---

## Using State Bindings

### Step-by-Step Setup

1. **Add State Display Widget**
   - Drag "State Display" from Components → Static category
   - Place it on your canvas

2. **Select State Binding**
   - Click the widget to select it
   - In **Properties** tab (right panel), find "State Binding" dropdown
   - Choose your desired state (e.g., "🎹 Selected Instrument")

3. **Customize Appearance**
   - Change the **Label** to describe what's being shown
   - Adjust **X, Y, W, H** for position and size
   - Style it to match your design

### Example Use Cases

#### Instrument Selector Display
```
Widget: State Display
Label: "Current Instrument"
Binding: state.selectedInstrument
Position: Top-right corner
```
Shows which instrument the user has selected on the Play page.

#### BPM Monitor
```
Widget: State Display
Label: "BPM"
Binding: state.sequencerBPM
Position: Near sequencer controls
```
Displays current sequencer tempo in real-time.

#### Transport Status
```
Widget: State Display
Label: "Transport"
Binding: state.sequencerPlaying
Position: Center of transport section
```
Shows "▶️ Playing" or "⏸️ Stopped" based on sequencer state.

---

## Advanced Features

### Real-Time Updates
State Display widgets automatically update when:
- User switches instruments on Play page
- Sequencer starts/stops playing
- BPM changes in Sequence page
- Articulation/mic positions are changed on Map page

### Integration with Other Widgets
Combine State Display with:
- **Labels** - Create informative headers
- **Images** - Show instrument logos based on selection
- **Dividers** - Separate state sections visually

### Property Inspector Support
State Display widgets have full property inspector support:
- **Properties Tab** - Configure state binding and appearance
- **Automation Tab** - N/A (read-only display)
- **MIDI Tab** - N/A (read-only display)
- **Scripts Tab** - Add custom scripts that react to state changes

---

## Technical Details

### State Binding Format
All state bindings follow the pattern: `state.<pageName>.<propertyName>`

Examples:
- `state.selectedInstrument` → Play page
- `state.currentArticulation` → Map page
- `state.sequencerBPM` → Sequence page

### Data Flow
```
Play/Map/Sequence Page
    ↓
Instrument Manifest (manifest.ui, manifest.sequence)
    ↓
State Display Widget (reads from manifest)
    ↓
Rendered UI (auto-updates on changes)
```

### Manifest Storage
State values are stored in:
- `manifest.ui.selectedInstrument` - Selected instrument
- `manifest.ui.currentArticulations[instrument]` - Articulation per instrument
- `manifest.ui.currentMics[instrument]` - Mic position per instrument
- `manifest.sequence.bpm` - Sequencer tempo
- `manifest.sequence.playing` - Transport status
- `manifest.sequence.currentStep` - Active step
- `manifest.sequence.mode` - Sequencer mode

---

## Best Practices

### 1. **Descriptive Labels**
Use clear labels that explain what state is being shown:
✅ "Selected Instrument: Piano"
❌ "Value: Piano"

### 2. **Logical Positioning**
Place state displays near related controls:
- Instrument name near instrument selector
- BPM near tempo controls
- Transport status near play/stop buttons

### 3. **Appropriate Sizing**
Size widgets based on content:
- Short values (BPM): 80-120px wide
- Medium text (instrument names): 150-200px wide
- Long text (modes/states): 200-300px wide

### 4. **Visual Hierarchy**
Use styling to emphasize important state:
- Make critical info (transport, BPM) larger
- Use subdued colors for secondary info
- Add icons/emojis for quick recognition

---

## Future Enhancements

Planned improvements:
- **State Actions** - Trigger actions from state changes
- **Conditional Display** - Show/hide widgets based on state
- **State Interpolation** - Smooth transitions between state values
- **Custom Formatters** - Format state values (e.g., "120 BPM" vs "120")

---

## Troubleshooting

### State Not Updating?
1. Check that the source page (Play/Map/Sequence) is properly setting state
2. Verify the correct state binding is selected
3. Ensure manifest is being persisted (check localStorage)

### Wrong Value Displayed?
1. Confirm the binding name matches exactly (case-sensitive)
2. Check that the instrument/category exists in manifest
3. Look for console errors indicating missing data

### Widget Not Rendering?
1. Make sure widget is visible (visible: true)
2. Check z-order in Layers tab
3. Verify widget dimensions (w, h > 0)

---

## Examples Gallery

### Complete Status Bar
Create a horizontal bar showing all key info:
```
[State Display: Instrument] | [State Display: Articulation] | [State Display: BPM] | [State Display: Transport]
```

### Compact Dashboard
Grid layout with essential state:
```
┌─────────────┬─────────────┐
│ Instrument  │   BPM: 120  │
├─────────────┼─────────────┤
│ Articulation│  ▶️ Playing │
└─────────────┴─────────────┘
```

### Minimal Info Display
Single critical state in corner:
```
                     [🎹 Piano]
```

---

## Keyboard Shortcuts

While working with State Display widgets:
- **Arrow Keys** - Navigate components library
- **Enter** - Add focused component
- **/** - Focus component search
- **Ctrl+C/V** - Copy/paste widgets
- **Delete** - Remove selected widget

---

## See Also
- [Widget Types Reference](./WIDGET_TYPES.md)
- [Property Inspector Guide](./PROPERTY_INSPECTOR.md)
- [Template System](./TEMPLATES.md)
- [Export Integration](./EXPORT.md)

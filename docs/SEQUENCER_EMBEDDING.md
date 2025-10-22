# Sequencer Embedding in Design

## Overview

The Design page now supports embedding sequencer pattern displays, step editors, transport controls, and piano rolls as draggable, resizable UI widgets. This allows you to design custom sequencer interfaces that can be exported to VST/standalone builds.

## Features

### 1. 📊 Pattern Display Widget

**Visual representation of a sequencer track's pattern**

Shows step states (active/inactive) with optional velocity visualization and current step highlighting.

**Widget Properties:**
```javascript
{
  id: 'pattern-1',
  type: 'patternDisplay',
  label: 'Pattern Display',
  x: 50,
  y: 100,
  width: 400,
  height: 80,
  config: {
    trackIndex: 0,              // Which track to display (0-based)
    showLabels: true,           // Show track name
    showVelocity: false,        // Visualize velocity as opacity
    stepCount: 16,              // Number of steps to display
    cellSize: 20,               // Size of each step cell (px)
    activeColor: '#4CAF50',     // Color for active steps
    inactiveColor: '#333333',   // Color for inactive steps
    currentStepColor: '#FFC107',// Color for current playing step
    backgroundColor: '#1e1e1e', // Widget background
  }
}
```

**Usage:**
1. Navigate to Design page → Components tab
2. Scroll to "Sequencer" category
3. Click "Pattern Display"
4. Widget appears on canvas at default position
5. Drag to position, resize as needed
6. Select widget to edit properties in Property Inspector

**Live Features:**
- Updates in real-time when sequencer plays
- Highlights current step during playback
- Shows velocity as opacity when enabled
- Reads from `manifest.sequence.tracks[trackIndex]`

### 2. ✏️ Step Editor Widget

**Interactive step sequencer with velocity editing**

Full-featured step editor allowing click-to-toggle steps and scroll-to-adjust velocity.

**Widget Properties:**
```javascript
{
  id: 'editor-1',
  type: 'stepEditor',
  label: 'Step Editor',
  x: 50,
  y: 200,
  width: 500,
  height: 80,
  config: {
    trackIndex: 0,              // Which track to edit
    stepCount: 16,              // Number of steps
    cellSize: 24,               // Size of each step cell (px)
    showVelocity: true,         // Show velocity bars
    editable: true,             // Allow click-to-toggle
    activeColor: '#4CAF50',     // Active step color
    inactiveColor: '#333333',   // Inactive step color
    hoverColor: '#555555',      // Hover state color
    backgroundColor: '#1e1e1e', // Widget background
    gridColor: '#444444',       // Grid line color
  }
}
```

**Interactions:**
- **Click step**: Toggle active/inactive
- **Scroll wheel on active step**: Adjust velocity (±5 per scroll)
- **Hover**: Preview color change
- **Step numbers**: Shown every 4 steps (1, 5, 9, 13)
- **Velocity indicator**: White overlay bar height = velocity level

**Usage:**
1. Add "Step Editor" from Sequencer category
2. Click steps to activate/deactivate
3. Scroll on active steps to adjust velocity
4. Changes save immediately to `manifest.sequence`

### 3. ⏯️ Transport Controls Widget

**Playback control and tempo adjustment**

Play/pause button with tempo slider and swing control.

**Widget Properties:**
```javascript
{
  id: 'transport-1',
  type: 'transportControls',
  label: 'Transport',
  x: 50,
  y: 300,
  width: 400,
  height: 80,
  config: {
    showTempo: true,            // Show tempo slider/input
    showSwing: false,           // Show swing amount slider
    minTempo: 60,               // Minimum BPM
    maxTempo: 240,              // Maximum BPM
    backgroundColor: '#1e1e1e', // Widget background
    buttonColor: '#4CAF50',     // Play button color (Stop = red)
  }
}
```

**Controls:**
- **Play/Pause Button**: Large circular button (▶/⏸)
  - Green when stopped
  - Red when playing
  - Click to toggle playback
- **Tempo Slider**: Range input (60-240 BPM)
- **Tempo Number Input**: Manual BPM entry
- **Swing Slider** (optional): 0.0 to 0.5

**State:**
- Reads `manifest.sequence.bpm`
- Writes tempo changes to `manifest.sequence.bpm`
- Calls `onPlay` / `onStop` callbacks (for future audio integration)

### 4. 🎹 Piano Roll Widget

**Compact piano roll visualization**

Shows MIDI notes on piano keys with optional piano keyboard display.

**Widget Properties:**
```javascript
{
  id: 'pianoroll-1',
  type: 'pianoRoll',
  label: 'Piano Roll',
  x: 50,
  y: 400,
  width: 500,
  height: 300,
  config: {
    trackIndex: 0,                    // Which track to display
    showPianoKeys: true,              // Show piano keys on left
    noteRange: { min: 48, max: 72 },  // MIDI note range (C3 to C5)
    stepCount: 16,                    // Horizontal steps
    cellWidth: 20,                    // Step cell width (px)
    cellHeight: 12,                   // Note row height (px)
    activeColor: '#4CAF50',           // Note active color
    backgroundColor: '#1e1e1e',       // Widget background
    keyColor: '#ffffff',              // White key color
    blackKeyColor: '#000000',         // Black key color
  }
}
```

**Display:**
- **Piano Keys** (left, 40px width): Shows octave labels (C3, C4, etc.)
- **Grid**: Note rows × step columns
- **Black keys**: Rendered with 70% opacity
- **Active notes**: Highlighted in `activeColor`
- **Note length**: Spans multiple cells horizontally

**Data Source:**
Reads from `manifest.sequence.tracks[trackIndex].notes`:
```javascript
notes: [
  { start: 0, length: 1, midi: 60, level: 100 },  // C4 at step 0
  { start: 4, length: 2, midi: 64, level: 80 },   // E4 at step 4, 2 steps long
]
```

## Integration with Sequence Page

### Data Flow

```
Sequence Page
  ↓ (updates manifest.sequence)
Manifest State (localStorage)
  ↓ (reads manifest.sequence)
Design Page Sequencer Widgets
  ↓ (renders from data)
Canvas Display
  ↓ (exports to)
mapping.json → VST Build
```

### Sequence Data Structure

```javascript
manifest.sequence = {
  bpm: 120,
  subdivision: '1/16',
  swing: 0.0,
  stepsCount: 16,
  mode: 'grid',  // 'grid' | 'piano' | 'wave' | 'music'
  scaleRoot: 'C',
  scaleType: 'Major',
  tracks: [
    {
      id: 'track-1',
      name: 'Kick',
      color: '#3b82f6',
      instrument: 'Drums',
      articulation: 'Kick',
      mic: 'Close',
      rrMode: 'cycle',
      mute: false,
      solo: false,
      armed: false,
      volume: 0.9,
      pan: 0,
      midi: 60,
      velocity: 100,
      density: 0.3,
      pattern: [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],  // Step grid
      notes: [],  // Piano roll notes
      velocities: [100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
    }
  ],
  music: {
    chordTrack: { /* chord progression data */ },
    chords: [],
    melodyTrack: { /* melody data */ },
  }
}
```

## Property Inspector Integration

When a sequencer widget is selected, the Property Inspector shows:

### Properties Tab
- **Track Index**: Dropdown (0 to trackCount-1)
- **Step Count**: Number input (4-64)
- **Cell Size**: Number input (10-50)
- **Show Labels**: Checkbox
- **Show Velocity**: Checkbox (stepEditor, patternDisplay)
- **Editable**: Checkbox (stepEditor)
- **Colors**: Color pickers for active, inactive, hover, etc.

### Style Tab
- Background color
- Border radius
- Padding
- Font size (for labels)

## Design Workflows

### Workflow 1: Drum Machine UI

**Goal:** Create a classic drum machine with 4 tracks

1. **Add Transport Controls** (top)
   - Position: x=50, y=20
   - Size: 400×80
   - Enable: showTempo=true, showSwing=true

2. **Add 4 Step Editors** (stacked)
   - Track 0 (Kick): x=50, y=120, config.trackIndex=0
   - Track 1 (Snare): x=50, y=210, config.trackIndex=1
   - Track 2 (Hi-hat): x=50, y=300, config.trackIndex=2
   - Track 3 (Clap): x=50, y=390, config.trackIndex=3

3. **Add Labels** for each track name

4. **Apply Style**
   - Use color palette generator (AI tab)
   - Set background to dark gray
   - Assign unique activeColor per track

5. **Test**
   - Navigate to Test page
   - Verify step editors work
   - Check transport controls

### Workflow 2: Melodic Sequencer UI

**Goal:** Piano roll + pattern display combo

1. **Add Piano Roll** (large, center)
   - Position: x=50, y=100
   - Size: 600×400
   - Config: noteRange={min:36, max:84} (C2 to C6)

2. **Add Pattern Display** (top, compact)
   - Position: x=50, y=20
   - Size: 600×60
   - Config: showVelocity=true

3. **Add Transport** (bottom)
   - Position: x=50, y=520
   - Size: 600×80

4. **Style with Hierarchy Layout** (AI tab)
   - Click "Apply Auto-Layout" → Hierarchical
   - Adjust manually if needed

### Workflow 3: Multi-Track Pattern Grid

**Goal:** 8-track pattern overview

1. **Add 8 Pattern Displays** (grid 2×4)
   - Use AI → Layout → Grid Layout
   - Adjust trackIndex for each (0-7)

2. **Add Single Transport** (top center)

3. **Add Labels** showing track names

4. **Optimize**
   - AI → Optimize → "Optimize Widget Sizes"
   - AI → Optimize → "Fix Overlapping Widgets"

## Export & VST Integration

### Export Data

When exporting, sequencer widgets are saved to `mapping.json`:

```json
{
  "ui": {
    "bindings": [
      {
        "id": "pattern-1",
        "type": "patternDisplay",
        "x": 50,
        "y": 100,
        "width": 400,
        "height": 80,
        "config": {
          "trackIndex": 0,
          "stepCount": 16,
          "cellSize": 20,
          "activeColor": "#4CAF50"
        }
      }
    ]
  },
  "sequence": {
    "bpm": 120,
    "tracks": [ /* full track data */ ]
  }
}
```

### C++/JUCE Implementation

**Pattern Display Rendering:**
```cpp
// In AudioProcessorEditor
void renderPatternDisplay(const WidgetConfig& widget) {
  int trackIdx = widget.config["trackIndex"];
  auto& track = sequenceData.tracks[trackIdx];
  
  for (int step = 0; step < widget.config["stepCount"]; step++) {
    bool active = track.pattern[step];
    juce::Colour color = active 
      ? juce::Colour::fromString(widget.config["activeColor"])
      : juce::Colour::fromString(widget.config["inactiveColor"]);
    
    int cellSize = widget.config["cellSize"];
    g.setColour(color);
    g.fillRect(widget.x + step * cellSize, widget.y, cellSize - 2, cellSize - 2);
  }
}
```

**Transport Controls:**
```cpp
class TransportButton : public juce::Button {
  void clicked() override {
    if (isPlaying) {
      audioProcessor.stopSequencer();
      setButtonText("▶");
    } else {
      audioProcessor.startSequencer();
      setButtonText("⏸");
    }
    isPlaying = !isPlaying;
  }
};
```

**Piano Roll:**
```cpp
void renderPianoRoll(const WidgetConfig& widget) {
  int trackIdx = widget.config["trackIndex"];
  auto& notes = sequenceData.tracks[trackIdx].notes;
  
  for (auto& note : notes) {
    int noteRow = widget.config["noteRange"]["max"] - note.midi;
    int startCol = note.start;
    int length = note.length;
    
    g.setColour(juce::Colour::fromString(widget.config["activeColor"]));
    g.fillRect(
      widget.x + startCol * cellWidth,
      widget.y + noteRow * cellHeight,
      length * cellWidth,
      cellHeight
    );
  }
}
```

## Best Practices

### Design
- **Use consistent cell sizes** across all sequencer widgets (16-24px recommended)
- **Match colors** to your overall theme for cohesion
- **Show velocity** only when useful (drum programming)
- **Limit track count** to screen real estate (4-8 tracks max)

### Layout
- **Stack step editors vertically** for multi-track view
- **Place transport at top** for easy access
- **Group related controls** (transport + master track)
- **Use AI auto-layout** as starting point, then fine-tune

### Performance
- **Limit stepCount** to what's visible (16-32 typical)
- **Reduce noteRange** in piano roll to relevant octaves
- **Disable showVelocity** if not needed (reduces render complexity)

### Accessibility
- **Ensure color contrast** (use AI accessibility checker)
- **Provide text labels** for all sequencer widgets
- **Use standard sizes** (minimum 20px cell size for clickability)

## API Reference

### PatternDisplayWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | object | `{}` | Widget configuration |
| `config.trackIndex` | number | `0` | Track to display (0-based) |
| `config.showLabels` | boolean | `true` | Show track name label |
| `config.showVelocity` | boolean | `false` | Visualize velocity as opacity |
| `config.stepCount` | number | `16` | Number of steps to show |
| `config.cellSize` | number | `20` | Step cell size in pixels |
| `config.activeColor` | string | `'#4CAF50'` | Active step color |
| `config.inactiveColor` | string | `'#333333'` | Inactive step color |
| `config.currentStepColor` | string | `'#FFC107'` | Current step highlight |
| `config.backgroundColor` | string | `'#1e1e1e'` | Widget background |
| `isDesignMode` | boolean | `false` | Disable interactivity |
| `style` | object | `{}` | React inline styles |

### StepEditorWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config.trackIndex` | number | `0` | Track to edit |
| `config.stepCount` | number | `16` | Number of steps |
| `config.cellSize` | number | `24` | Cell size in pixels |
| `config.showVelocity` | boolean | `true` | Show velocity bars |
| `config.editable` | boolean | `true` | Allow editing |
| `config.activeColor` | string | `'#4CAF50'` | Active step color |
| `config.inactiveColor` | string | `'#333333'` | Inactive step color |
| `config.hoverColor` | string | `'#555555'` | Hover state color |
| `config.gridColor` | string | `'#444444'` | Grid line color |
| `onPatternChange` | function | - | Callback when pattern changes |

### TransportControlsWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config.showTempo` | boolean | `true` | Show tempo controls |
| `config.showSwing` | boolean | `false` | Show swing slider |
| `config.minTempo` | number | `60` | Minimum BPM |
| `config.maxTempo` | number | `240` | Maximum BPM |
| `config.buttonColor` | string | `'#4CAF50'` | Play button color |
| `onPlay` | function | - | Called when play starts |
| `onStop` | function | - | Called when playback stops |
| `onTempoChange` | function | - | Called when tempo changes |

### PianoRollWidget Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config.trackIndex` | number | `0` | Track to display |
| `config.showPianoKeys` | boolean | `true` | Show piano keys |
| `config.noteRange` | object | `{min:48,max:72}` | MIDI note range |
| `config.stepCount` | number | `16` | Horizontal steps |
| `config.cellWidth` | number | `20` | Step width in pixels |
| `config.cellHeight` | number | `12` | Note row height |
| `config.activeColor` | string | `'#4CAF50'` | Note color |
| `config.keyColor` | string | `'#ffffff'` | White key color |
| `config.blackKeyColor` | string | `'#000000'` | Black key color |

## Troubleshooting

**Q: Sequencer widgets show empty/no pattern**  
A: Ensure you've created tracks in Sequence page first, or pattern data exists in `manifest.sequence.tracks`

**Q: Step editor clicks don't toggle steps**  
A: Check `config.editable` is true and `isDesignMode` is false (only in Test page)

**Q: Pattern Display doesn't update during playback**  
A: Ensure `manifest.sequence.currentStep` is being updated by sequencer playback logic

**Q: Piano roll shows no notes**  
A: Verify track has notes in `notes` array (not just `pattern` array)

**Q: Transport controls don't change tempo**  
A: Check that `manifest.sequence.bpm` exists and updates are persisting to localStorage

**Q: Widget colors don't match theme**  
A: Use AI Color Palette Generator to apply consistent theme, then adjust widget configs

## Future Enhancements

Planned features:
- **Step automation lanes**: Modulate filter, volume per step
- **Pattern chaining**: Link multiple pattern displays
- **Live recording**: Record MIDI input to pattern
- **Euclidean rhythm generator**: Auto-generate patterns
- **Groove quantization**: Apply swing/humanization
- **Pattern clipboard**: Copy/paste between tracks
- **Undo/redo** for step edits

## See Also

- `frontend/src/pages/Sequence.jsx` - Full sequencer implementation
- `docs/STATE_INTEGRATION.md` - Cross-page state bindings
- `docs/UI_EXPORT_FORMAT.md` - Export data structure
- `docs/AI_DESIGN_ASSISTANT.md` - AI layout tools

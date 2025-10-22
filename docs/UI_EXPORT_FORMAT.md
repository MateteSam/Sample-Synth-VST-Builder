# UI Export Format

## Overview

When you export a designed instrument from the Design page, the complete UI definition is saved to `mapping.json` in the export directory. This document explains the structure and how to use it in C++/JUCE code generation.

## Export Structure

```
export/
  1760826396447/           # Timestamp folder
    mapping.json           # Complete instrument definition
    README.md              # Build instructions
    assets/                # Audio samples and images
      kick.wav
      snare.wav
      logo.png
    project/               # JUCE scaffold
      CMakeLists.txt
      src/
        main.cpp
```

## mapping.json Structure

```json
{
  "samples": [...],        // Audio sample mappings
  "engine": {...},         // DSP engine parameters
  "ui": {                  // UI definition (NEW)
    "groupNames": {...},   // Parameter groups
    "bindings": [...],     // Widget definitions
    "bindingOrder": [...], // Z-index rendering order
    "canvas": {...},       // Canvas configuration
    "template": "...",     // Template name
    "theme": {...},        // Color theme
    "assets": [...]        // Asset references
  },
  "meta": {...},           // Plugin metadata
  "sequence": {...},       // Sequencer patterns
  "options": {...}         // Export options
}
```

## UI Object Properties

### `ui.bindings` (Widget Definitions)

Array of widget objects. Each widget represents a UI control:

```json
{
  "id": "slider-1",
  "type": "slider",
  "x": 50,
  "y": 100,
  "width": 200,
  "height": 40,
  "label": "Cutoff",
  "paramId": "filter.cutoff",
  "min": 20,
  "max": 20000,
  "default": 1000,
  "style": {
    "fillColor": "#4CAF50",
    "trackColor": "#333333",
    "fontSize": 14,
    "fontFamily": "Arial"
  }
}
```

**Widget Types:**
- `slider` - Horizontal/vertical slider
- `knob` - Rotary knob
- `fader` - Vertical fader
- `toggle` - On/off switch
- `button` - Push button
- `select` - Dropdown menu
- `xy` - 2D XY pad
- `keyboard` - Piano keyboard
- `meter` - Level meter (output only)
- `spectrum` - Spectrum analyzer (output only)
- `label` - Static text
- `image` - Static image
- `stateDisplay` - Live state from other pages
- `divider` - Visual separator

### Common Widget Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `type` | string | Yes | Widget type (see above) |
| `x` | number | Yes | X position (pixels) |
| `y` | number | Yes | Y position (pixels) |
| `width` | number | Yes | Width (pixels) |
| `height` | number | Yes | Height (pixels) |
| `label` | string | No | Display label |
| `paramId` | string | No* | Engine parameter binding |
| `min` | number | No* | Minimum value |
| `max` | number | No* | Maximum value |
| `default` | number | No* | Default value |
| `style` | object | No | Visual styling |

*Required for interactive controls (slider, knob, fader, toggle, etc.)

### `ui.bindingOrder`

Array of widget IDs in rendering order (back to front):

```json
["bg-image-1", "slider-1", "knob-1", "label-1"]
```

### `ui.canvas`

Canvas configuration:

```json
{
  "width": 800,
  "height": 600,
  "backgroundColor": "#1e1e1e",
  "gridSize": 10,
  "snapToGrid": true
}
```

### `ui.template`

Template name used for design:

```json
"MinimalSynth" | "ModernSampler" | "DrumMachine" | "SimpleVST" | "ClassicHardware"
```

### `ui.theme`

Color theme object:

```json
{
  "primary": "#4CAF50",
  "secondary": "#FFC107",
  "background": "#1e1e1e",
  "text": "#ffffff",
  "accent": "#2196F3"
}
```

### `ui.assets`

Array of asset references:

```json
[
  {
    "id": "asset-1",
    "name": "logo.png",
    "type": "image/png",
    "url": "blob:...",
    "path": "assets/logo.png"
  }
]
```

## C++/JUCE Integration

### 1. Parsing mapping.json

Use a JSON library (nlohmann/json recommended):

```cpp
#include <fstream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

json loadMapping() {
  std::ifstream f("mapping.json");
  return json::parse(f);
}

auto mapping = loadMapping();
auto uiBindings = mapping["ui"]["bindings"];
```

### 2. Widget Type Mapping

Map JSON widget types to JUCE components:

| JSON Type | JUCE Component | Notes |
|-----------|----------------|-------|
| `slider` | `juce::Slider` | Style: LinearHorizontal/LinearVertical |
| `knob` | `juce::Slider` | Style: RotaryHorizontalVerticalDrag |
| `fader` | `juce::Slider` | Style: LinearVertical |
| `toggle` | `juce::ToggleButton` | |
| `button` | `juce::TextButton` | |
| `select` | `juce::ComboBox` | |
| `label` | `juce::Label` | |
| `image` | `juce::ImageComponent` | Load from assets/ |
| `keyboard` | `juce::MidiKeyboardComponent` | |
| `meter` | `juce::Component` (custom) | Visualize audio level |
| `spectrum` | `juce::Component` (custom) | FFT visualization |

### 3. Creating Components

```cpp
void createWidgets(const json& bindings) {
  for (const auto& widget : bindings) {
    std::string type = widget["type"];
    
    if (type == "slider") {
      auto slider = std::make_unique<juce::Slider>();
      slider->setSliderStyle(juce::Slider::LinearHorizontal);
      slider->setRange(widget["min"], widget["max"]);
      slider->setValue(widget["default"]);
      slider->setBounds(
        widget["x"], widget["y"],
        widget["width"], widget["height"]
      );
      addAndMakeVisible(slider.get());
      sliders.push_back(std::move(slider));
    }
    else if (type == "knob") {
      auto knob = std::make_unique<juce::Slider>();
      knob->setSliderStyle(juce::Slider::RotaryHorizontalVerticalDrag);
      knob->setRange(widget["min"], widget["max"]);
      knob->setValue(widget["default"]);
      knob->setBounds(
        widget["x"], widget["y"],
        widget["width"], widget["height"]
      );
      addAndMakeVisible(knob.get());
      knobs.push_back(std::move(knob));
    }
    // ... handle other types
  }
}
```

### 4. Parameter Binding

Connect widgets to AudioProcessor parameters:

```cpp
// In AudioProcessor constructor
for (const auto& widget : mapping["ui"]["bindings"]) {
  if (widget.contains("paramId")) {
    std::string paramId = widget["paramId"];
    float min = widget["min"];
    float max = widget["max"];
    float defaultVal = widget["default"];
    
    auto param = new juce::AudioParameterFloat(
      paramId,
      widget["label"],
      juce::NormalisableRange<float>(min, max),
      defaultVal
    );
    addParameter(param);
  }
}

// In AudioProcessorEditor
void attachParameters() {
  for (auto& slider : sliders) {
    std::string paramId = getParamIdForWidget(slider.get());
    auto attachment = std::make_unique<juce::AudioProcessorValueTreeState::SliderAttachment>(
      processor.parameters, paramId, *slider
    );
    attachments.push_back(std::move(attachment));
  }
}
```

### 5. Styling

Apply colors and fonts from `style` object:

```cpp
void applyStyle(juce::Component* comp, const json& style) {
  if (style.contains("fillColor")) {
    juce::Colour color = juce::Colour::fromString(style["fillColor"]);
    comp->setColour(juce::Slider::thumbColourId, color);
  }
  if (style.contains("fontSize")) {
    comp->setFont(juce::Font(style["fontSize"]));
  }
}
```

### 6. Loading Assets

Load images from `assets/` directory:

```cpp
juce::Image loadAsset(const std::string& path) {
  juce::File assetFile(juce::File::getCurrentWorkingDirectory()
    .getChildFile("assets")
    .getChildFile(path));
  return juce::ImageFileFormat::loadFrom(assetFile);
}

// For image widgets
if (type == "image") {
  auto img = std::make_unique<juce::ImageComponent>();
  img->setImage(loadAsset(widget["src"]));
  img->setBounds(widget["x"], widget["y"], widget["width"], widget["height"]);
  addAndMakeVisible(img.get());
}
```

## Example: Full Widget Loader

```cpp
class AutoGeneratedUI : public juce::Component {
public:
  AutoGeneratedUI(const json& uiDef) {
    // Set canvas size
    auto canvas = uiDef["canvas"];
    setSize(canvas["width"], canvas["height"]);
    
    // Create widgets in order
    for (const auto& widgetId : uiDef["bindingOrder"]) {
      auto widget = findWidget(uiDef["bindings"], widgetId);
      createAndAddWidget(widget);
    }
  }
  
private:
  json findWidget(const json& bindings, const std::string& id) {
    for (const auto& w : bindings) {
      if (w["id"] == id) return w;
    }
    return json::object();
  }
  
  void createAndAddWidget(const json& widget) {
    std::string type = widget["type"];
    
    if (type == "slider") {
      auto s = std::make_unique<juce::Slider>();
      configureSlider(s.get(), widget);
      addAndMakeVisible(s.get());
      sliders.push_back(std::move(s));
    }
    // ... handle all widget types
  }
  
  void configureSlider(juce::Slider* s, const json& w) {
    s->setSliderStyle(juce::Slider::LinearHorizontal);
    s->setRange(w["min"], w["max"]);
    s->setValue(w["default"]);
    s->setBounds(w["x"], w["y"], w["width"], w["height"]);
    if (w.contains("style")) applyStyle(s, w["style"]);
  }
  
  std::vector<std::unique_ptr<juce::Slider>> sliders;
  std::vector<std::unique_ptr<juce::Button>> buttons;
  // ... other component collections
};
```

## stateDisplay Widget

Special widget type that shows live state from other pages:

```json
{
  "id": "state-1",
  "type": "stateDisplay",
  "x": 10,
  "y": 10,
  "width": 200,
  "height": 100,
  "stateKey": "Play.activeSamples",
  "label": "Active Samples",
  "style": {
    "backgroundColor": "#2a2a2a",
    "textColor": "#4CAF50"
  }
}
```

**State Keys:**
- `Play.activeSamples` - Currently playing samples
- `Play.currentNotes` - Active MIDI notes
- `Map.selectedZone` - Selected mapping zone
- `Map.totalZones` - Total zone count
- `Sequence.isPlaying` - Sequencer playback state
- `Sequence.currentStep` - Current sequence step
- `Sequence.tempo` - Sequencer BPM

Implementation: Poll these values from the audio processor and update the display in real-time.

## Automation & MIDI

Widgets can have automation and MIDI learn data (from Property Inspector):

```json
{
  "id": "slider-1",
  "type": "slider",
  "automation": {
    "enabled": true,
    "points": [
      { "time": 0, "value": 0 },
      { "time": 1, "value": 1 }
    ]
  },
  "midi": {
    "learn": true,
    "cc": 74,
    "channel": 1
  }
}
```

## Best Practices

1. **Load UI definition early** - Parse mapping.json in AudioProcessor constructor
2. **Validate widget data** - Check for required fields, use defaults if missing
3. **Handle missing assets gracefully** - Show placeholder if image not found
4. **Respect Z-order** - Use `bindingOrder` array for correct layering
5. **Apply theme consistently** - Use `ui.theme` for consistent colors
6. **Test with different templates** - Ensure all widget types render correctly
7. **Cache assets** - Don't reload images on every repaint
8. **Use paramId consistently** - Match parameter IDs between UI and AudioProcessor

## Next Steps

- See `vst-builder/` directory for C++ code generation tools
- Run `build_export.ps1 -Stamp <timestamp>` to build a JUCE project from export
- Consult JUCE documentation for advanced component customization

## Questions?

Refer to:
- JUCE Framework Docs: https://juce.com/learn/documentation
- This project's `vst-builder/README.md` for build instructions
- `STATE_INTEGRATION.md` for cross-page state bindings

# AI Design Assistant

## Overview

The AI Design Assistant provides intelligent UI suggestions, automated layout optimization, smart color palette generation, and accessibility improvements for your VST/standalone instrument design workflow.

## Features

### 1. 🔍 Widget Suggestions

**Analyzes your engine parameters and suggests appropriate UI controls**

The AI examines your `manifest.engine` configuration and recommends widgets based on:

- **Master Controls**: Volume faders, pan knobs
- **Filter Parameters**: Cutoff, resonance, type selector
- **ADSR Envelope**: Attack, decay, sustain, release sliders
- **Effects**: Delay mix/time, reverb mix controls
- **Essential Visualizers**: Output meters, piano keyboard

Each suggestion includes:
- Widget type (slider, knob, fader, etc.)
- Label and paramId
- Min/max/default values
- Priority level (high/medium/low)
- Suggested canvas position
- Reasoning for the suggestion

**Usage:**
1. Navigate to Design page → AI tab
2. Click "🔍 Analyze Engine & Suggest"
3. Review suggestions list
4. Click "+ Add to Canvas" to apply

### 2. 📐 Auto-Layout Algorithms

**Automatically arrange widgets using professional layout patterns**

#### Grid Layout
- Arranges widgets in evenly-spaced grid
- Best for: Uniform control panels, parameter grids
- Adjusts to canvas width dynamically

#### Flow Layout
- Left-to-right, wraps to next row
- Best for: Dynamic content, varied widget sizes
- Maintains consistent spacing

#### Radial Layout
- Circular arrangement around center point
- Best for: Creative designs, macro controls
- Keeps all widgets equidistant from center

#### Hierarchical Layout
- Groups by priority/importance
- Best for: Professional instruments, organized workflows
- Primary controls (top), secondary (middle), tertiary (bottom)

**Usage:**
1. Add widgets to canvas
2. AI tab → Layout section
3. Select algorithm from dropdown
4. Click "✨ Apply Auto-Layout"

### 3. 🎨 Color Palette Generator

**Generate harmonious color schemes with professional color theory**

#### Color Harmony Rules

**Analogous**
- Colors adjacent on color wheel
- Creates calm, comfortable designs
- Example: Blue, blue-green, green

**Complementary**
- Opposite colors on wheel
- High contrast, vibrant
- Example: Blue and orange

**Triadic**
- Three evenly-spaced colors
- Balanced, colorful
- Example: Red, yellow, blue

**Split Complementary**
- Base color + two adjacent to complement
- Softer than complementary
- Example: Blue, yellow-orange, red-orange

**Tetradic**
- Four colors in two complementary pairs
- Rich, diverse palette
- Example: Blue, orange, yellow, violet

**Monochromatic**
- Variations of single hue
- Clean, elegant, cohesive
- Example: Light blue, blue, dark blue

**Usage:**
1. AI tab → Colors section
2. Pick base color with color picker
3. Select harmony rule
4. Preview 5-color palette
5. Click "🎨 Apply Palette"

Applies colors to:
- `ui.theme.primary`
- `ui.theme.secondary`
- `ui.theme.accent`
- `ui.theme.background`
- `ui.theme.text`
- `ui.canvas.backgroundColor`

### 4. ♿ Accessibility Checker

**Ensures your design meets WCAG contrast standards**

Checks:
- **Text Contrast**: Background vs text color
- **Primary Contrast**: Background vs primary elements
- **AA Standard**: Minimum 4.5:1 (text), 3:1 (UI components)
- **AAA Standard**: Minimum 7:1 (text)

Results shown in real-time:
- ✅ AA: Passes minimum accessibility
- ✅ AAA: Passes enhanced accessibility
- ❌: Fails standards, needs adjustment

**Auto-correction:**
When applying color palettes, AI automatically suggests:
- High-contrast text colors (black on light, white on dark)
- Accessible primary colors based on background luminance
- Border colors for proper separation

### 5. 📏 Distribution & Alignment

**Precise widget positioning tools**

#### Distribute
- **Horizontal**: Even spacing left-to-right
- **Vertical**: Even spacing top-to-bottom
- Calculates spacing based on first/last widget positions
- Maintains widget sizes

#### Align
- **Left/Right/Center H**: Horizontal alignment
- **Top/Bottom/Center V**: Vertical alignment
- Aligns all selected widgets to common edge/center

**Usage:**
1. Add 2+ widgets to canvas
2. AI tab → Layout section → Distribute/Align buttons
3. Click desired distribution/alignment

### 6. 🔧 Optimization Tools

**Automated design improvements**

#### Optimize Widget Sizes
Applies best-practice dimensions for each widget type:
- Faders: 60×150px (vertical feel)
- Sliders: 200×40px (horizontal range)
- Knobs: 80×80px (square rotary)
- Keyboards: 700×100px (full piano)
- Meters: 30×200px (tall metering)
- XY Pads: 150×150px (square interaction)

**Usage:** Click "📐 Optimize Widget Sizes"

#### Fix Overlapping Widgets
- Detects collisions between widgets
- Automatically repositions to resolve overlaps
- Adds 15px padding between widgets
- Preserves original layout intent

**Usage:** Click "🔧 Fix Overlapping Widgets"

### 7. 📊 Design Statistics

Real-time metrics:
- **Widget Count**: Total UI elements
- **Asset Count**: Images, backgrounds
- **Canvas Size**: Current dimensions

## API Reference

### `suggestWidgetsForEngine(engineParams)`

**Parameters:**
- `engineParams` (object): Manifest engine configuration

**Returns:** Array of suggestion objects:
```javascript
{
  type: 'slider',
  label: 'Cutoff',
  paramId: 'filter.cutoff',
  min: 20,
  max: 20000,
  default: 1000,
  priority: 'high',
  reason: 'Filter frequency control',
  suggestedPosition: { x: 250, y: 50 },
  width: 200,
  height: 40,
}
```

### `autoLayoutWidgets(widgets, algorithm, canvasWidth, canvasHeight)`

**Parameters:**
- `widgets` (array): Widget objects
- `algorithm` (string): 'grid' | 'flow' | 'radial' | 'hierarchical'
- `canvasWidth` (number): Canvas width in pixels
- `canvasHeight` (number): Canvas height in pixels

**Returns:** Widgets with updated x/y positions

### `distributeWidgets(widgets, direction)`

**Parameters:**
- `widgets` (array): Widget objects
- `direction` (string): 'horizontal' | 'vertical'

**Returns:** Evenly-spaced widgets

### `alignWidgets(widgets, alignment)`

**Parameters:**
- `widgets` (array): Widget objects
- `alignment` (string): 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV'

**Returns:** Aligned widgets

### `generateColorPalette(baseColor, harmony)`

**Parameters:**
- `baseColor` (string): Hex color (e.g., '#4CAF50')
- `harmony` (string): Harmony rule name

**Returns:** Array of 5 hex colors

### `getContrastRatio(color1, color2)`

**Parameters:**
- `color1` (string): Hex color
- `color2` (string): Hex color

**Returns:** Contrast ratio (number, e.g., 4.52)

### `optimizeWidgetSizes(widgets)`

**Parameters:**
- `widgets` (array): Widget objects

**Returns:** Widgets with optimized width/height

### `resolveOverlaps(widgets, padding)`

**Parameters:**
- `widgets` (array): Widget objects
- `padding` (number): Minimum space between widgets (default: 10)

**Returns:** Non-overlapping widgets

## Integration with Design Workflow

### Suggested Workflow

1. **Start with Template**
   - Load template (Simple VST, Modern Sampler, etc.)
   - Or start blank canvas

2. **Generate AI Suggestions**
   - Click "🔍 Analyze Engine & Suggest"
   - Add high-priority suggestions (master, filter, ADSR)
   - Optionally add medium/low priority

3. **Apply Auto-Layout**
   - Select hierarchical for organized look
   - Or grid for uniform appearance

4. **Choose Color Palette**
   - Pick brand/style base color
   - Select harmony (analogous for calm, complementary for vibrant)
   - Apply and verify accessibility passes AA/AAA

5. **Fine-tune Positions**
   - Use distribute horizontal/vertical for spacing
   - Use align for professional alignment
   - Manually adjust if needed

6. **Optimize**
   - Run "Optimize Widget Sizes"
   - Run "Fix Overlapping Widgets"
   - Check design stats

7. **Test in Live Preview**
   - Navigate to Test page
   - Verify all widgets render correctly
   - Test interactivity

8. **Export**
   - Export to VST/standalone
   - UI data saved to mapping.json

## Color Theory Reference

### HSL Color Space
- **Hue (H)**: 0-360° on color wheel
- **Saturation (S)**: 0-100% color intensity
- **Lightness (L)**: 0-100% brightness

### Contrast Ratios (WCAG 2.1)
- **Level AA**: 4.5:1 (normal text), 3:1 (large text, UI)
- **Level AAA**: 7:1 (normal text), 4.5:1 (large text)

### Relative Luminance Formula
```
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
```
(where R, G, B are gamma-corrected)

## Layout Algorithm Details

### Grid Layout Implementation
```javascript
const cols = Math.ceil(Math.sqrt(widgetCount));
const cellWidth = canvasWidth / cols;
const row = Math.floor(index / cols);
const col = index % cols;
x = padding + col * cellWidth;
y = padding + row * cellHeight;
```

### Radial Layout Implementation
```javascript
const angleStep = (2 * Math.PI) / widgetCount;
const angle = index * angleStep - Math.PI / 2; // Start at top
x = centerX + radius * Math.cos(angle);
y = centerY + radius * Math.sin(angle);
```

### Distribution Algorithm
```javascript
totalSpace = (lastWidget.x + lastWidget.width) - firstWidget.x;
totalWidgetSize = sum(widgets.map(w => w.width));
spacing = (totalSpace - totalWidgetSize) / (widgetCount - 1);
```

## Best Practices

### Widget Suggestions
- Always add **master volume** first (essential control)
- Add **filter cutoff** if using filters (most important filter param)
- Include **ADSR envelope** for natural sound shaping
- Add **output meter** for visual feedback
- Include **piano keyboard** for MIDI visualization

### Layout
- Use **hierarchical layout** for professional instruments
- Use **grid layout** for uniform parameter pages
- Use **radial layout** for creative/artistic designs
- Manually adjust after auto-layout for fine control

### Colors
- **Light background**: Use analogous for subtle elegance
- **Dark background**: Use complementary for bold contrast
- **Corporate branding**: Use monochromatic with brand color
- Always verify **AA accessibility** minimum

### Optimization
- Run optimization **after layout**, not before
- Fix overlaps **after manual adjustments**
- Check design stats regularly to avoid clutter

## Troubleshooting

**Q: Suggestions list is empty**  
A: Ensure `manifest.engine` has parameters defined (master, filter, adsr, etc.)

**Q: Auto-layout makes widgets too small**  
A: Run "Optimize Widget Sizes" after auto-layout

**Q: Colors fail accessibility check**  
A: Try monochromatic harmony or adjust base color lightness (30-70%)

**Q: Widgets still overlap after fix**  
A: Increase canvas size or reduce widget count

**Q: Applied palette but theme not updated**  
A: Check `manifest.ui.theme` in console, ensure manifest persistence enabled

## Future Enhancements

Planned AI features:
- **Machine learning widget suggestions** from usage patterns
- **Smart grouping** by parameter type
- **Responsive layout generation** for multiple canvas sizes
- **Animation suggestions** for interactive feedback
- **Accessibility audit** with detailed recommendations
- **Style transfer** from reference images

## See Also

- `docs/STATE_INTEGRATION.md` - Cross-page state bindings
- `docs/LIVE_PREVIEW.md` - Test page preview modes
- `docs/UI_EXPORT_FORMAT.md` - Export data structure
- `frontend/src/utils/templates.js` - Template system

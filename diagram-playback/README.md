# @tlberglund/diagram-playback

A TypeScript/JavaScript library that takes a `DiagramExport` JSON (exported from the diagram editor on timberglund.com) and an HTML canvas element, then animates the freehand strokes onto the canvas by replaying normalized stroke data. The diagram is fitted to the canvas using letterboxing; the aspect ratio of the diagram is always preserved, and the drawing is centered within the canvas bounds regardless of their respective proportions.

---

## Installation

**npm registry:**

```bash
npm install @tlberglund/diagram-playback
```

**Local file reference (monorepo or sibling package):**

```json
{
  "dependencies": {
    "@tlberglund/diagram-playback": "file:../diagram-playback"
  }
}
```

---

## Quick Start

```ts
import { DiagramAnimator } from '@tlberglund/diagram-playback';

const canvas = document.getElementById('my-canvas') as HTMLCanvasElement;
const response = await fetch('/diagrams/my-diagram.json');
const diagram = await response.json();

const animator = new DiagramAnimator(canvas, diagram);
await animator.play({ speed: 1.5, color: '#1a1a1a' });
```

---

## API Reference

### `DiagramAnimator`

The main class. Manages canvas setup, letterbox fitting, point smoothing, and frame-by-frame animation.

#### Constructor

```ts
new DiagramAnimator(canvas: HTMLCanvasElement, diagram: DiagramExport)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `canvas` | `HTMLCanvasElement` | The target canvas element. Must have non-zero CSS dimensions at the time `play()` is called. |
| `diagram` | `DiagramExport` | The parsed diagram JSON to animate. |

Throws an `Error` if a 2D rendering context cannot be obtained from the canvas.

#### `play(options?)`

```ts
play(options?: DiagramPlayOptions): Promise<void>
```

Prepares the canvas (sets physical pixel dimensions, applies device pixel ratio scaling, clears any previous content), fits the diagram into the canvas with letterboxing, and begins animation. Returns a `Promise` that resolves when the last stroke segment has been drawn.

If the canvas has zero CSS width or height, `play()` logs a warning and resolves immediately without drawing. If the diagram contains no strokes, `play()` resolves immediately.

---

### `DiagramPlayOptions`

All fields are optional. Unset fields fall back to their defaults.

```ts
interface DiagramPlayOptions {
  speed?:    number;
  color?:    string;
  minWidth?: number;
  maxWidth?: number;
  scale?:    number;
  instant?:  boolean;
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `speed` | `number` | `1.5` | Playback speed multiplier. Values greater than `1` shorten the animation; values less than `1` slow it down. Applied to both inter-point timing within a stroke and the 30 ms inter-stroke gap. |
| `color` | `string` | `'#1a1a1a'` | Stroke color. Any CSS color value is accepted. |
| `minWidth` | `number` | `1.5` | Minimum line width in CSS pixels, used when pressure is `0`. |
| `maxWidth` | `number` | `3` | Maximum line width in CSS pixels, used when pressure is `1`. Actual line width for any segment is `minWidth + pressure * (maxWidth - minWidth)`. |
| `scale` | `number` | `2` | Device pixel ratio. The canvas backing store is sized to `clientWidth * scale` by `clientHeight * scale`, then the context is scaled accordingly to keep coordinates in CSS pixels. Set to `window.devicePixelRatio` or `1` as needed. |
| `instant` | `boolean` | `false` | When `true`, all strokes are drawn synchronously in a single call with no animation delay. Resolves immediately. Useful for thumbnails or static previews. |

---

### `DiagramExport`

The shape of the JSON file produced by the diagram editor.

```ts
interface DiagramExport {
  version:     number;
  name:        string;
  aspectRatio: number;
  strokes:     NormalizedPoint[][];
}
```

| Field | Type | Description |
|-------|------|-------------|
| `version` | `number` | Format version number. |
| `name` | `string` | Human-readable name for the diagram. |
| `aspectRatio` | `number` | Width divided by height of the original drawing surface. Used to letterbox-fit the diagram into the canvas. |
| `strokes` | `NormalizedPoint[][]` | Ordered array of strokes. Each stroke is an array of points. Strokes are drawn in array order. |

---

### `NormalizedPoint`

A single captured input point within a stroke. All spatial coordinates and pressure are normalized to `[0, 1]`.

```ts
interface NormalizedPoint {
  x: number;  // [0, 1]
  y: number;  // [0, 1]
  t: number;  // timestamp in milliseconds
  p: number;  // pressure [0, 1]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number` | Horizontal position normalized to the diagram width. `0` is the left edge, `1` is the right edge. |
| `y` | `number` | Vertical position normalized to the diagram height. `0` is the top edge, `1` is the bottom edge. |
| `t` | `number` | Timestamp in milliseconds at which the point was recorded, relative to the start of its stroke. |
| `p` | `number` | Stylus or pointer pressure, normalized from `0` (lightest) to `1` (heaviest). Controls line width during rendering. |

---

## Diagram Format

A diagram JSON file is a plain object with a version, a name, an aspect ratio, and an array of strokes. Each stroke is an array of `NormalizedPoint` objects recorded in chronological order. Points within a stroke use timestamps relative to that stroke's start; the animator reconstructs global timing by accumulating stroke durations and inserting a brief gap between consecutive strokes.

Before rendering, each stroke is lightly smoothed using a weighted three-point average (endpoints are left untouched) to reduce jitter from raw input capture.

Example structure:

```json
{
  "version": 1,
  "name": "My Diagram",
  "aspectRatio": 1.7778,
  "strokes": [
    [
      { "x": 0.1, "y": 0.2, "t": 0,  "p": 0.5  },
      { "x": 0.2, "y": 0.3, "t": 16, "p": 0.6  },
      { "x": 0.3, "y": 0.25,"t": 32, "p": 0.55 }
    ]
  ]
}
```

---

## Build

All build commands use [esbuild](https://esbuild.github.io/). There is no separate bundler configuration file.

| Command | Output | Description |
|---------|--------|-------------|
| `npm run build` | `dist/diagram-animator.js` | IIFE bundle. Exposes the library as the global `DiagramPlaybackLib` for use in `<script>` tags. |
| `npm run build:esm` | `dist/diagram-animator.esm.js` | ES module bundle for use with `import` in modern environments and bundlers. |
| `npm run build:types` | `dist/index.d.ts` (and related) | TypeScript declaration files only. No JavaScript emitted. |
| `npm run watch` | `dist/diagram-animator.js` | Same as `build` but rebuilds automatically on source changes. |

**Browser (IIFE) usage:**

```html
<script src="dist/diagram-animator.js"></script>
<script>
  const { DiagramAnimator } = DiagramPlaybackLib;
  const animator = new DiagramAnimator(canvas, diagram);
  animator.play();
</script>
```

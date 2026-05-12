# @tlberglund/handwriting-playback

A browser-side handwriting animation engine. Given a GlyphSet JSON file (exported from the capture tool on timberglund.com) and an HTML canvas element, it replays captured stroke data character by character, rendering each stroke with pressure-modulated line width and authentic pen-lift timing. Optional sound effects are keyed to per-stroke geometry: the engine classifies each stroke as straight, curved, or sharp and plays the corresponding audio clip. A scribble mode kicks in automatically when the animation speed is high enough that individual stroke clips would overlap.

---

## Installation

Install from npm:

```sh
npm install @tlberglund/handwriting-playback
```

Or reference a local build directly in `package.json`:

```json
{
  "dependencies": {
    "@tlberglund/handwriting-playback": "file:../path/to/playback"
  }
}
```

---

## Quick start

```ts
import { HandwritingAnimator } from '@tlberglund/handwriting-playback';

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const glyphSet = await fetch('/glyphs/my-set.json').then(r => r.json());

const animator = new HandwritingAnimator(canvas, glyphSet);

await animator.write('Hello, world', {
  speed: 1.5,
  capHeight: 100,
  color: '#1a1a1a',
  sounds: true,          // use bundled default sound clips
});
```

When using the IIFE bundle directly in a `<script>` tag, the library is available as `HandwritingAnimatorLib`:

```html
<script src="dist/handwriting-animator.js"></script>
<script>
  const { HandwritingAnimator, defaultSounds } = HandwritingAnimatorLib;
  const animator = new HandwritingAnimator(canvas, glyphSet);
  animator.write('Hello', { sounds: true });
</script>
```

---

## API reference

### `HandwritingAnimator`

The main class. Owns one canvas and one GlyphSet for its lifetime.

#### Constructor

```ts
new HandwritingAnimator(canvas: HTMLCanvasElement, glyphSet: GlyphSet)
```

Throws if the canvas cannot produce a 2D rendering context.

#### `write(text, options?): Promise<void>`

Animates `text` onto the canvas. Returns a Promise that resolves when the last stroke segment has been drawn. If `instant` is true the Promise resolves after the single-frame synchronous render.

```ts
animator.write(text: string, options: WriteOptions = {}): Promise<void>
```

Characters missing from the GlyphSet are skipped with a console warning. When the GlyphSet contains multiple captures for the same character, the engine picks one at random, avoiding the same capture twice in a row.

If `x` and `y` are both omitted, the canvas is reset (dimensions recalculated, pixel ratio applied, previous content cleared) before drawing. When either `x` or `y` is provided the caller is responsible for canvas setup, and the engine draws into the existing canvas state at the given position. This allows multiple `write()` calls to compose independently positioned text onto a single canvas.

---

### `WriteOptions`

All fields are optional.

| Field | Type | Default | Description |
|---|---|---|---|
| `speed` | `number` | `1.5` | Playback speed multiplier applied to captured timestamps. `2.0` plays twice as fast as recorded. |
| `color` | `string` | `'#1a1a1a'` | CSS color string for all strokes. |
| `minWidth` | `number` | `2` | Stroke width in pixels at zero pressure. |
| `maxWidth` | `number` | `4` | Stroke width in pixels at full pressure. Line width for any segment is `minWidth + pressure * (maxWidth - minWidth)`. |
| `scale` | `number` | `2` | Device pixel ratio multiplier. The canvas backing store is sized to `clientWidth * scale` by `clientHeight * scale` and then scaled down via `ctx.scale`, producing sharp output on HiDPI displays. |
| `capHeight` | `number` | `80` | Height of a capital letter in CSS pixels. All glyph coordinates, widths, gaps, and offsets are expressed as multiples of this value. |
| `topPad` | `number` | `12` | CSS pixel distance from the top of the canvas to the cap-height line. Ignored when `y` is provided. |
| `letterGap` | `number` | `0.05` | Horizontal gap inserted between adjacent characters, in cap-height units. |
| `wordGap` | `number` | `0.35` | Width of a space character, in cap-height units. |
| `x` | `number` | `undefined` | CSS pixel X position of the left edge of the first character. When provided, canvas setup is skipped and the caller owns the canvas state. |
| `y` | `number` | `undefined` | CSS pixel Y position of the cap-height line. When provided, canvas setup is skipped and the caller owns the canvas state. |
| `sounds` | `SoundConfig \| true` | `undefined` | Sound clips to play during animation. Pass `true` to use the bundled `defaultSounds`. Pass a `SoundConfig` object to supply custom clips. Omit or pass `undefined` to disable audio. Sounds are suppressed when `instant` is true. |
| `instant` | `boolean` | `false` | When true, all strokes are drawn synchronously in a single frame with no animation delay and no sound. Useful for static rendering. |

---

### `SoundConfig`

Describes the set of audio clips used by the sound engine. All fields are optional arrays of MP3 URLs or data URLs.

```ts
interface SoundConfig {
  straight?: string[];   // clips for straight-line strokes
  curve?:    string[];   // clips for curved strokes
  sharp?:    string[];   // clips for sharp-angle strokes
  scribble?: string[];   // one clip plays for the full animation when strokes are too fast for per-stroke audio
  thresholds?: {
    straight: number;    // max turning angle in degrees that counts as straight (default: 15)
    sharp:    number;    // min turning angle in degrees that counts as sharp (default: 60)
  };
}
```

Stroke classification is based on the maximum turning angle across the smoothed points of each stroke. Angles below the `straight` threshold produce a `'straight'` classification; angles at or above the `sharp` threshold produce `'sharp'`; anything in between is `'curve'`.

Scribble mode activates automatically when the mean stroke duration (after applying `speed`) is less than half the duration of the shortest stroke-type clip. In that mode a single scribble clip plays for the whole animation instead of per-stroke clips.

---

### `defaultSounds`

A pre-built `SoundConfig` exported from the package. It includes four straight clips, three curve clips, two sharp clips, and two scribble clips. All clips are embedded as data URLs in the bundle at build time, so no separate audio files need to be served.

```ts
import { defaultSounds } from '@tlberglund/handwriting-playback';
```

Passing `sounds: true` to `write()` is equivalent to passing `sounds: defaultSounds`.

---

### `SoundEngine`

Handles audio buffer loading and playback via the Web Audio API. `HandwritingAnimator` constructs and manages a `SoundEngine` internally when sounds are enabled; you only need this class directly if you want to drive audio independently.

#### Constructor

```ts
new SoundEngine(ctx: AudioContext, config: SoundConfig)
```

#### `preload(): Promise<void>`

Fetches and decodes all audio clips referenced in the config. Called automatically by `write()` before animation begins.

#### `playForStroke(type: StrokeType): Promise<void>`

Plays a randomly selected clip for the given stroke type. Falls back to any available stroke-type clip if no clip for the requested type has loaded.

---

### `StrokeType`

A union type identifying the geometric character of a stroke:

```ts
type StrokeType = 'straight' | 'curve' | 'sharp';
```

Used by the stroke classifier internally and by `SoundEngine` to select the appropriate audio clip.

---

### `GlyphSet`, `ExportGlyph`, `ExportCapture`, `ExportPoint`

These types describe the JSON structure produced by the capture tool's export endpoint.

```ts
interface GlyphSet {
  version:        number;
  captureSetName: string;
  glyphs:         Record<string, ExportGlyph>;
}

interface ExportGlyph {
  character: string;
  captures:  ExportCapture[];
}

interface ExportCapture {
  id:      string;
  width:   number;           // glyph advance width in cap-height units
  strokes: ExportPoint[][];  // array of strokes; each stroke is an ordered array of points
}

interface ExportPoint {
  x: number;   // normalized: 0.0 = left edge of glyph, increases rightward
  y: number;   // normalized: 0.0 = cap-height line, 1.0 = baseline, ~1.25 = descender
  t: number;   // milliseconds from the start of the first stroke of this capture
  p: number;   // pressure, 0.0–1.0
}
```

The `glyphs` record is keyed by character or ligature string. Each glyph may have multiple captures representing different handwriting variations; the engine picks among them randomly, avoiding repeating the same capture consecutively.

---

## Glyph set format

A glyph set is a plain JSON file matching the `GlyphSet` shape above. The `version` field is a schema version integer. `captureSetName` is a human-readable label for the set. The `glyphs` object maps each character (or multi-character ligature key) to an `ExportGlyph` containing one or more `ExportCapture` records.

Each capture holds an array of strokes. A stroke is a time-ordered array of `ExportPoint` values. All spatial coordinates are normalized to cap-height units so the engine can render at any `capHeight` without rescaling the source data. The `width` field on each capture (also in cap-height units) tells the engine how far to advance the pen position after drawing the glyph; it already includes any scale adjustments baked in at export time.

Example:

```json
{
  "version": 2,
  "captureSetName": "my-hand",
  "glyphs": {
    "a": {
      "character": "a",
      "captures": [
        {
          "id": "abc123",
          "width": 0.42,
          "strokes": [
            [
              { "x": 0.1, "y": 0.3, "t": 0,   "p": 0.6 },
              { "x": 0.2, "y": 0.5, "t": 20,  "p": 0.8 },
              { "x": 0.4, "y": 0.9, "t": 45,  "p": 0.5 }
            ]
          ]
        }
      ]
    }
  }
}
```

---

## Build

The project uses [esbuild](https://esbuild.github.io/). MP3 sound files are embedded as base64 data URLs in the bundle at build time via esbuild's `--loader:.mp3=dataurl` option, so no separate audio assets need to be distributed or fetched at runtime.

```sh
# IIFE bundle — browser global: HandwritingAnimatorLib
# Output: dist/handwriting-animator.js
npm run build

# ESM bundle — use with import statements or module-aware bundlers
# Output: dist/handwriting-animator.esm.js
npm run build:esm

# TypeScript declaration files only
# Output: dist/index.d.ts (and related .d.ts files)
npm run build:types

# Watch mode — rebuilds the IIFE bundle on source changes
npm run watch
```

The IIFE bundle exposes all exports under the global `HandwritingAnimatorLib`. The ESM bundle supports named imports directly.

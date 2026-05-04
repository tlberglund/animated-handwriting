# playback

Core TypeScript engine for animating handwritten text on an HTML canvas. Consumes glyph set JSON exported from the backend and renders strokes frame-by-frame using `requestAnimationFrame`.

Most consumers should use `handwriting-react` (for React apps) or `reveal-plugin` (for Reveal.js presentations) rather than this package directly.

## Exports

- `HandwritingAnimator` — main animator class
- `GlyphSet`, `ExportGlyph`, `ExportCapture`, `ExportPoint`, `WriteOptions`, `SequencedGlyph` — types

## Build

```bash
# IIFE bundle (browser global: HandwritingAnimatorLib)
npm run build
# → dist/handwriting-animator.js

# ESM bundle
npm run build:esm
# → dist/handwriting-animator.esm.js
```

## Usage

```ts
import { HandwritingAnimator } from 'handwriting-playback';
import type { GlyphSet } from 'handwriting-playback';

const glyphSet: GlyphSet = await fetch('/api/capture-sets/my-set/export').then(r => r.json());

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
new HandwritingAnimator(canvas, glyphSet).write('Hello, world', {
  speed: 1.5,
  capHeight: 80,
  color: '#1a1a1a',
});
```

The `write` call returns immediately; animation runs asynchronously via `requestAnimationFrame`.

## Glyph set format (v2)

As of export format v2, `width` is per-capture rather than per-glyph. The `ExportGlyph` type no longer has a `width` field; each `ExportCapture` carries its own `width` (in cap-height units), which already includes any scale adjustments baked in at export time. The root object includes `"version": 2`.

```json
{
  "version": 2,
  "captureSetName": "my-hand",
  "glyphs": {
    "a": {
      "character": "a",
      "captures": [
        { "id": "...", "width": 0.42, "strokes": [[...]] }
      ]
    }
  }
}
```

Glyph set JSON files exported with v1 (where `width` was on the glyph) must be re-exported from the backend after upgrading.

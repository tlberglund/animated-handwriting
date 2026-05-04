# diagram-playback

Core TypeScript engine for animating diagrams on an HTML canvas. Consumes diagram JSON exported from the backend and renders strokes frame-by-frame using `requestAnimationFrame`.

Most consumers should use `diagram-react` (for React apps) or `reveal-plugin` (for Reveal.js presentations) rather than this package directly.

## Exports

- `DiagramAnimator` — main animator class
- `NormalizedPoint`, `DiagramExport`, `DiagramPlayOptions` — types

## Build

```bash
# IIFE bundle (browser global: DiagramPlaybackLib)
npm run build
# → dist/diagram-animator.js

# ESM bundle
npm run build:esm
# → dist/diagram-animator.esm.js
```

## Usage

```ts
import { DiagramAnimator } from 'diagram-playback';
import type { DiagramExport } from 'diagram-playback';

const diagram: DiagramExport = await fetch('/api/diagrams/my-diagram/export').then(r => r.json());

const canvas = document.querySelector('canvas') as HTMLCanvasElement;
new DiagramAnimator(canvas, diagram).play({
  speed: 1.5,
  color: '#1a1a1a',
});
```

The `play` call returns immediately; animation runs asynchronously via `requestAnimationFrame`.

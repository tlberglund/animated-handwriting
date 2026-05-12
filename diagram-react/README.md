# @tlberglund/diagram-react

React component for animated diagrams. Wraps `DiagramAnimator` from `@tlberglund/diagram-playback` (elsewhere in this repo) and renders an animated diagram on a `<canvas>` element. The canvas automatically maintains the correct aspect ratio via the CSS `aspect-ratio` property derived from the diagram data, so height is always computed by the browser from whatever width you set. Supports visibility-triggered playback (starts when the element scrolls into view via `IntersectionObserver`), mount-triggered playback, and imperative replay via a ref handle.

## Installation

```bash
npm install @tlberglund/diagram-react @tlberglund/diagram-playback react react-dom
```

## Quick start

```tsx
import { Diagram } from '@tlberglund/diagram-react';

function Architecture() {
  return (
    <Diagram
      diagram="https://example.com/my-diagram.json"
      style={{ width: '100%' }}
    />
  );
}
```

The animation starts when the element scrolls into view by default. Pass `playOn="mount"` to start immediately on mount.

## Props reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `diagram` | `string \| DiagramExport` | Yes | — | URL of a diagram JSON file, or a pre-loaded `DiagramExport` object. When a string is provided the component fetches and parses it automatically. The component renders nothing until the data is available. |
| `speed` | `number` | No | (animator default) | Drawing speed, forwarded directly to `DiagramAnimator.play()`. |
| `color` | `string` | No | (animator default) | Stroke color as any CSS color string. |
| `minWidth` | `number` | No | (animator default) | Minimum stroke width in pixels. |
| `maxWidth` | `number` | No | (animator default) | Maximum stroke width in pixels. |
| `playOn` | `'visible' \| 'mount'` | No | `'visible'` | When to start playback. `'visible'` waits until the canvas enters the viewport via `IntersectionObserver`, with an immediate fallback if `IntersectionObserver` is unavailable. `'mount'` starts as soon as the component mounts and the diagram data is ready. |
| `onComplete` | `() => void` | No | `undefined` | Callback invoked when the animation finishes drawing. |
| `onError` | `(err: Error) => void` | No | `undefined` | Callback invoked if the diagram URL fetch fails. When not provided, fetch errors are logged to `console.warn`. |
| `className` | `string` | No | `undefined` | CSS class applied directly to the `<canvas>` element. |
| `style` | `CSSProperties` | No | `undefined` | Inline styles merged onto the `<canvas>` element. The `aspect-ratio` property is always set internally from the diagram data; any `aspect-ratio` you provide will be overridden. |

Optional animator parameters (`speed`, `color`, `minWidth`, `maxWidth`) are forwarded as-is to `DiagramAnimator.play()`. Refer to the `@tlberglund/diagram-playback` documentation for their exact semantics and defaults.

The component renders nothing (`null`) until diagram data is resolved, so there is no flash of an empty canvas during a URL fetch.

## Sizing

Set the width of the canvas via `style` or `className`. Height is calculated automatically from the diagram's aspect ratio.

```tsx
// Full-width, responsive
<Diagram diagram="https://example.com/diagram.json" style={{ width: '100%' }} />

// Fixed width
<Diagram diagram="https://example.com/diagram.json" style={{ width: 800 }} />

// Tailwind
<Diagram diagram="https://example.com/diagram.json" className="w-full max-w-3xl" />
```

## Imperative handle (ref)

The component is built with `forwardRef` and exposes a `DiagramHandle`. Use this when you need to trigger or re-trigger playback programmatically rather than relying on scroll visibility or mount timing.

```ts
interface DiagramHandle {
  play(): void;
}
```

**`play()`** starts the animation immediately, cancelling any animation currently in progress. If the diagram data has not yet loaded (e.g. a URL fetch is still in flight), the call is a no-op.

```tsx
import { useRef } from 'react';
import { Diagram } from '@tlberglund/diagram-react';
import type { DiagramHandle } from '@tlberglund/diagram-react';

function Demo() {
  const ref = useRef<DiagramHandle>(null);

  return (
    <>
      <Diagram
        ref={ref}
        diagram="https://example.com/diagram.json"
        playOn="mount"
        style={{ width: '100%' }}
      />
      <button onClick={() => ref.current?.play()}>Replay</button>
    </>
  );
}
```

## Build

| Script | Output | Description |
|--------|--------|-------------|
| `npm run build` | `dist/diagram-react.esm.js` | Bundles `src/index.ts` as an ES module. `react`, `react-dom`, and `@tlberglund/diagram-playback` are externalized and must be present in the consuming project. |
| `npm run build:types` | `dist/index.d.ts` | Emits TypeScript declaration files only, no JS output. |
| `npm run watch` | `dist/diagram-react.esm.js` | Same as `build` but watches for file changes and rebuilds automatically. Useful when the package is linked into another project during local development. |

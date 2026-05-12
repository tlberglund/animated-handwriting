# @tlberglund/handwriting-react

React component for animated handwriting. Wraps `HandwritingAnimator` from `@tlberglund/handwriting-playback` and renders animated handwritten text on a `<canvas>` element. Supports visibility-triggered playback (starts when the element scrolls into view via `IntersectionObserver`), mount-triggered playback, and imperative replay via a ref handle.

## Installation

```bash
npm install @tlberglund/handwriting-react @tlberglund/handwriting-playback react react-dom
```

## Quick start

```tsx
import { Handwriting } from '@tlberglund/handwriting-react';

function Hero() {
  return (
    <Handwriting
      glyphSet="https://example.com/glyphs.json"
      text="Hello world"
      style={{ width: 600, height: 130 }}
    />
  );
}
```

The animation starts when the element scrolls into view by default. Pass `playOn="mount"` to start immediately on mount.

## Props reference

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `glyphSet` | `string \| GlyphSet` | Yes | — | URL of a glyph set JSON file, or a pre-loaded `GlyphSet` object. When a string is provided the component fetches and parses it automatically. |
| `text` | `string` | Yes | — | The text to animate. Changing this prop after the initial play triggers a replay. |
| `speed` | `number` | No | (animator default) | Drawing speed, forwarded directly to `HandwritingAnimator.write()`. |
| `color` | `string` | No | (animator default) | Stroke color as any CSS color string. |
| `capHeight` | `number` | No | (animator default) | Cap height of the rendered glyphs in canvas pixels. Controls the visual size of the lettering. |
| `topPad` | `number` | No | (animator default) | Padding above the cap line in canvas pixels. |
| `minWidth` | `number` | No | (animator default) | Minimum stroke width in pixels. |
| `maxWidth` | `number` | No | (animator default) | Maximum stroke width in pixels. |
| `letterGap` | `number` | No | (animator default) | Horizontal gap between letters, forwarded to the animator. |
| `wordGap` | `number` | No | (animator default) | Horizontal gap between words, forwarded to the animator. |
| `sounds` | `SoundConfig \| true` | No | `undefined` | Pass `true` to enable the bundled default sound clips, or a `SoundConfig` object to supply custom audio clips. When omitted the animation plays silently. |
| `playOn` | `'visible' \| 'mount'` | No | `'visible'` | When to start playback. `'visible'` waits until the canvas enters the viewport via `IntersectionObserver`, with an immediate fallback if `IntersectionObserver` is unavailable. `'mount'` starts as soon as the component mounts and the glyph data is ready. |
| `onComplete` | `() => void` | No | `undefined` | Callback invoked when the animation finishes drawing. |
| `onError` | `(err: Error) => void` | No | `undefined` | Callback invoked if the glyph set URL fetch fails. When not provided, fetch errors are logged to `console.warn`. |
| `className` | `string` | No | `undefined` | CSS class applied to the outer `<div>` wrapper. |
| `style` | `CSSProperties` | No | `undefined` | Inline styles merged onto the outer `<div>` wrapper. `position: 'relative'` is always applied internally. |

The canvas fills its wrapper `<div>` at 100% width and height. You must give the wrapper a size via `style` or `className`, otherwise the canvas will have zero dimensions and a console warning will be logged with no animation running.

Optional animator parameters (`speed`, `color`, `capHeight`, `topPad`, `minWidth`, `maxWidth`, `letterGap`, `wordGap`, `sounds`) are forwarded as-is to `HandwritingAnimator.write()`. Refer to the `@tlberglund/handwriting-playback` documentation for their exact semantics and defaults.

## Imperative handle (ref)

The component is built with `forwardRef` and exposes a `HandwritingHandle`. Use this when you need to trigger or re-trigger playback programmatically rather than relying on scroll visibility or mount timing.

```ts
interface HandwritingHandle {
  play(): void;
}
```

**`play()`** starts the animation immediately, cancelling any animation currently in progress. If the glyph data has not yet loaded (e.g. a URL fetch is still in flight), the call is a no-op.

```tsx
import { useRef } from 'react';
import { Handwriting } from '@tlberglund/handwriting-react';
import type { HandwritingHandle } from '@tlberglund/handwriting-react';

function Demo() {
  const ref = useRef<HandwritingHandle>(null);

  return (
    <>
      <Handwriting
        ref={ref}
        glyphSet="https://example.com/glyphs.json"
        text="Hello world"
        playOn="mount"
        style={{ width: 400, height: 100 }}
      />
      <button onClick={() => ref.current?.play()}>Replay</button>
    </>
  );
}
```

## Build

| Script | Output | Description |
|--------|--------|-------------|
| `npm run build` | `dist/handwriting-react.esm.js` | Bundles `src/index.ts` as an ES module. `react`, `react-dom`, and `@tlberglund/handwriting-playback` are externalized and must be present in the consuming project. |
| `npm run build:types` | `dist/index.d.ts` | Emits TypeScript declaration files only, no JS output. |
| `npm run watch` | `dist/handwriting-react.esm.js` | Same as `build` but watches for file changes and rebuilds automatically. Useful when the package is linked into another project during local development. |

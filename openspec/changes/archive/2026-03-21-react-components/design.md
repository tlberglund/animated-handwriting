## Context

Two playback engines exist as standalone TypeScript packages (`handwriting-playback`, `diagram-playback`). Both expose imperative class-based APIs (`HandwritingAnimator`, `DiagramAnimator`) that operate directly on `HTMLCanvasElement`. Using them in React requires consumers to manage canvas refs, async data loading, animation lifecycle, IntersectionObserver setup, and cleanup — all boilerplate that can be encapsulated once.

## Goals / Non-Goals

**Goals:**
- React components for both animators that work as drop-ins in any React or Next.js project
- Play-on-visible by default (IntersectionObserver, play once, disconnect); play-on-mount as override
- Imperative ref handle exposing `play()` for programmatic replay
- `onComplete` callback
- No internal data fetching — consumers load `GlyphSet` / `DiagramExport` and pass as props
- SSR-safe: no browser API calls outside effects

**Non-Goals:**
- Data fetching utilities or hooks for loading glyph sets or diagrams
- React Native support
- Bundling both components into a single package

## Decisions

### 1. Two separate packages: `handwriting-react` and `diagram-react`

Mirrors the existing playback package split. A consumer who only needs diagrams should not pull in `HandwritingAnimator`, and vice versa. Each package lists only its corresponding playback package as a dependency.

*Alternative considered:* Single `animated-handwriting-react` package exporting both. Rejected — unnecessary coupling, inconsistent with the established package structure.

### 2. Consumer is responsible for sizing `<Handwriting>`

`HandwritingAnimator` reads `canvas.clientWidth` and `canvas.clientHeight` at animation time. Rather than computing text width from glyph data or accepting explicit `width`/`height` props, the component forwards `className` and `style` to its wrapper `<div>` and renders a `<canvas>` that fills it. The zero-size guard in `HandwritingAnimator` covers the case where the consumer forgets.

*Alternative considered:* Auto-compute width from glyph widths + capHeight. Rejected — adds complexity and produces a variable-width inline-ish element that surprises consumers expecting block layout.

### 3. `<Diagram>` derives height from `aspectRatio` via CSS `aspect-ratio` property

The component sets `aspect-ratio: ${diagram.aspectRatio}` directly on the canvas. The consumer controls width via CSS; the browser computes height. By the time `play()` is called (IntersectionObserver callback or mount effect), layout is complete and `clientWidth`/`clientHeight` are non-zero.

*Alternative considered:* ResizeObserver + imperative height computation. Rejected — CSS `aspect-ratio` is universally supported and requires no JS measurement.

### 4. IntersectionObserver: play once, then disconnect (Option A)

On first intersection the observer fires `play()` and immediately disconnects. This means each component instance plays at most once per mount. If props change after the initial play, the component replays immediately (element is known to be on-screen). If props change before the first intersection, they are captured in a ref; the observer fires once when the element enters the viewport and uses the latest values.

*Alternatives considered:*
- Play on every entry (Option B) — can replay unexpectedly on scroll; rejected.
- Re-observe on prop change (Option C) — adds complexity without meaningful benefit over the immediate-replay approach; rejected.

### 5. Imperative ref handle with `play()`

Both components are wrapped with `forwardRef` and expose a `{ play(): void }` handle via `useImperativeHandle`. This enables "replay on button click" and other programmatic scenarios without requiring `playOn="mount"` and a key-reset hack.

### 6. `playOn` prop: `"visible"` | `"mount"`

`"visible"` (default) sets up the IntersectionObserver as described above. `"mount"` skips the observer and calls `play()` directly in a `useEffect`. The prop is read once at mount; changes after mount are ignored.

*Alternative considered:* Separate `autoPlay` boolean + separate `triggerOnMount` boolean. Rejected — a single enum is cleaner and less surprising.

### 7. Package structure mirrors existing packages

```
handwriting-react/
  package.json       (name: "handwriting-react")
  tsconfig.json
  src/
    Handwriting.tsx
    index.ts
  dist/              (ESM only — not IIFE; React consumers use bundlers)

diagram-react/
  package.json       (name: "diagram-react")
  tsconfig.json
  src/
    Diagram.tsx
    index.ts
  dist/
```

ESM-only build via esbuild (`--format=esm`). No IIFE needed — React consumers always have a bundler. React and react-dom are peer dependencies, not bundled.

## Risks / Trade-offs

- **SSR hydration mismatch** → Canvas is rendered as an empty element server-side; animation runs only client-side in effects. No mismatch risk since the canvas has no server-rendered content.
- **Zero-size canvas** → Both underlying animators already guard against this with console warnings. Components inherit that behavior.
- **IntersectionObserver not available** → Extremely rare (old browsers, some test environments). Fallback: if `IntersectionObserver` is undefined, behave as `playOn="mount"`.
- **Consumer forgets to set dimensions on `<Handwriting>`** → Zero-size warning from the animator; canvas renders but nothing draws. Documented in README.

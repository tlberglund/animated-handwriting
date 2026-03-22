## Why

Embedding handwriting or diagram animations in a Next.js or React site currently requires consumers to wire up canvas refs, manage IntersectionObservers, handle async cleanup, and know internal details like `capHeight` and `topPad`. Wrapping the playback engines in idiomatic React components eliminates that boilerplate and makes the animations a drop-in experience.

## What Changes

- New package `handwriting-react/` — exports a `<Handwriting>` component that wraps `HandwritingAnimator`
- New package `diagram-react/` — exports a `<Diagram>` component that wraps `DiagramAnimator`
- Both components manage canvas lifecycle, play-on-visible behavior (IntersectionObserver), and cleanup internally
- Consumer controls sizing: explicit `className`/`style` for `<Handwriting>`; width from CSS + height derived from `aspectRatio` for `<Diagram>`
- Both components accept a `playOn` prop (`"visible"` default | `"mount"`) and an `onComplete` callback
- Both components expose an imperative ref handle with a `play()` method for programmatic replay

## Capabilities

### New Capabilities

- `handwriting-react`: React component wrapping `HandwritingAnimator` — accepts a pre-loaded `GlyphSet`, text, animation options, and playback control props
- `diagram-react`: React component wrapping `DiagramAnimator` — accepts a pre-loaded `DiagramExport`, animation options, and playback control props

### Modified Capabilities

## Impact

- Two new top-level packages alongside existing `playback/`, `diagram-playback/`, and `reveal-plugin/`
- `handwriting-react` depends on `handwriting-playback`; `diagram-react` depends on `diagram-playback`
- No changes to existing packages or the backend
- Consumers are responsible for fetching `GlyphSet` / `DiagramExport` data before passing it to the components

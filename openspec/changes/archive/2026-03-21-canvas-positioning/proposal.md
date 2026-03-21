## Why

Positioning handwriting canvases in a Reveal.js presentation currently requires inline CSS (`position: absolute; left: …; top: …; width: …; height: …`) or per-canvas CSS classes — a separate styling vocabulary from the `data-*` attributes already used for animation. Authors must mentally switch between two systems to describe a single element, and canvas height must be chosen by trial-and-error relative to an opaque `capHeight` value.

## What Changes

- The plugin gains support for `data-x`, `data-y`, `data-width`, and `data-height` attributes on `[data-handwriting]` canvases.
- Values may be bare numbers (CSS pixels in the slide's logical coordinate space) or percentage strings (e.g. `"30%"`, resolved against Reveal's configured slide width/height).
- Canvas height is derived automatically from `capHeight` and `topPad` when `data-height` is absent.
- The plugin applies positional styles eagerly at `init` time — before any slide is navigated to — so there is no flash of un-positioned content.
- Canvases without `data-x`/`data-y` continue to participate in normal CSS flow unchanged; absolute and flow-positioned canvases can coexist on the same slide.

## Capabilities

### New Capabilities

- `canvas-positioning`: `data-x`, `data-y`, `data-width`, `data-height` attribute support in the Reveal.js plugin; percentage/pixel resolution; height derivation from `capHeight`/`topPad`; eager init-time style injection.

### Modified Capabilities

- `reveal-plugin`: Plugin initialization now performs an upfront scan of all canvases and injects layout styles; new positioning attributes added to the per-canvas attribute contract.

## Impact

- `reveal-plugin/src/index.ts` — new init-time positioning logic; `resolveOptions` extended; `animateCanvas` reads derived height.
- No changes to the playback engine, backend, or capture app.
- No breaking changes to existing presentations; canvases without the new attributes behave exactly as before.

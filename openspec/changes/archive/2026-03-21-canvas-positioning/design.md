## Context

The Reveal.js plugin animates `[data-handwriting]` canvases using `data-*` attributes for all animation parameters. Positioning, however, requires separate inline CSS or stylesheet rules — a different vocabulary applied to the same element. Authors must specify `width` and `height` without a clear reference point, since the visually meaningful unit is `capHeight`, not pixels.

Reveal.js renders slides inside a fixed logical viewport (default 960×700), scaled uniformly to fit the screen. Absolute positioning within that space is stable across window sizes, making it a reliable coordinate system for canvas placement.

## Goals / Non-Goals

**Goals:**
- Let authors position canvases using `data-x`, `data-y`, `data-width`, `data-height` — the same `data-*` vocabulary as animation attributes
- Accept both pixel values and percentage strings, resolved against Reveal's configured slide dimensions
- Derive canvas height from `capHeight` and `topPad` when `data-height` is absent
- Inject styles eagerly at `init` time so no positioned canvas ever appears in the wrong place
- Leave flow-positioned canvases (those without `data-x`/`data-y`) completely unchanged

**Non-Goals:**
- Auto-deriving canvas width from text content and glyph metrics (deferred; requires glyph set to be loaded)
- Any coordinate system other than the slide's top-left origin
- Centering helpers, alignment grids, or layout abstractions

## Decisions

### 1. `data-x / data-y / data-width / data-height` attribute names

These follow the existing `data-*` naming convention and map directly to CSS `left`, `top`, `width`, `height`. No new concepts to learn.

*Alternative considered*: A single `data-pos="x y w h"` shorthand. Rejected — harder to read, can't be omitted partially, no precedent in the existing attribute set.

### 2. Pixel and percentage values on the same attribute

If the value ends in `%`, resolve it against `Reveal.getConfig().width` or `.height`. Otherwise parse as a unitless number and treat as CSS pixels. The plugin calls `Reveal.getConfig()` during `init`, when those values are guaranteed to be available.

```
"30%"  →  0.30 × Reveal.getConfig().width
"240"  →  240px
```

*Alternative considered*: Pixels only. Rejected — authors who think in layout proportions (e.g. "one-third of the way down") would need to know the slide pixel dimensions.

### 3. Height derived from `capHeight` and `topPad`

When `data-height` is absent:

```
derivedHeight = topPad + capHeight * 1.5
```

The factor `1.5` covers cap-height-to-baseline (1.0) plus a descender margin (~0.3) with additional breathing room. `topPad` and `capHeight` are read from the canvas's own `data-top-pad` / `data-cap-height` attributes (with plugin-level fallbacks), so derived height is always consistent with the actual rendering parameters.

*Alternative considered*: A fixed default height. Rejected — authors would still need to manually align height to capHeight in most cases.

### 4. Eager style injection at `init` time

During `init(deck)`, the plugin iterates all `[data-handwriting]` canvases in the entire deck and injects `position: absolute; left: Xpx; top: Ypx; width: Wpx; height: Hpx` on any canvas carrying `data-x` or `data-y`. This runs once, before any `slidechanged` fires.

*Alternative considered*: Inject on first `slidechanged`. Rejected — causes a flash of content in flow position before the first navigation on the initial slide.

### 5. Flow canvases unaffected

Canvases without `data-x` or `data-y` receive no injected styles. They remain in normal CSS flow (flex, block, or whatever the author's stylesheet specifies). Flow and absolutely-positioned canvases may coexist on the same slide.

## Risks / Trade-offs

- **`data-height` derivation may not fit all glyphs** → Authors with tall ascenders or unusual cap-height values can always override with explicit `data-height`. The formula is a conservative default, not a hard constraint.
- **Percentage resolution uses Reveal's configured dimensions, not actual rendered size** → At non-standard Reveal viewport sizes the logical dimensions match the configured values (Reveal scales the whole viewport), so this is correct. Authors should think in Reveal's logical pixel space.
- **`position: absolute` requires the slide to be a positioning context** → Reveal.js slides (`<section>`) are already positioned elements (Reveal's stacking mechanism uses `position: absolute` on slides), so child absolute positioning works correctly without any additional CSS.

## Open Questions

- Should `data-x` alone (without `data-y`) be valid, defaulting the missing axis to `0`? Current plan: require both or neither; a canvas with only one axis specified stays in flow.

## ADDED Requirements

### Requirement: Single-file Reveal.js plugin distribution
The plugin SHALL be distributed as a single self-contained JavaScript file (`handwriting-reveal.js`) that bundles the `HandwritingAnimator` engine. No additional script tags SHALL be required beyond the plugin file itself.

#### Scenario: Plugin loaded via single script tag
- **WHEN** a presentation includes `<script src="handwriting-reveal.js"></script>`
- **THEN** the global `HandwritingReveal` object is available for registration with `Reveal.initialize`

---

### Requirement: Plugin-level configuration
The plugin SHALL accept configuration via the `handwriting` key in `Reveal.initialize`. The `glyphSet` property (a URL string) SHALL be required. All other properties SHALL be optional with defaults.

#### Scenario: Required glyphSet missing
- **WHEN** `Reveal.initialize` is called with the plugin but no `handwriting.glyphSet`
- **THEN** the plugin SHALL log a console error and perform no animations

#### Scenario: Optional properties use defaults
- **WHEN** `handwriting.glyphSet` is provided but `speed`, `capHeight`, and `color` are omitted
- **THEN** the plugin SHALL animate using speed `1.5`, capHeight `80`, and color `#1a1a1a`

---

### Requirement: Per-canvas attribute overrides
Each `[data-handwriting]` canvas element SHALL support `data-glyph-set`, `data-speed`, `data-cap-height`, and `data-color` attributes that override the plugin-level config for that canvas only.

#### Scenario: Per-canvas speed override
- **WHEN** a canvas has `data-speed="3.0"` and the plugin config has `speed: 1.5`
- **THEN** that canvas animates at speed `3.0`; other canvases on the same slide animate at `1.5`

#### Scenario: Per-canvas glyph set override
- **WHEN** a canvas has `data-glyph-set="./other-hand.json"` and the plugin config has `glyphSet: "./my-hand.json"`
- **THEN** that canvas uses `other-hand.json`; other canvases use `my-hand.json`

---

### Requirement: Animate non-fragment canvases on slide entry
`[data-handwriting]` canvases that are not inside a `.fragment` element and do not have the `fragment` class themselves SHALL begin animating when their slide becomes the current slide.

#### Scenario: Non-fragment canvas animates on slidechanged
- **WHEN** the user navigates to a slide containing a non-fragment `[data-handwriting]` canvas
- **THEN** the canvas begins animating immediately without any user interaction

---

### Requirement: Animate fragment canvases on fragment reveal
`[data-handwriting]` canvases that are `.fragment` elements or are children of `.fragment` elements SHALL animate when that fragment is revealed.

#### Scenario: Fragment canvas animates on fragmentshown
- **WHEN** the user reveals a fragment containing a `[data-handwriting]` canvas
- **THEN** the canvas begins animating

#### Scenario: Fragment canvas clears on fragmenthidden
- **WHEN** the user navigates backward, hiding a fragment that contains a `[data-handwriting]` canvas
- **THEN** the canvas is cleared so it will re-animate when the fragment is revealed again

---

### Requirement: Glyph set prefetching
When a slide becomes current, the plugin SHALL immediately begin fetching all glyph set URLs referenced by any `[data-handwriting]` canvas on that slide (including those inside fragments). Fetches for the same URL SHALL be deduplicated.

#### Scenario: Glyph set prefetched before fragment reveal
- **WHEN** the user navigates to a slide with a fragment canvas referencing `./hand.json`
- **THEN** `./hand.json` begins loading immediately, before the user reveals the fragment

#### Scenario: Duplicate URLs fetched only once
- **WHEN** multiple canvases on the same slide reference the same glyph set URL
- **THEN** only one HTTP request is made for that URL

---

### Requirement: Canvas sizing controlled by author
The plugin SHALL use `canvas.clientWidth` and `canvas.clientHeight` at animation time to determine the canvas pixel dimensions. The plugin SHALL NOT set or modify the canvas's CSS dimensions.

#### Scenario: Zero-size canvas warning
- **WHEN** the plugin attempts to animate a canvas whose `clientWidth` or `clientHeight` is `0`
- **THEN** the plugin SHALL log a console warning identifying the canvas and skip animation

---

### Requirement: Missing glyph set handled gracefully
If a glyph set URL fails to load, the plugin SHALL log a console error and leave the canvas blank without throwing an uncaught exception.

#### Scenario: Fetch failure leaves canvas blank
- **WHEN** the glyph set URL returns an HTTP error or is unreachable
- **THEN** the canvas remains blank and a console error identifies the failing URL

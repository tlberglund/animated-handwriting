## ADDED Requirements

### Requirement: Single-file Reveal.js plugin distribution
The plugin SHALL be distributed as a single self-contained JavaScript file (`handwriting-reveal.js`) that bundles both the `HandwritingAnimator` and `DiagramAnimator` engines. No additional script tags SHALL be required beyond the plugin file itself.

#### Scenario: Plugin loaded via single script tag
- **WHEN** a presentation includes `<script src="handwriting-reveal.js"></script>`
- **THEN** the global `HandwritingReveal` object is available for registration with `Reveal.initialize`, and both handwriting and diagram animations are available without any additional scripts

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
Each `[data-handwriting]` canvas element SHALL support `data-glyph-set`, `data-speed`, `data-cap-height`, `data-color`, `data-x`, `data-y`, `data-width`, and `data-height` attributes. Animation attributes (`data-glyph-set`, `data-speed`, `data-cap-height`, `data-color`) override the plugin-level config for that canvas only. Layout attributes (`data-x`, `data-y`, `data-width`, `data-height`) control CSS positioning and are applied at init time rather than animation time.

#### Scenario: Per-canvas speed override
- **WHEN** a canvas has `data-speed="3.0"` and the plugin config has `speed: 1.5`
- **THEN** that canvas animates at speed `3.0`; other canvases on the same slide animate at `1.5`

#### Scenario: Per-canvas glyph set override
- **WHEN** a canvas has `data-glyph-set="./other-hand.json"` and the plugin config has `glyphSet: "./my-hand.json"`
- **THEN** that canvas uses `other-hand.json`; other canvases use `my-hand.json`

#### Scenario: Per-canvas position applied at init
- **WHEN** a canvas has `data-x="200"` and `data-y="150"`
- **THEN** the plugin applies `position: absolute; left: 200px; top: 150px` to the canvas during `init`, before any slide navigation

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
The plugin SHALL use `canvas.clientWidth` and `canvas.clientHeight` at animation time to determine the canvas pixel dimensions. The plugin MAY set CSS `width` and `height` on canvases that carry `data-width` or derive a height from `capHeight`; it SHALL NOT set or modify the canvas's CSS dimensions for canvases that have neither `data-width`/`data-height` nor a position (`data-x`/`data-y`).

#### Scenario: Zero-size canvas warning
- **WHEN** the plugin attempts to animate a canvas whose `clientWidth` or `clientHeight` is `0`
- **THEN** the plugin SHALL log a console warning identifying the canvas and skip animation

#### Scenario: Unsized flow canvas left alone
- **WHEN** a canvas has no `data-x`, `data-y`, `data-width`, or `data-height`
- **THEN** the plugin does not inject any CSS dimension or position styles on that canvas

---

### Requirement: Missing glyph set handled gracefully
If a glyph set URL fails to load, the plugin SHALL log a console error and leave the canvas blank without throwing an uncaught exception.

#### Scenario: Fetch failure leaves canvas blank
- **WHEN** the glyph set URL returns an HTTP error or is unreachable
- **THEN** the canvas remains blank and a console error identifies the failing URL

---

### Requirement: Animate diagram canvases via data-diagram attribute
The plugin SHALL treat any canvas with a `data-diagram` attribute as a diagram canvas. The `data-diagram` value SHALL be a URL pointing to a diagram export JSON. The plugin SHALL fetch, cache, and animate diagram canvases using `DiagramAnimator`, applying the same slide-entry, fragment, prefetch, and clearing behavior as handwriting canvases.

#### Scenario: Non-fragment diagram animates on slide entry
- **WHEN** the user navigates to a slide containing a non-fragment canvas with `data-diagram="./arch.json"`
- **THEN** the diagram begins animating immediately

#### Scenario: Fragment diagram animates on fragment reveal
- **WHEN** a canvas with `data-diagram` has class `fragment` and the user reveals that fragment
- **THEN** the diagram animation begins

#### Scenario: Fragment diagram clears on fragmenthidden
- **WHEN** the user navigates backward past a fragment diagram canvas
- **THEN** the canvas is cleared so it re-animates on next reveal

#### Scenario: Diagram URL prefetched on slide entry
- **WHEN** the user navigates to a slide containing a `data-diagram` canvas (including inside fragments)
- **THEN** the diagram JSON begins loading immediately, before any animation is triggered

#### Scenario: Duplicate diagram URLs fetched only once
- **WHEN** multiple canvases on the same slide reference the same `data-diagram` URL
- **THEN** only one HTTP request is made for that URL

---

### Requirement: Per-canvas diagram overrides
A canvas with `data-diagram` SHALL support `data-diagram-speed` and `data-diagram-color` attributes to override the default animation speed and stroke color for that canvas only.

#### Scenario: Per-canvas speed override
- **WHEN** a canvas has `data-diagram="./arch.json"` and `data-diagram-speed="2.5"`
- **THEN** the diagram animates at speed 2.5

#### Scenario: Default speed used when no override
- **WHEN** a canvas has `data-diagram` but no `data-diagram-speed`
- **THEN** the diagram animates at the default speed (1.5)

---

### Requirement: Diagram fetch failure handled gracefully
If a diagram URL fails to load, the plugin SHALL log a console error identifying the URL and leave the canvas blank without throwing an uncaught exception.

#### Scenario: Diagram fetch failure leaves canvas blank
- **WHEN** a `data-diagram` URL returns an HTTP error or is unreachable
- **THEN** the canvas remains blank and a console error identifies the failing URL

---

### Requirement: data-x, data-y, data-width positioning applies to diagram canvases
The positional style injection applied at init time (`data-x`, `data-y`, `data-width`, `data-height`) SHALL apply equally to canvases with `data-diagram` as to canvases with `data-handwriting`.

#### Scenario: Diagram canvas positioned absolutely
- **WHEN** a canvas has both `data-diagram` and `data-x="100"` `data-y="200"`
- **THEN** the plugin injects `position: absolute; left: 100px; top: 200px` at init time

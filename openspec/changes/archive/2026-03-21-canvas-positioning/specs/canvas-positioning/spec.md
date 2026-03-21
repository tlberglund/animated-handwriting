## ADDED Requirements

### Requirement: Absolute positioning via data attributes
A `[data-handwriting]` canvas MAY carry `data-x` and `data-y` attributes to request absolute positioning within the slide. When both are present, the plugin SHALL inject `position: absolute; left: <x>px; top: <y>px` on the canvas. When neither is present, the canvas SHALL remain in normal CSS flow. Specifying only one of `data-x` or `data-y` SHALL be treated as if neither were specified (canvas remains in flow).

#### Scenario: Canvas with data-x and data-y is absolutely positioned
- **WHEN** a canvas has `data-x="200"` and `data-y="150"`
- **THEN** the plugin injects `position: absolute; left: 200px; top: 150px` on that canvas

#### Scenario: Canvas without data-x and data-y stays in flow
- **WHEN** a canvas has no `data-x` or `data-y` attribute
- **THEN** the plugin does not inject any positional styles and the canvas participates in normal CSS flow

#### Scenario: Canvas with only data-x stays in flow
- **WHEN** a canvas has `data-x` but no `data-y`
- **THEN** the plugin treats it as if neither attribute is present and the canvas stays in flow

---

### Requirement: Explicit canvas width via data-width
A `[data-handwriting]` canvas MAY carry a `data-width` attribute. When present, the plugin SHALL inject `width: <value>px` on the canvas as part of its style injection pass.

#### Scenario: data-width sets canvas CSS width
- **WHEN** a canvas has `data-width="500"`
- **THEN** the plugin injects `width: 500px` on the canvas

---

### Requirement: Canvas height derived from capHeight when not specified
When a `[data-handwriting]` canvas has `data-x` and `data-y` but no `data-height`, the plugin SHALL compute a canvas height using the formula `topPad + capHeight * 1.5`, where `topPad` and `capHeight` are resolved from the canvas's own `data-top-pad` and `data-cap-height` attributes (falling back to plugin-level config, then built-in defaults).

#### Scenario: Height derived from default capHeight and topPad
- **WHEN** a positioned canvas has no `data-height`, no `data-cap-height`, and no `data-top-pad`
- **THEN** the injected height is `12 + 80 * 1.5 = 132px`

#### Scenario: Height derived from per-canvas capHeight
- **WHEN** a positioned canvas has `data-cap-height="100"` but no `data-height`
- **THEN** the injected height is `topPad + 100 * 1.5`

#### Scenario: Explicit data-height overrides derivation
- **WHEN** a positioned canvas has `data-height="200"`
- **THEN** the plugin injects `height: 200px` regardless of capHeight

---

### Requirement: Percentage values resolved against slide dimensions
For `data-x`, `data-y`, `data-width`, and `data-height`, a value ending in `%` SHALL be resolved as a fraction of the Reveal.js configured slide width (for `data-x` and `data-width`) or height (for `data-y` and `data-height`), using `Reveal.getConfig().width` and `.height`.

#### Scenario: Percentage x resolved against slide width
- **WHEN** a canvas has `data-x="25%"` and the configured slide width is 960
- **THEN** the injected left offset is `240px`

#### Scenario: Percentage y resolved against slide height
- **WHEN** a canvas has `data-y="50%"` and the configured slide height is 700
- **THEN** the injected top offset is `350px`

#### Scenario: Bare number treated as pixels
- **WHEN** a canvas has `data-x="320"` (no % suffix)
- **THEN** the injected left offset is `320px`

---

### Requirement: Positional styles injected eagerly at init
The plugin SHALL apply positional style injection to all `[data-handwriting]` canvases in the entire deck during `init`, before any slide navigation occurs.

#### Scenario: Initial slide canvas positioned before first render
- **WHEN** the page loads and Reveal initializes
- **THEN** all positioned canvases have their `position: absolute` styles applied before the first slide is displayed, with no flash of incorrect positioning

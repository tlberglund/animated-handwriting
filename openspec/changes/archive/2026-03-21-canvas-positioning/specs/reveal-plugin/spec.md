## MODIFIED Requirements

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

### Requirement: Canvas sizing controlled by author
The plugin SHALL use `canvas.clientWidth` and `canvas.clientHeight` at animation time to determine the canvas pixel dimensions. The plugin MAY set CSS `width` and `height` on canvases that carry `data-width` or derive a height from `capHeight`; it SHALL NOT set or modify the canvas's CSS dimensions for canvases that have neither `data-width`/`data-height` nor a position (`data-x`/`data-y`).

#### Scenario: Zero-size canvas warning
- **WHEN** the plugin attempts to animate a canvas whose `clientWidth` or `clientHeight` is `0`
- **THEN** the plugin SHALL log a console warning identifying the canvas and skip animation

#### Scenario: Unsized flow canvas left alone
- **WHEN** a canvas has no `data-x`, `data-y`, `data-width`, or `data-height`
- **THEN** the plugin does not inject any CSS dimension or position styles on that canvas

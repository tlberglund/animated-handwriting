## MODIFIED Requirements

### Requirement: Plugin-level configuration
The plugin SHALL accept configuration via the `handwriting` key in `Reveal.initialize`. The `glyphSet` property (a URL string) SHALL be required. All other properties SHALL be optional with defaults. An optional `sounds` property SHALL accept a `SoundConfig` object whose clip URLs are resolved relative to the presentation's base URL. When `sounds` is provided, the plugin SHALL pass the config through to `HandwritingAnimator.write()` for all canvases that do not carry per-canvas sound overrides.

#### Scenario: Required glyphSet missing
- **WHEN** `Reveal.initialize` is called with the plugin but no `handwriting.glyphSet`
- **THEN** the plugin SHALL log a console error and perform no animations

#### Scenario: Optional properties use defaults
- **WHEN** `handwriting.glyphSet` is provided but `speed`, `capHeight`, and `color` are omitted
- **THEN** the plugin SHALL animate using speed `1.5`, capHeight `80`, and color `#1a1a1a`

#### Scenario: Plugin-level sounds forwarded to animator
- **WHEN** `handwriting.sounds` is provided with clip URLs
- **THEN** every canvas that does not override sounds receives the plugin-level SoundConfig when animated

#### Scenario: No sounds config — silent animation
- **WHEN** `handwriting.sounds` is omitted from plugin config
- **THEN** all canvases animate silently with no audio errors

---

### Requirement: Per-canvas sound attribute overrides
Each `[data-handwriting]` canvas element SHALL support a `data-sounds` attribute whose value is a JSON string conforming to `SoundConfig`. When present, it SHALL override the plugin-level `sounds` config for that canvas only. A canvas with `data-sounds="null"` or `data-sounds="false"` SHALL suppress audio even when a plugin-level sounds config is present.

#### Scenario: Per-canvas sounds override plugin-level
- **WHEN** a canvas has `data-sounds='{"straight":["./canvas-straight.mp3"]}'` and the plugin config has a different sounds config
- **THEN** that canvas uses only the per-canvas clip; other canvases use the plugin-level config

#### Scenario: Per-canvas sounds suppression
- **WHEN** a canvas has `data-sounds="null"`
- **THEN** that canvas animates silently even if plugin-level sounds are configured

#### Scenario: Invalid data-sounds JSON logged and ignored
- **WHEN** a canvas has `data-sounds="not valid json"`
- **THEN** the plugin logs a console warning and uses the plugin-level sounds config for that canvas

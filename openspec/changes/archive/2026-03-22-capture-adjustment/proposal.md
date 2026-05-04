## Why

Captured glyphs vary in how well they hit the cap-height guideline, and individual captures within a character set may need independent vertical or scale correction. There is currently no way to fix these problems after capture without re-drawing — leaving rendered text looking inconsistent regardless of how well the underlying strokes were drawn.

## What Changes

- New `capture_adjustment` table in the database storing per-capture `scale` and `y_offset` values
- New backend API endpoints to read and write per-capture adjustments
- Export format bumped to v2: `width` moves from glyph level to capture level; adjustment math baked into exported stroke coordinates and width at export time **BREAKING**
- `HandwritingAnimator` updated to read advance width from `capture.width` instead of `glyph.width` **BREAKING**
- New **Adjust** tab in the capture app with two-level character/capture selection, scale and y-offset sliders, and a static phrase preview canvas

## Capabilities

### New Capabilities

- `capture-adjustment`: Per-capture scale and vertical offset tuning stored in the database, applied at export time using baseline-anchored isotropic scaling math
- `adjustment-preview`: Static (non-animated) phrase renderer in the capture app showing all captures at once, pinning the selected capture for the character under adjustment

### Modified Capabilities

- `glyph-set-export`: Export format changes to v2 — `width` becomes per-capture; adjustment math baked into stroke coordinates before serialization
- `handwriting-playback`: Renderer reads `capture.width` for advance spacing instead of `glyph.width`

## Impact

- **Backend**: new Flyway migration, new service + routes for capture adjustments, updated `ExportService` math and output shape
- **Capture app**: new Adjust tab component, new static canvas renderer, new API calls
- **playback library**: `HandwritingAnimator` advance-width read site; `ExportCapture` and `ExportGlyph` types updated
- **handwriting-react**, **reveal-plugin**: consume the playback library — no code changes needed, but existing exported glyph set JSON files are invalid after the format change and must be re-exported
- **demo**: sample `hand.json` must be regenerated

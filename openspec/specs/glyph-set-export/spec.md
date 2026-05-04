## ADDED Requirements

### Requirement: Export capture set as downloadable JSON (GlyphSet v2 format)
The capture app SHALL provide an Export button in the top bar that downloads the current capture set as a compact (minified) JSON file in the GlyphSet v2 format produced by the `/export` endpoint. The downloaded file SHALL be named after the capture set.

#### Scenario: Export button triggers download
- **WHEN** the user clicks the Export button in the top bar
- **THEN** the browser downloads a file named `<capture-set-name>.json` containing the GlyphSet JSON with no whitespace indentation

#### Scenario: Export button only available when a capture set is selected
- **WHEN** no capture set is selected
- **THEN** the Export button SHALL be absent or disabled

#### Scenario: Export includes only glyphs with at least one capture
- **WHEN** the user exports a capture set where some glyphs have no captures
- **THEN** the downloaded JSON omits those glyphs and contains only characters that have at least one capture

#### Scenario: Export applies capture adjustments to stroke coordinates
- **WHEN** a capture has a non-default adjustment (scale ≠ 1.0 or y_offset ≠ 0.0)
- **THEN** the exported stroke coordinates for that capture reflect the adjustment math applied (baseline-anchored isotropic scale followed by y_offset translation), and the capture's width reflects the scaled advance

#### Scenario: Export uses version 2 format
- **WHEN** any capture set is exported
- **THEN** the root JSON object contains `"version": 2` and each capture entry includes a `width` field; there is no top-level `width` field on the glyph object

#### Scenario: Neutral adjustment produces identical geometry
- **WHEN** a capture has scale=1.0 and y_offset=0.0
- **THEN** the exported coordinates are identical to what v1 would have produced for that capture (modulo the structural change of width moving to capture level)

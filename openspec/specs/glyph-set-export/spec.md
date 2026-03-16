## ADDED Requirements

### Requirement: Export capture set as downloadable JSON
The capture app SHALL provide an Export button in the top bar that downloads the current capture set as a compact (minified) JSON file in the GlyphSet format produced by the `/export` endpoint. The downloaded file SHALL be named after the capture set.

#### Scenario: Export button triggers download
- **WHEN** the user clicks the Export button in the top bar
- **THEN** the browser downloads a file named `<capture-set-name>.json` containing the GlyphSet JSON with no whitespace indentation

#### Scenario: Export button only available when a capture set is selected
- **WHEN** no capture set is selected
- **THEN** the Export button SHALL be absent or disabled

#### Scenario: Export includes only glyphs with at least one capture
- **WHEN** the user exports a capture set where some glyphs have no captures
- **THEN** the downloaded JSON omits those glyphs and contains only characters that have at least one capture

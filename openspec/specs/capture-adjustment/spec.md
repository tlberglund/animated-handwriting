## ADDED Requirements

### Requirement: Per-capture adjustment storage
The system SHALL store a scale factor and y_offset for each glyph capture. Both values SHALL default to neutral (scale=1.0, y_offset=0.0). Adjustments SHALL be scoped to the capture set by inheritance — each capture belongs to a glyph which belongs to a capture set.

#### Scenario: Default adjustment values
- **WHEN** a capture exists with no adjustment record
- **THEN** the effective scale is 1.0 and the effective y_offset is 0.0

#### Scenario: Adjustment saved per capture
- **WHEN** the user sets scale=0.9 and y_offset=0.05 for capture X of character 'b'
- **THEN** those values are persisted and returned when the adjustment for that capture is fetched

#### Scenario: Adjustment does not affect other captures of the same character
- **WHEN** capture X of 'b' has scale=0.9
- **THEN** capture Y of 'b' retains its own scale (default 1.0 unless separately adjusted)

---

### Requirement: Capture adjustment API
The backend SHALL expose endpoints to read and write per-capture adjustments.

#### Scenario: Read adjustment for a capture
- **WHEN** `GET /api/capture-sets/{setId}/glyphs/{char}/captures/{captureId}/adjustment` is called
- **THEN** the response contains `{ scale, yOffset }` for that capture (returning defaults if no adjustment has been set)

#### Scenario: Write adjustment for a capture
- **WHEN** `PUT /api/capture-sets/{setId}/glyphs/{char}/captures/{captureId}/adjustment` is called with `{ scale, yOffset }`
- **THEN** the values are persisted and the updated adjustment is returned

#### Scenario: Scale out of valid range rejected
- **WHEN** a PUT is made with scale outside [0.1, 3.0]
- **THEN** the server returns 400 Bad Request

#### Scenario: y_offset out of valid range rejected
- **WHEN** a PUT is made with yOffset outside [-1.0, 1.0]
- **THEN** the server returns 400 Bad Request

---

### Requirement: Adjust tab in capture app
The capture app SHALL include an Adjust tab alongside the existing capture management tabs. The tab SHALL present a two-level selection UI: a character list on the left and capture thumbnails for the selected character across the top.

#### Scenario: Character list shows capture count
- **WHEN** the Adjust tab is opened
- **THEN** each character in the list shows how many captures it has

#### Scenario: Capture thumbnails are static renders
- **WHEN** a character is selected in the Adjust tab
- **THEN** each capture of that character is shown as a small static (non-animated) render

#### Scenario: Selecting a capture loads its adjustments
- **WHEN** the user selects capture N of character 'b'
- **THEN** the scale and y_offset sliders update to reflect the current stored values for that capture

---

### Requirement: Adjustment sliders
The Adjust tab SHALL provide a scale slider (range 0.5–1.5, default 1.0) and a y_offset slider (range −0.5–0.5, default 0.0) for the selected capture. A reset button SHALL restore both values to their defaults.

#### Scenario: Slider change triggers debounced save
- **WHEN** the user moves a slider
- **THEN** the new value is applied to the preview immediately, and a PUT to the adjustment endpoint is issued after a debounce delay of approximately 400ms

#### Scenario: Reset restores defaults
- **WHEN** the user clicks Reset
- **THEN** scale is set to 1.0 and y_offset to 0.0, the preview updates, and the reset values are saved

#### Scenario: Sliders show current values
- **WHEN** a capture with scale=0.85 and y_offset=0.1 is selected
- **THEN** the scale slider is positioned at 0.85 and the y_offset slider at 0.1

## ADDED Requirements

### Requirement: Record handwriting strokes via Pointer Events
The capture app SHALL record handwriting strokes using the browser Pointer Events API (pointerdown, pointermove, pointerup). Each recorded point SHALL include x and y pixel coordinates, pressure (0.0–1.0), and a timestamp in milliseconds relative to the first point of the first stroke of that capture session. The app SHALL use `getCoalescedEvents()` to capture high-frequency intermediate points between pointermove events.

#### Scenario: Capture a single-stroke character
- **WHEN** the user places the Apple Pencil on the canvas and lifts it once
- **THEN** one stroke is recorded with all coalesced points, each having x, y, pressure, and t values

#### Scenario: Capture a multi-stroke character
- **WHEN** the user places and lifts the Apple Pencil multiple times for one character
- **THEN** multiple strokes are recorded; pen-lift gaps are preserved implicitly via the t values between strokes

#### Scenario: Pressure data captured
- **WHEN** the user writes with varying Apple Pencil pressure
- **THEN** each point's pressure value reflects the native Apple Pencil pressure reading (not constant 0.5)

---

### Requirement: Store raw stroke data with canvas metadata
The capture app SHALL send raw pixel coordinates and canvas frame dimensions to the backend. The backend SHALL store this data in the GlyphCapture record without normalization. Canvas metadata SHALL include at minimum the pixel width and height of the capture frame, the y-position of the cap-height guideline, and the y-position of the baseline guideline.

#### Scenario: Submit a glyph capture
- **WHEN** the user accepts a capture
- **THEN** a POST is made to `/api/capture-sets/:id/glyphs/:char/captures` with strokes (array of stroke arrays of points) and canvasMeta (frame dimensions and guide positions)

#### Scenario: Capture stored in backend
- **WHEN** the backend receives a valid capture submission
- **THEN** the strokes and canvasMeta are stored as JSONB and the new capture is returned with its id and captured_at timestamp

---

### Requirement: Multiple captures per glyph
The system SHALL support storing multiple captures for each glyph, with no enforced upper limit. Users SHALL be able to add additional captures to a glyph at any time and delete individual captures.

#### Scenario: Add a second capture to a glyph
- **WHEN** a glyph already has one capture and the user records another
- **THEN** both captures are stored and both are returned when the glyph is fetched

#### Scenario: Delete a specific capture
- **WHEN** a DELETE request is made to `/api/capture-sets/:id/glyphs/:char/captures/:captureId`
- **THEN** that capture is removed; other captures for the same glyph are unaffected

---

### Requirement: Capture walkthrough UI
The capture app SHALL provide a walkthrough interface that guides the user through capturing each character in the capture set's effective character list. The UI SHALL show which character is currently being captured as a label outside the capture canvas. The capture canvas itself SHALL contain no guide letterform. The UI SHALL allow free navigation to any character in the set and SHALL NOT enforce a linear order.

#### Scenario: Label shows current character
- **WHEN** the user is capturing the character "g"
- **THEN** the label outside the capture area displays "g" (or equivalent clear identification)

#### Scenario: Navigate to a specific character
- **WHEN** the user selects a character from the character set overview
- **THEN** the capture view switches to that character without requiring sequential traversal

#### Scenario: Progress indicator
- **WHEN** the capture app is open
- **THEN** a progress indicator shows the number of characters with at least one capture out of the total effective character set (e.g., "31/84")

---

### Requirement: Capture quality indication
The capture UI SHALL visually indicate the capture quality status for each character: no captures (red), one capture (yellow), two or more captures (green). This indication SHALL be visible both in the character set overview and on the individual character capture screen.

#### Scenario: No captures indicator
- **WHEN** a character has zero captures
- **THEN** it is displayed with a red indicator in the overview and on its detail screen

#### Scenario: Sufficient captures indicator
- **WHEN** a character has two or more captures
- **THEN** it is displayed with a green indicator

---

### Requirement: Preview and accept/discard captures
After each stroke recording session, the capture app SHALL play back the captured strokes at normal speed so the user can evaluate quality. The user SHALL be able to accept the capture (sending it to the backend) or discard it (discarding locally without backend interaction).

#### Scenario: Preview before accepting
- **WHEN** the user lifts the pen after the final stroke of a character
- **THEN** the app replays the strokes on the canvas before offering accept/discard options

#### Scenario: Discard a capture
- **WHEN** the user selects discard after preview
- **THEN** the stroke data is cleared locally and no request is made to the backend

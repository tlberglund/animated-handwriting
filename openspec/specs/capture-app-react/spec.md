### Requirement: Capture set list is populated from backend
The app SHALL fetch the list of capture sets from `GET /api/capture-sets` on load and render them in a selector. No capture set data SHALL be hardcoded or assumed on the client.

#### Scenario: Sets load on startup
- **WHEN** the app first renders
- **THEN** it fetches `GET /api/capture-sets` and populates the set selector with the returned list

#### Scenario: Empty state
- **WHEN** `GET /api/capture-sets` returns an empty array
- **THEN** the selector shows a placeholder indicating no sets exist

### Requirement: Capture set creation via API
The app SHALL create new capture sets by calling `POST /api/capture-sets` and SHALL reflect the new set in the UI from the API response without requiring a page reload.

#### Scenario: Create new set
- **WHEN** the user taps "New Set" and confirms a name
- **THEN** the app calls `POST /api/capture-sets` with the given name
- **THEN** the new set appears in the selector and is selected

#### Scenario: Set selector reflects backend state after creation
- **WHEN** the create mutation completes
- **THEN** the capture sets list is refetched from the backend before the selector updates

### Requirement: Glyph list and progress populated from backend
The app SHALL fetch the glyph list via `GET /api/capture-sets/{id}/glyphs` and progress via `GET /api/capture-sets/{id}/progress` when a capture set is selected. These SHALL be the authoritative source for which characters appear, how many captures each has, and the overall completion percentage.

#### Scenario: Glyphs load on set selection
- **WHEN** the user selects a capture set
- **THEN** the app fetches `GET /api/capture-sets/{id}/glyphs` and renders the glyph picker with the returned characters and capture counts

#### Scenario: Progress bar reflects API data
- **WHEN** glyph data is loaded
- **THEN** the progress bar percentage is calculated from the `capturedCount` and `totalCount` values in `GET /api/capture-sets/{id}/progress`

### Requirement: Current character captures fetched on selection
When a character is selected for capture, the app SHALL fetch `GET /api/capture-sets/{id}/glyphs/{char}` to get the existing captures for that character. The displayed capture count and thumbnail list SHALL come from this response.

#### Scenario: Existing captures shown on character select
- **WHEN** the user selects a character to capture
- **THEN** the app fetches the character's glyph detail and displays existing captures with their delete buttons

### Requirement: New capture submitted via API and state refreshed
After the user accepts a preview, the app SHALL submit strokes via `POST /api/capture-sets/{id}/glyphs/{char}/captures` and then refresh both the per-character glyph detail and the overall progress from the backend.

#### Scenario: Successful capture submission
- **WHEN** the user accepts a capture preview
- **THEN** the app POSTs the strokes and canvas metadata to the backend
- **THEN** the glyph detail and progress are refetched and the UI reflects the updated counts

#### Scenario: Submission failure
- **WHEN** the capture POST request fails
- **THEN** the app displays an error message and returns to the capture mode without losing the drawn strokes

### Requirement: Capture deletion via API with state refresh
The app SHALL delete captures via `DELETE /api/capture-sets/{id}/glyphs/{char}/captures/{captureId}` and refresh the glyph detail and progress from the backend after a successful delete.

#### Scenario: Delete existing capture
- **WHEN** the user taps the delete button on an existing capture
- **THEN** the app calls the delete endpoint
- **THEN** the capture list and progress are updated from the backend response

### Requirement: Canvas drawing component preserves existing behavior
The stroke capture canvas SHALL use the Pointer API with multi-stroke support, pressure-mapped stroke width, and visual baselines (cap-height at 15%, baseline at 75%). Preview and playback animation SHALL behave identically to the original app.

#### Scenario: Stroke capture on touch/pointer
- **WHEN** the user draws on the canvas
- **THEN** strokes are recorded as arrays of `{x, y, t, p}` points using the Pointer API
- **THEN** the drawn stroke is rendered immediately with pressure-mapped width

#### Scenario: Preview playback
- **WHEN** the user lifts the stylus/finger after the last stroke and taps preview
- **THEN** the recorded strokes are animated back on a cleared canvas at the original timing

## ADDED Requirements

### Requirement: Diagram tab in the capture app
The capture app SHALL provide a top-level tab bar with two tabs: "Handwriting" and "Diagrams". Selecting "Diagrams" SHALL display the diagram editing view. The Handwriting tab SHALL display the existing capture workflow unchanged.

#### Scenario: Switching to Diagrams tab
- **WHEN** the user clicks the "Diagrams" tab
- **THEN** the diagram editing view is shown and the handwriting view is hidden

#### Scenario: Switching back to Handwriting tab
- **WHEN** the user clicks the "Handwriting" tab from the Diagrams view
- **THEN** the handwriting capture view is restored with its prior state

---

### Requirement: Diagram list with create and recall
The diagrams view SHALL display a list of all saved diagrams (name and creation timestamp). The list SHALL include a "+ New Diagram" button. Clicking a diagram in the list SHALL load it into the drawing canvas for editing.

#### Scenario: New diagram creation
- **WHEN** the user clicks "+ New Diagram"
- **THEN** a dialog prompts for a name and aspect ratio; on confirm the diagram is created and opened in the canvas

#### Scenario: Recalling a saved diagram
- **WHEN** the user clicks a diagram name in the list
- **THEN** its strokes are loaded into the canvas and the full undo stack is populated with all stored strokes

#### Scenario: Empty list state
- **WHEN** no diagrams have been created
- **THEN** the list shows an empty state message and only the "+ New Diagram" button

---

### Requirement: Aspect ratio set at creation and fixed
When creating a new diagram the user SHALL choose an aspect ratio from a predefined list (16:9, 4:3, 1:1, 3:2) or enter a custom width:height ratio. The aspect ratio SHALL be stored with the diagram and SHALL NOT be changeable after creation.

#### Scenario: Predefined aspect ratio selected
- **WHEN** the user selects "16:9" in the new diagram dialog
- **THEN** the canvas is sized to a 16:9 aspect ratio and that ratio is persisted with the diagram

#### Scenario: Custom aspect ratio entered
- **WHEN** the user enters "3:2" as a custom ratio
- **THEN** the canvas reflects a 3:2 aspect and the stored aspectRatio is 1.5

---

### Requirement: Real-time stroke capture on diagram canvas
The diagram canvas SHALL capture Pencil and pointer strokes in real time using the same pointer event model as the character capture canvas (pointerdown/pointermove/pointerup, touch filtering, coalesced events). Strokes SHALL be normalized to [0,1] coordinates (x ÷ canvasWidth, y ÷ canvasHeight) before being added to the undo stack.

#### Scenario: Stroke captured and normalized
- **WHEN** the user draws a stroke from pixel (100, 50) on a 400×300 canvas
- **THEN** the stroke is stored with x ≈ 0.25, y ≈ 0.167 in the undo stack

#### Scenario: Touch events ignored
- **WHEN** a touch (pointerType "touch") event occurs on the canvas
- **THEN** no stroke is recorded (palm rejection)

---

### Requirement: Full undo/redo across all strokes
The diagram canvas SHALL maintain a single undo stack containing all strokes — both those loaded from the server on recall and those drawn in the current session. Undo SHALL remove the most recent stroke and redraw; redo SHALL restore it. Drawing a new stroke SHALL clear the redo stack.

#### Scenario: Undo removes the last stroke
- **WHEN** the canvas has three strokes and the user activates Undo
- **THEN** the third stroke is removed and the canvas redraws showing two strokes

#### Scenario: Redo restores an undone stroke
- **WHEN** the user has undone a stroke and then activates Redo
- **THEN** the stroke is restored to the canvas

#### Scenario: New stroke clears redo stack
- **WHEN** the user has undone a stroke and then draws a new stroke
- **THEN** the redo stack is cleared and Redo is no longer available

#### Scenario: Undo applies to previously saved strokes
- **WHEN** a diagram with five saved strokes is recalled and the user activates Undo five times
- **THEN** all five strokes are removed from the canvas (the undo stack contains all loaded strokes)

---

### Requirement: Save replaces diagram strokes
Saving a diagram SHALL send the full current undo stack as the new stroke array to the server (PUT /api/diagrams/:id), replacing whatever was previously stored. The diagram's `updatedAt` timestamp SHALL be updated.

#### Scenario: Save after adding strokes
- **WHEN** the user draws new strokes on a recalled diagram and clicks Save
- **THEN** the server stores the combined array of previous and new strokes

#### Scenario: Save with zero strokes requires confirmation
- **WHEN** the undo stack is empty (all strokes undone) and the user clicks Save
- **THEN** the app presents a confirmation dialog warning that the diagram will be saved empty before proceeding

---

### Requirement: Diagram backend CRUD
The backend SHALL expose the following routes under `/api/diagrams`:
- `GET /api/diagrams` — list all diagrams (id, name, aspectRatio, createdAt, updatedAt); no strokes in list response
- `POST /api/diagrams` — create diagram with `{ name, aspectRatio }`; returns full diagram with empty strokes
- `GET /api/diagrams/:id` — get diagram including strokes
- `PUT /api/diagrams/:id` — update `{ name?, strokes? }` (full replacement for strokes); returns updated diagram
- `DELETE /api/diagrams/:id` — delete diagram
- `GET /api/diagrams/:id/export` — return export JSON `{ version, name, aspectRatio, strokes }`

#### Scenario: List returns no strokes
- **WHEN** GET /api/diagrams is called
- **THEN** each item in the response contains id, name, aspectRatio, createdAt, updatedAt but no strokes array

#### Scenario: Export returns normalized strokes
- **WHEN** GET /api/diagrams/:id/export is called
- **THEN** the response contains version, name, aspectRatio, and strokes already in [0,1] normalized form

#### Scenario: Diagram not found
- **WHEN** GET, PUT, or DELETE is called with an id that does not exist
- **THEN** the server responds with 404

## ADDED Requirements

### Requirement: Create and manage capture sets
The system SHALL allow users to create named capture sets representing a person's handwriting style. Each capture set SHALL have a name, an optional description, and a creation timestamp. Users SHALL be able to list, view, update, and delete capture sets.

#### Scenario: Create a capture set
- **WHEN** a POST request is made to `/api/capture-sets` with a valid name
- **THEN** a new capture set is created and returned with a generated UUID and creation timestamp

#### Scenario: List all capture sets
- **WHEN** a GET request is made to `/api/capture-sets`
- **THEN** all capture sets are returned with their id, name, description, and created_at

#### Scenario: Delete a capture set
- **WHEN** a DELETE request is made to `/api/capture-sets/:id`
- **THEN** the capture set and all associated glyphs and captures are deleted

---

### Requirement: Global canonical character set
The system SHALL maintain a global seed of character definitions representing the target capture set for all handwriting. This seed SHALL include lowercase a–z (26), uppercase A–Z (26), digits 0–9 (10), common punctuation (. , ! ? - : ; ' " ( ) /, totaling 12), and approximately 20 common English ligatures: th, sh, ch, wh, ing, tion, er, re, ll, tt, ff, ck, st, nd, nt, le, ly, or, ph, sp.

#### Scenario: Fresh capture set targets full character set
- **WHEN** a new capture set is created with no overrides
- **THEN** its effective character set contains all globally seeded characters

#### Scenario: Global seed present at startup
- **WHEN** the backend application starts
- **THEN** all canonical character definitions are present in the database (idempotent seeding)

---

### Requirement: Per-capture-set character overrides
Each capture set SHALL support an override list of additions and exclusions from the global character set. Additions define characters not in the global set. Exclusions remove characters the user does not wish to capture for that set.

#### Scenario: Exclude a character from a capture set
- **WHEN** a capture set is configured to exclude the character "X"
- **THEN** "X" does not appear in that set's effective character list or progress tracking

#### Scenario: Add a custom character to a capture set
- **WHEN** a capture set is configured to include a character not in the global set
- **THEN** that character appears in the set's effective character list and progress tracking

---

### Requirement: Capture set progress reporting
The system SHALL provide a progress endpoint for each capture set that returns the effective character set, how many glyphs have at least one capture, the next uncaptured character, and a breakdown by glyph type.

#### Scenario: Progress on an empty capture set
- **WHEN** a GET request is made to `/api/capture-sets/:id/progress` for a set with no captures
- **THEN** the response includes total count, 0 captured, and the first character in walkthrough order as nextUncaptured

#### Scenario: Progress with some captures
- **WHEN** some glyphs have captures and others do not
- **THEN** the response accurately reflects captured count, remaining count, and the next uncaptured character in walkthrough order

---

### Requirement: Glyph capture export
The system SHALL provide an export endpoint that returns a single JSON document containing all glyph capture data for a capture set, suitable for use by the playback engine with no further backend calls.

#### Scenario: Export a complete capture set
- **WHEN** a GET request is made to `/api/capture-sets/:id/export`
- **THEN** the response is a JSON document with all glyphs, their captures, normalized stroke coordinates, and glyph width metadata

#### Scenario: Export with missing glyphs
- **WHEN** some characters have no captures
- **THEN** those characters are omitted from the export without error

## ADDED Requirements

### Requirement: Static phrase preview renderer
The capture app SHALL include a static (non-animated) canvas renderer that draws all strokes of a complete phrase in a single synchronous pass. This renderer SHALL be separate from the `HandwritingAnimator` and SHALL NOT use `requestAnimationFrame` or any timing machinery.

#### Scenario: All strokes drawn immediately
- **WHEN** the static renderer is called with a glyph set and a phrase
- **THEN** the complete phrase appears on the canvas without animation or delay

#### Scenario: Renderer accepts provisional adjustments
- **WHEN** provisional scale and y_offset values are passed to the renderer
- **THEN** those adjustments are applied to the target capture's stroke coordinates before drawing, without requiring a backend round-trip

---

### Requirement: Phrase preview in Adjust tab
The Adjust tab SHALL display a static phrase preview canvas below the adjustment controls. The preview SHALL use a default phrase ("The quick brown fox jumps over a lazy dog") which the user can replace with any custom text via an editable input field.

#### Scenario: Default phrase shown on tab open
- **WHEN** the Adjust tab is opened
- **THEN** the preview canvas shows the default phrase rendered statically using the current glyph set

#### Scenario: Custom phrase updates preview
- **WHEN** the user edits the phrase input field
- **THEN** the preview canvas re-renders with the new phrase

---

### Requirement: Selected capture pinned in preview
When a capture is selected for adjustment, the preview SHALL always render that specific capture for every occurrence of its character in the phrase, regardless of how many captures that character has. All other characters in the phrase SHALL use randomly selected captures.

#### Scenario: Selected capture shown for all occurrences of its character
- **WHEN** capture 2 of 'o' is selected and the phrase contains three instances of 'o'
- **THEN** all three 'o' glyphs in the preview use capture 2

#### Scenario: Other characters use random captures
- **WHEN** capture 2 of 'o' is selected
- **THEN** all other characters in the preview phrase use randomly selected captures (not pinned)

---

### Requirement: Preview reflects provisional adjustments immediately
The phrase preview SHALL update in real time as the user moves the adjustment sliders, applying the current slider values to the selected capture before re-rendering. The update SHALL not require a save or backend round-trip.

#### Scenario: Scale slider change reflected in preview
- **WHEN** the user moves the scale slider to 0.8
- **THEN** the preview immediately redraws the selected capture at 0.8 scale, baseline-anchored, isotropically

#### Scenario: y_offset slider change reflected in preview
- **WHEN** the user moves the y_offset slider to 0.1
- **THEN** the preview immediately redraws with the selected capture shifted down by 0.1 cap-height units

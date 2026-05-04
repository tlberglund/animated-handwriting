## MODIFIED Requirements

### Requirement: Glyph layout and spacing
The playback engine SHALL lay out glyphs sequentially left-to-right, accumulating x-offsets based on each **capture's** normalized width. It SHALL apply configurable inter-letter and inter-word gaps (as fractions of cap-height). The effective width used for advance SHALL be read from the selected capture, not from a glyph-level field.

#### Scenario: Letter spacing accumulates correctly
- **WHEN** rendering "ab"
- **THEN** "b" starts immediately after "a" plus the inter-letter gap, with no overlap

#### Scenario: Word gap applied at spaces
- **WHEN** the input contains a space character
- **THEN** a gap larger than the inter-letter gap is inserted between the preceding and following glyphs

#### Scenario: Advance width read from capture
- **WHEN** two captures of 'b' have widths 0.48 and 0.41 (due to differing adjustments)
- **THEN** the advance spacing after 'b' matches the width of whichever capture was selected, not a shared glyph-level value

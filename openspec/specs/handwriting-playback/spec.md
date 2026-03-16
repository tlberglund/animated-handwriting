## ADDED Requirements

### Requirement: Playback engine public API
The playback engine SHALL expose a class-based API that accepts an HTML canvas element and an exported glyph set JSON object. It SHALL provide a `write(text, options)` method that animates the given string on the canvas. The `options` parameter SHALL accept at minimum a `speed` multiplier (default 1.5), a `color` value, a `capHeight` value in CSS pixels (default 80), and a `scale` value for pixel density (default 2).

The engine's built output SHALL be available as both an IIFE bundle (`handwriting-animator.js`, global name `HandwritingAnimatorLib`) and an ESM module (`handwriting-animator.esm.js`). The demo page (`demo/index.html`) SHALL reference the IIFE bundle from `../playback/dist/handwriting-animator.js` rather than inlining engine code.

#### Scenario: Instantiate and animate
- **WHEN** `new HandwritingAnimator(canvasEl, glyphData).write("Hello", { speed: 1.5 })` is called
- **THEN** the string "Hello" is animated on the canvas using the captured glyph data

#### Scenario: Speed multiplier adjusts animation pace
- **WHEN** `write` is called with `{ speed: 2.0 }` vs `{ speed: 1.0 }`
- **THEN** the 2.0 animation completes in half the wall-clock time of the 1.0 animation, preserving relative timing proportions within each stroke

#### Scenario: Demo uses built engine file
- **WHEN** `demo/index.html` is opened after running `npm run build` in `playback/`
- **THEN** the demo loads the engine from `../playback/dist/handwriting-animator.js` and operates correctly with no inline engine code present in the HTML

---

### Requirement: Ligature substitution
Before rendering, the playback engine SHALL scan the input string left-to-right and substitute the longest matching ligature available in the loaded glyph set at each position. Single characters are used as fallback when no ligature matches.

#### Scenario: Longest-match ligature substitution
- **WHEN** the input is "thing" and both "th" and "ing" are available ligatures
- **THEN** the rendering sequence is ["th", "ing"] not ["t", "h", "i", "ng"] or ["th", "i", "n", "g"]

#### Scenario: Partial ligature availability
- **WHEN** the input is "the" and "th" is a ligature but "the" is not
- **THEN** the rendering sequence is ["th", "e"]

#### Scenario: No ligature match
- **WHEN** a character pair has no ligature in the glyph set
- **THEN** each character is rendered individually

---

### Requirement: Random capture variant selection
For each glyph in the rendering sequence, the playback engine SHALL select one of the available GlyphCapture variants at random. For consecutive identical glyphs (e.g., "ll"), the engine SHALL not reuse the same variant for both.

#### Scenario: Random variant chosen per glyph
- **WHEN** the glyph "a" has three captures
- **THEN** each time "a" appears in animated text, one of the three captures is chosen (with appropriate randomness across multiple runs)

#### Scenario: No variant repeat for consecutive identical glyphs
- **WHEN** the input contains "ll" and "l" has multiple captures
- **THEN** the two "l" glyphs use different captures

#### Scenario: Single capture available
- **WHEN** a glyph has only one capture
- **THEN** that capture is always used (no error)

---

### Requirement: Coordinate normalization at render time
The playback engine SHALL normalize raw captured pixel coordinates using the canvas metadata stored in each GlyphCapture. The normalized coordinate system SHALL use y=0.0 at cap height, y=1.0 at baseline, and x=0.0 at the left edge of the glyph bounding box scaled proportionally. Normalization SHALL be applied before layout calculations.

#### Scenario: Coordinates normalized to cap-height system
- **WHEN** a glyph capture is rendered
- **THEN** its strokes are positioned using normalized coordinates mapped to the current canvas render scale, not the original capture pixel dimensions

---

### Requirement: Glyph layout and spacing
The playback engine SHALL lay out glyphs sequentially left-to-right, accumulating x-offsets based on each glyph's normalized width. It SHALL apply configurable inter-letter and inter-word gaps (as fractions of cap-height). The effective width of each glyph SHALL be derived from its bounding box in normalized coordinates.

#### Scenario: Letter spacing accumulates correctly
- **WHEN** rendering "ab"
- **THEN** "b" starts immediately after "a" plus the inter-letter gap, with no overlap

#### Scenario: Word gap applied at spaces
- **WHEN** the input contains a space character
- **THEN** a gap larger than the inter-letter gap is inserted between the preceding and following glyphs

---

### Requirement: Pressure-driven stroke width
The playback engine SHALL vary the canvas line width for each segment based on the pressure value stored in the point data. The minimum and maximum stroke width SHALL be configurable (defaults: 2px min, 4px max). Pressure SHALL map linearly to this range.

#### Scenario: High-pressure segment is wider
- **WHEN** a point has pressure 1.0 and the max width is 4px
- **THEN** that segment is rendered at 4px width

#### Scenario: Low-pressure segment is narrower
- **WHEN** a point has pressure 0.0 and the min width is 2px
- **THEN** that segment is rendered at 2px width

---

### Requirement: Smooth stroke rendering
The playback engine SHALL apply lightweight point smoothing (Catmull-Rom interpolation or equivalent neighbor averaging) to reduce jitter from raw captured points. Smoothing SHALL NOT alter the timing data — only the x/y positions are smoothed.

#### Scenario: Smoothing applied to positions only
- **WHEN** a stroke is rendered
- **THEN** the visual path appears smooth without sharp jitter, and the animation timing matches captured timestamps scaled by the speed multiplier

---

### Requirement: Fallback for missing glyphs
If the input string contains a character with no captures in the loaded glyph set, the playback engine SHALL skip it silently and log a console warning identifying the missing character.

#### Scenario: Missing glyph skipped
- **WHEN** the input contains a character not present in the glyph set
- **THEN** that character is omitted from the animation and a console warning is emitted; other characters render normally

---

### Requirement: Render scale parameter
The playback engine SHALL accept a `scale` option (default 2) controlling the canvas pixel density relative to its CSS size, enabling high-resolution output suitable for screen capture.

#### Scenario: Scale 2 produces double-resolution canvas
- **WHEN** the canvas CSS size is 800×400 and scale is 2
- **THEN** the canvas pixel dimensions are set to 1600×800 before rendering begins

## ADDED Requirements

### Requirement: HandwritingLayout class
The library SHALL export a `HandwritingLayout` class. An instance holds a frozen `SequencedGlyph[]` (capture selection resolved at construction time) and a `width` property expressing the total advance width of the laid-out text in cap-height units. Once constructed, the layout is immutable — the same captures are used on every render.

#### Scenario: Layout created from string
- **WHEN** `prepareLayout(glyphSet, "Hello")` is called
- **THEN** a `HandwritingLayout` is returned whose `sequence` contains one `SequencedGlyph` per non-space token with a specific `ExportCapture` already chosen

#### Scenario: Layout width reflects total advance
- **WHEN** `prepareLayout(glyphSet, "ab")` is called
- **THEN** `layout.width` equals the sum of both captures' widths plus the inter-letter gap

#### Scenario: Repeated renders use identical captures
- **WHEN** `animator.write(layout, { x: 0, y: 0 })` is called twice
- **THEN** both renders draw the same capture for each glyph with no re-randomization

---

### Requirement: prepareLayout standalone function
The library SHALL export a `prepareLayout(glyphSet, text, opts?)` function that constructs a `HandwritingLayout` without requiring a `HandwritingAnimator` instance or an HTML canvas element. This allows layouts to be created in environments where a canvas is not yet available (e.g., during scene-graph construction).

#### Scenario: Layout created without animator
- **WHEN** `prepareLayout(glyphSet, "Hello")` is called with no animator
- **THEN** a valid `HandwritingLayout` is returned with captures resolved from the supplied glyph set

#### Scenario: Layout options control spacing
- **WHEN** `prepareLayout(glyphSet, "ab", { letterGap: 0.1 })` is called
- **THEN** `layout.sequence[1].xOffset` reflects the 0.1 cap-height-unit gap rather than the default 0.05

---

### Requirement: HandwritingLayoutOptions type
The library SHALL export a `HandwritingLayoutOptions` type containing only the fields that affect layout geometry: `letterGap` (cap-height units, default 0.05) and `wordGap` (cap-height units, default 0.35). Render-time fields (color, capHeight, speed, etc.) SHALL NOT appear in this type.

#### Scenario: Layout options are a strict subset of WriteOptions
- **WHEN** a caller passes only `{ letterGap: 0.08 }` to `prepareLayout`
- **THEN** the layout is constructed successfully and the spacing reflects the supplied value

---

### Requirement: HandwritingAnimator.prepare convenience method
`HandwritingAnimator` SHALL expose a `prepare(text, opts?)` instance method that delegates to `prepareLayout(this.glyphSet, text, opts)` and returns the resulting `HandwritingLayout`. It is a pure convenience wrapper; behavior SHALL be identical to calling `prepareLayout` directly with the animator's glyph set.

#### Scenario: prepare delegates to prepareLayout
- **WHEN** `animator.prepare("Hello", { letterGap: 0.05 })` is called
- **THEN** the returned layout is equivalent to `prepareLayout(glyphSet, "Hello", { letterGap: 0.05 })` using the animator's glyph set

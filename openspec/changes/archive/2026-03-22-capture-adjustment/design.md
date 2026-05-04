## Context

The capture pipeline stores raw pointer coordinates plus canvas metadata (capHeightY, baselineY). The export service normalizes these to a [0,1] coordinate system and serializes them as JSON. The playback engine consumes that JSON and renders glyphs at a configurable `capHeight` in CSS pixels.

Currently, glyph advance width is stored at the glyph level as the maximum width across all captures. There is no mechanism to correct individual captures that were drawn too short, too tall, or misaligned relative to the baseline.

## Goals / Non-Goals

**Goals:**
- Store per-capture scale and y_offset adjustments in the database
- Apply adjustments at export time using baseline-anchored isotropic math so the renderer requires no changes beyond a single read-site update
- Version the export format to v2 to reflect the structural change (width moves to capture level)
- Add an Adjust tab to the capture app for interactive per-capture tuning with a static phrase preview

**Non-Goals:**
- Pair kerning (left/right character pair → spacing delta) — separate future change
- Per-capture x-offset or horizontal shift
- Runtime adjustment (renderer does not read adjustments; they are baked in at export)
- Animated preview in the Adjust tab

## Decisions

### 1. Adjustments baked into export, not applied at render time

**Decision:** `ExportService` applies `scale` and `y_offset` to stroke coordinates and recomputes `width` before serialization. The renderer receives only final coordinates.

**Rationale:** Keeps the renderer simple and dependency-free. Export JSON is the canonical, portable format — it works in the reveal plugin, the React component, and future consumers without any of them needing adjustment logic.

**Alternative considered:** Pass adjustments as metadata in the export JSON and let the renderer apply them. Rejected because it leaks domain knowledge (capture tuning) into every consumer.

### 2. Width moves from glyph level to capture level (export v2)

**Decision:** `ExportGlyph` no longer has a top-level `width`. Each `ExportCapture` has its own `width`, which is `(maxX - minX) * scale * adjustment.scale` after applying the adjustment.

**Rationale:** Scale adjustments change the horizontal extent of a capture. Using a single glyph-level width (the old maximum) would produce incorrect advance spacing for scaled-down captures. Per-capture width is the only correct model once scale is per-capture.

**Alternative considered:** Keep glyph-level width as a pre-computed max. Rejected because scaled captures would advance by the wrong amount.

**Migration:** Any existing exported `.json` glyph set files are invalid under v2. Consumers must re-export from the backend after this change ships. The `version` field in the export root increments from `1` to `2` to make this detectable.

### 3. Baseline-anchored isotropic scaling

**Decision:** Scale is applied isotropically (x and y by the same factor `s`), anchored at the baseline (y=1.0):

```
new_x     = old_x × s
new_y     = 1.0 - (1.0 - old_y) × s  +  y_offset
new_width = old_width × s
```

**Rationale:** Isotropic scaling preserves letter proportions. Baseline anchoring means a letter scaled down stays grounded on the writing line rather than floating upward. `y_offset` is additive after scaling so it shifts the entire result uniformly.

**Alternative considered:** Scale y only (non-isotropic). Rejected because it distorts the aspect ratio of the letterform.

### 4. Static phrase renderer in the capture app

**Decision:** A new lightweight synchronous canvas renderer is added to the capture app. It draws all strokes in a single pass (no animation machinery, no `requestAnimationFrame`). It is not derived from `HandwritingAnimator`.

**Rationale:** The Adjust tab needs an instantaneous, static render. Reusing `HandwritingAnimator` would require driving it with a synthetic speed=Infinity or similar hack, and would pull in the full timing pipeline for a purpose it was not designed for. A purpose-built 50-line static renderer is simpler and has no risk of timing artifacts.

**Adjustment application in preview:** The capture app applies provisional adjustment values (from slider state, not yet saved) directly to stroke coordinates before passing them to the static renderer. This gives immediate visual feedback without a round-trip to the backend.

### 5. Debounced save to backend

**Decision:** Slider changes trigger a debounced `PUT /api/capture-sets/{setId}/glyphs/{char}/captures/{captureId}/adjustment` at ~400ms after the last change.

**Rationale:** Saves adjustments persistently without spamming the backend on every slider tick. The UI shows provisional (unsaved) state immediately while the debounced write trails behind.

## Risks / Trade-offs

- **Breaking export format** → All existing exported glyph set JSON files must be re-exported. The `version` field enables consumers to detect stale files. No automatic migration path for files already distributed outside the system.
- **Renderer read-site change** → `HandwritingAnimator` must change `glyph.width` to `capture.width`. Low risk (single line), but requires coordinated release with updated export JSON.
- **Provisional vs. saved state divergence** → If the user adjusts sliders and closes the tab before the debounce fires, the last change is lost. Acceptable for a tuning tool; could be addressed with a "save" button if it becomes a problem.

## Migration Plan

1. Deploy backend with new Flyway migration (adds `capture_adjustment` table) and v2 export endpoint
2. Deploy updated `playback` library (reads `capture.width`)
3. Re-export all capture sets from the capture app to regenerate JSON files
4. Deploy updated `handwriting-react`, `reveal-plugin`, and any consumer apps with the new JSON files

Rollback: revert to v1 export endpoint; existing exported files remain valid. The `capture_adjustment` table can be left in place harmlessly.

## Open Questions

- Should the Adjust tab show a visual indicator (e.g., asterisk, dot) on characters or captures that have non-default adjustments applied?
- Should `y_offset` be displayed in the UI as a raw normalized value (e.g., −0.10) or as a percentage of cap height?

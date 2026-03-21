## Context

The capture app today handles one kind of content: strokes for individual characters, organized into named capture sets. The playback engine (`playback/`) renders those strokes on a canvas by mapping normalized cap-height coordinates into pixel space. The Reveal.js plugin (`reveal-plugin/`) wires the playback engine to slide canvases.

Diagrams are a fundamentally different content type: free-form multi-stroke drawings that span a full canvas, with no character taxonomy, no cap-height reference frame, and an additive editing model where a drawing can be extended across multiple sessions. The stroke capture mechanics (pointer events, pressure, timing) are identical, but everything around them — data model, normalization, UI, playback — is new.

## Goals / Non-Goals

**Goals:**
- Flat list of named diagrams stored in a new backend table; no collection hierarchy
- Drawing canvas with configurable aspect ratio set at creation and fixed thereafter
- Full undo/redo stack across all strokes, including those from previous sessions
- Save = full stroke-array replacement (not append); the undo stack IS the authoritative state
- Strokes normalized to [0,1] at capture time; aspect ratio stored alongside strokes
- `DiagramAnimator` in its own `diagram-playback/` package; standalone API independent of Reveal.js
- Letterboxed playback: uniform scale to fit canvas while preserving aspect ratio
- Reveal.js plugin extended to handle `data-diagram` canvases, bundling `DiagramAnimator`

**Non-Goals:**
- Diagram collections or folders (deferred)
- Diagram list thumbnails / previews (deferred)
- Per-stroke color or width variation in the editor (deferred)
- Collaborative or multi-user editing
- SVG export (JSON export only, to match glyph-set pattern)

## Decisions

### 1. Separate `diagram` table; no reuse of glyph/glyph_capture

The `glyph_capture` table stores raw pixel coordinates with a `canvasMeta` blob for later normalization, and is scoped under a `capture_set → glyph` hierarchy built around a character taxonomy. None of this applies to diagrams. Reusing it would require stripping away the taxonomy and inverting the normalization timing — more complexity than a clean new table.

**New table:**
```sql
diagram (
  id           UUID PRIMARY KEY,
  name         TEXT NOT NULL,
  aspect_ratio REAL NOT NULL,
  strokes      TEXT NOT NULL DEFAULT '[]',  -- JSON: [[{x,y,t,p},...],...]
  created_at   TIMESTAMP NOT NULL,
  updated_at   TIMESTAMP NOT NULL
)
```

`strokes` is stored already normalized (x ÷ canvasW, y ÷ canvasH), so the export endpoint is a near-trivial read. `updated_at` is stamped on every save.

### 2. Normalize at capture time, not export time

Glyph captures store raw pixels and normalize at export time (using `canvasMeta`) because the normalization reference (cap-height) is not known until playback. For diagrams the reference is simply the canvas dimensions at draw time, which are available immediately. Normalizing at capture time eliminates `canvasMeta` from the diagram model entirely and makes the export format self-contained.

*Alternative considered:* store raw pixels + canvasMeta, normalize at export like glyphs do. Rejected — adds machinery with no benefit; the diagram's natural coordinate space is the canvas.

### 3. Full undo/redo via single in-memory stack

When a diagram is opened for editing, all existing strokes are loaded into the undo stack. New strokes are pushed onto the same stack. Undo pops; redo re-pushes. Save writes the entire undo stack to the server as a full replacement. This is the simplest model that satisfies the "undo across previous sessions" requirement without any server-side session concept.

*Risk:* A user could undo everything and accidentally save an empty diagram. Mitigate with a confirmation dialog when saving 0 strokes.

*Alternative considered:* Session-scoped undo (new strokes only). Rejected — user explicitly requested full undo across all strokes.

*Alternative considered:* Append-only sessions table. Rejected — adds schema complexity with no clear benefit given the full-replacement save model.

### 4. Separate `diagram-playback/` package

`DiagramAnimator` lives in its own esbuild package (`diagram-playback/`) rather than alongside `HandwritingAnimator` in `playback/`. This lets users who only need diagram playback take a smaller dependency. The Reveal.js plugin imports from both packages; esbuild bundles them together into `handwriting-reveal.js`.

*Alternative considered:* Add `DiagramAnimator` to `playback/`. Rejected — the two animators have unrelated APIs and different use-case audiences; separate packages keep each focused.

### 5. Letterboxed playback for aspect ratio preservation

`DiagramAnimator.play()` computes a fit rectangle at call time:

```
if canvasAspect > diagramAspect:
    renderH = canvas.clientHeight
    renderW = renderH × diagramAspect
    offsetX = (canvas.clientWidth - renderW) / 2
    offsetY = 0
else:
    renderW = canvas.clientWidth
    renderH = renderW / diagramAspect
    offsetX = 0
    offsetY = (canvas.clientHeight - renderH) / 2

screenX = offsetX + pt.x × renderW
screenY = offsetY + pt.y × renderH
```

This preserves the original drawing proportions regardless of the canvas size at playback time.

### 6. `data-diagram` attribute in Reveal.js plugin

Diagram canvases in Reveal.js use `data-diagram="<url>"` (the full URL to a diagram export JSON). There is no plugin-level default diagram since each diagram is a distinct file — unlike handwriting where all canvases typically share one glyph set. Per-canvas overrides: `data-diagram-speed`, `data-diagram-color`. The plugin's cache, prefetch, fragment, and slidechanged logic all apply to `data-diagram` canvases using the same patterns already in place for `data-handwriting`.

### 7. Aspect ratio fixed at creation

The aspect ratio is set when the diagram is created and cannot be changed. Changing it mid-drawing would require rescaling or distorting all existing normalized strokes, which is surprising behavior. If a different shape is needed, the user creates a new diagram.

### 8. Diagram canvas component is separate from CaptureCanvas

`CaptureCanvas` has deep coupling to the character capture workflow: cap-height guide lines, baseline guide, ghost rendering, preview/accept/discard state machine, and cap-height normalization on accept. A diagram canvas needs none of this. A new `DiagramCanvas` component shares only the pointer event pattern (adapted from `CaptureCanvas`) and avoids inheriting irrelevant complexity.

## Risks / Trade-offs

- **Full-replacement save could lose work** → Mitigate with a "save with 0 strokes?" confirmation; educate via UI that undo is session-scoped in the sense that closing without saving discards unsaved strokes.
- **Large diagrams may have big JSON payloads** → Acceptable for an initial version; stroke coordinate rounding (4 decimal places, matching the glyph export pattern) keeps payloads reasonable.
- **Reveal plugin bundle grows** → `DiagramAnimator` adds weight to `handwriting-reveal.js`. Acceptable; both animators are logically part of the same plugin.
- **No thumbnail previews in diagram list** → Names only for now; previews are explicitly deferred.

## Migration Plan

- Add `diagram` table via a new Flyway migration (or equivalent DB init step matching the existing pattern in `DatabaseFactory`).
- No changes to existing tables; no data migration required.
- Rollback: drop `diagram` table; revert backend/frontend code.

## Open Questions

- Should the diagram editor show a faint grid or aspect-ratio guide lines? (Not in scope for initial version; canvas is blank.)
- What aspect ratios should be offered in the creation dialog — free-form numeric entry, or a predefined list (16:9, 4:3, 1:1, etc.)? Recommendation: predefined list with a "Custom" option.

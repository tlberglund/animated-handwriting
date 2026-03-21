## Why

The handwriting capture system is limited to single characters; there is no way to capture free-form multi-stroke diagrams or drawings that span a full canvas. Adding diagram capture extends the tool's reach from typography to illustration, enabling annotated slide diagrams and freehand figures to be animated with the same stroke-playback engine.

## What Changes

- A new **Diagrams tab** is added to the capture app alongside the existing Handwriting tab.
- A **diagram drawing canvas** with configurable aspect ratio supports real-time Pencil/pointer capture with full **undo/redo** (across all strokes, including those saved in previous sessions).
- A **diagram list** on the right panel lets the user create, name, recall, and delete diagrams.
- Recalled diagrams are loaded into the undo stack for continued editing; saving writes the full current stroke array back to the server.
- A new **`diagram-playback/`** package exports a `DiagramAnimator` class with a `play()` method, providing a standalone API for animating diagrams on any HTML canvas.
- Diagram strokes are **normalized to [0,1] at capture time** and stored with the diagram's aspect ratio; the animator letterboxes into any canvas that differs from the original shape.
- The **Reveal.js plugin** gains `data-diagram` canvas support, bundling `DiagramAnimator` alongside the existing `HandwritingAnimator`.
- A new backend **`diagram` table** and `/api/diagrams` routes serve create, read, update, delete, and export operations.

## Capabilities

### New Capabilities

- `diagram-capture`: UI tab, drawing canvas (configurable aspect ratio), full undo/redo across all strokes, diagram list (create/rename/recall/delete), save flow (full stroke-array replacement), backend table and CRUD routes.
- `diagram-playback`: `DiagramAnimator` class, normalized [0,1] coordinate playback with aspect-ratio-preserving letterboxing, export JSON format, `diagram-playback/` esbuild package.

### Modified Capabilities

- `reveal-plugin`: Plugin gains `data-diagram` attribute support for animating saved diagrams in slides; `DiagramAnimator` is bundled into `handwriting-reveal.js`.

## Impact

- **Backend**: New `diagram` table (migration); new Ktor route group `/api/diagrams`; new `DiagramService` and models.
- **Capture app**: New tab bar component; new `DiagramCanvas`, `DiagramArea`, `DiagramRoster` components; new diagram-specific API calls in `api.ts`.
- **`diagram-playback/` package**: New esbuild package alongside `playback/`; produces `dist/diagram-animator.js` (IIFE) and ESM variant.
- **`reveal-plugin/`**: Imports `DiagramAnimator`; handles `data-diagram` canvases in `init`, `slidechanged`, `fragmentshown`, `fragmenthidden`; rebuilt bundle grows modestly.
- No breaking changes to any existing API or UI behavior.

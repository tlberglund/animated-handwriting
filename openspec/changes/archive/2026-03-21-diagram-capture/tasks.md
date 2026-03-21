## 1. Backend — Database and Models

- [x] 1.1 Add `Diagrams` Exposed table object to `Tables.kt` with columns: `id` (UUID), `name` (varchar), `aspectRatio` (double), `strokes` (text, default `[]`), `createdAt` (timestamp), `updatedAt` (timestamp)
- [x] 1.2 Add `DiagramService.kt` with `listDiagrams()`, `getDiagram(id)`, `createDiagram(name, aspectRatio)`, `updateDiagram(id, name?, strokes?)`, `deleteDiagram(id)`, `exportDiagram(id)` — following the pattern of `GlyphService.kt`
- [x] 1.3 Add serializable model classes to `Models.kt`: `DiagramSummary`, `DiagramDetail`, `CreateDiagramRequest`, `UpdateDiagramRequest`, `DiagramExport`, `DiagramExportPoint`
- [x] 1.4 Create `DiagramRoutes.kt` with all six routes (`GET /api/diagrams`, `POST`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `GET /:id/export`); register in `Application.kt`
- [x] 1.5 Wire the `diagram` table into `DatabaseFactory` so it is created on startup alongside the existing tables

## 2. `diagram-playback/` Package Setup

- [x] 2.1 Create `diagram-playback/` directory with `package.json` (name: `diagram-playback`, IIFE build global: `DiagramPlaybackLib`, esbuild scripts matching `playback/`)
- [x] 2.2 Create `diagram-playback/tsconfig.json` mirroring `playback/tsconfig.json`
- [x] 2.3 Run `npm install` in `diagram-playback/`

## 3. `DiagramAnimator` Implementation

- [x] 3.1 Create `diagram-playback/src/types.ts` with `NormalizedPoint`, `DiagramExport`, and `DiagramPlayOptions` interfaces
- [x] 3.2 Create `diagram-playback/src/DiagramAnimator.ts` — constructor accepts `HTMLCanvasElement` and `DiagramExport`; implement `play(options?)` that computes the letterbox fit rectangle from `diagram.aspectRatio` vs `canvas.clientWidth/Height`, scales normalized points to screen coordinates, builds a flat draw-event timeline (same `t`-ordered approach as `HandwritingAnimator`), and renders with `requestAnimationFrame`
- [x] 3.3 Implement stroke smoothing in `DiagramAnimator` (neighbor-averaging, same algorithm as `HandwritingAnimator.smoothPoints`)
- [x] 3.4 Implement pressure-driven stroke width in `DiagramAnimator` (linear interpolation between `minWidth` and `maxWidth`)
- [x] 3.5 Add zero-size canvas guard: log warning and return resolved Promise if `clientWidth` or `clientHeight` is 0
- [x] 3.6 Create `diagram-playback/src/index.ts` exporting `DiagramAnimator` and types
- [x] 3.7 Run `npm run build` in `diagram-playback/` and confirm `dist/diagram-animator.js` is produced

## 4. Capture App — API Layer

- [x] 4.1 Add diagram API functions to `capture-app/src/api.ts`: `listDiagrams`, `createDiagram`, `getDiagram`, `updateDiagram`, `deleteDiagram`
- [x] 4.2 Add `DiagramSummary`, `DiagramDetail`, `NormalizedStroke` types to `capture-app/src/types.ts`

## 5. Capture App — Tab Bar

- [x] 5.1 Add a `TabBar` component with "Handwriting" and "Diagrams" tabs; wire to `App.tsx` state (`activeTab`)
- [x] 5.2 Update `App.tsx` to conditionally render the existing handwriting view or the new diagrams view based on `activeTab`
- [x] 5.3 Add tab bar styles to `index.css`

## 6. Capture App — Diagram UI Components

- [x] 6.1 Create `DiagramCanvas.tsx` — a drawing canvas component that uses the same pointer event pattern as `CaptureCanvas` but: no guide lines, no cap-height logic, normalizes points to [0,1] before adding to the stroke stack, accepts `onStrokeAdded` callback
- [x] 6.2 Add undo/redo stack management to `DiagramArea.tsx`: `undoStack` (array of normalized strokes), `redoStack`; expose `undo()`, `redo()`, `canUndo`, `canRedo`
- [x] 6.3 Add full redraw function to `DiagramArea.tsx` that replays the undo stack through the canvas context (needed after undo/redo)
- [x] 6.4 Create `DiagramRoster.tsx` — a list component showing diagram names + timestamps; "+ New Diagram" button at top; click to select; delete button per item
- [x] 6.5 Create `NewDiagramDialog.tsx` — modal/dialog prompting for name and aspect ratio (predefined list: 16:9, 4:3, 1:1, 3:2, plus Custom input); calls `onConfirm(name, aspectRatio)`
- [x] 6.6 Create `DiagramArea.tsx` — the top-level diagrams view: contains `DiagramCanvas`, toolbar with Undo/Redo/Clear/Save/Cancel buttons, loads diagram on select, handles save with zero-stroke confirmation
- [x] 6.7 Add diagram area styles to `index.css` (canvas wrapper respecting aspect ratio, toolbar layout, roster styles)

## 7. Capture App — Wiring

- [x] 7.1 Connect `DiagramRoster` to the diagrams API (`listDiagrams`, `deleteDiagram`) via React Query
- [x] 7.2 Connect "+ New Diagram" flow: show `NewDiagramDialog`, call `createDiagram`, select new diagram in roster
- [x] 7.3 On diagram select: call `getDiagram`, populate undo stack with loaded strokes, render on canvas
- [x] 7.4 Wire Save button: call `updateDiagram` with full undo stack; show confirmation dialog when stack is empty

## 8. Reveal.js Plugin — Diagram Support

- [x] 8.1 Add `import { DiagramAnimator } from '../../diagram-playback/src/index'` to `reveal-plugin/src/index.ts`
- [x] 8.2 Add a separate glyph cache for diagrams (`diagramCache: Map<string, Promise<DiagramExport>>`) and a `loadDiagram(url)` helper
- [x] 8.3 Add `animateDiagramCanvas(canvas, config)` function that resolves `data-diagram-speed` / `data-diagram-color` overrides, awaits the cached diagram, and calls `new DiagramAnimator(canvas, diagram).play(...)`
- [x] 8.4 Extend `prefetchSlide` to also prefetch `data-diagram` URLs on the slide
- [x] 8.5 Extend `applyPositionStyles` (init-time scan) to process `[data-diagram]` canvases alongside `[data-handwriting]` canvases
- [x] 8.6 Extend `slidechanged` handler to animate non-fragment `[data-diagram]` canvases and clear diagrams on the previous slide
- [x] 8.7 Extend `fragmentshown` handler to animate `[data-diagram]` canvases in the revealed fragment
- [x] 8.8 Extend `fragmenthidden` handler to clear `[data-diagram]` canvases in the hidden fragment
- [x] 8.9 Extend initial slide handling in `init` to prefetch and animate non-fragment `[data-diagram]` canvases

## 9. Build and Demo

- [x] 9.1 Run `npm run build` in `reveal-plugin/` and confirm no errors; verify bundle includes `DiagramAnimator`
- [x] 9.2 Add a diagram demo slide to `demo/reveal.html` using `data-diagram` pointing to a sample export JSON
- [ ] 9.3 Manually verify: diagram animates on slide entry in the Reveal.js demo
- [ ] 9.4 Manually verify: undo/redo works in the capture app, including across previously saved strokes
- [ ] 9.5 Manually verify: save → recall → add strokes → save again produces the correct combined stroke array

## 1. Database migration

- [x] 1.1 Write Flyway migration V9 adding `capture_adjustment` table with columns `glyph_capture_id` (UUID FK), `scale` (DOUBLE, default 1.0), `y_offset` (DOUBLE, default 0.0)
- [x] 1.2 Add `CaptureAdjustments` Exposed table object and update `Tables.kt`
- [x] 1.3 Add `CaptureAdjustment` model to `Models.kt`

## 2. Backend adjustment API

- [x] 2.1 Add `CaptureAdjustmentService` with `get(captureId)` (returns defaults if no row) and `upsert(captureId, scale, yOffset)` with range validation
- [x] 2.2 Add `GET /api/capture-sets/{setId}/glyphs/{char}/captures/{captureId}/adjustment` route
- [x] 2.3 Add `PUT /api/capture-sets/{setId}/glyphs/{char}/captures/{captureId}/adjustment` route with 400 validation for out-of-range values
- [x] 2.4 Register new routes in `Application.kt`

## 3. Export service v2

- [x] 3.1 Update `ExportService` to fetch adjustments for all captures in the set in a single query (avoid N+1)
- [x] 3.2 Apply baseline-anchored isotropic scaling math: `new_x = old_x × s`, `new_y = 1.0 - (1.0 - old_y) × s + yOffset`, `new_width = old_width × s`
- [x] 3.3 Move `width` from `ExportGlyph` to `ExportCapture` in `Models.kt`
- [x] 3.4 Remove top-level `width` from `ExportGlyph` serialization
- [x] 3.5 Bump `version` field in `ExportResponse` from `1` to `2`

## 4. Playback library update

- [x] 4.1 Update `ExportCapture` type in `playback/src/types.ts` to add `width: number`
- [x] 4.2 Update `ExportGlyph` type to remove `width`
- [x] 4.3 Change advance-width read site in `HandwritingAnimator.ts`: `glyph.width` → `capture.width`
- [x] 4.4 Rebuild playback library (IIFE + ESM)

## 5. Static phrase renderer (capture app)

- [x] 5.1 Implement `staticRender(canvas, glyphMap, phrase, pinnedCaptureId, provisionalAdjustment)` in a new file `capture-app/src/staticRenderer.ts`
- [x] 5.2 Renderer draws all strokes synchronously, applying provisional adjustment math to the pinned capture's coordinates before drawing
- [x] 5.3 Renderer uses the pinned capture for every occurrence of its character; picks random captures for all others

## 6. Capture app — Adjust tab

- [x] 6.1 Add adjustment API calls to `api.ts`: `getAdjustment(setId, char, captureId)` and `putAdjustment(setId, char, captureId, scale, yOffset)`
- [x] 6.2 Create `AdjustTab.tsx` component with character list showing per-character capture count
- [x] 6.3 Implement capture thumbnail strip: small static renders of each capture variant using the static renderer
- [x] 6.4 Add scale slider (0.5–1.5) and y_offset slider (−0.5–0.5) with numeric display of current value
- [x] 6.5 Add Reset button that sets scale=1.0 and y_offset=0.0 and saves
- [x] 6.6 Wire slider changes to immediate preview re-render (provisional, no backend call)
- [x] 6.7 Wire slider changes to debounced PUT (~400ms) after last change
- [x] 6.8 Add editable phrase input field with default "The quick brown fox jumps over a lazy dog"
- [x] 6.9 Add phrase preview canvas below controls; re-renders on phrase change or slider change
- [x] 6.10 Register Adjust tab in the capture app's tab navigation

## 7. Integration and cleanup

- [ ] 7.1 Re-export all capture sets to regenerate `hand.json` and any other distributed glyph set files to v2 format
- [ ] 7.2 Update `demo/index.html` to work with v2 glyph set JSON
- [x] 7.3 Verify `handwriting-react` and `reveal-plugin` work correctly with the updated playback library and v2 JSON
- [x] 7.4 Update `playback/README.md` and `backend/README.md` to document the v2 export format change

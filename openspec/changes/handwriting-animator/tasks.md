## 1. Backend: Project Setup

- [x] 1.1 Initialize Kotlin project with Ktor and Exposed dependencies (Gradle)
- [x] 1.2 Configure Postgres connection and connection pooling (HikariCP)
- [x] 1.3 Set up database migration tooling (Flyway or Liquibase)
- [x] 1.4 Create project directory structure (routes, models, services, db)

## 2. Backend: Database Schema

- [x] 2.1 Migration: create `character_definition` table (id, character, glyph_type, sort_order)
- [x] 2.2 Migration: create `capture_set` table (id, name, description, created_at)
- [x] 2.3 Migration: create `capture_set_override` table (capture_set_id, character, override_type: ADD|EXCLUDE)
- [x] 2.4 Migration: create `glyph` table (id, capture_set_id, character, glyph_type)
- [x] 2.5 Migration: create `glyph_capture` table (id, glyph_id, captured_at, strokes JSONB, canvas_meta JSONB, notes)
- [x] 2.6 Seed script: insert all canonical character definitions (a–z, A–Z, 0–9, punctuation, ~20 ligatures)

## 3. Backend: Capture Set API

- [x] 3.1 `GET /api/capture-sets` — list all capture sets
- [x] 3.2 `POST /api/capture-sets` — create capture set, auto-create glyph rows for effective character set
- [x] 3.3 `GET /api/capture-sets/:id` — fetch single capture set with metadata
- [x] 3.4 `PATCH /api/capture-sets/:id` — update name/description
- [x] 3.5 `DELETE /api/capture-sets/:id` — cascade delete glyphs and captures
- [x] 3.6 Implement effective character set computation (global seed + per-set overrides)

## 4. Backend: Glyph Capture API

- [x] 4.1 `GET /api/capture-sets/:id/glyphs` — list all glyphs with capture counts
- [x] 4.2 `GET /api/capture-sets/:id/glyphs/:char` — fetch glyph with all captures
- [x] 4.3 `POST /api/capture-sets/:id/glyphs/:char/captures` — store new capture (strokes + canvasMeta)
- [x] 4.4 `DELETE /api/capture-sets/:id/glyphs/:char/captures/:captureId` — delete a single capture
- [x] 4.5 `GET /api/capture-sets/:id/progress` — return completion stats and nextUncaptured

## 5. Backend: Export Endpoint

- [x] 5.1 Implement coordinate normalization logic (raw pixels + canvasMeta → normalized [0,1] system)
- [x] 5.2 Implement glyph width calculation from normalized bounding box
- [x] 5.3 `GET /api/capture-sets/:id/export` — serialize full glyph set to playback-engine JSON format
- [x] 5.4 Verify export format includes: glyphs keyed by character, per-capture strokes with normalized coords, glyph widths

## 6. Capture App: Canvas and Stroke Recording

- [x] 6.1 Create single-page HTML app scaffold (targets iPad Safari)
- [x] 6.2 Implement canvas element sized to capture frame with cap-height and baseline guide lines visible
- [x] 6.3 Implement Pointer Events listeners (pointerdown, pointermove, pointerup) with `getCoalescedEvents()`
- [x] 6.4 Capture x, y, pressure, and timestamp (relative ms from session start) per point
- [x] 6.5 Segment points into strokes on pointerdown/pointerup boundaries
- [x] 6.6 Draw strokes in real time as user writes (pressure-driven line width: 2–4px)

## 7. Capture App: Preview and Submit

- [x] 7.1 Implement stroke playback on canvas (replay points at captured speed for preview)
- [x] 7.2 Show accept/discard UI after preview completes
- [x] 7.3 On accept: POST strokes + canvasMeta to backend, handle success/error
- [x] 7.4 On discard: clear canvas and stroke buffer, return to capture state

## 8. Capture App: Walkthrough UI

- [x] 8.1 Fetch capture set progress from backend on load
- [x] 8.2 Display current character label outside the capture canvas
- [x] 8.3 Display progress bar (e.g., "31/84 captured")
- [x] 8.4 Show character set overview grid with per-character quality indicators (red/yellow/green)
- [x] 8.5 Allow free navigation: tapping any character in the grid navigates to it
- [x] 8.6 Show existing captures for current character with play buttons and delete option
- [x] 8.7 Implement capture set selector (list capture sets, create new)

## 9. Playback Engine: Core

- [x] 9.1 Create TypeScript project with build tooling (esbuild or tsc)
- [x] 9.2 Define TypeScript types for exported glyph set JSON format
- [x] 9.3 Implement `HandwritingAnimator` class with constructor `(canvas, glyphData)`
- [x] 9.4 Implement coordinate normalization: canvasMeta → canvas render coordinates
- [x] 9.5 Implement glyph width and layout: x-offset accumulation, inter-letter gap, word gap
- [x] 9.6 Implement `scale` option: set canvas pixel dimensions to CSS size × scale before rendering

## 10. Playback Engine: Ligature Substitution

- [x] 10.1 Build ligature index from glyph set (multi-char keys → glyph entries)
- [x] 10.2 Implement left-to-right longest-match scan to tokenize input string into glyph sequence
- [x] 10.3 Handle space characters as timing-only gaps (no glyph rendered)
- [x] 10.4 Log console warning for characters with no available capture; skip silently

## 11. Playback Engine: Animation

- [x] 11.1 Implement random capture variant selection per glyph
- [x] 11.2 Implement consecutive-same-glyph deduplication (no variant repeat)
- [x] 11.3 Implement Catmull-Rom (or neighbor-average) smoothing on x/y coordinates
- [x] 11.4 Implement `requestAnimationFrame` render loop with speed multiplier applied to timestamps
- [x] 11.5 Implement pressure-driven line width per point segment (configurable min/max)
- [x] 11.6 Implement `write(text, options)` method that returns a Promise resolving when animation completes

## 12. Demo Page

- [x] 12.1 Create static `index.html` that loads a hardcoded export JSON and the playback engine
- [x] 12.2 Add text input and "Animate" button; call `animator.write()` on submit
- [x] 12.3 Add speed slider (0.5×–3×) wired to the `speed` option
- [x] 12.4 Add scale selector (1×, 2×) for screen capture quality
- [x] 12.5 Verify animation looks correct at 2× scale for screen capture

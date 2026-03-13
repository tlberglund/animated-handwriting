## Context

No existing codebase — this is a greenfield project. The system has three distinct components that need to interoperate through a well-defined JSON export format: a Kotlin/Postgres backend, a browser capture app (targeting iPad Safari + Apple Pencil), and a TypeScript playback engine. The primary output is screen-captured video, so the playback component runs in a browser.

## Goals / Non-Goals

**Goals:**
- Capture handwriting strokes from a real person with timing and pressure fidelity
- Store multiple captures per character for natural playback variation
- Export a portable JSON format usable by the playback engine with no backend dependency
- Animate any arbitrary string from captured glyph data at configurable speed
- Run entirely in the browser at both capture and playback time

**Non-Goals:**
- Authentication or multi-user access (deferred)
- Vector/SVG path output (canvas rendering is sufficient and preserves timing feel)
- Automatic handwriting recognition or OCR
- Mobile-optimized playback (capture is iPad-specific; playback targets desktop browsers for screen capture)
- Real-time collaborative capture

## Decisions

### D1: Store raw pixels + canvas metadata, normalize at export time

**Decision:** Capture stores raw pixel coordinates and canvas frame dimensions. Normalization to the [0,1] coordinate system happens in the backend's `/export` endpoint.

**Alternatives considered:**
- Normalize on the client before sending: simpler export, but loses raw data — unrecoverable if the coordinate system needs to change.
- Normalize on playback client: moves complexity to a component that should be simple.

**Rationale:** Raw data is always recoverable. The export endpoint is the single place where normalization logic lives, making it easy to fix or improve. The tradeoff is that the DB stores device-specific pixel data, but that's acceptable since capture sets are authored on a single device type.

---

### D2: JSONB for stroke data in Postgres

**Decision:** Strokes stored as JSONB in the `GlyphCapture` table rather than a normalized `Point` table.

**Alternatives considered:**
- Separate `Stroke` and `Point` tables: enables SQL queries over individual points, but there's no use case for that — strokes are always read and written as a unit.

**Rationale:** Strokes are an opaque rendering blob. JSONB gives good compression, indexability on metadata fields if needed, and no join overhead on read. The entire stroke array for a glyph capture is always fetched together.

---

### D3: Canvas-based playback, not SVG stroke-dasharray

**Decision:** Playback renders to an HTML `<canvas>` element using `requestAnimationFrame`, replaying points according to captured timestamps scaled by a speed multiplier.

**Alternatives considered:**
- SVG `stroke-dasharray` animation: elegant and resolution-independent, but timing is constant-speed and pressure variation is impractical. Loses the natural rhythm of the writing.

**Rationale:** The "speed-of-thought whiteboard" feel depends on the timing variation captured in the strokes — accelerating on straight runs, slowing on curves and direction changes. Canvas replay preserves this directly. Pressure-driven line width variation is also straightforward. Canvas resolution can be set high enough for screen capture.

---

### D4: Ligature substitution via longest-match left-to-right scan

**Decision:** Before rendering, the playback engine scans the input string left-to-right, greedily matching the longest available ligature at each position.

**Alternatives considered:**
- Fixed-priority list: simpler but can miss longer matches.
- Full shaping engine (HarfBuzz-style): overkill for ~20 static ligatures.

**Rationale:** Longest-match is simple to implement, correct for the ligature set in question, and deterministic. "thing" → ["th", "ing"] rather than ["t", "h", "i", "ng"]. Falls back to single-character lookup if no ligature matches.

---

### D5: Kotlin + Ktor for the backend

**Decision:** Backend uses Kotlin with Ktor (lightweight) and Exposed ORM, deployed with an embedded server.

**Alternatives considered:**
- Spring Boot: more batteries-included but heavier for a small API surface.

**Rationale:** Ktor is idiomatic Kotlin, starts fast, and is well-suited to a focused REST API. Exposed gives typesafe SQL without JPA complexity. Easy to run locally during capture sessions.

---

### D6: Global character set seeded in DB, per-set overrides as inclusion/exclusion lists

**Decision:** A global `CharacterDefinition` table is seeded at startup with all target glyphs. Each `CaptureSet` can have an override table of additions and exclusions. The `/progress` endpoint computes the effective set.

**Alternatives considered:**
- Hardcode the character set in application code: simpler but requires redeploy to change.
- Per-set full character lists: lots of duplication across sets.

**Rationale:** The global seed is the source of truth. Overrides are lightweight diffs. A new capture set targets the full canonical set by default with no configuration needed.

## Risks / Trade-offs

**Coordinate drift across devices** → If a capture set is recorded on one iPad and replayed at a different canvas size, aspect ratio differences in the capture frame could cause distortion. Mitigation: store the capture frame dimensions precisely in `canvas_meta`; normalization uses them to produce device-independent coordinates.

**Ligature false matches** → "th" ligature fires on "the", "that", etc. by design — but if a captured "th" ligature looks visually wrong in some contexts (e.g., different word rhythm), there's no escape hatch. Mitigation: the capture UI makes it easy to delete bad captures; users can also simply not capture a ligature they don't want used.

**Canvas resolution for video** → Screen-captured video quality depends on canvas pixel density. Mitigation: playback engine should accept a `scale` parameter (default 2x) to render at double resolution for crisp screen capture.

**Incomplete character set** → Playback falls back to a visible placeholder (e.g., "?") for uncaptured characters. Mitigation: `/progress` endpoint and capture UI surface gaps clearly; playback engine logs warnings.

## Open Questions

- Should the playback engine support multi-line text, or is that the caller's responsibility (multiple `.write()` calls)?
- What's the intended inter-letter and inter-word gap default (in units of cap-height)? Needs tuning once first captures exist.
- Should the export format version itself (a `"version": 1` field) to allow future format evolution without breaking existing exports?

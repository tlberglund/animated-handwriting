## Why

Creating video content with animated handwriting requires expensive tools or laboriously hand-animated assets. This system makes it possible to capture someone's actual handwriting once and replay it dynamically for any text — at natural, expressive speed — directly in a browser ready for screen capture.

## What Changes

- New browser-based capture app (iPad + Apple Pencil) for recording handwriting strokes per character
- New Kotlin + Postgres backend for managing capture sets, glyphs, and individual stroke captures
- New TypeScript playback engine that animates any string using captured glyph data on an HTML canvas
- New static demo page for previewing and screen-capturing animations
- Global canonical character set (a–z, A–Z, 0–9, punctuation, ~20 common ligatures) seeded in the backend, with per-capture-set overrides

## Capabilities

### New Capabilities

- `capture-set-management`: CRUD for named capture sets (e.g., "Tim's handwriting"), each containing a target character set with per-set overrides of the global defaults
- `glyph-capture`: Per-character stroke capture via Pointer Events API on iPad Safari, storing raw timestamped points + pressure + canvas metadata; multiple captures per glyph for natural variation; walkthrough UI for completing a full character set
- `handwriting-playback`: TypeScript engine that takes an exported glyph set and a string, performs ligature substitution, selects random capture variants, normalizes coordinates, and animates strokes on a canvas element with configurable speed multiplier

### Modified Capabilities

## Impact

- New backend service (Kotlin, Ktor or Spring Boot, Postgres)
- New frontend apps: capture app (vanilla JS or lightweight framework, targets iPad Safari), playback engine (TypeScript, no framework dependency), demo page (static HTML)
- No external service dependencies beyond Postgres
- Playback engine designed for future embedding in reveal.js or other component contexts

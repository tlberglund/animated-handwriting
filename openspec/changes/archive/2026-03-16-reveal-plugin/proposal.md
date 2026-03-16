## Why

The handwriting animator engine exists but has no presentation-ready integration. The primary use case for animated handwriting is slides — the ability to drop your own captured letterforms into a Reveal.js presentation and have them animate on cue, with no server running.

## What Changes

- **New**: `reveal-plugin/` package — a single-file Reveal.js plugin (`handwriting-reveal.js`) that bundles `HandwritingAnimator` and wires it to Reveal's event system
- **New**: Export button in the capture app top bar that downloads a compact JSON glyph set — the artifact the plugin consumes
- **Update**: `demo/index.html` cleaned up to reference the built `handwriting-animator.js` from `playback/dist/` rather than inlining an engine copy

## Capabilities

### New Capabilities

- `glyph-set-export`: Export button in the capture app that downloads the current capture set as a compact (minified) JSON file compatible with the playback engine
- `reveal-plugin`: Reveal.js plugin that animates `[data-handwriting]` canvas elements on slide entry and fragment reveal, with plugin-level config and per-canvas overrides

### Modified Capabilities

- `handwriting-playback`: Demo cleanup — `demo/index.html` references the built engine rather than an inline copy; no behavior change to the engine itself

## Impact

- **New package**: `reveal-plugin/` with its own `package.json` and esbuild pipeline
- **Capture app**: one new button + download handler in `TopBar` (or equivalent); no API changes — `/export` endpoint already exists
- **Demo**: `demo/index.html` swaps inline script for `<script src="../playback/dist/handwriting-animator.js">`; requires `playback/` build to run first
- **No breaking changes**: playback engine API, backend API, and capture app capture flow are all unchanged

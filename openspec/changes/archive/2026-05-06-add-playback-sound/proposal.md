## Why

The handwriting animation engine is silent; adding ambient pen-on-paper sound makes animated handwriting dramatically more immersive and believable in presentations and demos. This feature is specifically requested to support Reveal.js presentation use cases where rich sensory feedback elevates speaker credibility.

## What Changes

- The playback engine gains a **stroke-type classifier** that identifies each curve segment as one of three types: straight line, smooth curve, or sharp angle (direction change exceeding a configurable threshold).
- A new **sound engine** is added to `playback/` that loads a configurable set of MP3 clips keyed by stroke type, plays them in sync with drawing progress, and selects randomly when multiple clips are available for a type.
- `HandwritingAnimator.write()` gains a new `sounds` option accepting a `SoundConfig` mapping each stroke type to one or more MP3 URLs.
- When playback speed makes audio clips too long relative to stroke duration, the engine falls back to a random-shuffle strategy — cycling through all available clips in a randomized order rather than trying to sync them to individual strokes.
- The Reveal.js plugin gains `data-sound-*` attributes and plugin-level `sounds` config to wire audio through without consumer code changes.
- The `<Handwriting>` React component gains a `sounds` prop that forwards the `SoundConfig` to the underlying animator.

## Capabilities

### New Capabilities
- `playback-sound`: Core sound engine — stroke-type classification, MP3 clip loading, per-type random selection, and speed-fallback shuffle strategy.

### Modified Capabilities
- `handwriting-playback`: `write()` method gains optional `sounds: SoundConfig` parameter; stroke rendering pipeline gains the classifier as an internal step.
- `reveal-plugin`: Plugin-level `sounds` config block and per-canvas `data-sound-*` attribute overrides.
- `handwriting-react`: `<Handwriting>` component gains optional `sounds` prop.

## Impact

- **`playback/`**: New classifier module, new sound engine module, updated `WriteOptions` type, updated `HandwritingAnimator`.
- **`reveal-plugin/`**: Updated config schema, updated canvas initialization to pass sounds through to the animator.
- **`handwriting-react/`**: Updated `HandwritingProps` and `WriteOptions` forwarding.
- **Browser APIs**: Uses `AudioContext` and `fetch` for MP3 decoding; no new npm dependencies required.
- **Breaking changes**: None — `sounds` is optional everywhere; existing callers are unaffected.

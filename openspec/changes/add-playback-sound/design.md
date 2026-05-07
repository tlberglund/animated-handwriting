## Context

The playback engine (`playback/`) renders animated handwriting stroke-by-stroke onto an HTML canvas. Each stroke is a sequence of timed (x, y, pressure) points. Currently the rendering pipeline: normalizes coordinates → smooths points → draws segments with pressure-weighted width. There is no audio layer.

The caller provides a glyph set JSON and a text string; the engine handles all timing. Render consumers include a standalone Reveal.js plugin and a React component wrapper. Both ultimately call `HandwritingAnimator.write(text, options)`.

## Goals / Non-Goals

**Goals:**
- Classify each stroke as `straight`, `curve`, or `sharp` using geometric analysis of the captured point sequence.
- Load and decode MP3 clips upfront via `AudioContext`; play one clip per stroke at the moment drawing begins.
- Select randomly when multiple clips are mapped to the same stroke type.
- When playback is too fast for audio (stroke duration < clip duration), switch to a randomized round-robin across all clips rather than silently dropping audio.
- Surface the `sounds` option through `write()`, the Reveal.js plugin config and per-canvas data attributes, and the React `<Handwriting>` prop.
- No new npm dependencies — Web Audio API is universally available.

**Non-Goals:**
- MIDI synthesis, procedural audio, or real-time audio generation.
- Per-segment audio (one clip per drawn line segment) — classification and playback are per-stroke.
- Audio mixing or volume automation tied to pressure.
- Server-side rendering of audio (all audio is browser-only; SSR consumers see no-ops).

## Decisions

### Stroke type classification — stroke-level not segment-level

**Decision**: Classify the entire stroke as one type by computing the maximum angular change between consecutive direction vectors across all consecutive point triples. A single dominant characteristic per stroke is more musically coherent than per-segment variety.

Thresholds (configurable via `SoundConfig`):
- `< 15°` max angle change → `straight`
- `15°–60°` max angle change → `curve`
- `> 60°` max angle change → `sharp`

Strokes shorter than 3 points default to `straight`.

**Alternatives considered**: Segment-level classification would create rapid-fire audio triggers, which is audibly chaotic for fast playback. Median-angle vs max-angle: median underweights sharp inflection points that define "sharp" strokes — max is more perceptually accurate.

### AudioContext lifecycle

**Decision**: Create one `AudioContext` per `HandwritingAnimator` instance, lazily on the first `write()` call. Pass the context into the sound engine. The context is shared across successive `write()` calls on the same instance.

**Rationale**: Browser autoplay policy requires `AudioContext` to be created or resumed within a user-gesture handler. `write()` is always called in response to user interaction (slide navigation, scroll into view, button press). Creating the context per-instance avoids a global singleton that's harder to test and harder to tear down in React's strict-mode double-invoke.

### Clip playback trigger — per stroke start

**Decision**: Play one clip at the moment the first segment of each stroke begins drawing. Do not attempt to sustain, loop, or crossfade clips across a stroke's duration.

**Rationale**: Synchronizing clip duration to variable stroke duration would require time-stretching (complex, sounds unnatural). One-shot clips at stroke start provide a natural "pen touches paper" feel without requiring exact duration alignment.

### Speed-too-fast fallback — randomized round-robin

**Decision**: Track the mean stroke duration across the most recent glyph. If `mean stroke duration < clip duration * 0.5`, activate **shuffle mode**: maintain a randomized queue of all clips from all types, advance one clip per stroke ignoring stroke type, and re-shuffle on queue exhaustion.

**Rationale**: The user explicitly asked to experiment with random ordering at high speeds. This gives the presentation a rhythmic, typewriter-like sound regardless of speed, while still cycling through all available clips to prevent repetition fatigue. The 0.5 threshold (clip half-duration) gives comfortable headroom — at 2× the clip duration the audio still feels loosely correlated to strokes.

**Alternative**: Simply silence audio at high speed. Rejected because the user's request is to find something that "feels right" through experimentation, not to suppress audio.

### Configuration shape

```typescript
interface SoundConfig {
  straight?: string[];   // MP3 URLs for straight strokes
  curve?: string[];      // MP3 URLs for curved strokes
  sharp?: string[];      // MP3 URLs for sharp-angle strokes
  thresholds?: {
    straight: number;    // max angle change in degrees, default 15
    sharp: number;       // min angle change for "sharp", default 60
  };
}
```

All fields optional. Missing type arrays fall back to clips from other types (priority order: same type → all clips combined → silence). This avoids hard errors when only 2 of 3 types are provided.

### No SSR guard needed in playback/

`HandwritingAnimator` already requires a real canvas element — it cannot run in Node.js. The sound engine is co-located in the same package and inherits this constraint. React consumers that SSR the `<Handwriting>` component already use dynamic import with `ssr: false`; no additional guard needed.

## Risks / Trade-offs

- **Browser autoplay policy** → The engine creates `AudioContext` lazily on `write()`. If a caller invokes `write()` outside a user-gesture (e.g., on `DOMContentLoaded`), the context may be in `suspended` state. Mitigation: the engine calls `context.resume()` before each `playBuffer()` and logs a console warning if the context remains suspended after a 50ms grace period.

- **MP3 fetch/decode latency** → Clips need to be decoded before first use. Mitigation: expose `SoundEngine.preload(config)` so callers (the Reveal plugin's prefetch path, the React component's `useEffect`) can preload clips while the glyph set is being fetched.

- **Multiple simultaneous instances** → Several `HandwritingAnimator` instances playing at once (e.g., multiple Reveal slides visible in overview mode) each have their own `AudioContext`. Browsers limit concurrent AudioContexts (usually 6). Mitigation: document the limit; power users with many simultaneous canvases can share a context by passing it as an option.

- **Clip copyright** → The user provides their own MP3 files. The engine makes no assumptions about clip content or licensing.

## Open Questions

- What is the exact set of MP3 clips the user will provide, and what are their typical durations? This will determine whether the speed-fallback threshold needs tuning.
- Should the shuffle-mode queue refill with a true re-shuffle (risk of back-to-back repeats at boundary) or a Fisher-Yates re-shuffle that guarantees no immediate repeat across the boundary?

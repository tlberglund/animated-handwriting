## ADDED Requirements

### Requirement: Stroke type classifier
The playback engine SHALL classify each stroke as one of three types — `straight`, `curve`, or `sharp` — by computing the maximum angular change between consecutive direction vectors across all point triples in the stroke. A stroke with fewer than 3 points SHALL be classified as `straight`. The angular thresholds SHALL default to 15° (straight/curve boundary) and 60° (curve/sharp boundary) and SHALL be overridable via `SoundConfig.thresholds`.

#### Scenario: Straight stroke classified correctly
- **WHEN** a stroke's maximum inter-vector angle is 10°
- **THEN** the stroke is classified as `straight`

#### Scenario: Curved stroke classified correctly
- **WHEN** a stroke's maximum inter-vector angle is 35°
- **THEN** the stroke is classified as `curve`

#### Scenario: Sharp stroke classified correctly
- **WHEN** a stroke's maximum inter-vector angle is 80°
- **THEN** the stroke is classified as `sharp`

#### Scenario: Short stroke defaults to straight
- **WHEN** a stroke has only 2 points
- **THEN** the stroke is classified as `straight` without error

#### Scenario: Custom thresholds respected
- **WHEN** `SoundConfig.thresholds` sets `{ straight: 10, sharp: 45 }`
- **THEN** a stroke with max angle 12° is classified as `curve` (exceeds straight threshold) and a stroke with max angle 50° is classified as `sharp`

---

### Requirement: SoundEngine clip loading
The `SoundEngine` SHALL accept a `SoundConfig` at construction time. It SHALL expose a `preload()` method that fetches and decodes all MP3 URLs in the config using `AudioContext.decodeAudioData`. Preloaded buffers SHALL be stored in memory keyed by URL so duplicate URLs are decoded only once. `preload()` SHALL return a `Promise<void>` that resolves when all clips are ready.

#### Scenario: Clips preloaded before first write
- **WHEN** `SoundEngine.preload()` is awaited before the first stroke is drawn
- **THEN** all MP3 clips are available in memory and no fetch occurs during rendering

#### Scenario: Duplicate URL decoded once
- **WHEN** the same MP3 URL appears in both `SoundConfig.straight` and `SoundConfig.curve`
- **THEN** only one HTTP request is made for that URL

#### Scenario: Fetch failure logged, engine continues
- **WHEN** one MP3 URL returns an HTTP error during `preload()`
- **THEN** the engine logs a console warning identifying the URL and marks that clip as unavailable; other clips load normally

---

### Requirement: Per-stroke clip selection and playback
When a stroke begins rendering, the `SoundEngine` SHALL select and play one clip based on the stroke's classified type. When multiple clips are available for a type, selection SHALL be random with uniform distribution. Clips that have failed to load SHALL be excluded from selection. If no clips are available for the stroke's type, the engine SHALL attempt to play a clip from any other type before falling back to silence.

#### Scenario: Random selection from multiple clips of same type
- **WHEN** the stroke type is `curve` and `SoundConfig.curve` contains three URLs
- **THEN** each of the three clips is selected with approximately equal probability over many strokes

#### Scenario: Fallback to other-type clips
- **WHEN** the stroke type is `sharp` but `SoundConfig.sharp` is empty and other types have clips
- **THEN** a clip from the combined pool of straight and curve clips is played

#### Scenario: Silence when no clips available
- **WHEN** all clip arrays are empty or all clips have failed to load
- **THEN** no audio plays and no error is thrown

#### Scenario: One clip played per stroke
- **WHEN** a stroke begins drawing
- **THEN** at most one clip starts playing at that moment (not one per segment)

---

### Requirement: Speed-fallback scribble mode
The `SoundEngine` SHALL expose an `isScribbleMode(meanStrokeDurationMs)` method. When the mean stroke duration falls below half the duration of the shortest stroke-type clip (straight/curve/sharp), this method SHALL return `true`. The caller (`HandwritingAnimator`) SHALL pre-compute the mean stroke duration from the sequence before starting animation, and when scribble mode is active SHALL call `SoundEngine.playScribble()` once at the start of the write and run the animation with no per-stroke sounds. `playScribble()` SHALL randomly select one clip from `SoundConfig.scribble` and play it as a fire-and-forget single shot for the entire redraw.

#### Scenario: Scribble mode detected before animation starts
- **WHEN** the mean stroke duration is 80ms and the shortest stroke-type clip is 400ms (threshold: 200ms)
- **THEN** `isScribbleMode(80)` returns `true` and `playScribble()` is called once before animation begins

#### Scenario: One scribble clip chosen randomly
- **WHEN** `SoundConfig.scribble` contains two clips and scribble mode is active
- **THEN** one of the two clips is selected at random and played once at the start of the write

#### Scenario: Normal mode used when strokes are slow enough
- **WHEN** the mean stroke duration exceeds half the shortest clip duration
- **THEN** `isScribbleMode()` returns `false` and per-stroke type-based playback is used instead

---

### Requirement: AudioContext lifecycle and autoplay recovery
The `SoundEngine` SHALL accept an `AudioContext` at construction time. Before each clip playback, the engine SHALL call `context.resume()` if the context is in the `suspended` state. If the context remains `suspended` after 50ms, the engine SHALL log a console warning and skip that clip.

#### Scenario: Context resumed before playback
- **WHEN** the AudioContext is in `suspended` state when a stroke begins
- **THEN** `context.resume()` is called and playback proceeds if the context transitions to `running`

#### Scenario: Persistent suspension logged and skipped
- **WHEN** the AudioContext does not transition to `running` within 50ms of `resume()`
- **THEN** the clip is skipped for that stroke and a console warning is emitted once (not per stroke)

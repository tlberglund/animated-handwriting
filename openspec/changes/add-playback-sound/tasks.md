## 1. Types and Interfaces

- [x] 1.1 Add `SoundConfig` type to `playback/src/types.ts` (straight/curve/sharp string arrays, optional thresholds)
- [x] 1.2 Add `sounds?: SoundConfig` to `WriteOptions` in `playback/src/types.ts`
- [x] 1.3 Export `SoundConfig` from `playback/` package index

## 2. Stroke Type Classifier

- [x] 2.1 Create `playback/src/StrokeClassifier.ts` with `classifyStroke(points): StrokeType` function
- [x] 2.2 Implement direction-vector angle computation using dot product
- [x] 2.3 Implement max-angle scan across point triples to determine type
- [x] 2.4 Apply configurable thresholds from `SoundConfig.thresholds` (default 15°/60°)
- [x] 2.5 Handle short-stroke edge case (< 3 points → `straight`)

## 3. SoundEngine

- [x] 3.1 Create `playback/src/SoundEngine.ts` with constructor accepting `AudioContext` and `SoundConfig`
- [x] 3.2 Implement `preload(): Promise<void>` — fetch + `decodeAudioData` for all URLs, deduplicate by URL
- [x] 3.3 Implement per-type random clip selection with fallback to combined pool
- [x] 3.4 Implement `playForStroke(type: StrokeType): void` — creates and starts a `BufferSource` node
- [x] 3.5 Implement shuffle mode: track mean stroke duration, activate when below half shortest-clip duration
- [x] 3.6 Implement shuffle queue: Fisher-Yates across all clips, guarantee no back-to-back repeat at queue boundary
- [x] 3.7 Implement `context.resume()` guard with 50ms timeout and single console warning

## 4. HandwritingAnimator Integration

- [x] 4.1 Instantiate `SoundEngine` lazily in `HandwritingAnimator` when `options.sounds` is present
- [x] 4.2 Create `AudioContext` lazily on first `write()` call (or accept one via constructor option)
- [x] 4.3 Call `SoundEngine.preload()` before animation loop starts; await resolution before first stroke
- [x] 4.4 Pass stroke type to `SoundEngine.playForStroke()` at the start of each stroke's render sequence
- [x] 4.5 Pass mean stroke duration to `SoundEngine` each glyph for shuffle-mode threshold evaluation

## 5. Reveal.js Plugin Integration

- [x] 5.1 Add `sounds?: SoundConfig` to the plugin's config type / JSDoc
- [x] 5.2 Thread plugin-level `sounds` config into `write()` options for all handwriting canvases
- [x] 5.3 Parse `data-sounds` attribute on each canvas (JSON parse with try/catch; warn on invalid JSON)
- [x] 5.4 Apply per-canvas `data-sounds` override (including `null`/`false` suppression) over plugin-level config
- [x] 5.5 Rebuild `reveal-plugin/dist/handwriting-reveal.js` and verify it includes the sound engine

## 6. React Component Integration

- [x] 6.1 Add `sounds?: SoundConfig` to `HandwritingProps` in `handwriting-react/src/types.ts`
- [x] 6.2 Forward `sounds` prop to `write()` options in `Handwriting.tsx`
- [x] 6.3 Add `useEffect` in `Handwriting.tsx` to call `SoundEngine.preload()` on mount / when `sounds` changes
- [x] 6.4 Rebuild `handwriting-react/dist/` and verify types are exported correctly

## 7. Build and Distribution

- [x] 7.1 Run `npm run build` in `playback/` and verify both IIFE and ESM outputs include classifier and sound engine
- [x] 7.2 Run `npm run build` in `reveal-plugin/` and verify single-file bundle includes sound engine
- [x] 7.3 Run `npm run build` in `handwriting-react/` and verify ESM output includes sound forwarding

## 8. Manual Verification

- [x] 8.1 Add test MP3 clips to `demo/` and update `demo/index.html` to pass a `sounds` config
- [ ] 8.2 Verify audio plays in demo page at normal speed with type-based clip selection
- [ ] 8.3 Verify shuffle mode activates at high speed (speed ≥ 5×) and produces varied audio
- [ ] 8.4 Verify silent animation when `sounds` is omitted (no console errors)
- [ ] 8.5 Verify Reveal.js demo slide plays audio on slide entry and fragment reveal

## MODIFIED Requirements

### Requirement: Playback engine public API
The playback engine SHALL expose a class-based API that accepts an HTML canvas element and an exported glyph set JSON object. It SHALL provide a `write(text, options)` method that animates the given string on the canvas, and an overloaded form `write(layout, options)` that accepts a `HandwritingLayout` in place of a string. When a `HandwritingLayout` is provided, the engine SHALL use the layout's pre-resolved `sequence` directly and SHALL NOT re-randomize capture selection. The `options` parameter SHALL accept at minimum a `speed` multiplier (default 1.5), a `color` value, a `capHeight` value in CSS pixels (default 80), a `scale` value for pixel density (default 2), and an optional `sounds` property accepting a `SoundConfig` object.

When `sounds` is provided, the engine SHALL instantiate a `SoundEngine` with the caller's `AudioContext` (or create one lazily), call `SoundEngine.preload()` before animation begins, and play clips in sync with stroke rendering as specified in the `playback-sound` capability.

The engine's built output SHALL be available as both an IIFE bundle (`handwriting-animator.js`, global name `HandwritingAnimatorLib`) and an ESM module (`handwriting-animator.esm.js`). The demo page (`demo/index.html`) SHALL reference the IIFE bundle from `../playback/dist/handwriting-animator.js` rather than inlining engine code.

#### Scenario: Instantiate and animate
- **WHEN** `new HandwritingAnimator(canvasEl, glyphData).write("Hello", { speed: 1.5 })` is called
- **THEN** the string "Hello" is animated on the canvas using the captured glyph data

#### Scenario: Speed multiplier adjusts animation pace
- **WHEN** `write` is called with `{ speed: 2.0 }` vs `{ speed: 1.0 }`
- **THEN** the 2.0 animation completes in half the wall-clock time of the 1.0 animation, preserving relative timing proportions within each stroke

#### Scenario: Demo uses built engine file
- **WHEN** `demo/index.html` is opened after running `npm run build` in `playback/`
- **THEN** the demo loads the engine from `../playback/dist/handwriting-animator.js` and operates correctly with no inline engine code present in the HTML

#### Scenario: Sounds play when SoundConfig provided
- **WHEN** `write("Hello", { sounds: { straight: ["./pen-straight.mp3"], curve: ["./pen-curve.mp3"] } })` is called
- **THEN** audio clips play at the start of each stroke according to the classified stroke type

#### Scenario: Animation works without sounds option
- **WHEN** `write("Hello", { speed: 1.5 })` is called with no `sounds` property
- **THEN** the animation plays silently with no errors or warnings related to audio

#### Scenario: write accepts HandwritingLayout
- **WHEN** `animator.write(layout, { x: 50, y: 80 })` is called with a `HandwritingLayout`
- **THEN** the layout's sequence is rendered without re-randomizing captures

#### Scenario: Layout write is stable across multiple calls
- **WHEN** `animator.write(layout, opts)` is called twice with the same layout
- **THEN** both renders draw identical captures for all glyphs

#### Scenario: Existing string write call unchanged
- **WHEN** `animator.write("Hello", opts)` is called with a plain string
- **THEN** behavior is identical to pre-change: captures are randomized per the existing algorithm

## MODIFIED Requirements

### Requirement: Playback engine public API
The playback engine SHALL expose a class-based API that accepts an HTML canvas element and an exported glyph set JSON object. It SHALL provide a `write(text, options)` method that animates the given string on the canvas. The `options` parameter SHALL accept at minimum a `speed` multiplier (default 1.5), a `color` value, a `capHeight` value in CSS pixels (default 80), and a `scale` value for pixel density (default 2).

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

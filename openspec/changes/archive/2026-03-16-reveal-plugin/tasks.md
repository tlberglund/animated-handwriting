## 1. Demo Cleanup

- [x] 1.1 Remove the inline `HandwritingAnimator` class and `buildSampleGlyphSet` function from `demo/index.html`
- [x] 1.2 Add `<script src="../playback/dist/handwriting-animator.js"></script>` to `demo/index.html`
- [x] 1.3 Update `demo/index.html` to reference `HandwritingAnimatorLib.HandwritingAnimator` instead of the local class
- [x] 1.4 Add a comment in `demo/index.html` noting that `playback/` must be built first (`cd playback && npm run build`)

## 2. Capture App Export Button

- [x] 2.1 Add an `exportGlyphSet` handler in the capture app that calls `api.exportGlyphSet(captureSetId)`, then triggers a download of `JSON.stringify(data)` as `<captureSetName>.json`
- [x] 2.2 Add an Export button to the top bar (disabled when no capture set is selected)
- [x] 2.3 Wire the Export button to the handler from 2.1

## 3. Reveal Plugin Package Setup

- [x] 3.1 Create `reveal-plugin/` directory with `package.json` (name: `handwriting-reveal`, build script using esbuild with `--format=iife --global-name=HandwritingReveal`, bundling from `src/index.ts`)
- [x] 3.2 Create `reveal-plugin/tsconfig.json` mirroring `playback/tsconfig.json`
- [x] 3.3 Run `npm install` in `reveal-plugin/`

## 4. Reveal Plugin Implementation

- [x] 4.1 Create `reveal-plugin/src/index.ts` with the plugin object `{ id: 'handwriting', init(deck) { ... } }`
- [x] 4.2 Implement glyph set cache: `Map<string, Promise<GlyphSet>>` with a `loadGlyphSet(url)` helper that deduplicates fetches
- [x] 4.3 Implement `prefetchSlide(slide)`: queries all `[data-handwriting]` canvases on the slide and calls `loadGlyphSet` for each resolved URL (plugin-level or per-canvas override)
- [x] 4.4 Implement `resolveOptions(canvas, pluginConfig)`: merges `data-speed`, `data-cap-height`, `data-color`, `data-glyph-set` attributes with plugin-level config; warns and returns `null` if no glyph set URL is resolvable
- [x] 4.5 Implement `animateCanvas(canvas, pluginConfig)`: resolves options, awaits the cached glyph set promise, logs a console error on fetch failure, warns if canvas has zero size, then calls `new HandwritingAnimator(canvas, glyphSet).write(text, opts)`
- [x] 4.6 Implement `isFragment(canvas)`: returns true if the canvas itself has class `fragment` or any ancestor within the slide has class `fragment`
- [x] 4.7 Register `slidechanged` handler: call `prefetchSlide(currentSlide)`, then animate all non-fragment `[data-handwriting]` canvases on `currentSlide`
- [x] 4.8 Register `fragmentshown` handler: find `[data-handwriting]` canvases on the fragment itself or among its descendants; call `animateCanvas` for each
- [x] 4.9 Register `fragmenthidden` handler: find `[data-handwriting]` canvases in the hidden fragment; clear each by resetting `canvas.width = canvas.width`
- [x] 4.10 Handle initial slide on `init`: call `prefetchSlide` and animate non-fragment canvases on `deck.getCurrentSlide()`
- [x] 4.11 Validate plugin config on `init`: log a console error and return early if `handwriting.glyphSet` is missing

## 5. Build and Verify

- [x] 5.1 Run `npm run build` in `reveal-plugin/` and confirm `dist/handwriting-reveal.js` is produced
- [x] 5.2 Run `npm run build` in `playback/` and confirm the demo loads without errors
- [x] 5.3 Manually verify: open `demo/index.html` (with a local server), confirm the engine works via the built file
- [x] 5.4 Manually verify: create a minimal test presentation HTML that loads `handwriting-reveal.js`, registers the plugin, and exercises non-fragment canvas animation on slide entry
- [x] 5.5 Manually verify: test fragment canvas — add a `class="fragment"` canvas to the test presentation and confirm it animates on reveal and clears on back-navigation
- [x] 5.6 Manually verify: test per-canvas overrides (`data-speed`, `data-cap-height`, `data-color`, `data-glyph-set`)
- [x] 5.7 Manually verify: export a glyph set from the capture app, load it in the test presentation, confirm correct rendering

## Context

The project already has a working playback engine (`playback/HandwritingAnimator`) and a backend export endpoint (`/api/capture-sets/:id/export`). The demo page (`demo/index.html`) inlines a copy of the engine — a maintenance hazard. The capture app has an export API call but no UI for it. The missing piece is a Reveal.js plugin that connects the engine to presentation slides, plus the export button that produces the JSON the plugin consumes.

## Goals / Non-Goals

**Goals:**
- Single-file plugin distribution: one `.js` file to copy into a presentation directory
- Animate `[data-handwriting]` canvases on slide entry (non-fragment) and fragment reveal
- Prefetch glyph sets on slide entry to avoid visible delay at fragment reveal time
- Per-canvas overrides for all visual parameters; required glyph set at plugin level
- Clean demo that doesn't drift from the real engine

**Non-Goals:**
- npm package / CDN distribution (deferred to a later proposal)
- Automatic canvas sizing (author controls via CSS)
- Integration with Reveal themes or speaker notes
- Supporting Reveal.js versions below 4.x

## Decisions

### 1. Single bundled output via esbuild

The plugin imports `HandwritingAnimator` from `../playback/src/index.ts`. esbuild bundles both into one IIFE file at `reveal-plugin/dist/handwriting-reveal.js`, with global name `HandwritingReveal`.

*Alternative considered*: Require users to load `handwriting-animator.js` separately, then load the plugin. Rejected — two files is worse UX for a copy-in distribution model. Bundling is trivial with esbuild and keeps deployment simple.

### 2. Plugin-level config, per-canvas overrides via `data-*` attributes

```js
// Plugin-level (required):
Reveal.initialize({
  plugins: [HandwritingReveal],
  handwriting: {
    glyphSet: './my-hand.json',  // required
    speed: 1.5,                  // optional, default 1.5
    capHeight: 80,               // optional, default 80
    color: '#1a1a1a',            // optional, default '#1a1a1a'
  }
})

// Per-canvas (all optional — each falls back to plugin-level config):
<canvas data-handwriting="text"
        data-glyph-set="./other-hand.json"
        data-speed="2.0"
        data-cap-height="120"
        data-color="#c0392b"
        style="width:600px;height:150px">
</canvas>
```

`data-handwriting` is the only required per-canvas attribute. All others fall back to plugin-level config.

### 3. Two trigger events: `slidechanged` + `fragmentshown`

- **`slidechanged`**: animates all non-fragment `[data-handwriting]` canvases on the incoming slide immediately. Also prefetches glyph sets for every `[data-handwriting]` canvas on the slide (including fragments).
- **`fragmentshown`**: animates the canvas if the revealed element is `[data-handwriting]`, or contains a `[data-handwriting]` canvas.
- **`fragmenthidden`**: clears the canvas (2D context `clearRect`) so it re-animates when shown again.
- **`slidechanged` (leaving)**: cancels in-progress animations on the outgoing slide by replacing each canvas's 2D context (re-setting width resets the context and stops rAF chains from drawing further).

*Alternative considered*: Only `fragmentshown`, requiring authors to wrap slide-entry canvases in a fragment. Rejected — forcing unnecessary fragments is awkward; `slidechanged` handles the common case naturally.

### 4. Glyph set caching by URL

```
Map<string, Promise<GlyphSet>>
```

On prefetch: `cache.set(url, fetch(url).then(r => r.json()))`. On animate: `await cache.get(url)`. The Promise is stored (not the resolved value), so concurrent fetches for the same URL naturally coalesce.

### 5. Export button placement: capture app top bar

The export button sits in the top bar alongside the capture set selector and existing buttons. It calls the existing `/export` endpoint and triggers a browser download of `JSON.stringify(data)` (compact, no indentation) as `<set-name>.json`.

*Alternative considered*: Export from a context menu or settings panel. Rejected — the top bar is already the set-level action zone; this belongs there.

### 6. Demo cleanup: reference built file directly

`demo/index.html` changes from an inline engine copy to:

```html
<script src="../playback/dist/handwriting-animator.js"></script>
```

The engine is accessed as `HandwritingAnimatorLib.HandwritingAnimator`. The demo's data-source section and controls are otherwise unchanged. Running the demo requires `cd playback && npm run build` first; this is documented in the demo's source comments.

## Risks / Trade-offs

- **Canvas size must be set by author** → Risk of zero-size canvases producing blank output. Mitigation: plugin logs a console warning if `clientWidth` or `clientHeight` is 0 at animate time.
- **Glyph set fetch fails** → Risk of silent blank canvas. Mitigation: plugin logs a console error identifying the failing URL; canvas is left blank (not broken).
- **Re-animation on back-navigate** → Clearing the canvas on `fragmenthidden` / `slidechanged` means going back and forward re-plays animations. This is the desired behavior per the design decision above.
- **esbuild bundles both libraries** → The bundled plugin is larger (~the engine + plugin glue). Acceptable for a copy-in distribution model; revisit if/when moving to npm.

## Open Questions

- Should `minWidth` and `maxWidth` (stroke weight) be exposed as config/override options, or are the defaults (`2`/`4`) sufficient for now?

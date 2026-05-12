# @tlberglund/handwriting-reveal

A Reveal.js plugin that finds `<canvas>` elements marked with `data-handwriting` or `data-diagram` attributes and plays animated handwriting and diagram animations as slides advance. Animations can be triggered immediately on slide entry or sequenced through Reveal.js fragments. Both glyph sets (for handwriting) and diagram JSON files are fetched from URLs, cached on first load, and prefetched when a slide becomes active so that subsequent plays are instant.

---

## Installation

### Script tag (IIFE build)

Download or build `dist/handwriting-reveal.js` and include it before your `Reveal.initialize` call. The IIFE build exposes the plugin as the global `HandwritingReveal`.

```html
<script src="dist/handwriting-reveal.js"></script>
```

If you are using a CDN or self-hosted copy from the npm package:

```html
<script src="https://unpkg.com/@tlberglund/handwriting-reveal/dist/handwriting-reveal.js"></script>
```

### npm / ESM

```bash
npm install @tlberglund/handwriting-reveal
```

```js
import HandwritingReveal from '@tlberglund/handwriting-reveal';
```

---

## Basic setup

Register the plugin in `Reveal.initialize` and supply plugin-level defaults in the `handwriting` configuration key.

```html
<script src="dist/handwriting-reveal.js"></script>
<script>
  Reveal.initialize({
    plugins: [ HandwritingReveal ],
    handwriting: {
      glyphSet:  '/api/capture-sets/my-set/export',
      speed:     1.5,
      capHeight: 80,
      color:     '#1a1a1a',
      topPad:    12,
      sounds:    false,
    },
  });
</script>
```

ESM equivalent:

```js
import Reveal from 'reveal.js';
import HandwritingReveal from '@tlberglund/handwriting-reveal';

Reveal.initialize({
  plugins: [ HandwritingReveal ],
  handwriting: {
    glyphSet: '/api/capture-sets/my-set/export',
  },
});
```

### PluginConfig options

All options are placed under the `handwriting` key of `Reveal.initialize`. Every option except `glyphSet` has a built-in default and is optional. Individual canvas elements can override most of these with data attributes (see the Canvas markup section).

| Option | Type | Default | Description |
|---|---|---|---|
| `glyphSet` | `string` | _(none)_ | URL to the glyph set JSON used for handwriting animation. Required for any `data-handwriting` canvas to animate. Without this, the plugin logs a warning and handwriting canvases are skipped. |
| `speed` | `number` | `1.5` | Animation speed multiplier. Applies to both handwriting and diagram canvases unless overridden per-element. Higher values draw faster. |
| `capHeight` | `number` | `80` | Cap height in pixels. Controls the rendered size of characters. Also used to compute the default canvas height when `data-height` is absent. |
| `color` | `string` | `'#1a1a1a'` | Stroke color for both handwriting and diagram animations. Accepts any CSS color string. |
| `topPad` | `number` | `12` | Top padding in pixels. Added above the cap height when computing the auto-derived canvas height. |
| `sounds` | `SoundConfig \| true` | _(none)_ | Sound clips to play during stroke rendering. Pass `true` to use bundled defaults, or a `SoundConfig` object for custom clips. Omit or pass `false` to disable sound. |

---

## Canvas markup

Place `<canvas>` elements inside slide `<section>` elements and configure them with data attributes. The plugin scans the current slide for canvases on every `slidechanged` event and animates those that are not fragments. Fragment canvases are animated when their fragment is revealed.

A canvas must have either `data-handwriting` or `data-diagram` to be recognized by the plugin. A canvas that has neither attribute is ignored entirely.

### Handwriting canvases

A handwriting canvas requires a glyph set. The glyph set URL comes from `data-glyph-set` on the element, or falls back to the plugin-level `glyphSet` config option.

| Attribute | Description |
|---|---|
| `data-handwriting` | The text string to animate. The presence of this attribute marks the canvas as a handwriting target. An empty value is valid but produces no animation. |
| `data-glyph-set` | URL to a glyph set JSON export. Overrides the plugin-level `glyphSet` option for this canvas only. |
| `data-speed` | Speed multiplier for this canvas. Overrides the plugin-level `speed`. Accepts a decimal number (e.g. `"2"`, `"0.75"`). |
| `data-color` | Stroke color for this canvas. Overrides the plugin-level `color`. Accepts any CSS color string (e.g. `"#3366cc"`, `"red"`). |
| `data-cap-height` | Cap height in pixels for this canvas. Overrides the plugin-level `capHeight`. Also affects the auto-computed canvas height when `data-height` is absent. |
| `data-top-pad` | Top padding in pixels for this canvas. Overrides the plugin-level `topPad`. Also affects the auto-computed canvas height when `data-height` is absent. |
| `data-sounds` | Sound configuration override for this canvas. Accepts `"true"` (use bundled defaults), `"false"` or `"null"` (disable sound), or a JSON-encoded `SoundConfig` object. Overrides the plugin-level `sounds`. Invalid JSON falls back to the plugin-level sounds setting. |

### Diagram canvases

Diagram canvases load a JSON export of a diagram and replay its strokes. They do not use a glyph set.

| Attribute | Description |
|---|---|
| `data-diagram` | URL to a diagram JSON export. The presence of this attribute marks the canvas as a diagram target. |
| `data-diagram-speed` | Speed multiplier for this diagram animation. Overrides the plugin-level `speed`. Accepts a decimal number. |
| `data-diagram-color` | Stroke color for this diagram animation. Overrides the plugin-level `color`. Accepts any CSS color string. |

### Positioning attributes (both canvas types)

These attributes apply to both handwriting and diagram canvases. Position styles are injected at plugin initialization time, before any animation occurs.

| Attribute | Description |
|---|---|
| `data-x` | Left position of the canvas. Accepts a pixel value (e.g. `"240"`) or a percentage of the slide width (e.g. `"25%"`). Requires `data-y` to take effect — both axes must be present for absolute positioning to be applied. |
| `data-y` | Top position of the canvas. Accepts a pixel value or a percentage of the slide height. Requires `data-x`. |
| `data-width` | Canvas width. Accepts a pixel value or a percentage of the slide width. Optional — if omitted the canvas uses its natural or CSS-specified width. |
| `data-height` | Canvas height. Accepts a pixel value or a percentage of the slide height. For handwriting canvases, if `data-height` is omitted and `data-x`/`data-y` positioning is active, the height is computed automatically as `topPad + capHeight * 1.5`. |

When both `data-x` and `data-y` are present the canvas is positioned with `position: absolute` relative to the slide. If either axis is absent the canvas remains in normal document flow and no position styles are injected.

Slide dimensions default to `960 x 700` if not configured in Reveal.

---

## Fragments

Canvas elements participate in Reveal.js fragment sequencing in two ways:

1. The canvas element itself carries the `fragment` class.
2. The canvas is a descendant of an element that carries the `fragment` class.

In either case the plugin treats the canvas as a fragment canvas and does not animate it on `slidechanged`. Instead it waits for `fragmentshown` and animates the canvas at that point. When `fragmenthidden` fires (the user steps back through fragments) the canvas is cleared and returns to a blank state.

This means a slide can have multiple animated canvases that play in sequence as the presenter advances through fragments, interleaved with any other fragment content on the slide.

Example with two sequenced handwriting canvases:

```html
<section>
  <h2>Steps</h2>

  <!-- Plays immediately when the slide appears -->
  <canvas
    data-handwriting="Step one"
    data-x="80"
    data-y="200"
    style="width: 400px; height: 110px;"
  ></canvas>

  <!-- Plays when the presenter advances to fragment 1 -->
  <canvas
    class="fragment"
    data-handwriting="Step two"
    data-x="80"
    data-y="340"
    style="width: 400px; height: 110px;"
  ></canvas>

  <!-- Plays when the presenter advances to fragment 2 -->
  <canvas
    class="fragment"
    data-handwriting="Step three"
    data-x="80"
    data-y="480"
    style="width: 400px; height: 110px;"
  ></canvas>
</section>
```

A canvas nested inside a fragment container works the same way:

```html
<div class="fragment">
  <p>Some text that appears together with the animation.</p>
  <canvas data-handwriting="Annotated" data-x="300" data-y="500"
          style="width: 300px; height: 110px;"></canvas>
</div>
```

---

## Slide lifecycle

### slidechanged

When the active slide changes, the plugin:

1. Prefetches all glyph set URLs and diagram URLs referenced on the newly active slide, starting the network requests immediately even before the animations are triggered.
2. Animates every non-fragment `data-handwriting` and `data-diagram` canvas on the new slide.
3. Clears (resets) every `data-handwriting` and `data-diagram` canvas on the previous slide by reassigning `canvas.width`, which wipes the bitmap and cancels any in-progress frame-by-frame drawing.

### fragmentshown

When a fragment is revealed, the plugin animates any `data-handwriting` or `data-diagram` canvas that is either the fragment element itself or a descendant of it.

### fragmenthidden

When a fragment is hidden (the presenter steps backward), the plugin clears any `data-handwriting` or `data-diagram` canvas on that fragment, returning it to a blank state so it will animate cleanly if the fragment is shown again.

### Initial slide

On plugin initialization the plugin also animates the slide that is already visible when `Reveal.initialize` runs, using the same non-fragment logic as `slidechanged`. Prefetching is triggered for the initial slide as well.

---

## Full example

```html
<section>
  <h2>Architecture</h2>

  <!-- Handwriting in normal document flow -->
  <canvas
    data-handwriting="Hello, world"
    style="width: 500px; height: 110px;"
  ></canvas>

  <!-- Diagram, absolutely positioned, custom speed -->
  <canvas
    data-diagram="/api/diagrams/abc123/export"
    data-x="600"
    data-y="200"
    data-width="340"
    data-height="260"
    data-diagram-speed="2"
    data-diagram-color="#2244aa"
  ></canvas>

  <!-- Fragment handwriting with per-element overrides -->
  <canvas
    class="fragment"
    data-handwriting="Step two"
    data-glyph-set="/api/capture-sets/alternate/export"
    data-speed="1"
    data-color="#cc3300"
    data-cap-height="64"
    data-x="100"
    data-y="480"
    style="width: 300px; height: 100px;"
  ></canvas>
</section>
```

---

## Build

The plugin is bundled with [esbuild](https://esbuild.github.io/). Both the handwriting playback engine (`@tlberglund/handwriting-playback`) and the diagram playback engine (`@tlberglund/diagram-playback`) are bundled into the single output file.

| Script | Output | Format | Global |
|---|---|---|---|
| `npm run build` | `dist/handwriting-reveal.js` | IIFE | `HandwritingReveal` |
| `npm run build:esm` | `dist/handwriting-reveal.esm.js` | ESM | — |
| `npm run build:types` | `dist/index.d.ts` | TypeScript declarations | — |
| `npm run watch` | `dist/handwriting-reveal.js` | IIFE (watch mode) | `HandwritingReveal` |

```bash
npm run build        # production IIFE bundle
npm run build:esm    # ESM bundle for use with import
npm run build:types  # TypeScript declaration files only
npm run watch        # rebuild IIFE on every source change
```

The IIFE bundle is the one to use with a plain `<script>` tag. The ESM bundle is for projects that import the plugin through a bundler or native ES module imports.

---

## License

MIT

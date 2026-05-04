# reveal-plugin

Reveal.js plugin for embedding handwriting and diagram animations in slides. Canvases marked with `data-handwriting` or `data-diagram` animate automatically when their slide becomes active. Fragment canvases animate when the fragment is shown and clear when it is hidden.

## Build

```bash
npm run build
# → dist/handwriting-reveal.js (IIFE global: HandwritingReveal)
```

## Setup

Include the built script and register the plugin in `Reveal.initialize`:

```html
<script src="dist/handwriting-reveal.js"></script>
<script>
  Reveal.initialize({
    plugins: [ HandwritingReveal ],
    handwriting: {
      glyphSet: '/api/capture-sets/my-set/export',
      speed: 1.5,
      capHeight: 80,
      color: '#1a1a1a',
      topPad: 12,
    },
  });
</script>
```

## Plugin configuration

These options go in the `handwriting` key of the `Reveal.initialize` config object. All options can be overridden per-canvas with data attributes.

| Option | Default | Description |
|---|---|---|
| `glyphSet` | _(none)_ | URL to the default glyph set JSON (required for handwriting canvases) |
| `speed` | `1.5` | Default animation speed multiplier |
| `capHeight` | `80` | Default cap height in pixels |
| `color` | `'#1a1a1a'` | Default stroke color |
| `topPad` | `12` | Default top padding in pixels |

## Canvas data attributes

Place `<canvas>` elements inside slide `<section>` elements and configure them with data attributes.

### Handwriting canvases

| Attribute | Description |
|---|---|
| `data-handwriting` | Text to animate. Presence of this attribute identifies the canvas as a handwriting target. |
| `data-glyph-set` | URL to a glyph set JSON export. Overrides the plugin-level `glyphSet`. |
| `data-speed` | Speed multiplier. Overrides `speed`. |
| `data-color` | Stroke color. Overrides `color`. |
| `data-cap-height` | Cap height in pixels. Overrides `capHeight`. |
| `data-top-pad` | Top padding in pixels. Overrides `topPad`. |

### Diagram canvases

| Attribute | Description |
|---|---|
| `data-diagram` | URL to a diagram JSON export. Presence of this attribute identifies the canvas as a diagram target. |
| `data-diagram-speed` | Speed multiplier for this diagram. Overrides `speed`. |
| `data-diagram-color` | Stroke color for this diagram. Overrides `color`. |

### Positioning (both types)

| Attribute | Description |
|---|---|
| `data-x` | Left position in pixels, or as a percentage of slide width (e.g. `"30%"`). Requires `data-y`. |
| `data-y` | Top position in pixels, or as a percentage of slide height. Requires `data-x`. |
| `data-width` | Canvas width in pixels or as a percentage of slide width. |
| `data-height` | Canvas height in pixels or as a percentage of slide height. If omitted for handwriting canvases, computed from `capHeight` and `topPad`. |

When both `data-x` and `data-y` are present, the canvas is absolutely positioned on the slide. Omitting either axis leaves the canvas in normal document flow.

## Example

```html
<section>
  <h2>Architecture</h2>

  <!-- Handwriting in normal flow -->
  <canvas
    data-handwriting="Hello, world"
    style="width: 500px; height: 110px;"
  ></canvas>

  <!-- Diagram absolutely positioned on the slide -->
  <canvas
    data-diagram="/api/diagrams/abc123/export"
    data-x="600"
    data-y="200"
    data-width="340"
    data-height="260"
  ></canvas>

  <!-- Fragment: animates when the fragment is revealed -->
  <canvas
    class="fragment"
    data-handwriting="Step two"
    data-x="100"
    data-y="400"
    style="width: 300px; height: 110px;"
  ></canvas>
</section>
```

Glyph set JSON and diagram JSON are fetched and cached the first time they are needed. Subsequent references to the same URL reuse the cached response.

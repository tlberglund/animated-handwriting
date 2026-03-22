# handwriting-react

React component wrapping `HandwritingAnimator` from `handwriting-playback`. Animates handwritten text on a canvas, playing when the element scrolls into view.

## Installation

```bash
# From the repo root (local path dependency)
npm install ../handwriting-react
```

Add peer dependencies if not already present:

```bash
npm install react react-dom
```

## Basic Usage

```tsx
import { Handwriting } from 'handwriting-react';

// Fetch your glyph set once (e.g. from your API)
const glyphSet = await fetch('/api/glyphsets/my-set/export').then(r => r.json());

function Hero() {
  return (
    <Handwriting
      glyphSet={glyphSet}
      text="Hello, world"
      style={{ width: 600, height: 130 }}
    />
  );
}
```

The component **does not fetch data**. Load the `GlyphSet` yourself and pass it as a prop.

## Data-Fetching Pattern

```tsx
import { useState, useEffect } from 'react';
import { Handwriting } from 'handwriting-react';
import type { GlyphSet } from 'handwriting-playback';

function AnimatedHeading({ text }: { text: string }) {
  const [glyphSet, setGlyphSet] = useState<GlyphSet | null>(null);

  useEffect(() => {
    fetch('/api/glyphsets/my-set/export')
      .then(r => r.json())
      .then(setGlyphSet);
  }, []);

  if (!glyphSet) return null;

  return (
    <Handwriting
      glyphSet={glyphSet}
      text={text}
      style={{ width: 500, height: 120 }}
    />
  );
}
```

## Sizing

You **must** set width and height on the component. The canvas fills its wrapper `<div>`, which receives your `className` and `style`. If the canvas has zero dimensions when animation triggers, a console warning is logged and no animation runs.

```tsx
// Via style
<Handwriting style={{ width: 400, height: 100 }} ... />

// Via className (Tailwind example)
<Handwriting className="w-96 h-24" ... />
```

## `playOn` Prop

| Value | Behavior |
|-------|----------|
| `"visible"` (default) | Plays once when the canvas first scrolls into view (IntersectionObserver). Falls back to mount if IntersectionObserver is unavailable. |
| `"mount"` | Plays immediately in a `useEffect` on mount. |

```tsx
<Handwriting playOn="mount" glyphSet={glyphSet} text="Hi" style={{ width: 300, height: 80 }} />
```

## Imperative Ref

Use a ref to replay the animation programmatically:

```tsx
import { useRef } from 'react';
import { Handwriting } from 'handwriting-react';
import type { HandwritingHandle } from 'handwriting-react';

function Demo() {
  const ref = useRef<HandwritingHandle>(null);

  return (
    <>
      <Handwriting
        ref={ref}
        glyphSet={glyphSet}
        text="Replay me"
        style={{ width: 400, height: 100 }}
      />
      <button onClick={() => ref.current?.play()}>Replay</button>
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `glyphSet` | `GlyphSet` | required | Pre-loaded glyph set from the export endpoint |
| `text` | `string` | required | Text to animate |
| `speed` | `number` | `1.5` | Speed multiplier |
| `color` | `string` | `'#1a1a1a'` | Stroke color |
| `capHeight` | `number` | `80` | Cap-height in CSS pixels |
| `topPad` | `number` | `12` | Top padding in CSS pixels |
| `minWidth` | `number` | `2` | Minimum stroke width in px |
| `maxWidth` | `number` | `4` | Maximum stroke width in px |
| `letterGap` | `number` | `0.05` | Gap between letters in cap-height units |
| `wordGap` | `number` | `0.35` | Gap between words in cap-height units |
| `playOn` | `'visible' \| 'mount'` | `'visible'` | When to trigger animation |
| `onComplete` | `() => void` | — | Called when animation finishes |
| `className` | `string` | — | Applied to wrapper div |
| `style` | `CSSProperties` | — | Applied to wrapper div |

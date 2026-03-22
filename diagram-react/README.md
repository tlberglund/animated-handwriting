# diagram-react

React component wrapping `DiagramAnimator` from `diagram-playback`. Animates a pre-loaded diagram on a canvas, playing when the element scrolls into view.

## Installation

```bash
# From the repo root (local path dependency)
npm install ../diagram-react
```

Add peer dependencies if not already present:

```bash
npm install react react-dom
```

## Basic Usage

```tsx
import { Diagram } from 'diagram-react';

// Fetch your diagram export once (e.g. from your API)
const diagram = await fetch('/api/diagrams/my-diagram/export').then(r => r.json());

function ArchitectureDiagram() {
  return (
    <Diagram
      diagram={diagram}
      style={{ width: '100%' }}
    />
  );
}
```

The component **does not fetch data**. Load the `DiagramExport` yourself and pass it as a prop.

## Data-Fetching Pattern

```tsx
import { useState, useEffect } from 'react';
import { Diagram } from 'diagram-react';
import type { DiagramExport } from 'diagram-playback';

function AnimatedDiagram({ id }: { id: string }) {
  const [diagram, setDiagram] = useState<DiagramExport | null>(null);

  useEffect(() => {
    fetch(`/api/diagrams/${id}/export`)
      .then(r => r.json())
      .then(setDiagram);
  }, [id]);

  if (!diagram) return null;

  return <Diagram diagram={diagram} style={{ width: '100%' }} />;
}
```

## Responsive Sizing

`<Diagram>` sets `aspect-ratio` on the canvas from `diagram.aspectRatio`. Control width via CSS; height is computed by the browser automatically.

```tsx
// Full-width, responsive
<Diagram diagram={diagram} style={{ width: '100%' }} />

// Fixed width
<Diagram diagram={diagram} style={{ width: 800 }} />

// Tailwind
<Diagram diagram={diagram} className="w-full max-w-2xl" />
```

## `playOn` Prop

| Value | Behavior |
|-------|----------|
| `"visible"` (default) | Plays once when the canvas first scrolls into view (IntersectionObserver). Falls back to mount if IntersectionObserver is unavailable. |
| `"mount"` | Plays immediately in a `useEffect` on mount. |

```tsx
<Diagram playOn="mount" diagram={diagram} style={{ width: '100%' }} />
```

## Imperative Ref

Use a ref to replay the animation programmatically:

```tsx
import { useRef } from 'react';
import { Diagram } from 'diagram-react';
import type { DiagramHandle } from 'diagram-react';

function Demo() {
  const ref = useRef<DiagramHandle>(null);

  return (
    <>
      <Diagram
        ref={ref}
        diagram={diagram}
        style={{ width: '100%' }}
      />
      <button onClick={() => ref.current?.play()}>Replay</button>
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `diagram` | `DiagramExport` | required | Pre-loaded diagram from the export endpoint |
| `speed` | `number` | `1.5` | Speed multiplier |
| `color` | `string` | `'#1a1a1a'` | Stroke color |
| `minWidth` | `number` | `1.5` | Minimum stroke width in px |
| `maxWidth` | `number` | `3` | Maximum stroke width in px |
| `playOn` | `'visible' \| 'mount'` | `'visible'` | When to trigger animation |
| `onComplete` | `() => void` | — | Called when animation finishes |
| `className` | `string` | — | Applied to the canvas element |
| `style` | `CSSProperties` | — | Applied to the canvas element (merged with `aspect-ratio`) |

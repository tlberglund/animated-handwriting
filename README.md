# animated-handwriting

A system for capturing, storing, and animating handwritten text and diagrams. Users draw glyph forms (individual letter shapes) and diagrams through a web UI; the backend stores the stroke data and exposes export endpoints that return normalized JSON. Playback libraries consume that JSON and animate the strokes frame-by-frame on HTML canvas elements.

The primary output is embeddable canvas animations for web pages. The main integration target is Reveal.js presentations, where canvases placed on slides animate automatically as slides advance.

## Architecture

| Subproject | Description |
|---|---|
| [backend](./backend/README.md) | Ktor REST API with PostgreSQL storage and Flyway migrations; the central data store for all glyph sets and diagrams |
| [capture-app](./capture-app/README.md) | React 19 / Vite web UI for recording glyph captures and drawing diagrams |
| [playback](./playback/README.md) | Core TypeScript engine that animates handwritten text on a canvas from a glyph set export |
| [diagram-playback](./diagram-playback/README.md) | Core TypeScript engine that animates diagrams on a canvas from a diagram export |
| [handwriting-react](./handwriting-react/README.md) | React component wrapping `HandwritingAnimator`; drop-in for React applications |
| [diagram-react](./diagram-react/README.md) | React component wrapping `DiagramAnimator`; drop-in for React applications |
| [reveal-plugin](./reveal-plugin/README.md) | Reveal.js plugin that drives handwriting and diagram animations on presentation slides |

## How the pieces fit together

1. **Capture**: The `capture-app` communicates with the `backend` to record stroke data. For glyphs, users draw each letter multiple times; captures are stored per character under a named glyph set. For diagrams, users draw freehand and the strokes are saved as a diagram record.

2. **Export**: The `backend` normalizes stored strokes and exposes export endpoints (`GET /api/capture-sets/{id}/export` and `GET /api/diagrams/{id}/export`) that return self-contained JSON payloads suitable for playback.

3. **Playback**: The `playback` and `diagram-playback` packages consume those JSON exports and render animated strokes onto a canvas. Most consumers use the higher-level wrappers instead of these engines directly.

4. **Integration**:
   - React apps use `handwriting-react` or `diagram-react`, which wrap the engines in components that trigger on scroll visibility.
   - Reveal.js presentations use `reveal-plugin`, which listens to slide and fragment events and triggers animations automatically on canvas elements marked with `data-handwriting` or `data-diagram`.

## Quick start

The entire stack (backend + capture UI) runs via Docker Compose:

```bash
docker compose up
```

- Capture app: http://localhost:5173
- Backend API: http://localhost:8080

See individual subproject READMEs for local development instructions.

## Why

The capture app is a single-file vanilla JavaScript application with fragile, imperative DOM manipulation and scattered in-memory state. As the feature set grows, this approach makes it increasingly difficult to add functionality reliably. Migrating to React with all state derived from backend API calls will make the app more maintainable, testable, and correct.

## What Changes

- Replace the single-file `capture-app/index.html` vanilla JS app with a React application (Vite-based)
- All capture set data (list, selection, glyph progress, current character captures) is fetched from backend APIs—no client-side state bootstrapping or local assumptions
- Capture sets are created via `POST /api/capture-sets` and immediately reflected in UI from the API response
- Glyph progress is driven by `GET /api/capture-sets/{id}/progress` and `GET /api/capture-sets/{id}/glyphs`
- Current character captures are fetched via `GET /api/capture-sets/{id}/glyphs/{char}` on character selection
- Canvas drawing (stroke capture) remains in vanilla canvas/Pointer API code, wrapped in a React component
- Stroke submission calls `POST /api/capture-sets/{id}/glyphs/{char}/captures` and refreshes state from the backend response
- Delete capture calls `DELETE /api/capture-sets/{id}/glyphs/{char}/captures/{captureId}` and refreshes from backend
- Character grid / glyph picker is a React component populated from API data

## Capabilities

### New Capabilities

- `capture-app-react`: React SPA for handwriting capture, replacing the vanilla JS app. Manages all UI state via API calls with no local state assumptions.

### Modified Capabilities

<!-- None — this is a frontend rewrite; backend API contracts are unchanged. -->

## Impact

- `capture-app/index.html` is replaced by a React app scaffolded with Vite
- No backend API changes required
- `playback/` and `demo/` are unaffected
- New dev dependencies: React, React DOM, Vite (or similar bundler)
- The app must be served/built rather than opened as a raw HTML file (already the case for the backend dev server setup)

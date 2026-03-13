## Context

The current capture app is a single-file vanilla JavaScript SPA (`capture-app/index.html`). State is managed through module-level variables that are set on page load and mutated imperatively in event handlers. Some state is derived from the DOM rather than from data (e.g., the current character is read from an element's `data-char` attribute). This approach works but is fragile: changes to one part of the UI require careful auditing of side effects elsewhere, and there's no clear data flow to follow.

The backend already exposes a complete REST API covering capture sets, glyph listings, per-character captures, progress stats, and delete operations. The frontend currently calls these APIs but caches the results loosely in local variables.

## Goals / Non-Goals

**Goals:**
- Replace the vanilla JS app with a React app scaffolded via Vite
- All UI state is derived from backend API responses; no client-side assumptions about what characters exist or how many captures are required
- API calls are the single source of truth: create, delete, and capture submission all refetch the relevant data from the server
- Canvas drawing logic (Pointer API stroke capture, canvas preview/playback) is preserved as-is, wrapped in a React component
- Functional parity with the existing app: set selection, set creation, glyph picker, progress bar, stroke capture, preview, post-preview accept/retake, existing capture list with delete, capture count tracking

**Non-Goals:**
- Backend API changes (the existing API is sufficient)
- Playback or demo app changes
- Adding new features beyond what the current app supports
- Global state management library (React context or simple prop drilling is sufficient for this scope)
- Comprehensive test coverage (out of scope for this migration)

## Decisions

### Decision: Vite + React (no Next.js)
The app is a client-side SPA with no SSR requirements. Next.js adds complexity without benefit here. Vite gives fast HMR and a minimal build config, and is the standard choice for new React SPAs.

**Alternatives considered:** Create React App (deprecated), plain Webpack (too much boilerplate).

### Decision: No global state manager
The app has a simple linear flow: select set → select character → capture. State flows downward from a root `App` component that owns the selected set and character. Child components receive what they need via props. React Query (TanStack Query) is used for server state caching and refetching, eliminating the need for manual `useEffect`-based fetch patterns.

**Alternatives considered:** Redux (overkill), Zustand (reasonable but adds dependency for marginal benefit at this scale).

### Decision: React Query for all API state
Every piece of server data (capture sets list, glyph list, glyph progress, per-character captures) is managed through React Query. This provides:
- Automatic refetch after mutations
- Loading/error states with no boilerplate
- Cache invalidation on create/delete

**Alternatives considered:** Plain `useEffect` + `useState` (error-prone, requires manual invalidation).

### Decision: Canvas component wraps existing drawing logic
The stroke capture logic (Pointer API event handlers, canvas rendering, pressure-width mapping, animation playback) is preserved nearly verbatim and wrapped in a React component that exposes callbacks (`onCapture(strokes)`, `onRetake()`). This minimizes rewrite risk in the most complex part of the app.

### Decision: Serve via Vite dev server in development; built output replaces capture-app/ in production
The Vite project lives at `capture-app/` (replacing the existing directory). In development, `vite dev` serves on a configurable port. The backend dev setup can proxy `/api/` to the Ktor server. In production, `vite build` outputs to `capture-app/dist/`.

## Risks / Trade-offs

- [Risk: Canvas logic breakage during wrapper refactor] → Mitigation: Keep canvas event handlers and drawing functions as close to original as possible; only add React lifecycle wrappers (useEffect for setup/teardown, useRef for canvas element)
- [Risk: Race conditions on rapid capture/delete] → Mitigation: React Query's mutation + invalidation pattern handles this; disable action buttons while mutations are in flight
- [Risk: Mobile touch behavior regression] → Mitigation: Preserve `touch-action: none` on the canvas and test on mobile viewport; Pointer API handlers are unchanged

## Migration Plan

1. Scaffold Vite React app at `capture-app/` (replacing index.html with a proper project)
2. Implement API client module (`src/api.ts`) mapping all existing endpoints
3. Build component tree top-down: `App` → `TopBar` → `GlyphPicker` → `CaptureArea`
4. Port canvas drawing code into `CaptureCanvas` component using `useRef`/`useEffect`
5. Wire React Query hooks for each data dependency
6. Verify functional parity against the existing app manually
7. Remove old `index.html`

**Rollback:** The old `index.html` is preserved in git history. If the migration is problematic, revert the `capture-app/` directory.

## Open Questions

- Should the Vite dev server proxy `/api/` to localhost:8080, or should the app use a configurable `VITE_API_BASE_URL` env var? (Recommend: env var defaulting to empty string, which uses relative paths and works with any reverse proxy setup)

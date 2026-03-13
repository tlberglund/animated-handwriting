## 1. Project Setup

- [x] 1.1 Scaffold a new Vite + React + TypeScript project inside `capture-app/` (replacing `index.html`)
- [x] 1.2 Install dependencies: `react`, `react-dom`, `@tanstack/react-query`
- [x] 1.3 Add `VITE_API_BASE_URL` env var support in `src/api.ts` (defaults to empty string for relative paths)
- [x] 1.4 Configure Vite dev server proxy: `/api` → `http://localhost:8080` for local development

## 2. API Client

- [x] 2.1 Create `src/api.ts` with typed functions for `GET /api/capture-sets`
- [x] 2.2 Add `POST /api/capture-sets` to the API client
- [x] 2.3 Add `GET /api/capture-sets/{id}/glyphs` to the API client
- [x] 2.4 Add `GET /api/capture-sets/{id}/glyphs/{char}` to the API client
- [x] 2.5 Add `GET /api/capture-sets/{id}/progress` to the API client
- [x] 2.6 Add `POST /api/capture-sets/{id}/glyphs/{char}/captures` to the API client
- [x] 2.7 Add `DELETE /api/capture-sets/{id}/glyphs/{char}/captures/{captureId}` to the API client

## 3. Core Components

- [x] 3.1 Create `App` component that owns selected `captureSetId` and `currentChar` state
- [x] 3.2 Create `TopBar` component: capture set `<select>` populated from `useQuery` on `GET /api/capture-sets`, plus "New Set" button
- [x] 3.3 Wire "New Set" button to a `useMutation` on `POST /api/capture-sets` with prompt for name, invalidating the capture sets query on success
- [x] 3.4 Create `ProgressBar` component consuming `GET /api/capture-sets/{id}/progress` via `useQuery`
- [x] 3.5 Create `GlyphPicker` component consuming `GET /api/capture-sets/{id}/glyphs` via `useQuery`, rendering characters grouped by type with capture counts

## 4. Canvas Capture Component

- [x] 4.1 Create `CaptureCanvas` React component with a `useRef` for the canvas element
- [x] 4.2 Port Pointer API event handlers (pointerdown, pointermove, pointerup, pointercancel) from the original app into `useEffect` setup/teardown
- [x] 4.3 Port canvas drawing logic: stroke rendering with pressure-mapped width, cap-height and baseline guides
- [x] 4.4 Port preview/playback animation logic (stroke replay at original timing) into the component
- [x] 4.5 Expose `onCapture(strokes, canvasMeta)` callback prop called when user accepts the preview
- [x] 4.6 Expose `mode` prop (`'capture' | 'preview' | 'post-preview'`) and manage canvas state transitions accordingly

## 5. Capture Area Wiring

- [x] 5.1 Create `CaptureArea` component that composes `CaptureCanvas` and the existing-captures list
- [x] 5.2 Fetch existing captures for the selected character via `useQuery` on `GET /api/capture-sets/{id}/glyphs/{char}`
- [x] 5.3 Render existing captures list with delete buttons; wire delete to `useMutation` on `DELETE ...captures/{id}`, invalidating glyph detail and progress queries on success
- [x] 5.4 Wire `onCapture` callback to `useMutation` on `POST .../captures`, invalidating glyph detail and progress queries on success
- [x] 5.5 Show loading/disabled state on action buttons while mutations are in flight
- [x] 5.6 Display an error message if the capture submission mutation fails

## 6. Layout and Styling

- [x] 6.1 Port CSS from original `index.html` into component-level CSS modules or a global stylesheet
- [x] 6.2 Ensure `touch-action: none` is applied to the canvas element for mobile pointer events
- [x] 6.3 Verify dark-mode color scheme and layout match the original app on mobile viewport

## 7. Verification

- [ ] 7.1 Manually verify: capture sets list loads from API on startup
- [ ] 7.2 Manually verify: creating a new set calls the API and the new set appears in the selector
- [ ] 7.3 Manually verify: selecting a set populates the glyph picker and progress bar from the API
- [ ] 7.4 Manually verify: selecting a character shows existing captures fetched from the API
- [ ] 7.5 Manually verify: drawing and accepting a capture POSTs to the API and refreshes progress/glyph counts
- [ ] 7.6 Manually verify: deleting a capture calls the API and refreshes the capture list and progress
- [ ] 7.7 Test on a mobile/touch device to confirm Pointer API and canvas interaction works correctly

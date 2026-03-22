## 1. `handwriting-react/` Package Setup

- [x] 1.1 Create `handwriting-react/` directory with `package.json` (name: `handwriting-react`, peer deps: `react`, `react-dom`; dep: `handwriting-playback`; ESM-only esbuild build script)
- [x] 1.2 Create `handwriting-react/tsconfig.json` mirroring `playback/tsconfig.json` with `jsx: "react-jsx"` added
- [x] 1.3 Run `npm install` in `handwriting-react/`

## 2. `<Handwriting>` Component

- [x] 2.1 Create `handwriting-react/src/types.ts` with `HandwritingProps` interface (glyphSet, text, speed, color, capHeight, topPad, minWidth, maxWidth, letterGap, wordGap, playOn, onComplete, className, style) and `HandwritingHandle` interface (`play(): void`)
- [x] 2.2 Create `handwriting-react/src/Handwriting.tsx` — `forwardRef` component; renders a wrapper `<div>` forwarding `className`/`style`, with a `<canvas>` that fills it
- [x] 2.3 Implement play logic: build a `triggerPlay` function that calls `new HandwritingAnimator(canvas, glyphSet).write(text, opts)` and fires `onComplete` on resolution
- [x] 2.4 Implement `playOn="visible"` (default): set up `IntersectionObserver` on mount; on first intersection call `triggerPlay` and disconnect; fall back to mount if `IntersectionObserver` is unavailable
- [x] 2.5 Implement `playOn="mount"`: call `triggerPlay` in `useEffect` on mount
- [x] 2.6 Implement prop-change replay: track `hasPlayed` ref; when `text` or `glyphSet` changes and `hasPlayed` is true, call `triggerPlay` immediately
- [x] 2.7 Expose `HandwritingHandle` via `useImperativeHandle`: `play()` sets `hasPlayed = true` and calls `triggerPlay`
- [x] 2.8 Implement cleanup: cancel any in-progress animation on unmount (reset canvas width) and disconnect observer
- [x] 2.9 Create `handwriting-react/src/index.ts` exporting `Handwriting`, `HandwritingHandle`, `HandwritingProps`

## 3. Build and Verify `handwriting-react`

- [x] 3.1 Run `npm run build` in `handwriting-react/` and confirm `dist/handwriting-react.esm.js` is produced with no errors
- [x] 3.2 Verify the bundle does not include React (confirm it is treated as external/peer dep)

## 4. `diagram-react/` Package Setup

- [x] 4.1 Create `diagram-react/` directory with `package.json` (name: `diagram-react`, peer deps: `react`, `react-dom`; dep: `diagram-playback`; ESM-only esbuild build script)
- [x] 4.2 Create `diagram-react/tsconfig.json` mirroring `handwriting-react/tsconfig.json`
- [x] 4.3 Run `npm install` in `diagram-react/`

## 5. `<Diagram>` Component

- [x] 5.1 Create `diagram-react/src/types.ts` with `DiagramProps` interface (diagram, speed, color, minWidth, maxWidth, playOn, onComplete, className, style) and `DiagramHandle` interface (`play(): void`)
- [x] 5.2 Create `diagram-react/src/Diagram.tsx` — `forwardRef` component; renders a `<canvas>` with `style={{ aspectRatio: diagram.aspectRatio }}` merged with consumer `style`; forwards `className`
- [x] 5.3 Implement play logic: build a `triggerPlay` function that calls `new DiagramAnimator(canvas, diagram).play(opts)` and fires `onComplete` on resolution
- [x] 5.4 Implement `playOn="visible"` (default): same IntersectionObserver pattern as `<Handwriting>` — observe, play once on first intersection, disconnect; fall back to mount if unavailable
- [x] 5.5 Implement `playOn="mount"`: call `triggerPlay` in `useEffect` on mount
- [x] 5.6 Implement prop-change replay: when `diagram` changes and `hasPlayed` is true, call `triggerPlay` immediately
- [x] 5.7 Expose `DiagramHandle` via `useImperativeHandle`: `play()` sets `hasPlayed = true` and calls `triggerPlay`
- [x] 5.8 Implement cleanup: cancel in-progress animation on unmount and disconnect observer
- [x] 5.9 Create `diagram-react/src/index.ts` exporting `Diagram`, `DiagramHandle`, `DiagramProps`

## 6. Build and Verify `diagram-react`

- [x] 6.1 Run `npm run build` in `diagram-react/` and confirm `dist/diagram-react.esm.js` is produced with no errors
- [x] 6.2 Verify the bundle does not include React (confirm it is treated as external/peer dep)

## 7. Documentation

- [x] 7.1 Create `handwriting-react/README.md` with: installation (local path dep), basic usage example, data-fetching pattern, `playOn` prop docs, ref usage example
- [x] 7.2 Create `diagram-react/README.md` with: installation, basic usage example, data-fetching pattern, responsive sizing example, ref usage example

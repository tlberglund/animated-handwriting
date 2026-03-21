## 1. Value Parsing

- [x] 1.1 Add a `resolveDimension(value: string, slideSize: number): number` helper that returns `parseFloat(value) * slideSize / 100` when the value ends in `%`, or `parseFloat(value)` otherwise

## 2. Style Injection

- [x] 2.1 Add an `applyPositionStyles(canvas, pluginConfig, deck)` function that reads `data-x`, `data-y`, `data-width`, `data-height`; resolves each via `resolveDimension`; derives height from `topPad + capHeight * 1.5` when `data-height` is absent; and injects the appropriate CSS on the canvas element
- [x] 2.2 In `applyPositionStyles`, skip injection entirely when neither `data-x` nor `data-y` is present (canvas stays in flow)
- [x] 2.3 In `applyPositionStyles`, also skip injection when only one of `data-x` / `data-y` is present

## 3. Eager Init Scan

- [x] 3.1 In `init(deck)`, after the config validation check, query all `[data-handwriting]` canvases across the entire deck (`document.querySelectorAll`) and call `applyPositionStyles` on each

## 4. Demo Update

- [x] 4.1 Add a slide to `demo/reveal.html` that uses `data-x`, `data-y`, `data-width` to position a canvas absolutely — demonstrating both pixel and percentage values

## 5. Build and Verify

- [x] 5.1 Run `npm run build` in `reveal-plugin/` and confirm no errors
- [ ] 5.2 Manually verify: open `demo/reveal.html`, confirm the positioned canvas appears at the correct location with no layout flash on page load
- [ ] 5.3 Manually verify: confirm a canvas without `data-x`/`data-y` on the same slide continues to participate in normal flow
- [ ] 5.4 Manually verify: confirm height derivation — a canvas with `data-cap-height="100"` and no `data-height` renders at `topPad + 150px`

## 1. Types

- [x] 1.1 Add `HandwritingLayoutOptions` type to `playback/src/types.ts` (`{ letterGap?: number; wordGap?: number }`)
- [x] 1.2 Add `HandwritingLayout` class to `playback/src/types.ts` with `readonly sequence: SequencedGlyph[]` and `readonly width: number` properties

## 2. Standalone function

- [x] 2.1 Extract glyph tokenization and sequence-building logic from `HandwritingAnimator.buildSequence()` into a standalone `prepareLayout(glyphSet, text, opts?)` function in `playback/src/HandwritingAnimator.ts` (or a new `playback/src/layout.ts`)
- [x] 2.2 Compute `width` in `prepareLayout` as the final `xOffset` value after the last glyph (i.e., total advance including all gaps)
- [x] 2.3 Return a `HandwritingLayout` instance from `prepareLayout`

## 3. HandwritingAnimator changes

- [x] 3.1 Refactor `HandwritingAnimator.buildSequence()` to delegate to `prepareLayout` internally so there is a single code path
- [x] 3.2 Add `prepare(text, opts?: HandwritingLayoutOptions): HandwritingLayout` convenience method to `HandwritingAnimator`
- [x] 3.3 Overload `write()` to accept `string | HandwritingLayout` as first argument; when a `HandwritingLayout` is received, skip `buildSequence()` and pass `layout.sequence` directly to `animate()` / `drawInstant()`

## 4. Exports

- [x] 4.1 Export `HandwritingLayout`, `HandwritingLayoutOptions`, and `prepareLayout` from `playback/src/index.ts`

## 5. Verification

- [x] 5.1 Confirm existing `write(string, opts)` call in the demo still works after refactor
- [x] 5.2 Manually verify that calling `write(layout, opts)` twice with the same layout renders identical captures (no flickering)
- [x] 5.3 Verify `layout.width` equals the sum of capture widths plus gaps for a multi-character string
- [x] 5.4 Verify `prepareLayout` works without a `HandwritingAnimator` instance (call it with only a glyph set and string)
- [x] 5.5 Run `npm run build` in `playback/` and confirm no TypeScript errors

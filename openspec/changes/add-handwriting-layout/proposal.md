## Why

When handwriting elements are used in a scene-graph-based drawing program, dragging or repositioning an element triggers re-renders that call `write()` repeatedly, causing each render to re-randomize glyph capture selection and producing visible flickering. There is currently no way to freeze capture selection once and re-render consistently.

## What Changes

- **New**: `HandwritingLayout` class — holds a frozen `SequencedGlyph[]` and exposes a `width` property (in cap-height units) derived at construction time.
- **New**: `prepareLayout(glyphSet, text, opts?)` — standalone function that constructs a `HandwritingLayout` without requiring a canvas or animator instance.
- **New**: `HandwritingLayoutOptions` type — `{ letterGap?, wordGap? }`, the subset of `WriteOptions` that affects layout (baked into `xOffset` values at construction time).
- **Modified**: `HandwritingAnimator.write()` — overloaded to accept `string | HandwritingLayout` as the first argument; when a `HandwritingLayout` is passed, `buildSequence()` is skipped and `layout.sequence` is used directly.
- **New**: `HandwritingAnimator.prepare(text, opts?)` — convenience instance method that calls `prepareLayout(this.glyphSet, text, opts)`.

## Capabilities

### New Capabilities
- `handwriting-layout`: Frozen layout object that captures glyph/capture selection once at creation time, enabling stable multi-render of handwriting elements.

### Modified Capabilities
- `handwriting-playback`: The `write()` method gains an overload accepting `HandwritingLayout`; the "Random capture variant selection" behavior is unchanged for string input but bypassed when a layout is provided.

## Impact

- `playback/src/types.ts` — add `HandwritingLayout` class and `HandwritingLayoutOptions` type
- `playback/src/HandwritingAnimator.ts` — overload `write()`, add `prepare()`, expose `buildSequence()` logic via standalone function
- `playback/src/index.ts` — export `HandwritingLayout`, `HandwritingLayoutOptions`, `prepareLayout`
- No breaking changes; all existing `write(string, opts)` call sites continue to work unchanged

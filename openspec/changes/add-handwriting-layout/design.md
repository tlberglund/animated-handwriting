## Context

`HandwritingAnimator.write(text, opts)` currently calls `buildSequence()` on every invocation, which calls `pickCapture()` for each glyph — randomly selecting an `ExportCapture` each time. The `SequencedGlyph[]` that results is thrown away after each render. This is fine for single-shot animation but breaks for scene-graph use cases where the same element re-renders on drag, causing each render to select different captures and produce visible flickering.

The key insight from the existing code is that `buildSequence()` already separates concerns cleanly: it produces `SequencedGlyph[]` where each entry holds a frozen `ExportCapture` and an `xOffset` in cap-height units (not pixels). Everything downstream (`animate()`, `drawInstant()`) takes a `SequencedGlyph[]` plus render-time options (position, color, capHeight, speed). The layout phase and the render phase are already logically separate — they just aren't exposed that way.

## Goals / Non-Goals

**Goals:**
- Allow callers to freeze glyph capture selection once and re-render the result any number of times
- Enable layout creation without a canvas (canvas-independent construction)
- Preserve all existing `write(string, opts)` call sites without modification
- Expose total layout width in cap-height units for bounding-box calculations

**Non-Goals:**
- Serialization / deserialization of `HandwritingLayout` to JSON
- Modifying `diagram-playback` or any React wrapper packages
- Sharing a single layout across multiple glyph sets
- Changing the randomization algorithm itself

## Decisions

### 1. `HandwritingLayout` as a class, not a plain object or interface

**Decision**: `HandwritingLayout` is a class with a constructor.

**Rationale**: The `write()` overload needs a reliable way to distinguish a layout from a string at runtime. A class enables `instanceof` checking without any extra discriminant field. A plain object with a tagged type would also work but adds noise at call sites.

**Alternative considered**: Export a `type HandwritingLayout = { sequence: SequencedGlyph[]; width: number }` interface and check for the `sequence` property. Rejected: property sniffing is fragile and surprises callers who pass similar-shaped objects.

---

### 2. Standalone `prepareLayout` function, with an instance convenience method

**Decision**: The primary API is a standalone `prepareLayout(glyphSet, text, opts?)` exported function. `HandwritingAnimator.prepare(text, opts?)` is a convenience wrapper around it.

**Rationale**: A scene-graph node may need to construct a layout before a renderer (and therefore a canvas) is available. `HandwritingAnimator` requires a canvas in its constructor, so making the layout constructor depend on the animator would force a canvas into existence prematurely. The standalone function takes only `GlyphSet`, which is always available earlier.

**Alternative considered**: Static method `HandwritingAnimator.prepareLayout(glyphSet, text, opts)`. Functionally equivalent but still ties the concept to the animator class when the only real dependency is the glyph set.

---

### 3. `write()` overloaded, no separate render method

**Decision**: `HandwritingAnimator.write()` accepts `string | HandwritingLayout` as its first argument. No separate `render()` or `writeLayout()` method.

**Rationale**: Keeps the public API surface minimal. Callers switching from `write(text, opts)` to `write(layout, opts)` change only the first argument — all options, including `instant`, `sounds`, `x`, `y`, and animation settings, remain identical. A separate method would duplicate all of `WriteOptions` in the docs and force callers to learn a new entry point.

---

### 4. `HandwritingLayoutOptions` is a distinct type, not a subset of `WriteOptions`

**Decision**: `HandwritingLayoutOptions` is `{ letterGap?: number; wordGap?: number }` — only the options that affect `xOffset` values baked into the layout at construction time.

**Rationale**: Of all `WriteOptions` fields, only `letterGap` and `wordGap` affect layout. `capHeight`, `color`, `speed`, and all other options are applied at render time. Exposing a dedicated options type makes this boundary explicit and prevents callers from passing render-time options (e.g., `color`) to `prepare()` and wondering why they have no effect on re-renders.

## Risks / Trade-offs

- **Layout options baked in** → If a caller wants to change `letterGap` after construction, they must create a new layout. This is intentional — the frozen nature is the whole point — but it may surprise callers who expect layout and render options to be uniformly deferred. Mitigation: document clearly that `HandwritingLayoutOptions` fields are locked at construction.

- **`instanceof` check requires same `HandwritingLayout` class reference** → If the library is bundled multiple times (e.g., two packages each shipping their own copy), `instanceof` will fail across bundle boundaries. Mitigation: this project ships a single `playback` package and the scenario is unlikely; add a `readonly _brand = 'HandwritingLayout' as const` discriminant as a cheap fallback check if this becomes an issue.

- **`SequencedGlyph[]` is a public internal type** → Exposing `layout.sequence` gives callers access to raw capture data. This is acceptable given the library's current audience, but could constrain future internal refactors. Non-goal to solve now.

## Migration Plan

No migration needed. The change is purely additive:
- All existing `write(string, opts)` call sites compile and behave identically.
- No package versions need to be coordinated across consumers.
- The new exports are opt-in.

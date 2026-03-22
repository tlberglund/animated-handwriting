## ADDED Requirements

### Requirement: Handwriting component public API
The `handwriting-react` package SHALL export a `<Handwriting>` component that accepts a pre-loaded `GlyphSet` object and a `text` string, and animates the handwriting on a canvas. It SHALL also export the `HandwritingHandle` type for use with `useRef`.

#### Scenario: Basic render and animate
- **WHEN** `<Handwriting glyphSet={data} text="hello" style={{ width: 400, height: 130 }} />` is mounted
- **THEN** a canvas element is rendered and the animation plays when the component enters the viewport

#### Scenario: Exported types available
- **WHEN** a consumer imports from `handwriting-react`
- **THEN** `Handwriting`, `HandwritingHandle`, and `HandwritingProps` are all importable named exports

---

### Requirement: Consumer controls canvas dimensions
The `<Handwriting>` component SHALL forward `className` and `style` props to its wrapper element. The canvas SHALL fill the wrapper. The component SHALL NOT set any default width or height. If the canvas has zero `clientWidth` or `clientHeight` when animation is triggered, the component SHALL log a console warning and skip animation.

#### Scenario: Dimensions via style prop
- **WHEN** the consumer passes `style={{ width: 600, height: 140 }}`
- **THEN** the canvas renders at those CSS dimensions

#### Scenario: Dimensions via className
- **WHEN** the consumer passes a `className` whose CSS rules set width and height
- **THEN** the canvas renders at those dimensions

#### Scenario: Zero-size warning
- **WHEN** the canvas has no explicit dimensions and animation is triggered
- **THEN** a console warning is logged and no animation runs

---

### Requirement: Animation options forwarded to HandwritingAnimator
The `<Handwriting>` component SHALL accept `speed`, `color`, `capHeight`, `topPad`, `minWidth`, `maxWidth`, `letterGap`, and `wordGap` props corresponding to `WriteOptions`. All SHALL be optional with the same defaults as `HandwritingAnimator`.

#### Scenario: Speed override
- **WHEN** `speed={3.0}` is passed
- **THEN** the animation runs at 3× speed

#### Scenario: Defaults applied when props omitted
- **WHEN** no animation option props are passed
- **THEN** the animation uses speed 1.5, color `#1a1a1a`, and capHeight 80

---

### Requirement: Play-on-visible default behavior
When `playOn` is `"visible"` (the default), the `<Handwriting>` component SHALL set up an `IntersectionObserver` on mount, play the animation on the first intersection, and immediately disconnect the observer. If `IntersectionObserver` is unavailable in the environment, the component SHALL fall back to playing on mount.

#### Scenario: Animation deferred until visible
- **WHEN** the component is mounted outside the viewport and `playOn` is omitted
- **THEN** the animation does not start until the canvas scrolls into view

#### Scenario: Observer disconnects after first play
- **WHEN** the canvas scrolls out of view and back in after the first play
- **THEN** the animation does NOT replay

#### Scenario: IntersectionObserver unavailable fallback
- **WHEN** `IntersectionObserver` is not defined in the environment
- **THEN** the animation plays on mount as if `playOn="mount"` were set

---

### Requirement: Play-on-mount override
When `playOn="mount"` is set, the `<Handwriting>` component SHALL play the animation immediately in a `useEffect`, without setting up an `IntersectionObserver`.

#### Scenario: Immediate play on mount
- **WHEN** `playOn="mount"` is passed and the component mounts
- **THEN** the animation starts on the first render cycle

---

### Requirement: Prop changes trigger replay
When `text` or `glyphSet` changes after the component has already played, the `<Handwriting>` component SHALL replay the animation immediately. If the component has not yet played (observer still waiting), the updated props SHALL be used when the animation eventually triggers.

#### Scenario: Text change replays animation
- **WHEN** the `text` prop changes after the initial animation has completed
- **THEN** the canvas is cleared and the animation replays with the new text

#### Scenario: Stale props not used
- **WHEN** `text` changes before the first intersection
- **THEN** the animation uses the latest `text` value when it plays

---

### Requirement: onComplete callback
The `<Handwriting>` component SHALL accept an `onComplete` callback prop that is called when the animation finishes drawing all glyphs.

#### Scenario: Callback fires on completion
- **WHEN** `onComplete={handler}` is passed and the animation finishes
- **THEN** `handler` is called once

---

### Requirement: Imperative play via ref
The `<Handwriting>` component SHALL support `forwardRef` and expose a `HandwritingHandle` with a `play()` method. Calling `play()` SHALL clear the canvas and replay the animation immediately, regardless of `playOn` setting or prior play state.

#### Scenario: Programmatic replay
- **WHEN** a consumer holds a ref and calls `ref.current.play()`
- **THEN** the canvas clears and the animation replays from the beginning

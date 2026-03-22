## ADDED Requirements

### Requirement: Diagram component public API
The `diagram-react` package SHALL export a `<Diagram>` component that accepts a pre-loaded `DiagramExport` object and animates it on a canvas. It SHALL also export the `DiagramHandle` type for use with `useRef`.

#### Scenario: Basic render and animate
- **WHEN** `<Diagram diagram={data} style={{ width: '100%' }} />` is mounted
- **THEN** a canvas element is rendered at the correct aspect ratio and the animation plays when the component enters the viewport

#### Scenario: Exported types available
- **WHEN** a consumer imports from `diagram-react`
- **THEN** `Diagram`, `DiagramHandle`, and `DiagramProps` are all importable named exports

---

### Requirement: Aspect-ratio-preserving canvas sizing
The `<Diagram>` component SHALL set `aspect-ratio: ${diagram.aspectRatio}` as a CSS property on the canvas element. The consumer SHALL control width via `className` or `style`; height SHALL be derived by the browser from the aspect ratio. The component SHALL NOT set an explicit height.

#### Scenario: Height derives from aspect ratio
- **WHEN** `style={{ width: 800 }}` is passed and `diagram.aspectRatio` is 1.7778 (16:9)
- **THEN** the canvas renders at approximately 800×450

#### Scenario: Width-100% responsive layout
- **WHEN** `style={{ width: '100%' }}` is passed
- **THEN** the canvas fills its container width and height adjusts proportionally as the container resizes

---

### Requirement: Animation options forwarded to DiagramAnimator
The `<Diagram>` component SHALL accept `speed`, `color`, `minWidth`, and `maxWidth` props corresponding to `DiagramPlayOptions`. All SHALL be optional with the same defaults as `DiagramAnimator`.

#### Scenario: Speed override
- **WHEN** `speed={2.0}` is passed
- **THEN** the diagram animates at 2× speed

#### Scenario: Defaults applied when props omitted
- **WHEN** no animation option props are passed
- **THEN** the animation uses speed 1.5, color `#1a1a1a`, minWidth 1.5, and maxWidth 3

---

### Requirement: Play-on-visible default behavior
When `playOn` is `"visible"` (the default), the `<Diagram>` component SHALL set up an `IntersectionObserver` on mount, play the animation on the first intersection, and immediately disconnect the observer. If `IntersectionObserver` is unavailable, the component SHALL fall back to playing on mount.

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
When `playOn="mount"` is set, the `<Diagram>` component SHALL play the animation immediately in a `useEffect`, without setting up an `IntersectionObserver`.

#### Scenario: Immediate play on mount
- **WHEN** `playOn="mount"` is passed and the component mounts
- **THEN** the animation starts on the first render cycle

---

### Requirement: Prop changes trigger replay
When `diagram` changes after the component has already played, the `<Diagram>` component SHALL replay the animation immediately. If the component has not yet played, the updated `diagram` SHALL be used when the animation eventually triggers.

#### Scenario: Diagram data change replays animation
- **WHEN** the `diagram` prop is replaced with a different `DiagramExport` after the initial animation
- **THEN** the canvas is cleared and the new diagram animates

---

### Requirement: onComplete callback
The `<Diagram>` component SHALL accept an `onComplete` callback prop that is called when the animation finishes drawing all strokes.

#### Scenario: Callback fires on completion
- **WHEN** `onComplete={handler}` is passed and the animation finishes
- **THEN** `handler` is called once

---

### Requirement: Imperative play via ref
The `<Diagram>` component SHALL support `forwardRef` and expose a `DiagramHandle` with a `play()` method. Calling `play()` SHALL clear the canvas and replay the animation immediately, regardless of `playOn` setting or prior play state.

#### Scenario: Programmatic replay
- **WHEN** a consumer holds a ref and calls `ref.current.play()`
- **THEN** the canvas clears and the animation replays from the beginning

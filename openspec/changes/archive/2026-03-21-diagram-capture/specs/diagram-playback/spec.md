## ADDED Requirements

### Requirement: DiagramAnimator public API
The `diagram-playback` package SHALL export a `DiagramAnimator` class that accepts an HTML canvas element and a diagram export object. It SHALL provide a `play(options?)` method that animates all strokes in sequence on the canvas. The package SHALL be built as both an IIFE bundle (`dist/diagram-animator.js`, global name `DiagramPlaybackLib`) and an ESM module.

#### Scenario: Instantiate and play
- **WHEN** `new DiagramAnimator(canvasEl, diagramData).play({ speed: 1.5 })` is called
- **THEN** the diagram strokes are animated on the canvas from start to finish

#### Scenario: Play returns a Promise
- **WHEN** `play()` is called
- **THEN** it returns a Promise that resolves when all strokes have been drawn

---

### Requirement: Diagram export format
The diagram export JSON format SHALL be `{ version: 1, name: string, aspectRatio: number, strokes: NormalizedPoint[][] }` where each `NormalizedPoint` is `{ x: number, y: number, t: number, p: number }` with x and y in [0,1].

#### Scenario: Valid export parsed
- **WHEN** a diagram export JSON with version 1 is passed to DiagramAnimator
- **THEN** the animator renders the strokes without error

---

### Requirement: Aspect-ratio-preserving letterbox playback
`DiagramAnimator` SHALL scale the diagram to fit the canvas while preserving the original aspect ratio. When the canvas aspect ratio differs from the diagram's, the diagram SHALL be centered with empty space (letterbox or pillarbox) rather than stretched.

#### Scenario: Diagram narrower than canvas (letterbox)
- **WHEN** the diagram aspectRatio is 1.0 (square) and the canvas is 800×400 (2:1)
- **THEN** the diagram renders in a 400×400 region centered horizontally with 200px empty on each side

#### Scenario: Diagram wider than canvas (pillarbox)
- **WHEN** the diagram aspectRatio is 2.0 and the canvas is 400×400 (1:1)
- **THEN** the diagram renders in a 400×200 region centered vertically with 100px empty above and below

#### Scenario: Exact aspect ratio match
- **WHEN** the diagram aspectRatio matches the canvas aspect ratio
- **THEN** the diagram fills the entire canvas with no empty margins

---

### Requirement: Speed multiplier and pressure-driven stroke width
`DiagramAnimator` SHALL accept a `speed` option (default 1.5) that scales animation timing. It SHALL vary stroke width per segment based on the `p` (pressure) value, between configurable `minWidth` (default 1.5) and `maxWidth` (default 3) CSS pixel values.

#### Scenario: Speed doubles animation pace
- **WHEN** play is called with speed 2.0 vs 1.0
- **THEN** the 2.0 animation completes in half the wall-clock time

#### Scenario: High pressure produces wider stroke
- **WHEN** a point has pressure 1.0 and maxWidth is 3
- **THEN** that segment is drawn at 3px width

---

### Requirement: Stroke smoothing
`DiagramAnimator` SHALL apply lightweight neighbor-averaging smoothing to stroke points (same algorithm as `HandwritingAnimator`) before rendering. Smoothing SHALL affect only x/y positions, not timing or pressure.

#### Scenario: Smoothing applied without timing distortion
- **WHEN** a stroke with jittery points is animated
- **THEN** the visual path appears smooth and animation timing follows captured timestamps scaled by speed

---

### Requirement: Zero-size canvas warning
If `DiagramAnimator.play()` is called on a canvas whose `clientWidth` or `clientHeight` is 0, it SHALL log a console warning and return a resolved Promise without drawing anything.

#### Scenario: Zero-size canvas skipped
- **WHEN** play() is called on a canvas with clientWidth 0
- **THEN** a console warning is logged and the returned Promise resolves immediately

## MODIFIED Requirements

### Requirement: Single-file Reveal.js plugin distribution
The plugin SHALL be distributed as a single self-contained JavaScript file (`handwriting-reveal.js`) that bundles both the `HandwritingAnimator` and `DiagramAnimator` engines. No additional script tags SHALL be required beyond the plugin file itself.

#### Scenario: Plugin loaded via single script tag
- **WHEN** a presentation includes `<script src="handwriting-reveal.js"></script>`
- **THEN** the global `HandwritingReveal` object is available for registration with `Reveal.initialize`, and both handwriting and diagram animations are available without any additional scripts

---

## ADDED Requirements

### Requirement: Animate diagram canvases via data-diagram attribute
The plugin SHALL treat any canvas with a `data-diagram` attribute as a diagram canvas. The `data-diagram` value SHALL be a URL pointing to a diagram export JSON. The plugin SHALL fetch, cache, and animate diagram canvases using `DiagramAnimator`, applying the same slide-entry, fragment, prefetch, and clearing behavior as handwriting canvases.

#### Scenario: Non-fragment diagram animates on slide entry
- **WHEN** the user navigates to a slide containing a non-fragment canvas with `data-diagram="./arch.json"`
- **THEN** the diagram begins animating immediately

#### Scenario: Fragment diagram animates on fragment reveal
- **WHEN** a canvas with `data-diagram` has class `fragment` and the user reveals that fragment
- **THEN** the diagram animation begins

#### Scenario: Fragment diagram clears on fragmenthidden
- **WHEN** the user navigates backward past a fragment diagram canvas
- **THEN** the canvas is cleared so it re-animates on next reveal

#### Scenario: Diagram URL prefetched on slide entry
- **WHEN** the user navigates to a slide containing a `data-diagram` canvas (including inside fragments)
- **THEN** the diagram JSON begins loading immediately, before any animation is triggered

#### Scenario: Duplicate diagram URLs fetched only once
- **WHEN** multiple canvases on the same slide reference the same `data-diagram` URL
- **THEN** only one HTTP request is made for that URL

---

### Requirement: Per-canvas diagram overrides
A canvas with `data-diagram` SHALL support `data-diagram-speed` and `data-diagram-color` attributes to override the default animation speed and stroke color for that canvas only.

#### Scenario: Per-canvas speed override
- **WHEN** a canvas has `data-diagram="./arch.json"` and `data-diagram-speed="2.5"`
- **THEN** the diagram animates at speed 2.5

#### Scenario: Default speed used when no override
- **WHEN** a canvas has `data-diagram` but no `data-diagram-speed`
- **THEN** the diagram animates at the default speed (1.5)

---

### Requirement: Diagram fetch failure handled gracefully
If a diagram URL fails to load, the plugin SHALL log a console error identifying the URL and leave the canvas blank without throwing an uncaught exception.

#### Scenario: Diagram fetch failure leaves canvas blank
- **WHEN** a `data-diagram` URL returns an HTTP error or is unreachable
- **THEN** the canvas remains blank and a console error identifies the failing URL

---

### Requirement: data-x, data-y, data-width positioning applies to diagram canvases
The positional style injection applied at init time (`data-x`, `data-y`, `data-width`, `data-height`) SHALL apply equally to canvases with `data-diagram` as to canvases with `data-handwriting`.

#### Scenario: Diagram canvas positioned absolutely
- **WHEN** a canvas has both `data-diagram` and `data-x="100"` `data-y="200"`
- **THEN** the plugin injects `position: absolute; left: 100px; top: 200px` at init time

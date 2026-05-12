# animated-handwriting

A collection of TypeScript packages for animating handwritten text and diagrams on HTML canvases. The packages support embedding stroke-by-stroke handwriting animations in React applications, Next.js sites, and Reveal.js presentations. Animations are driven by JSON data exported from a separate capture and admin tool available at [https://timberglund.com/handwriting](https://timberglund.com/handwriting); this repository contains only the playback and rendering side of the system.

## Packages

| Directory | npm package | Description |
|---|---|---|
| [playback](./playback/README.md) | `@tlberglund/handwriting-playback` | Core animation engine for handwritten text |
| [diagram-playback](./diagram-playback/README.md) | `@tlberglund/diagram-playback` | Core animation engine for diagrams |
| [handwriting-react](./handwriting-react/README.md) | `@tlberglund/handwriting-react` | React component wrapping the handwriting engine |
| [diagram-react](./diagram-react/README.md) | `@tlberglund/diagram-react` | React component wrapping the diagram engine |
| [reveal-plugin](./reveal-plugin/README.md) | `@tlberglund/handwriting-reveal` | Reveal.js plugin for slide-driven animations |

## Data format

Handwriting animations are driven by glyph set JSON files exported from the capture tool. Diagram animations are driven by diagram JSON files exported from the diagram editor. Both formats are self-contained and consumed directly by the playback engines — no backend connection is required at render time.

The capture tool and diagram editor, along with the backend API that stores and exports the data, live separately at [timberglund.com](https://timberglund.com). This repository has no dependency on them.

Sample JSON files and standalone HTML playground pages are in the `demo/` directory.

## Getting started

See the README in each package directory for installation instructions, API reference, and usage examples:

- [playback/README.md](./playback/README.md)
- [diagram-playback/README.md](./diagram-playback/README.md)
- [handwriting-react/README.md](./handwriting-react/README.md)
- [diagram-react/README.md](./diagram-react/README.md)
- [reveal-plugin/README.md](./reveal-plugin/README.md)

## Development

Each package is built independently. From within any package directory:

```bash
npm install
npm run build
```

All packages use [esbuild](https://esbuild.github.io/) and produce output in their respective `dist/` directories. Type declarations are generated separately via `npm run build:types`.

Inter-package dependencies (`handwriting-react` on `handwriting-playback`, `diagram-react` on `diagram-playback`, and `reveal-plugin` on both playback engines) are declared as `file:` references in `devDependencies` during development. Build the dependency packages first before building the packages that depend on them.

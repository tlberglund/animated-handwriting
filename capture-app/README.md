# capture-app

React 19 / Vite web UI for capturing glyph forms and diagrams. Users draw letter shapes and diagrams on a canvas; the app submits the stroke data to the backend API for storage.

## Running locally

Requires the backend running on port 8080.

```bash
npm install
npm run dev
```

The dev server starts on port 5173. Requests to `/api` are proxied to `http://localhost:8080`.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | _(empty)_ | Base URL prepended to all API requests. Leave unset to use `/api` relative to the page origin, which works with both the Vite dev proxy and the Docker nginx configuration. |

## Building for production

```bash
npm run build
```

Output goes to `dist/`. In the Docker setup, nginx serves the built assets and proxies `/api` requests to the backend container.

# backend

Ktor REST API for the animated-handwriting system. Stores glyph captures and diagrams in PostgreSQL, manages schema via Flyway, and exposes export endpoints that return normalized JSON for use by the playback libraries.

## Running locally

Requires a running PostgreSQL instance. With the database available:

```bash
./gradlew run
```

The server starts on port 8080 by default.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `8080` | HTTP port to listen on |
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/handwriting` | JDBC connection URL |
| `DATABASE_USER` | `postgres` | Database username |
| `DATABASE_PASSWORD` | _(empty)_ | Database password |

## API reference

All paths are relative to the server root. Request and response bodies are JSON.

### Capture sets

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/capture-sets` | List all capture sets |
| `POST` | `/api/capture-sets` | Create a capture set (`name`, `description`) |

### Glyphs

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/capture-sets/{id}/glyphs` | List glyphs in a capture set |
| `POST` | `/api/capture-sets/{id}/glyphs` | Create a glyph entry in the set |
| `GET` | `/api/capture-sets/{id}/glyphs/{char}` | Get detail for a single glyph |
| `POST` | `/api/capture-sets/{id}/glyphs/{char}` | Update glyph metadata |

### Captures

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/capture-sets/{id}/glyphs/{char}/captures` | List captures for a glyph |
| `POST` | `/api/capture-sets/{id}/glyphs/{char}/captures` | Submit a new capture (stroke data + canvas metadata) |
| `DELETE` | `/api/capture-sets/{id}/glyphs/{char}/captures/{captureId}` | Delete a capture |

### Default capture

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/capture-sets/{id}/glyphs/{char}/default-capture` | Get the current default capture for a glyph |
| `PUT` | `/api/capture-sets/{id}/glyphs/{char}/default-capture` | Set the default capture (`captureId` in body) |

### Capture adjustments

Per-capture scale and vertical offset adjustments, applied at export time.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/capture-sets/{id}/glyphs/{char}/captures/{captureId}/adjustment` | Get adjustment for a capture (returns defaults if none set) |
| `PUT` | `/api/capture-sets/{id}/glyphs/{char}/captures/{captureId}/adjustment` | Set adjustment (`scale`, `yOffset`) |

`scale` must be in `[0.1, 3.0]`. `yOffset` must be in `[-1.0, 1.0]`. Both are in cap-height units.

### Export and progress

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/capture-sets/{id}/export` | Export full glyph set JSON (v2 format) for playback |
| `GET` | `/api/capture-sets/{id}/progress` | Return capture completion progress for the set |

**Export format v2:** `width` is now per-capture (not per-glyph). Adjustment math (baseline-anchored isotropic scale + y offset) is baked into the exported stroke coordinates. The root object includes `"version": 2`. Any v1 JSON files must be re-exported after upgrading.

### Diagrams

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/diagrams` | List all diagrams |
| `POST` | `/api/diagrams` | Create a diagram (`name`, `aspectRatio`) |
| `GET` | `/api/diagrams/{id}` | Get diagram detail |
| `PUT` | `/api/diagrams/{id}` | Update a diagram's strokes and/or name |
| `DELETE` | `/api/diagrams/{id}` | Delete a diagram |
| `GET` | `/api/diagrams/{id}/export` | Export diagram JSON for playback |

## Database

PostgreSQL 16. Schema is managed by Flyway and applied automatically on startup. There are 9 migrations covering character definitions, capture sets, glyph captures, diagrams, and per-capture adjustments.

## Docker

To run the full stack including the database:

```bash
docker compose up
```

Run this from the project root. Docker Compose starts PostgreSQL and the backend together.

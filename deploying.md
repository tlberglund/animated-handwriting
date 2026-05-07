# Publishing to npm

## Prerequisites

You must be logged into npm before publishing:

```bash
npm login
npm whoami  # confirm login
```

## Step 1 — Build everything

Rebuild all packages to ensure `dist/` is current:

```bash
cd playback && npm run build && npm run build:esm && npm run build:types
cd ../reveal-plugin && npm run build
cd ../handwriting-react && npm run build
```

## Step 2 — Version bump

All three packages should be versioned in sync. Use `npm version` to bump and update `package.json`:

```bash
cd playback && npm version patch --no-git-tag-version
cd ../reveal-plugin && npm version patch --no-git-tag-version
cd ../handwriting-react && npm version patch --no-git-tag-version
```

Use `patch` for bug fixes, `minor` for new features, `major` for breaking changes.

## Step 3 — Publish in dependency order

Publish `playback` first, since `handwriting-react` lists it as a peer dependency:

```bash
cd playback && npm publish
cd ../reveal-plugin && npm publish
cd ../handwriting-react && npm publish
```

All three packages have `"publishConfig": { "access": "public" }`, so no `--access public` flag is needed.

## Packages

| Package | Directory | Description |
|---------|-----------|-------------|
| `@tlberglund/handwriting-playback` | `playback/` | Core animator and sound engine |
| `@tlberglund/handwriting-reveal` | `reveal-plugin/` | Reveal.js plugin |
| `@tlberglund/handwriting-react` | `handwriting-react/` | React component |

## Notes

- `reveal-plugin` and `handwriting-react` both inline the playback library via esbuild, so they have no runtime dependency on the published `playback` package. Still, publish `playback` first.
- The `playback` bundle (~415 KB) includes 11 MP3 sound clips embedded as base64 data URLs. This is intentional — consumers get audio with zero configuration beyond `sounds: true`.

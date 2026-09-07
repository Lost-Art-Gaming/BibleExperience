# The Bible Experience

The Bible Experience is now a lightweight, installable web app with a data-driven episode reader.

## Architecture

- `index.html` — application shell
- `app.js` — navigation, rendering, progress, journal and interactions
- `styles.css` — presentation layer, preserving the MVP visual language
- `data/Genesis/index.json` — episode registry
- `data/Genesis/Episode1.json` … `Episode10.json` — one content document per episode
- `data/timeline.json` — chronology data
- `manifest.webmanifest` + `sw.js` — installable/PWA shell

## Adding an episode

1. Add `data/Genesis/Episode11.json`.
2. Add its metadata to `data/Genesis/index.json`.
3. No UI code changes are required for the reader.

## Local development

This app uses ES modules and `fetch()`, so serve it over HTTP rather than opening `index.html` directly from the filesystem.

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/`.


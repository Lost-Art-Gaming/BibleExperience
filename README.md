# The Bible Experience — MVP

A mobile-first, installable Bible exploration experience for GitHub Pages.

## MVP
- Mobile-first cinematic dashboard
- Data-driven Genesis journey using the existing `data/Genesis` episode files
- Episode reader with completion and local bookmarks
- Interactive Genesis chronology from `data/timeline.json`
- Biblical geography / Exodus scene powered by Three.js
- PWA manifest + service worker
- No backend required; progress is stored locally on the device

## Content
The app reads episode content from JSON so new episodes can be added without changing the UI. The current repository contains Genesis Episodes 1–10.

## Deploy
The repository is configured for GitHub Pages through `.github/workflows/deploy-pages.yml`.

## Local development
Because the app uses ES modules and `fetch()`, serve the repository over HTTP, for example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080/`.

## Notes
Three.js is loaded as an ES module from jsDelivr for the MVP, keeping the repository build-free and directly compatible with GitHub Pages. A future production pass can move to Vite + React + React Three Fiber once the information architecture and content model are stable.

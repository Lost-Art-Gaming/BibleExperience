# The Bible Experience

A mobile-first, installable Bible exploration experience for GitHub Pages, built with Vite + React + TypeScript.

## Features
- Mobile-first cinematic dashboard
- Data-driven Genesis journey using the episode files in `public/data/Genesis`
- Episode reader with completion tracking and local bookmarks
- Interactive Genesis chronology from `public/data/timeline.json`
- Biblical geography / Exodus scene powered by Three.js (`@react-three/fiber`)
- PWA manifest + service worker (via `vite-plugin-pwa`)
- No backend required; progress is stored locally on the device

## Content
The app reads episode content from JSON (`public/data/Genesis/*.json`, `public/data/timeline.json`) so new episodes can be added without changing the UI. The current repository contains Genesis Episodes 1–10. Artwork lives in `public/assets`.

## Local development
```bash
npm install
npm run dev
```
The dev server serves the app under the `/BibleExperience/` base path (matching the GitHub Pages deployment), so open the URL Vite prints (e.g. `http://localhost:5173/BibleExperience/`).

## Build
```bash
npm run build
```
Type-checks with `tsc --noEmit` and produces a production bundle in `dist/`.

## Preview a production build
```bash
npm run preview
```
Serves the `dist/` output at `http://localhost:4173/BibleExperience/`.

## Tests
```bash
npm run typecheck   # TypeScript, no emit
npm test            # Vitest unit tests
python tests/playwright_acceptance.py   # Playwright acceptance/visual checks against a running preview server
```

## Deploy
The repository is configured for GitHub Pages through `.github/workflows/deploy-pages.yml`, which builds the app with Vite and publishes `dist/` as the Pages artifact. `.github/workflows/verify.yml` runs typecheck, build, and the Playwright acceptance suite against `npm run preview` on every pull request into `main`.

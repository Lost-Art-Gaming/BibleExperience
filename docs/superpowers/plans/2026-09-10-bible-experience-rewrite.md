# The Bible Experience — Production Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the vanilla-JS Bible Experience PWA as a premium Vite + React + TypeScript app — cleaning up the CSS/asset cruft, adding motion, a real 3D relief map, and surfacing all authored content — without losing any content, progress, or the dark/gold aesthetic.

**Architecture:** A Vite-built React SPA with hash routing. Episode/timeline JSON stays in `public/data` and is fetched at runtime (still the source of truth). A single token-driven stylesheet replaces the four warring CSS files. React Three Fiber renders the Explore relief map; Framer Motion drives transitions and scroll reveals. The DOM contract of the current app (selectors and behaviors the Playwright suite asserts) is preserved so acceptance tests carry over.

**Tech Stack:** Vite, React 18, TypeScript, React Router (hash), React Three Fiber (`@react-three/fiber`, `@react-three/drei`), Framer Motion, `vite-plugin-pwa`, Playwright (existing Python suite).

**Spec:** `docs/superpowers/specs/2026-09-10-bible-experience-rewrite-design.md`

## Global Constraints

- **Node** ≥ 22.12, **npm** ≥ 10 (present in CI and locally).
- **Content is immutable:** `public/data/Genesis/*.json` and `public/data/timeline.json` are copied verbatim from the current `data/`. Never edit episode prose.
- **localStorage schema unchanged:** `be-episode-<id>` = `"done"`; `be-bookmarks` = JSON string array of episode ids; `be-theme` = `"light"`|`"dark"`.
- **Design tokens (verbatim):** `--bg:#071018; --surface:#0d1822; --surface-2:#12202b; --text:#f4efe5; --muted:#9ba8b2; --gold:#d9ad61; --gold-2:#f0cf91; --line:rgba(255,255,255,.09)`. Light theme: `--bg:#f4f0e8; --surface:#fffdf8; --surface-2:#eee8dc; --text:#18242b; --muted:#68737a; --gold:#a87931; --gold-2:#8b6328; --line:rgba(18,32,43,.11)`.
- **Fonts:** Cinzel (headings), Inter (body), via Google Fonts `@import`.
- **DOM contract to preserve** (Playwright depends on these): main heading is `#main h1` (or `.reader-head h1` in reader) and receives programmatic focus on every route change; `.desktop-nav` visible ≥900px & `.bottom-nav` hidden there, inverse on mobile; reader header element `.reader-head` with a background image; reader footer has `.continue-btn` when a next episode exists and `.secondary-btn.next-link`; `#searchBtn`, `#searchInput`, `[data-result="<id>"]`, `.close-search`, `.search-overlay`; `#themeBtn` with an `aria-label` that changes when toggled; `#readerBack`; episode triggers carry `data-episode="<id>"`.
- **Theme attribute:** `document.documentElement.dataset.theme` is `"light"` or `"dark"` (default dark).
- **Base path:** Vite `base: '/BibleExperience/'` for Pages; all asset/data access must be base-relative (via `import.meta.env.BASE_URL`), never a leading `/`.
- **`prefers-reduced-motion`:** all motion must degrade to instant.
- **Commits:** end every commit message with the trailer `Co-authored-by: Claude <noreply@anthropic.com>` (org policy). Work on branch `feat/react-rewrite`, never commit to `main`.

---

## File Structure

```
index.html                     Vite entry, #root mount, font + theme-color meta
vite.config.ts                 base path, react plugin, vite-plugin-pwa
tsconfig.json / tsconfig.node.json
package.json
public/
  data/Genesis/*.json          copied verbatim from data/Genesis
  data/timeline.json           copied verbatim
  assets/*                     copied verbatim from assets/
  favicon → assets/logo.svg
src/
  main.tsx                     React root, imports theme css, boots router
  App.tsx                      <HashRouter> + <Shell> + <Routes>
  vite-env.d.ts
  theme/
    tokens.css                 :root + [data-theme='light'] custom props
    global.css                 reset, base type, .reader prose, shared atoms
  lib/
    types.ts                   EpisodeMeta, EpisodeData, TimelineItem, GeoPoint
    content.ts                 loadIndex/loadEpisode/loadTimeline (+ prefetch)
    storage.ts                 progress/bookmarks/theme get+set
    art.ts                     episode→image map + gradient fallbacks
    refs.ts                    parse .ref spans from section html
  hooks/
    useTheme.ts
    useProgress.ts
    useEpisode.ts
    useScrollSpy.ts
    useReducedMotion.ts (or reuse framer's)
  components/
    Shell.tsx  TopBar.tsx  Nav.tsx  Icon.tsx
    EpisodeCard.tsx  ProgressBar.tsx  Reveal.tsx  PageTransition.tsx
    SearchOverlay.tsx  VerseRef.tsx  SectionRail.tsx  Toast.tsx
    ConnectionsPanel.tsx  Skeleton.tsx
  routes/
    Home.tsx  Journey.tsx  Reader.tsx  Timeline.tsx  Explore.tsx  Library.tsx
  three/
    ReliefMap.tsx              R3F <Canvas>, terrain, route, markers, controls
    terrain.ts                 heightfield geometry helper
    geoPoints.ts               waypoint data (from current app.js)
tests/playwright_acceptance.py updated BASE + selectors as needed
.github/workflows/deploy-pages.yml   build + upload dist
.github/workflows/verify.yml         npm ci + tsc + build + playwright
```

Removed after parity is confirmed: `app.js`, `artwork.js`, `styles.css`, `production.css`, `responsive-fixes.css`, `typography.css`, `sw.js`, root `manifest.webmanifest` (regenerated), root `index.html` (replaced).

---

## Task 1: Scaffold the Vite + React + TS project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `.gitignore`
- Create: `public/data/**`, `public/assets/**` (copies)

**Interfaces:**
- Produces: a running `npm run dev` app shell; `App` default export; `BASE_URL` used for all data/asset fetches.

- [ ] **Step 1: Create branch**

```bash
git checkout -b feat/react-rewrite
```

- [ ] **Step 2: Copy content + assets into `public/`**

```bash
mkdir -p public/data public/assets
cp -r data/Genesis public/data/Genesis
cp data/timeline.json public/data/timeline.json
cp -r assets/* public/assets/
```

- [ ] **Step 3: `package.json`**

```json
{
  "name": "bible-experience",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 4173 --strictPort",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "framer-motion": "^11.3.0",
    "three": "^0.180.0",
    "@react-three/fiber": "^8.17.0",
    "@react-three/drei": "^9.114.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@types/three": "^0.180.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.1"
  }
}
```

- [ ] **Step 4: `vite.config.ts`** (PWA added in Task 12; keep minimal here)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/BibleExperience/',
  plugins: [react()],
  build: { target: 'es2020', sourcemap: false },
});
```

- [ ] **Step 5: `tsconfig.json` + `tsconfig.node.json`** (standard Vite React TS strict config; `"strict": true`, `"jsx": "react-jsx"`, `"moduleResolution": "bundler"`, include `src`).

- [ ] **Step 6: `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover" />
    <meta name="theme-color" content="#071018" />
    <meta name="description" content="The Bible Experience — see, understand, believe." />
    <link rel="icon" href="/BibleExperience/assets/logo.svg" type="image/svg+xml" />
    <title>The Bible Experience</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: `src/main.tsx`, `src/App.tsx` (placeholder shell), `src/vite-env.d.ts`**

```tsx
// main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/tokens.css';
import './theme/global.css';
import App from './App';
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
```

```tsx
// App.tsx (temporary until Task 4)
export default function App() {
  return <main id="main"><h1>The Bible Experience</h1></main>;
}
```

Create empty `src/theme/tokens.css` and `src/theme/global.css` for now (filled in Task 3).

- [ ] **Step 8: Install + run**

Run: `npm install && npm run dev`
Expected: dev server starts; visiting the app shows the `<h1>`.

- [ ] **Step 9: Typecheck + build**

Run: `npm run build`
Expected: PASS, `dist/` produced.

- [ ] **Step 10: Commit**

```bash
git add -A && git commit -m "chore: scaffold Vite + React + TS project with content copied to public"
```

---

## Task 2: Types, storage, and content loaders

**Files:**
- Create: `src/lib/types.ts`, `src/lib/storage.ts`, `src/lib/content.ts`, `src/lib/art.ts`
- Test: `src/lib/__tests__/storage.test.ts` (see note on test runner)

**Note on unit tests:** Add `vitest` + `jsdom` as devDeps and a `test` script (`"test": "vitest run"`). Storage/refs logic gets real unit tests; UI is covered by Playwright.

**Interfaces:**
- Produces:
  - `types.ts`: `EpisodeMeta { id, file, label, title, subtitle, season, sealed }`; `EpisodeData { id, season, seasonLabel, label, title, subtitle, sections: {label:string; html:string}[]; reflection: string[]; summary: string[] }`; `TimelineItem { kind:'anchor'|'derived'|'approx'|'undated'; ep?:string; when:string; what:string; note:string }`; `GeoPoint { id, name, description, position:[number,number,number] }`.
  - `content.ts`: `loadIndex(): Promise<EpisodeMeta[]>`, `loadTimeline(): Promise<TimelineItem[]>`, `loadEpisode(id, file): Promise<EpisodeData>`, `prefetchEpisodes(metas): void`. All fetch from `import.meta.env.BASE_URL + 'data/...'`.
  - `storage.ts`: `isDone(id):boolean`, `setDone(id):void`, `getBookmarks():string[]`, `toggleBookmark(id):string[]`, `getTheme():'light'|'dark'`, `setTheme(t):void`, `cleanTitle(s):string`, `esc` not needed (React escapes).
  - `art.ts`: `episodeArt(id):string`, `HOME_ART` map, `FALLBACKS:string[]`, `overlayFor(key):string|undefined`.

- [ ] **Step 1: Write `storage.ts` failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { isDone, setDone, getBookmarks, toggleBookmark, getTheme, setTheme } from '../storage';
describe('storage', () => {
  beforeEach(() => localStorage.clear());
  it('records completion under the legacy key', () => {
    expect(isDone('ep1')).toBe(false);
    setDone('ep1');
    expect(localStorage.getItem('be-episode-ep1')).toBe('done');
    expect(isDone('ep1')).toBe(true);
  });
  it('toggles bookmarks and persists as be-bookmarks JSON', () => {
    expect(toggleBookmark('ep2')).toEqual(['ep2']);
    expect(JSON.parse(localStorage.getItem('be-bookmarks')!)).toEqual(['ep2']);
    expect(toggleBookmark('ep2')).toEqual([]);
  });
  it('defaults theme to dark and persists changes', () => {
    expect(getTheme()).toBe('dark');
    setTheme('light');
    expect(localStorage.getItem('be-theme')).toBe('light');
    expect(getTheme()).toBe('light');
  });
});
```

- [ ] **Step 2: Run test, verify it fails** — `npx vitest run` → FAIL (module not found).

- [ ] **Step 3: Implement `types.ts`, `storage.ts`, `content.ts`, `art.ts`.**

`storage.ts` mirrors the legacy semantics from the old `app.js` (keys `be-episode-<id>`, `be-bookmarks`, `be-theme`). `content.ts` mirrors old `loadData`/`getJson` but base-relative and typed; `loadEpisode` fetches `data/Genesis/<file>`. `art.ts` ports the `ART`, `HOME_ART`, `OVERLAYS`, `FALLBACKS` maps from the old `artwork.js`, keyed by episode id, with `episodeArt(id)` returning the mapped asset or `assets/ep01-beginning.jpg` fallback.

- [ ] **Step 4: Run test, verify pass** — `npx vitest run` → PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat: typed content loaders + legacy-compatible storage"`.

---

## Task 3: Design tokens + global stylesheet

**Files:**
- Create/replace: `src/theme/tokens.css`, `src/theme/global.css`

**Interfaces:**
- Produces: CSS custom properties (Global Constraints values), base element styles, `.eyebrow`, `.primary-btn`, `.secondary-btn`, `.reader` prose rules (`.dropcap`, `.ep-sec`, `.sec-head`, `.rule`, `.ref`, `.day-list`, `.profile`, `.evline`, `.quiet`, etc.) ported from the old `styles.css`/`typography.css` so authored section HTML renders correctly.

- [ ] **Step 1: Write `tokens.css`** — `:root { … dark tokens …; color-scheme: dark }` and `:root[data-theme='light'] { … light tokens …; color-scheme: light }`, plus the Google Fonts `@import` for Cinzel + Inter.

- [ ] **Step 2: Write `global.css`** — reset (`*{box-sizing}`, body font/bg/color), heading font-family Cinzel, focus-visible ring using `--gold`, `svg` icon defaults, and the full prose ruleset the authored `section.html` needs. Port every selector used inside episode HTML from the old `styles.css` + `typography.css` (grep the old files for the class names appearing in `data/Genesis/*.json`: `ep-sec, sec-head, eyebrow, rule, dropcap, ref, day-list, day, d-num, d-title, d-body, profile, p-name, p-role, quiet, figure, fig-cap, evline, ev, ev-when, ev-what, ev-note, threadHost`). No `!important`.

- [ ] **Step 3: Verify** — temporarily render one episode's raw section HTML in `App.tsx`, `npm run dev`, confirm drop-cap, rules, day-list, profiles, refs all styled. Revert the temporary render.

- [ ] **Step 4: Commit** — `git commit -m "feat: consolidated token-driven stylesheet (replaces 4 legacy css files)"`.

---

## Task 4: App shell, routing, TopBar, Nav, theme, icons

**Files:**
- Create: `src/App.tsx` (real), `src/components/Shell.tsx`, `TopBar.tsx`, `Nav.tsx`, `Icon.tsx`, `Toast.tsx`
- Create: `src/hooks/useTheme.ts`
- Create: `src/routes/{Home,Journey,Reader,Timeline,Explore,Library}.tsx` (stubs returning `<section><h1>…</h1></section>`)

**Interfaces:**
- Consumes: `storage.getTheme/setTheme`.
- Produces:
  - `App`: `<HashRouter>` with routes `/`→Home, `/journey`, `/timeline`, `/explore`, `/library`, `/episode/:id`→Reader, `*`→redirect Home. Wrapped in `<Shell>`.
  - `Shell`: renders `<div class="app">`, `<TopBar/>`, `<main id="main">{children/outlet}</main>`, bottom `<Nav className="bottom-nav"/>`, `<Toast/>`. On every location change, focus `#main h1` (or `.reader-head h1`) with `tabIndex=-1` (preserves DOM contract).
  - `TopBar`: `.topbar` with `.brand[data-nav-home]`, desktop `<Nav className="desktop-nav"/>`, `#themeBtn` (aria-label toggles "Switch to light/dark theme"), `#searchBtn`.
  - `Nav`: five items Home/Journey/Explore/Timeline/Library, `.nav-item.active` + `aria-current` on the current route; Explore uses the map icon.
  - `Icon`: same SVG path set as old `app.js` `icons`.
  - `useTheme(): { theme, toggle }` — sets `document.documentElement.dataset.theme` and persists.

- [ ] **Step 1:** Implement `Icon.tsx` (port `icons` object + `<svg viewBox="0 0 24 24">`).
- [ ] **Step 2:** Implement `useTheme`, `Nav`, `TopBar`, `Toast`, `Shell`, real `App` with router + route stubs.
- [ ] **Step 3:** Port nav display CSS into `global.css`: `.desktop-nav{display:none}` + `@media(min-width:900px){.desktop-nav{display:flex}.bottom-nav{display:none}}`; `.bottom-nav` fixed bottom on mobile. (Matches Playwright's display assertions.)
- [ ] **Step 4: Verify** — `npm run dev`: nav switches routes, theme toggle flips `data-theme` + persists on reload, `#main h1` focused on each navigation.
- [ ] **Step 5: Commit** — `git commit -m "feat: app shell, hash routing, top/bottom nav, theme toggle"`.

---

## Task 5: Home route

**Files:** Modify `src/routes/Home.tsx`; Create `src/components/ProgressBar.tsx`, `Reveal.tsx`.

**Interfaces:**
- Consumes: `content.loadIndex` (via a shared `useEpisodes` context or hook — add `src/hooks/useEpisodes.ts` returning `{episodes, timeline, loading}` loaded once at App level and provided via context), `storage` progress, `art`.
- Produces: `Reveal` (IntersectionObserver wrapper, respects reduced motion), `ProgressBar` (animated width). Home renders hero (`.hero-home` with background image via `art.HOME_ART`), the "begin/continue" `primary-btn` linking to the next incomplete episode (`data-episode`), progress section (`% `, done count, saved count), and the 3 feature cards linking to explore/timeline/journey.

- [ ] **Step 1:** Add `useEpisodes` context/provider in `App` (loads index + timeline once, prefetches episodes on idle).
- [ ] **Step 2:** Implement `Reveal` and `ProgressBar`.
- [ ] **Step 3:** Implement `Home` markup mirroring the old `home()` layout, using components + tokens.
- [ ] **Step 4: Verify** — hero image loads, progress reflects localStorage, feature cards navigate.
- [ ] **Step 5: Commit** — `git commit -m "feat: home route with hero, progress, feature cards"`.

---

## Task 6: Journey route + EpisodeCard

**Files:** Modify `src/routes/Journey.tsx`; Create `src/components/EpisodeCard.tsx`.

**Interfaces:**
- Consumes: `useEpisodes`, `storage.isDone`, `art.episodeArt`.
- Produces: `EpisodeCard` — button with `data-episode="<id>"`, `.episode-card.done` when complete, art panel with season/number badge and image (fallback gradient on error), copy block (label, cleaned title, subtitle, Explore/Completed CTA). Journey renders page intro, season card, and the list of cards.

- [ ] **Step 1:** Implement `EpisodeCard` with image error → gradient fallback (port `FALLBACKS`).
- [ ] **Step 2:** Implement `Journey`.
- [ ] **Step 3: Verify** — all 10 cards render, ep8 shows gradient fallback (no image), completed cards styled, clicking navigates to reader.
- [ ] **Step 4: Commit** — `git commit -m "feat: journey route + episode cards with art fallbacks"`.

---

## Task 7: Reader route — sections, reflection, summary, footer

**Files:** Modify `src/routes/Reader.tsx`; Create `src/hooks/useEpisode.ts`, `src/components/Skeleton.tsx`.

**Interfaces:**
- Consumes: `content.loadEpisode`, `useEpisodes` (for meta + prev/next), `storage` (done/bookmarks), `art.episodeArt`.
- Produces:
  - `useEpisode(id): { meta, data, status }` (`'loading'|'ready'|'error'`).
  - Reader renders: `.reader-head` (background image, `#readerBack` "Journey" button, label, `h1` cleaned title, subtitle, section count, `#bookmark` save button); `.reader-content` article with each `section.html` wrapped in `.reading-section` (rendered via `dangerouslySetInnerHTML` — trusted first-party content, single sanitize pass with a tiny allowlist helper in `lib/sanitize.ts` that strips `<script>`/event-handler attrs); then the **Reflection** section (numbered `reflection[]` as "Questions to consider") and **Summary** section (`summary[]` as "In summary"); then `.reader-footer` with prev/next `.secondary-btn`(`.next-link` on next) and either `.continue-btn` (next exists) or `#complete` mark-complete button.
  - Bookmark toggles `storage.toggleBookmark` + toast; complete sets `storage.setDone` + toast. `#readerBack` uses router `-1` history or falls back to `/journey`.

- [ ] **Step 1:** Implement `sanitize.ts` (`sanitizeHtml(html):string` — DOMParser, remove `script`/`style`/`on*` attrs/`javascript:` hrefs, return innerHTML) + a unit test feeding `<p onclick=alert(1)>hi<script>…</script></p>` and asserting the handler + script are gone.
- [ ] **Step 2:** Implement `useEpisode`, `Skeleton` loader.
- [ ] **Step 3:** Implement `Reader` with sections + reflection + summary + footer, preserving DOM-contract selectors.
- [ ] **Step 4: Verify** — open ep1: all 11 sections render styled; a "Questions to consider" block lists the 3 reflection items; an "In summary" block renders; mark-complete persists across reload; bookmark persists; ep6 has `.continue-btn` + `.next-link`.
- [ ] **Step 5: Commit** — `git commit -m "feat: reader with full sections, reflection questions, summary, sanitize pass"`.

---

## Task 8: Reading experience — section rail, progress, verse refs

**Files:** Create `src/components/SectionRail.tsx`, `VerseRef.tsx`, `ConnectionsPanel.tsx`, `src/hooks/useScrollSpy.ts`, `src/lib/refs.ts`; Modify `Reader.tsx`.

**Interfaces:**
- Produces:
  - `useScrollSpy(sectionIds:string[]): activeId` (IntersectionObserver).
  - `SectionRail` — desktop sticky list of the episode's section labels (Opening…Summary) with active highlight + click-to-scroll; on mobile a compact top progress chip. Also a reading `ProgressBar` fixed under the top bar tracking article scroll.
  - `refs.ts`: `extractRefs(html:string): {ref:string; label:string}[]` parsing `<span class="ref" data-ref="…">Label</span>`.
  - `VerseRef` — post-render enhancement: after section html mounts, upgrade `.ref` spans into keyboard-focusable elements with a tooltip showing the reference label (no invented scripture text).
  - `ConnectionsPanel` — replaces the empty `.threadHost[data-ep]` per episode with a "Connections in this episode" list built from `extractRefs` over that episode's sections (deduped, grouped). Data-shaped so a future cross-ref dataset slots in.

- [ ] **Step 1:** `refs.ts` + unit test (`extractRefs` finds all `data-ref` pairs in a sample section html).
- [ ] **Step 2:** `useScrollSpy`, `SectionRail`, reading progress bar.
- [ ] **Step 3:** `VerseRef` enhancement + `ConnectionsPanel` mounted into `threadHost`.
- [ ] **Step 4: Verify** — rail highlights the section in view; clicking a rail item scrolls to it; refs are focusable with visible tooltip; each episode's cross-reference section shows a connections list.
- [ ] **Step 5: Commit** — `git commit -m "feat: reading rail, scroll progress, verse refs, connections panel"`.

---

## Task 9: Timeline route

**Files:** Modify `src/routes/Timeline.tsx`.

**Interfaces:**
- Consumes: `useEpisodes` (timeline), router nav.
- Produces: page intro, legend (anchor/derived/approx/undated), and the timeline list — each item `.timeline-item.<kind>` with dot/line/copy; clicking an item with an `ep` navigates to that episode (`data-episode`), items without `ep` are disabled.

- [ ] **Step 1:** Implement `Timeline` mirroring old `timeline()` with Reveal stagger.
- [ ] **Step 2: Verify** — items render by kind color, linked items navigate, undated items disabled.
- [ ] **Step 3: Commit** — `git commit -m "feat: timeline route"`.

---

## Task 10: Explore route — R3F stylized relief map

**Files:** Modify `src/routes/Explore.tsx`; Create `src/three/ReliefMap.tsx`, `terrain.ts`, `geoPoints.ts`.

**Interfaces:**
- Consumes: `geoPoints.ts` (the 6 waypoints from old `app.js` `geographyPoints`).
- Produces:
  - `terrain.ts`: `buildTerrain(): THREE.BufferGeometry` — a plane subdivided (e.g. 128×96) with a procedural heightfield (layered sine/noise) forming ridges (mountains N/E), a valley/river channel, and a low sea basin; returns geometry with computed normals.
  - `ReliefMap` — `<Canvas frameloop="demand" dpr={[1,1.6]} camera>` with: hemisphere + warm directional light; a `mesh` using `buildTerrain()` and a `meshStandardMaterial` tinted to the theme (vertex-colored by height: sea → land → gold peaks); the six waypoints as glowing gold marker meshes with `drei` `<Html>`/`<Billboard>` labels; the route as a `drei` `<Line>` (or tube) that animates its draw-in; `OrbitControls` (damped, limited polar); a focus method to frame a selected waypoint; auto-rotate toggle; reset. Selecting a waypoint (marker click or route card) updates a detail string and highlights the marker. Lazy-loaded via `React.lazy` so three.js is code-split to the Explore route only.
  - Explore renders page intro, the scene card hosting `<ReliefMap/>` (with `<Suspense fallback={<Skeleton/>}>`), scene action buttons (reset/auto-rotate), a detail line, and the route card list (`data-location`), plus a `<noscript>`/WebGL-unavailable fallback showing the route cards over the static `explore-geography.jpg`.

- [ ] **Step 1:** `geoPoints.ts` + `terrain.ts` (+ a tiny unit test asserting `buildTerrain()` returns a geometry with a position attribute and finite bounds).
- [ ] **Step 2:** `ReliefMap` with terrain, lights, markers, labels, route line, controls, focus/reset/auto-rotate.
- [ ] **Step 3:** Explore route wiring + WebGL fallback + Suspense/lazy.
- [ ] **Step 4: Verify** — scene mounts, terrain visible & lit, route animates in, markers clickable & focusable, cards focus waypoints, auto-rotate/reset work, no console errors; disabling WebGL shows the fallback.
- [ ] **Step 5: Commit** — `git commit -m "feat: R3F stylized relief map for Explore"`.

---

## Task 11: Library route + Search overlay

**Files:** Modify `src/routes/Library.tsx`; Create `src/components/SearchOverlay.tsx`.

**Interfaces:**
- Consumes: `useEpisodes`, `storage.getBookmarks`, episode body text (from loaded episode data) for search.
- Produces:
  - Library: page intro, the "coming soon" study cards grid, saved-experiences list (from bookmarks), the central-thread quote card.
  - `SearchOverlay` — opened by `#searchBtn`; `.search-overlay` > `.search-panel[role=dialog]` with `.close-search`, `#searchInput`, `#searchResults`; searches title/subtitle/label/body across loaded episodes; results are buttons `data-result="<id>"` navigating to the reader; focus trap + Escape close + restore focus to opener (ports old `openSearch` behavior). Mounted at Shell level so it's reachable on every route.

- [ ] **Step 1:** Implement `SearchOverlay` (port search logic/focus-trap from old `app.js`).
- [ ] **Step 2:** Implement `Library`.
- [ ] **Step 3: Verify** — search "covenant" returns ep10; Tab/Shift-Tab trap works; Escape closes; bookmarks show in library.
- [ ] **Step 4: Commit** — `git commit -m "feat: library route + search overlay"`.

---

## Task 12: Motion polish + PWA + reduced motion

**Files:** Create `src/components/PageTransition.tsx`; Modify `App.tsx`, `vite.config.ts` (add `vite-plugin-pwa`), `src/main.tsx`.

**Interfaces:**
- Produces: `PageTransition` (Framer `AnimatePresence` on route key, fade/slide, `LayoutGroup` for the card→reader-header shared element); reduced-motion short-circuits all variants to instant. PWA: `VitePWA({ registerType:'autoUpdate', manifest:{…from old manifest…}, workbox:{ globPatterns:['**/*.{js,css,html,svg,jpg,json}'] } })` — regenerates the service worker for hashed assets and precaches data JSON for offline.

- [ ] **Step 1:** Add `vite-plugin-pwa` config + manifest (port name/short_name/colors/icon).
- [ ] **Step 2:** Implement `PageTransition` + shared-element transition; add `Reveal` to remaining routes; wire `prefers-reduced-motion`.
- [ ] **Step 3: Verify** — route transitions animate; card→reader header morphs; reduced-motion OS setting removes animation; `npm run build` emits a service worker + manifest; installable.
- [ ] **Step 4: Commit** — `git commit -m "feat: page/shared-element motion + PWA via vite-plugin-pwa"`.

---

## Task 13: Update Playwright acceptance to the built app

**Files:** Modify `tests/playwright_acceptance.py`.

**Interfaces:**
- Consumes: `npm run build && npm run preview` on port 4173.

- [ ] **Step 1:** Keep BASE `http://127.0.0.1:4173/`. Update any selectors that changed; the DOM contract was preserved, so expect minimal edits. Add assertions: reader shows a reflection block and a summary block; explore canvas (or fallback) present.
- [ ] **Step 2: Verify locally**

```bash
npm run build
npm run preview &   # serves dist at :4173 under /BibleExperience/
# adjust BASE to include /BibleExperience/ base path
python tests/playwright_acceptance.py
```
Expected: PASS, screenshots in `verification/`.

- [ ] **Step 3: Commit** — `git commit -m "test: update Playwright acceptance for the built React app"`.

---

## Task 14: CI, deploy workflow, and remove legacy files

**Files:** Modify `.github/workflows/deploy-pages.yml`, `.github/workflows/verify.yml`; Delete legacy source; Update `README.md`.

**Interfaces:** Produces a Pages deploy from `dist/`.

- [ ] **Step 1: `deploy-pages.yml`** — replace the rsync/static steps with: `actions/setup-node@v4` (node 22, `cache: npm`), `npm ci`, `npm run build`, `actions/upload-pages-artifact` with `path: ./dist`, then the existing deploy job. Drop the manual `version.json`/`sed` cache-busting (Vite hashes assets). Keep the artwork-validation step pointed at `public/assets`.
- [ ] **Step 2: `verify.yml`** — replace python-only flow with: setup-node, `npm ci`, `npm run typecheck`, `npm run build`, then setup-python + install playwright, `npm run preview &`, `python tests/playwright_acceptance.py`.
- [ ] **Step 3:** Delete `app.js`, `artwork.js`, `styles.css`, `production.css`, `responsive-fixes.css`, `typography.css`, `sw.js`, root `index.html` (now the Vite one), root `manifest.webmanifest`, and the now-duplicated top-level `data/` and `assets/` (content lives in `public/`). Keep `data/`+`assets/` only if you prefer them as the canonical copy symlinked/copied into `public` at build — otherwise remove to avoid drift. Update `README.md` (dev = `npm run dev`, build = `npm run build`, deploy notes).
- [ ] **Step 4: Verify** — fresh clone simulation: `rm -rf node_modules dist && npm ci && npm run build && npm run typecheck` all pass; `git status` clean of stray legacy files.
- [ ] **Step 5: Commit** — `git commit -m "chore: Vite Pages deploy + verify CI; remove legacy vanilla source"`.

---

## Task 15: Final verification pass + PR

- [ ] **Step 1:** `npm run typecheck && npm run build && npm run test && npm run preview` → run Playwright → all green.
- [ ] **Step 2:** Manual visual pass at mobile (390px) and desktop (1440px) across all six routes + a reader + explore; confirm dark/light both correct, reduced-motion honored, progress persists.
- [ ] **Step 3:** Push branch, open PR to `main` with summary + before/after screenshots.

```bash
git push -u origin feat/react-rewrite
gh pr create --title "Production rewrite: Vite + React + R3F premium app" --body "..."
```

---

## Self-Review

**Spec coverage:**
- §2 decisions → Tasks 1,10,12 (Vite/React/TS, R3F relief, Framer/PWA). ✓
- §3 preservation (content, localStorage, tokens, artwork, PWA) → Tasks 1,2,3,6,12 + Global Constraints. ✓
- §4 honest Tapestry → Task 8 ConnectionsPanel (no invented data). ✓
- §5 architecture/file shape → File Structure + Tasks 1–2,4. ✓
- §6 hash routing → Task 4. ✓
- §7.1 motion → Task 12; §7.2 reading → Task 8; §7.3 surface content → Task 7; §7.4 relief map → Task 10. ✓
- §8 cleanup → Tasks 3,14. ✓
- §9 deploy → Task 14; §10 testing → Tasks 2,7,8,13,15. ✓
- §11 out of scope respected (no new content). §12 risks mitigated (lazy 3D, base path, acceptance parity). ✓

**Placeholder scan:** No TBD/TODO; each task has concrete files, interfaces, verification commands, and code for non-obvious logic. UI-heavy tasks reference exact ported behaviors from named legacy functions rather than re-transcribing prose. ✓

**Type consistency:** `EpisodeMeta`/`EpisodeData`/`TimelineItem`/`GeoPoint` defined once (Task 2) and consumed by the same names in Tasks 5–11. `loadEpisode(id,file)`, `isDone`, `toggleBookmark`, `episodeArt`, `extractRefs`, `buildTerrain` names are stable across tasks. ✓

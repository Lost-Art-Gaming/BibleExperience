# The Bible Experience — Production Rewrite Design

**Date:** 2026-09-10
**Status:** Approved direction, pending spec review
**Repo:** Lost-Art-Gaming/BibleExperience

## 1. Purpose & goal

Elevate the existing build-free vanilla-JS Bible study PWA into a premium,
high-fidelity production application, without losing any of its genuinely
strong content or its cinematic dark/gold aesthetic.

Two things are true about the starting point:

- **The content and surface visuals are already excellent** — 10 richly
  written Genesis episodes, cinematic hero and reader headers, a coherent
  dark/gold design language, working PWA/localStorage/search.
- **The foundation and a few surfaces are not premium** — four CSS files
  fighting each other with `!important` override wars, orphaned assets,
  manual cache-busting, a primitive 3D scene, and content in the data
  (reflection questions, episode summaries) that never renders.

This rewrite keeps everything that works and rebuilds the foundation so the
app can reach — and sustain — a premium bar.

## 2. Decisions (locked)

| Decision | Choice |
|----------|--------|
| Foundation | Migrate to **Vite + React 18 + TypeScript** |
| 3D | **React Three Fiber** — stylized raised-relief map of the ancient Near East |
| Motion | **Framer Motion** |
| Routing | **React Router** (hash or browser router; hash chosen — see §6) |
| Premium focus | All four: visual polish & motion, fix the 3D scene, surface all content, reading experience |
| Hosting | **GitHub Pages** via Actions (unchanged pipeline, add build step) |
| Content | Genesis, 10 episodes — the existing JSON is the source of truth, untouched |

## 3. Non-negotiable preservation constraints

These MUST survive the rewrite:

1. **Content** — `data/Genesis/*.json` and `data/timeline.json` are copied
   verbatim into the new app and remain the source of truth. No content is
   rewritten, invented, or edited.
2. **localStorage schema** — keys `be-episode-<id>` (value `done`),
   `be-bookmarks` (JSON array), and `be-theme` (`light`/`dark`) are read and
   written with identical semantics, so a returning user keeps their
   progress, bookmarks, and theme.
3. **Design language** — background `#071018`, surfaces `#0d1822`/`#12202b`,
   gold `#d9ad61`/`#f0cf91`, text `#f4efe5`, Cinzel (headings) + Inter
   (body). Both dark and light themes retained.
4. **Artwork** — all images in `assets/` reused, with the existing
   image-error → gradient fallback behaviour retained.
5. **PWA** — installable manifest + offline service worker retained
   (regenerated for hashed build assets).

## 4. Honesty constraint — the "Tapestry"

The content contains `<div class="threadHost" data-ep="epN">` placeholders and
the CSS has `.thread-row` styles, but **no cross-reference dataset exists
anywhere in the repo** and no code ever populated them. The Tapestry was
aspirational.

We will NOT fabricate scripture cross-references. Instead:

- Each episode's existing "Cross references" **prose** renders beautifully as
  a normal reader section.
- The `threadHost` becomes a "Connections in this episode" panel built ONLY
  from verse references actually named in that episode's own text
  (`<span class="ref" data-ref="…">` spans already embedded in the HTML).
- The component is data-shaped so that if a real cross-reference dataset is
  supplied later, it renders a fuller Tapestry with no structural change.

## 5. Architecture

### 5.1 Project shape

```
/                     Vite project root
  index.html          Vite entry (single mount point)
  vite.config.ts      base path for Pages, PWA plugin
  package.json
  tsconfig.json
  public/
    assets/…          artwork, logo (copied from current assets/)
    data/…            Genesis JSON + timeline.json (copied verbatim)
    manifest.webmanifest
  src/
    main.tsx          React root
    App.tsx           router + shell
    theme/
      tokens.css      design tokens (single source; dark + light)
      global.css      resets, typography base, reader prose styles
    lib/
      content.ts      typed loaders for index/episodes/timeline
      storage.ts      localStorage wrapper (progress, bookmarks, theme)
      progress.ts     derived progress selectors
    hooks/            useEpisodeData, useProgress, useScrollSpy, useTheme
    components/       Shell, TopBar, BottomNav, EpisodeCard, ProgressBar,
                      SearchOverlay, VerseRef, SectionRail, RevealOnScroll…
    routes/
      Home.tsx
      Journey.tsx
      Reader.tsx
      Timeline.tsx
      Explore.tsx      (hosts the R3F scene)
      Library.tsx
    three/
      ReliefMap.tsx    R3F canvas + terrain + route + markers
      terrain.ts       procedural relief geometry / heightfield
```

### 5.2 Data layer

- `content.ts` exposes typed functions: `loadIndex()`, `loadEpisode(id)`,
  `loadTimeline()`. Episode JSON is typed as `{ id, label, title, subtitle,
  season, sections: {label, html}[], reflection: string[], summary: string[] }`.
- Episodes are fetched from `public/data/` at runtime (keeps JSON as data,
  not bundled source, and preserves the "add an episode without touching UI"
  property). Prefetched on idle after first paint for instant navigation and
  offline search, matching current behaviour.
- Section `html` is rendered as trusted first-party content (it is authored
  in-repo, not user input). A single sanitize pass is applied defensively.

### 5.3 State

- No global store needed. Local component state + a small `useProgress` hook
  backed by `storage.ts`. Theme via a `useTheme` hook that sets
  `document.documentElement.dataset.theme` and persists to localStorage.

## 6. Routing

React Router with a **hash router** (`/#/home`, `/#/journey`,
`/#/episode/:id`, `/#/timeline`, `/#/explore`, `/#/library`). Hash routing is
chosen because GitHub Pages serves static files with no SPA rewrite; hash
keeps deep links and refreshes working without a 404 fallback hack, and
matches the app's current URL shape so existing links/bookmarks stay valid.

## 7. Premium dimensions — detail

### 7.1 Visual polish & motion
- Route transitions (fade/slide) via Framer Motion `AnimatePresence`.
- Shared-element transition from an episode card to the reader header.
- `RevealOnScroll` wrapper (IntersectionObserver) staggers reader sections
  and home cards into view.
- Animated progress bars/counters; refined spacing and type scale.
- Skeleton loaders for episode fetches replacing the current dot spinner.
- `prefers-reduced-motion` respected — all motion degrades to instant.

### 7.2 Reading experience
- **Section rail:** a scroll-spy sidebar (desktop) / top progress chip
  (mobile) listing the episode's sections (Opening, Historical context, …,
  Summary) with the active one highlighted; click to jump.
- **Reading progress bar** pinned under the top bar, tracking scroll through
  the article.
- **Verse references:** `.ref` spans become a styled `VerseRef` component —
  distinct, tappable, showing the reference cleanly. No scripture text is
  invented; if a verse-text dataset is added later it slots in as a popover.
- Long-form typography: comfortable measure (~66ch), drop-cap retained,
  refined rhythm.

### 7.3 Surface all content
- **Reflection** array renders as a "Questions to consider" section at the
  end of each episode (numbered, editorial styling).
- **Summary** array renders as an "In summary" recap block.
- Both already exist in every episode's JSON and are currently discarded.

### 7.4 The 3D relief map (Explore)
- R3F `<Canvas>` with a sculpted heightfield representing the ancient Near
  East (procedural relief — mountains, river valleys, sea), lit warm/gold to
  match the theme.
- The six Genesis waypoints (Eden → Ararat → Babel → Ur → Haran → Canaan) as
  gold markers with floating labels.
- The route between them drawn as an **animated glowing line** that draws on
  in sequence.
- Interactions: orbit/drag, click a waypoint (or a route card below) to focus
  and surface its description, auto-rotate toggle, reset. Waypoint data reuses
  the existing `geographyPoints` positions/descriptions.
- Graceful fallback: if WebGL is unavailable, show the existing route-card
  list with an illustrated static map (no hard failure).
- Performance: capped pixel ratio, on-demand rendering (`frameloop="demand"`
  where possible), disposed on unmount.

## 8. Cleanup (the "clean it up" mandate)
- Collapse `styles.css` + `production.css` + `responsive-fixes.css` +
  `typography.css` into `theme/tokens.css` + `theme/global.css` + colocated
  component styles. Eliminate the `!important` override war.
- Delete orphaned root PNGs `file_0000…png` (two ~2MB files, unreferenced).
- Remove manual `?v=NN` cache-busting; Vite content-hashes assets.
- Replace hand-rolled DOM/router/`artwork.js` wiring with components.

## 9. Deployment
- `.github/workflows/deploy-pages.yml` updated to: install, `vite build`,
  upload `dist/`, deploy to Pages. `verify.yml` runs typecheck + build +
  Playwright acceptance.
- `vite.config.ts` `base` set to the repo path so asset URLs resolve on
  Pages.
- Service worker regenerated (via `vite-plugin-pwa`) to precache hashed
  build output — replaces the hand-maintained `sw.js`.

## 10. Testing
- **Typecheck** (`tsc --noEmit`) and **build** must pass in CI.
- **Playwright acceptance** (`tests/`) rewritten/extended to cover: home
  loads, begin-journey navigates to first episode, reader renders all
  sections + reflection + summary, mark-complete persists across reload,
  bookmark persists, theme toggle persists, timeline renders, explore scene
  mounts (or fallback shows), search finds an episode by body text.
- Manual visual pass on the running app for the premium bar.

## 11. Out of scope
- New episodes or books beyond the existing Genesis 10.
- A backend, accounts, or sync.
- Inventing scripture cross-reference or verse-text datasets.
- Any change to the authored episode prose.

## 12. Risks
- **R3F bundle size / perf on low-end mobile** — mitigated by demand
  rendering, capped DPR, code-splitting the Explore route so 3D loads only
  when visited, and the WebGL fallback.
- **Pages base-path breakage** — mitigated by centralising asset access
  through Vite `import`/`base` and testing the built `dist` before deploy.
- **Regression vs. the already-good current app** — mitigated by the
  preservation constraints (§3) and Playwright acceptance parity.
```

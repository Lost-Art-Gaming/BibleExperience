# Enrichment Features Design — Tapestry, Indexes, Personal Layer, Verse Links

**Date:** 2026-09-10
**Status:** Approved direction, pending spec review
**Repo:** Lost-Art-Gaming/BibleExperience (post React rewrite)

## 1. Purpose

Enrich the Bible Experience with four features that deepen engagement and
deliver on the app's thesis — "see the bigger picture" / Scripture as a
connected story — **without fabricating scripture or cross-reference data**.

Everything is derived from content that already exists in
`public/data/Genesis/*.json`, or is user-supplied at runtime (personal
layer), or links out (verse text).

## 2. Decisions (locked with the user)

| Decision | Choice |
|----------|--------|
| Which features | All four |
| Build order | 1) derived index + People/Themes pages → 2) Tapestry → 3) verse links → 4) personal layer |
| Delivery | Incremental — a separate PR per increment |
| Tapestry & index location | Inside **Library** (keep 5 nav items); surfaced as real cards |
| Verse text | **Link out** to the NWT online reader (jw.org / wol.jw.org) in a new tab — no bundled scripture text |

## 3. Honesty constraints (unchanged from the rewrite)

- No fabricated cross-references, verse text, or connections. Every thread
  in the Tapestry and every index entry is a real, named recurring entity in
  the authored episode text.
- No copyrighted scripture bundled. Verse refs link out.
- The authored episode prose is never edited.

## 4. Shared backbone — the derived content index

A single runtime-derived, memoized index built from the already-loaded
episode JSON. New module `src/lib/contentIndex.ts`:

```ts
interface IndexEntry {
  id: string;          // slug, e.g. 'theme-sovereignty', 'person-noah'
  kind: 'theme' | 'person';
  label: string;       // display name
  detail?: string;     // role/gloss where available (person role, theme gloss)
  episodes: string[];  // episode ids where it appears, in order
}
interface ContentIndex {
  themes: IndexEntry[];
  people: IndexEntry[];
  refsByEpisode: Record<string, { ref: string; label: string }[]>; // from refs.ts
}
buildContentIndex(episodes: EpisodeMeta[], data: Map<string, EpisodeData>): ContentIndex
```

Derivation rules (parse each episode's section HTML with DOMParser):
- **Themes:** from the "Major themes" section — each `<li>` whose leading
  `<strong>` names a theme (e.g. "Jehovah's sovereignty", "Human dignity").
  Normalise/slug the theme label; merge case/wording-equivalent labels via a
  small normaliser (lowercase, strip trailing gloss after ":"/"—").
- **People:** from "Character profiles" `.p-name` (+ `.p-role` as detail).
  Merge by normalised name so "Jehovah God" / "Jehovah" collapse.
- **Refs:** reuse `extractRefs` (already exists) per episode.

An entry is a **thread** (Tapestry-eligible) when `episodes.length >= 2`.

The index requires all episodes' data. Episodes are already prefetched by
`EpisodesProvider`; the index waits for them (loading state) and memoises.
Expose via a `useContentIndex()` hook.

**Note on fidelity:** theme/person merging is heuristic. The normaliser is
conservative (only merges obvious equivalents); un-merged near-duplicates are
acceptable (they simply appear as separate entries) — never invented links.

## 5. Feature 1 — People & Themes index pages (increment 1)

Routes: `/people`, `/themes` (registered in the router; reachable from
Library cards, not the primary nav).

- **Library** (`src/routes/Library.tsx`): replace the disabled "People &
  Genealogy" and add a "Themes" card with **enabled** cards linking to the
  new routes. Keep the other "coming soon" cards as-is.
- **People page:** list `index.people` (those with ≥1 episode). Each row:
  name, role/detail, the episodes it appears in as chips linking to
  `#/episode/<id>`, and a count. Sorted by episode-count desc then name.
- **Themes page:** same shape over `index.themes`.
- Styling: reuse existing tokens, `.page-intro`, card/list atoms; on-theme,
  responsive, both light/dark. Each page has exactly one `#main h1`.

This increment also lands the backbone (`contentIndex.ts` + `useContentIndex`)
with unit tests for the derivation.

## 6. Feature 2 — Interactive Tapestry (increment 2)

Route `/tapestry`, surfaced from a Library card.

**A living map that grows as you progress** — not a static all-at-once
diagram. This matches the content's own framing (Episode 1: "Each connection
you weave below is added to your Tapestry, the growing map of how all
sixty-six books hold together").

- **Discovery model (locked):** a connection is *woven* when you **complete**
  an episode. Completing an episode lights its node and weaves in every
  thread it shares with your **other completed episodes**. Uses the existing
  `be-episode-<id>` = `done` progress — no new tracking. The web fills in as
  you finish more episodes.
- **View:** the 10 episodes as nodes (an arc/spine, reusing the timeline/
  season visual language). Completed nodes are lit gold; unread nodes dim.
  Threads (index entries with ≥2 episodes — a recurring theme/person) are
  drawn as glowing gold connectors, but **only the segments between episodes
  you've completed** are shown/lit; undiscovered connections stay hidden
  (kept for a future "faint hint" if desired, but v1 hides them).
- **Progress:** a discovery counter — "N of M connections woven" — where M is
  the total possible connections across all 10 episodes and N is those among
  completed episodes. An inviting empty state when nothing is complete
  ("Complete episodes to begin weaving your tapestry").
- **New-thread beat:** completing an episode surfaces "K new threads
  discovered" (a toast on the reader's complete action and/or a highlight on
  the Tapestry). Reuses the existing `toast()`.
- **Controls / interaction:** toggle dimension (Themes / People); a list of
  the woven threads beside the diagram. Hover/tap a woven thread → highlight
  its episodes + arcs; tap an episode node → navigate to it.
- **Rendering:** inline SVG (no new dependency); arcs are quadratic/cubic
  paths; the newest woven arcs draw on (respecting reduced motion — instant
  when reduced). Responsive: the spine scrolls horizontally inside its own
  `overflow-x` container (never widens the page — the reader-overflow lesson)
  or collapses to a vertical thread list with episode chips on small screens.
- **Thread source (curated throughlines):** auto-deriving connections from the
  structured sections yields almost nothing (measured: 0 recurring Major
  themes, 1 recurring profiled person, 1 shared verse citation across ≥2
  episodes) — each episode introduces distinct themes/people/citations. So the
  Tapestry weaves a **curated list of Genesis's genuinely recurring
  throughlines** (`src/lib/tapestryThreads.ts`): motifs (Promised Seed,
  Covenant, Faith & Obedience, Sacrifice & Blood, Sin & Judgment, Sovereignty,
  the Flood, Blessing, the Chosen Line, Rebellion & Pride, Sacred Rest) and
  key figures (Jehovah, Adam, Eve, the Serpent, Cain & Abel, Noah, Abraham).
  Each is **detected only where its terms genuinely appear in an episode's
  prose** — a curated topic index over the real text, editable, not fabricated
  scripture. Two dimensions in the UI: **Threads** (motifs) and **People**.
- **Desktop / mobile are distinct experiences:** desktop is the radial loom
  (ring of episodes, woven chords, hover-to-pull, side ledger); mobile is a
  vertical **warp** — tap a lit episode to fan out its threads to the episodes
  they connect to. Not one layout scaled down.
- **Honesty:** every thread is a real recurring motif/figure verifiable in the
  episodes' own text; the intro says so. Nothing is fabricated — progression
  only reveals connections that genuinely exist.

## 7. Feature 3 — Verse links (increment 3)

- New `src/lib/verseLink.ts`: `parseRef(code)` turning a `data-ref` code
  (`ge1-1`, `re4-11`, `isa11`, `ge2-2`) into `{ book, chapter, verse? }` via a
  book-abbreviation map (all 66 books; the codes are lowercase abbreviations),
  and `verseUrl(code)` building an NWT online-reader URL (jw.org / wol.jw.org)
  for that passage. Unit-tested against the abbreviations actually present in
  the content.
- Enhance the existing `.ref` upgrade in `Reader.tsx`: refs become real links
  (`role="link"` is now correct because they navigate), opening `verseUrl` in
  a new tab (`target="_blank" rel="noopener noreferrer"`), keeping the tooltip.
  Unknown/unparseable codes stay as plain styled text (no dead link).
- External navigation is user-initiated (a tap) — no auto-redirect.

## 8. Feature 4 — Personal layer (increment 4)

localStorage, matching the existing `be-*` scheme. New keys:
`be-highlights` (`{ [episodeId]: string[] /* paragraph keys */ }`),
`be-notes` (`{ [episodeId]: string }`), `be-lastread`
(`{ id, scrollY, at }`).

- **Highlights (paragraph-level v1):** in the reader, each content paragraph
  gets a stable key (episode id + section index + paragraph index). Tapping a
  small gutter affordance (or long-press) toggles a highlight; highlighted
  paragraphs get a gold-wash background, persisted and restored on load.
  *(Arbitrary sub-paragraph text ranges are out of scope for v1 — noted as a
  possible follow-up.)*
- **Notes:** a per-episode note field in the reader (collapsible), saved to
  `be-notes`. Surfaced (read-only preview) in Library's saved section.
- **Resume:** record last-read episode + scroll on episode view; Home shows a
  "Continue where you left off" affordance when present (distinct from the
  existing next-incomplete "Continue your journey").

## 9. Cross-cutting

- All new routes preserve the DOM/focus contract (one `#main h1`, focus on
  nav) and scroll behavior (already handled globally).
- Both themes and mobile verified per feature (Playwright at 390 + 1440;
  overflow probe for the Tapestry SVG).
- Playwright acceptance extended per increment (index pages reachable from
  Library; tapestry renders; a verse ref is an external link; a highlight
  persists across reload).

## 9b. Feature 5 — Progression gating (added on request)

Episodes unlock in order so the story is a journey, not a wall of contents.

- **Unlocked:** every completed episode plus the *current* one (the first not
  completed). **Sealed (shown, greyed):** the single next episode. **Hidden:**
  everything beyond it. The window advances as you complete episodes.
- Logic in `src/lib/progress.ts` (`currentIndex`, `isEpisodeUnlocked`,
  `visibleEpisodes`, `hiddenCount`), unit-tested. `done` is injectable.
- **Journey** renders `visibleEpisodes`; the sealed teaser is a non-interactive
  `EpisodeCard locked` (dimmed art, lock, title withheld) + a "N more unlock as
  you continue" footer.
- **Reader** guards sealed episodes (deep links, or links from timeline/
  tapestry/search): shows a "This experience is sealed" state pointing to the
  current episode, never the content.
- **Tapestry** weaves only `visibleEpisodes`, so the loom/warp grows with
  progress rather than revealing the whole map.

## 10. Out of scope

- Inventing cross-reference or scripture datasets.
- Sub-paragraph text-range highlighting (v1 is paragraph-level).
- Accounts/sync/backend — personal layer is local-only.
- New episodes/books.

## 11. Risks

- **Heuristic theme/person merging** → conservative normaliser; un-merged
  duplicates are acceptable, never invented merges. Unit-tested.
- **Tapestry legibility with many threads** → dimension toggle + select-to-
  filter; horizontal-scroll containment on mobile.
- **Verse link URL scheme** (jw.org/wol deep links are non-trivial) → a
  verified book-number map; unknown codes degrade to plain text, never a
  broken link. Finalised in the verse-links increment.
- **Highlight anchoring** over injected HTML → paragraph-keyed (stable),
  not fragile character offsets.

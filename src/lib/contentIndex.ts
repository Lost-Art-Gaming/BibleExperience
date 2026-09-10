import type { EpisodeData, EpisodeMeta } from './types';
import { extractRefs } from './refs';

export interface IndexEntry {
  /** Stable slug, e.g. 'theme-jehovahs-sovereignty', 'person-noah'. */
  id: string;
  kind: 'theme' | 'person';
  /** Display label — the first-seen original wording. */
  label: string;
  /** Optional gloss/role. */
  detail?: string;
  /** Episode ids where it appears, in episode order, deduped. */
  episodes: string[];
}

export interface ContentIndex {
  themes: IndexEntry[];
  people: IndexEntry[];
  refsByEpisode: Record<string, { ref: string; label: string }[]>;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Conservative normaliser used to merge equivalent labels. Only collapses
 * obvious equivalents (case, curly apostrophes, a leading "the", a trailing
 * " god" so "Jehovah God" == "Jehovah"). Anything less obvious stays a
 * separate entry — we never invent a merge.
 */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^the\s+/, '')
    .replace(/\s+god$/, '');

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

/** Collect entries of one kind across all episodes, merged by normalised key. */
function collect(
  kind: 'theme' | 'person',
  episodes: EpisodeMeta[],
  data: Map<string, EpisodeData>,
  extract: (doc: Document) => { label: string; detail?: string }[],
): IndexEntry[] {
  const byKey = new Map<string, IndexEntry>();
  for (const meta of episodes) {
    const ep = data.get(meta.id);
    if (!ep) continue;
    const html = ep.sections.map((s) => s.html).join('\n');
    for (const { label, detail } of extract(parse(html))) {
      if (!label) continue;
      const key = norm(label);
      const existing = byKey.get(key);
      if (existing) {
        if (!existing.episodes.includes(meta.id)) existing.episodes.push(meta.id);
        if (!existing.detail && detail) existing.detail = detail;
      } else {
        byKey.set(key, { id: `${kind}-${slug(label)}`, kind, label, detail, episodes: [meta.id] });
      }
    }
  }
  // Sort: appears in more episodes first, then alphabetical.
  return [...byKey.values()].sort(
    (a, b) => b.episodes.length - a.episodes.length || a.label.localeCompare(b.label),
  );
}

function extractThemes(doc: Document): { label: string; detail?: string }[] {
  const out: { label: string; detail?: string }[] = [];
  doc.querySelectorAll('section[data-rail="Major themes"] li, .ep-sec li').forEach((li) => {
    // Only treat a list item as a theme when it leads with a <strong> name.
    const strong = li.querySelector('strong');
    if (!strong || strong.previousSibling) return;
    const label = (strong.textContent || '').trim().replace(/[:,.]$/, '');
    const detail = (li.textContent || '').slice((strong.textContent || '').length).replace(/^[\s:,–—-]+/, '').trim();
    if (label) out.push({ label, detail: detail || undefined });
  });
  return out;
}

function extractPeople(doc: Document): { label: string; detail?: string }[] {
  const out: { label: string; detail?: string }[] = [];
  doc.querySelectorAll('.profile').forEach((p) => {
    const label = (p.querySelector('.p-name')?.textContent || '').trim();
    const detail = (p.querySelector('.p-role')?.textContent || '').trim();
    if (label) out.push({ label, detail: detail || undefined });
  });
  return out;
}

export function buildContentIndex(episodes: EpisodeMeta[], data: Map<string, EpisodeData>): ContentIndex {
  const refsByEpisode: Record<string, { ref: string; label: string }[]> = {};
  for (const meta of episodes) {
    const ep = data.get(meta.id);
    if (!ep) continue;
    const seen = new Set<string>();
    const refs: { ref: string; label: string }[] = [];
    for (const s of ep.sections) {
      for (const r of extractRefs(s.html)) {
        if (!seen.has(r.ref)) {
          seen.add(r.ref);
          refs.push(r);
        }
      }
    }
    refsByEpisode[meta.id] = refs;
  }
  return {
    themes: collect('theme', episodes, data, extractThemes),
    people: collect('person', episodes, data, extractPeople),
    refsByEpisode,
  };
}

/** Entries appearing in ≥2 episodes — the "threads" the Tapestry can draw. */
export function threads(entries: IndexEntry[]): IndexEntry[] {
  return entries.filter((e) => e.episodes.length >= 2);
}

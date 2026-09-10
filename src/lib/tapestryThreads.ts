import type { EpisodeData, EpisodeMeta } from './types';
import type { IndexEntry } from './contentIndex';

/**
 * Curated Genesis throughlines. Auto-deriving connections from the structured
 * sections yields almost nothing (each episode introduces distinct themes,
 * people and citations), so the Tapestry weaves a hand-picked set of the
 * account's genuinely recurring threads. Each is detected ONLY where its
 * terms actually appear in an episode's prose — the connections are real and
 * verifiable in the text, not fabricated. Edit these lists to reshape the map.
 */
export interface ThreadDef {
  id: string;
  label: string;
  terms: RegExp;
}

export const MOTIFS: ThreadDef[] = [
  { id: 'm-seed', label: 'The Promised Seed', terms: /\b(offspring|the seed|woman.?s seed|serpent.?s head)\b/ },
  { id: 'm-covenant', label: 'The Covenant', terms: /\bcovenant\b/ },
  { id: 'm-faith', label: 'Faith & Obedience', terms: /\b(faith|faithful|obey|obeyed|obedien|trusted?)\b/ },
  { id: 'm-sacrifice', label: 'Sacrifice & Blood', terms: /\b(sacrific|offering|altar|blood)\b/ },
  { id: 'm-judgment', label: 'Sin & Judgment', terms: /\b(judgment|wicked|punish|condemn|guilt)\b/ },
  { id: 'm-sovereignty', label: "Jehovah's Sovereignty", terms: /\b(sovereign|creator|right to rule|almighty|supreme)\b/ },
  { id: 'm-flood', label: 'Judgment by Flood', terms: /\b(flood|deluge|ark)\b/ },
  { id: 'm-blessing', label: 'Blessing', terms: /\bbless(ed|ing|es)?\b/ },
  { id: 'm-line', label: 'The Chosen Line', terms: /\b(genealog|descend|firstborn|generations|the line|son of)\b/ },
  { id: 'm-pride', label: 'Rebellion & Pride', terms: /\b(rebel|pride|proud|tower|babel|scatter)\b/ },
  { id: 'm-rest', label: 'Sacred Rest', terms: /\b(sabbath|seventh day|day of rest|rest day)\b/ },
];

export const FIGURES: ThreadDef[] = [
  { id: 'p-jehovah', label: 'Jehovah', terms: /\bjehovah\b/ },
  { id: 'p-adam', label: 'Adam', terms: /\badam\b/ },
  { id: 'p-eve', label: 'Eve', terms: /\beve\b/ },
  { id: 'p-serpent', label: 'The Serpent', terms: /\b(serpent|satan|the devil)\b/ },
  { id: 'p-cain', label: 'Cain & Abel', terms: /\b(cain|abel)\b/ },
  { id: 'p-noah', label: 'Noah', terms: /\bnoah\b/ },
  { id: 'p-abraham', label: 'Abraham', terms: /\b(abram|abraham)\b/ },
];

function plainText(ep: EpisodeData): string {
  return ep.sections
    .map((s) => s.html)
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .toLowerCase();
}

function detect(defs: ThreadDef[], kind: IndexEntry['kind'], episodes: EpisodeMeta[], text: Map<string, string>): IndexEntry[] {
  return defs
    .map((def) => ({
      id: def.id,
      kind,
      label: def.label,
      detail: undefined,
      episodes: episodes.filter((e) => {
        const t = text.get(e.id);
        return t ? def.terms.test(t) : false;
      }).map((e) => e.id),
    }))
    .filter((entry) => entry.episodes.length > 0);
}

export interface TapestryThreads {
  motifs: IndexEntry[];
  people: IndexEntry[];
}

export function buildTapestryThreads(episodes: EpisodeMeta[], data: Map<string, EpisodeData>): TapestryThreads {
  const text = new Map<string, string>();
  for (const meta of episodes) {
    const ep = data.get(meta.id);
    if (ep) text.set(meta.id, plainText(ep));
  }
  return {
    motifs: detect(MOTIFS, 'theme', episodes, text),
    people: detect(FIGURES, 'person', episodes, text),
  };
}

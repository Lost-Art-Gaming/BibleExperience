import type { EpisodeData, EpisodeMeta } from './types';
import type { IndexEntry } from './contentIndex';

export type ThreadCategory = 'Theme' | 'Prophecy' | 'Commandment' | 'Promise' | 'Judgment' | 'Worship' | 'Pattern';

/**
 * Curated Genesis throughlines. Auto-deriving connections from the structured
 * sections yields almost nothing (each episode introduces distinct themes,
 * people and citations), so the Tapestry weaves a hand-picked set of the
 * account's genuinely recurring threads. Each is detected ONLY where its
 * terms actually appear in an episode's prose — the connections are real and
 * verifiable in the text, not fabricated. Edit these lists to reshape the map.
 *
 * `category` is presentation metadata only. It lets the Tapestry distinguish
 * a prophecy or commandment from a broader theme without changing the
 * underlying connection model.
 */
export interface ThreadDef {
  id: string;
  label: string;
  category: ThreadCategory;
  terms: RegExp;
}

export const MOTIFS: ThreadDef[] = [
  { id: 'm-seed', label: 'The Promised Seed', category: 'Prophecy', terms: /\b(offspring|the seed|woman.?s seed|serpent.?s head)\b/ },
  { id: 'm-covenant', label: 'The Covenant', category: 'Promise', terms: /\bcovenant\b/ },
  { id: 'm-faith', label: 'Faith & Obedience', category: 'Theme', terms: /\b(faith|faithful|obey|obeyed|obedien|trusted?)\b/ },
  { id: 'm-sacrifice', label: 'Sacrifice & Blood', category: 'Worship', terms: /\b(sacrific|offering|altar|blood)\b/ },
  { id: 'm-judgment', label: 'Sin & Judgment', category: 'Judgment', terms: /\b(judgment|wicked|punish|condemn|guilt)\b/ },
  { id: 'm-sovereignty', label: "Jehovah's Sovereignty", category: 'Theme', terms: /\b(sovereign|creator|right to rule|almighty|supreme)\b/ },
  { id: 'm-flood', label: 'Judgment by Flood', category: 'Judgment', terms: /\b(flood|deluge|ark)\b/ },
  { id: 'm-blessing', label: 'Blessing', category: 'Promise', terms: /\bbless(ed|ing|es)?\b/ },
  { id: 'm-line', label: 'The Chosen Line', category: 'Promise', terms: /\b(genealog|descend|firstborn|generations|the line|son of)\b/ },
  { id: 'm-pride', label: 'Rebellion & Pride', category: 'Judgment', terms: /\b(rebel|pride|proud|tower|babel|scatter)\b/ },
  { id: 'm-rest', label: 'Sacred Rest', category: 'Pattern', terms: /\b(sabbath|seventh day|day of rest|rest day)\b/ },
  { id: 'm-life', label: 'Life & Blood', category: 'Commandment', terms: /\b(life.?blood|lifeblood|blood.*life|life.*blood|blood is sacred|sacred.*blood)\b/ },
  { id: 'm-purpose', label: 'Purpose for the Earth', category: 'Theme', terms: /\b(fill the earth|fruitful|care for (it|the earth)|subdue|earth.*purpose)\b/ },
];

export const FIGURES: ThreadDef[] = [
  { id: 'p-jehovah', label: 'Jehovah', category: 'Theme', terms: /\bjehovah\b/ },
  { id: 'p-adam', label: 'Adam', category: 'Theme', terms: /\badam\b/ },
  { id: 'p-eve', label: 'Eve', category: 'Theme', terms: /\beve\b/ },
  { id: 'p-serpent', label: 'The Serpent', category: 'Theme', terms: /\b(serpent|satan|the devil)\b/ },
  { id: 'p-cain', label: 'Cain & Abel', category: 'Theme', terms: /\b(cain|abel)\b/ },
  { id: 'p-noah', label: 'Noah', category: 'Theme', terms: /\bnoah\b/ },
  { id: 'p-abraham', label: 'Abraham', category: 'Theme', terms: /\b(abram|abraham)\b/ },
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
      detail: def.category,
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

/**
 * Turns an authored `data-ref` code (e.g. "ge3-15", "isa11", "jude14",
 * "1co15-45") into a readable citation and a link to the passage in the NWT
 * online reader (wol.jw.org). We link out rather than bundle copyrighted
 * scripture text.
 *
 * Code shape: `<book><n1>[-<n2>]` where book is a lowercase abbreviation
 * (may start with a digit, e.g. "1co"), n1 is the chapter (or, for
 * single-chapter books, the verse) and the optional n2 is the verse.
 */
const BOOKS: Record<string, string> = {
  ge: 'Genesis', ex: 'Exodus', le: 'Leviticus', jos: 'Joshua',
  ps: 'Psalms', pr: 'Proverbs', isa: 'Isaiah', eze: 'Ezekiel', zep: 'Zephaniah',
  mt: 'Matthew', lu: 'Luke', joh: 'John', ac: 'Acts', ro: 'Romans',
  '1co': '1 Corinthians', ga: 'Galatians', gal: 'Galatians', col: 'Colossians',
  '1ti': '1 Timothy', heb: 'Hebrews', jas: 'James',
  '1pe': '1 Peter', '2pe': '2 Peter', '1jo': '1 John', jude: 'Jude',
  re: 'Revelation',
};

export interface ParsedRef {
  book: string;
  /** Human citation, e.g. "Genesis 3:15", "Isaiah 11", "Jude 14". */
  label: string;
}

export function parseRef(code: string): ParsedRef | null {
  const m = /^(\d?[a-z]+)(\d+)(?:-(\d+))?$/.exec(code.trim().toLowerCase());
  if (!m) return null;
  const book = BOOKS[m[1]];
  if (!book) return null;
  const n1 = m[2];
  const n2 = m[3];
  const label = n2 ? `${book} ${n1}:${n2}` : `${book} ${n1}`;
  return { book, label };
}

const WOL = 'https://wol.jw.org/en/wol/l/r1/lp-e?q=';

/** NWT online-reader (wol.jw.org) search URL for the passage, or null. */
export function verseUrl(code: string): string | null {
  const parsed = parseRef(code);
  if (!parsed) return null;
  return `${WOL}${encodeURIComponent(parsed.label)}`;
}

/** Unique full book names known to the app (for detecting plain-text citations). */
export const BOOK_NAMES = [...new Set(Object.values(BOOKS))];

/** NWT reader URL for a plain-text citation like "Genesis 2:7" or "Hebrews 4". */
export function citationUrl(citation: string): string {
  return `${WOL}${encodeURIComponent(citation.trim())}`;
}

// Matches a plain-text scripture citation — a known book name followed by a
// chapter and optional verse(s): "Genesis 2:7", "Hebrews 4", "Genesis 2:2, 3".
// Longer names first so "1 John" wins over "John".
const CITATION_RE = new RegExp(
  `\\b(${BOOK_NAMES.slice().sort((a, b) => b.length - a.length).map((n) => n.replace(/ /g, '\\s+')).join('|')})\\s+\\d+(?::\\d+(?:\\s*[,–-]\\s*\\d+)*)?`,
  'g',
);

export interface CitationPart {
  text: string;
  url?: string;
}

/** Splits text into runs, marking plain-text scripture citations with a URL. */
export function splitCitations(text: string): CitationPart[] {
  const parts: CitationPart[] = [];
  let last = 0;
  for (const m of text.matchAll(CITATION_RE)) {
    const start = m.index ?? 0;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ text: m[0], url: citationUrl(m[0]) });
    last = start + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

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

/** NWT online-reader (wol.jw.org) search URL for the passage, or null. */
export function verseUrl(code: string): string | null {
  const parsed = parseRef(code);
  if (!parsed) return null;
  return `https://wol.jw.org/en/wol/l/r1/lp-e?q=${encodeURIComponent(parsed.label)}`;
}

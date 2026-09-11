// Legacy-compatible localStorage semantics, ported from the old app.js.
// Keys and value shapes must match exactly so existing user data keeps working.

const STORAGE = {
  bookmarks: 'be-bookmarks',
  theme: 'be-theme',
  highlights: 'be-highlights',
  notes: 'be-notes',
  lastRead: 'be-lastread',
} as const;

export type Theme = 'light' | 'dark';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full / unavailable — a lost highlight is not worth throwing */
  }
}

export function isDone(id: string): boolean {
  return localStorage.getItem(`be-episode-${id}`) === 'done';
}

export function setDone(id: string): void {
  localStorage.setItem(`be-episode-${id}`, 'done');
}

export function getBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE.bookmarks);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks: string[]): void {
  localStorage.setItem(STORAGE.bookmarks, JSON.stringify(bookmarks));
}

export function toggleBookmark(id: string): string[] {
  const bookmarks = getBookmarks();
  const index = bookmarks.indexOf(id);
  if (index >= 0) {
    bookmarks.splice(index, 1);
  } else {
    bookmarks.push(id);
  }
  saveBookmarks(bookmarks);
  return bookmarks;
}

export function getTheme(): Theme {
  return localStorage.getItem(STORAGE.theme) === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE.theme, theme);
}

export function cleanTitle(value = ''): string {
  return value.replace(/[“”]/g, '');
}

/* ---- Personal layer: highlights, notes, resume ---- */

/** Paragraph keys the reader has highlighted for an episode. */
export function getHighlights(episodeId: string): string[] {
  const all = readJson<Record<string, string[]>>(STORAGE.highlights, {});
  return Array.isArray(all[episodeId]) ? all[episodeId] : [];
}

export function toggleHighlight(episodeId: string, key: string): string[] {
  const all = readJson<Record<string, string[]>>(STORAGE.highlights, {});
  const keys = Array.isArray(all[episodeId]) ? all[episodeId] : [];
  const i = keys.indexOf(key);
  if (i >= 0) keys.splice(i, 1);
  else keys.push(key);
  all[episodeId] = keys;
  writeJson(STORAGE.highlights, all);
  return keys;
}

export function getNote(episodeId: string): string {
  const all = readJson<Record<string, string>>(STORAGE.notes, {});
  return typeof all[episodeId] === 'string' ? all[episodeId] : '';
}

export function setNote(episodeId: string, text: string): void {
  const all = readJson<Record<string, string>>(STORAGE.notes, {});
  if (text.trim()) all[episodeId] = text;
  else delete all[episodeId];
  writeJson(STORAGE.notes, all);
}

export interface LastRead {
  id: string;
  scrollY: number;
  at: number;
}

export function getLastRead(): LastRead | null {
  const v = readJson<LastRead | null>(STORAGE.lastRead, null);
  return v && typeof v.id === 'string' ? v : null;
}

export function setLastRead(id: string, scrollY: number): void {
  writeJson(STORAGE.lastRead, { id, scrollY, at: Date.now() });
}
